// Builds every distributable from browser-extension/ (no dependencies):
//   dist/langwa-chromium.zip   Chrome, Edge, Brave, Opera (Web Store upload or "Load unpacked" after unzip)
//   dist/langwa-firefox.xpi    Firefox desktop and Android (sign it on addons.mozilla.org)
//   dist/langwa.user.js        any browser with a userscript manager, including phones
// Usage: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(ROOT, 'browser-extension');
const DIST = join(ROOT, 'dist');
mkdirSync(DIST, { recursive: true });

const manifest = JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8'));
const read = p => readFileSync(join(EXT, p), 'utf8');

// ---------- dictionary words shipped with the extension (open sources, CC BY-SA 4.0) ----------
// lang/lexicon.json: { fr: { lang: { frenchWord: [term] } }, en: { lang: { englishWord: [term] } } }
const loadTerms = f => (existsSync(join(ROOT, 'data', f)) ? JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8')).terms : {});
const termsFr = loadTerms('terms.json');
const termsEn = loadTerms('terms-en.json');
// Words learned from an open Bible translation (tools/harvest-bible-lexicon.mjs), for languages
// Wiktionary does not cover (Lamnso'). Keyed by English word; French pages use the table below.
const EN_FR = {
  money: ['argent'], pay: ['payer', 'paiement'], give: ['donner'], receive: ['recevoir', 'reçu'], take: ['prendre'],
  send: ['envoyer', 'envoi'], name: ['nom'], day: ['jour'], month: ['mois'], year: ['année'], thousand: ['mille'],
  hundred: ['cent'], buy: ['acheter', 'achat'], sell: ['vendre'], thief: ['voleur'], lie: ['mensonge', 'mentir'],
  ask: ['demander'], say: ['dire'], hear: ['entendre', 'écouter'], see: ['voir'], know: ['savoir', 'connaître'],
  write: ['écrire'], good: ['bon', 'bien'], evil: ['mal'], true: ['vrai', 'vérité'], new: ['nouveau', 'nouvelle'],
  open: ['ouvrir'], call: ['appeler', 'appel'], hand: ['main'], house: ['maison'], now: ['maintenant'],
  many: ['beaucoup'], little: ['peu'], choose: ['choisir'], enter: ['entrer', 'saisir'], come: ['venir'],
  go: ['aller'], wages: ['salaire'], price: ['prix'], poor: ['pauvre'], rich: ['riche'],
  fear: ['peur'], no: ['non'], thanks: ['merci'], peace: ['paix'], language: ['langue'],
};
for (const [lang, idx] of Object.entries(loadTerms('terms-bible.json'))) {
  termsEn[lang] = { ...idx, ...(termsEn[lang] || {}) };
  termsFr[lang] = termsFr[lang] || {};
  for (const [en, ts] of Object.entries(idx)) for (const fr of EN_FR[en] || []) termsFr[lang][fr] = termsFr[lang][fr] || ts;
}
const compact = terms => Object.fromEntries(Object.entries(terms).map(([l, idx]) =>
  [l, Object.fromEntries(Object.entries(idx).map(([w, ts]) => [w, [...new Set(ts.map(t => t.term))].slice(0, 3)]))]));
const lexicon = {
  licence: 'Words from Wiktionnaire / Wiktionary contributors, CC BY-SA 4.0 (https://fr.wiktionary.org, https://en.wiktionary.org); Lamnso words learned from the Lamnso New Testament (flagship-ai/cameroon_bibles, CC BY 4.0) aligned with the King James Version (public domain). Dictionary hints, not validated.',
  fr: compact(termsFr),
  en: compact(termsEn),
};
writeFileSync(join(EXT, 'lang', 'lexicon.json'), JSON.stringify(lexicon));

// ---------- files that ship in the extension ----------
function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const shipped = walk(EXT)
  .map(p => relative(EXT, p).split('\\').join('/'))
  .filter(p => !p.startsWith('tests/') && !p.endsWith('.md') && !p.endsWith('.svg') && p !== 'src/standalone.js')
  .sort();

// ---------- minimal ZIP writer (deflate not needed: the files are small) ----------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
// A valid date for every file (12:00, build day): a zero date ("1980-00-00") upsets some unzip tools.
const NOW = new Date();
const DOS_DATE = ((NOW.getFullYear() - 1980) << 9) | ((NOW.getMonth() + 1) << 5) | NOW.getDate();
const DOS_TIME = 12 << 11;
function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt16LE(DOS_TIME, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(DOS_TIME, 12); central.writeUInt16LE(DOS_DATE, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const files = shipped.map(name => ({ name, data: readFileSync(join(EXT, name)) }));
writeFileSync(join(DIST, 'langwa-chromium.zip'), zip(files));

// Firefox: same files, its own manifest (event page instead of service worker, add-on id).
// Kept out of the Chromium manifest so Chrome/Edge show no warnings.
const firefoxManifest = {
  ...manifest,
  background: { scripts: [manifest.background.service_worker] },
  browser_specific_settings: { gecko: { id: 'langwa@hackathon.local', strict_min_version: '121.0' } },
};
const firefoxFiles = files.map(f => (f.name === 'manifest.json'
  ? { name: f.name, data: Buffer.from(JSON.stringify(firefoxManifest, null, 2)) }
  : f));
writeFileSync(join(DIST, 'langwa-firefox.xpi'), zip(firefoxFiles));

// ---------- natural voice for the computer (a few KB; everything heavy downloads on first start) ----------
// Unzip, double-click "Start Langwa voice.cmd". No Python needed beforehand: the launcher brings its own.
const SRV = join(ROOT, 'server');
const voiceFiles = [
  { name: 'Langwa voice/Start Langwa voice.cmd', data: Buffer.from('@echo off\r\ncall "%~dp0server\\start-voice.cmd"\r\n') },
  { name: 'Langwa voice/README.txt', data: Buffer.from([
    'Langwa natural voice',
    '',
    'Windows: double-click "Start Langwa voice.cmd".',
    'Mac / Linux: open a terminal in this folder and run:  sh server/start-voice.sh',
    '',
    'The first time, it downloads about 700 MB once (it resumes if the connection drops) and asks',
    'whether to start with the computer. Keep its window open; Langwa then reads with this voice.',
    'Everything stays in this folder and runs on this computer, offline. To remove it, delete the folder.',
    '',
    'Voix naturelle Langwa',
    '',
    'Windows : double-cliquez sur "Start Langwa voice.cmd".',
    'Mac / Linux : ouvrez un terminal dans ce dossier et lancez :  sh server/start-voice.sh',
    '',
    'La premiere fois, environ 700 Mo sont telecharges une seule fois (reprise si la connexion coupe).',
    'Gardez la fenetre ouverte ; Langwa lit alors avec cette voix. Tout reste dans ce dossier, hors ligne.',
    '',
    'Model and voices: Africa TTS, CC-BY-NC-4.0 (AfriSpeech). Code: MIT.',
    '',
  ].join('\r\n')) },
  ...['start-voice.cmd', 'start-voice.sh', 'voice_setup.py', 'africa_tts_server.py', 'requirements-africa-tts.txt']
    .map(f => ({ name: `Langwa voice/server/${f}`, data: readFileSync(join(SRV, f)) })),
];
writeFileSync(join(DIST, 'langwa-voice.zip'), zip(voiceFiles));

// ---------- userscript ----------
const langs = JSON.parse(read('lang/languages.json'));
const packs = Object.fromEntries(Object.keys(langs).map(c => {
  try { return [c, JSON.parse(read(`lang/${c}.json`))]; } catch { return [c, { entries: {} }]; }
}));
const data = { source: JSON.parse(read('lang/source.json')), langs, packs, lexicon };
// Coverage per language (translated phrases out of all page phrases): the website and the
// contribution page show the same figures as the extension's pickers.
const TOTAL = Math.max(1, (data.source.entries || []).length);
const langsCov = Object.fromEntries(Object.entries(langs).map(([c, l]) => {
  const count = Object.values((packs[c] && packs[c].entries) || {}).filter(e => e && e.t).length;
  return [c, { ...l, count, total: TOTAL, pct: Math.min(100, Math.round((100 * count) / TOTAL)) }];
}));
const header = `// ==UserScript==
// @name         Langwa
// @namespace    langwa
// @version      ${manifest.version}
// @description  ${manifest.description}
// @match        https://safinum.cm/*
// @match        http://localhost/*
// @match        http://127.0.0.1/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// ==/UserScript==
// To use it on another banking site, add the site in your userscript manager (User matches).
`;
const userscript = [
  header,
  `globalThis.LANGWA_DATA = ${JSON.stringify(data)};`,
  read('src/protect.js'), read('src/engine.js'), read('src/speech.js'), read('src/assistant.js'), read('src/standalone.js'), read('src/content.js'),
].join('\n');
writeFileSync(join(DIST, 'langwa.user.js'), userscript);

// ---------- contribution page for speakers (one file, works offline, phone first) ----------
const terms = termsFr;
const collect = readFileSync(join(ROOT, 'tools', 'collect.template.html'), 'utf8')
  .replace('/*DATA*/null', () => JSON.stringify({ source: data.source, langs: langsCov, terms, termsEn }).replace(/</g, '\\u003c'));
writeFileSync(join(DIST, 'langwa-collect.html'), collect);

// ---------- public website (Vercel root directory = collect/) ----------
//   /              landing page about Langwa
//   /contribute/   contribution page for speakers
//   /downloads/    extension zip and phone userscript
const SITE = join(ROOT, 'collect');
mkdirSync(join(SITE, 'contribute'), { recursive: true });
mkdirSync(join(SITE, 'downloads'), { recursive: true });
const landing = readFileSync(join(ROOT, 'tools', 'site.template.html'), 'utf8')
  .replace('/*LANGS*/{}', () => JSON.stringify(langsCov).replace(/</g, '\\u003c'));
writeFileSync(join(SITE, 'index.html'), landing);
writeFileSync(join(SITE, 'contribute', 'index.html'), collect);
writeFileSync(join(SITE, 'icon.svg'), readFileSync(join(EXT, 'icons', 'icon.svg')));
// Photos (Unsplash License) and real screenshots of the extension, shown on the landing page.
mkdirSync(join(SITE, 'img'), { recursive: true });
for (const f of readdirSync(join(ROOT, 'tools', 'site-assets'))) writeFileSync(join(SITE, 'img', f), readFileSync(join(ROOT, 'tools', 'site-assets', f)));
writeFileSync(join(SITE, 'downloads', 'langwa-chromium.zip'), readFileSync(join(DIST, 'langwa-chromium.zip')));
writeFileSync(join(SITE, 'downloads', 'langwa-firefox.xpi'), readFileSync(join(DIST, 'langwa-firefox.xpi')));
writeFileSync(join(SITE, 'downloads', 'langwa.user.js'), readFileSync(join(DIST, 'langwa.user.js')));
writeFileSync(join(SITE, 'downloads', 'langwa-voice.zip'), readFileSync(join(DIST, 'langwa-voice.zip')));

const kb = p => `${(statSync(join(DIST, p)).size / 1024).toFixed(0)} KB`;
console.log(`Langwa ${manifest.version}`);
for (const p of ['langwa-chromium.zip', 'langwa-firefox.xpi', 'langwa.user.js', 'langwa-voice.zip', 'langwa-collect.html']) console.log(`  dist/${p.padEnd(28)} ${kb(p)}`);
console.log(`  ${files.length} files: ${shipped.join(', ')}`);
