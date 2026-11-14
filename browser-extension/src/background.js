/*
 * Langwa: background script (Chrome/Edge/Brave/Opera service worker, Firefox event page).
 * - Builds the language pack: lang/source.json + lang/<code>.json + edits saved from the glossary editor.
 * - Optional fallback: LOCAL open-source machine translation. Only MASKED text is sent
 *   (amounts, names, numbers are already replaced by ⟦A⟧ tokens), and only to localhost.
 */
const api = globalThis.browser ?? globalThis.chrome;

// Languages: lang/languages.json (nllb = NLLB-200 code, mms = Meta MMS-TTS voice).
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
// info: { status, progress, etaSec } while the voice installs or loads, so cards can show it live
// (asked every 2.5 s then, every 10 s otherwise).
const voiceHealth = { at: 0, ready: false, endpoint: '', info: null };
async function localVoiceReady(endpoint) {
  const ttl = voiceHealth.info && !voiceHealth.ready ? 2500 : 10000;
  if (voiceHealth.endpoint === endpoint && Date.now() - voiceHealth.at < ttl) return voiceHealth.ready;
  voiceHealth.at = Date.now();
  voiceHealth.endpoint = endpoint;
  try {
    const r = await fetch(endpoint.replace(/\/tts\/?$/, '/health'), { signal: AbortSignal.timeout(1000) });
    const j = r.ok ? await r.json() : {};
    voiceHealth.ready = j.status === 'ready';
    voiceHealth.info = j.status === 'installing' || j.status === 'loading'
      ? { status: j.status, progress: j.progress || 0, etaSec: j.etaSec ?? null } : null;
    // The model sleeps when unused (low-memory computers): Langwa is opening a page, so wake it
    // now; it is ready (about 20 s) before most people press Listen. The browser voice covers.
    if (j.status === 'sleeping') fetch(endpoint.replace(/\/tts\/?$/, '/wake'), { method: 'POST' }).catch(() => {});
  } catch {
    voiceHealth.ready = false;
    voiceHealth.info = null;
  }
  return voiceHealth.ready;
}
async function voiceStatus() {
  const settings = await getSettings();
  const { tts } = settings;
  if (tts.mode === 'none') return { mode: 'none', ready: false };
  if (tts.mode === 'mms') return { mode: 'mms', ready: true };
  const activeLang = LANGS[settings.lang] || {};
  if (tts.mode === 'auto' && !activeLang.africaTts && activeLang.mms) {
    return { mode: 'mms', ready: await localVoiceReady(tts.endpoint) };
  }
  const ready = await localVoiceReady(tts.africaEndpoint);
  return { mode: tts.mode, ready, info: voiceHealth.info };
}

