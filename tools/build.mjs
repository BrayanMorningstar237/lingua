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
const compact = terms => Object.fromEntries(Object.entries(terms).map(([l, idx]) =>
  [l, Object.fromEntries(Object.entries(idx).map(([w, ts]) => [w, [...new Set(ts.map(t => t.term))].slice(0, 3)]))]));
const lexicon = {
  licence: 'Words from Wiktionnaire / Wiktionary contributors, CC BY-SA 4.0 (https://fr.wiktionary.org, https://en.wiktionary.org). Dictionary hints, not validated.',
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
function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt32LE(0, 10); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
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

// ---------- userscript ----------
const langs = JSON.parse(read('lang/languages.json'));
const packs = Object.fromEntries(Object.keys(langs).map(c => {
  try { return [c, JSON.parse(read(`lang/${c}.json`))]; } catch { return [c, { entries: {} }]; }
}));
const data = { source: JSON.parse(read('lang/source.json')), langs, packs, lexicon };
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
  read('src/protect.js'), read('src/engine.js'), read('src/speech.js'), read('src/standalone.js'), read('src/content.js'),
].join('\n');
writeFileSync(join(DIST, 'langwa.user.js'), userscript);

// ---------- contribution page for speakers (one file, works offline, phone first) ----------
const terms = termsFr;
const collect = readFileSync(join(ROOT, 'tools', 'collect.template.html'), 'utf8')
  .replace('/*DATA*/null', () => JSON.stringify({ source: data.source, langs, terms, termsEn }).replace(/</g, '\\u003c'));
writeFileSync(join(DIST, 'langwa-collect.html'), collect);

// ---------- public website (Vercel root directory = collect/) ----------
//   /              landing page about Langwa
//   /contribute/   contribution page for speakers
//   /downloads/    extension zip and phone userscript
const SITE = join(ROOT, 'collect');
mkdirSync(join(SITE, 'contribute'), { recursive: true });
mkdirSync(join(SITE, 'downloads'), { recursive: true });
const landing = readFileSync(join(ROOT, 'tools', 'site.template.html'), 'utf8')
  .replace('/*LANGS*/{}', () => JSON.stringify(langs).replace(/</g, '\\u003c'));
writeFileSync(join(SITE, 'index.html'), landing);
writeFileSync(join(SITE, 'contribute', 'index.html'), collect);
writeFileSync(join(SITE, 'icon.svg'), readFileSync(join(EXT, 'icons', 'icon.svg')));
// Photos (Unsplash License) and real screenshots of the extension, shown on the landing page.
mkdirSync(join(SITE, 'img'), { recursive: true });
for (const f of readdirSync(join(ROOT, 'tools', 'site-assets'))) writeFileSync(join(SITE, 'img', f), readFileSync(join(ROOT, 'tools', 'site-assets', f)));
writeFileSync(join(SITE, 'downloads', 'langwa-chromium.zip'), readFileSync(join(DIST, 'langwa-chromium.zip')));
writeFileSync(join(SITE, 'downloads', 'langwa-firefox.xpi'), readFileSync(join(DIST, 'langwa-firefox.xpi')));
writeFileSync(join(SITE, 'downloads', 'langwa.user.js'), readFileSync(join(DIST, 'langwa.user.js')));

const kb = p => `${(statSync(join(DIST, p)).size / 1024).toFixed(0)} KB`;
console.log(`Langwa ${manifest.version}`);
for (const p of ['langwa-chromium.zip', 'langwa-firefox.xpi', 'langwa.user.js', 'langwa-collect.html']) console.log(`  dist/${p.padEnd(28)} ${kb(p)}`);
console.log(`  ${files.length} files: ${shipped.join(', ')}`);
