// Builds dictionary hints for a Cameroonian language from an open Bible translation.
//
// The Lamnso' New Testament (flagship-ai/cameroon_bibles, CC BY 4.0) is paired verse by verse
// with the King James Version (public domain). Word pairs are then learned statistically
// (IBM Model 1 word alignment, the classic method behind early machine translation, plus a
// Dice co-occurrence check). Only pairs with strong, repeated evidence are kept, and every
// word is shipped as a dictionary hint "not validated", never as a sentence translation.
//
//   node tools/harvest-bible-lexicon.mjs            -> data/terms-bible.json (lns)
//
// Chapters are cached in data/bible-cache/ (gitignored).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'data', 'bible-cache');
mkdirSync(CACHE, { recursive: true });
const DATASET = 'flagship-ai/cameroon_bibles';
const LANGS = { lns: 'Lamnso' }; // Langwa code -> dataset folder
const KJV_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';
const NT = ['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI',
  'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];
const KJV_NT_START = 39; // Matthew is book 40 in the Protestant canon

// English words Langwa looks up (same list as the Wiktionary harvester), with the KJV forms
// that count as the same word.
const WORDS = {
  money: [], pay: ['paid', 'payeth'], give: ['gave', 'given', 'giveth', 'gavest', 'givest'], receive: ['received', 'receiveth', 'receiving'],
  take: ['took', 'taken', 'taketh'], send: ['sent', 'sendeth'], name: ['names'], number: ['numbered'], day: ['days'],
  month: ['months'], year: ['years'], thousand: ['thousands'], hundred: ['hundreds'], buy: ['bought', 'buyeth'],
  sell: ['sold', 'selleth'], debt: ['debts', 'debtor', 'debtors'], thief: ['thieves'], steal: ['stole', 'stolen'],
  lie: ['lied', 'lies', 'liar', 'liars'], work: ['works', 'worked', 'worketh'], person: ['persons'], help: ['helped'],
  ask: ['asked', 'asketh'], say: ['said', 'saith', 'saying'], speak: ['spake', 'spoken', 'speaketh'], hear: ['heard', 'heareth'],
  see: ['saw', 'seen', 'seeth'], know: ['knew', 'known', 'knoweth'], write: ['wrote', 'written'], read: [],
  keep: ['kept', 'keepeth'], wait: ['waited'], finish: ['finished'], end: [], stop: [], good: [], bad: [], evil: [],
  true: ['truth'], false: [], new: [], open: ['opened'], close: ['shut'], call: ['called', 'calleth'],
  letter: ['letters', 'epistle'], word: ['words'], hand: ['hands'], house: [], all: [], before: [], after: [], now: [],
  much: [], many: [], little: [], enough: [], remain: ['remained', 'remaineth'], accept: ['accepted'], refuse: ['refused'],
  choose: ['chose', 'chosen'], enter: ['entered', 'entereth'], return: ['returned'], come: ['came', 'cometh'],
  go: ['went', 'goeth', 'gone'], want: ['wanted'], wages: ['wage', 'hire'], price: [], gold: [], silver: [],
  poor: [], rich: ['riches'], trade: ['merchant', 'merchants', 'merchandise'], tax: ['tribute', 'taxed'],
  safe: ['safety'], fear: ['feared', 'afraid'], careful: ['beware', 'heed'], never: [], yes: ['yea'], no: ['nay'],
  thanks: ['thank', 'thanked'], peace: [], language: ['tongue', 'tongues'],
  // Sanity anchors: if these do not come out right, the method is not trusted.
  god: [], jesus: [],
};
const FORM = new Map();
for (const [w, forms] of Object.entries(WORDS)) for (const f of [w, ...forms]) FORM.set(f, w);

async function get(url, as = 'text', tries = 5) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'LangwaBuild/1.0' }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return as === 'json' ? r.json() : r.text();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise(res => setTimeout(res, 1500 * (i + 1)));
    }
  }
}

async function chapters(folder) {
  const j = await get(`https://huggingface.co/api/datasets/${DATASET}`, 'json');
  return j.siblings.map(s => s.rfilename).filter(f => f.startsWith(`${folder}/`) && f.endsWith('.txt'));
}

async function download(files) {
  const out = {};
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < files.length) {
      const f = files[next++];
      const local = join(CACHE, f.replace('/', '_'));
      if (!existsSync(local)) writeFileSync(local, await get(`https://huggingface.co/datasets/${DATASET}/resolve/main/${f}`));
      out[f] = readFileSync(local, 'utf8');
    }
  }));
  return out;
}

