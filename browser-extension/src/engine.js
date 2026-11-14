/*
 * Langwa: translation engine (no network, deterministic).
 *
 * Order of resolution for a piece of interface text:
 *   1. Glossary / templates validated by native speakers
 *      ("Vous allez envoyer {amount} à {name}." matches any amount and name).
 *   2. "Label : value" split: the label is translated, the value is kept verbatim
 *      (beneficiary names, account numbers, amounts are never touched).
 *   3. Local open-source machine translation (done by the caller, optional).
 *   4. Safe summary ("gist"): a pre-validated sentence saying what KIND of message it is
 *      (error / security warning / success / information) + the known key words + the
 *      protected amounts. Always correct in meaning, even for brand-new content.
 * Every assembled result is re-checked with LangwaProtect.verify().
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect || (typeof require !== 'undefined' ? require('./protect.js') : null);

  const TOKEN_RE = /⟦[A-Z]+⟧/g;

  function norm(s) {
    return P.normSpaces(s)
      .replace(/[’‘`´]/g, "'")
      .replace(/[“”«»]/g, '"')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Lookup key: tokens -> {}, lower case, tidy punctuation, no trailing punctuation. */
  function keyOf(masked) {
    return norm(masked)
      .replace(TOKEN_RE, '{}')
      .toLowerCase()
      .replace(/\s+([:;,.!?])/g, '$1')
      .replace(/[\s.!?:;]+$/, '');
  }

  const KIND_RES = {
    error: /(?<![\p{L}])(erreur|échec|échoué|incorrecte?|invalide|insuffisante?|refusée?|impossible|bloquée?|expirée?|error|failed|failure|incorrect|invalid|insufficient|declined|denied|rejected|locked|blocked|expired)(?![\p{L}])/iu,
    warning: /(?<![\p{L}])(attention|avertissement|jamais|méfiez|fraude|arnaque|sécurité|irréversible|vérifiez toujours|ne peut pas être annulé|warning|caution|never|beware|fraud|scam|security|irreversible|always check|cannot be (?:undone|reversed|cancell?ed))(?![\p{L}])/iu,
    success: /(?<![\p{L}])(succès|réussie?|effectuée?|confirmée?|success|successful(?:ly)?|completed|confirmed)(?![\p{L}])/iu,
  };

  /**
   * Message kind. Short labels are headings, not messages: "Security" or "Success" alone is a
   * title or a status, so a warning/success needs 3+ words and an error 2+ ("Solde insuffisant").
   */
  // A message that calls itself a security alert, or tells the user never to share a code, is a
  // warning even when it also says something was blocked: "Alerte de sécurité : un transfert …
  // a été bloqué. Ne communiquez jamais votre code" must be read as a warning, not an error.
  const STRONG_WARNING = /(alerte\s+(?:de\s+)?sécurité|avertissement|attention\s*:|security\s+(?:alert|warning)|warning\s*:|ne\s+(?:communiquez|partagez|donnez|divulguez)\s+jamais|never\s+(?:share|give|tell|disclose)|fraude|arnaque|fraud|scam)/iu;

  function classify(text) {
    const words = (String(text).match(/\p{L}+/gu) || []).length;
    if (words >= 3 && STRONG_WARNING.test(text)) return 'warning';
    if (words >= 2 && KIND_RES.error.test(text)) return 'error';
    if (words >= 3 && KIND_RES.warning.test(text)) return 'warning';
    if (words >= 3 && KIND_RES.success.test(text)) return 'success';
    return null;
  }

  /** "Vous allez envoyer {amount} à {name}." -> segs ["Vous allez envoyer ", " à ", "."], names ["amount","name"] */
  function splitTemplate(t) {
    const segs = [];
    const names = [];
    let last = 0;
    String(t || '').replace(/\{(\w+)\}/g, (m, n, i) => { segs.push(t.slice(last, i)); names.push(n); last = i + m.length; return m; });
    segs.push(String(t || '').slice(last));
    return { segs, names };
  }

  const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function createEngine(pack) {
    const index = new Map(); // key -> { entry, names }
    const phrases = [];      // for gist key-word spotting: { key, entry }
    const byId = new Map();
    const knownWords = new Set(); // every word of every source string (translated or not)

    for (const e of pack.entries || []) {
      byId.set(e.id, e);
      for (const src of [e.fr, e.en, ...(e.variants || [])].filter(Boolean)) {
        for (const w of src.toLowerCase().split(/[^\p{L}']+/u)) if (w.length > 2) knownWords.add(w);
      }
      if (!e.t || !e.t.trim()) continue;
      for (const src of [e.fr, e.en, ...(e.variants || [])].filter(Boolean)) {
        const names = [];
        const tpl = src.replace(/\{(\w+)\}/g, (_, n) => { names.push(n); return '⟦X⟧'; });
        const key = keyOf(tpl);
        if (!index.has(key)) index.set(key, { entry: e, names });
        if (!names.length && key.length >= 3 && !e.id.startsWith('gist_') && e.group !== 'ui') phrases.push({ key, entry: e });
      }
    }
    phrases.sort((a, b) => b.key.length - a.key.length);

    /**
     * Speech plan for an entry: human recordings of the national-language text, with the
     * protected values (amounts, names...) in between.
     * Steps: {audio} recorded clip | {missing, text} not recorded | {value, type} protected value.
     */
    function speechFor(entry, names, tokens) {
      const { segs, names: tNames } = splitTemplate(entry.t);
      if (!tNames.length) return [entry.audio ? { audio: entry.audio } : { missing: true, text: entry.t }];
      const parts = entry.audioParts || [];
      const steps = [];
      segs.forEach((seg, i) => {
        if (/\p{L}/u.test(seg)) steps.push(parts[i] ? { audio: parts[i] } : { missing: true, text: seg.trim() });
        if (i < tNames.length) {
          const tok = tokens[names.indexOf(tNames[i])];
          if (tok) steps.push({ value: tok.value, type: tok.type });
        }
      });
      return steps;
    }

    function lookupMasked(masked, allTokens) {
      // Brand tokens are compared as their text ("Safinum account"), not as placeholders.
      const brands = allTokens.filter(t => t.type === 'brand');
      for (const b of brands) masked = masked.split(b.key).join(b.value);
      const tokens = allTokens.filter(t => t.type !== 'brand');
      const hit = index.get(keyOf(masked));
      if (!hit || hit.names.length !== tokens.length) return null;
      let t = hit.entry.t;
      hit.names.forEach((n, i) => { t = t.split(`{${n}}`).join(tokens[i].value); });
      if (/\{\w+\}/.test(t)) return null;
      return {
        text: t,
        verified: !!hit.entry.verified,
        audio: hit.names.length ? '' : (hit.entry.audio || ''),
        speech: speechFor(hit.entry, hit.names, tokens),
        explain: hit.entry.x || '', // optional plain-language explanation written by the speaker
        id: hit.entry.id,
        source: 'glossary',
      };
    }

    // "Jean-Paul Mbarga", "Amina Ngo Bell", "Safinum Pay": 1-4 capitalised words, none of
    // them a known glossary word -> a name or brand, shown as-is (never translated).
    function looksLikeProperName(s) {
      const words = s.split(/\s+/);
      if (words.length > 4 || !words.every(w => /^\p{Lu}[\p{L}'’.-]*$/u.test(w))) return false;
      return !words.some(w => knownWords.has(w.toLowerCase()));
    }

    function isValueLike(rest, literals) {
      const m = P.mask(rest, { literals });
      const words = m.masked.replace(TOKEN_RE, ' ').match(/\p{L}+/gu) || [];
      return words.length <= 4;
    }

    /** Split a text into parts: 'tr' parts to translate, 'lit' parts kept verbatim. */
    function plan(text, literals = [], brands = []) {
      const clean = norm(text);
      const whole = { kind: 'tr', text: clean, ...P.mask(clean, { literals, brands }) };
      // Pure values ("25,000 FCFA", "+237 6 99 12 34 56", a typed name): nothing to translate.
      if (!/\p{L}{2,}/u.test(whole.masked.replace(TOKEN_RE, ''))) {
        const brand = whole.tokens.length && whole.tokens.every(t => t.type === 'brand');
        return { skip: true, value: true, brand, text: clean };
      }
      if (lookupMasked(whole.masked, whole.tokens)) return { text: clean, parts: [whole] };
      if (looksLikeProperName(clean)) return { skip: true, value: true, text: clean };

      const lv = clean.match(/^([^\d:]{1,40}?)(\s*:\s*)(.+)$/s);
      if (lv && /\p{L}{2,}/u.test(lv[1]) && isValueLike(lv[3], literals)) {
        const label = lv[1].trim();
        const rest = lv[3];
        const restMask = P.mask(rest, { literals, brands });
        const restPart = lookupMasked(restMask.masked, restMask.tokens)
          ? { kind: 'tr', text: rest, ...restMask }
          : { kind: 'lit', text: rest };
        return {
          text: clean,
          parts: [{ kind: 'tr', text: label, ...P.mask(label, { literals, brands }) }, { kind: 'lit', text: lv[2] }, restPart],
        };
      }
      return { text: clean, parts: [whole] };
    }

    /** Known glossary terms found inside an unknown sentence (longest first, no overlap). */
    function keywords(masked) {
      const k = ' ' + keyOf(masked).replace(/[{}(),;:.!?"]/g, ' ').replace(/\s+/g, ' ') + ' ';
      const found = [];
      let rest = k;
      for (const p of phrases) {
        const needle = ' ' + p.key.replace(/[{}(),;:.!?"]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
        if (needle.trim().length < 3) continue;
        if (rest.includes(needle)) {
          found.push(p.entry);
          rest = rest.split(needle).join(' | ');
        }
      }
      return [...new Set(found)];
    }

    /** Pre-validated, meaning-safe summary of a message we cannot translate fully. */
    function gist(original, literals = []) {
      const clean = norm(original);
      // A generic "info" gist is not a translation and can easily mislead users
      // on arbitrary pages. Keep safe summaries for classified warnings/errors,
      // but leave ordinary unknown text explicitly untranslated.
      const kind = classify(clean);
      if (!kind) return null;
      const head = byId.get('gist_' + kind);
      if (!head || !head.t) return null;
      const m = P.mask(clean, { literals });
      const kws = keywords(m.masked).filter(e => e.t);
      const values = m.tokens.map(t => t.value);
      let text = head.t;
      if (kws.length) {
        const kwLabel = byId.get('gist_keywords');
        text += ` ${kwLabel && kwLabel.t ? kwLabel.t : '•'} ${kws.map(e => e.t).join(' · ')}`;
      }
      if (values.length) text += ` · ${values.join(' · ')}`;
      const speech = [
        head.audio ? { audio: head.audio } : { missing: true, text: head.t },
        ...kws.map(e => (e.audio ? { audio: e.audio } : { missing: true, text: e.t })),
        ...m.tokens.map(t => ({ value: t.value, type: t.type })),
      ];
      return {
        speech,
        status: 'gist',
        text,
        original: clean,
        verified: !!head.verified && kws.every(e => e.verified),
        sources: ['gist'],
        kind,
        audio: head.audio || '',
        integrity: P.verify(clean, text, { literals }),
      };
    }

    /**
     * Assemble translated parts.
     * outs[i] is { text, verified, source, audio?, confidence? } | { blocked, problems } | null (unknown).
     */
    function finalize(original, planned, outs, literals = []) {
      const clean = planned.text;
      const kind = classify(clean);
      const base = { original: clean, kind };
      const blocked = outs.find(o => o && o.blocked);
      if (blocked) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? { ...g, note: 'mt-blocked', problems: blocked.problems }
          : { ...base, status: 'blocked', text: clean, problems: blocked.problems };
      }
      if (outs.some(o => !o)) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? g : { ...base, status: 'untranslated', text: clean, words: lexiconHits(clean) };
      }
      const text = outs.map(o => o.text).join('');
      const integrity = P.verify(clean, text, { literals });
      if (!integrity.ok) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? { ...g, note: 'integrity-failed', problems: integrity.problems }
          : { ...base, status: 'blocked', text: clean, problems: integrity.problems };
      }
      const trOuts = outs.filter(o => o.source !== 'literal');
      const speech = outs.flatMap(o => {
        if (o.speech) return o.speech;
        if (o.source === 'literal') return /[\p{L}\d]/u.test(o.text) ? [{ value: o.text.trim() }] : [];
        return [{ tts: o.text }]; // machine translation: only a synthetic voice can read it
      });
      return {
        speech,
        ids: trOuts.map(o => o.id).filter(Boolean),
        id: trOuts.length === 1 ? trOuts[0].id : undefined,
        explain: trOuts.map(o => o.explain).filter(Boolean).join(' '),
        ...base,
        status: 'ok',
        text,
        verified: trOuts.every(o => o.verified),
        sources: [...new Set(trOuts.map(o => o.source))],
        confidence: trOuts.find(o => o.confidence) ? trOuts.find(o => o.confidence).confidence : undefined,
        audio: outs.length === 1 ? outs[0].audio || '' : (trOuts.length === 1 && trOuts[0].audio) || '',
        integrity,
      };
    }

    /** Synchronous translation with glossary only (used by tests and the options page). */
    function translateLocal(text, literals = []) {
      const p = plan(text, literals);
      if (p.skip) return null;
      const outs = p.parts.map(part => part.kind === 'lit'
        ? { text: part.text, verified: true, source: 'literal' }
        : lookupMasked(part.masked, part.tokens));
      return finalize(text, p, outs, literals);
    }

    /**
     * Dictionary words (open sources, not validated) found in a sentence that has no translation:
     * "Payer la facture" -> [{ src: 'payer', term: 'sáwa' }]. Shown as hints, never as a translation.
     */
    const lex = pack.lexicon || null;
    function lexiconHits(text) {
      if (!lex) return [];
      const out = [];
      const words = fold(P.mask(norm(text)).masked.replace(TOKEN_RE, ' ')).match(/[a-z]+/g) || [];
      for (const w of new Set(words)) {
        if (w.length < 3) continue;
        for (const form of [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/(e|er|ez|e?d|ing)$/, '')]) {
          const hit = (lex.fr && lex.fr[form]) || (lex.en && lex.en[form]);
          if (hit && hit.length) { if (!out.some(o => o.src === form)) out.push({ src: form, term: hit[0] }); break; }
        }
        if (out.length >= 6) break;
      }
      return out;
    }

    return { plan, lookupMasked, finalize, gist, keywords, translateLocal, lexiconHits, size: index.size };
  }

  const api = { createEngine, keyOf, norm, classify, splitTemplate };
  root.LangwaEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