async function synthesize(code, text) {
  const settings = await getSettings();
  const lang = LANGS[code] || {};
  const isAutoMms = settings.tts.mode === 'auto' && !lang.africaTts && !!lang.mms;
  const isAfrica = settings.tts.mode === 'africa' || (settings.tts.mode === 'auto' && !isAutoMms);
  const useMms = settings.tts.mode === 'mms' || isAutoMms;
  const modelLang = isAfrica ? lang.africaTts : useMms ? lang.mms : null;
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
// Coverage per language: translated phrases (count), validated by a speaker (verified), out of
// the page phrases (total). Pickers list the most complete languages first.
async function langsWithCounts() {
  const out = {};
  const source = (await fetchJson('lang/source.json')) || { entries: [] };
  const total = Math.max(1, (source.entries || []).length);
  for (const [code, l] of Object.entries(LANGS)) {
    const file = (await fetchJson(`lang/${code}.json`)) || { entries: {} };
    const key = `overrides:${code}`;
    const overrides = (await api.storage.local.get(key))[key] || {};
    const ids = new Set([...Object.keys(file.entries || {}), ...Object.keys(overrides)]);
    let count = 0;
    let verified = 0;
    for (const id of ids) {
      const e = (overrides[id] && overrides[id].t) ? overrides[id] : (file.entries || {})[id];
      if (e && e.t) { count++; if (e.verified) verified++; }
    }
    out[code] = { ...l, count, verified, total, pct: Math.min(100, Math.round((100 * count) / total)) };
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

// Long verses cost prompt time on a small CPU model and add little: keep their start.
const clip = s => (String(s).length > 220 ? String(s).slice(0, 220) + '…' : String(s));

function systemPrompt(langName, glossary, code, corpusExamples = []) {
  const targetRules = code === 'wes'
    ? [
      'Translate visible text from websites and apps into Cameroonian Pidgin English (Kamtok), the English-lexifier language used in Cameroon. This model is specialized for English to Kamtok.',
      'Write natural, clear Kamtok as people use it in Cameroon. Do not produce Nigerian Pidgin, formal English, or a word-for-word English calque.',
      'Preserve meaning, tone, negation, warnings, and who does what. Keep names, account/phone identifiers, and currency tokens exactly as given.',
    ]
    : [
      `You translate the interface text of a banking application from French or English into ${langName}, a national language of Cameroon, for users who read ${langName} better than French or English.`,
      `Use the standard orthography of ${langName} (General Alphabet of Cameroon Languages).`,
      ...(code === 'lns' ? [
        'Translate into Lamnso (Nso), not French or English. Use simple, natural Lamnso and preserve the source meaning rather than translating word by word.',
        'The supplied parallel examples come from Bible verses. They are retrieved only as weak orthography and language-pattern hints, not banking vocabulary or authoritative meanings. Never copy their religious content into a banking translation.',
      ] : []),
    ];
  return [
    ...targetRules,
    'Rules:',
    '- Tokens like ⟦A⟧, ⟦B⟧ stand for amounts, names, phone or account numbers. Copy every token exactly once, unchanged. Never write digits yourself.',
    '- Keep the exact meaning: who pays, who receives, debit or credit, conditions, deadlines, warnings and negations ("never", "do not").',
    '- Use these glossary drafts when they apply. They may be unvalidated; preserve their intended meaning and do not treat them as authoritative:',
    ...glossary.slice(0, 120).map(g => `  ${g.src} => ${g.t}${g.note ? ` (meaning: ${g.note})` : ''}`),
    ...(corpusExamples.length ? [
      'Retrieved parallel text (Bible-derived, weak language-pattern examples only; do not copy their meaning):',
      ...corpusExamples.map((e, i) => `  ${i + 1}. ${clip(e.source)} => ${clip(e.lamnso)}`),
    ] : []),
    '- Answer with the translation only, no explanation.',
  ].join('\n');
}

// ---------- assistant: free questions to a LOCAL open-source model ----------
async function chatAnswer(code, question, context) {
  const settings = code === 'lns' ? lnsSettings(await getSettings()) : await getSettings();
  if (settings.mt.mode !== 'openai') return null;
  const name = (LANGS[code] || {}).name || code;
  let corpusExamples = [];
  if (code === 'lns') {
    try {
      const ex = await fetch('http://127.0.0.1:8769/examples', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: `${question} ${context.slice(0, 20).join(' ')}`, limit: 3 }),
        signal: AbortSignal.timeout(5000),
      });
      if (ex.ok) {
        const j = await ex.json();
        corpusExamples = Array.isArray(j.examples) ? j.examples : [];
      }
    } catch { /* question can still use the exact page facts */ }
  }
  const r = await fetch(settings.mt.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: settings.mt.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: [
          `You are Langwa, a patient helper for a Cameroonian user who selected ${name}.`,
          `Always answer in ${name}, even when the question is in English or French. Never switch to the question's language. Keep the answer to 2 or 3 short, natural sentences.`,
          'Answer only about the current web page. Preserve the page context and distinguish the current balance, transfer amount, fees, recipient, and next step.',
          'Use only the facts in the page content below. Never invent an amount, a name or a number. If the page does not say, say you do not know.',
          'Never ask for or repeat a PIN or secret code.',
          ...(code === 'lns' ? [
            'Answer in Lamnso (Nso), using short and clear sentences. Do not answer in English or French.',
            'Any parallel examples below come from Bible verses. They provide weak language-pattern hints only; never use their religious meaning for a banking answer.',
            ...corpusExamples.map(e => `Language example: ${clip(e.source)} => ${clip(e.lamnso)}`),
          ] : []),
          'Page content (translation, then original):',
          ...context.slice(0, 80).map(c => '- ' + c),
        ].join('\n') },
        { role: 'user', content: question },
      ],
    }),
    signal: AbortSignal.timeout(60000),
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

