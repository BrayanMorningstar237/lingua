const api = globalThis.browser ?? globalThis.chrome;
const $ = id => document.getElementById(id);
const P = globalThis.LangwaProtect;
const E = globalThis.LangwaEngine;

let langs = {};
let code = 'ewo';
let pack = null;
let overrides = {};
let ttsEndpoints = {
  mms: 'http://127.0.0.1:8766/tts',
  africa: 'http://127.0.0.1:8770/tts',
};

const placeholders = s => (String(s || '').match(/\{\w+\}/g) || []).sort().join(',');

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : String(c));
  return n;
}

const SVG = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  play: '<path d="m6 4 14 8-14 8z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
};
function ico(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = SVG[name];
  return s;
}

async function loadAll() {
  const settings = await api.runtime.sendMessage({ type: 'getSettings' });
  langs = await api.runtime.sendMessage({ type: 'getLangs' });
  code = code || settings.lang;
  $('lang').replaceChildren(...Object.entries(langs).map(([c, l]) => {
    const o = new Option(l.name, c);
    o.selected = c === code;
    return o;
  }));
  const key = `overrides:${code}`;
  overrides = (await api.storage.local.get(key))[key] || {};
  pack = await api.runtime.sendMessage({ type: 'getPack', lang: code });
  $('validator').value = (await api.storage.local.get('validatorName')).validatorName || '';
  $('mtMode').value = settings.mt.mode;
  $('mtEndpoint').value = settings.mt.endpoint;
  $('mtModel').value = settings.mt.model;
  $('ttsMode').value = settings.tts.mode;
  ttsEndpoints.mms = settings.tts.endpoint || ttsEndpoints.mms;
  ttsEndpoints.africa = settings.tts.africaEndpoint || ttsEndpoints.africa;
  $('ttsEndpoint').value = ttsEndpoints[settings.tts.mode] || ttsEndpoints.mms;
  $('autoSpeak').checked = settings.autoSpeak !== false;
  $('onlineVoice').checked = onlineVoice = !!settings.onlineVoice;
  $('asrMode').value = settings.asr.mode;
  $('asrEndpoint').value = settings.asr.endpoint;
  render();
  dictCount();
}

async function saveOverride(id, patch) {
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  await api.storage.local.set({ [`overrides:${code}`]: overrides });
  const e = pack.entries.find(x => x.id === id);
  Object.assign(e, patch);
  progress();
}

function progress() {
  const n = pack.entries.length;
  const tr = pack.entries.filter(e => e.t).length;
  const ver = pack.entries.filter(e => e.t && e.verified).length;
  const audio = pack.entries.filter(e => e.audio || (e.audioParts || []).some(Boolean)).length;
  $('progress').textContent = `${pack.name} : ${ver} validées, ${tr - ver} à valider, ${n - tr} à traduire · ${audio} avec voix`;
  $('barV').style.width = `${(100 * ver) / n}%`;
  $('barT').style.width = `${(100 * (tr - ver)) / n}%`;
}

function highlightPh(s) {
  const out = [];
  let last = 0;
  String(s).replace(/\{\w+\}/g, (m, i) => { out.push(s.slice(last, i), el('span', { class: 'ph' }, m)); last = i + m.length; return m; });
  out.push(s.slice(last));
  return out;
}

