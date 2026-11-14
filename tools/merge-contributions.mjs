// Merges translation files received on WhatsApp into the language files shipped with Langwa.
//
//   node tools/merge-contributions.mjs <folder>            merge every .json file in <folder>
//   node tools/merge-contributions.mjs <folder> --dry      show what would change, write nothing
//   node tools/merge-contributions.mjs --dataset            export validated pairs for model training
//
// Accepted files:
//  - contributions from the contribute page ("format": "langwa-contribution-1"): always merged as
//    "to validate", whoever sent them;
//  - glossary exports from Langwa's settings page (a validator ticked "Validé"): their validation
//    is kept, because only the team's validators use that page.
// Rules: a validated translation is never replaced (a different proposal is listed in the report
// for the validator); unknown sentence ids are ignored; when two contributors disagree, the first
// one is kept and the other is listed. Recordings stay inside the file (data URLs) and are played
// by Langwa instead of the synthetic voice.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANG = join(ROOT, 'browser-extension', 'lang');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const source = JSON.parse(readFileSync(join(LANG, 'source.json'), 'utf8'));
const phrases = new Map(source.entries.map(e => [e.id, e]));
const langs = JSON.parse(readFileSync(join(LANG, 'languages.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const readPack = code => { const p = join(LANG, `${code}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { code, validation: { validators: [] }, entries: {} }; };
const sameText = (a, b) => (a || '').trim().replace(/\s+/g, ' ') === (b || '').trim().replace(/\s+/g, ' ');
// the {placeholders} of the French sentence must survive in the translation (amounts, names)
const slotsOk = (id, t) => { const fr = (phrases.get(id) || {}).fr || ''; const want = (fr.match(/\{\w+\}/g) || []).sort().join(); return want === ((t.match(/\{\w+\}/g) || []).sort().join()); };

if (args.includes('--dataset')) {
  // Validated sentence pairs (and recordings) per language, ready to fine-tune translation or voice models.
  const out = join(ROOT, 'data', 'training');
  mkdirSync(out, { recursive: true });
  for (const code of Object.keys(langs)) {
    const pack = readPack(code);
    const rows = [['id', 'fr', 'en', code, 'validator', 'has_audio']];
    let n = 0;
    const audioDir = join(out, `${code}-audio`);
    for (const [id, e] of Object.entries(pack.entries || {})) {
      const p = phrases.get(id);
      if (!p || !e.t || !e.verified) continue;
      n++;
      const clip = e.audio && /^data:audio\/(\w+)/.exec(e.audio);
      if (clip) { mkdirSync(audioDir, { recursive: true }); writeFileSync(join(audioDir, `${id}.${clip[1] === 'mpeg' ? 'mp3' : clip[1]}`), Buffer.from(e.audio.split(',')[1], 'base64')); }
      rows.push([id, p.fr, p.en || '', e.t, e.validator || '', clip ? 'yes' : 'no']);
    }
    if (n) { writeFileSync(join(out, `${code}.tsv`), rows.map(r => r.map(c => String(c).replace(/[\t\n]/g, ' ')).join('\t')).join('\n') + '\n'); console.log(`${code}: ${n} validated pairs -> data/training/${code}.tsv`); }
  }
  process.exit(0);
}

const folder = args.find(a => !a.startsWith('--'));
if (!folder) { console.log('Usage: node tools/merge-contributions.mjs <folder with the received .json files> [--dry]'); process.exit(1); }
const files = readdirSync(folder).filter(f => f.toLowerCase().endsWith('.json')).sort();
const packs = new Map();
const report = [];
const stats = {};

for (const f of files) {
  let j;
  try { j = JSON.parse(readFileSync(join(folder, f), 'utf8')); } catch (err) { report.push(`SKIPPED ${f}: not a valid file (${err.message})`); continue; }
  const code = j.code;
  if (!code || !langs[code]) { report.push(`SKIPPED ${f}: unknown language "${code}"`); continue; }
  const isContribution = j.format === 'langwa-contribution-1';
  if (!packs.has(code)) packs.set(code, readPack(code));
  const pack = packs.get(code);
  pack.entries ||= {};
  const st = stats[code] ||= { added: 0, updated: 0, validated: 0, audio: 0, kept: 0, conflicts: 0, files: 0 };
  st.files++;
  const who = (j.contributor && j.contributor.name) || '';
  for (const [id, v] of Object.entries(j.entries || {})) {
    if (!phrases.has(id) || !v || !(v.t || '').trim()) continue;
    const t = v.t.trim();
    if (!slotsOk(id, t)) { report.push(`CHECK ${code}/${id} (${f}): the {…} markers differ from the French sentence; not merged: "${t}"`); continue; }
    const cur = pack.entries[id];
    const credit = { by: v.by || who || '', ...(v.place ? { place: v.place } : {}), ...(v.tribe ? { tribe: v.tribe } : {}), date: v.date || today };
    const hasAudio = !!(v.audio || (v.audioParts || []).some(Boolean));
    if (cur && cur.verified && !sameText(cur.t, t)) {
      st.kept++;
      report.push(`PROPOSAL ${code}/${id} by ${credit.by || '?'} (${f}): "${t}"  [validated text kept: "${cur.t}"]`);
      continue;
    }
    if (cur && cur.t && !sameText(cur.t, t) && cur.mergedFrom && isContribution) {
      st.conflicts++;
      report.push(`DISAGREE ${code}/${id}: "${cur.t}" (${cur.by || '?'}) vs "${t}" (${credit.by || '?'}, ${f}); first kept, the validator decides`);
      continue;
    }
    const next = { ...(cur || {}), t, ...(v.x ? { x: v.x } : {}), ...credit, mergedFrom: f };
    if (hasAudio) { next.audio = v.audio || ''; next.audioParts = v.audioParts || []; st.audio++; }
    if (!isContribution && v.verified) { Object.assign(next, { verified: true, validator: v.validator || '', date: v.date || today }); st.validated++; }
    else if (!cur || !sameText(cur.t, t)) next.verified = false;
    if (!cur || !cur.t) st.added++; else if (!sameText(cur.t, t)) st.updated++;
    pack.entries[id] = next;
  }
}

for (const [code, pack] of packs) {
  for (const e of Object.values(pack.entries)) delete e.mergedFrom;
  const validators = [...new Set(Object.values(pack.entries).filter(e => e.verified && e.validator).map(e => e.validator))];
  pack.validation = { ...(pack.validation || {}), validators };
  const s = stats[code];
  const total = Object.values(pack.entries).filter(e => e.t).length;
  const ok = Object.values(pack.entries).filter(e => e.t && e.verified).length;
  console.log(`${code} (${langs[code].name}): ${s.files} file(s) · ${s.added} new · ${s.updated} changed · ${s.validated} validated · ${s.audio} with recordings · ${s.kept} proposals on validated text · ${s.conflicts} disagreements  →  ${ok}/${total} validated, ${source.entries.length} sentences in all`);
  if (!dry) writeFileSync(join(LANG, `${code}.json`), JSON.stringify(pack, null, 1) + '\n');
}
if (report.length) {
  const name = `merge-report-${today}.txt`;
  if (!dry) writeFileSync(join(folder, name), report.join('\n') + '\n');
  console.log(`\n${report.length} item(s) for the validator${dry ? '' : `, written to ${join(basename(folder), name)}`}:`);
  for (const r of report.slice(0, 15)) console.log('  ' + r);
  if (report.length > 15) console.log(`  … ${report.length - 15} more`);
}
console.log(dry ? '\nDry run: nothing written.' : '\nNext: node tools/build.mjs (rebuilds the zip and the website with these translations).');