/**
 * Lamnso' has its own small local model (server\start-lamnso.cmd: llama.cpp + Qwen2.5 1.5B on
 * port 8771), used automatically whatever the general mode, unless the user chose their own LLM.
 * Other languages never reach it.
 */
const LNS_LLM = { mode: 'openai', endpoint: 'http://127.0.0.1:8771/v1/chat/completions', model: 'lamnso' };
function lnsSettings(settings) {
  return settings.mt.mode === 'openai' ? settings : { ...settings, mt: { ...settings.mt, ...LNS_LLM } };
}

/** Dictionary words (Bible alignment) that occur in this text: the model's most useful hints. */
function lexiconHints(lexicon, text) {
  if (!lexicon) return [];
  const words = new Set(String(text).toLowerCase().match(/\p{L}+/gu) || []);
  const out = [];
  for (const side of ['en', 'fr']) {
    for (const [w, terms] of Object.entries(lexicon[side] || {})) {
      if (!words.has(w.toLowerCase())) continue;
      const t = (terms || []).map(x => (typeof x === 'string' ? x : x.term)).filter(Boolean);
      if (t.length) out.push(`${w} => ${t.slice(0, 2).join(' / ')}`);
    }
  }
  return out.slice(0, 12);
}

async function mtOpenAICompatible(settings, langName, glossary, masked, code, hints = []) {
  let examples = [];
  if (code === 'lns') {
    const r = await fetch('http://127.0.0.1:8769/examples', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: masked, limit: 3 }), signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error('Lamnso corpus retrieval is offline. Start server\\start-lamnso.cmd.');
    const j = await r.json();
    // Short labels ("OK") can match nothing: the glossary alone still guides the model.
    examples = Array.isArray(j.examples) ? j.examples : [];
  }
  const r = await fetch(settings.mt.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: settings.mt.model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt(langName, glossary, code, examples) },
        { role: 'user', content: code === 'lns'
          ? [
            ...(hints.length ? ['Lamnso dictionary words found in this text (unvalidated):', ...hints, ''] : []),
            `Translate this banking interface text into Lamnso. Keep all ⟦...⟧ tokens exactly once.\n${masked}`,
          ].join('\n')
          : masked },
      ],
      max_tokens: 160,
    }),
    signal: AbortSignal.timeout(60000),
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

async function mtCameroon(settings, code, texts) {
  if (code !== 'lns') return texts.map(() => null);
  // Keep Lamnso' available with the default MT setting. This endpoint is the local
  // Flagship AI MarianMT server; it never sends page text to a hosted service.
  const endpoint = settings.mt.mode === 'cameroon'
    ? settings.mt.endpoint
    : 'http://127.0.0.1:8768/translate';
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texts, target: 'lamnso' }),
  });
  if (!r.ok) throw new Error(`MT HTTP ${r.status}`);
  const j = await r.json();
  return (j.translations || []).map(t => (t ? { text: t, confidence: 'low' } : null));
}

/**
 * Small open models sometimes "hallucinate" (e.g. a Bible-trained model turning "Frais" into a
 * verse) or loop. Such output is rejected so the page shows the safe summary instead.
 */
function looksBroken(src, out) {
  const t = String(out || '').trim();
  if (!t) return true;
  const comparable = value => String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
  if (comparable(src) && comparable(src) === comparable(t)) return true; // do not badge untranslated English as a draft
  if (t.length > Math.max(24, src.length * 2.5)) return true;
  const w = t.toLowerCase().split(/\s+/);
  const grams = new Map();
  for (let i = 0; i < w.length; i++) {
    if (i >= 2 && w[i] === w[i - 1] && w[i] === w[i - 2]) return true;
    if (i >= 2) { const g = w.slice(i - 2, i + 1).join(' '); grams.set(g, (grams.get(g) || 0) + 1); if (grams.get(g) > 2) return true; }
  }
  return false;
}

