/*
 * Langwa: reading translations aloud with natural voices.
 *
 * National-language text is ONLY played from human recordings made by the native-speaker
 * validator (or, for Fulfulde, from the local MMS neural voice if enabled). It is never read by
 * a French/English synthetic voice, which would mispronounce it.
 * Protected values (amounts, names, numbers) are read exactly, with the most natural French
 * voice available (Edge "Natural"/"Online" voices, Google voices...), the way amounts are
 * commonly spoken in Cameroon.
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect || (typeof require !== 'undefined' ? require('./protect.js') : null);

  const CURRENCIES = [
    [/^(?:F\s?CFA|FCFA|XAF|XOF|CFA)$/i, 'francs CFA'],
    [/^(?:EUR|€)$/i, 'euros'],
    [/^(?:USD|\$)$/i, 'dollars'],
    [/^(?:GBP|£)$/i, 'livres sterling'],
  ];

  /** "25,000" / "25 000" / "1.500,50" / "1,5" -> "25000" / "25000" / "1500,50" / "1,5" */
  function spokenNumber(n) {
    const s = String(n).replace(/[\s  ]/g, '');
    const m = s.match(/^([\d.,]*?)[.,](\d{1,2})$/);
    const int = (m ? m[1] : s).replace(/[.,]/g, '');
    return m ? `${int},${m[2]}` : int;
  }

  const spell = s => String(s).replace(/[\s-]+/g, ' ').trim().split(' ')
    .map(g => g.split('').join(' ')).join(', ');

  /** Exact spoken form of one protected value. */
  function speakValue(value, type) {
    const v = P.normSpaces(value).trim();
    const signM = v.match(/^([+\-−–])\s?/);
    const sign = signM ? (signM[1] === '+' ? 'plus ' : 'moins ') : '';
    const body = signM ? v.slice(signM[0].length) : v;
    switch (type) {
      case 'money': {
        const num = (body.match(/\d[\d\s.,]*\d|\d/) || [''])[0];
        const cur = body.replace(num, '').trim();
        const word = (CURRENCIES.find(([re]) => re.test(cur)) || [null, cur])[1];
        return `${sign}${spokenNumber(num)} ${word}`.trim();
      }
      case 'number': return `${sign}${spokenNumber(body)}`;
      case 'percent': return `${sign}${spokenNumber(body.replace('%', ''))} pour cent`;
      case 'phone': return (v.startsWith('+') ? 'plus ' : '') + v.replace(/^\+/, '').split(/[\s.-]+/).join(', ');
      case 'account': case 'iban': case 'reference': case 'masked-account': return spell(v);
      default: return v;
    }
  }

  /** Any text: each protected value replaced by its spoken form. */
  function speakable(text) {
    const t = P.normSpaces(text);
    const ents = P.extract(t);
    let out = '';
    let pos = 0;
    for (const e of ents) { out += t.slice(pos, e.start) + speakValue(e.value, e.type); pos = e.end; }
    return out + t.slice(pos);
  }

  /**
   * Coaches a French voice to read text written in the General Alphabet of Cameroon Languages
   * (Fulfulde, Ewondo, Duala...). Used only when no human recording exists, and labelled
   * "synthetic voice" in the interface.
   *   ɓ ɗ ƴ -> b d y,  ŋ -> ng,  c -> tch,  j -> dj,  ny -> gn,  u -> ou,  e -> é,
   *   long vowels shortened, g kept hard, s kept unvoiced, tone marks removed.
   */
  const LOANWORDS = new Set(['code', 'internet', 'safinum', 'pay', 'hackathon', 'mobile', 'money', 'orange', 'momo', 'sms', 'francs', 'fcfa', 'cfa']);
  function adaptReading(text) {
    let t = String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
    t = t.replace(/ɓ/g, 'b').replace(/Ɓ/g, 'B').replace(/ɗ/g, 'd').replace(/Ɗ/g, 'D')
      .replace(/ƴ/g, 'y').replace(/Ƴ/g, 'Y').replace(/ŋ/g, 'ng').replace(/Ŋ/g, 'Ng')
      .replace(/ɛ/g, 'è').replace(/Ɛ/g, 'È').replace(/ɔ/g, 'o').replace(/Ɔ/g, 'O').replace(/ə/g, 'e').replace(/Ə/g, 'E')
      .replace(/['’]/g, '');
    return t.split(/(\s+|[,.;:!?()]+)/).map(w => {
      if (!/\p{L}/u.test(w) || /^[A-Z0-9]{2,}$/.test(w) || LOANWORDS.has(w.toLowerCase())) return w; // acronyms (PIN), French loanwords
      return w
        .replace(/ny/gi, m => (m[0] === 'N' ? 'Gn' : 'gn'))
        .replace(/c/g, 'tch').replace(/C/g, 'Tch')
        .replace(/j/g, 'dj').replace(/J/g, 'Dj')
        .replace(/aa/g, 'a').replace(/ee/g, 'é').replace(/ii/g, 'i').replace(/oo/g, 'o').replace(/uu/g, 'ou')
        .replace(/(?<![oO])u/g, 'ou').replace(/U/g, 'Ou')
        .replace(/e(?![éèê])/g, 'é')
        .replace(/g([eéèiy])/g, 'gu$1')
        .replace(/([aeéèiouy])s([aeéèiouy])/g, '$1ss$2');
    }).join('');
  }

  // ---------------- playback ----------------
  function bestFrenchVoice() {
    if (!root.speechSynthesis) return null;
    const score = v => (/natural|neural|online|premium|enhanced|google/i.test(v.name) ? 10 : 0)
      + (/^fr[-_](CM|FR)/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1);
    return root.speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0] || null;
  }
  if (root.speechSynthesis) root.speechSynthesis.getVoices(); // warm up the voice list

  function createPlayer({ tts } = {}) {
    let session = null;

    function stop() {
      if (session) {
        session.stopped = true;
        if (session.audio) session.audio.pause();
        if (session.onStop) session.onStop();
      }
      if (root.speechSynthesis) root.speechSynthesis.cancel();
      session = null;
    }

    const playUrl = (url, s) => new Promise(res => {
      const a = new Audio(url);
      s.audio = a;
      a.onended = a.onerror = () => res();
      a.play().catch(() => res());
    });

    const sayFr = (text, s) => new Promise(res => {
      if (!root.speechSynthesis || s.stopped) return res();
      const u = new SpeechSynthesisUtterance(text);
      const v = bestFrenchVoice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'fr-FR';
      u.rate = 0.92;
      u.onend = u.onerror = () => res();
      root.speechSynthesis.speak(u);
    });

    /**
     * Turns a speech plan into playable steps. Missing recordings are filled, in this order,
     * by the local neural voice (opts.tts) or the device voice coached to the language's
     * spelling (opts.approx). Without either, a sentence with a missing recording is not
     * played at all (never half a sentence). The result carries .voice:
     * 'human' (only recordings), 'neural' or 'synthetic'.
     */
    function prepare(steps, opts) {
      if (!steps || !steps.length) return null;
      const o = typeof opts === 'object' && opts ? opts : { tts: !!opts, approx: false };
      let voice = 'human';
      const out = steps.map(s => {
        if (s.missing && o.tts) { voice = 'neural'; return { tts: s.text }; }
        if (s.missing && o.approx) { if (voice === 'human') voice = 'synthetic'; return { nat: s.text }; }
        if (s.tts && !o.tts) return o.approx ? (voice = 'synthetic', { nat: s.tts }) : s;
        return s;
      });
      if (out.some(s => s.missing || (s.tts && !o.tts))) return null;
      out.voice = voice;
      return out;
    }

    async function play(steps, onStop) {
      stop();
      const s = { stopped: false, onStop };
      session = s;
      for (const step of steps) {
        if (s.stopped) break;
        if (step.audio) await playUrl(step.audio, s);
        else if (step.value) await sayFr(step.type ? speakValue(step.value, step.type) : speakable(step.value), s);
        else if (step.nat) await sayFr(adaptReading(step.nat), s);
        else if (step.tts && tts) {
          const url = await tts(step.tts);
          if (url && !s.stopped) await playUrl(url, s);
        }
      }
      if (session === s) { session = null; if (onStop) onStop(); }
    }

    return { play, stop, prepare, isPlaying: () => !!session };
  }

  const api = { speakValue, speakable, spokenNumber, createPlayer, bestFrenchVoice, adaptReading };
  root.LangwaSpeech = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