function row(e) {
  const t = el('textarea', { 'aria-label': `Traduction de ${e.fr}` });
  t.value = e.t || '';
  const ver = el('input', { type: 'checkbox' });
  ver.checked = !!e.verified;
  const who = el('div', { class: 'muted' }, e.verified && e.validator ? `${e.validator}${e.date ? ' · ' + e.date : ''}` : e.t && e.by ? `Proposé par ${e.by}` : '');
  const tr = el('tr', { class: e.verified ? 'row-ok' : '' });

  const phOk = () => !t.value.trim() || placeholders(t.value) === placeholders(e.fr);
  t.addEventListener('change', async () => {
    t.classList.toggle('bad', !phOk());
    if (!phOk()) { t.title = `Gardez exactement les marqueurs ${placeholders(e.fr)}`; return; }
    const changed = t.value.trim() !== (e.t || '');
    const hadAudio = !!(e.audio || (e.audioParts || []).some(Boolean));
    // New text = old recordings no longer match: clear them so audio and text never disagree.
    await saveOverride(e.id, { t: t.value.trim(), ...(changed ? { verified: false, audio: '', audioParts: [] } : {}) });
    if (changed) {
      ver.checked = false; tr.className = ''; who.textContent = '';
      audio.redraw();
      if (hadAudio) audio.prepend(el('div', { class: 'check' }, 'Texte modifié : enregistrez à nouveau'));
    }
  });
  ver.addEventListener('change', async () => {
    const name = $('validator').value.trim();
    if (ver.checked && (!t.value.trim() || !phOk() || !name)) {
      ver.checked = false;
      alert(!name ? 'Indiquez d\'abord le nom du validateur en haut de la page.' : 'Traduction vide ou marqueurs {…} incorrects.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    await saveOverride(e.id, ver.checked ? { verified: true, validator: name, date } : { verified: false });
    tr.className = ver.checked ? 'row-ok' : '';
    who.textContent = ver.checked ? `${name} · ${date}` : '';
  });

  const audio = audioCell(e);
  const x = el('textarea', { class: 'x', placeholder: 'Explication simple (facultatif)', 'aria-label': `Explication de ${e.fr}` });
  x.value = e.x || '';
  x.addEventListener('change', () => saveOverride(e.id, { x: x.value.trim() }));

  tr.append(
    el('td', { class: 'src' },
      el('div', {}, highlightPh(e.fr)),
      el('div', {}, highlightPh(e.en)),
      e.note ? el('div', { class: 'note' }, ico('info'), ' ', e.note) : null,
      el('div', { class: 'grp' }, `${e.group} · ${e.id}`),
      e.check ? el('span', { class: 'check' }, 'À vérifier sur la vraie page') : null),
    el('td', {}, t, e.group === 'ui' || e.group === 'safety-net' ? null : x),
    el('td', {}, el('label', { class: 'ok-label' }, ver, 'Validé'), who),
    el('td', {}, audio));
  return tr;
}

// ---------- audio recording by the native speaker ----------
/** Record / play / delete one clip. `save(dataUrl|'')` persists it. */
function clipControls(url, save) {
  const play = el('button', { class: 'icon', disabled: !url, title: 'Écouter', 'aria-label': 'Écouter', onclick: () => new Audio(url).play() }, ico('play'));
  let rec = null;
  const recBtn = el('button', { class: 'icon', title: 'Enregistrer (cliquez encore pour arrêter)', 'aria-label': 'Enregistrer' }, ico('mic'), url ? 'Refaire' : 'Enregistrer');
  recBtn.onclick = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = ev => chunks.push(ev.data);
      rec.onstop = () => {
        stream.getTracks().forEach(tk => tk.stop());
        const blob = new Blob(chunks, { type: rec.mimeType });
        rec = null;
        const fr = new FileReader();
        fr.onload = () => save(fr.result);
        fr.readAsDataURL(blob);
      };
      rec.start();
      recBtn.replaceChildren(ico('stop'), 'Arrêter');
      recBtn.classList.add('rec');
    } catch (err) { alert('Micro indisponible : ' + err.message); }
  };
  const del = el('button', { class: 'icon', disabled: !url, title: 'Supprimer', 'aria-label': 'Supprimer', onclick: () => save('') }, ico('trash'));
  return el('div', { class: 'toolbar' }, recBtn, play, del);
}

/**
 * One recording for a plain phrase. For a template ("Vous allez envoyer {amount} à {name}."),
 * one recording per piece of text between the values: at playback the real amount and name
 * are read in between, so the sentence is always exact.
 */
function audioCell(e) {
  const box = el('div');
  box.redraw = () => {
    box.replaceChildren();
    if (!e.t) { box.append(el('span', { class: 'muted' }, 'Traduisez d\'abord')); return; }
    const { segs, names } = E.splitTemplate(e.t);
    if (!names.length) {
      box.append(clipControls(e.audio, async url => { await saveOverride(e.id, { audio: url }); box.redraw(); }));
      return;
    }
    box.append(el('div', { class: 'muted', style: 'font-size:12px' }, 'Enregistrez chaque morceau ; les valeurs sont lues automatiquement :'));
    segs.forEach((seg, i) => {
      if (/\p{L}/u.test(seg)) {
        box.append(el('div', { style: 'margin:4px 0' },
          el('div', { style: 'font-size:12.5px' }, `« ${seg.trim()} »`),
          clipControls((e.audioParts || [])[i], async url => {
            const parts = [...(e.audioParts || [])];
            parts[i] = url;
            await saveOverride(e.id, { audioParts: parts });
            box.redraw();
          })));
      }
      if (i < names.length) box.append(el('div', { class: 'ph', style: 'display:inline-block;margin:2px 0' }, `{${names[i]}} → lu automatiquement`));
    });
  };
  box.redraw();
  return box;
}

