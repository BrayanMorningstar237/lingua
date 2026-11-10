/*
 * Langwa: background script (Chrome/Edge/Brave/Opera service worker, Firefox event page).
 * - Builds the language pack: lang/source.json + lang/<code>.json + edits saved from the glossary editor.
 * - Optional fallback: LOCAL open-source machine translation. Only MASKED text is sent
 *   (amounts, names, numbers are already replaced by ⟦A⟧ tokens), and only to localhost.
 */
const api = globalThis.browser ?? globalThis.chrome;

// Languages: lang/languages.json (nllb = NLLB-200 code for local MT, mms = Meta MMS-TTS voice).
let LANGS = {};
const langsReady = fetch(api.runtime.getURL('lang/languages.json'))
  .then(r => r.json()).then(j => { LANGS = j; return j; }).catch(() => LANGS);

const DEFAULT_SETTINGS = {
  lang: null, // chosen by the user on first use (language chooser on the page and in the popup)
  sites: ['https://safinum.cm', 'http://localhost', 'http://127.0.0.1', 'file://'],
  toasts: true,
  hover: 'ctrl', // 'ctrl' = Ctrl/Cmd + hover shows the translation below the element; 'always'; 'off'
  autoSpeak: true, // read new important messages aloud when a recording exists
  mt: { mode: 'none', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'qwen2.5:7b-instruct' },
  tts: { mode: 'none', endpoint: 'http://127.0.0.1:8766/tts' },
};

async function getSettings() {
  const { settings } = await api.storage.local.get('settings');
  const s = settings || {};
  return {
    ...DEFAULT_SETTINGS, ...s,
    mt: { ...DEFAULT_SETTINGS.mt, ...(s.mt || {}) },
    tts: { ...DEFAULT_SETTINGS.tts, ...(s.tts || {}) },
  };
}

