// Records the Langwa demo for one language: a clean Edge with the built extension on the SAFINUM
// test page, driven like a user (pointer, Ctrl+hover, clicks, typing), with captions, a title card
// and an end card. Narration and the national-language audio come from the local offline voice
// (http://127.0.0.1:8770). Writes frames + a timeline that make.mjs turns into an mp4.
//   node record.mjs <extension dir> <profile dir> <out dir> <site dir> <wes|fub>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [ext, profile, out, siteDir, langCode = 'wes'] = process.argv.slice(2);
const L = {
  wes: { search: 'pidgin', title: 'Pidgin (Kamtok)', voice: 'pcm', short: 'Pidgin' },
  fub: { search: 'peul', title: 'Fulfulde (Peul / Fulani)', voice: 'fub', short: 'Fulfulde' },
}[langCode];
const FRAMES = join(out, 'frames');
const AUDIO = join(out, 'audio');
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(AUDIO, { recursive: true });
const W = 1920, H = 1080;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TEST = 'https://safinum.cm/hackathon-test';
const SITE = `file:///${siteDir.replace(/\\/g, '/')}`;

async function tts(text, lang, file) {
  for (let k = 0; k < 3; k++) {
    const r = await fetch('http://127.0.0.1:8770/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang, voice: lang === 'eng' ? 'default' : 'female' }) });
    if (r.ok) {
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

const NARRATION = {
  s1: `Many Cameroonians read ${L.short} more easily than French. In a banking app, one misread word, a fee or a beneficiary, can cost money. This is Langwa.`,
  s2: 'Langwa is a browser extension. It reads the bank page and never changes it: no code, no form, no request is touched. You pick your language once, and a short guide shows you around.',
  s3: 'Point at any text and the translation appears right under it. Press listen, and a natural voice reads it, offline. The assistant explains each step of the transfer: the balance, the charges, the person who receives the money, and the summary to check before confirming.',
  s4: 'When a new message appears, even one Langwa has never seen, it is detected at once. Warnings come first, amounts stay exact, and without a validated translation, Langwa says clearly what kind of message it is instead of guessing.',
  s5: 'Amounts, fees, names and references are locked before any translation and checked after. If a translation changed a single digit, it would be blocked. Everything runs on this computer: no account, and nothing displayed is sent anywhere.',
  s6: 'Translate the whole page at once, on a computer or a phone. Native speakers add and check translations from their phone, so every language keeps improving.',
  s7: 'Pidgin and Fulfulde today, seven more languages in progress, validated by native speakers. Free, documented, and ready to install. Langwa: online banking, in your language.',
};

const PORT = 9500 + Math.floor(Math.random() * 90);
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  `--load-extension=${ext}`, '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const timeline = { scenes: [], cues: [], frames: [] };
let t0 = 0;
const now = () => Date.now() - t0;

try {
  await fetch('http://127.0.0.1:8770/wake', { method: 'POST' }).catch(() => {});
  for (let k = 0; k < 120; k++) { const h = await fetch('http://127.0.0.1:8770/health').then(r => r.json()).catch(() => ({})); if (h.status === 'ready') break; await sleep(1000); }
  const narr = {};
  for (const [k, text] of Object.entries(NARRATION)) { narr[k] = await tts(text, 'eng', `${k}.wav`); console.log(`narration ${k}: ${narr[k].sec.toFixed(1)} s`); }

  let targets = null;
  for (let k = 0; k < 40 && !targets; k++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { /* starting */ } }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const wait = new Map();
  let frameNo = 0;
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.screencastFrame') {
      const f = `f${String(++frameNo).padStart(6, '0')}.jpg`;
      writeFileSync(join(FRAMES, f), Buffer.from(m.params.data, 'base64'));
      timeline.frames.push({ f, t: now() });
      ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: m.params.sessionId } }));
      return;
    }
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
  };
  const cdp = (method, params = {}) => new Promise(r => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async x => (await cdp('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const R = `document.querySelector('langwa-root')?.shadowRoot`;
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

  // ---------- recorder overlay: pointer, Ctrl badge, caption, cards (not part of Langwa) ----------
  let cur = { x: W / 2, y: H / 2 };
  const overlay = async () => ev(`(() => {
    if (document.getElementById('rec-cursor')) return;
    const c = document.createElement('div'); c.id = 'rec-cursor';
    c.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 2l14 9-6.5 1.5L15 20l-3 1.5-2.6-7.6L4 18z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '${cur.x}px', top: '${cur.y}px', zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))', transition: 'transform .12s' });
    const k = document.createElement('div'); k.id = 'rec-kbd'; k.textContent = 'Ctrl';
    Object.assign(k.style, { position: 'fixed', zIndex: 2147483647, pointerEvents: 'none', font: '700 15px system-ui', color: '#1d1712', background: '#f6dfa6', border: '1px solid #b7800f', borderRadius: '6px', padding: '2px 7px', display: 'none' });
    const cap = document.createElement('div'); cap.id = 'rec-cap';
    Object.assign(cap.style, { position: 'fixed', left: '50%', bottom: '30px', transform: 'translateX(-50%)', maxWidth: '1150px', zIndex: 2147483646, pointerEvents: 'none', background: 'rgba(20,14,10,.88)', color: '#fff', font: '600 27px/1.35 Segoe UI, system-ui', padding: '14px 26px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.3)', display: 'none' });
    document.documentElement.append(c, k, cap);
  })()`);
  const caption = async text => { await overlay(); await ev(`(() => { const c = document.getElementById('rec-cap'); c.textContent = ${JSON.stringify(text || '')}; c.style.display = ${text ? "'block'" : "'none'"}; })()`); };
  const card = (html, fadeIn = true) => ev(`(() => { const d = document.createElement('div'); d.id = 'rec-card'; d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:linear-gradient(180deg,#c7ebe6,#e4f3e8 45%,#f8efd9);font-family:Segoe UI,system-ui;opacity:${fadeIn ? 0 : 1};transition:opacity .6s';
    d.innerHTML = ${JSON.stringify(html)}; document.documentElement.append(d); requestAnimationFrame(() => { d.style.opacity = 1; }); })()`);
  const uncard = () => ev(`(() => { const d = document.getElementById('rec-card'); if (!d) return; d.style.opacity = 0; setTimeout(() => d.remove(), 650); })()`);
  const LOGO = '<div style="width:96px;height:96px;margin:0 auto 22px;border-radius:28px;background:#e3a21a;display:grid;place-items:center;box-shadow:0 10px 0 #b7800f"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1d1712" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg></div>';
  const moveTo = async (x, y, { ctrl = false, ms = 650 } = {}) => {
    await overlay();
    const steps = Math.max(8, Math.round(ms / 30));
    const from = { ...cur };
    for (let i = 1; i <= steps; i++) {
      const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      cur = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cur.x, y: cur.y, modifiers: ctrl ? 2 : 0 });
      await ev(`(() => { const c = document.getElementById('rec-cursor'); c.style.left = '${cur.x - 4}px'; c.style.top = '${cur.y - 2}px';
        const k = document.getElementById('rec-kbd'); k.style.display = ${ctrl ? "'block'" : "'none'"}; k.style.left = '${cur.x + 24}px'; k.style.top = '${cur.y + 24}px'; })()`);
      await sleep(Math.round(ms / steps));
    }
  };
  const click = async (x, y) => {
    await moveTo(x, y);
    await ev(`document.getElementById('rec-cursor').style.transform = 'scale(.82)'`);
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(140);
    await ev(`document.getElementById('rec-cursor').style.transform = ''`);
  };
  const typeText = async text => { for (const ch of text) { await cdp('Input.insertText', { text: ch }); await sleep(60); } };
  const FIND = `(re, sel) => [...document.querySelectorAll(sel)].filter(e => e.children.length <= 3 && e.getClientRects().length && re.test((e.textContent || '').trim()) && !e.closest('#rec-cap'))
    .sort((a, b) => a.textContent.length - b.textContent.length)[0]`;
  const pageEl = (re, sel = 'h1,h2,h3,p,span,div,label,b,strong,button,a,td,dt,dd') => ev(`(() => {
    const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), ${JSON.stringify(sel)});
    if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 90), y: r.top + r.height / 2 };
  })()`);
  // a page button: the pointer goes there and presses it (the element is also clicked directly, which is what the press does)
  const pressPage = async re => {
    const p = await pageEl(re, 'button,a');
    if (!p) { console.log('not found:', re); return false; }
    await click(p.x, p.y);
    await ev(`(() => { const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), 'button,a'); if (el) el.click(); })()`);
    return true;
  };
  const lwEl = sel => ev(`(() => { const e = ${R}?.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`);
  const waitFor = async (expr, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(250); } return false; };
  const hover = async re => { const p = await pageEl(re); if (!p) { console.log('not found:', re); return false; } await moveTo(p.x, p.y, { ctrl: true, ms: 800 }); await sleep(900); await moveTo(p.x + 2, p.y + 1); return true; };
  const closePanel = async () => { const c = await lwEl('.panel.show .ph > .icon-btn:last-child'); if (c) await click(c.x, c.y); await sleep(300); };
  const say = async (text, lang, name) => { const a = await tts(text, lang, `${name}.wav`); timeline.cues.push({ file: a.file, t: now(), sec: a.sec }); return a; };
  const scene = async (key, cap, run) => {
    const start = now();
    timeline.scenes.push({ key, t: start, file: narr[key].file, sec: narr[key].sec });
    await caption(cap);
    await run();
    const left = narr[key].sec * 1000 + 800 - (now() - start);
    if (left > 0) await sleep(left);
    console.log(`scene ${key}: ${((now() - start) / 1000).toFixed(1)} s`);
  };

  // ---------- record ----------
  await cdp('Page.navigate', { url: TEST });
  await waitFor(`!!document.querySelector('h1,h2')`);
  await sleep(400);
  await card(`<div style="text-align:center">${LOGO}<div style="font-size:84px;font-weight:800;color:#1d1712;letter-spacing:-2px">Langwa</div><div style="font-size:32px;color:#4a3f35;margin-top:6px">Online banking, in your language.</div><div style="display:inline-block;margin-top:28px;font-size:26px;font-weight:700;color:#fff;background:#1e7a4c;border-radius:99px;padding:10px 26px">Demo · ${L.title}</div><div style="font-size:18px;color:#7a6c5e;margin-top:26px;letter-spacing:2px;text-transform:uppercase">SAFINUM Innovate Challenge 2026</div></div>`, false);
  t0 = Date.now();
  await cdp('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  await sleep(2600);
  await uncard();
  await sleep(700);

  await scene('s1', 'A real bank page, in French, unchanged', async () => {
    await overlay();
    await moveTo(520, 420, { ms: 900 });
    await sleep(1400);
    await moveTo(430, 640, { ms: 900 });
    await waitFor(`!!${R}?.querySelector('.lang-btn')`);
  });

  await scene('s2', 'Langwa reads the page and never changes it', async () => {
    const s = await lwEl('.lsearch');
    if (s) { await click(s.x, s.y); await typeText(L.search); await sleep(800); }
    const p = await lwEl('.lang-btn:not([hidden])');
    if (p) await click(p.x, p.y);
    await waitFor(`!!${R}?.querySelector('.tcard')`);
    await sleep(1800);
    for (let i = 0; i < 4; i++) { const n = await lwEl('.tnext'); if (n) await click(n.x, n.y); await sleep(1500); }
    await sleep(2000); // the voice step: "Natural voice ready"
    const sk = await lwEl('.tskip');
    if (sk) await click(sk.x, sk.y);
    await sleep(500);
    await closePanel();
  });

  await scene('s3', 'Point at a text: the translation appears under it', async () => {
    await hover('^Solde disponible$');
    const sayBtn = await lwEl('.tip.show .say');
    if (sayBtn) {
      await click(sayBtn.x, sayBtn.y);
      const txt = await ev(`${R}.querySelector('.tip.show .tr')?.textContent || ''`);
      if (txt) await say(txt, L.voice, 'clip-balance');
      await sleep(2600);
    }
    await moveTo(960, 900, { ms: 500 });
    await caption('Step 2: the charges');
    await pressPage('^Effectuer un transfert$');
    await sleep(1500);
    await hover('^Choisissez le type de transfert');
    await sleep(2000);
    await caption('Ask the assistant about the page');
    const fab = await lwEl('.fab');
    if (fab) await click(fab.x, fab.y);
    await sleep(900);
    const chip = await lwEl('.qchip');
    if (chip) {
      await click(chip.x, chip.y);
      await sleep(1500);
      const ans = await ev(`[...${R}.querySelectorAll('.msg.bot .mtext')].pop()?.textContent || ''`);
      if (ans) await say(ans, L.voice, 'clip-answer');
      await sleep(5500);
    }
    await closePanel();
    await caption('Step 3: who receives the money');
    await pressPage('^Continuer$');
    await sleep(1500);
    await hover('^Nom du bénéficiaire|^Bénéficiaire$');
    await sleep(1800);
    await ev(`(() => { const c = document.querySelector('input[type=checkbox]'); if (c && !c.checked) c.click(); })()`);
    await caption('Step 4: the summary, checked before confirming');
    await pressPage('^Continuer$');
    await sleep(1500);
    await hover('^Total');
    await sleep(2200);
  });

  await scene('s4', 'A new message, added after the page loaded', async () => {
    await moveTo(W / 2, 260, { ms: 500 });
    // As the jury does: inject a message the glossary has never seen.
    await ev(`(() => { const box = document.createElement('div'); box.setAttribute('role', 'alert');
      box.style.cssText = 'margin:16px auto;max-width:1100px;padding:14px 18px;border-radius:12px;background:#fdecea;color:#8a1c12;border:1px solid #f3b5ad;font:600 17px system-ui';
      box.textContent = "Alerte de sécurité : un transfert de 150 000 FCFA vers un nouveau bénéficiaire a été bloqué. Ne communiquez jamais votre code secret.";
      (document.querySelector('main') || document.body).prepend(box); scrollTo({ top: 0 }); })()`);
    await sleep(2600);
    const toast = await lwEl('.toast');
    if (toast) await moveTo(toast.x, toast.y, { ms: 700 });
    await sleep(3200);
    const msg = await pageEl('^Alerte de sécurité');
    if (msg) { await moveTo(msg.x, msg.y, { ctrl: true, ms: 800 }); await sleep(2600); }
  });

  await scene('s5', 'Amounts and names are locked, then checked', async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const extId = list.map(t => t.url).join(' ').match(/chrome-extension:\/\/([a-p]{32})/)?.[1];
    await cdp('Page.navigate', { url: `chrome-extension://${extId}/src/options.html` });
    await waitFor(`!!document.getElementById('probe')`);
    await ev(`document.getElementById('probe').scrollIntoView({ block: 'start' }); scrollBy(0, -160)`);
    await sleep(400);
    await overlay();
    await caption('Amounts and names are locked, then checked');
    const pr = await ev(`(() => { const r = document.getElementById('probe').getBoundingClientRect(); return { x: r.left + 60, y: r.top + r.height / 2 }; })()`);
    await click(pr.x, pr.y);
    await ev(`document.getElementById('probe').value = ''`);
    await typeText('Vous allez envoyer 25 000 FCFA à Jean-Paul Mbarga.');
    const run = await ev(`(() => { const r = document.getElementById('run').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await click(run.x, run.y);
    await sleep(900);
    await ev(`document.getElementById('out').scrollIntoView({ block: 'center' })`);
    const o = await ev(`(() => { const r = document.getElementById('out').getBoundingClientRect(); return { x: r.left + 120, y: r.top + 40 }; })()`);
    await moveTo(o.x, o.y, { ms: 700 });
    await sleep(4000);
  });

  await scene('s6', `The whole page in ${L.short}, and speakers keep improving it`, async () => {
    await cdp('Page.navigate', { url: TEST });
    await waitFor(`!!${R}?.querySelector('.fab')`);
    await overlay();
    await caption(`The whole page in ${L.short}`);
    await sleep(700);
    const fab = await lwEl('.fab');
    if (fab) await click(fab.x, fab.y);
    await sleep(700);
    const pb = await lwEl('.ph .icon-btn');
    if (pb) await click(pb.x, pb.y);
    await sleep(1600);
    await closePanel();
    await sleep(2400);
    await cdp('Page.navigate', { url: `${SITE}/contribute/index.html#${langCode}` });
    await sleep(1500);
    await overlay();
    await caption('Native speakers translate on their phone and send on WhatsApp');
    await sleep(2400);
  });

  await scene('s7', 'Langwa: online banking, in your language', async () => {
    await cdp('Page.navigate', { url: `${SITE}/index.html` });
    await sleep(1500);
    await overlay();
    await caption('');
    const opt = await ev(`(() => { const e = document.querySelector('#langList .popt[data-v="${langCode}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (opt) await click(opt.x, opt.y);
    await sleep(3000);
    await card(`<div style="text-align:center">${LOGO}<div style="font-size:88px;font-weight:800;color:#1d1712;letter-spacing:-2px">Langwa</div><div style="font-size:34px;color:#4a3f35;margin-top:8px">Online banking, in your language.</div><div style="font-size:22px;color:#4a3f35;margin-top:30px">Pidgin · Fulfulde · Ewondo · Duala · Basaá · Ghomálá' · Lamnso' · Mankon · Kom</div><div style="font-size:18px;color:#7a6c5e;margin-top:26px;letter-spacing:2px;text-transform:uppercase">Built for the <b style="color:#1d1712">SAFINUM Innovate Challenge</b></div></div>`);
    await sleep(3800);
  });

  await cdp('Page.stopScreencast');
  timeline.end = now();
  writeFileSync(join(out, 'timeline.json'), JSON.stringify(timeline, null, 1));
  console.log(`recorded ${(timeline.end / 1000).toFixed(1)} s, ${timeline.frames.length} frames, ${timeline.cues.length} voice cues`);
  ws.close();
} catch (err) {
  console.log('ERROR', err.stack || err.message);
} finally {
  browser.kill();
}