function render() {
  const f = $('filter').value.trim().toLowerCase();
  const only = $('onlyMissing').checked;
  const list = pack.entries.filter(e => (!only || !e.t) && (!f || `${e.fr} ${e.en} ${e.t} ${e.id}`.toLowerCase().includes(f)));
  $('rows').replaceChildren(...list.map(row));
  progress();
}

// ---------- export / import ----------
$('export').onclick = () => {
  const entries = {};
  for (const e of pack.entries) {
    if (!e.t) continue;
    entries[e.id] = {
      t: e.t, x: e.x || '', verified: !!e.verified, validator: e.validator || '', date: e.date || '',
      audio: e.audio || '', audioParts: e.audioParts || [],
    };
  }
  const validators = [...new Set(Object.values(entries).filter(x => x.verified).map(x => x.validator))];
  const file = { code, validation: { validators, exportedAt: new Date().toISOString(), method: 'Native-speaker review in the Langwa glossary editor' }, entries };
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })), download: `${code}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('importBtn').onclick = () => $('import').click();

/** Minimal CSV parser (quotes, commas or semicolons, CRLF). */
function parseCsv(text) {
  const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim().toLowerCase().replace(/^﻿/, ''));
  const col = name => head.indexOf(name);
  const entries = {};
  for (const r of rows) {
    const id = (r[col('id')] || '').trim();
    const t = (r[col('translation')] ?? r[col('traduction')] ?? '').trim();
    if (!id || !t) continue;
    entries[id] = { t, x: (r[col('explanation')] ?? r[col('explication')] ?? '').trim(), by: (r[col('by')] ?? r[col('par')] ?? '').trim() };
  }
  return { entries };
}

/**
 * Imports contribution files from the Langwa contribution page, exported language files and
 * spreadsheets (CSV). Several files at once. Validated translations are never overwritten.
 */
$('import').multiple = true;
$('import').accept = '.json,.csv,application/json,text/csv';
$('import').onchange = async () => {
  const files = [...$('import').files];
  $('import').value = '';
  if (!files.length) return;
  const report = { added: 0, updated: 0, kept: 0, files: 0, errors: [] };
  const known = new Set(pack.entries.map(e => e.id));
  for (const f of files) {
    try {
      const text = await f.text();
      const j = /\.csv$/i.test(f.name) ? parseCsv(text) : JSON.parse(text);
      if (j.code && j.code !== code && !confirm(`« ${f.name} » est pour « ${j.code} », pas « ${code} ». Importer quand même ?`)) continue;
      const by = (j.contributor && j.contributor.name) || '';
      for (const [id, v] of Object.entries(j.entries || {})) {
        if (!known.has(id) || !v || !v.t) continue;
        const cur = overrides[id] || {};
        const existing = cur.t || (pack.entries.find(e => e.id === id) || {}).t;
        if (cur.verified && existing && existing !== v.t) { report.kept++; continue; } // never replace validated text
        const entry = { ...cur, ...v, by: v.by || by || cur.by || '' };
        if (existing && existing !== v.t) { entry.verified = false; report.updated++; } else if (!existing) report.added++;
        overrides[id] = entry;
      }
      report.files++;
    } catch (err) { report.errors.push(`${f.name} : ${err.message}`); }
  }
  await api.storage.local.set({ [`overrides:${code}`]: overrides });
  await loadAll();
  alert([
    `${report.files} fichier(s) importé(s).`,
    `${report.added} nouvelle(s) traduction(s), ${report.updated} mise(s) à jour (à revalider).`,
    report.kept ? `${report.kept} déjà validée(s), conservée(s) sans changement.` : '',
    ...report.errors,
  ].filter(Boolean).join('\n'));
};

/** Spreadsheet template (Google Sheets, Excel): one row per phrase, ready to fill. */
// ---------- dictionary import (team-provided, kept on this computer) ----------
const POS = /(?:noun|verb|adjective|adverb|preposition|pronoun|conjunction|interjection|expr(?:ession)?|numeral|grammatical entity|ideophone|particle|determiner|auxiliary|nom|verbe|adjectif|adverbe)$/i;
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'its', 'his', 'her', 'les', 'des', 'une', 'pour', 'avec', 'dans', 'sur', 'qui', 'que', 'est', 'son', 'ses', 'aux', 'par', 'fig', 'etc', 'also', 'used', 'kind', 'type', 'sort']);
const foldW = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Pairs [headword, meaning] from pasted text: dictionary pages, "word = meaning", tables. */
function parseDictionary(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const sep = l.match(/^(.{1,40}?)\s*(?:=|\t|\s:\s| - | – )\s*(.{2,})$/);
    if (sep) { pairs.push([sep[1].trim(), sep[2].trim()]); continue; }
    if (POS.test(l) && l.length <= 70) {
      const word = l.replace(POS, '').trim();
      const next = lines[i + 1];
      if (word && next && !POS.test(next)) { pairs.push([word, next]); i++; }
    }
  }
  return pairs;
}

/** Index by the meaning's main words, strictly: "pound sterling" -> pound; "agreement, entente" -> agreement, entente. */
function indexPairs(pairs) {
  const idx = {};
  for (const [word, meaning] of pairs) {
    if (meaning.length > 80) continue; // an encyclopedic explanation, not a word meaning
    for (const g of foldW(meaning.replace(/\([^)]*\)/g, ' ')).split(/[,;.:/]| or | ou /)) {
      const parts = g.replace(/^\s*(to|a|an|the|le|la|les|l'|un|une|se)\s+/, '').trim().split(/\s+/);
      if (!parts[0] || parts.length > 2) continue;
      const key = parts[0].replace(/[^a-z]/g, '');
      if (key.length < 3 || STOP.has(key)) continue;
      (idx[key] ||= []);
      if (!idx[key].includes(word)) idx[key].push(word);
    }
  }
  return idx;
}

async function dictCount() {
  const k = `lexicon:${code}`;
  const own = (await api.storage.local.get(k))[k];
  $('dictCount').textContent = own ? `${Object.keys(own.en || {}).length} sens importés pour ${pack.name}${own.source ? ' · ' + own.source : ''}` : `Aucun dictionnaire importé pour ${pack.name}`;
}

$('dictImport').onclick = async () => {
  const pairs = parseDictionary($('dictText').value);
  if (!pairs.length) { $('dictMsg').textContent = 'Aucune paire mot / sens trouvée.'; return; }
  const k = `lexicon:${code}`;
  const own = (await api.storage.local.get(k))[k] || { en: {} };
  const idx = indexPairs(pairs);
  for (const [w, terms] of Object.entries(idx)) own.en[w] = [...new Set([...(own.en[w] || []), ...terms])];
  own.source = $('dictSource').value.trim() || own.source || '';
  await api.storage.local.set({ [k]: own });
  $('dictMsg').textContent = `${pairs.length} mots lus, ${Object.keys(idx).length} sens ajoutés. Exemples : ${pairs.slice(0, 3).map(p => p[0] + ' = ' + p[1]).join(' · ')}`;
  $('dictText').value = '';
  dictCount();
};
$('dictClear').onclick = async () => {
  if (!confirm(`Effacer les mots importés pour ${pack.name} ?`)) return;
  await api.storage.local.remove(`lexicon:${code}`);
  $('dictMsg').textContent = 'Mots importés effacés.';
  dictCount();
};

$('exportCsv').onclick = () => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['id', 'group', 'fr', 'en', 'note', 'translation', 'explanation', 'by'].join(',')];
  for (const e of pack.entries) lines.push([e.id, e.group, e.fr, e.en, e.note || '', e.t || '', e.x || '', e.by || e.validator || ''].map(esc).join(','));
  const a = el('a', { href: URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: `langwa-${code}.csv` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

// ---------- test bench ----------
$('run').onclick = async () => {
  const text = $('probe').value;
  const engine = E.createEngine(pack);
  const m = P.mask(P.normSpaces(text));
  const plan = engine.plan(text);
  const local = engine.translateLocal(text);
  const lines = [
    `Texte masqué (seul ceci peut être envoyé à un traducteur) :\n  ${m.masked}`,
    `Valeurs protégées :\n${m.tokens.map(t => `  ${t.key} = ${t.value}  [${t.type}]`).join('\n') || '  (aucune)'}`,
    `Type de message : ${E.classify(text) || 'information'}`,
    plan.skip ? 'Valeur pure ou nom propre : affiché tel quel.' : `Découpage : ${plan.parts.map(p => (p.kind === 'lit' ? `[gardé] "${p.text}"` : `[à traduire] "${p.text}"`)).join(' + ')}`,
    local ? `Résultat (glossaire / résumé sûr) : [${local.status}] ${local.text}` : '',
    local && local.integrity ? `Contrôle d'intégrité : ${local.integrity.ok ? 'OK, tous les montants et valeurs sont identiques' : JSON.stringify(local.integrity.problems)}` : '',
  ];
  const settings = await api.runtime.sendMessage({ type: 'getSettings' });
  if (!plan.skip && settings.mt.mode !== 'none') {
    const parts = plan.parts.filter(p => p.kind === 'tr' && !engine.lookupMasked(p.masked, p.tokens));
    if (parts.length) {
      const reply = await api.runtime.sendMessage({ type: 'translateBatch', lang: code, items: parts.map(p => ({ masked: p.masked })) });
      if (reply && reply.error) lines.push(`⚠ Serveur de traduction locale injoignable : ${reply.error}`);
      parts.forEach((p, i) => {
        const r = reply && reply.results && reply.results[i];
        if (!r) { lines.push(`Traduction locale : indisponible pour "${p.text}"`); return; }
        const un = P.unmask(r.text, p.tokens);
        lines.push(`Traduction locale brute : ${r.text}`, un.ok ? `Après restauration : ${un.text}` : `⛔ Bloquée : ${un.problems.join('; ')}`);
      });
    }
  }
  $('out').textContent = lines.filter(Boolean).join('\n\n');

  // Listen: exactly what the 🔊 button on the page will play.
  const ttsOn = (settings.tts.mode === 'mms' && !!(langs[code] || {}).mms)
    || (settings.tts.mode === 'africa' && !!(langs[code] || {}).africaTts);
  const steps = local && player.prepare(local.speech, ttsOn);
  $('listen').disabled = !steps;
  $('listenMsg').textContent = steps ? ''
    : local && local.speech ? `Enregistrement manquant : ${local.speech.filter(s => s.missing).map(s => `« ${s.text} »`).join(', ')}` : '';
  $('listen').onclick = () => steps && player.play(steps);
};