async function translateBatch(code, items) {
  const base = await getSettings();
  // Lamnso' always goes through the corpus and its own small local model.
  const settings = code === 'lns' ? lnsSettings(base) : base;
  // Keep Turaco output isolated from previous machine translations for Kamtok.
  const cacheCode = code === 'wes' && settings.mt.mode === 'turaco' ? 'wes-turaco'
    : code === 'lns' ? 'lns-rag' : code;
  const cache = await cacheGet(cacheCode);
  const out = items.map(it => cache[it.masked] || null);
  const missing = items.map((it, i) => (out[i] ? null : i)).filter(i => i !== null);
  // Turaco is specifically trained for English -> Cameroonian Pidgin (Kamtok).
  if (settings.mt.mode === 'turaco' && code !== 'wes') return { results: out, error: null };
  if (!missing.length || settings.mt.mode === 'none') return { results: out, error: null };
  let error = null;

  const pack = await loadPack(code);
  const glossary = pack.entries.filter(e => e.t && !e.id.startsWith('gist_'))
    .map(e => ({ src: [e.fr, e.en].filter(Boolean).join(' / '), t: e.t, note: e.note || '' }));
  const add = {};
  try {
    if (settings.mt.mode === 'cameroon' && code !== 'lns') {
      const res = await mtCameroon(settings, code, missing.map(i => items[i].masked));
      missing.forEach((i, k) => { out[i] = res[k]; if (res[k]) add[items[i].masked] = res[k]; });
    } else if (settings.mt.mode === 'nllb') {
      const res = await mtNllb(settings, code, missing.map(i => items[i].masked));
      missing.forEach((i, k) => { out[i] = res[k]; if (res[k]) add[items[i].masked] = res[k]; });
    } else {
      // 3 requests at a time: small local models are faster on short single strings.
      for (let k = 0; k < missing.length; k += 3) {
        const chunk = missing.slice(k, k + 3);
        const res = await Promise.all(chunk.map(i =>
          mtOpenAICompatible(settings, pack.name, glossary, items[i].masked, code,
            code === 'lns' ? lexiconHints(pack.lexicon, items[i].masked) : []).catch(e => { error = e.message; return null; })));
        chunk.forEach((i, n) => { out[i] = res[n]; if (res[n]) add[items[i].masked] = res[n]; });
        if (error && !res.some(Boolean)) break; // server down: do not hammer it
      }
    }
  } catch (e) {
    error = e.message;
  }
  for (const i of missing) {
    if (out[i] && looksBroken(items[i].masked, out[i].text)) { delete add[items[i].masked]; out[i] = null; }
  }
  if (error) console.warn('[Langwa] local MT unavailable:', error);
  if (Object.keys(add).length) await cachePut(cacheCode, add);
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
      case 'openOptions': api.runtime.openOptionsPage(); return true;
      // the voice download, with its steps, on the Langwa website (the settings page is the glossary)
      case 'openVoiceSetup': await api.tabs.create({ url: 'https://langwa-five.vercel.app/#voice-setup' }); return true;
      case 'chat': return chatAnswer(msg.lang, msg.question, msg.context || []).catch(() => null);
      case 'asr': return transcribe(msg.audio, msg.hint);
      case 'clearCache': await api.storage.local.remove([
        cacheKey(msg.lang),
        ...(msg.lang === 'wes' ? [cacheKey('wes-turaco')] : []),
        ...(msg.lang === 'lns' ? [cacheKey('lns-rag')] : []),
      ]); return true;
      default: return null;
    }
  })().then(sendResponse, err => sendResponse({ error: String(err) }));
  return true; // async response (Chrome + Firefox)
});

api.runtime.onInstalled.addListener(async () => {
  const { settings } = await api.storage.local.get('settings');
  if (!settings) await api.storage.local.set({ settings: DEFAULT_SETTINGS });
});
