// Builds the submission PDF: dist/Langwa-Documentation.pdf
// Fills docs/documentation.template.html with docs/submission.json and the language pack,
// then prints it with the installed Edge or Chrome (headless). Empty fields print as
// a red "TO COMPLETE" box so nothing is submitted unfinished.
// Usage: node tools/build-docs.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
mkdirSync(DIST, { recursive: true });

const cfg = JSON.parse(readFileSync(join(ROOT, 'docs/submission.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const todo = label => `<span class="todo">TO COMPLETE: ${esc(label)}</span>`;
const val = (v, label) => (v && String(v).trim() ? esc(v) : todo(label));

// Coverage of the chosen language, computed from its language file.
let coverage = todo('language file');
const code = cfg.language && cfg.language.code;
if (code) {
  try {
    const source = JSON.parse(readFileSync(join(ROOT, 'browser-extension/lang/source.json'), 'utf8')).entries;
    const entries = JSON.parse(readFileSync(join(ROOT, `browser-extension/lang/${code}.json`), 'utf8')).entries || {};
    const n = source.length;
    const tr = source.filter(e => entries[e.id] && entries[e.id].t).length;
    const ver = source.filter(e => entries[e.id] && entries[e.id].t && entries[e.id].verified).length;
    const audio = source.filter(e => entries[e.id] && (entries[e.id].audio || (entries[e.id].audioParts || []).some(Boolean))).length;
    coverage = `${ver} of ${n} phrases validated by a native speaker, ${tr - ver} translated awaiting validation, ${audio} with recorded voice.`;
  } catch { /* keep TO COMPLETE */ }
}

const fill = {
  team: val(cfg.team, 'team name'),
  city: val(cfg.city, 'city'),
  languageName: val(cfg.language && cfg.language.name, 'language'),
  validators: cfg.validators && cfg.validators.length ? esc(cfg.validators.join(', ')) : todo('validator names'),
  repoUrl: val(cfg.repoUrl, 'GitHub link'),
  videoUrl: val(cfg.videoUrl, 'video link'),
  teamContribution: val(cfg.teamContribution, 'team contribution'),
  coverage,
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
};
let html = readFileSync(join(ROOT, 'docs/documentation.template.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in fill ? fill[k] : m));
const htmlOut = join(DIST, 'langwa-documentation.html');
writeFileSync(htmlOut, html);

const browsers = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
];
const browser = browsers.find(p => existsSync(p));
const pdf = join(DIST, 'Langwa-Documentation.pdf');
if (!browser) {
  console.log(`No Edge/Chrome found. Open ${htmlOut} and print it to PDF.`);
} else {
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`,
    `--user-data-dir=${join(DIST, '.pdf-profile')}`, pathToFileURL(htmlOut).href], { stdio: 'ignore', timeout: 60000 });
  console.log(`dist/Langwa-Documentation.pdf  ${(statSync(pdf).size / 1024).toFixed(0)} KB`);
}
const missing = (html.match(/TO COMPLETE: [^<]+/g) || []).map(s => s.replace('TO COMPLETE: ', ''));
if (missing.length) console.log(`Still to complete in docs/submission.json: ${[...new Set(missing)].join(', ')}`);
