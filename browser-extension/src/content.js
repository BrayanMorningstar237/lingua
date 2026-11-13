/*
 * Langwa: content script.
 *
 * Reads the page, never changes it: no text, attribute, style or form value of the financial
 * service is modified. Everything is drawn in one isolated Shadow DOM layer:
 *   - Ctrl + hover card (translation below the element, 🔊, protected values, status)
 *   - reading panel (whole page, important messages first)
 *   - alerts for new errors / warnings / confirmations
 *   - subtitles under every element
 * Performance: one coalesced, idle-time rescan per burst of DOM changes; weak references to
 * page elements; bounded caches; listeners only on sites where the extension is enabled.
 */
(() => {
  'use strict';
  if (window.__langwa) return;

  // Extension APIs, or the standalone runtime when running as a userscript on phones. Only an
  // object with working runtime and storage counts: a page element with id="browser" shows up as
  // window.browser, and while the extension is being reloaded or updated Chrome hands a starting
  // script a cut-down chrome object without storage. Then this copy stays silent; the next page
  // load gets a working one.
  const api = [globalThis.LangwaRuntime, globalThis.browser, globalThis.chrome]
    .find(a => a && a.runtime && a.storage && a.storage.local && a.storage.onChanged);
  if (!api) return;
  window.__langwa = true;
  const P = globalThis.LangwaProtect;
  const E = globalThis.LangwaEngine;

  const SKIP = 'script,style,noscript,textarea,code,pre,svg,template,iframe,canvas,[contenteditable=""],[contenteditable="true"],langwa-root';
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const NEW_AFTER_MS = 1500;
  /** Texts already seen on this site during this session (survives language changes and restarts). */
  const seenTexts = new Set();
  const ALERT_KINDS = new Set(['error', 'warning', 'success']);

  const state = {
    active: false,
    settings: null,
    pack: null,
    engine: null,
    ui: new Map(),             // interface strings in the national language (glossary group "ui")
    units: [],                 // visible units, document order
    unitsByEl: new Map(),      // Element -> unit[] (current scan only)
    known: new WeakMap(),      // Element -> unit[] (weak: removed elements are garbage-collected)
    results: new Map(),        // text+literals -> Promise<result> (bounded LRU)
    literals: new Set(),       // values typed by the user during this page session (never stored)
    gen: 0,                    // start() generation, guards against overlapping restarts
    mtError: false,
    pending: 0,
    stats: { ms: 0, count: 0 },
    startedAt: 0,
    panelOpen: false,
    subtitles: false,
  };

  /** Interface text: national-language version when the speaker has translated it, else French. */
  const ui = (id, fr) => state.ui.get(id) || fr;
  /** Base interface language: the browser's (French or English), until the national language is translated. */
  const BASE = /^en/i.test(navigator.language || '') ? 'en' : 'fr';
  /** Interface strings: national-language translation, else French/English from the browser. */
  const uiMap = pack => new Map(pack.entries.filter(e => e.group === 'ui').map(e => [e.id, e.t || (BASE === 'en' ? e.en : e.fr)]));
  /** Phones and tablets: no Ctrl key, no hover -> long press shows the card. */
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  // ======================================================================================
  // UI layer
  // ======================================================================================
  let pageBtn = null;
  let assistant = null;
  let tabsBar = null;
  let tabCount = null;
  let views = {};
  /** Assistant first; the choice is remembered for the session. */
  function setTab(id) {
    state.tab = id;
    for (const [k, v] of Object.entries(views)) v.hidden = k !== id;
    if (tabsBar) for (const b of tabsBar.children) { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    if (id === 'list') renderPanel();
  }
  let panelVoice; // live voice line in the panel header (browser voice / natural voice 42 % / ready)
  let voiceFix;   // the choice shown when the natural voice is not on this computer
  let host, shadow, tip, tipBody, tipArrow, panel, panelList, panelStatus, toastBox, hl, subLayer, fab, fabDot, fabCount;

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }
  /** replaceChildren without empty slots: the browser would write a null child as the text "null". */
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));

  /*
   * Theme: warm ebony and ivory surfaces, kente gold accent, forest green for
   * validated/listen, terracotta for errors, indigo for information. A thin kente-stripe band
   * is the signature. All colours meet WCAG AA contrast on their surfaces.
   */
  const CSS = `
  :host { all: initial; display: block; position: fixed; inset: 0; z-index: 2147483644; width: 100vw; height: 100vh; height: 100dvh; pointer-events: none; }
  * { box-sizing: border-box; margin: 0; font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, Roboto, "Noto Sans", sans-serif; }
  button { cursor: pointer; font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
  svg.i { width: 1em; height: 1em; flex: none; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vertical-align: -.15em; }
  svg.i.fill { fill: currentColor; stroke: none; }

  .layer {
    position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
    --ebony: #1d1712; --ebony-2: #2a221b; --ebony-3: #3d3229; --ivory: #fbf6ee; --sand: #d9c9b4;
    --gold: #e3a21a; --gold-soft: #f6dfa6; --forest: #1e7a4c; --forest-2: #2f9e66; --terracotta: #c2502e; --indigo: #3d4a8a; --indigo-2: #8fa0e6;
    --card: #fffcf7; --card-fg: #241d16; --card-muted: #76675a; --line: #ebdfcd; --soft: #f6eee2;
    --kente: repeating-linear-gradient(90deg, #e3a21a 0 18px, #1e7a4c 18px 24px, #c2502e 24px 36px, #1d1712 36px 40px, #e3a21a 40px 46px, #3d4a8a 46px 52px);
  }
  @media (prefers-color-scheme: dark) {
    .layer { --card: #1f1913; --card-fg: #f6efe4; --card-muted: #b7a690; --line: #3a3027; --soft: #2a221b; }
  }

  /* ---------- hover card ---------- */
  .tip { position: fixed; z-index: 2147483647; width: max-content; max-width: min(440px, calc(100vw - 16px)); pointer-events: auto;
    min-width: min(290px, calc(100vw - 16px)); box-sizing: border-box;
    background: var(--ebony); color: var(--ivory); border-radius: 18px; padding: 16px 18px 14px;
    box-shadow: 0 24px 60px rgba(20,12,4,.42), 0 2px 8px rgba(20,12,4,.25), 0 0 0 1px rgba(255,240,220,.08);
    font-size: 15px; line-height: 1.4; visibility: hidden; opacity: 0; transform: translateY(4px);
    transition: opacity .14s ease, transform .14s ease, visibility 0s .14s; }
  .tip.show { visibility: visible; opacity: 1; transform: none; transition: opacity .14s ease, transform .14s ease; }
  .tip.passthru { pointer-events: none; }
  .arrow { position: absolute; width: 14px; height: 14px; background: var(--ebony); transform: rotate(45deg); top: -6px; border-radius: 3px; }
  .tip.above .arrow { top: auto; bottom: -6px; }
  .block + .block { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ebony-3); }
  .tr .i.kind { margin-right: 7px; }
  .tr .i.err { color: #ec8a6c; } .tr .i.warn { color: var(--gold); } .tr .i.okk { color: #6fd29d; }
  .tr.missing { font-size: 15px; font-weight: 600; color: var(--sand); }
  .row { display: flex; align-items: flex-start; gap: 14px; }
  .tr { flex: 1; min-width: 0; font-size: 19px; line-height: 1.3; font-weight: 700; letter-spacing: -.01em; overflow-wrap: break-word; padding-top: 6px; }
  .tr .i { color: var(--sand); margin-right: 6px; }
  .explain { display: flex; gap: 8px; margin-top: 10px; font-size: 14px; color: #efe3d1; }
  .explain .i { color: var(--gold); margin-top: 2px; }
  .orig { margin-top: 4px; font-size: 13.5px; color: var(--sand); opacity: .82; overflow-wrap: break-word; }
  .orig b { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-right: 8px; opacity: .6; }
  /* Footer: voice, protected values and validation status as one row of matching chips. */
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; padding-top: 11px;
    border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
  .meta:empty { display: none; }
  .chip { display: inline-flex; align-items: center; gap: 5px; height: 24px; box-sizing: border-box; font: 700 12px "Cascadia Mono", ui-monospace, Consolas, monospace;
    background: var(--gold-soft); color: #3b2604; padding: 0 8px; border-radius: 7px; }
  .chip .i { font-size: 12px; }
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 24px; box-sizing: border-box; font-size: 11.5px; font-weight: 650; padding: 0 10px 0 8px; border-radius: 999px; white-space: nowrap; }
  .pill.ok { background: rgba(47,158,102,.18); color: #7fd9a8; } .pill.mt { background: rgba(227,162,26,.18); color: #f3c460; }
  .pill.gist { background: rgba(143,160,230,.18); color: #b9c5f3; } .pill.block { background: rgba(194,80,46,.22); color: #f2a58d; }
  .pill.none { background: rgba(217,201,180,.14); color: var(--sand); }
  .skeleton { height: 18px; width: 220px; border-radius: 6px; background: linear-gradient(90deg, var(--ebony-2), var(--ebony-3), var(--ebony-2)); background-size: 200% 100%; animation: shimmer 1.1s linear infinite; }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }

  /* listen button */
  .say.wide { width: auto; height: 38px; padding: 0 15px 0 12px; display: inline-flex; gap: 7px; align-items: center; font-size: 17px; }
  .say .lbl { font-size: 13.5px; font-weight: 700; white-space: nowrap; }
  .bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 16px; }
  .bars i { width: 3px; height: 6px; border-radius: 2px; background: currentColor; animation: eq .8s ease-in-out infinite; }
  .bars i:nth-child(2) { animation-delay: .15s; } .bars i:nth-child(3) { animation-delay: .3s; }
  @keyframes eq { 50% { height: 16px; } }
  .voice { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px; color: var(--sand); opacity: .85; }
  /* Voice chip: who is speaking, live (local model, browser voice, human recording). */
  .vchip { --c: var(--sand); display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 24px; box-sizing: border-box; padding: 0 10px 0 8px;
    border-radius: 999px; font-size: 11.5px; font-weight: 650; line-height: 1; color: var(--c);
    background: color-mix(in srgb, var(--c) 13%, transparent); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    transition: color .2s ease, background .2s ease, border-color .2s ease; }
  .vchip .i { font-size: 13px; flex: none; }
  .vchip .vt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vchip .why { font-weight: 500; opacity: .8; }
  .vchip .dot { position: static; width: 7px; height: 7px; border: 0; box-shadow: none; border-radius: 50%; background: currentColor; flex: none; display: none; }
  .vchip.live .dot, .vchip.warm .dot { display: block; animation: pulse 1.1s ease-in-out infinite; }
  .vchip.warm .dot { color: var(--gold); }
  .pvoice { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 12px; font-weight: 600; color: var(--indigo-2); min-width: 0; }
  .pvoice svg { width: 13px; height: 13px; }
  .pvoice .vt { display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .pvoice .vt::first-letter { text-transform: uppercase; }
  .pvoice[data-s="ready"] { color: #7fd9a8; }
  .pvoice[data-s="notready"] { color: #f3c460; }
  .pvoice[data-s="online"] { color: #8fd3e6; }
  .vfix { margin: 0 14px 10px; padding: 12px; border-radius: 16px; background: var(--ebony-2); box-shadow: inset 0 0 0 1px var(--ebony-3); color: var(--ivory); display: grid; gap: 8px; animation: drop .2s ease; }
  .vfix[hidden] { display: none; }
  .vf-head { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .vf-x { border: 0; background: none; color: var(--sand); width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; }
  .vf-x:hover { background: var(--ebony-3); color: #fff; }
  .vf-opt { display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left; border: 0; border-radius: 12px; padding: 10px 12px; background: var(--ebony-3); color: var(--ivory); cursor: pointer; }
  .vf-opt .i { flex: none; font-size: 18px; margin-top: 2px; color: var(--gold); }
  .vf-opt b { display: block; font-size: 14px; } .vf-opt small { display: block; font-size: 12.5px; color: var(--sand); margin-top: 2px; }
  .vf-opt.primary { background: var(--forest); } .vf-opt.primary .i { color: #fff; } .vf-opt.primary small { color: #d8f2e3; }
  .vf-opt:hover { filter: brightness(1.08); }
  .vf-note { margin: 0; font-size: 12.5px; color: var(--sand); }
  .pv-setup { flex: none; border: 0; background: rgba(243,196,96,.16); color: #f3c460; font: 700 11.5px inherit; font-family: inherit; padding: 2px 8px; border-radius: 99px; cursor: pointer; }
  .pv-setup:hover { background: rgba(243,196,96,.3); }
  .pvoice[data-s="installing"], .pvoice[data-s="loading"] { color: var(--gold); }
  .vprog { flex: none; width: 48px; height: 5px; border-radius: 99px; overflow: hidden; background: color-mix(in srgb, currentColor 22%, transparent); }
  .vprog i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #7fe0ad, var(--gold)); transition: width 3s linear; }
  .vchip[data-src="local"], .vchip[data-src="wait"] { --c: #7fe0ad; }
  .vchip[data-src="browser"] { --c: var(--indigo-2); }
  .vchip[data-src="online"] { --c: #8fd3e6; }
  .vchip[data-src="human"] { --c: var(--gold); }
  .vchip[data-src="wait"] .i { animation: spin 1s linear infinite; }
  .item .vchip { --c: var(--card-muted); }
  .item .vchip[data-src="local"], .item .vchip[data-src="wait"] { --c: color-mix(in srgb, var(--forest) 75%, var(--card-fg)); }
  .item .vchip[data-src="browser"] { --c: color-mix(in srgb, var(--indigo) 70%, var(--card-fg)); }
  .item .vchip[data-src="human"] { --c: color-mix(in srgb, #b07a0a 80%, var(--card-fg)); }
  .voice .i { font-size: 13px; }
  .item .voice { color: var(--card-muted); }
  .say { flex: none; width: 42px; height: 42px; border-radius: 999px; border: 0; display: grid; grid-auto-flow: column; gap: 4px; place-items: center; place-content: center; overflow: hidden; font-size: 20px;
    background: var(--forest); color: #fff; box-shadow: 0 4px 14px rgba(30,122,76,.45); transition: transform .1s ease, background .15s ease; }
  .say:hover { transform: scale(1.06); background: var(--forest-2); }
  .say:active { transform: scale(.95); }
  /* Every control answers the touch: a quick press, a hover lift, a busy cursor when working. */
  .tab, .qchip, .mic, .sendq, .icon-btn, .lang-btn, .maction, .cyes, .cno { transition: transform .1s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease, opacity .15s ease; }
  .tab:active, .qchip:active, .mic:active, .sendq:active, .icon-btn:active, .lang-btn:active, .maction:active, .cyes:active, .cno:active, .fab:active { transform: scale(.95); }
  .qchip:hover { border-color: var(--gold); }
  .mic:hover, .sendq:hover { box-shadow: 0 4px 12px rgba(20,12,4,.18); }
  .icon-btn:hover { border-color: var(--gold); }
  .sendq:disabled, .qchip:disabled { opacity: .45; cursor: progress; transform: none; }
  [aria-busy="true"] { cursor: progress; }
  .mic.busy { background: var(--ebony-3); color: var(--ivory); animation: none; cursor: progress; }
  .mwait { display: inline-flex; align-items: center; gap: 10px; }
  .mwt { font-size: 13px; color: var(--card-muted); }
  .mhint { margin-top: 6px; font-size: 12px; color: var(--card-muted); display: flex; align-items: center; gap: 6px; }
  .mhint .i { font-size: 13px; }
  .say.on { background: var(--terracotta); animation: ring 1.2s ease-out infinite; }
  /* preparing: calm, no pulsing ring yet (the ring means "sound is playing") */
  .say.on[data-phase="prep"], .say.on[data-phase="slow"] { background: color-mix(in srgb, var(--forest) 72%, var(--ebony)); animation: none; cursor: progress; }
  .say.on[data-phase="slow"] .lbl { opacity: .9; }
  .say.fail { background: var(--terracotta); animation: shake .32s ease; }
  @keyframes shake { 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
  .say:disabled { background: var(--ebony-3); color: #9c8b78; box-shadow: none; cursor: not-allowed; transform: none; }
  @keyframes ring { from { box-shadow: 0 0 0 0 rgba(194,80,46,.55); } to { box-shadow: 0 0 0 12px rgba(194,80,46,0); } }

  .consent { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: var(--ebony-2); border: 1px solid var(--ebony-3); font-size: 13px; color: var(--sand); }
  .consent b { color: var(--ivory); }
  .cbtns { display: flex; gap: 8px; margin-top: 8px; }
  .cbtns button { border: 0; border-radius: 9px; padding: 7px 12px; font-weight: 700; font-size: 13px; }
  .cyes { background: var(--gold); color: var(--ebony); } .cno { background: transparent; color: var(--sand); box-shadow: inset 0 0 0 1px var(--ebony-3) !important; }
  .item .consent { background: var(--soft); border-color: var(--line); color: var(--card-muted); } .item .consent b { color: var(--card-fg); }
  /* ---------- tabs ---------- */
  .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px 12px; background: var(--card); border-bottom: 1px solid var(--line); }
  .tab { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 9px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--card-muted); font-weight: 700; font-size: 14px; }
  .tab .i { font-size: 17px; }
  .tab.on { background: var(--ebony); color: var(--ivory); } .tab.on .i { color: var(--gold); }
  .tcount { display: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 99px; background: var(--terracotta); color: #fff; font-size: 11.5px; font-weight: 800; place-items: center; }
  .tcount.show { display: inline-grid; }

  /* ---------- assistant chat ---------- */
  .chat { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .chat[hidden], .list[hidden] { display: none; }
  .log { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 14px 6px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
  .msg { max-width: 86%; padding: 10px 13px; border-radius: 16px; font-size: 15px; line-height: 1.45; overflow-wrap: anywhere; }
  .msg.me { align-self: flex-end; background: var(--ebony); color: var(--ivory); border-bottom-right-radius: 5px; }
  .msg.bot { align-self: flex-start; background: var(--soft); color: var(--card-fg); border: 1px solid var(--line); border-bottom-left-radius: 5px; }
  .mrow { display: flex; gap: 10px; align-items: flex-start; }
  .mtext { flex: 1; }
  .msg .say { width: 32px; height: 32px; font-size: 15px; box-shadow: none; }
  .mnote { margin-top: 6px; font-size: 11.5px; color: var(--card-muted); }
  .coverage-note { flex: none; margin: 8px 14px 0; border: 1px solid var(--line); border-radius: 10px; background: var(--soft); color: var(--card-muted); font-size: 12px; line-height: 1.4; }
  .coverage-note summary { display: flex; align-items: center; gap: 7px; padding: 5px 6px 5px 10px; cursor: pointer; list-style: none; font-weight: 600; }
  .coverage-note summary::-webkit-details-marker { display: none; }
  .coverage-note summary .i { flex: none; font-size: 13px; opacity: .8; }
  .coverage-note .cn-more { margin-left: auto; font-weight: 500; text-decoration: underline; text-underline-offset: 2px; opacity: .8; }
  .coverage-note[open] .cn-more { display: none; }
  .coverage-note[open] summary > span:nth-of-type(1) { flex: 1; }
  .coverage-note .cn-x { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: inherit; font-size: 13px; }
  .coverage-note .cn-x:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
  .coverage-note p { margin: 0; padding: 0 12px 9px 30px; }
  .maction { margin-top: 8px; border: 0; border-radius: 10px; padding: 7px 12px; background: var(--gold); color: var(--ebony); font-weight: 800; font-size: 13px; }
  .dots { display: inline-flex; gap: 4px; } .dots i { width: 6px; height: 6px; border-radius: 99px; background: var(--card-muted); animation: pulse 1s infinite; }
  .dots i:nth-child(2) { animation-delay: .2s; } .dots i:nth-child(3) { animation-delay: .4s; }
  .qchips { display: flex; gap: 8px; overflow-x: auto; padding: 8px 14px; scrollbar-width: none; }
  .qchips::-webkit-scrollbar { display: none; }
  .qchip { flex: none; border: 1px solid var(--line); background: var(--card); color: var(--card-fg); border-radius: 99px; padding: 8px 13px; font-size: 13.5px; font-weight: 600; }
  .qchip:hover { border-color: var(--gold); }
  .askrow { display: flex; gap: 8px; align-items: center; padding: 8px 12px 12px; }
  .askin { flex: 1; min-width: 0; height: 44px; border: 1px solid var(--line); border-radius: 22px; padding: 0 16px; font: inherit; font-size: 15px; background: var(--card); color: var(--card-fg); }
  .askin:focus { outline: 2px solid var(--gold); border-color: transparent; }
  .mic, .sendq { flex: none; width: 44px; height: 44px; border-radius: 99px; border: 0; display: grid; place-items: center; font-size: 19px; }
  .mic { background: var(--forest); color: #fff; }
  .mic.on { background: var(--terracotta); animation: ring 1.2s ease-out infinite; }
  .sendq { background: var(--ebony); color: var(--gold); }
  .item .say.wide { width: auto; height: 36px; padding: 0 12px 0 10px; }
  .list { overflow-x: hidden; }

  .words { margin-top: 10px; }
  .words .wl { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: .03em; color: var(--sand); margin-bottom: 6px; }
  .wchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .wchip { display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 9px; border-radius: 9px; background: var(--ebony-2); border: 1px solid var(--ebony-3); font-size: 13.5px; }
  .wchip b { font-weight: 700; color: var(--ivory); } .wchip i { font-style: normal; font-size: 11.5px; color: var(--sand); }
  .item .words .wl { color: var(--card-muted); }
  .item .wchip { background: var(--soft); border-color: var(--line); } .item .wchip b { color: var(--card-fg); } .item .wchip i { color: var(--card-muted); }

  /* ---------- floating button ---------- */
  .fab { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; display: flex; align-items: center; gap: 10px; pointer-events: auto;
    border: 0; border-radius: 999px; padding: 8px 18px 8px 8px; background: var(--ebony); color: var(--ivory); font-weight: 700; font-size: 15px;
    box-shadow: 0 12px 30px rgba(20,12,4,.38), 0 0 0 1px rgba(255,240,220,.08); transition: transform .12s ease, box-shadow .12s ease; }
  .fab:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(20,12,4,.42), 0 0 0 2px var(--gold); }
  .fab .logo { width: 34px; height: 34px; border-radius: 999px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 18px; position: relative; }
  .dot { position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border-radius: 99px; border: 2px solid var(--ebony); background: var(--forest-2); }
  .dot.busy { background: var(--ivory); animation: pulse 1s ease-in-out infinite; } .dot.warn { background: var(--terracotta); }
  @keyframes pulse { 50% { opacity: .3; } }
  .count { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 99px; background: var(--terracotta); color: #fff; font-size: 12px; font-weight: 800; display: none; place-items: center; }
  .count.show { display: grid; }

  /* ---------- panel ---------- */
  .panel { position: fixed; right: 18px; bottom: 82px; z-index: 2147483646; width: min(420px, calc(100vw - 36px)); max-height: min(72vh, 680px); max-height: min(72dvh, 680px);
    background: var(--card); color: var(--card-fg); border-radius: 20px; box-shadow: 0 24px 60px rgba(20,12,4,.32), 0 0 0 1px var(--line);
    display: flex; flex-direction: column; overflow: hidden; visibility: hidden; opacity: 0; transform: translateY(10px) scale(.98); transform-origin: bottom right; pointer-events: auto;
    transition: opacity .16s ease, transform .16s ease, visibility 0s .16s; }
  .panel.show { visibility: visible; opacity: 1; transform: none; transition: opacity .16s ease, transform .16s ease; }
  .panel { height: min(72vh, 680px); height: min(72dvh, 680px); }
  .band { height: 6px; background: var(--kente); flex: none; }
  /* Drag to move: the panel header and the floating button (they move together). */
  .ph { cursor: grab; touch-action: none; user-select: none; }
  .ph button, .ph select { cursor: pointer; }
  .fab { touch-action: none; }
  .layer.dragging .ph, .layer.dragging .fab { cursor: grabbing; }
  .layer.dragging .panel, .layer.dragging .fab { transition: none; }
  .layer.dragging .fab { transform: scale(1.03); box-shadow: 0 20px 40px rgba(20,12,4,.45), 0 0 0 2px var(--gold); }
  .ph { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px 16px; background: var(--ebony); color: var(--ivory); }
  .ph .logo { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 19px; flex: none; }
  .ph .title { flex: 1; min-width: 0; }
  .ph .lang { font-size: 17px; font-weight: 800; letter-spacing: .01em; }
  .lang-select { appearance: none; -webkit-appearance: none; border: 0; border-radius: 8px; padding: 2px 24px 2px 6px; margin-left: -6px; max-width: 100%;
    color: var(--ivory); cursor: pointer; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e3a21a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 4px center / 16px; }
  .lang-select:hover { background-color: var(--ebony-2); }
  .lang-select option { color: #241d16; background: #fffcf7; }
  .status { font-size: 12.5px; color: var(--sand); margin-top: 2px; display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .status span { display: inline-flex; align-items: center; gap: 4px; }
  .status .ok { color: #7fd9a8; } .status .mt { color: #f3c460; } .status .gist { color: #b9c5f3; } .status .block, .status .warn { color: #f2a58d; }
  .icon-btn { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--ebony-3); background: var(--ebony-2); color: var(--ivory); display: grid; place-items: center; font-size: 18px; }
  .icon-btn:hover { border-color: var(--gold); }
  .icon-btn.on { background: var(--gold); color: var(--ebony); border-color: var(--gold); }
  .list { overflow: auto; padding: 4px 16px 16px; overscroll-behavior: contain; }
  .sec { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: var(--card-muted); margin: 16px 2px 10px; }
  .sec .n { margin-left: auto; font-size: 11px; font-weight: 700; letter-spacing: 0; padding: 1px 8px; border-radius: 99px; background: var(--soft); color: var(--card-muted); }
  .sec.alert { color: var(--terracotta); }
  .sec.alert .n { background: color-mix(in srgb, var(--terracotta) 12%, var(--card)); color: var(--terracotta); }
  .item { display: block; width: 100%; text-align: left; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: var(--card); margin-bottom: 10px;
    box-shadow: 0 1px 2px rgba(36,29,22,.05); transition: border-color .12s ease, box-shadow .12s ease; }
  .item:hover { border-color: color-mix(in srgb, var(--gold) 55%, var(--line)); box-shadow: 0 6px 16px rgba(36,29,22,.08); }
  .item.k-error { border-color: color-mix(in srgb, var(--terracotta) 30%, var(--line)); background: color-mix(in srgb, var(--terracotta) 6%, var(--card)); }
  .item.k-warning { border-color: color-mix(in srgb, var(--gold) 40%, var(--line)); background: color-mix(in srgb, var(--gold) 8%, var(--card)); }
  .item .row { gap: 14px; }
  .item .tr { font-size: 16px; font-weight: 650; line-height: 1.45; color: var(--card-fg); }
  .item .tr.plain { font-weight: 500; }
  .item .tr .i { color: var(--card-muted); }
  .item .tr .i.err { color: var(--terracotta); } .item .tr .i.warn { color: #b57d00; } .item .tr .i.okk { color: var(--forest); }
  .item .orig { margin-top: 8px; font-size: 13px; line-height: 1.45; color: var(--card-muted); opacity: 1; }
  .item .explain { margin-top: 8px; color: var(--card-fg); } .item .explain .i { color: #b57d00; }
  .item .meta { margin-top: 12px; }
  .item .say { width: 38px; height: 38px; font-size: 18px; }
  .item .chip { background: var(--gold-soft); }
  .item .pill.ok { background: rgba(30,122,76,.12); color: var(--forest); } .item .pill.mt { background: rgba(227,162,26,.16); color: #8a5a00; }
  .item .pill.gist { background: rgba(61,74,138,.12); color: var(--indigo); } .item .pill.block { background: rgba(194,80,46,.14); color: #9b3517; }
  .item .pill.none { background: var(--soft); color: var(--card-muted); }
  .new { display: inline-block; vertical-align: 2px; font-size: 10.5px; font-weight: 800; letter-spacing: .06em; background: var(--terracotta); color: #fff; border-radius: 6px; padding: 2px 6px; margin-right: 8px; }
  .empty { display: grid; place-items: center; gap: 8px; text-align: center; color: var(--card-muted); padding: 32px 12px; font-size: 14px; }
  .empty .i { font-size: 34px; color: var(--gold); }
  .pf { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--card-muted); }
  kbd { font: 700 11.5px "Cascadia Mono", ui-monospace, Consolas, monospace; border: 1px solid var(--line); border-bottom-width: 3px; border-radius: 7px; padding: 2px 7px; background: var(--soft); color: var(--card-fg); }

  /* ---------- alerts ---------- */
  .toasts { position: fixed; left: 50%; transform: translateX(-50%); top: 16px; z-index: 2147483647; display: grid; gap: 10px; width: min(540px, calc(100vw - 24px)); pointer-events: auto; }
  .toast { position: relative; overflow: hidden; max-height: min(200px, 32dvh); background: var(--ebony); color: var(--ivory); border-radius: 16px; padding: 13px 14px 12px;
    box-shadow: 0 20px 50px rgba(20,12,4,.45); animation: drop .22s cubic-bezier(.2,.9,.3,1.2); }
  .toast::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: var(--kente); }
  .toast .toast-head { display: flex; align-items: center; gap: 8px; padding-right: 42px; font-size: 14px; }
  .toast .toast-head strong { overflow-wrap: anywhere; }
  .toast .toast-copy { margin-top: 7px; max-height: 4.4em; overflow: auto; font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
  .toast .toast-state { margin-top: 7px; color: var(--sand); font-size: 11.5px; line-height: 1.35; }
  .toast .toast-open { margin-top: 7px; min-height: 36px; padding: 6px 10px; border: 1px solid var(--ebony-3); border-radius: 9px; background: var(--ebony-2); color: var(--ivory); font-size: 12px; font-weight: 700; }
  .toast .x { position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border: 0; border-radius: 8px; background: transparent; color: var(--sand); font-size: 17px; display: grid; place-items: center; }
  .toast .x:hover { background: var(--ebony-3); color: #fff; }
  .toast .bar { position: absolute; left: 0; bottom: 0; height: 4px; background: var(--indigo-2); animation: shrink 10s linear forwards; }
  .toast.k-error .bar { background: var(--terracotta); } .toast.k-warning .bar { background: var(--gold); } .toast.k-success .bar { background: var(--forest-2); }
  .toast:hover .bar { animation-play-state: paused; }
  @keyframes drop { from { opacity: 0; transform: translateY(-12px) scale(.98); } }
  @keyframes shrink { from { width: 100%; } to { width: 0; } }

  /* ---------- page highlight, subtitles, first-run hint ---------- */
  .hl { display: none !important; }
  .subs { position: fixed; inset: 0; pointer-events: none; z-index: 2147483644; }
  .sub { position: fixed; padding: 0 2px; border-radius: 4px; box-sizing: border-box; overflow-wrap: normal; word-break: normal; hyphens: none;
    text-decoration: underline dotted rgba(227,162,26,.75); text-decoration-thickness: 1.5px; text-underline-offset: 3px; }

  .hint { position: fixed; right: 18px; bottom: 86px; z-index: 2147483647; width: min(330px, calc(100vw - 36px)); background: var(--ebony); color: var(--ivory); pointer-events: auto;
    border-radius: 18px; padding: 22px 18px 16px; box-shadow: 0 20px 50px rgba(20,12,4,.45); animation: drop .3s ease; overflow: visible; }
  .hint::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 18px 18px 0 0; background: var(--kente); }
  .hint::after { content: ""; position: absolute; right: 44px; bottom: -7px; width: 14px; height: 14px; background: var(--ebony); transform: rotate(45deg); border-radius: 3px; }
  .hint .demo { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 4px 0 12px; font-size: 24px; color: var(--sand); }
  .hint kbd { font-size: 15px; padding: 6px 12px; background: var(--ivory); color: var(--ebony); border-color: var(--sand); animation: press 1.6s ease-in-out infinite; }
  .hint .bubble { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--gold); color: var(--ebony); }
  @keyframes press { 40%, 60% { transform: translateY(2px); border-bottom-width: 1px; } }
  .hint .line { display: flex; align-items: center; gap: 10px; font-size: 14.5px; margin-top: 10px; }
  .hint .say { width: 32px; height: 32px; font-size: 16px; box-shadow: none; }
  .hint .ok { margin-top: 16px; width: 100%; border: 0; border-radius: 12px; padding: 11px; background: var(--gold); color: var(--ebony); font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .hint .ok:hover { filter: brightness(1.06); }
  /* ---------- first-use language chooser ---------- */
  .chooser { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; width: min(400px, calc(100vw - 24px)); max-height: calc(100vh - 36px); overflow: auto; pointer-events: auto;
    background: var(--ebony); color: var(--ivory); border-radius: 20px; padding: 24px 16px 12px; box-shadow: 0 24px 60px rgba(20,12,4,.45); animation: drop .3s ease; }
  .chooser::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 20px 20px 0 0; background: var(--kente); }
  .chooser[hidden], .fab[hidden] { display: none; }
  .chooser .head { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
  .chooser .logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 22px; flex: none; }
  .chooser h3 { font-size: 18px; font-weight: 800; }
  .chooser p { font-size: 13px; color: var(--sand); margin-top: 2px; }
  .langs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lang-btn { position: relative; display: grid; min-width: 0; gap: 4px; text-align: left; padding: 12px 12px 11px; border-radius: 14px; border: 1px solid var(--ebony-3); background: var(--ebony-2); transition: border-color .12s ease, transform .1s ease; }
  .lang-btn:hover { border-color: var(--gold); transform: translateY(-1px); }
  .lang-btn b { min-width: 0; font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
  .lang-btn small { min-width: 0; font-size: 11.5px; color: var(--sand); line-height: 1.35; overflow-wrap: anywhere; }
  .lang-btn { justify-items: start; align-content: start; }
  .lang-btn .soon { position: static; justify-self: start; max-width: 100%; font-size: 10px; font-weight: 800; letter-spacing: .035em; text-transform: uppercase; color: var(--gold); line-height: 1.35; overflow-wrap: anywhere; }
  /* guided tour: dimmed page, a ring around the control, a card beside it */
  .tour { position: fixed; inset: 0; z-index: 2147483646; pointer-events: auto; }
  .tip.intour { z-index: 2147483647; }
  .pf-guide { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: inherit; font: 600 12.5px inherit; font-family: inherit; padding: 4px 8px; border-radius: 8px; }
  .pf-guide:hover { background: var(--soft); color: var(--card-fg); }
  .pf-guide .i { font-size: 14px; }
  .tspot { position: fixed; border-radius: 14px; box-shadow: 0 0 0 200vmax rgba(15,10,6,.62), 0 0 0 3px var(--gold), 0 0 24px 6px rgba(227,162,26,.45);
    transition: left .32s cubic-bezier(.2,.8,.2,1), top .32s cubic-bezier(.2,.8,.2,1), width .32s cubic-bezier(.2,.8,.2,1), height .32s cubic-bezier(.2,.8,.2,1);
    pointer-events: none; animation: tglow 2.2s ease-in-out infinite; }
  @keyframes tglow { 50% { box-shadow: 0 0 0 200vmax rgba(15,10,6,.62), 0 0 0 3px var(--gold), 0 0 36px 12px rgba(227,162,26,.62); } }
  .tcontent.fwd { animation: tinR .3s cubic-bezier(.2,.8,.2,1); } .tcontent.bwd { animation: tinL .3s cubic-bezier(.2,.8,.2,1); }
  @keyframes tinR { from { opacity: 0; transform: translateX(14px); } } @keyframes tinL { from { opacity: 0; transform: translateX(-14px); } }
  .tdone { width: 44px; height: 44px; border-radius: 99px; display: grid; place-items: center; margin-bottom: 10px; background: var(--forest-2); color: #fff; font-size: 22px; animation: tpop .45s cubic-bezier(.2,1.4,.4,1); }
  .tdone[hidden] { display: none; }
  @keyframes tpop { from { opacity: 0; transform: scale(.4); } 70% { transform: scale(1.12); } }
  .tour.nospot { background: rgba(15,10,6,.62); } .tour.nospot .tspot { display: none; }
  .tcard { position: fixed; width: min(360px, calc(100vw - 24px)); background: var(--ebony); color: var(--ivory); border-radius: 18px; padding: 16px 18px 14px;
    box-shadow: 0 24px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(255,240,220,.1); transition: left .28s ease, top .28s ease; animation: drop .25s ease; }
  .tcard::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; border-radius: 18px 18px 0 0; background: var(--kente); }
  .thead { display: flex; align-items: center; gap: 10px; margin: 4px 0 10px; }
  .tstep { font-size: 12px; font-weight: 800; color: var(--gold); font-variant-numeric: tabular-nums; }
  .tdots { display: flex; gap: 4px; }
  .tdots i { width: 6px; height: 6px; border-radius: 99px; background: var(--ebony-3); transition: background .25s ease, width .25s ease; }
  .tdots i.on { background: color-mix(in srgb, var(--gold) 55%, var(--ebony-3)); }
  .tdots i.cur { width: 18px; background: var(--gold); }
  .tskip { margin-left: auto; border: 0; background: none; color: var(--sand); font-size: 13px; padding: 4px 6px; border-radius: 8px; text-decoration: underline; text-underline-offset: 3px; }
  .tskip:hover { color: #fff; background: var(--ebony-2); }
  .tcard h4 { font-size: 18px; font-weight: 800; line-height: 1.3; margin: 0 0 6px; }
  .tcard p { font-size: 14.5px; line-height: 1.5; color: #efe3d1; margin: 0; }
  .tbtns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .tacts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .tacts[hidden] { display: none; }
  .tact { border: 0; border-radius: 10px; padding: 8px 12px; font-size: 13.5px; font-weight: 700; background: var(--ebony-2); color: var(--ivory); box-shadow: inset 0 0 0 1px var(--ebony-3); cursor: pointer; }
  .tact:hover { background: var(--ebony-3); }
  .tact.primary { background: var(--forest); box-shadow: none; }
  .tact.on { background: var(--terracotta); box-shadow: none; }
  .tback, .tnext { border: 0; border-radius: 12px; padding: 10px 16px; font-size: 14.5px; font-weight: 700; transition: transform .1s ease, filter .15s ease, background .15s ease; }
  .tback:active, .tnext:active, .tskip:active { transform: scale(.95); }
  .tback { background: var(--ebony-2); color: var(--ivory); box-shadow: inset 0 0 0 1px var(--ebony-3); }
  .tnext { background: var(--gold); color: var(--ebony); min-width: 112px; }
  .tback:hover { background: var(--ebony-3); } .tnext:hover { filter: brightness(1.06); }
  @media (max-width: 640px) {
    .tcard { left: 0 !important; right: 0; bottom: 0; top: auto !important; width: 100vw; border-radius: 22px 22px 0 0; padding: 18px 18px max(16px, env(safe-area-inset-bottom)); }
    .tcard::before { border-radius: 22px 22px 0 0; }
    .tcard.top { top: 0 !important; bottom: auto; border-radius: 0 0 22px 22px; padding-top: max(18px, env(safe-area-inset-top)); }
    .tcard.top::before { top: auto; bottom: 0; border-radius: 0 0 22px 22px; }
    .tbtns .tnext { flex: 1; }
  }
  .lsearch-wrap { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; padding: 0 12px; height: 42px; border-radius: 12px;
    border: 1px solid var(--ebony-3); background: var(--ebony-2); color: var(--sand); transition: border-color .12s ease, box-shadow .12s ease; }
  .lsearch-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold) 25%, transparent); }
  .lsearch-wrap .i { flex: none; font-size: 16px; }
  .lsearch { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--ivory); font: inherit; font-size: 14.5px; }
  .lsearch::placeholder { color: var(--sand); opacity: .7; }
  .lang-btn[hidden], .nolang[hidden] { display: none; }
  .nolang { margin: 4px 2px 0; font-size: 13px; color: var(--sand); text-align: center; padding: 14px 8px; border: 1px dashed var(--ebony-3); border-radius: 12px; }
  .lang-btn .cov { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 2px; font-size: 11px; font-weight: 800; color: #7fd9a8; font-variant-numeric: tabular-nums; }
  .lang-btn .covbar { flex: 1; height: 5px; border-radius: 99px; background: var(--ebony-3); overflow: hidden; }
  .lang-btn .covbar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--forest-2), #7fd9a8); }
  .lang-btn.unavail b { opacity: .82; } .lang-btn.unavail small { opacity: .7; }
  .chooser .later { display: block; margin: 10px auto 0; border: 0; background: none; color: var(--sand); font-size: 13px; padding: 6px 10px; border-radius: 8px; }
  .chooser .later:hover { color: #fff; background: var(--ebony-2); }

  /* ---------- phones: bottom sheet, larger touch targets ---------- */
  @media (max-width: 640px) {
    .panel { left: 0; right: auto; bottom: 0; width: 100vw; min-width: 100vw; max-width: 100vw; height: min(82vh, 760px); height: min(82dvh, 760px); max-height: calc(100vh - env(safe-area-inset-top) - 8px); max-height: calc(100dvh - env(safe-area-inset-top) - 8px); border-radius: 22px 22px 0 0; transform-origin: bottom center; }
    .panel .band { border-radius: 22px 22px 0 0; }
    .fab { right: 12px; bottom: 12px; padding: 8px 16px 8px 8px; }
    .fab.hidden-under-sheet { opacity: 0; pointer-events: none; }
    .panel.show ~ .fab { display: none; } /* the sheet has its own close button */
    .ph { gap: 8px; padding: 10px 10px 9px 12px; }
    .ph .title { overflow: hidden; }
    .ph .status { font-size: 11.5px; }
    .ph .lang, .lang-select { font-size: 16px; }
    .tabs { padding: 7px 10px; }
    .tab { min-height: 44px; }
    .log { padding: 12px 12px 6px; }
    .msg { max-width: 92%; font-size: 15px; }
    .qchips { padding: 8px 12px; }
    .qchip { min-height: 40px; }
    .askrow { padding: 8px 12px max(12px, env(safe-area-inset-bottom)); }
    .askin { font-size: 16px; }
    .tip { max-width: calc(100vw - 16px); }
    .tr { font-size: 18px; }
    .icon-btn { width: 44px; height: 44px; }
    .say { width: 46px; height: 46px; }
    .toasts { top: max(8px, env(safe-area-inset-top)); width: calc(100vw - 16px); }
    .hint { right: 12px; bottom: 76px; }
    .chooser { left: 0; right: auto; bottom: 0; width: 100vw; max-width: 100vw; max-height: calc(100vh - env(safe-area-inset-top)); max-height: calc(100dvh - env(safe-area-inset-top)); border-radius: 22px 22px 0 0; padding: 22px 14px max(18px, env(safe-area-inset-bottom)); overscroll-behavior: contain; }
    .lang-btn { min-height: 68px; padding: 12px; }
    .chooser .later { min-height: 44px; }
  }
  @media (max-width: 360px) {
    .ph .logo { width: 34px; height: 34px; }
    .ph .lang, .lang-select { font-size: 15px; }
    .tabs { gap: 4px; padding-inline: 8px; }
    .tab { gap: 6px; padding-inline: 6px; font-size: 13px; }
    .chooser { padding-inline: 12px; }
    .langs { gap: 7px; }
    .lang-btn { padding-inline: 10px; }
  }
  @media (max-width: 640px) and (max-height: 500px) {
    .panel { height: calc(100vh - env(safe-area-inset-top)); height: calc(100dvh - env(safe-area-inset-top)); }
    .ph { padding-block: 6px; }
    .tabs { padding-block: 4px; }
    .log { padding-block: 7px 3px; }
    .chooser { max-height: calc(100vh - env(safe-area-inset-top)); max-height: calc(100dvh - env(safe-area-inset-top)); }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  `;

  // Line icons (Lucide-style, ISC licence), static markup only.
  const ICONS = {
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" class="f"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    auto: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m5 5 14 14"/>',
    dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    captions: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15h4M14 15h3M7 11h3M13 11h4"/>',
    languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    pointer: '<path d="M4 4l7 17 2.5-7.5L21 11 4 4z"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15 14c.2-1 .7-1.7 1.5-2.5A6 6 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bubble: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/>',
    ok: '<path d="M20 6 9 17l-5-5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  };
  function icon(name, extra = '') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', `i ${extra}`.trim());
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[name].replace(' class="f"', ' fill="currentColor" stroke="none"');
    return s;
  }

  /** Keep Chrome/Edge/Firefox page translators away from Langwa's own layer. */
  function makeHost() {
    host = document.createElement('langwa-root');
    host.setAttribute('translate', 'no');
    host.classList.add('notranslate');
  }

  function buildUI() {
    makeHost();
    shadow = host.attachShadow({ mode: 'open' });
    const layer = h('div', { class: 'layer notranslate', translate: 'no' });
    layerEl = layer;
    shadow.append(h('style', {}, CSS), layer);

    tipArrow = h('div', { class: 'arrow' });
    tipBody = h('div');
    tip = h('div', { class: 'tip', role: 'tooltip' }, tipArrow, tipBody);
    tip.addEventListener('mouseenter', () => clearTimeout(tipTimer));
    tip.addEventListener('mouseleave', hideTipSoon);

    hl = h('div', { class: 'hl' });
    subLayer = h('div', { class: 'subs' });
    toastBox = h('div', { class: 'toasts', 'aria-live': 'assertive' });

    panelStatus = h('div', { class: 'status' });
    panelVoice = h('div', { class: 'pvoice', role: 'status' });
    panelList = h('div', { class: 'list' });
    pageBtn = h('button', { class: `icon-btn${state.subtitles ? ' on' : ''}`, title: `${ui('ui_page_mode', 'Traduire la page')} (Alt+Shift+T)`, 'aria-label': ui('ui_page_mode', 'Traduire la page') }, icon('languages'));
    pageBtn.addEventListener('click', () => setSubtitles(!state.subtitles, true));
    const readBtn = h('button', { class: 'icon-btn', 'data-tour': 'read', title: `${ui('ui_read_all', 'Tout lire')} (Alt+Shift+L)`, 'aria-label': ui('ui_read_all', 'Tout lire') }, icon('volume'));
    readBtn.addEventListener('click', () => readAll(readBtn));
    const ccBtn = h('span', { style: 'display:flex;gap:8px' }, pageBtn, readBtn);
    // Two tabs: Assistant (ask about the page, by text or voice) and Messages (translated page).
    assistant = globalThis.LangwaAssistant.create({ h, icon, ui, state, send, player, voiceOpts, shownText, setLight, api, sayButton });
    const chatView = assistant.mount();
    tabCount = h('span', { class: 'tcount' });
    const tabBtn = (id, ic, label, extra) => h('button', { class: 'tab', role: 'tab', 'data-tab': id, onclick: () => setTab(id) }, icon(ic), h('span', {}, label), extra || null);
    tabsBar = h('div', { class: 'tabs', role: 'tablist' },
      tabBtn('chat', 'bubble', ui('ui_tab_chat', 'Assistant')),
      tabBtn('list', 'list', ui('ui_tab_msgs', 'Messages'), tabCount));
    views = { chat: chatView, list: panelList };
    panel = h('div', { class: 'panel', role: 'dialog', 'aria-label': `Langwa, ${state.pack.name}` },
      h('div', { class: 'band' }),
      h('div', { class: 'ph', title: ui('ui_drag_hint', 'Glisser pour déplacer · double-clic pour replacer') },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', { class: 'title' }, langPicker(), panelStatus, panelVoice),
        ccBtn,
        h('button', { class: 'icon-btn', title: ui('ui_close', 'Fermer'), 'aria-label': ui('ui_close', 'Fermer'), onclick: () => togglePanel(false) }, icon('x'))),
      voiceFix = h('div', { class: 'vfix', hidden: true }),
      tabsBar,
      chatView,
      panelList,
      h('div', { class: 'pf' }, ...(isTouch
        ? [icon('pointer'), ui('ui_hint_touch_short', 'appui long = traduction')]
        : [h('kbd', {}, 'Ctrl'), '+', icon('pointer'), ui('ui_hint_hover_short', 'survol = traduction')]),
        h('button', { class: 'pf-guide', type: 'button', title: ui('tour_replay', 'Revoir le guide'), onclick: () => startTour() }, icon('help'), ui('tour_guide', 'Guide'))));

    fabDot = h('span', { class: 'dot busy' });
    fabCount = h('span', { class: 'count' });
    fab = h('button', { class: 'fab', title: `Alt+Shift+M · ${ui('ui_drag_hint', 'Glisser pour déplacer · double-clic pour replacer')}`, 'aria-label': `Langwa, ${state.pack.name}`, onclick: () => { if (Date.now() - lastDragEnd > 350) togglePanel(); } },
      h('span', { class: 'logo' }, icon('languages'), fabDot), state.pack.name, fabCount);

    layer.append(subLayer, hl, tip, panel, fab, toastBox);
    document.documentElement.append(host);
    draggable(panel.querySelector('.ph'));
    draggable(fab);
    panel.querySelector('.ph').addEventListener('dblclick', e => {
      if (e.target.closest('button, select')) return;
      dock = { ...DOCK_HOME }; placeDock(); saveDock();
    });
    try {
      api.storage.local.get('dock').then(r => { if (r && r.dock) dock = { ...DOCK_HOME, ...r.dock }; placeDock(); }).catch(() => placeDock());
    } catch { placeDock(); }
  }

  // ---------------- move the panel and its button anywhere on screen ----------------
  // dock = distance of the floating button from the right and bottom edges. The panel follows
  // the button: above it when there is room, else below, always fully on screen. On phones the
  // panel stays a bottom sheet; only the button moves.
  const DOCK_HOME = { right: 18, bottom: 18 };
  let dock = { ...DOCK_HOME }, layerEl = null, lastDragEnd = 0;
  const isPhone = () => innerWidth <= 640;
  const saveDock = () => { try { api.storage.local.set({ dock }); } catch { /* not critical */ } };
  function placeDock() {
    if (!fab || !panel) return;
    const m = 8, fw = fab.offsetWidth || 160, fh = fab.offsetHeight || 50;
    dock.right = Math.round(Math.min(Math.max(dock.right, m), Math.max(m, innerWidth - fw - m)));
    dock.bottom = Math.round(Math.min(Math.max(dock.bottom, m), Math.max(m, innerHeight - fh - m)));
    fab.style.right = `${dock.right}px`;
    fab.style.bottom = `${dock.bottom}px`;
    if (isPhone()) { panel.style.right = panel.style.top = panel.style.bottom = panel.style.transformOrigin = ''; return; }
    const pw = panel.offsetWidth, ph = panel.offsetHeight;
    panel.style.right = `${Math.min(Math.max(dock.right, m), Math.max(m, innerWidth - pw - m))}px`;
    const fabTop = innerHeight - dock.bottom - fh, aboveTop = fabTop - 10 - ph, belowTop = innerHeight - dock.bottom + 10;
    const top = aboveTop >= m ? aboveTop : belowTop + ph <= innerHeight - m ? belowTop : Math.max(m, innerHeight - ph - m);
    panel.style.top = `${top}px`;
    panel.style.bottom = 'auto';
    panel.style.transformOrigin = top > fabTop ? 'top right' : 'bottom right';
  }
  addEventListener('resize', () => placeDock());
  /** Pointer drag (mouse, pen, touch). Under 6 px it is still a click. */
  function draggable(handle) {
    let st = null;
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (handle !== fab && e.target.closest('button, select, input, textarea, a, label')) return;
      if (handle !== fab && isPhone()) return; // the bottom sheet does not move
      st = { x: e.clientX, y: e.clientY, r: dock.right, b: dock.bottom, id: e.pointerId, moved: false };
    });
    handle.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) < 6) return;
      if (!st.moved) { st.moved = true; try { handle.setPointerCapture(e.pointerId); } catch { /* ok */ } layerEl.classList.add('dragging'); hideTipSoon(); }
      dock.right = st.r - dx;
      dock.bottom = st.b - dy;
      placeDock();
      e.preventDefault();
    });
    const end = () => {
      if (!st) return;
      if (st.moved) { lastDragEnd = Date.now(); layerEl.classList.remove('dragging'); saveDock(); }
      st = null;
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /** Language switcher in the panel header (the only way to switch on phones). */
  // Languages, most complete first: translated share, then automatic drafts, then by name.
  const rankLangs = langs => Object.entries(langs || {}).sort(([, a], [, b]) =>
    (b.count || 0) - (a.count || 0) || (b.machineTranslation ? 1 : 0) - (a.machineTranslation ? 1 : 0) || a.name.localeCompare(b.name));
  const coverageText = l => (l.count ? `${l.pct ?? 0} %` : l.machineTranslation
    ? (BASE === 'en' ? 'Automatic draft' : 'Brouillon automatique') : ui('ui_soon', BASE === 'en' ? 'Soon' : 'Bientôt'));
  const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ'’ʼ]/g, '').toLowerCase();

  function langPicker() {
    const langs = rankLangs(state.langs);
    if (langs.length < 2) return h('div', { class: 'lang' }, state.pack.name);
    const sel = h('select', { class: 'lang lang-select', 'aria-label': ui('ui_language', 'Langue') },
      langs.map(([code, l]) => {
        const o = h('option', { value: code }, code === state.pack.code ? l.name : `${l.name} · ${coverageText(l)}`);
        o.selected = code === state.pack.code;
        return o;
      }));
    sel.addEventListener('change', async () => {
      const cur = await send({ type: 'getSettings' });
      await api.storage.local.set({ settings: { ...cur, lang: sel.value } });
    });
    return sel;
  }

  /**
   * First use: "Which language do you speak?" with large buttons showing each language's own
   * name and region (people recognise the name of their language even if they cannot read
   * French). Languages without translations yet are marked "Soon". "Later" folds it into the
   * round button.
   */
  function buildChooser() {
    makeHost();
    shadow = host.attachShadow({ mode: 'open' });
    const layer = h('div', { class: 'layer notranslate', translate: 'no' });
    shadow.append(h('style', {}, CSS), layer);

    const choose = async code => {
      const cur = await send({ type: 'getSettings' });
      await api.storage.local.set({ settings: { ...cur, lang: code } }); // storage change restarts Langwa
    };
    const langs = rankLangs(state.langs);
    // Search: names, other names, regions, towns; accents and apostrophes ignored. Filtering only
    // shows or hides the buttons already built, so it answers on every keystroke.
    const buttons = langs.map(([code, l]) => {
      const meter = l.count
        ? h('span', { class: 'cov' }, h('span', { class: 'covbar', 'aria-hidden': 'true' }, h('i', { style: `width:${l.pct ?? 0}%` })), h('span', {}, coverageText(l)))
        : h('span', { class: 'soon' }, coverageText(l));
      const b = h('button', {
        class: `lang-btn${l.count || l.machineTranslation ? '' : ' unavail'}`, onclick: () => choose(code),
        title: l.count ? `${l.count} / ${l.total} ${BASE === 'en' ? 'phrases translated' : 'phrases traduites'}${l.verified ? ` · ${l.verified} ${BASE === 'en' ? 'validated by a speaker' : 'validées par un locuteur'}` : ''}` : '',
      }, h('b', {}, l.name), h('small', {}, l.region || ''), meter);
      b.dataset.q = fold(`${code} ${l.name} ${l.region || ''} ${l.search || ''}`);
      return b;
    });
    const none = h('p', { class: 'nolang', hidden: true }, BASE === 'en' ? 'No language found. Try another name or a town.' : 'Aucune langue trouvée. Essayez un autre nom ou une ville.');
    const search = h('input', { type: 'search', class: 'lsearch', placeholder: BASE === 'en' ? 'Search: Pidgin, Fulani, Bamiléké, Kumbo…' : 'Rechercher : pidgin, peul, bamiléké, Kumbo…', 'aria-label': BASE === 'en' ? 'Search a language' : 'Rechercher une langue', autocomplete: 'off', spellcheck: 'false' });
    search.addEventListener('input', () => {
      const words = fold(search.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const b of buttons) { const ok = words.every(w => b.dataset.q.includes(w)); b.hidden = !ok; shown += ok; }
      none.hidden = shown > 0;
    });
    search.addEventListener('keydown', e => {
      e.stopPropagation(); // typing never triggers page shortcuts
      if (e.key === 'Enter') { const first = buttons.find(b => !b.hidden); if (first) first.click(); }
    });
    const card = h('div', { class: 'chooser', role: 'dialog', 'aria-label': ui('ui_choose', 'Quelle langue parlez-vous ?') },
      h('div', { class: 'head' },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', {}, h('h3', {}, ui('ui_choose', 'Quelle langue parlez-vous ?')), h('p', {}, ui('ui_choose_sub', 'Langwa affichera la banque dans cette langue.')))),
      h('label', { class: 'lsearch-wrap' }, icon('search'), search),
      h('div', { class: 'langs' }, buttons),
      none,
      h('button', { class: 'later', onclick: () => { card.hidden = true; fab.hidden = false; } }, ui('ui_later', 'Plus tard')));
    const fab = h('button', { class: 'fab', hidden: true, 'aria-label': ui('ui_choose', 'Quelle langue parlez-vous ?'), onclick: () => { card.hidden = false; fab.hidden = true; } },
      h('span', { class: 'logo' }, icon('languages')), 'Langwa');
    layer.append(card, fab);
    document.documentElement.append(host);
  }

  function destroyUI() {
    if (host) host.remove();
    host = null;
    tipUnits = null;
  }

  // ======================================================================================
  // Rendering helpers
  // ======================================================================================
  const STATUS = {
    ok: ['ok', 'check', 'ui_validated', 'Validé'],
    mt: ['mt', 'auto', 'ui_auto', 'Non validé'],
    gist: ['gist', 'info', 'ui_summary', 'Résumé sûr'],
    block: ['block', 'ban', 'ui_blocked', 'Bloqué : montant différent'],
    none: ['none', 'dots', 'ui_missing', 'Pas encore traduit'],
  };
  function statusKey(r) {
    if (r.status === 'ok') return r.verified ? 'ok' : 'mt';
    if (r.status === 'gist') return r.verified ? 'gist' : 'mt';
    if (r.status === 'blocked') return 'block';
    return 'none';
  }
  function pillFor(r) {
    if (r.status === 'gist' && !r.verified) {
      return h('span', { class: 'pill mt' }, icon('alert'), ui('ui_draft_summary', BASE === 'en' ? 'Unvalidated summary' : 'R\u00e9sum\u00e9 non valid\u00e9'));
    }
    const [cls, ic, id, fr] = STATUS[statusKey(r)];
    return h('span', { class: `pill ${cls}` }, icon(ic), ui(id, fr));
  }

  function chipsFor(text) {
    const ents = P.extract(P.normSpaces(text), { literals: [...state.literals] });
    return ents.map(e => h('span', { class: 'chip', title: ui('ui_protected', 'Valeur protégée') }, icon('lock'), e.value));
  }

  // ---------------- listening (human recordings + exact values) ----------------
  const player = globalThis.LangwaSpeech.createPlayer({
    online: () => !!(state.settings && state.settings.onlineVoice),
    language: () => (state.pack ? { voices: state.pack.voices, reading: state.pack.reading } : {}),
    tts: text => send({ type: 'tts', lang: state.pack.code, text }).catch(() => null),
  });
  const ttsOn = () => {
    const mode = state.settings && state.settings.tts && state.settings.tts.mode;
    return !!(state.pack && ((mode === 'mms' && state.pack.mms) || (mode === 'africa' && state.pack.africaTts)
      || (mode === 'auto' && state.localVoice && state.pack.africaTts)));
  };
  /** Automatic voice: learn whether the local voice server runs (cheap, cached by the background). */
  async function refreshVoice() {
    if (!state.active || document.hidden) return;
    const v = await send({ type: 'voiceStatus' }).catch(() => null);
    const was = state.localVoice;
    state.localVoice = !!(v && v.ready);
    // Installing or starting: the cards show it live, checked every 3 s until the voice is ready.
    state.voice = v && !v.ready && v.info ? v.info : null;
    const key = `${state.localVoice}|${state.voice ? `${state.voice.status}${Math.round(state.voice.progress * 100)}` : ''}`;
    if (key !== state.voiceKey || was !== state.localVoice) { state.voiceKey = key; refreshChips(); }
    clearTimeout(state.voiceTimer);
    if (state.voice) state.voiceTimer = setTimeout(refreshVoice, 3000);
  }
  /**
   * Panel header: which voice reads, live, for the assistant and the translations alike.
   * Built again only when the state changes; while installing only the numbers move.
   */
  function renderPanelVoice() {
    if (!panelVoice) return;
    const mode = state.settings && state.settings.tts && state.settings.tts.mode;
    panelVoice.hidden = mode === 'none';
    const natural = !!(state.pack && state.pack.africaTts) && mode !== 'mms';
    const v = natural && !state.localVoice ? state.voice : null;
    const s = natural && state.localVoice ? 'ready' : v ? v.status : 'browser';
    const pct = v ? Math.max(1, Math.round((v.progress || 0) * 100)) : 0;
    // The natural voice is the default; when it is not running yet, say so and offer the two ways
    // to get a natural voice: online now (Microsoft/Google), or the offline one on this computer.
    const notReady = s === 'browser' && natural;
    const onlineNow = notReady && onlineOn();
    const label = s === 'ready' ? `✓ ${ui('ui_voice_natural', 'Voix naturelle')}`
      : s === 'installing' ? `${ui('ui_voice_natural', 'Voix naturelle')} · ${pct} %`
        : s === 'loading' ? ui('ui_voice_starting', 'voix naturelle, démarrage…')
          : onlineNow ? ui('ui_voice_online_short', 'Voix en ligne')
            : notReady ? ui('ui_voice_not_ready', 'Voix pas prête') : voiceName('synthetic');
    const eta = v && v.etaSec != null ? (v.etaSec < 60 ? ' · <1 min' : ` · ~${Math.round(v.etaSec / 60)} min`) : '';
    if (s === 'installing' && panelVoice.dataset.s === 'installing') {
      panelVoice.querySelector('.vt').textContent = label + eta;
      panelVoice.querySelector('.vprog i').style.width = `${pct}%`;
      return;
    }
    panelVoice.dataset.s = onlineNow ? 'online' : notReady ? 'notready' : s;
    panelVoice.setAttribute('aria-live', s === 'installing' ? 'off' : 'polite');
    let prog = null;
    if (s === 'installing') { const i = h('i'); i.style.width = `${pct}%`; prog = h('span', { class: 'vprog', 'aria-hidden': 'true' }, i); }
    const ic = onlineNow ? icon('cloud') : s === 'ready' ? icon('cpu') : s === 'loading' ? icon('loader', 'spin') : s === 'installing' ? icon('loader', 'spin') : icon('monitor');
    const setup = notReady ? h('button', { class: 'pv-setup', type: 'button', 'aria-expanded': String(!!voiceFix && !voiceFix.hidden), onclick: () => toggleVoiceFix() }, ui('ui_voice_choose', 'Choisir')) : null;
    if (!notReady && voiceFix) voiceFix.hidden = true;
    panelVoice.replaceChildren(ic, h('span', { class: 'vt' }, label + eta), ...(prog ? [prog] : []), ...(setup ? [setup] : []));
    panelVoice.title = s === 'browser' && natural
      ? ui('ui_voice_hint', 'Voix du navigateur. Pour une voix plus naturelle, lancez « Start Langwa voice » sur cet ordinateur.')
      : panelVoice.textContent;
  }

  /** An online natural voice (Microsoft in Edge, Google in Chrome) exists for this language. */
  function onlineVoiceAvailable() {
    const L = globalThis.LangwaSpeech;
    if (!L || !L.pickVoice) return false;
    const prefs = [...((state.pack && state.pack.voices) || []).map(x => x.toLowerCase()), 'en', 'fr'];
    const on = L.pickVoice(prefs, true);
    return !!on && on.localService === false;
  }
  const onlineOn = () => !!(state.settings && state.settings.onlineVoice) && onlineVoiceAvailable();
  const idleSrc = () => (onlineOn() ? 'online' : 'browser');

  /** The two ways to a natural voice when it is not on this computer: online now, or offline. */
  function toggleVoiceFix(force) {
    if (!voiceFix) return;
    const open = force ?? voiceFix.hidden;
    voiceFix.hidden = !open;
    const btn = panelVoice && panelVoice.querySelector('.pv-setup');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const on = !!(state.settings && state.settings.onlineVoice);
    const opt = (ic, title, sub, onclick, cls = '') => h('button', { class: `vf-opt ${cls}`, type: 'button', onclick }, icon(ic), h('span', {}, h('b', {}, title), h('small', {}, sub)));
    const done = () => { toggleVoiceFix(false); renderPanelVoice(); refreshChips(); };
    voiceFix.replaceChildren(
      h('div', { class: 'vf-head' }, h('b', {}, ui('ui_vfix_title', 'Une voix plus naturelle')),
        h('button', { class: 'vf-x', type: 'button', 'aria-label': ui('ui_close', 'Fermer'), onclick: () => toggleVoiceFix(false) }, icon('x'))),
      onlineVoiceAvailable()
        ? (on
          ? opt('cloud', ui('ui_vfix_stop', 'Arrêter la voix en ligne'), ui('ui_vfix_stop_sub', 'Revenir à la voix intégrée de cet appareil.'), () => { setLight({ onlineVoice: false }); done(); })
          : opt('cloud', ui('ui_vfix_online', 'Utiliser la voix naturelle en ligne'), ui('ui_vfix_online_sub', 'Tout de suite. Le texte lu est envoyé à Microsoft ou Google.'), () => { setLight({ onlineVoice: true }); done(); }, 'primary'))
        : h('p', { class: 'vf-note' }, ui('ui_vfix_no_online', 'Ce navigateur n’a pas de voix en ligne. Edge en propose de très naturelles.')),
      opt('cpu', ui('ui_vfix_offline', 'Installer la voix naturelle hors ligne'), ui('ui_vfix_offline_sub', 'Privée, sur cet ordinateur. Environ 700 Mo, une seule fois.'), () => { send({ type: 'openOptions' }); toggleVoiceFix(false); }));
  }
  /** Idle voice chips follow the local voice: progress while it installs, then "Local voice". */
  function refreshChips() {
    renderPanelVoice();
    if (!shadow) return;
    for (const chip of shadow.querySelectorAll('.vchip:not(.live)')) {
      if (/^(browser|local|online)$/.test(chip.dataset.src)) setChip(chip, ttsOn() ? 'local' : idleSrc());
    }
  }
  setInterval(refreshVoice, 20000);
  document.addEventListener('visibilitychange', refreshVoice);

  const bars = () => h('span', { class: 'bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  const voiceName = v => (v === 'human' ? ui('ui_voice_human', 'Voix humaine') : v === 'neural' ? ui('ui_voice_local', 'Voix locale') : ui('ui_voice_browser', 'Voix du navigateur'));
  /** Name of the local model in use, shown next to "Voix locale". */
  const modelName = () => { const m = state.settings && state.settings.tts && state.settings.tts.mode; return m === 'africa' || m === 'auto' ? 'Africa TTS' : m === 'mms' ? 'MMS' : ''; };
  const WHY = {
    offline: ['ui_voice_why_offline', 'voix locale éteinte'],
    loading: ['ui_voice_why_loading', 'voix locale en chargement'],
    slow: ['ui_voice_why_slow', 'voix locale trop lente'],
    error: ['ui_voice_why_error', 'voix locale indisponible'],
    none: ['ui_voice_why_none', 'aucune voix sur cet appareil'],
  };
  const SRC = {
    local: ['cpu', () => ui('ui_voice_natural', 'Voix naturelle')], // model name in the tooltip
    wait: ['loader', () => ui('ui_voice_preparing', 'Voix locale, préparation…')],
    browser: ['monitor', () => voiceName('synthetic')],
    online: ['cloud', () => ui('ui_voice_online', 'Voix naturelle en ligne')],
    human: ['user', () => voiceName('human')],
  };
  /**
   * The voice chip under a translation. Before playing it says which voice is planned; while
   * playing it shows, live, who really speaks, and why the browser voice took over if it did.
   */
  function voiceChip(steps) {
    if (!steps) return null;
    const chip = h('div', { class: 'vchip', role: 'status', 'aria-live': 'polite' });
    setChip(chip, steps.voice === 'neural' ? 'local' : steps.voice === 'human' ? 'human' : idleSrc());
    return chip;
  }
  function setChip(chip, src, why, live = false) {
    const [ic, text] = SRC[src] || SRC.browser;
    // Browser voice for now, natural voice on its way: say so, with its progress.
    const v = src === 'browser' && !why && !live && state.voice && state.pack && state.pack.africaTts ? state.voice : null;
    const installing = !!v && v.status === 'installing';
    const pct = v ? Math.max(1, Math.round((v.progress || 0) * 100)) : 0;
    const note = !v ? '' : installing ? ` · ${ui('ui_voice_installing', 'voix naturelle')} ${pct} %` : ` · ${ui('ui_voice_starting', 'voix naturelle, démarrage…')}`;
    const bar = chip.querySelector('.vprog i');
    if (installing && bar && chip.dataset.src === src) { // update in place, so the bar glides
      bar.style.width = `${pct}%`;
      chip.querySelector('.why').textContent = note;
      chip.title = chip.textContent;
      return;
    }
    chip.dataset.src = src;
    chip.classList.toggle('live', live && src !== 'wait');
    chip.classList.toggle('warm', !!v);
    chip.setAttribute('aria-live', v ? 'off' : 'polite'); // no announcement every 3 s
    const w = why && WHY[why];
    const extra = w ? ` · ${ui(w[0], w[1])}` : note;
    let prog = null;
    if (installing) { const i = h('i'); i.style.width = `${pct}%`; prog = h('span', { class: 'vprog', 'aria-hidden': 'true' }, i); }
    chip.replaceChildren(h('span', { class: 'dot' }), icon(ic), h('span', { class: 'vt' }, text(), extra ? h('span', { class: 'why' }, extra) : null), ...(prog ? [prog] : []));
    chip.title = src === 'local' && modelName() ? `${chip.textContent} · ${modelName()}` : chip.textContent;
  }
  const chipFor = b => { const host = b && (b.closest('.block') || b.closest('.item') || b.closest('.tip')); return host && host.querySelector('.vchip'); };

  /** One tap to listen, tap again to stop. Shows which voice will speak (human or synthetic). */
  function sayButton(steps, label, { compact = false } = {}) {
    if (!steps) return null;
    const idle = () => [icon('volume'), compact ? null : h('span', { class: 'lbl' }, label)];
    const b = h('button', { class: `say${compact ? '' : ' wide'}`, title: `${label} · ${voiceName(steps.voice)}`, 'aria-label': label }, ...idle());
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (b.classList.contains('on')) { player.stop(); if (!player.isPlaying()) { b.classList.remove('on'); fill(b, ...idle()); } return; }
      if (askOnlineVoice(b, () => speak(steps, b, idle))) return;
      speak(steps, b, idle);
    });
    return b;
  }
  /**
   * No good voice installed on the device (only online ones): ask once, in the card, whether to
   * use the natural online voices. One tap turns them on and plays; nothing is sent without it.
   */
  let askedOnline = false;
  function askOnlineVoice(b, then) {
    if (askedOnline || (state.settings && state.settings.onlineVoice)) return false;
    if (ttsOn()) return false; // the offline natural voice is running: never offer to send text online
    const L = globalThis.LangwaSpeech;
    const prefs = [...((state.pack && state.pack.voices) || []).map(x => x.toLowerCase()), 'sw', 'fr'];
    const local = L.pickVoice(prefs, false);
    if (local && /natural|neural|premium|enhanced/i.test(local.name)) return false; // already a natural voice on the device
    if (!L.pickVoice(prefs, true)) return false;                                       // no online voice either
    askedOnline = true;
    const card = b.closest('.block') || b.parentElement;
    const bar = h('div', { class: 'consent' },
      h('div', {}, h('b', {}, ui('ui_online_ask', 'Voix plus naturelle ?')), ' ', ui('ui_online_voice_sub', 'Plus fluide. Le texte lu est envoyé à Microsoft ou Google.')),
      h('div', { class: 'cbtns' },
        h('button', { class: 'cyes', onclick: e => { e.stopPropagation(); bar.remove(); setLight({ onlineVoice: true }); then(); } }, ui('ui_enable', 'Activer')),
        h('button', { class: 'cno', onclick: e => { e.stopPropagation(); bar.remove(); then(); } }, ui('ui_no_thanks', 'Non merci'))));
    card.append(bar);
    return true;
  }

  /** Settings that do not need Langwa to restart (voice, reading): saved without rebuilding the UI. */
  const LIGHT_SETTINGS = ['onlineVoice', 'autoRead', 'pageMode'];
  function setLight(patch) {
    state.settings = { ...state.settings, ...patch };
    send({ type: 'getSettings' }).then(cur => api.storage.local.set({ settings: { ...cur, ...patch } })).catch(() => {});
  }

  /** Plays steps, animating the button that started it (if any). */
  /**
   * Plays steps and keeps the user informed at every moment, on the button that started it:
   * preparing (spinner, "Préparation…", "Encore un instant…" after 4 s), playing (bars,
   * "Arrêter"), and a short, clear failure state when nothing could be heard.
   */
  async function speak(planned, b, idle) {
    if (!planned) return;
    const wide = b && !compact(b);
    const label = text => (wide ? h('span', { class: 'lbl' }, text) : null);
    const phase = (name, text) => {
      if (!b) return;
      b.dataset.phase = name;
      b.setAttribute('aria-busy', String(name !== 'play'));
      b.setAttribute('aria-label', text);
      b.title = text;
      fill(b, name === 'play' ? bars() : icon('loader', 'spin'), label(text));
    };
    if (b) b.classList.add('on');
    phase('prep', ui('ui_preparing', 'Préparation…'));
    let playing = false;
    const slow = setTimeout(() => { if (!playing) phase('slow', ui('ui_still_preparing', 'Encore un instant…')); }, 4000);
    // The voice is decided now, not when the card or chat bubble was drawn: the local voice
    // may have started (or stopped) since. The check is cached, so this takes milliseconds.
    if (state.settings && state.settings.tts && state.settings.tts.mode === 'auto') await refreshVoice();
    const steps = (planned.raw && player.prepare(planned.raw, voiceOpts())) || planned;
    if (b && !b.classList.contains('on')) { clearTimeout(slow); return; } // stopped while checking
    const chip = chipFor(b);
    player.play(steps,
      endInfo => {
        clearTimeout(slow);
        if (chip) chip.classList.remove('live');
        if (!b) return;
        b.classList.remove('on');
        delete b.dataset.phase;
        b.removeAttribute('aria-busy');
        b.setAttribute('aria-label', listenLabel());
        fill(b, ...idle());
        if (endInfo && !endInfo.spoke && !endInfo.stopped) noVoice(b, chip, idle, wide);
      },
      (src, why) => {
        if (src === 'local') state.localVoice = true;
        if (why === 'offline' || why === 'loading') state.localVoice = false;
        if (chip) setChip(chip, src, why, true);
        if (src === 'wait') { if (!playing) phase(b && b.dataset.phase === 'slow' ? 'slow' : 'prep', b && b.dataset.phase === 'slow' ? ui('ui_still_preparing', 'Encore un instant…') : ui('ui_voice_preparing', 'Voix locale, préparation…')); return; }
        playing = true;
        clearTimeout(slow);
        phase('play', ui('ui_stop', 'Arrêter'));
        if (b) b.title = `${ui('ui_stop', 'Arrêter')} · ${(SRC[src] || SRC.browser)[1]()}`;
      });
  }
  /** Nothing could be heard (no voice on this device, audio blocked): say it, briefly. */
  function noVoice(b, chip, idle, wide) {
    const text = ui('ui_no_voice', 'Aucune voix disponible sur cet appareil');
    b.classList.add('fail');
    b.setAttribute('aria-label', text);
    b.title = text;
    fill(b, icon('mute'), wide ? h('span', { class: 'lbl' }, ui('ui_no_voice_short', 'Pas de voix')) : null);
    if (chip) setChip(chip, 'browser', 'none');
    setTimeout(() => { if (b.classList.contains('fail')) { b.classList.remove('fail'); b.setAttribute('aria-label', listenLabel()); fill(b, ...idle()); } }, 2800);
  }
  const compact = b => !b.classList.contains('wide');
  const listenLabel = () => ui('ui_listen', 'Écouter');
  const voiceOpts = () => ({ tts: ttsOn(), approx: !state.settings || state.settings.voiceFallback !== false });
  const stepsFor = r => (r && (r.status === 'ok' || r.status === 'gist') ? player.prepare(r.speech, voiceOpts()) : null);

  function shownText(u) {
    const r = u.result;
    return r && (r.status === 'ok' || r.status === 'gist') ? r.text : u.text;
  }

  /** One card block, used by the hover card, the panel and the alerts. */
  /** "Mots du dictionnaire": open-source words for a sentence that has no translation yet. */
  function wordsRow(r) {
    if (!r || !r.words || !r.words.length) return null;
    return h('div', { class: 'words' },
      h('div', { class: 'wl' }, icon('book'), ui('ui_dict_words', 'Mots du dictionnaire (non validés)')),
      h('div', { class: 'wchips' }, r.words.map(w => h('span', { class: 'wchip' }, h('b', {}, w.term), h('i', {}, w.src)))));
  }

  function block(u, { isNew = false, inPanel = false } = {}) {
    const r = u.result;
    if (!r) {
      return h('div', { class: 'block k-pending' },
        h('div', { class: 'skeleton', 'aria-label': ui('ui_translating', 'Traduction en cours…') }),
        h('div', { class: 'orig' }, u.text));
    }
    if (r.value) {
      return h('div', { class: 'block k-value' },
        h('div', { class: 'row' },
          h('div', { class: 'tr' }, icon('lock'), u.text),
          sayButton([{ value: u.text, type: r.brand ? 'name' : undefined }], listenLabel())),
        h('div', { class: 'meta' }, h('span', { class: 'pill none' }, r.brand
          ? ui('ui_brand', 'Nom propre, non traduit')
          : ui('ui_protected', 'Valeur protégée, identique à la page'))));
    }
    const shown = r.status === 'ok' || r.status === 'gist';
    const kindIcon = r.kind === 'error' ? icon('alert', 'kind err') : r.kind === 'warning' ? icon('alert', 'kind warn') : r.kind === 'success' ? icon('check', 'kind okk') : null;
    const newTag = isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null;
    if (!shown && inPanel) {
      // Panel list: the original sentence stays readable, with a quiet "not translated" tag.
      return h('div', { class: `block k-${r.kind || 'info'}` },
        h('div', { class: 'row' }, h('div', { class: 'tr plain' }, newTag, kindIcon, u.text)),
        wordsRow(r),
        h('div', { class: 'meta' }, chipsFor(u.text), r.status === 'blocked' ? pillFor(r) : h('span', { class: 'pill none' }, icon('dots'), ui('ui_missing', 'Pas encore traduit'))));
    }
    const missing = ui('ui_missing_lang', 'Pas encore traduit en {lang}').replace('{lang}', state.pack.name);
    return h('div', { class: `block k-${r.kind || 'info'}` },
      h('div', { class: 'row' },
        shown
          ? h('div', { class: 'tr' }, isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null, kindIcon, shownText(u))
          : h('div', { class: 'tr missing' }, isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null, kindIcon, missing),
        (r.status === 'ok' || r.status === 'gist') ? sayButton(stepsFor(r), listenLabel()) : null),
      // Original right under the translation (they read as a pair), then help, then one footer
      // row with the voice and the validation status.
      shown && shownText(u).trim() === u.text.trim() ? null : h('div', { class: 'orig' }, h('b', {}, ui('ui_original', 'Original')), u.text),
      r.explain ? h('div', { class: 'explain' }, icon('bulb'), h('span', {}, r.explain)) : null,
      shown ? null : wordsRow(r),
      h('div', { class: 'meta' }, shown ? voiceChip(stepsFor(r)) : null, chipsFor(u.text), shown || r.status === 'blocked' ? pillFor(r) : null));
  }

  // ======================================================================================
  // Hover card
  // ======================================================================================
  let tipTimer = null;
  let tipUnits = null;
  let tipAnchor = null;

  function showTip(units, anchor) {
    // Prefer translatable text; show the "protected value" card only when that is all there is.
    const text = units.filter(u => !u.result || !u.result.value);
    const list = text.length ? text : units.slice(0, 1);
    if (!list.length) return;
    clearTimeout(tipTimer);
    tipUnits = units;
    tipAnchor = anchor;
    tipBody.replaceChildren(...list.map(u => block(u)));
    tip.classList.add('show');
    place(anchor);
    autoReadSoon(list);
  }

  // Automatic reading: the card is read aloud as soon as it opens (settle 350 ms first).
  let autoTimer = null;
  let autoKey = '';
  function autoReadSoon(list) {
    clearTimeout(autoTimer);
    if (!state.settings || !state.settings.autoRead) return;
    const u = list.find(x => x.result && !x.result.value && stepsFor(x.result));
    if (!u) return;
    const key = u.text;
    if (key === autoKey && player.isPlaying()) return;
    autoTimer = setTimeout(() => {
      if (!tip.classList.contains('show') || !tipUnits || !tipUnits.includes(u)) return;
      autoKey = key;
      const b = tip.querySelector('.say');
      speak(stepsFor(u.result), b, () => [icon('volume'), h('span', { class: 'lbl' }, listenLabel())]);
    }, 350);
  }

  /** Reads the whole page aloud: important messages first, then the page in order. */
  let readingAll = false;
  async function readAll(btn) {
    if (readingAll) { readingAll = false; player.stop(); return; }
    const shown = state.units.filter(u => u.result && !u.result.value && stepsFor(u.result));
    const alerts = shown.filter(u => u.result.kind === 'error' || u.result.kind === 'warning');
    const queue = [...alerts, ...shown.filter(u => !alerts.includes(u))];
    if (!queue.length) return;
    readingAll = true;
    if (btn) btn.classList.add('on');
    for (const u of queue) {
      if (!readingAll) break;
      highlight(u.el, true);
      if (u.el.scrollIntoView) u.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await new Promise(res => player.play(stepsFor(u.result), res));
      await new Promise(res => setTimeout(res, 250));
    }
    readingAll = false;
    highlight(null);
    if (btn) btn.classList.remove('on');
  }

  function place(anchor) {
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let top = a.bottom + 12;
    const above = top + t.height > innerHeight - 8 && a.top - t.height - 12 > 8;
    if (above) top = a.top - t.height - 12;
    top = Math.max(8, Math.min(top, innerHeight - t.height - 8));
    const left = Math.min(Math.max(8, a.left), innerWidth - t.width - 8);
    tip.classList.toggle('above', above);
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    const ax = Math.min(Math.max(a.left + Math.min(a.width, 160) / 2 - left - 7, 14), t.width - 28);
    tipArrow.style.left = `${ax}px`;
  }

  function hideTipSoon() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { if (tip) tip.classList.remove('show'); tipUnits = null; }, 220);
  }

  function unitsAt(target) {
    for (let el = target; el && el !== document.documentElement; el = el.parentElement) {
      const us = state.unitsByEl.get(el);
      if (us && us.length) return { el, us };
    }
    return null;
  }

  // Hover modes: 'ctrl' (hold Ctrl/Cmd and point at any text, paragraph or button),
  // 'always' (any hover), 'off'. The card opens just below the element.
  let lastTarget = null;
  let lastShownFor = null;
  const hoverMode = () => (state.settings && state.settings.hover) || 'ctrl';
  const modKey = e => e.ctrlKey || e.metaKey;
  const fromLayer = e => host && e.composedPath().includes(host);

  function showFor(target) {
    const hit = unitsAt(target);
    if (!hit) { hideTipSoon(); highlight(null); return; }
    showTip(hit.us, hit.el);
    highlight(hit.el);
  }

  // While Ctrl is held the card lets the mouse through (keep exploring); release Ctrl to click 🔊.
  const setPassThrough = on => tip && tip.classList.toggle('passthru', on);

  function onOver(e) {
    if (fromLayer(e)) return;
    lastTarget = e.target;
    const mode = hoverMode();
    if (mode === 'off') return;
    if (mode === 'ctrl' && !modKey(e)) { hideTipSoon(); highlight(null); return; }
    showFor(e.target);
  }

  function onMove(e) {
    if (hoverMode() !== 'ctrl') return;
    setPassThrough(modKey(e));
    if (!modKey(e) || fromLayer(e)) return;
    lastTarget = e.target;
    if (e.target === lastShownFor && tip.classList.contains('show')) return;
    lastShownFor = e.target;
    showFor(e.target);
  }

  function onModKey(e) {
    // Ctrl + Space while a card is showing: listen to it (again = stop). Only then, so
    // Ctrl + Space keeps its usual meaning everywhere else.
    if (e.type === 'keydown' && e.code === 'Space' && (e.ctrlKey || e.metaKey) && tip && tip.classList.contains('show') && tipUnits) {
      e.preventDefault();
      e.stopPropagation();
      if (player.isPlaying()) { player.stop(); return; }
      const u = tipUnits.find(x => x.result && stepsFor(x.result));
      if (u) speak(stepsFor(u.result), tip.querySelector('.say'), () => [icon('volume'), h('span', { class: 'lbl' }, listenLabel())]);
      return;
    }
    if (hoverMode() !== 'ctrl' || (e.key !== 'Control' && e.key !== 'Meta')) return;
    setPassThrough(e.type === 'keydown');
    if (e.type === 'keydown' && lastTarget && !e.repeat) showFor(lastTarget);
    if (e.type === 'keyup') highlight(null);
  }

  // Touch: a long press (450 ms, finger still) shows the card under the element. The click
  // that follows a long press is cancelled, so a bank button is never activated by it.
  // Normal taps are untouched.
  let pressTimer = null;
  let pressXY = null;
  let swallowClick = false;
  function onTouchStart(e) {
    if (fromLayer(e)) return;
    if (tip && tip.classList.contains('show')) hideTipSoon();
    if (hoverMode() === 'off' || e.touches.length !== 1) return;
    const t = e.touches[0];
    const target = e.target;
    pressXY = [t.clientX, t.clientY];
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      if (!unitsAt(target)) return;
      swallowClick = true;
      showFor(target);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 450);
  }
  function onTouchMove(e) {
    if (!pressTimer || !pressXY) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - pressXY[0], t.clientY - pressXY[1]) > 10) { clearTimeout(pressTimer); pressTimer = null; }
  }
  function onTouchEnd(e) {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (swallowClick && !fromLayer(e)) { e.preventDefault(); setTimeout(() => { swallowClick = false; }, 450); }
  }
  function onClickCapture(e) {
    if (swallowClick && !fromLayer(e)) { e.preventDefault(); e.stopPropagation(); swallowClick = false; }
  }
  function onContextMenu(e) {
    if ((swallowClick || pressTimer) && !fromLayer(e)) e.preventDefault();
  }

  function onFocus(e) {
    if (hoverMode() === 'off' || fromLayer(e)) return;
    const el = e.target;
    const us = [...(state.unitsByEl.get(el) || [])];
    if (el.labels) for (const l of el.labels) us.push(...(state.unitsByEl.get(l) || []));
    if (us.length) showTip(us, el);
  }

  // ======================================================================================
  // Panel, status, highlight, subtitles, alerts, first-run hint
  // ======================================================================================
  function togglePanel(force) {
    state.panelOpen = force ?? !state.panelOpen;
    if (state.panelOpen) clearToasts();
    panel.classList.toggle('show', state.panelOpen);
    if (state.panelOpen) placeDock();
    fab.classList.toggle('hidden-under-sheet', state.panelOpen && innerWidth <= 640);
    if (state.panelOpen) { setTab(state.tab || 'chat'); hideHint(); refreshVoice(); }
  }

  let panelTimer = null;
  function renderPanelSoon() {
    if (panelTimer) return;
    panelTimer = setTimeout(() => {
      panelTimer = null;
      updateStatus();
      if (state.panelOpen) renderPanel();
      if (state.subtitles) placeSubtitles();
    }, 120);
  }

  function itemFor(u) {
    const item = h('button', {
      class: `item k-${(u.result && u.result.kind) || 'info'}`,
      onmouseenter: () => highlight(u.el),
      onmouseleave: () => highlight(null),
      onclick: () => {
        u.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => highlight(u.el, true), 350);
      },
    }, block(u, { isNew: u.isNew, inPanel: true }));
    return item;
  }

  function renderPanel() {
    const shown = state.units.filter(u => !u.result || !u.result.value);
    const alerts = shown.filter(u => u.result && (u.result.kind === 'error' || u.result.kind === 'warning'));
    const rest = shown.filter(u => !alerts.includes(u));
    const scroll = panelList.scrollTop;
    panelList.replaceChildren(
      ...(alerts.length ? [h('div', { class: 'sec alert' }, icon('alert'), ui('ui_important', 'Messages importants'), h('span', { class: 'n' }, String(alerts.length))), ...alerts.map(itemFor)] : []),
      ...(rest.length ? [h('div', { class: 'sec' }, ui('ui_page', 'Sur cette page'), h('span', { class: 'n' }, String(rest.length))), ...rest.map(itemFor)] : []),
      ...(!shown.length ? [h('div', { class: 'empty' }, icon('languages'), ui('ui_empty', 'Rien à traduire ici'))] : []));
    panelList.scrollTop = scroll;
  }

  const COUNT_WORDS = {
    ok: ['ui_n_ok', 'validées'], mt: ['ui_n_mt', 'non validées'], gist: ['ui_n_gist', 'résumés'],
    block: ['ui_n_block', 'bloquées'], none: ['ui_n_none', 'non traduites'],
  };

  function updateStatus() {
    if (!host) return;
    const c = { ok: 0, mt: 0, gist: 0, block: 0, none: 0 };
    let pending = 0;
    let alerts = 0;
    for (const u of state.units) {
      const r = u.result;
      if (!r) { pending++; continue; }
      if (r.value) continue;
      c[statusKey(r)]++;
      if (r.kind === 'error' || r.kind === 'warning') alerts++;
    }
    state.pending = pending;
    fabDot.className = `dot${pending ? ' busy' : state.mtError ? ' warn' : ''}`;
    fabCount.textContent = alerts;
    if (tabCount) { tabCount.textContent = alerts ? String(alerts) : ''; tabCount.classList.toggle('show', alerts > 0); }
    fabCount.classList.toggle('show', alerts > 0);
    const bits = [];
    if (pending) bits.push(h('span', {}, icon('loader', 'spin'), ui('ui_translating', 'Traduction en cours…')));
    for (const k of ['ok', 'mt', 'gist', 'block', 'none']) {
      if (!c[k]) continue;
      const [cls, ic, id, fr] = STATUS[k];
      const [wid, word] = COUNT_WORDS[k];
      const label = c[k] === 1 ? ui(`${wid}_one`, ui(wid, word)) : ui(wid, word);
      bits.push(h('span', { class: cls, title: ui(id, fr) }, icon(ic), `${c[k]} ${label}`));
    }
    if (state.mtError) bits.push(h('span', { class: 'warn' }, icon('alert'), ui('ui_mt_down', 'Traduction locale indisponible : résumé utilisé')));
    panelStatus.replaceChildren(...bits);
    panelStatus.title = `${state.stats.count} éléments · analyse ${state.stats.ms} ms`;
  }

  function highlight(el, pulse = false) {
    if (!hl) return;
    if (!el) { hl.style.display = 'none'; hl.classList.remove('pulse'); return; }
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, { display: 'block', top: `${r.top - 5}px`, left: `${r.left - 5}px`, width: `${r.width + 10}px`, height: `${r.height + 10}px` });
    hl.classList.toggle('pulse', pulse);
  }

  /**
   * Translate the whole page: each translated text is covered by its translation, drawn in the
   * page's own font, colour and background. Nothing in the page is modified, clicks go through
   * to the bank's buttons, and hovering still shows the card with the original.
   */
  function setSubtitles(on, remember = false) {
    state.subtitles = on;
    if (pageBtn) pageBtn.classList.toggle('on', on);
    if (on) placeSubtitles(); else if (subLayer) subLayer.replaceChildren();
    if (remember) setLight({ pageMode: on });
  }

  const lookCache = new WeakMap();
  function pageLook(el) {
    let l = lookCache.get(el);
    if (l) return l;
    const cs = getComputedStyle(el);
    let bg = null;
    for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.backgroundImage && c.backgroundImage !== 'none') break; // gradient or image: decide below
      const m = c.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m && (m[1].split(',')[3] === undefined || parseFloat(m[1].split(',')[3]) > 0.98)) { bg = c.backgroundColor; break; }
    }
    if (!bg) {
      const rgb = (cs.color.match(/\d+/g) || [0, 0, 0]).map(Number);
      const light = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150;
      bg = light ? 'rgb(24,18,40)' : 'rgb(255,255,255)'; // fully opaque: no trace of the original
    }
    l = { font: cs.fontFamily, size: parseFloat(cs.fontSize) || 15, weight: cs.fontWeight, color: cs.color, align: cs.textAlign, bg, lh: cs.lineHeight,
      tt: cs.textTransform, ls: parseFloat(cs.letterSpacing) || 0 };
    lookCache.set(el, l);
    return l;
  }

  /** Width of a text in the page's font, at 1px (cached: measured once per text and font). */
  const measureCtx = document.createElement('canvas').getContext('2d');
  const widthCache = new Map();
  function textWidth(text, l) {
    const t = l.tt === 'uppercase' ? text.toUpperCase() : text;
    const k = `${l.weight}|${l.font}|${t}`;
    let w = widthCache.get(k);
    if (w == null) {
      measureCtx.font = `${l.weight} 100px ${l.font}`;
      w = measureCtx.measureText(t).width / 100;
      if (widthCache.size > 3000) widthCache.clear();
      widthCache.set(k, w);
    }
    return w;
  }

  let subRaf = 0;
  function placeSubtitles() {
    if (!state.subtitles || !subLayer) return;
    cancelAnimationFrame(subRaf);
    subRaf = requestAnimationFrame(() => {
      const nodes = [];
      for (const u of state.units) {
        const r = u.result;
        if (!r || r.value || u.attr || (r.status !== 'ok' && r.status !== 'gist')) continue;
        if (u.el === document.body || u.el === document.documentElement) continue;
        const b = u.el.getBoundingClientRect();
        if (b.bottom < 0 || b.top > innerHeight || b.width === 0) continue;
        const l = pageLook(u.el);
        // A container holding several lines of mixed content is not covered (that would hide the page).
        if (b.height > Math.max(140, l.size * 7)) continue;
        // Free space on the line: up to the next item on the right (e.g. an amount), never over it.
        let right = (u.el.parentElement || u.el).getBoundingClientRect().right;
        for (let sib = u.el.nextElementSibling; sib; sib = sib.nextElementSibling) {
          const sr = sib.getBoundingClientRect();
          if (sr.width && sr.left >= b.right - 1 && sr.top < b.bottom && sr.bottom > b.top) { right = Math.min(right, sr.left - 8); break; }
        }
        const avail = Math.max(b.width, Math.min(right, innerWidth - 4) - b.left);
        // One-line originals (labels, tabs, buttons) stay on one line: the font shrinks just enough
        // to fit (down to 70 %), never breaking a word. Longer, multi-line texts wrap between words.
        let ratio;
        // One line if the original itself fits on one line in its box (buttons have padding: height alone misleads).
        let oneLine = b.height <= l.size * 4 && textWidth(u.text, l) * l.size + l.ls * u.text.length <= b.width + 4;
        if (oneLine) {
          const need = textWidth(r.text, l) * l.size + l.ls * r.text.length + 4; // +4: padding
          ratio = Math.min(1, avail / need);
          if (ratio < 0.7) { ratio = 0.78; oneLine = false; } // far too long: wrap between words instead
        } else {
          ratio = Math.min(1, Math.max(0.78, Math.sqrt(u.text.length / Math.max(1, r.text.length))));
        }
        const isButton = /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button';
        const s = h('div', { class: 'sub' }, r.text);
        Object.assign(s.style, {
          whiteSpace: oneLine ? 'nowrap' : 'normal', textTransform: l.tt, letterSpacing: l.ls ? `${l.ls}px` : '',
          top: `${b.top}px`, left: `${b.left}px`, minWidth: `${b.width}px`, maxWidth: oneLine ? 'none' : `${avail}px`, width: 'max-content', minHeight: `${b.height}px`,
          display: 'flex', alignItems: 'center',
          justifyContent: isButton || l.align === 'center' ? 'center' : l.align === 'right' || l.align === 'end' ? 'flex-end' : 'flex-start',
          textAlign: isButton ? 'center' : l.align,
          fontFamily: l.font, fontSize: `${(l.size * ratio).toFixed(1)}px`, fontWeight: l.weight, color: l.color,
          background: l.bg, lineHeight: '1.25', borderRadius: isButton ? getComputedStyle(u.el).borderRadius : '4px',
        });
        nodes.push(s);
      }
      subLayer.replaceChildren(...nodes);
    });
  }

  const toastQueue = [];
  let activeToast = null;
  let toastTimer = null;
  function clearToasts() {
    toastQueue.length = 0;
    clearTimeout(toastTimer);
    toastTimer = null;
    activeToast?.remove();
    activeToast = null;
    if (toastBox) toastBox.replaceChildren();
  }
  function showNextToast() {
    if (activeToast || !toastBox || state.panelOpen || !toastQueue.length) return;
    const u = toastQueue.shift();
    const r = u.result;
    const trusted = r.verified === true && (r.status === 'ok' || r.status === 'gist');
    const kind = r.kind || 'warning';
    const title = kind === 'error'
      ? (BASE === 'en' ? 'Error message' : 'Message d\u2019erreur')
      : kind === 'success'
        ? (BASE === 'en' ? 'Success message' : 'Confirmation')
        : (BASE === 'en' ? 'Security warning' : 'Avertissement de s\u00e9curit\u00e9');
    const message = trusted ? shownText(u) : u.text;
    const stateText = trusted
      ? (r.status === 'gist'
        ? (BASE === 'en' ? 'Validated safe summary' : 'R\u00e9sum\u00e9 valid\u00e9')
        : (BASE === 'en' ? 'Validated by a speaker' : 'Valid\u00e9 par un locuteur'))
      : (BASE === 'en'
        ? 'Unvalidated translation; showing the original message.'
        : 'Traduction non valid\u00e9e ; texte original affich\u00e9.');
    const t = h('div', { class: `toast k-${kind}`, role: 'alert' });
    const dismiss = () => {
      if (activeToast !== t) return;
      activeToast = null;
      t.remove();
      clearTimeout(toastTimer);
      toastTimer = setTimeout(showNextToast, 180);
    };
    t.append(
      h('div', { class: 'toast-head' }, icon(kind === 'success' ? 'check' : 'alert'), h('strong', {}, title)),
      h('div', { class: 'toast-copy' }, message),
      h('div', { class: 'toast-state' }, stateText),
      h('button', { class: 'toast-open', onclick: () => { clearToasts(); togglePanel(true); setTab('list'); } }, BASE === 'en' ? 'View full message' : 'Voir le message complet'),
      h('button', { class: 'x', 'aria-label': ui('ui_close', 'Fermer'), onclick: dismiss }, icon('x')),
      h('div', { class: 'bar' }));
    activeToast = t;
    toastBox.replaceChildren(t);
    t.querySelector('.bar').addEventListener('animationend', dismiss, { once: true });
    if (state.settings.autoSpeak !== false && trusted) {
      const steps = stepsFor(r);
      if (steps) player.play(steps);
    }
  }
  function toast(u) {
    if (!state.settings.toasts || !toastBox || state.panelOpen) return;
    toastQueue.push(u);
    if (toastQueue.length > 3) toastQueue.shift();
    showNextToast();
  }

  let hintEl = null;
  async function showFirstRunHint() {
    try {
      const { hintShown } = await api.storage.local.get('hintShown');
      if (hintShown || !host || hoverMode() !== 'ctrl' || state.panelOpen) return;
    } catch { return; }
    const done = () => { hideHint(); api.storage.local.set({ hintShown: true }).catch(() => {}); };
    hintEl = h('div', { class: 'hint', role: 'dialog' },
      h('div', { class: 'demo' }, ...(isTouch ? [] : [h('kbd', {}, 'Ctrl'), '+']), icon('pointer'), '→', h('span', { class: 'bubble' }, icon('bubble'))),
      h('div', { class: 'line' }, isTouch
        ? ui('ui_hint_touch', 'Appuyez longuement sur un texte : sa traduction s\'affiche dessous.')
        : ui('ui_hint_hover', 'Maintenez Ctrl et pointez un texte : sa traduction s\'affiche dessous.')),
      h('div', { class: 'line' }, h('span', { class: 'say' }, icon('volume')), isTouch ? ui('ui_hint_listen_touch', 'Touchez Écouter pour entendre la traduction.') : h('span', {}, h('kbd', {}, 'Ctrl+Espace'), ' ', ui('ui_space_listen', 'écouter'))),
      h('button', { class: 'ok', onclick: done }, icon('ok'), ui('ui_ok', 'Compris')));
    host.shadowRoot.querySelector('.layer').append(hintEl);
  }
  function hideHint() { if (hintEl) { hintEl.remove(); hintEl = null; } }

  // ======================================================================================
  // Guided tour: first time after choosing a language, or again from "?" / the popup.
  // Points at the real controls one by one (spotlight + card), Back / Next / Skip, keyboard
  // (Esc, arrows, Enter). Steps whose control is not on screen are skipped. Nothing exists
  // until it runs; everything is removed when it ends.
  // ======================================================================================
  let tourEl = null;
  function tourSteps() {
    const lang = state.pack ? state.pack.name : '';
    // A translated sentence in the page's main content (not a banner or top bar), headings first.
    const shown = state.units.filter(u => u.result && (u.result.status === 'ok' || u.result.status === 'gist') && !u.result.value
      && !u.attr && u.el.getBoundingClientRect().width > 40 && visible(u.el)
      && !u.el.closest('nav, header, footer, [role="banner"], [role="navigation"]')
      && getComputedStyle(u.el).position !== 'fixed' && u.el.getBoundingClientRect().top + scrollY > 120);
    const sample = shown.find(u => /^H[1-3]$/.test(u.el.tagName)) || shown.find(u => u.el.closest('main')) || shown[0];
    const inPanel = sel => () => { if (!state.panelOpen) togglePanel(true); setTab('chat'); return panel && panel.querySelector(sel); };
    return [
      { title: ui('tour_welcome_t', 'Bienvenue dans Langwa'), body: ui('tour_welcome_b', 'Langwa vous montre cette page en {lang}, à lire et à écouter. Une visite rapide : moins d’une minute.').replace('{lang}', lang), next: ui('tour_start', 'Commencer la visite') },
      sample && { target: () => {
        if (state.panelOpen) togglePanel(false);
        sample.el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const both = () => { const a = sample.el.getBoundingClientRect(); const b = tip.classList.contains('show') ? tip.getBoundingClientRect() : a;
          const left = Math.min(a.left, b.left); const top = Math.min(a.top, b.top); const right = Math.max(a.right, b.right); const bottom = Math.max(a.bottom, b.bottom);
          return { left, top, right, bottom, width: right - left, height: bottom - top }; };
        return { isConnected: true, getBoundingClientRect: both };
      },
        // Once the scroll has settled (scrolling closes cards), open the real translation card.
        after: place => setTimeout(() => { if (!tourEl) return; showTip([sample], sample.el); tip.classList.add('intour'); place(); }, 120),
        title: isTouch ? ui('tour_point_touch_t', 'Appuyez longuement sur un texte') : ui('tour_point_t', 'Maintenez Ctrl et pointez un texte'),
        body: ui('tour_point_b', 'Sa traduction s’affiche juste dessous, avec le bouton Écouter. Les montants et les noms restent exactement ceux de la page.') },
      { target: () => { if (state.panelOpen) togglePanel(false); return fab; }, title: ui('tour_fab_t', 'Le bouton Langwa'), body: ui('tour_fab_b', 'Il ouvre le panneau. Le chiffre rouge compte les messages importants de la page.') },
      { target: inPanel('.askrow'), title: ui('tour_ask_t', 'Posez votre question'), body: ui('tour_ask_b', 'Touchez une question toute prête, écrivez, ou touchez le micro et parlez. Langwa répond dans votre langue, avec les montants de la page.') },
      // The voice, adapted to this computer: ready, installing, or a choice (hear the online voice,
      // use it, or install the private offline one). Moved early: it is what makes Langwa speak well.
      { target: () => (state.panelOpen || togglePanel(true), panelVoice && !panelVoice.hidden ? panelVoice : null),
        title: () => voiceTour().t, body: () => voiceTour().b, actions: redo => voiceTour(redo).a },
      { target: () => (state.panelOpen || togglePanel(true), panel && panel.querySelector('[data-tour="read"]')), title: ui('tour_read_t', 'Écoutez toute la page'), body: ui('tour_read_b', 'Langwa lit la page à voix haute, les messages importants d’abord.') },
      { target: () => (state.panelOpen || togglePanel(true), pageBtn), title: ui('tour_page_t', 'Traduisez toute la page'), body: ui('tour_page_b', 'La traduction s’affiche sur chaque texte de la page. Touchez encore pour revenir à l’original.') },
      { target: () => (state.panelOpen || togglePanel(true), panel && panel.querySelector('.lang-select')), title: ui('tour_lang_t', 'Changez de langue'), body: ui('tour_lang_b', 'À tout moment, ici. Les langues les plus complètes sont en premier.') },
      { title: ui('tour_done_t', 'C’est prêt !'), body: ui('tour_done_b', 'Pour revoir ce guide : le bouton Guide en bas du panneau, ou la fenêtre Langwa dans la barre du navigateur.'), next: ui('tour_finish', 'Terminer') },
    ].filter(Boolean);
  }


  /** The tour's voice step: what this computer has, and what to do about it. */
  function voiceTour(redo = () => {}) {
    const natural = !!(state.pack && state.pack.africaTts);
    const act = (label, onclick, cls = '') => h('button', { class: `tact ${cls}`, type: 'button', onclick }, label);
    const install = act(ui('tour_v_install', 'Installer la voix hors ligne'), () => send({ type: 'openOptions' }));
    const L = globalThis.LangwaSpeech;
    const prefs = [...((state.pack && state.pack.voices) || []).map(x => x.toLowerCase()), 'en', 'fr'];
    // A short sample in the online voice, so people hear the difference before choosing.
    const sample = act(`▶ ${ui('tour_v_hear', 'Écouter')}`, e => {
      const voice = L && L.pickVoice(prefs, true);
      if (!voice || !globalThis.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(ui('ans_welcome', 'Bonjour ! Posez-moi une question sur cette page.'));
      u.voice = voice; u.lang = voice.lang;
      const b = e.currentTarget;
      b.classList.add('on');
      u.onend = u.onerror = () => b.classList.remove('on');
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });
    const useOnline = act(ui('ui_vfix_online', 'Utiliser la voix naturelle en ligne'), () => {
      setLight({ onlineVoice: true }); renderPanelVoice(); refreshChips(); redo();
    }, 'primary');
    if (natural && state.localVoice) return { t: ui('tour_v_ready_t', 'Voix naturelle prête'), b: ui('tour_v_ready_b', 'Langwa lit avec la voix naturelle installée sur cet ordinateur.'), a: [] };
    if (natural && state.voice) {
      const pct = Math.max(1, Math.round((state.voice.progress || 0) * 100));
      return { t: ui('tour_v_inst_t', 'La voix naturelle s’installe'), b: `${ui('ui_voice_natural', 'Voix naturelle')} · ${pct} %. ${ui('tour_v_inst_b', 'En attendant, la voix intégrée lit.')}`, a: [] };
    }
    if (!natural) return { t: ui('tour_voice_t', 'Qui lit à voix haute'), b: ui('tour_v_builtin_b', 'La voix de cet appareil lit les traductions.'), a: [] };
    if (onlineOn()) return { t: ui('tour_v_online_t', 'Voix naturelle en ligne activée'), b: ui('tour_v_online_b', 'Une voix naturelle de Microsoft ou Google lit les traductions. Pour une voix privée, installez la voix hors ligne.'), a: [sample, install] };
    if (onlineVoiceAvailable()) return { t: ui('tour_v_choose_t', 'Choisissez la voix'), b: ui('tour_v_choose_b', 'La voix naturelle n’est pas encore sur cet ordinateur. Écoutez la voix en ligne : elle marche tout de suite, le texte lu est envoyé à Microsoft ou Google. Ou installez la voix privée.'), a: [sample, useOnline, install] };
    return { t: ui('tour_v_none_t', 'Voix intégrée pour l’instant'), b: ui('tour_v_none_b', 'Ce navigateur n’a pas de voix en ligne (Edge en a). Installez la voix naturelle hors ligne pour un son naturel.'), a: [install] };
  }

  function endTour(done = true) {
    if (!tourEl) return;
    tourEl._off();
    tourEl.remove();
    if (tip) tip.classList.remove('intour', 'show');
    tourEl = null;
    if (done) api.storage.local.set({ tourDone: true }).catch(() => {});
  }

  function startTour() {
    if (!host || !state.active) return;
    endTour(false);
    hideHint();
    hideTipSoon();
    const steps = tourSteps();
    let i = 0;
    let target = null;
    const spot = h('div', { class: 'tspot' });
    const count = h('span', { class: 'tstep' });
    const dots = h('span', { class: 'tdots', 'aria-hidden': 'true' }, steps.map(() => h('i')));
    const title = h('h4', { id: 'langwa-tour-title' });
    const body = h('p');
    const back = h('button', { class: 'tback', type: 'button' }, ui('tour_back', 'Retour'));
    const next = h('button', { class: 'tnext', type: 'button' });
    const skip = h('button', { class: 'tskip', type: 'button' }, ui('tour_skip', 'Passer le guide'));
    const doneMark = h('div', { class: 'tdone', hidden: true }, icon('check'));
    const acts = h('div', { class: 'tacts' });
    const content = h('div', { class: 'tcontent', 'aria-live': 'polite' }, doneMark, title, body, acts);
    const card = h('div', { class: 'tcard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'langwa-tour-title' },
      h('div', { class: 'thead' }, count, dots, skip), content, h('div', { class: 'tbtns' }, back, next));
    tourEl = h('div', { class: 'tour' }, spot, card);
    shadow.querySelector('.layer').append(tourEl);

    const place = () => {
      const pad = 8;
      const vw = innerWidth;
      const vh = innerHeight;
      const r = target && target.isConnected ? target.getBoundingClientRect() : null;
      const has = r && r.width > 0 && r.height > 0;
      tourEl.classList.toggle('nospot', !has);
      if (has) Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      if (vw <= 640) { // phones: a sheet at the bottom, or at the top when the control is in the lower half
        card.style.left = card.style.top = '';
        card.classList.toggle('top', !!has && (r.top + r.bottom) / 2 > vh / 2);
        return;
      }
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      let left;
      let top;
      if (!has) { left = (vw - cw) / 2; top = (vh - ch) / 2; } else if (r.bottom + pad + 14 + ch < vh) { top = r.bottom + pad + 14; left = r.left; } else if (r.top - pad - 14 - ch > 0) { top = r.top - pad - 14 - ch; left = r.left; } else if (r.left - pad - 14 - cw > 0) { left = r.left - pad - 14 - cw; top = r.top; } else { left = r.right + pad + 14; top = r.top; }
      card.style.left = `${Math.max(12, Math.min(left, vw - cw - 12))}px`;
      card.style.top = `${Math.max(12, Math.min(top, vh - ch - 12))}px`;
    };
    const go = (n, dir = 1) => {
      if (n < 0) return;
      if (n >= steps.length) { endTour(true); return; }
      i = n;
      const st = steps[i];
      if (tip) tip.classList.remove('intour', 'show');
      let t = null;
      try { t = st.target ? st.target() : null; } catch { t = null; }
      if (st.target && !t) { go(n + dir, dir); return; } // control not on screen: skip this step
      target = t;
      count.textContent = `${i + 1} / ${steps.length}`;
      [...dots.children].forEach((d, k) => { d.classList.toggle('on', k < i); d.classList.toggle('cur', k === i); });
      content.classList.remove('fwd', 'bwd');
      void content.offsetWidth; // restart the slide-in
      content.classList.add(dir > 0 ? 'fwd' : 'bwd');
      doneMark.hidden = i !== steps.length - 1;
      title.textContent = typeof st.title === 'function' ? st.title() : st.title;
      body.textContent = typeof st.body === 'function' ? st.body() : st.body;
      acts.replaceChildren(...(st.actions ? st.actions(() => go(i, 1)) : []));
      acts.hidden = !acts.children.length;
      next.textContent = st.next || (i === steps.length - 1 ? ui('tour_finish', 'Terminer') : ui('tour_next', 'Suivant'));
      back.hidden = i === 0;
      skip.hidden = i === steps.length - 1;
      requestAnimationFrame(() => { place(); next.focus({ preventScroll: true }); if (st.after) st.after(place); });
    };
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    const onKey = e => {
      if (!tourEl) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(true); }
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.composedPath()[0] !== skip && e.composedPath()[0] !== back)) { e.preventDefault(); e.stopPropagation(); go(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(i - 1, -1); }
    };
    addEventListener('resize', onMove, { passive: true });
    addEventListener('scroll', onMove, { passive: true, capture: true });
    addEventListener('keydown', onKey, true);
    tourEl._off = () => { removeEventListener('resize', onMove); removeEventListener('scroll', onMove, { capture: true }); removeEventListener('keydown', onKey, true); cancelAnimationFrame(raf); };
    next.onclick = () => go(i + 1);
    back.onclick = () => go(i - 1, -1);
    skip.onclick = () => endTour(true);
    go(0);
  }

  /** First time on a page after choosing a language: the tour, once (skip counts as seen). */
  async function maybeTour() {
    try {
      const { tourDone } = await api.storage.local.get('tourDone');
      if (tourDone) return;
    } catch { return; }
    setTimeout(() => { if (state.active && !tourEl) startTour(); }, 900); // let the page be read first
  }

  // ======================================================================================
  // Collecting interface text
  // ======================================================================================
  function visible(el) {
    if (el.tagName === 'OPTION') return el.parentElement ? visible(el.closest('select') || el.parentElement) : false;
    return el.checkVisibility ? el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : el.getClientRects().length > 0;
  }

  function collectLiterals() {
    for (const el of document.querySelectorAll('input:not([type=password]):not([type=hidden]):not([type=checkbox]):not([type=radio])')) {
      if (el === document.activeElement) continue; // ignore half-typed values
      const v = (el.value || '').trim();
      if (v.length >= 2 && v.length <= 80) state.literals.add(v);
    }
    if (state.literals.size > 60) state.literals = new Set([...state.literals].slice(-60));
  }

  function collect() {
    const blockCache = new Map();
    const isUnit = el => {
      let r = blockCache.get(el);
      if (r === undefined) {
        const d = getComputedStyle(el).display;
        r = d !== 'inline' && d !== 'contents';
        blockCache.set(el, r);
      }
      return r;
    };
    const groups = new Map();
    // Ignored elements are rejected once with their whole subtree (no per-text-node lookup).
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === 1) return n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      let el = n.parentElement;
      while (el !== document.body && !isUnit(el)) el = el.parentElement;
      let g = groups.get(el);
      if (!g) groups.set(el, (g = []));
      g.push(n);
    }
    const out = [];
    for (const [el, nodes] of groups) {
      if (!visible(el)) continue;
      const text = nodes.map(n => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
      if (text) out.push({ el, attr: null, text });
    }
    const sel = ATTRS.map(a => `[${a}]`).join(',') + ',input[type=submit][value],input[type=button][value]';
    for (const el of document.body.querySelectorAll(sel)) {
      if (el.closest(SKIP) || !visible(el)) continue;
      for (const a of [...ATTRS, 'value']) {
        if (a === 'value' && !(el.tagName === 'INPUT' && /^(submit|button)$/i.test(el.type))) continue;
        const v = (el.getAttribute(a) || '').trim();
        if (v && /\p{L}{2,}/u.test(v)) out.push({ el, attr: a, text: v.replace(/\s+/g, ' ') });
      }
    }
    return out;
  }

  // ======================================================================================
  // Translation pipeline
  // ======================================================================================
  const mtQueue = [];
  let mtTimer = null;
  function requestMT(part) {
    // Lamnso' has a dedicated local model and should use it whenever this language is
    // selected, even when the optional general MT setting is left at "none".
    if ((!state.settings.mt || state.settings.mt.mode === 'none') && state.pack.code !== 'lns') return Promise.resolve(null);
    return new Promise(resolve => {
      mtQueue.push({ part, resolve });
      clearTimeout(mtTimer);
      mtTimer = setTimeout(flushMT, 150);
    });
  }
  async function flushMT() {
    const batch = mtQueue.splice(0, 30);
    if (mtQueue.length) mtTimer = setTimeout(flushMT, 50);
    const uniq = [...new Set(batch.map(b => b.part.masked))];
    let res = [];
    try {
      // Only the MASKED text is sent: no amount, name or number leaves the page.
      const reply = await send({ type: 'translateBatch', lang: state.pack.code, items: uniq.map(m => ({ masked: m })) });
      res = (reply && reply.results) || [];
      const err = !!(reply && reply.error);
      if (err !== state.mtError) { state.mtError = err; renderPanelSoon(); }
    } catch { res = []; }
    for (const b of batch) b.resolve(res[uniq.indexOf(b.part.masked)] || null);
  }

  /**
   * Context: the platform's own name, read from the page (title, declared site name, logo
   * description). It is protected like a brand: "Safinum Pay" is never translated.
   */
  function pageBrands() {
    const names = new Set();
    const add = s => { const v = (s || '').trim(); if (v && v.length <= 40 && v.split(/\s+/).length <= 4 && /^\p{Lu}/u.test(v)) names.add(v); };
    for (const part of (document.title || '').split(/\s+[|·•:–—-]\s+/)) add(part);
    for (const sel of ['meta[property="og:site_name"]', 'meta[name="application-name"]', 'meta[name="apple-mobile-web-app-title"]']) {
      const m = document.querySelector(sel); if (m) add(m.content);
    }
    for (const img of document.querySelectorAll('header img[alt], nav img[alt], [class*="logo" i] img[alt], img[class*="logo" i][alt]')) add(img.alt);
    return [...names].filter(n => !/^(accueil|home|connexion|login|test)$/i.test(n));
  }

  async function translateText(text) {
    const literals = [...state.literals].filter(l => text.includes(l));
    const plan = state.engine.plan(text, literals, state.brands || []);
    if (plan.skip) return { value: true, brand: !!plan.brand, status: 'value', text: plan.text, original: plan.text };
    const outs = await Promise.all(plan.parts.map(async part => {
      if (part.kind === 'lit') return { text: part.text, verified: true, source: 'literal' };
      const g = state.engine.lookupMasked(part.masked, part.tokens);
      if (g) return g;
      const mt = await requestMT(part);
      if (!mt) return null;
      const un = P.unmask(mt.text, part.tokens);
      if (!un.ok) return { blocked: true, problems: un.problems };
      return { text: un.text, verified: false, source: 'local-mt', confidence: mt.confidence };
    }));
    return state.engine.finalize(text, plan, outs, literals);
  }

  function resultFor(text) {
    const lits = [...state.literals].filter(l => text.includes(l)).join('\u0002');
    const key = `${text}\u0001${lits}`;
    let r = state.results.get(key);
    if (!r) {
      r = translateText(text).catch(err => {
        console.warn('[Langwa] translation failed:', err);
        return { status: 'untranslated', text, original: text, kind: E.classify(text) };
      });
      if (state.results.size >= 1500) state.results.delete(state.results.keys().next().value);
    } else {
      state.results.delete(key); // refresh LRU position
    }
    state.results.set(key, r);
    return r;
  }

  function scan() {
    if (!state.active) return;
    const t0 = performance.now();
    const gen = state.gen;
    try {
      collectLiterals();
      const now = Date.now();
      const found = collect();
      const units = [];
      const byEl = new Map();
      for (const f of found) {
        const known = state.known.get(f.el) || [];
        let u = known.find(k => k.attr === f.attr && k.text === f.text);
        if (!u) {
          // "New" = a text never seen on this site in this session (a box the page simply re-draws
          // when changing step is not new).
          const fresh = !seenTexts.has(f.text);
          seenTexts.add(f.text);
          u = { ...f, firstSeen: now, isNew: fresh && now - state.startedAt > NEW_AFTER_MS, result: null };
          state.known.set(f.el, [...known.filter(k => k.attr !== f.attr), u]);
          resultFor(u.text).then(r => {
            if (gen !== state.gen) return; // a restart happened meanwhile
            u.result = r;
            onResult(u);
          });
        }
        units.push(u);
        let list = byEl.get(u.el);
        if (!list) byEl.set(u.el, (list = []));
        list.push(u);
      }
      state.units = units;
      state.unitsByEl = byEl;
      state.stats = { ms: Math.round(performance.now() - t0), count: units.length };
    } catch (err) {
      console.warn('[Langwa] scan failed:', err);
    }
    renderPanelSoon();
  }

  function onResult(u) {
    const r = u.result;
    renderPanelSoon();
    if (tipUnits && tipUnits.includes(u) && tip.classList.contains('show')) showTip(tipUnits, tipAnchor);
    // Alert only when Langwa has something useful to show (translation, safe summary or dictionary words).
    const helpful = r && (r.status === 'ok' || r.status === 'gist' || (r.words && r.words.length));
    if (u.isNew && r && !r.value && helpful && ALERT_KINDS.has(r.kind)) toast(u);
  }

  // ======================================================================================
  // Lifecycle
  // ======================================================================================
  let observer = null;
  let scanTimer = null;
  let lastScan = 0;
  let missedWhileHidden = false;

  /** Coalesce bursts of DOM changes into one scan, run when the browser is idle, never in a hidden tab. */
  function scanSoon() {
    if (scanTimer) return;
    const wait = Math.max(120, 300 - (Date.now() - lastScan));
    scanTimer = setTimeout(() => {
      const run = () => {
        scanTimer = null;
        if (document.hidden) { missedWhileHidden = true; return; }
        lastScan = Date.now();
        scan();
      };
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 400 }); else run();
    }, wait);
  }

  function siteEnabled(settings) {
    const here = location.protocol === 'file:' ? 'file://' : location.origin;
    return (settings.sites || []).some(s => here === s || here.startsWith(s + ':') || here.startsWith(s + '/') || here === s.replace(/\/$/, ''));
  }

  /** Messaging that survives the extension being reloaded/updated while the page is open. */
  async function send(msg) {
    try {
      return await api.runtime.sendMessage(msg);
    } catch (err) {
      if (/context invalidated|receiving end does not exist/i.test(String(err && err.message))) stop();
      throw err;
    }
  }

  const onShortcut = e => {
    if (!e.altKey || !e.shiftKey) return;
    if (e.code === 'KeyM') { togglePanel(); e.preventDefault(); }
    if (e.code === 'KeyT' || e.code === 'KeyS') { setSubtitles(!state.subtitles, true); e.preventDefault(); }
    if (e.code === 'KeyL') { readAll(pageBtn && pageBtn.nextSibling); e.preventDefault(); }
  };
  const onScroll = () => { if (state.subtitles) placeSubtitles(); if (tip) tip.classList.remove('show'); highlight(null); };
  const onResize = () => state.subtitles && placeSubtitles();
  const onChange = () => collectLiterals();
  const onBlur = () => { highlight(null); setPassThrough(false); };
  const onVisibility = () => { if (!document.hidden && missedWhileHidden) { missedWhileHidden = false; scanSoon(); } };

  // Listeners exist only while the extension is active on the site (nothing runs elsewhere).
  const LISTENERS = [
    [document, 'mouseover', onOver, true],
    [document, 'mousemove', onMove, { capture: true, passive: true }],
    [document, 'focusin', onFocus, true],
    [document, 'touchstart', onTouchStart, { capture: true, passive: true }],
    [document, 'touchmove', onTouchMove, { capture: true, passive: true }],
    [document, 'touchend', onTouchEnd, { capture: true, passive: false }],
    [document, 'click', onClickCapture, true],
    [document, 'contextmenu', onContextMenu, true],
    [document, 'keydown', onModKey, true],
    [document, 'keyup', onModKey, true],
    [document, 'keydown', onShortcut, true],
    [document, 'change', onChange, true],
    [document, 'visibilitychange', onVisibility, false],
    [window, 'scroll', onScroll, { passive: true, capture: true }],
    [window, 'resize', onResize, { passive: true }],
    [window, 'blur', onBlur, false],
  ];
  let listening = false;
  function listen(on) {
    if (on === listening) return;
    listening = on;
    for (const [t, type, fn, opt] of LISTENERS) (on ? t.addEventListener : t.removeEventListener).call(t, type, fn, opt);
  }

  async function start() {
    const gen = ++state.gen;
    let settings;
    let pack;
    try {
      settings = await send({ type: 'getSettings' });
      if (gen !== state.gen) return;
      state.settings = settings;
      if (!siteEnabled(settings)) { stop(); return; }
      [pack, state.langs] = await Promise.all([send({ type: 'getPack', lang: settings.lang }), send({ type: 'getLangs' })]);
      if (gen !== state.gen) return;
    } catch (err) {
      console.warn('[Langwa] cannot reach the extension:', err && err.message);
      return;
    }
    player.stop();
    state.ui = uiMap(pack);
    if (!settings.lang) {
      // No language chosen yet: only the chooser, nothing else runs.
      state.active = false;
      listen(false);
      destroyUI();
      buildChooser();
      return;
    }
    state.pack = pack;
    state.engine = E.createEngine(pack);
    state.brands = pageBrands();
    state.results.clear();
    state.known = new WeakMap();
    state.units = [];
    state.unitsByEl = new Map();
    state.mtError = false;
    destroyUI();
    buildUI();
    renderPanelVoice(); // last known voice state at once; refreshVoice() below brings the live one
    if (state.panelOpen) togglePanel(true);
    state.active = true;
    state.startedAt = Date.now();
    refreshVoice(); // automatic voice: is the local model running? (answer arrives in ~ms)
    listen(true);
    scan();
    if (settings.pageMode) setSubtitles(true); // page translation stays on between pages
    maybeTour(); // first time: the guided tour (replaces the one-line hint)
    if (!observer) {
      observer = new MutationObserver(muts => {
        // Ignore our own layer being attached.
        if (host && muts.every(m => m.target === host || (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(n => n === host)))) return;
        scanSoon();
      });
      observer.observe(document.documentElement, {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open', 'placeholder', 'aria-label', 'title'],
      });
    }
  }

  function stop() {
    state.gen++;
    state.active = false;
    listen(false);
    try { player.stop(); } catch { /* ignore */ }
    if (observer) { observer.disconnect(); observer = null; }
    clearTimeout(scanTimer);
    scanTimer = null;
    destroyUI();
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings && !Object.keys(changes).some(k => k.startsWith('overrides:'))) {
      const before = changes.settings.oldValue || {};
      const after = changes.settings.newValue || {};
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      const changed = [...keys].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      if (state.active && changed.length && changed.every(k => LIGHT_SETTINGS.includes(k))) {
        state.settings = { ...state.settings, ...after }; // voice or reading preference: no restart
        return;
      }
    }
    if (changes.settings || Object.keys(changes).some(k => k.startsWith('overrides:'))) start();
  });
  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'ping') { sendResponse({ active: state.active }); return; }
    if (!state.active || !msg) return;
    if (msg.type === 'togglePanel') togglePanel();
    if (msg.type === 'toggleSubtitles' || msg.type === 'togglePage') setSubtitles(!state.subtitles, true);
    if (msg.type === 'readAll') readAll(pageBtn && pageBtn.nextSibling);
    if (msg.type === 'startTour') startTour();
  });

  start();
})();
