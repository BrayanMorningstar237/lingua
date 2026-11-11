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
  // 'auto': the local voice (Africa TTS) whenever its server runs on this computer, else the browser voice
  // voice: 'female' (a clear female speaker) or 'default' (the language's own recorded speaker)
  tts: { mode: 'auto', voice: 'female', endpoint: 'http://127.0.0.1:8766/tts', africaEndpoint: 'http://127.0.0.1:8770/tts' },
  asr: { mode: 'browser', endpoint: 'http://127.0.0.1:8767/asr' }, // voice questions: 'browser' (with consent), 'local' (MMS server), 'none'
};

async function getSettings() {
  const { settings } = await api.storage.local.get('settings');
  const s = settings || {};
  return {
    ...DEFAULT_SETTINGS, ...s,
    mt: { ...DEFAULT_SETTINGS.mt, ...(s.mt || {}) },
    // 'none' saved before anyone chose a voice (older versions) becomes 'auto'; an explicit choice is kept.
    tts: { ...DEFAULT_SETTINGS.tts, ...(s.tts || {}), ...(s.tts && s.tts.mode === 'none' && !s.tts.chosen ? { mode: 'auto' } : {}) },
    asr: { ...DEFAULT_SETTINGS.asr, ...(s.asr || {}) },
  };
}

// ---------- local neural voices (Meta MMS-TTS or Africa TTS) ----------
const ttsCache = new Map();
let ttsDownUntil = 0; // local voice unavailable or loading: use the browser voice for a while
let ttsDownWhy = 'offline';

/**
 * Local neural voice. Returns a playable data: URL, or { fail } with the reason the browser
 * voice is used instead ('offline', 'loading', 'slow', 'error'), so the card can say why.
 */

/** Is the local voice server running and ready? Asked at most every 10 s, 1 s time limit. */
const voiceHealth = { at: 0, ready: false };
async function localVoiceReady(endpoint) {
  if (Date.now() - voiceHealth.at < 10000) return voiceHealth.ready;
  voiceHealth.at = Date.now();
  try {
    const r = await fetch(endpoint.replace(/\/tts\/?$/, '/health'), { signal: AbortSignal.timeout(1000) });
    const j = r.ok ? await r.json() : {};
    voiceHealth.ready = j.status === 'ready';
  } catch {
    voiceHealth.ready = false;
  }
  return voiceHealth.ready;
}
async function voiceStatus() {
  const { tts } = await getSettings();
  if (tts.mode === 'none') return { mode: 'none', ready: false };
  if (tts.mode === 'mms') return { mode: 'mms', ready: true };
  return { mode: tts.mode, ready: await localVoiceReady(tts.africaEndpoint) };
}

async function synthesize(code, text) {
  const settings = await getSettings();
  const lang = LANGS[code] || {};
  const isAfrica = settings.tts.mode === 'africa' || settings.tts.mode === 'auto';
  const modelLang = isAfrica ? lang.africaTts : settings.tts.mode === 'mms' ? lang.mms : null;
  const endpoint = isAfrica ? settings.tts.africaEndpoint : settings.tts.endpoint;
  if (!modelLang || !text || !endpoint) return null;
  const voice = isAfrica ? settings.tts.voice || 'female' : '';
  const key = `${settings.tts.mode}\u0001${voice}\u0001${code}\u0001${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);
  if (Date.now() < ttsDownUntil) return { fail: ttsDownWhy };
  try {
    const r = await fetch(endpoint, {
      signal: AbortSignal.timeout(Math.min(20000, 4000 + text.length * 60)),
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang: modelLang, voice }),
    });
    if (!r.ok) {
      voiceHealth.ready = false;
      if (r.status === 503) { ttsDownUntil = Date.now() + 8000; ttsDownWhy = 'loading'; return { fail: 'loading' }; }
      return { fail: 'error' };
    }
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const url = `data:audio/wav;base64,${btoa(bin)}`;
    if (ttsCache.size > 200) ttsCache.delete(ttsCache.keys().next().value);
    ttsCache.set(key, url);
    voiceHealth.ready = true;
    return url;
  } catch (e) {
    if (e && e.name === 'TimeoutError') return { fail: 'slow' };
    ttsDownUntil = Date.now() + 10000; ttsDownWhy = 'offline'; voiceHealth.ready = false;
    return { fail: 'offline' };
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
  // Words shipped with Langwa + dictionaries the team imported in the editor (kept on this computer).
  const own = code ? ((await api.storage.local.get(`lexicon:${code}`))[`lexicon:${code}`] || {}) : {};
  const merge = (a = {}, b = {}) => { const o = { ...a }; for (const [w, t] of Object.entries(b)) o[w] = [...new Set([...(t || []), ...(o[w] || [])])]; return o; };
  const lexicon = code ? { fr: merge((lex.fr || {})[code], own.fr), en: merge((lex.en || {})[code], own.en) } : null;
  return {
    code, name: l.name || code || '', mms: l.mms || null, africaTts: l.africaTts || null,
    voices: l.voices || null, reading: l.reading || null, entries, lexicon,
  };
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
    '- Use these glossary drafts when they apply. They may be unvalidated; preserve their intended meaning and do not treat them as authoritative:',
    ...glossary.slice(0, 120).map(g => `  ${g.src} => ${g.t}${g.note ? ` (meaning: ${g.note})` : ''}`),
    '- Answer with the translation only, no explanation.',
  ].join('\n');
}

// ---------- assistant: free questions to a LOCAL open-source model ----------
async function chatAnswer(code, question, context) {
  const settings = await getSettings();
  if (settings.mt.mode !== 'openai') return null;
  const name = (LANGS[code] || {}).name || code;
  const r = await fetch(settings.mt.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: settings.mt.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: [
          `You are Langwa, a patient helper for a Cameroonian user who reads ${name} more easily than French or English.`,
          'The user is on a banking page. Answer their question about this page only, in 2 or 3 short sentences, in the language of their question (if unsure, in ' + name + ').',
          'Use only the facts in the page content below. Never invent an amount, a name or a number. If the page does not say, say you do not know.',
          'Never ask for or repeat a PIN or secret code.',
          'Page content (translation, then original):',
          ...context.slice(0, 80).map(c => '- ' + c),
        ].join('\n') },
        { role: 'user', content: question },
      ],
    }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return text ? { text: text.trim() } : null;
}

// ---------- assistant: voice questions to the LOCAL open-source speech server (MMS) ----------
async function transcribe(audio, hint) {
  const settings = await getSettings();
  if (settings.asr.mode !== 'local') return null;
  try {
    const r = await fetch(settings.asr.endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, hint, languages: Object.keys(LANGS) }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
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
  const glossary = pack.entries.filter(e => e.t && !e.id.startsWith('gist_'))
    .map(e => ({ src: [e.fr, e.en].filter(Boolean).join(' / '), t: e.t, note: e.note || '' }));
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
      case 'voiceStatus': return voiceStatus();
      case 'chat': return chatAnswer(msg.lang, msg.question, msg.context || []).catch(() => null);
      case 'asr': return transcribe(msg.audio, msg.hint);
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