let onlineVoice = false;
const player = globalThis.LangwaSpeech.createPlayer({
  online: () => onlineVoice,
  tts: text => api.runtime.sendMessage({ type: 'tts', lang: code, text }),
});

// ---------- settings ----------
$('saveMt').onclick = async () => {
  const cur = await api.runtime.sendMessage({ type: 'getSettings' });
  await api.storage.local.set({
    settings: {
      ...cur,
      mt: { mode: $('mtMode').value, endpoint: $('mtEndpoint').value.trim(), model: $('mtModel').value.trim() },
      tts: {
        mode: $('ttsMode').value,
        endpoint: $('ttsMode').value === 'mms' ? $('ttsEndpoint').value.trim() : ttsEndpoints.mms,
        africaEndpoint: $('ttsMode').value === 'africa' ? $('ttsEndpoint').value.trim() : ttsEndpoints.africa,
      },
      autoSpeak: $('autoSpeak').checked,
      onlineVoice: (onlineVoice = $('onlineVoice').checked),
      asr: { mode: $('asrMode').value, endpoint: $('asrEndpoint').value.trim() },
    },
  });
  $('mtMsg').textContent = 'Enregistré.';
};
$('mtMode').onchange = () => {
  if ($('mtMode').value === 'nllb') $('mtEndpoint').value = 'http://127.0.0.1:8765/translate';
  if ($('mtMode').value === 'openai') $('mtEndpoint').value = 'http://localhost:11434/v1/chat/completions';
};
$('clearCache').onclick = async () => { await api.runtime.sendMessage({ type: 'clearCache', lang: code }); $('mtMsg').textContent = 'Cache vidé.'; };
$('validator').onchange = () => api.storage.local.set({ validatorName: $('validator').value.trim() });
$('ttsMode').onchange = () => {
  const mode = $('ttsMode').value;
  if (mode === 'africa' || mode === 'mms') $('ttsEndpoint').value = ttsEndpoints[mode];
};
$('lang').onchange = () => { code = $('lang').value; loadAll(); };
$('filter').oninput = render;
$('onlyMissing').onchange = render;

(async () => { code = (await api.runtime.sendMessage({ type: 'getSettings' })).lang; loadAll(); })();
