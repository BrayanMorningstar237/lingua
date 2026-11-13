// Records the Langwa demo video (under 3 minutes), one story from start to end:
// setup (website, extensions page, offline voice), Fulfulde (first run, Ctrl + point, Listen,
// changing the voice), Pidgin (popup: language and Point mode, assistant), a new message added
// after load, protection of amounts, the other languages and the contribution page.
// A clean Edge with the built extension is driven like a user; every reading plays to its end
// and nothing is spoken over it. Audio comes from the local offline voice (127.0.0.1:8770).
// Writes frames + a timeline that make.mjs turns into an mp4.
//   node record.mjs <extension dir> <profile dir> <out dir> <site dir>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [ext, profile, out, siteDir] = process.argv.slice(2);
const FRAMES = join(out, 'frames');
const AUDIO = join(out, 'audio');
rmSync(FRAMES, { recursive: true, force: true });
rmSync(AUDIO, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(AUDIO, { recursive: true });
const W = 1920, H = 1080;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TEST = 'https://safinum.cm/hackathon-test';
const SITE = `file:///${siteDir.replace(/\\/g, '/')}`;
let clipNo = 0;

async function tts(text, lang, voice, file) {
  for (let k = 0; k < 5; k++) {
    const r = await fetch('http://127.0.0.1:8770/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang, voice }), signal: AbortSignal.timeout(45000) }).catch(() => null);
    if (r && r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      writeFileSync(join(AUDIO, file), buf);
      const bytesPerSec = buf.readUInt32LE(28);
      let off = 12, data = 0;
      while (off < buf.length - 8) { const id = buf.toString('ascii', off, off + 4), size = buf.readUInt32LE(off + 4); if (id === 'data') { data = size; break; } off += 8 + size; }
      return { file, sec: data / bytesPerSec };
    }
    await sleep(3000);
  }
  throw new Error('the voice did not answer');
}

// The narrator (offline English voice). Short lines; the national-language readings carry the story.
const NARRATION = {
  intro: 'Many Cameroonians understand Fulfulde or Pidgin better than French. On a bank page, one misread word can cost money. Langwa makes it clear.',
  site: 'Setup takes two minutes. Download Langwa from its website, and unzip it.',
  ext: 'On the extensions page, turn on developer mode, click Load unpacked, and pick the Langwa folder.',
  voice: 'For a natural voice without internet, double click Start Langwa voice. It downloads once, then works offline.',
  choose: 'On the bank page, a Fulani speaker searches Fulani, and picks Fulfulde. A short guide shows the way.',
  ctrl: 'Hold Control, and point at a text. Then press listen.',
  vchange: 'Prefer another voice? Choose it in the settings, and listen again.',
  popup: 'The Langwa button changes the language, and how translations appear: here Pidgin, and Point, with no key to hold.',
  ask: 'Ask the assistant. It answers with the exact amount.',
  alert: 'A new message, never seen before, is caught at once. The warning comes first, and the amount stays exact.',
  locked: 'Amounts and names are locked before translation, and checked after. Nothing on the page is sent anywhere.',
  others: 'Seven more languages are on the way, and native speakers add translations from their phone.',
  end: 'Langwa. Online banking, in your language.',
};

const PORT = 9500 + Math.floor(Math.random() * 90);
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  `--load-extension=${ext}`, '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const timeline = { scenes: [], cues: [], frames: [] };
let t0 = 0;
const now = () => Date.now() - t0;

async function connect(wsUrl, onEvent) {
  const ws = new WebSocket(wsUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const wait = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method && onEvent) onEvent(m, ws);
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
  };
  const cdp = (method, params = {}) => new Promise(r => { const n = 1e6 + (++id); wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async x => { const r = await cdp('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) console.log('  (page error)', r.result.exceptionDetails.exception?.description?.split(String.fromCharCode(10))[0], '::', x.slice(0, 90).replace(/\s+/g, ' ')); return r.result?.result?.value; };
  return { ws, cdp, ev };
}

try {
  await fetch('http://127.0.0.1:8770/wake', { method: 'POST' }).catch(() => {});
  for (let k = 0; k < 120; k++) { const h = await fetch('http://127.0.0.1:8770/health').then(r => r.json()).catch(() => ({})); if (h.status === 'ready') break; await sleep(1000); }
  const narr = {};
  let total = 0;
  for (const [k, text] of Object.entries(NARRATION)) { narr[k] = await tts(text, 'eng', 'default', `n-${k}.wav`); total += narr[k].sec; console.log(`narration ${k}: ${narr[k].sec.toFixed(1)} s`); }
  console.log(`narration total: ${total.toFixed(1)} s`);

  let targets = null;
  for (let k = 0; k < 40 && !targets; k++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { /* starting */ } }
  let extId = null;
  for (let k = 0; k < 40 && !extId; k++) {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    extId = l.map(x => x.url).find(u => u.endsWith('/src/background.js'))?.split('/')[2];
    if (!extId) await sleep(250);
  }
  let frameNo = 0;
  const { cdp, ev } = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl, (m, ws) => {
    if (m.method !== 'Page.screencastFrame') return;
    const f = `f${String(++frameNo).padStart(6, '0')}.jpg`;
    writeFileSync(join(FRAMES, f), Buffer.from(m.params.data, 'base64'));
    timeline.frames.push({ f, t: now() });
    ws.send(JSON.stringify({ id: 9e8 + frameNo, method: 'Page.screencastFrameAck', params: { sessionId: m.params.sessionId } }));
  });
  const R = `document.querySelector('langwa-root')?.shadowRoot`;
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

  // ---------- recorder overlay: pointer, Ctrl badge, caption, chapter tag, cards (not part of Langwa) ----------
  let cur = { x: W / 2, y: H / 2 };
  let lastCap = '', lastTag = '';
  const overlay = async () => ev(`(() => {
    if (document.getElementById('rec-cursor')) return;
    const c = document.createElement('div'); c.id = 'rec-cursor';
    const NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'), pa = document.createElementNS(NS, 'path');
    sv.setAttribute('width', '34'); sv.setAttribute('height', '34'); sv.setAttribute('viewBox', '0 0 24 24');
    pa.setAttribute('d', 'M4 2l14 9-6.5 1.5L15 20l-3 1.5-2.6-7.6L4 18z'); pa.setAttribute('fill', '#fff'); pa.setAttribute('stroke', '#111'); pa.setAttribute('stroke-width', '1.4'); pa.setAttribute('stroke-linejoin', 'round');
    sv.append(pa); c.append(sv);
    Object.assign(c.style, { position: 'fixed', left: '${cur.x - 4}px', top: '${cur.y - 2}px', zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))', transition: 'transform .12s' });
    const k = document.createElement('div'); k.id = 'rec-kbd'; k.textContent = 'Ctrl';
    Object.assign(k.style, { position: 'fixed', zIndex: 2147483647, pointerEvents: 'none', font: '700 17px system-ui', color: '#1d1712', background: '#f6dfa6', border: '1px solid #b7800f', borderRadius: '6px', padding: '2px 8px', display: 'none', boxShadow: '0 2px 0 #b7800f' });
    const cap = document.createElement('div'); cap.id = 'rec-cap';
    Object.assign(cap.style, { position: 'fixed', left: '50%', bottom: '34px', transform: 'translateX(-50%)', maxWidth: '1250px', zIndex: 2147483646, pointerEvents: 'none', background: 'rgba(20,14,10,.9)', color: '#fff', font: '600 28px/1.35 Segoe UI, system-ui', padding: '14px 28px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.3)', display: 'none' });
    const tag = document.createElement('div'); tag.id = 'rec-tag';
    Object.assign(tag.style, { position: 'fixed', left: '24px', top: '20px', zIndex: 2147483646, pointerEvents: 'none', background: '#1e7a4c', color: '#fff', font: '700 19px Segoe UI, system-ui', padding: '8px 16px', borderRadius: '99px', letterSpacing: '.3px', boxShadow: '0 6px 18px rgba(0,0,0,.18)', display: 'none' });
    document.documentElement.append(c, k, cap, tag);
  })()`);
  const paintText = () => ev(`(() => { const c = document.getElementById('rec-cap'); try { c.innerHTML = ${JSON.stringify(lastCap)}; } catch { c.textContent = ${JSON.stringify(lastCap.replace(/<[^>]+>/g, ''))}; } c.style.display = ${lastCap ? "'block'" : "'none'"};
    const t = document.getElementById('rec-tag'); t.textContent = ${JSON.stringify(lastTag)}; t.style.display = ${lastTag ? "'block'" : "'none'"}; })()`);
  const caption = async html => { lastCap = html || ''; await overlay(); await paintText(); };
  const chapter = async text => { lastTag = text || ''; await overlay(); await paintText(); };
  const afterNav = async () => { await ev(`(() => { if (!location.href.startsWith('https://safinum.cm')) { const r = document.querySelector('langwa-root'); if (r) r.style.display = 'none'; } })()`); await overlay(); await paintText(); };
  const card = (html, fadeIn = true) => ev(`(() => { const d = document.createElement('div'); d.id = 'rec-card'; d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:linear-gradient(180deg,#c7ebe6,#e4f3e8 45%,#f8efd9);font-family:Segoe UI,system-ui;opacity:${fadeIn ? 0 : 1};transition:opacity .6s';
    d.innerHTML = ${JSON.stringify(html)}; document.documentElement.append(d); requestAnimationFrame(() => { d.style.opacity = 1; }); })()`);
  const uncard = () => ev(`(() => { const d = document.getElementById('rec-card'); if (!d) return; d.style.opacity = 0; setTimeout(() => d.remove(), 650); })()`);
  const LOGO = '<div style="width:96px;height:96px;margin:0 auto 22px;border-radius:28px;background:#e3a21a;display:grid;place-items:center;box-shadow:0 10px 0 #b7800f"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1d1712" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg></div>';
  const moveTo = async (x, y, { ctrl = false, ms = 650, real = true } = {}) => {
    await overlay();
    const steps = Math.max(8, Math.round(ms / 30));
    const from = { ...cur };
    for (let i = 1; i <= steps; i++) {
      const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      cur = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      if (real) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cur.x, y: cur.y, modifiers: ctrl ? 2 : 0 });
      await ev(`(() => { const c = document.getElementById('rec-cursor'); c.style.left = '${cur.x - 4}px'; c.style.top = '${cur.y - 2}px';
        const k = document.getElementById('rec-kbd'); k.style.display = ${ctrl ? "'block'" : "'none'"}; k.style.left = '${cur.x + 24}px'; k.style.top = '${cur.y + 24}px'; })()`);
      await sleep(Math.round(ms / steps));
    }
  };
  const pressAnim = async () => { await ev(`document.getElementById('rec-cursor').style.transform = 'scale(.82)'`); await sleep(150); await ev(`document.getElementById('rec-cursor').style.transform = ''`); };
  const click = async (x, y, { real = true } = {}) => {
    await moveTo(x, y, { real });
    await ev(`document.getElementById('rec-cursor').style.transform = 'scale(.82)'`);
    if (real) {
      await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    }
    await sleep(150);
    await ev(`document.getElementById('rec-cursor').style.transform = ''`);
  };
  const typeText = async text => { for (const ch of text) { await cdp('Input.insertText', { text: ch }); await sleep(70); } };
  const FIND = `(re, sel) => [...document.querySelectorAll(sel)].filter(e => e.children.length <= 3 && e.getClientRects().length && re.test((e.textContent || '').trim()) && !e.closest('#rec-cap'))
    .sort((a, b) => a.textContent.length - b.textContent.length)[0]`;
  const pageEl = (re, sel = 'h1,h2,h3,p,span,div,label,b,strong,button,a,td,dt,dd') => ev(`(() => {
    const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), ${JSON.stringify(sel)});
    if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 90), y: r.top + r.height / 2 };
  })()`);
  const pressPage = async re => {
    const p = await pageEl(re, 'button,a');
    if (!p) { console.log('not found:', re); return false; }
    await click(p.x, p.y);
    await ev(`(() => { const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), 'button,a'); if (el) el.click(); })()`);
    return true;
  };
  const lwEl = sel => ev(`(() => { const e = ${R}?.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`);
  const waitFor = async (expr, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(250); } return false; };
  const closePanel = async () => { const c = await lwEl('.panel.show .ph > .icon-btn:last-child'); if (c) await click(c.x, c.y); await sleep(300); };

  // ---------- audio: narration and readings never overlap ----------
  const mark = l => console.log(`[${(now() / 1000).toFixed(1)} s] ${l}`);
  const cue = (a, vol) => timeline.cues.push({ file: a.file, t: now(), sec: a.sec, vol });
  // the narrator speaks while `run` acts on screen; then wait for the end of the line
  const narrate = async (key, run) => {
    const a = narr[key], start = now();
    cue(a, 1.0);
    if (run) await run();
    const left = a.sec * 1000 + 300 - (now() - start);
    if (left > 0) await sleep(left);
  };
  // a reading in a national language, played to its end
  const play = async (text, lang, voice = 'female') => {
    const a = await tts(text, lang, voice, `c${++clipNo}-${lang}.wav`);
    cue(a, 1.2);
    await sleep(a.sec * 1000 + 450);
    return a;
  };
  const tipText = () => ev(`${R}.querySelector('.tip.show .tr')?.textContent?.trim() || ''`);
  // point at a page text (with or without Ctrl), press Listen, show what it means, play it to the end
  const LANGNAME = { fub: 'Fulfulde', pcm: 'Pidgin' };
  const read = async (re, meaning, { lang, ctrl, voice = 'female' }) => {
    const p = await pageEl(re);
    if (!p) { console.log('not found:', re); return; }
    await moveTo(p.x, p.y, { ctrl, ms: 650 });
    for (let k = 0; k < 15 && !(await lwEl('.tip.show .say')); k++) await sleep(150);
    await sleep(350);
    const txt = await tipText();
    const sayBtn = await lwEl('.tip.show .say');
    if (!txt || !sayBtn) { console.log('no card for', re); return; }
    await moveTo(sayBtn.x, sayBtn.y, { ms: 420 });
    await pressAnim();
    await ev(`${R}.querySelector('.tip.show .say')?.click()`);
    await caption(`<span style="opacity:.75;font-weight:500">${LANGNAME[lang]}:</span> “${meaning}”`);
    await play(txt, lang, voice);
    console.log(`  [${(now() / 1000).toFixed(1)} s] read [${lang}] ${txt}`);
  };

  // ---------- the Langwa toolbar button and popup (the real popup page, shown at the top right) ----------
  const POP = { x: W - 24 - 414, y: 74, s: 1.15, w: 360 };
  let P = null;
  const toolbarBtn = () => ev(`(() => { if (document.getElementById('rec-tb')) return; const b = document.createElement('div'); b.id = 'rec-tb';
    b.style.cssText = 'position:fixed;top:14px;right:24px;width:46px;height:46px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.18);display:grid;place-items:center;z-index:2147483645;pointer-events:none';
    b.innerHTML = '<div style="width:32px;height:32px;border-radius:9px;background:#e3a21a;display:grid;place-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1712" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg></div>';
    document.documentElement.append(b); })()`);
  const popShot = async () => {
    const h = Math.min(820, await P.ev('document.documentElement.scrollHeight'));
    const img = (await P.cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: POP.w, height: h, scale: 1 } })).result.data;
    await ev(`(() => { let i = document.getElementById('rec-pop'); if (!i) { i = document.createElement('img'); i.id = 'rec-pop';
      i.style.cssText = 'position:fixed;top:${POP.y}px;left:${POP.x}px;width:${Math.round(POP.w * POP.s)}px;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08);z-index:2147483645;pointer-events:none;opacity:0;transform:translateY(-8px);transition:opacity .25s,transform .25s';
      document.documentElement.append(i); requestAnimationFrame(() => { i.style.opacity = 1; i.style.transform = 'none'; }); }
      i.src = 'data:image/png;base64,${img}'; })()`);
  };
  const openPopup = async () => {
    await toolbarBtn();
    await click(W - 47, 37, { real: false });
    const { result } = await cdp('Target.createTarget', { url: 'about:blank', newWindow: true });
    let wsUrl = null;
    for (let k = 0; k < 40 && !wsUrl; k++) { await sleep(150); wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.id === result.targetId)?.webSocketDebuggerUrl; }
    P = await connect(wsUrl);
    P.targetId = result.targetId;
    await P.cdp('Page.enable');
    await P.cdp('Emulation.setDeviceMetricsOverride', { width: POP.w, height: 820, deviceScaleFactor: 2, mobile: false });
    // the popup asks for "the active tab": in this recording that is the bank page shown behind it
    await P.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const c = globalThis.chrome; if (!c || !c.tabs) return;
      const bank = async () => { const me = await c.tabs.getCurrent(); const all = await c.tabs.query({}); const t = all.find(x => !me || x.windowId !== me.windowId) || all[0]; return [{ ...t, url: 'https://safinum.cm/hackathon-test' }]; };
      const tabs = new Proxy(c.tabs, { get: (t, k) => k === 'query' ? (o => (o && o.active) ? bank() : c.tabs.query(o)) : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) });
      Object.defineProperty(globalThis, 'browser', { value: new Proxy(c, { get: (t, k) => k === 'tabs' ? tabs : t[k] }), configurable: true, writable: true });
      // the reload hint only appears because this popup is opened beside the page for filming
      document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '#reloadBox{display:none!important}'; document.head.append(st); }); })()` });
    await P.cdp('Page.navigate', { url: `chrome-extension://${extId}/src/popup.html` });
    await sleep(1300);
    await popShot();
  };
  const popPoint = async sel => { const r = await P.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    return r && { x: POP.x + r.x * POP.s, y: POP.y + r.y * POP.s }; };
  const popClick = async sel => { const p = await popPoint(sel); if (!p) { console.log('popup: not found', sel); return; } await moveTo(p.x, p.y, { real: false, ms: 600 }); await pressAnim();
    await P.ev(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(450); await popShot(); };
  const popSelect = async (sel, value) => { const p = await popPoint(sel); await moveTo(p.x, p.y, { real: false, ms: 600 }); await pressAnim();
    await P.ev(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); s.value = ${JSON.stringify(value)}; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(700); await popShot(); };
  const closePopup = async () => { await ev(`(() => { const i = document.getElementById('rec-pop'); if (i) { i.style.opacity = 0; setTimeout(() => i.remove(), 300); } })()`); await cdp('Target.closeTarget', { targetId: P.targetId }); P = null; await sleep(350); };

  // ================= record =================
  await cdp('Page.navigate', { url: TEST });
  await waitFor(`!!document.querySelector('h1,h2')`);
  await sleep(600);
  // the extension's first-run chooser is hidden for the opening (it comes back in the Fulfulde chapter)
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.visibility = 'hidden'; })()`);
  await card(`<div style="text-align:center">${LOGO}<div style="font-size:88px;font-weight:800;color:#1d1712;letter-spacing:-2px">Langwa</div><div style="font-size:34px;color:#4a3f35;margin-top:6px">Online banking, in your language.</div><div style="display:inline-flex;gap:12px;margin-top:30px"><span style="font-size:24px;font-weight:700;color:#fff;background:#1e7a4c;border-radius:99px;padding:9px 24px">Fulfulde</span><span style="font-size:24px;font-weight:700;color:#1d1712;background:#e3a21a;border-radius:99px;padding:9px 24px">Pidgin</span></div><div style="font-size:18px;color:#7a6c5e;margin-top:26px;letter-spacing:2px;text-transform:uppercase">SAFINUM Innovate Challenge 2026</div></div>`, false);
  t0 = Date.now();
  await cdp('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  await sleep(2300);
  await uncard();
  await sleep(500);

  // ---- 1. the problem ----
  await chapter('The bank page, in French'); mark('The bank page, in French');
  await narrate('intro', async () => {
    await caption('A real test bank page, in French. Langwa will not change it.');
    await moveTo(560, 430, { ms: 1100 });
    await sleep(1200);
    await moveTo(480, 640, { ms: 1100 });
  });

  // ---- 2. setup ----
  await cdp('Page.navigate', { url: `${SITE}/index.html` });
  await sleep(900);
  await ev(`document.getElementById('install').scrollIntoView({ block: 'start' }); scrollBy(0, -10)`);
  await sleep(400);
  await afterNav();
  await chapter('Setup · 1 of 3'); mark('Setup · 1 of 3');
  await caption('Download Langwa, then unzip it');
  await narrate('site', async () => {
    const d = await ev(`(() => { const b = document.querySelector('.install .tile[data-for="chromium"] .btn'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await moveTo(d.x, d.y, { ms: 900 });
    await pressAnim();
  });

  await cdp('Page.navigate', { url: 'edge://extensions' });
  await sleep(1300);
  await afterNav();
  await chapter('Setup · 2 of 3'); mark('Setup · 2 of 3');
  await caption('Extensions page → Developer mode → Load unpacked');
  await narrate('ext', async () => {
    await click(268, 1024);
    await sleep(700);
    // hide Langwa's card until "Load unpacked" is pressed, so it appears as it does after the real step
    const y = await ev(`(() => { const all = []; const walk = r => { for (const e of r.querySelectorAll('*')) { all.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document);
      const t = all.find(e => e.children.length === 0 && (e.textContent || '').trim() === 'Langwa'); return t ? t.getBoundingClientRect().top : null; })()`);
    if (y) await ev(`(() => { const d = document.createElement('div'); d.id = 'rec-hide'; d.style.cssText = 'position:fixed;left:370px;top:${Math.round(y - 30)}px;width:840px;height:170px;background:#fff;z-index:2147483640;transition:opacity .5s'; document.documentElement.append(d); })()`);
    await sleep(500);
    await click(889, 122, { real: false });
    await caption('Choose the unzipped <b>langwa-chromium</b> folder');
    await sleep(1200);
    await ev(`(() => { const d = document.getElementById('rec-hide'); if (d) { d.style.opacity = 0; } })()`);
    if (y) { await moveTo(470, y + 4, { ms: 700, real: false }); }
    await caption('Langwa is installed ✓');
  });

  await cdp('Page.navigate', { url: `${SITE}/index.html` });
  await sleep(900);
  await ev(`document.querySelector('.install .voice-tile').scrollIntoView({ block: 'center' })`);
  await sleep(300);
  await afterNav();
  await chapter('Setup · 3 of 3 (optional)');
  await caption('Natural voice: unzip, double-click <b>Start Langwa voice</b>. Then it works offline.');
  await narrate('voice', async () => {
    await ev(`(() => { const t = document.querySelector('.install .voice-tile'); t.style.transition = 'box-shadow .4s'; t.style.boxShadow = '0 0 0 4px #e3a21a, 0 18px 40px rgba(0,0,0,.12)'; })()`);
    const d = await ev(`(() => { const r = document.querySelector('.install .voice-tile ol li:nth-child(2)').getBoundingClientRect(); return { x: r.left + 60, y: r.top + r.height / 2 }; })()`);
    await moveTo(d.x, d.y, { ms: 900 });
    await sleep(1500);
    const b = await ev(`(() => { const r = document.querySelector('.install .voice-tile .btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await moveTo(b.x, b.y, { ms: 800 });
    await pressAnim();
  });

  // ---- 3. Fulfulde ----
  await cdp('Page.navigate', { url: TEST });
  await waitFor(`!!${R}?.querySelector('.lsearch')`);
  await sleep(500);
  await afterNav();
  await chapter('Fulfulde (Fulani)'); mark('Fulfulde (Fulani)');
  await caption('First visit: choose your language');
  await narrate('choose', async () => {
    const s = await lwEl('.lsearch');
    if (s) { await click(s.x, s.y); await typeText('fulani'); await sleep(700); }
    const p = await lwEl('.lang-btn:not([hidden])');
    if (p) await click(p.x, p.y);
    await waitFor(`!!${R}?.querySelector('.tcard')`);
    await caption('A short guide, with a Skip button');
    await sleep(900);
    { const n = await lwEl('.tnext'); if (n) await click(n.x, n.y); }
    await sleep(600);
  });
  { const sk = await lwEl('.tskip'); if (sk) await click(sk.x, sk.y); }
  await sleep(400);
  await closePanel();

  await caption('<b>Ctrl</b> + point at a text, then Listen');
  await narrate('ctrl', async () => { const p = await pageEl('^Solde disponible$'); if (p) await moveTo(p.x - 140, p.y + 70, { ms: 700 }); });
  await read('^Solde disponible$', 'Available balance', { lang: 'fub', ctrl: true });

  await caption('');
  await pressPage('^Effectuer un transfert$');
  await sleep(800);
  await chapter('Fulfulde · step 2: the charges');
  await read('^Choisissez le type de transfert', 'Choose the type of transfer and the amount. The charges are calculated automatically.', { lang: 'fub', ctrl: true });
  await caption('');
  await pressPage('^Continuer$');
  await sleep(800);
  await chapter('Fulfulde · step 3: who receives the money');
  await read('^Bénéficiaire$', 'Beneficiary: the person who receives the money', { lang: 'fub', ctrl: true });
  await ev(`(() => { const c = document.querySelector('input[type=checkbox]'); if (c && !c.checked) c.click(); })()`);
  await caption('');
  await pressPage('^Continuer$');
  await sleep(800);
  await chapter('Fulfulde · step 4: the summary');
  await read('^Total', 'Total to debit from your account', { lang: 'fub', ctrl: true });

  // changing the voice: the real settings page
  await cdp('Page.navigate', { url: `chrome-extension://${extId}/src/options.html` });
  console.log('  options:', extId, await waitFor(`!!document.getElementById('ttsVoice')`), await ev('location.href'));
  await ev(`document.body.style.zoom = 1.6; document.getElementById('ttsVoice').scrollIntoView({ block: 'center' })`);
  await sleep(300);
  await afterNav();
  await chapter('Changing the voice'); mark('Changing the voice');
  await caption('Settings → Voice → choose another voice → Save');
  await narrate('vchange', async () => {
    const v = await ev(`(() => { const r = document.getElementById('ttsVoice').getBoundingClientRect(); return { x: r.left + 140, y: r.top + r.height / 2 }; })()`);
    await click(v.x, v.y, { real: false });
    await ev(`(() => { const s = document.getElementById('ttsVoice'); s.value = 'default'; s.dispatchEvent(new Event('change', { bubbles: true })); s.style.outline = '3px solid #e3a21a'; })()`);
    await sleep(700);
    const b = await ev(`(() => { const r = document.getElementById('saveMt').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await click(b.x, b.y);
    await sleep(600);
  });
  await cdp('Page.navigate', { url: TEST });
  await waitFor(`!!${R}?.querySelector('.fab')`);
  await sleep(700);
  await afterNav();
  await chapter('Fulfulde · the other voice');
  await read('^Solde disponible$', 'Available balance', { lang: 'fub', ctrl: true, voice: 'default' });

  // ---- 4. Pidgin: the popup (language and Point mode) ----
  await chapter('Pidgin · the Langwa button'); mark('Pidgin · the Langwa button');
  await caption('Change the language, and how translations appear');
  await narrate('popup', async () => {
    await openPopup();
    await sleep(500);
    await popSelect('#lang', 'wes');
    await sleep(400);
    await popClick('#hover button[data-v="always"]');
    await sleep(500);
  });
  await closePopup();
  await moveTo(W / 2, 600, { ms: 500 });
  await chapter('Pidgin (Kamtok)'); mark('Pidgin (Kamtok)');
  await pressPage('^Effectuer un transfert$');
  await sleep(800);
  await chapter('Pidgin · step 2: the charges');
  await caption('Point mode: no key to hold');
  await sleep(500);
  await read('^Choisissez le type de transfert', 'Choose the type of transfer and the amount. The charges are calculated automatically.', { lang: 'pcm', ctrl: false });
  await caption('');
  await moveTo(W / 2, 980, { ms: 400 });
  await pressPage('^Continuer$');
  await sleep(1000);
  await chapter('Pidgin · step 3: who receives the money');
  await sleep(900);
  await ev(`(() => { const c = document.querySelector('input[type=checkbox]'); if (c && !c.checked) c.click(); })()`);
  await caption('');
  await moveTo(W / 2, 980, { ms: 400 });
  await pressPage('^Continuer$');
  await sleep(1000);
  await chapter('Pidgin · step 4: the summary');
  await caption('“How much will I pay?”');
  await narrate('ask', async () => {
    const fab = await lwEl('.fab');
    if (fab) await click(fab.x, fab.y);
    await sleep(800);
  });
  {
    const chip = await ev(`(() => { const c = [...${R}.querySelectorAll('.qchip')].find(e => /How much I go pay/.test(e.textContent)); if (!c) return null; c.scrollIntoView({ inline: 'center', block: 'nearest' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (chip) {
      await click(chip.x, chip.y);
      const ANS = `(() => { const all = [...${R}.querySelectorAll('.msg')]; const me = all.findIndex(m => m.classList.contains('me')); const a = me < 0 ? null : all.slice(me + 1).find(m => m.classList.contains('bot') && !m.classList.contains('pending')); return a ? a.querySelector('.mtext').textContent.trim() : ''; })()`;
      for (let k = 0; k < 40 && !(await ev(ANS)); k++) await sleep(150);
      await sleep(300);
      const ans = await ev(ANS);
      const amt = (ans.match(/\d[\d\s  .,]*\s*FCFA/) || [''])[0].trim();
      const meaning = amt ? `All the money that will leave your account is ${amt}.` : ans;
      await caption(`<span style="opacity:.75;font-weight:500">Pidgin:</span> “${meaning}”`);
      if (ans) await play(ans, 'pcm');
      console.log('  answer:', ans);
    } else console.log('no amount chip');
  }
  await closePanel();

  // ---- 5. a new message, added after the page loaded (as the jury does) ----
  await chapter('A new message, never seen before'); mark('A new message, never seen before');
  await caption('');
  await narrate('alert', async () => {
    await moveTo(W / 2, 260, { ms: 500 });
    await ev(`(() => { const box = document.createElement('div'); box.setAttribute('role', 'alert');
      box.style.cssText = 'margin:16px auto;max-width:1100px;padding:14px 18px;border-radius:12px;background:#fdecea;color:#8a1c12;border:1px solid #f3b5ad;font:600 17px system-ui';
      box.textContent = "Alerte de sécurité : un transfert de 150 000 FCFA vers un nouveau bénéficiaire a été bloqué. Ne communiquez jamais votre code secret.";
      (document.querySelector('main') || document.body).prepend(box); scrollTo({ top: 0 }); })()`);
    await caption('Added after the page loaded: Langwa catches it at once');
    await sleep(1600);
    const toast = await lwEl('.toast');
    if (toast) await moveTo(toast.x, toast.y, { ms: 700 });
    await sleep(1500);
    const msg = await pageEl('^Alerte de sécurité');
    if (msg) await moveTo(msg.x, msg.y, { ms: 800 });
    await sleep(900);
    await caption('The amount, <b>150 000 FCFA</b>, is locked: it can never change');
  });

  // ---- 6. protection of amounts ----
  await cdp('Page.navigate', { url: `chrome-extension://${extId}/src/options.html` });
  await waitFor(`!!document.getElementById('probe')`);
  await ev(`document.body.style.zoom = 1.45; document.getElementById('probe').scrollIntoView({ block: 'start' }); scrollBy(0, -120)`);
  await sleep(300);
  await afterNav();
  await chapter('Amounts and names are protected'); mark('Amounts and names are protected');
  await caption('Locked before translation, checked after');
  await narrate('locked', async () => {
    const pr = await ev(`(() => { const r = document.getElementById('probe').getBoundingClientRect(); return { x: r.left + 60, y: r.top + r.height / 2 }; })()`);
    await click(pr.x, pr.y);
    await ev(`document.getElementById('probe').value = ''`);
    await typeText('Vous allez envoyer 25 000 FCFA à Jean-Paul Mbarga.');
    const run = await ev(`(() => { const r = document.getElementById('run').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await click(run.x, run.y);
    await sleep(700);
    await ev(`document.getElementById('out').scrollIntoView({ block: 'end' }); scrollBy(0, 60)`);
    const o = await ev(`(() => { const r = document.getElementById('out').getBoundingClientRect(); return { x: r.left + 120, y: r.top + 40 }; })()`);
    await moveTo(o.x, o.y, { ms: 700 });
    await caption('Integrity check: OK. Nothing is sent anywhere.');
  });

  // ---- 7. the other languages and the speakers ----
  await cdp('Page.navigate', { url: `${SITE}/index.html` });
  await sleep(900);
  await ev(`document.getElementById('languages').scrollIntoView({ block: 'start' })`);
  await sleep(300);
  await afterNav();
  await chapter('Nine languages'); mark('Nine languages');
  await caption('Fulfulde and Pidgin today · seven more on the way');
  await narrate('others', async () => {
    await moveTo(W / 2, H / 2, { ms: 700 });
    await sleep(2200);
    await cdp('Page.navigate', { url: `${SITE}/contribute/index.html` });
    await sleep(900);
    await afterNav();
    await caption('Native speakers translate on their phone, and send on WhatsApp');
  });

  await chapter('');
  await caption('');
  await card(`<div style="text-align:center">${LOGO}<div style="font-size:88px;font-weight:800;color:#1d1712;letter-spacing:-2px">Langwa</div><div style="font-size:34px;color:#4a3f35;margin-top:8px">Online banking, in your language.</div><div style="font-size:22px;color:#4a3f35;margin-top:30px">Fulfulde · Pidgin · Ewondo · Duala · Basaá · Ghomálá' · Lamnso' · Mankon · Kom</div><div style="font-size:18px;color:#7a6c5e;margin-top:26px;letter-spacing:2px;text-transform:uppercase">Built for the <b style="color:#1d1712">SAFINUM Innovate Challenge</b></div></div>`);
  await narrate('end');
  await sleep(1200);

  await cdp('Page.stopScreencast');
  timeline.end = now();
  writeFileSync(join(out, 'timeline.json'), JSON.stringify(timeline, null, 1));
  console.log(`recorded ${(timeline.end / 1000).toFixed(1)} s, ${timeline.frames.length} frames, ${timeline.cues.length} audio cues`);
} catch (err) {
  console.log('ERROR', err.stack || err.message);
  timeline.end = now();
  writeFileSync(join(out, 'timeline.json'), JSON.stringify(timeline, null, 1));
} finally {
  browser.kill();
}
