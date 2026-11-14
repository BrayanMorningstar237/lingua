// Takes the screenshots used in the submission documents (docs/screenshots/*.png), in a clean
// Edge profile with the built extension, on the SAFINUM test page. Reproducible.
//   node tools/docs-shots.mjs <unzipped extension dir> <empty profile dir>
// The offline voice should be running (http://127.0.0.1:8770) so the panel shows it as ready.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots');
mkdirSync(OUT, { recursive: true });
const [ext, profile] = process.argv.slice(2);
const W = 1440, H = 900;
const TEST = 'https://safinum.cm/hackathon-test';
const SITE = 'file:///' + join(ROOT, 'collect').replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PORT = 9300 + Math.floor(Math.random() * 90);
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, `--load-extension=${ext}`, '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', '--lang=en-US', 'about:blank'], { stdio: 'ignore' });

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const wait = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise(r => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async x => (await cdp('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
  return { ws, cdp, ev };
}

try {
  let targets = null;
  for (let k = 0; k < 40 && !targets; k++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { /* starting */ } }
  let extId = null;
  for (let k = 0; k < 40 && !extId; k++) { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); extId = l.map(x => x.url).find(u => u.endsWith('/src/background.js'))?.split('/')[2]; if (!extId) await sleep(250); }
  const { cdp, ev } = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const R = `document.querySelector('langwa-root')?.shadowRoot`;
  const shot = async (name, clip) => {
    const r = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 }, captureBeyondViewport: true } : {}) });
    writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64'));
    console.log('saved', name);
  };
  const waitFor = async (expr, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(250); } return false; };
  const FIND = `(re, sel) => [...document.querySelectorAll(sel)].filter(e => e.children.length <= 3 && e.getClientRects().length && re.test((e.textContent || '').trim())).sort((a, b) => a.textContent.length - b.textContent.length)[0]`;
  const at = re => ev(`(() => { const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), 'h1,h2,h3,p,span,div,label,b,strong,button,a,td,dt,dd'); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 90), y: r.top + r.height / 2 }; })()`);
  const press = re => ev(`(() => { const el = (${FIND})(new RegExp(${JSON.stringify(re)}, 'i'), 'button,a'); if (el) { el.click(); return true; } return false; })()`);
  const hover = async (re, ctrl) => {
    const p = await at(re); if (!p) { console.log('not found', re); return; }
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x - 30, y: p.y, modifiers: ctrl ? 2 : 0 });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, modifiers: ctrl ? 2 : 0 });
    await waitFor(`!!${R}.querySelector('.tip.show')`, 4000); await sleep(600);
  };
  const lwClick = sel => ev(`(() => { const e = ${R}?.querySelector(${JSON.stringify(sel)}); if (e) { e.click(); return true; } return false; })()`);
  const away = () => cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: H - 5 });

  // 1. the bank page as it is (Langwa hidden): what the user sees without help
  await cdp('Page.navigate', { url: TEST });
  await waitFor(`!!document.querySelector('h1,h2')`); await sleep(1500);
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.visibility = 'hidden'; })()`);
  await shot('01-bank-page-original.png');
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.visibility = ''; })()`);

  // 2. first visit: choose a language (search "fulani")
  await waitFor(`!!${R}?.querySelector('.lsearch')`);
  await ev(`(() => { const s = ${R}.querySelector('.lsearch'); s.focus(); s.value = 'fulani'; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(700);
  await shot('02-language-chooser.png');
  await lwClick('.lang-btn:not([hidden])');
  await waitFor(`!!${R}?.querySelector('.tcard')`); await sleep(1200);
  await shot('03-guided-tour.png');
  await lwClick('.tskip'); await sleep(500);
  await lwClick('.panel.show .ph > .icon-btn:last-child'); await sleep(400);

  // 3. Ctrl + point: Fulfulde card with Listen
  await hover('^Solde disponible$', true);
  await shot('04-fulfulde-card-balance.png');
  await away(); await sleep(300);

  // 4. the transaction steps in Fulfulde
  await press('^Effectuer un transfert$'); await sleep(1500);
  await hover('^Choisissez le type de transfert', true);
  await shot('05-fulfulde-card-fees.png');
  await away();

  // 5. the popup: language and display mode (the real popup page, shown at its own size)
  const { result } = await cdp('Target.createTarget', { url: 'about:blank', newWindow: true });
  let popUrl = null;
  for (let k = 0; k < 40 && !popUrl; k++) { await sleep(150); popUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.id === result.targetId)?.webSocketDebuggerUrl; }
  const P = await connect(popUrl);
  await P.cdp('Page.enable');
  await P.cdp('Emulation.setDeviceMetricsOverride', { width: 360, height: 820, deviceScaleFactor: 2, mobile: false });
  await P.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const c = globalThis.chrome; if (!c || !c.tabs) return;
    const bank = async () => { const me = await c.tabs.getCurrent(); const all = await c.tabs.query({}); const t = all.find(x => !me || x.windowId !== me.windowId) || all[0]; return [{ ...t, url: '${TEST}' }]; };
    const tabs = new Proxy(c.tabs, { get: (t, k) => k === 'query' ? (o => (o && o.active) ? bank() : c.tabs.query(o)) : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) });
    Object.defineProperty(globalThis, 'browser', { value: new Proxy(c, { get: (t, k) => k === 'tabs' ? tabs : t[k] }), configurable: true, writable: true });
    document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '#reloadBox{display:none!important}'; document.head.append(st); }); })()` });
  await P.cdp('Page.navigate', { url: `chrome-extension://${extId}/src/popup.html` });
  await sleep(1500);
  await P.ev(`(() => { const s = document.getElementById('lang'); s.value = 'wes'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(600);
  await P.ev(`document.querySelector('#hover button[data-v="always"]').click()`);
  await sleep(800);
  const ph = Math.min(820, await P.ev('document.documentElement.scrollHeight'));
  writeFileSync(join(OUT, '06-popup.png'), Buffer.from((await P.cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 360, height: ph, scale: 1 } })).result.data, 'base64'));
  console.log('saved 06-popup.png');
  await cdp('Target.closeTarget', { targetId: result.targetId });

  // 6. Pidgin, Point mode (no key): the fees instruction
  await sleep(800);
  await hover('^Choisissez le type de transfert', false);
  await shot('07-pidgin-card-fees.png');
  await away();

  // 7. the panel: whole page in Pidgin
  await lwClick('.fab'); await sleep(800);
  await lwClick('.ph .icon-btn'); await sleep(2000);
  await lwClick('.panel.show .ph > .icon-btn:last-child'); await sleep(1200);
  await shot('08-whole-page-pidgin.png');
  await lwClick('.ph .icon-btn').catch(() => {});
  await cdp('Page.navigate', { url: TEST }); await waitFor(`!!${R}?.querySelector('.fab')`); await sleep(1200);

  // 8. summary step + assistant answer
  await press('^Effectuer un transfert$'); await sleep(1200);
  await press('^Continuer$'); await sleep(1200);
  await ev(`(() => { const c = document.querySelector('input[type=checkbox]'); if (c && !c.checked) c.click(); })()`);
  await press('^Continuer$'); await sleep(1500);
  await lwClick('.fab'); await sleep(900);
  await ev(`[...${R}.querySelectorAll('.qchip')].find(e => /How much I go pay/.test(e.textContent))?.click()`);
  await waitFor(`(() => { const all = [...${R}.querySelectorAll('.msg')]; const me = all.findIndex(m => m.classList.contains('me')); return me >= 0 && all.slice(me + 1).some(m => m.classList.contains('bot') && !m.classList.contains('pending')); })()`, 8000);
  await sleep(600);
  await shot('09-assistant-answer.png');
  await lwClick('.panel.show .ph > .icon-btn:last-child'); await sleep(400);

  // 9. a new message added after load (as the jury does)
  await ev(`(() => { const box = document.createElement('div'); box.setAttribute('role', 'alert');
    box.style.cssText = 'margin:16px auto;max-width:1100px;padding:14px 18px;border-radius:12px;background:#fdecea;color:#8a1c12;border:1px solid #f3b5ad;font:600 17px system-ui';
    box.textContent = "Alerte de sécurité : un transfert de 150 000 FCFA vers un nouveau bénéficiaire a été bloqué. Ne communiquez jamais votre code secret.";
    (document.querySelector('main') || document.body).prepend(box); scrollTo({ top: 0 }); })()`);
  await sleep(2500);
  await shot('10-new-message-alert.png');
  await hover('^Alerte de sécurité', false);
  await shot('11-new-message-card.png');
  await away();

  // 10. settings page: purpose, then the safety test result
  await cdp('Page.navigate', { url: `chrome-extension://${extId}/src/options.html` });
  await waitFor(`!!document.getElementById('probe')`); await sleep(1500);
  await shot('12-settings-page.png');
  await ev(`document.getElementById('run').click()`); await sleep(900);
  const y = await ev(`Math.round(document.getElementById('securite').getBoundingClientRect().top + scrollY) - 10`);
  const hh = await ev(`Math.round(document.getElementById('securite').getBoundingClientRect().height) + 20`);
  await shot('13-safety-test.png', { x: 0, y, width: W, height: Math.min(hh, 900) });

  // 11. website and contribution page
  await cdp('Page.navigate', { url: `${SITE}/index.html` }); await sleep(2000);
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.display = 'none'; })()`);
  await shot('14-website.png');
  await cdp('Page.navigate', { url: `${SITE}/index.html#voice-setup` }); await sleep(1500);
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.display = 'none'; document.getElementById('voice-setup').scrollIntoView({ block: 'center' }); })()`); await sleep(400);
  await shot('15-website-install.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: `${SITE}/contribute/index.html` }); await sleep(1800);
  await ev(`(() => { const r = document.querySelector('langwa-root'); if (r) r.style.display = 'none'; })()`);
  await shot('16-contribute-phone.png');
} catch (err) {
  console.log('ERROR', err.stack || err.message);
} finally {
  browser.kill();
}
