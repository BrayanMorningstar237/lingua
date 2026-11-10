// Builds openly licensed term suggestions for speakers from French Wiktionary (CC BY-SA 4.0).
// For each language it reads every word page in the language's category (50 pages per request),
// takes the French definitions, and indexes them by the French banking words Langwa needs.
// Output: data/terms.json  { lang: { frenchWord: [{ term, definition, source }] } }
// These are suggestions for native speakers, never translations shown as validated.
// Usage: node tools/harvest-wiktionary.mjs            (uses data/wiktionary-cache.json when present)
//        node tools/harvest-wiktionary.mjs --refresh  (downloads again)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'terms.json');
const CACHE = join(ROOT, 'data', 'wiktionary-cache.json'); // raw definitions, so re-indexing needs no network
const REFRESH = process.argv.includes('--refresh');
const API = 'https://fr.wiktionary.org/w/api.php';
const UA = { 'user-agent': 'Langwa-glossary-builder/0.2 (open-source hackathon prototype)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Langwa code -> Wiktionary category and section code.
const LANGS = {
  ewo: { cat: 'éwondo', code: 'ewo' },
  fub: { cat: 'peul', code: 'ff' },
  dua: { cat: 'douala', code: 'dua' },
  bas: { cat: 'bassa (Cameroun)', code: 'bas' },
  bbj: { cat: 'ghomala', code: 'bbj' },
  nge: { cat: 'mankon', code: 'nge' },
  bkm: { cat: 'kom (Cameroun)', code: 'bkm' },
};

// French words that matter in banking interfaces (singular, lower case, no accents needed).
const WORDS = [
  'argent', 'banque', 'compte', 'solde', 'montant', 'frais', 'payer', 'paiement', 'prix', 'envoyer', 'recevoir',
  'donner', 'prendre', 'virement', 'telephone', 'numero', 'nom', 'confirmer', 'annuler', 'retour', 'revenir',
  'continuer', 'erreur', 'attention', 'securite', 'jamais', 'secret', 'cacher', 'total', 'gratuit', 'reussir',
  'operation', 'personne', 'reference', 'date', 'jour', 'mois', 'annee', 'facture', 'electricite', 'eau',
  'salaire', 'travail', 'marchand', 'acheter', 'vendre', 'dette', 'credit', 'retirer', 'aide', 'aider', 'langue',
  'bonjour', 'merci', 'oui', 'non', 'verifier', 'regarder', 'nouveau', 'changer', 'raison', 'accepter',
  'bloquer', 'fermer', 'ouvrir', 'insuffisant', 'manquer', 'voleur', 'voler', 'mentir', 'appeler', 'message',
  'lettre', 'franc', 'mille', 'cent', 'combien', 'beaucoup', 'peu', 'rester', 'reste', 'tout', 'avant', 'apres',
  'maintenant', 'vite', 'savoir', 'connaitre', 'lire', 'ecrire', 'ecouter', 'parler', 'dire', 'demander', 'garder',
];
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const WORDSET = new Set(WORDS);

/**
 * Strict match: a banking word counts only when it IS one of the glosses of the definition
 * ("Savoir, connaître." -> savoir, connaitre), never when it merely appears inside a longer
 * explanation ("Plaine herbeuse ... après la crue").
 */
function glosses(def) {
  return fold(def.replace(/\([^)]*\)/g, ' '))
    .split(/[,;.:/]| ou /)
    .map(g => g.replace(/^(le|la|les|l'|un|une|des|du|de|d'|se|s')\s*/, '').trim())
    .filter(g => g && g.split(/\s+/).length <= 2)
    .map(g => g.split(/\s+/)[0]);
}
const baseOf = w => (WORDSET.has(w) ? w : WORDSET.has(w.replace(/s$/, '')) ? w.replace(/s$/, '') : null);

async function api(params, tries = 4) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params })}`;
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA });
    const text = await r.text();
    try { return JSON.parse(text); } catch { await sleep(8000 * (i + 1)); } // rate limited: back off
  }
  throw new Error('Wiktionary API unavailable, try again later');
}

async function categoryPages(cat) {
  const pages = [];
  let cont = {};
  do {
    const j = await api({ action: 'query', list: 'categorymembers', cmtitle: `Catégorie:${cat}`, cmnamespace: '0', cmlimit: '500', ...cont });
    pages.push(...((j.query && j.query.categorymembers) || []).map(p => p.title));
    cont = j.continue || null;
    await sleep(1500);
  } while (cont);
  return pages;
}

function clean(def) {
  return def
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function definitions(wikitext, code) {
  const start = wikitext.search(new RegExp(`==\\s*\\{\\{langue\\|${code}\\}\\}\\s*==`));
  if (start < 0) return [];
  const rest = wikitext.slice(start + 5);
  const end = rest.search(/\n==\s*\{\{langue\|/);
  const section = end < 0 ? rest : rest.slice(0, end);
  return section.split('\n').filter(l => /^#\s/.test(l)).map(l => clean(l.slice(1))).filter(Boolean);
}

const cache = existsSync(CACHE) && !REFRESH ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const out = {};
const only = process.argv.find(a => LANGS[a]); // optional: one language code
for (const [lang, { cat, code }] of Object.entries(LANGS)) {
  if (!cache[lang] || (only === lang && REFRESH)) {
    const titles = await categoryPages(cat);
    const raw = [];
    for (let i = 0; i < titles.length; i += 50) {
      const batch = titles.slice(i, i + 50);
      const j = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: batch.join('|') });
      for (const p of (j.query && j.query.pages) || []) {
        const wt = p.revisions && p.revisions[0] && p.revisions[0].slots.main.content;
        if (wt) raw.push({ term: p.title, defs: definitions(wt, code) });
      }
      await sleep(1500);
    }
    cache[lang] = raw;
  }
  const index = {};
  for (const { term, defs } of cache[lang]) {
    if ([...term].length < 2) continue; // skip single letters of the alphabet
    for (const def of defs) {
      for (const g of glosses(def)) {
        const base = baseOf(g);
        if (!base) continue;
        index[base] ??= [];
        if (!index[base].some(t => t.term === term)) index[base].push({ term, definition: def.slice(0, 140), source: `https://fr.wiktionary.org/wiki/${encodeURIComponent(term)}` });
      }
    }
  }
  out[lang] = index;
  console.log(`${lang}: ${cache[lang].length} words on Wiktionary, ${Object.keys(index).length} of ${WORDS.length} banking words covered`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(CACHE, JSON.stringify(cache));
writeFileSync(OUT, JSON.stringify({
  licence: 'CC BY-SA 4.0, Wiktionnaire contributors (https://fr.wiktionary.org). Suggestions only, not validated by native speakers.',
  note: 'fub entries come from the general "peul" category of Wiktionnaire and may reflect other Fula varieties (Pulaar, Pular) rather than Adamawa Fulfulde.',
  harvestedAt: new Date().toISOString(),
  terms: out,
}, null, 1) + '\n');
console.log(`Saved ${OUT}`);