// ---------- local neural voice (Meta MMS-TTS, Fulfulde) ----------
const ttsCache = new Map();
async function synthesize(code, text) {
  const settings = await getSettings();
  const mms = (LANGS[code] || {}).mms;
  if (settings.tts.mode !== 'mms' || !mms || !text) return null;
  const key = `${code}\u0001${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);
  try {
    const r = await fetch(settings.tts.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang: mms }),
    });
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const url = `data:audio/wav;base64,${btoa(bin)}`;
    if (ttsCache.size > 200) ttsCache.delete(ttsCache.keys().next().value);
    ttsCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

async function fetchJson(path) {
  try {
    const r = await fetch(api.runtime.getURL(path));
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** code null = no language chosen yet: source strings only (used for the interface in French/English). */
async function loadPack(code) {
  const source = (await fetchJson('lang/source.json')) || { entries: [] };
  const file = (code && (await fetchJson(`lang/${code}.json`))) || { entries: {} };
  const key = `overrides:${code}`;
  const overrides = (await api.storage.local.get(key))[key] || {};
  const entries = source.entries.map(e => {
    const tr = { ...(file.entries || {})[e.id], ...overrides[e.id] };
    return {
      ...e, t: tr.t || '', x: tr.x || '', verified: !!tr.verified, validator: tr.validator || '', date: tr.date || '',
      audio: tr.audio || '', audioParts: Array.isArray(tr.audioParts) ? tr.audioParts : [], by: tr.by || '',
    };
  });
  const l = LANGS[code] || {};
  const lex = (await fetchJson('lang/lexicon.json')) || {};
  const lexicon = code ? { fr: (lex.fr || {})[code] || {}, en: (lex.en || {})[code] || {} } : null;
  return { code, name: l.name || code || '', mms: l.mms || null, entries, lexicon };
}

/** Languages with the number of translated phrases (the chooser marks empty ones "Soon"). */
async function langsWithCounts() {
  const out = {};
  for (const [code, l] of Object.entries(LANGS)) {
    const file = (await fetchJson(`lang/${code}.json`)) || { entries: {} };
    const key = `overrides:${code}`;
    const overrides = (await api.storage.local.get(key))[key] || {};
    const ids = new Set([...Object.keys(file.entries || {}), ...Object.keys(overrides)]);
    let count = 0;
    for (const id of ids) if ((overrides[id] && overrides[id].t) || ((file.entries || {})[id] && file.entries[id].t)) count++;
    out[code] = { ...l, count };
  }
  return out;
}

// ---------- local open-source machine translation ----------
const cacheKey = code => `mtcache:${code}`;

async function cacheGet(code) {
  return (await api.storage.local.get(cacheKey(code)))[cacheKey(code)] || {};
}

async function cachePut(code, add) {
  const cur = await cacheGet(code);
  const next = { ...cur, ...add };
  const keys = Object.keys(next);
  if (keys.length > 3000) for (const k of keys.slice(0, keys.length - 3000)) delete next[k];
  await api.storage.local.set({ [cacheKey(code)]: next });
}

function systemPrompt(langName, glossary) {
  return [
    `You translate the interface text of a banking application from French or English into ${langName}, a national language of Cameroon, for users who read ${langName} better than French or English.`,
    'Rules:',
    '- Tokens like ⟦A⟧, ⟦B⟧ stand for amounts, names, phone or account numbers. Copy every token exactly once, unchanged. Never write digits yourself.',
    '- Keep the exact meaning: who pays, who receives, debit or credit, conditions, deadlines, warnings and negations ("never", "do not").',
    `- Use the standard orthography of ${langName} (General Alphabet of Cameroon Languages).`,
    '- Use these validated terms when they apply:',
    ...glossary.slice(0, 120).map(g => `  ${g.src} => ${g.t}`),
    '- Answer with the translation only, no explanation.',
  ].join('\n');
}

async function mtOpenAICompatible(settings, langName, glossary, masked) {
  const r = await fetch(settings.mt.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: settings.mt.model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt(langName, glossary) },
        { role: 'user', content: masked },
      ],
    }),
  });
  if (!r.ok) throw new Error(`MT HTTP ${r.status}`);
  const j = await r.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return text ? { text: text.trim(), confidence: 'low' } : null;
}

async function mtNllb(settings, code, texts) {
  const nllb = (LANGS[code] || {}).nllb;
  if (!nllb) return texts.map(() => null);
  const r = await fetch(settings.mt.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texts, tgt: nllb }),
  });
  if (!r.ok) throw new Error(`MT HTTP ${r.status}`);
  const j = await r.json();
  return (j.translations || []).map(t => (t ? { text: t, confidence: 'low' } : null));
}

async function translateBatch(code, items) {
  const settings = await getSettings();
  const cache = await cacheGet(code);
  const out = items.map(it => cache[it.masked] || null);
  const missing = items.map((it, i) => (out[i] ? null : i)).filter(i => i !== null);
  if (!missing.length || settings.mt.mode === 'none') return { results: out, error: null };
  let error = null;

  const pack = await loadPack(code);
  const glossary = pack.entries.filter(e => e.t && e.verified && !e.id.startsWith('gist_'))
    .map(e => ({ src: e.fr, t: e.t }));
  const add = {};
  try {
    if (settings.mt.mode === 'nllb') {
      const res = await mtNllb(settings, code, missing.map(i => items[i].masked));
      missing.forEach((i, k) => { out[i] = res[k]; if (res[k]) add[items[i].masked] = res[k]; });
    } else {
      // 3 requests at a time: small local models are faster on short single strings.
      for (let k = 0; k < missing.length; k += 3) {
        const chunk = missing.slice(k, k + 3);
        const res = await Promise.all(chunk.map(i =>
          mtOpenAICompatible(settings, pack.name, glossary, items[i].masked).catch(e => { error = e.message; return null; })));
        chunk.forEach((i, n) => { out[i] = res[n]; if (res[n]) add[items[i].masked] = res[n]; });
        if (error && !res.some(Boolean)) break; // server down: do not hammer it
      }
    }
  } catch (e) {
    error = e.message;
  }
  if (error) console.warn('[Langwa] local MT unavailable:', error);
  if (Object.keys(add).length) await cachePut(code, add);
  return { results: out, error };
}

// ---------- messaging ----------
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    await langsReady;
    switch (msg && msg.type) {
      case 'getSettings': return getSettings();
      case 'getLangs': return langsWithCounts();
      case 'getPack': return loadPack(msg.lang || (await getSettings()).lang);
      case 'translateBatch': return translateBatch(msg.lang, msg.items || []);
      case 'tts': return synthesize(msg.lang, msg.text);
      case 'clearCache': await api.storage.local.remove(cacheKey(msg.lang)); return true;
      default: return null;
    }
  })().then(sendResponse, err => sendResponse({ error: String(err) }));
  return true; // async response (Chrome + Firefox)
});

api.runtime.onInstalled.addListener(async () => {
  const { settings } = await api.storage.local.get('settings');
  if (!settings) await api.storage.local.set({ settings: DEFAULT_SETTINGS });
});
