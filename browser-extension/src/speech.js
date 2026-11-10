/*
 * Mboa Lingua: reading translations aloud with natural voices.
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
  const P = root.MboaProtect || (typeof require !== 'undefined' ? require('./protect.js') : null);

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

    /** Replace missing recordings by the synthetic national voice when one is available. */
    function prepare(steps, ttsOn) {
      if (!steps || !steps.length) return null;
      const out = steps.map(s => (s.missing && ttsOn ? { tts: s.text } : s));
      if (out.some(s => s.missing || (s.tts && !ttsOn))) return null;
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
        else if (step.tts && tts) {
          const url = await tts(step.tts);
          if (url && !s.stopped) await playUrl(url, s);
        }
      }
      if (session === s) { session = null; if (onStop) onStop(); }
    }

    return { play, stop, prepare, isPlaying: () => !!session };
  }

  const api = { speakValue, speakable, spokenNumber, createPlayer, bestFrenchVoice };
  root.MboaSpeech = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
