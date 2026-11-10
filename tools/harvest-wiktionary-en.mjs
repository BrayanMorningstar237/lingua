// Companion to harvest-wiktionary.mjs: collects openly licensed words from ENGLISH Wiktionary
// (CC BY-SA 4.0), which has more entries than the French edition for some Cameroonian
// languages (Ghomala', Kom, Duala...). Definitions are in English, so the index is keyed by
// English banking words. Output: data/terms-en.json  { lang: { englishWord: [{ term, definition, source }] } }
// Suggestions and dictionary hints only, never shown as validated translations.
// Usage: node tools/harvest-wiktionary-en.mjs            (uses data/wiktionary-en-cache.json when present)
//        node tools/harvest-wiktionary-en.mjs --refresh
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'terms-en.json');
const CACHE = join(ROOT, 'data', 'wiktionary-en-cache.json');
const REFRESH = process.argv.includes('--refresh');
const API = 'https://en.wiktionary.org/w/api.php';
const UA = { 'user-agent': 'Langwa-glossary-builder/0.2 (open-source hackathon prototype)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Langwa code -> English Wiktionary language name (category "<name> lemmas", section "==<name>==").
const LANGS = {
  ewo: 'Ewondo', fub: 'Fula', dua: 'Duala', bas: 'Basaa', bbj: "Ghomala'", bkm: 'Kom (Cameroon)', nge: 'Mankon',
};

const WORDS = [
  'money', 'bank', 'account', 'balance', 'amount', 'fee', 'pay', 'payment', 'price', 'cost', 'send', 'receive', 'give',
  'take', 'transfer', 'phone', 'telephone', 'number', 'name', 'confirm', 'cancel', 'back', 'return', 'continue',
  'error', 'mistake', 'warning', 'security', 'never', 'secret', 'hide', 'total', 'free', 'succeed', 'success',
  'person', 'date', 'day', 'month', 'year', 'bill', 'electricity', 'water', 'salary', 'wage', 'work', 'trader',
  'merchant', 'buy', 'sell', 'debt', 'credit', 'withdraw', 'help', 'language', 'greeting', 'hello', 'thanks',
  'yes', 'no', 'check', 'look', 'see', 'new', 'change', 'reason', 'accept', 'refuse', 'block', 'close', 'open',
  'lack', 'enough', 'thief', 'steal', 'lie', 'call', 'message', 'letter', 'thousand', 'hundred', 'much', 'many',
  'little', 'remain', 'all', 'before', 'after', 'now', 'quickly', 'know', 'read', 'write', 'listen', 'speak',
  'say', 'ask', 'keep', 'wait', 'safe', 'choose', 'enter', 'finish', 'end', 'stop', 'good', 'bad', 'true', 'false',
];
const WORDSET = new Set(WORDS);
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function api(params, tries = 4) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params })}`;
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA });
    const text = await r.text();
    try { return JSON.parse(text); } catch { await sleep(8000 * (i + 1)); }
  }
  throw new Error('Wiktionary API unavailable, try again later');
}

async function categoryPages(cat) {
  const pages = [];
  let cont = {};
  do {
    const j = await api({ action: 'query', list: 'categorymembers', cmtitle: `Category:${cat}`, cmnamespace: '0', cmlimit: '500', ...cont });
    pages.push(...((j.query && j.query.categorymembers) || []).map(p => p.title));
    cont = j.continue || null;
    await sleep(1500);
  } while (cont);
  return pages;
}

const clean = def => def
  .replace(/\{\{(?:lb|lbl|label|q|qualifier|i|gloss)\|[^{}]*\}\}/g, '')
  .replace(/\{\{(?:l|m|w)\|[a-z-]+\|([^{}|]*)[^{}]*\}\}/g, '$1')
  .replace(/\{\{[^{}]*\}\}/g, '')
  .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
  .replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function definitions(wikitext, langName) {
  const esc = langName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = wikitext.search(new RegExp(`(^|\\n)==\\s*${esc}\\s*==\\s*\\n`));
  if (start < 0) return [];
  const rest = wikitext.slice(start + 3);
  const end = rest.search(/\n==[^=]/);
  const section = end < 0 ? rest : rest.slice(0, end);
  return section.split('\n').filter(l => /^#\s/.test(l)).map(l => clean(l.slice(1))).filter(Boolean);
}

/** Strict: the banking word must BE a gloss ("to pay; to settle" -> pay), not appear inside a long explanation. */
function glosses(def) {
  return fold(def.replace(/\([^)]*\)/g, ' '))
    .split(/[,;.:/]| or /)
    .map(g => g.replace(/^(to|a|an|the)\s+/, '').trim())
    .filter(g => g && g.split(/\s+/).length <= 2)
    .map(g => g.split(/\s+/)[0]);
}
const baseOf = w => (WORDSET.has(w) ? w : WORDSET.has(w.replace(/s$/, '')) ? w.replace(/s$/, '') : null);

const cache = existsSync(CACHE) && !REFRESH ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const out = {};
for (const [lang, name] of Object.entries(LANGS)) {
  if (!cache[lang]) {
    let titles = [];
    try { titles = await categoryPages(`${name} lemmas`); } catch { titles = []; }
    const raw = [];
    for (let i = 0; i < titles.length; i += 50) {
      const j = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: titles.slice(i, i + 50).join('|') });
      for (const p of (j.query && j.query.pages) || []) {
        const wt = p.revisions && p.revisions[0] && p.revisions[0].slots.main.content;
        if (wt) raw.push({ term: p.title, defs: definitions(wt, name) });
      }
      await sleep(1500);
    }
    cache[lang] = raw;
  }
  const index = {};
  for (const { term, defs } of cache[lang]) {
    if ([...term].length < 2) continue;
    for (const def of defs) for (const g of glosses(def)) {
      const base = baseOf(g);
      if (!base) continue;
      index[base] ??= [];
      if (!index[base].some(t => t.term === term)) index[base].push({ term, definition: def.slice(0, 140), source: `https://en.wiktionary.org/wiki/${encodeURIComponent(term)}` });
    }
  }
  out[lang] = index;
  console.log(`${lang}: ${cache[lang].length} words on English Wiktionary, ${Object.keys(index).length} of ${WORDS.length} banking words covered`);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(CACHE, JSON.stringify(cache));
writeFileSync(OUT, JSON.stringify({
  licence: 'CC BY-SA 4.0, Wiktionary contributors (https://en.wiktionary.org). Dictionary hints only, not validated by native speakers.',
  note: 'fub entries come from the general "Fula" category and may reflect other Fula varieties rather than Adamawa Fulfulde.',
  harvestedAt: new Date().toISOString(),
  terms: out,
}, null, 1) + '\n');
console.log(`Saved ${OUT}`);
