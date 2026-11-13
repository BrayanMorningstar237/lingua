// Lists the texts Langwa leaves untranslated on each step of the SAFINUM test page (FR and EN).
import { spawn } from 'node:child_process';

const [ext, profile, lang = 'wes'] = process.argv.slice(2);
const PORT = 9700 + Math.floor(Math.random() * 90);
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--load-extension=${ext}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  let wsUrl = null;
  for (let k = 0; k < 40 && !wsUrl; k++) { await sleep(250); try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* starting */ } }
  const ws = new WebSocket(wsUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const wait = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise(r => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async x => (await cdp('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const R = `document.querySelector('langwa-root')?.shadowRoot`;
  const click = t => ev(`(() => { const el = [...document.querySelectorAll('button,a')].find(e => e.getClientRects().length && (e.textContent || '').trim().replace(/\\s+/g, ' ') === ${JSON.stringify(t)}); if (el) { el.click(); return true; } return false; })()`);
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: 'https://safinum.cm/hackathon-test' });
  for (let k = 0; k < 30 && !(await ev(`!!${R}?.querySelector('.lang-btn')`)); k++) await sleep(500);
  await ev(`[...${R}.querySelectorAll('.lang-btn')].find(b => b.dataset ? true : true) && [...${R}.querySelectorAll('.lang-btn')].find(b => /${lang === 'fub' ? 'Fulfulde' : 'Pidgin'}/.test(b.textContent)).click()`);
  for (let k = 0; k < 30 && !(await ev(`!!${R}?.querySelector('.tskip')`)); k++) await sleep(300);
  await ev(`${R}.querySelector('.tskip')?.click()`);
  await sleep(500);
  const missing = async label => {
    await sleep(1500);
    if (!(await ev(`${R}.querySelector('.panel.show')`))) await ev(`${R}.querySelector('.fab').click()`);
    await sleep(400);
    await ev(`${R}.querySelector('.tab[data-tab="list"]').click()`);
    await sleep(900);
    const items = await ev(`[...${R}.querySelectorAll('.list .block')].filter(b => b.querySelector('.pill.none')).map(b => (b.querySelector('.tr') || b).textContent.trim().replace(/\\s+/g, ' '))`);
    console.log(`\n== ${label}: ${items.length} untranslated`);
    for (const t of items) console.log('  - ' + t);
  };
  for (const pageLang of ['FR', 'EN']) {
    if (pageLang === 'EN') { await cdp('Page.navigate', { url: 'https://safinum.cm/hackathon-test' }); await sleep(3000); await click('EN'); await sleep(1500); }
    await missing(`${pageLang} balance`);
    await click(pageLang === 'FR' ? 'Effectuer un transfert' : 'Make a transfer') || await click('Perform a transfer'); await missing(`${pageLang} fees`);
    await click(pageLang === 'FR' ? 'Continuer' : 'Continue'); await missing(`${pageLang} beneficiary`);
    await ev(`(() => { const c = document.querySelector('input[type=checkbox]'); if (c && !c.checked) c.click(); })()`);
    await click(pageLang === 'FR' ? 'Continuer' : 'Continue'); await missing(`${pageLang} summary`);
    await ev(`(() => { const c = [...document.querySelectorAll('input[type=checkbox]')].find(x => !x.checked); if (c) c.click(); })()`);
    const ok = await ev(`(() => { const el = [...document.querySelectorAll('button')].filter(e => e.getClientRects().length).find(e => /Confirmer|Confirm/i.test(e.textContent)); if (el) { el.click(); return el.textContent.trim(); } return null; })()`);
    console.log('confirm button:', ok);
    await missing(`${pageLang} receipt`);
  }
  ws.close();
} catch (err) { console.log('ERROR', err.stack || err.message); } finally { browser.kill(); }