const tokLocal = s => (s.toLowerCase().normalize('NFC').match(/[\p{L}\p{M}ʼ'‐-]+/gu) || [])
  .map(w => w.replace(/^['‐-]+|['‐-]+$/g, '')).filter(Boolean);
const tokEn = s => (s.toLowerCase().match(/[a-z]+/g) || []);

async function main() {
  const kjvLocal = join(CACHE, 'en_kjv.json');
  if (!existsSync(kjvLocal)) writeFileSync(kjvLocal, await get(KJV_URL));
  const kjv = JSON.parse(readFileSync(kjvLocal, 'utf8').replace(/^﻿/, ''));
  const result = {};
  for (const [code, folder] of Object.entries(LANGS)) {
    const files = await chapters(folder);
    const texts = await download(files);
    // Verse pairs: English KJV verse <-> local verse, by book, chapter and verse number.
    const pairs = [];
    for (const [f, txt] of Object.entries(texts)) {
      const m = f.match(/\/([1-3]?[A-Z]{2,3})\.(\d+)\.txt$/);
      if (!m) continue;
      const b = NT.indexOf(m[1]);
      const ch = kjv[KJV_NT_START + b] && kjv[KJV_NT_START + b].chapters[+m[2] - 1];
      if (b < 0 || !ch) continue;
      for (const line of txt.split(/\r?\n/)) {
        const v = line.match(/^(\d+):(.*)$/);
        if (!v || !ch[+v[1] - 1]) continue;
        const en = tokEn(ch[+v[1] - 1].replace(/\{[^}]*\}/g, ' ')).map(w => FORM.get(w) || w);
        const lo = tokLocal(v[2]);
        if (en.length && lo.length) pairs.push([en, lo]);
      }
    }
    console.log(`${code}: ${Object.keys(texts).length} chapters, ${pairs.length} verse pairs`);

    // IBM Model 1, English -> local, with a NULL word to absorb grammar words.
    const t = new Map(); // `${e}\u0001${l}` -> probability
    const key = (e, l) => `${e}\u0001${l}`;
    for (let it = 0; it < 6; it++) {
      const count = new Map(), total = new Map();
      for (const [en, lo] of pairs) {
        const E = ['\u0000', ...en];
        for (const l of lo) {
          let z = 0;
          for (const e of E) z += t.get(key(e, l)) ?? 1;
          for (const e of E) {
            const c = (t.get(key(e, l)) ?? 1) / z;
            count.set(key(e, l), (count.get(key(e, l)) || 0) + c);
            total.set(e, (total.get(e) || 0) + c);
          }
        }
      }
      t.clear();
      for (const [k, c] of count) t.set(k, c / total.get(k.split('\u0001')[0]));
    }

    // Co-occurrence for the Dice check, only for the words we want.
    const fe = new Map(), fl = new Map(), co = new Map();
    for (const [en, lo] of pairs) {
      const E = new Set(en.filter(w => w in WORDS)), L = new Set(lo);
      for (const l of L) fl.set(l, (fl.get(l) || 0) + 1);
      for (const e of E) {
        fe.set(e, (fe.get(e) || 0) + 1);
        for (const l of L) co.set(key(e, l), (co.get(key(e, l)) || 0) + 1);
      }
    }
    const terms = {};
    for (const e of Object.keys(WORDS)) {
      if ((fe.get(e) || 0) < 4) continue;
      const cands = [];
      for (const [k, p] of t) {
        const [ke, l] = k.split('\u0001');
        if (ke !== e || l.length < 2) continue;
        const c = co.get(k) || 0;
        const dice = (2 * c) / (fe.get(e) + fl.get(l));
        // strong evidence only: a confident alignment, or a word that really travels with it
        if (p >= 0.12 && c >= 3 && (p >= 0.4 || dice >= 0.2)) cands.push({ l, p, dice, c });
      }
      cands.sort((a, b) => b.p * b.dice - a.p * a.dice);
      if (cands.length) terms[e] = cands.slice(0, 2);
    }
    result[code] = terms;
  }
  return result;
}

const res = await main();
const verbose = process.argv.includes('--show');
const terms = {};
for (const [code, idx] of Object.entries(res)) {
  terms[code] = {};
  for (const [w, cands] of Object.entries(idx)) {
    if (verbose) console.log(`${w.padEnd(10)} ${cands.map(c => `${c.l} (p ${c.p.toFixed(2)}, dice ${c.dice.toFixed(2)}, ${c.c}x)`).join('  |  ')}`);
    if (w === 'god' || w === 'jesus') continue; // anchors only
    terms[code][w] = cands.map(c => ({ term: c.l, definition: w, source: 'Bible alignment (flagship-ai/cameroon_bibles, CC BY 4.0 + KJV)' }));
  }
}
writeFileSync(join(ROOT, 'data', 'terms-bible.json'), JSON.stringify({
  licence: 'Lamnso\' New Testament text: flagship-ai/cameroon_bibles, CC BY 4.0. English: King James Version, public domain.',
  note: 'Learned by statistical word alignment of Bible verses. Dictionary hints only, not validated by native speakers; Bible vocabulary may differ from everyday banking words.',
  harvestedAt: new Date().toISOString().slice(0, 10),
  terms,
}, null, 1));
console.log('words:', Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, Object.keys(v).length])));
