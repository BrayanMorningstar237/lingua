/*
 * Langwa: standalone runtime.
 * Lets the same content script run WITHOUT the extension APIs: as a userscript on phones
 * (Tampermonkey / Violentmonkey on Android, the "Userscripts" app in Safari on iPhone) or any
 * browser that has no extension support. Language data is embedded by tools/build.mjs in
 * globalThis.LANGWA_DATA. Settings are kept in the userscript manager's own storage when
 * available (GM_getValue), otherwise only for the current page.
 */
(function (root) {
  'use strict';
  const D = root.LANGWA_DATA;
  if (!D) return;

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
  const mem = {};
  const store = {
    get: k => (hasGM ? GM_getValue(k, undefined) : mem[k]),
    set: (k, v) => (hasGM ? GM_setValue(k, v) : (mem[k] = v)),
    del: k => (hasGM && typeof GM_deleteValue === 'function' ? GM_deleteValue(k) : delete mem[k]),
  };
  const listeners = [];

  // Translated phrases per language (the chooser marks empty languages "Soon").
  const count = code => Object.values((D.packs[code] || {}).entries || {}).filter(e => e && e.t).length;
  const langs = () => Object.fromEntries(Object.entries(D.langs).map(([c, l]) => [c, { ...l, count: count(c) }]));

  function settings() {
    const s = store.get('settings') || {};
    const here = location.protocol === 'file:' ? 'file://' : location.origin;
    return {
      lang: null, hover: 'ctrl', // language chosen by the user on first use toasts: true, autoSpeak: true,
      mt: { mode: 'none' }, tts: { mode: 'none' },
      ...s,
      sites: [here], // the userscript manager already decides on which sites it runs
    };
  }

  function pack(code) {
    const file = (code && (D.packs[code] || {}).entries) || {};
    const over = (code && store.get(`overrides:${code}`)) || {};
    const l = D.langs[code] || {};
    return {
      code, name: l.name || code || '', mms: null, voices: l.voices || null, reading: l.reading || null,
      lexicon: code && D.lexicon ? { fr: (D.lexicon.fr || {})[code] || {}, en: (D.lexicon.en || {})[code] || {} } : null,
      entries: D.source.entries.map(e => {
        const tr = { ...file[e.id], ...over[e.id] };
        return { ...e, t: tr.t || '', x: tr.x || '', verified: !!tr.verified, audio: tr.audio || '', audioParts: tr.audioParts || [] };
      }),
    };
  }

  const handlers = {
    getSettings: () => settings(),
    getLangs: () => langs(),
    getPack: m => pack(m.lang !== undefined ? m.lang : settings().lang),
    translateBatch: m => ({ results: (m.items || []).map(() => null), error: null }),
    tts: () => null,
    clearCache: () => true,
  };

  root.LangwaRuntime = {
    runtime: {
      sendMessage: async msg => (handlers[msg && msg.type] || (() => null))(msg || {}),
      onMessage: { addListener() {} },
    },
    storage: {
      local: {
        async get(key) {
          const keys = key == null ? [] : Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map(k => [k, store.get(k)]));
        },
        async set(obj) {
          const changes = {};
          for (const [k, v] of Object.entries(obj)) { changes[k] = { oldValue: store.get(k), newValue: v }; store.set(k, v); }
          setTimeout(() => listeners.forEach(fn => fn(changes, 'local')), 0);
        },
        async remove(key) { for (const k of [].concat(key)) store.del(k); },
      },
      onChanged: { addListener: fn => listeners.push(fn) },
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
