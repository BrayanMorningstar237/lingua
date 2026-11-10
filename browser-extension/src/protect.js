/*
 * Langwa: protection of financial information.
 *
 * Every amount, fee, percentage, phone number, account number, reference,
 * date, beneficiary name and user-typed value is:
 *   1. detected and replaced by an opaque token (⟦A⟧, ⟦B⟧ ...) BEFORE any
 *      translation step, so no translator (human glossary or AI) can alter it
 *      and no sensitive value ever leaves the browser;
 *   2. restored verbatim after translation;
 *   3. re-checked by verify(): if a single protected value is missing or an
 *      unexpected number appears, the translation is BLOCKED and the original
 *      text is shown instead.
 *
 * Works as a classic script (browser) and as a CommonJS module (Node tests).
 */
(function (root) {
  'use strict';

  // Numbers: grouped thousands ("25 000", "1.500,50", "10,000.00") or plain.
  const NUM = String.raw`\d{1,3}(?:[   .,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?`;
  const CUR = String.raw`F\s?CFA|FCFA|XAF|XOF|CFA|EUR|USD|GBP|€|\$|£`;

  const SIGN = String.raw`(?:[+\-−–]\s?)?`; // keep "-12,500 FCFA" vs "+180,000 FCFA": a lost sign flips debit/credit
  const MONTHS = String.raw`janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|January|February|March|April|May|June|July|August|September|October|November|December|janv\.?|févr\.?|avr\.?|juil\.?|sept\.?|oct\.?|nov\.?|déc\.?|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?`;

  const RULES = [
    { type: 'email', priority: 9, re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
    { type: 'url', priority: 9, re: /\bhttps?:\/\/[^\s<>"']+/g },
    { type: 'iban', priority: 8, re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,4})?\b/g },
    // Local account numbers such as "CM 001 2345 6789 01".
    { type: 'account', priority: 8, re: /\b[A-Z]{2}(?:[ -]?\d{2,6}){3,7}\b/g },
    { type: 'money', priority: 7, re: new RegExp(`(?<![\\p{L}\\d])${SIGN}(?:(?:${CUR})\\s?(?:${NUM})|(?:${NUM})\\s?(?:${CUR}))(?![A-Za-z])`, 'gu') },
    // Full dates with month names ("November 5, 2026", "5 novembre 2026") are kept verbatim.
    { type: 'date', priority: 6, re: new RegExp(`(?:\\b\\d{1,2}(?:er)?\\s+(?:${MONTHS})(?:\\s+\\d{4})?|(?<![\\p{L}])(?:${MONTHS})\\s+\\d{1,2}(?:,?\\s+\\d{4})?)(?![\\p{L}])`, 'giu') },
    // Cameroon numbers: "+237 6 99 12 34 56", "677 12 34 56", "699123456", "+237 699 123 456".
    { type: 'phone', priority: 6, re: /(?:\+237[\s.-]?)?(?<!\d)[26](?:[\s.-]?\d){8}(?!\d)/g },
    // Other international numbers.
    { type: 'phone', priority: 5, re: /\+\d{1,3}(?:[\s.-]?\d){6,12}(?!\d)/g },
    { type: 'percent', priority: 6, re: /\d+(?:[.,]\d+)?\s?%/g },
    { type: 'masked-account', priority: 6, re: /[*•xX]{2,}[\s-]?\d{2,}|\d{2,}[\s-]?[*•]{2,}/g },
    { type: 'date', priority: 5, re: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g },
    { type: 'time', priority: 5, re: /\b\d{1,2}(?::|h)\d{2}\b/g },
    { type: 'reference', priority: 6.5, re: /\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9]+(?:-[A-Z0-9]+)+\b|\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,}\b/g },
    // Proper names right after "à / to / from / pour / vers / M. / Mme ..." (beneficiaries).
    { type: 'name', priority: 3, re: /(?<=(?:^|[\s(])(?:à|to|from|pour|for|vers|M\.|Mme|Mlle|Mr\.?|Mrs\.?|Dr\.?|Hello,?|Hi,?|Bonjour,?|Bonsoir,?)\s+)[A-ZÀ-Ý][\p{L}'’-]+(?:\s+[A-ZÀ-Ý][\p{L}'’-]+){0,3}/gu },
    { type: 'number', priority: 1, re: new RegExp(`(?<![\\p{L}\\d])${SIGN}(?:${NUM})(?![\\p{L}\\d])`, 'gu') },
  ];

  function normSpaces(s) {
    return String(s).normalize('NFC').replace(/[   ]/g, ' ');
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Find every protected value in `text`. Non-overlapping, sorted by position. */
  /**
   * Brand and platform names are never translated: "Safinum Pay" stays "Safinum Pay".
   * Built-in Cameroonian financial brands + names Langwa reads from the page itself (opts.brands).
   */
  const BRANDS = [
    'Safinum Pay', 'Safinum', 'Afriland First Bank', 'Afriland', 'Orange Money', 'MTN Mobile Money', 'MTN MoMo', 'MoMo',
    'Express Union', 'Ecobank', 'UBA', 'BICEC', 'SGC', 'Société Générale', 'CCA Bank', 'Commercial Bank', 'Wafacash',
    'Visa', 'Mastercard', 'WhatsApp', 'Google', 'GIMAC', 'CEMAC', 'BEAC', 'CNEF', 'Huawei',
  ];

  function extract(text, opts = {}) {
    const cands = [];
    for (const b of [...(opts.brands || []), ...BRANDS]) {
      const l = normSpaces(b).trim();
      if (l.length < 2) continue;
      const re = new RegExp(`(?<![\\p{L}\\d])${escapeRe(l)}(?![\\p{L}\\d])`, 'gu');
      let m;
      while ((m = re.exec(text))) cands.push({ start: m.index, end: m.index + l.length, type: 'brand', priority: 9.5 + l.length / 1000 });
    }
    for (const lit of opts.literals || []) {
      const l = normSpaces(lit).trim();
      if (l.length < 2) continue;
      const re = new RegExp(escapeRe(l), 'g');
      let m;
      while ((m = re.exec(text))) cands.push({ start: m.index, end: m.index + l.length, type: 'user-value', priority: 10 });
    }
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text))) {
        if (!m[0]) { rule.re.lastIndex++; continue; }
        cands.push({ start: m.index, end: m.index + m[0].length, type: rule.type, priority: rule.priority });
      }
    }
    // Highest priority first, then longest; keep only non-overlapping.
    cands.sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const kept = [];
    for (const c of cands) {
      if (kept.some(k => c.start < k.end && k.start < c.end)) continue;
      kept.push(c);
    }
    kept.sort((a, b) => a.start - b.start);
    return kept.map(c => ({ ...c, value: text.slice(c.start, c.end) }));
  }

  function keyFor(i) {
    let s = '';
    let n = i + 1;
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return `⟦${s}⟧`;
  }

  /** Replace protected values by tokens. Returns { masked, tokens:[{key,value,type}] }. */
  function mask(text, opts = {}) {
    const t = normSpaces(text);
    const ents = extract(t, opts);
    let out = '';
    let pos = 0;
    const tokens = ents.map((e, i) => {
      const key = keyFor(i);
      out += t.slice(pos, e.start) + key;
      pos = e.end;
      return { key, value: e.value, type: e.type };
    });
    out += t.slice(pos);
    return { masked: out, tokens };
  }

  /** Put the original values back. Every token must appear exactly once. */
  function unmask(translated, tokens) {
    const problems = [];
    const found = String(translated).match(/⟦[^⟧]{0,8}⟧/g) || [];
    for (const t of tokens) {
      const n = found.filter(f => f === t.key).length;
      if (n !== 1) problems.push(`value "${t.value}" appears ${n} time(s) instead of once`);
    }
    const unknown = found.filter(f => !tokens.some(t => t.key === f));
    if (unknown.length) problems.push(`unknown token(s) ${unknown.join(' ')}`);
    const text = String(translated).replace(/⟦[A-Z]+⟧/g, m => {
      const tok = tokens.find(t => t.key === m);
      return tok ? tok.value : m;
    });
    return { text, ok: problems.length === 0, problems };
  }

  function countOcc(hay, needle) {
    if (!needle) return 0;
    let n = 0;
    let i = hay.indexOf(needle);
    while (i !== -1) { n++; i = hay.indexOf(needle, i + needle.length); }
    return n;
  }

  /**
   * Integrity check between the original text and its translation.
   * - every protected value of the original must be present, character for character,
   *   at least as many times as in the original;
   * - the translation must not contain any digit that is not part of a protected value.
   */
  function verify(original, translated, opts = {}) {
    const o = normSpaces(original);
    const c = normSpaces(translated);
    const ents = extract(o, opts);
    const counts = new Map();
    for (const e of ents) counts.set(e.value, (counts.get(e.value) || 0) + 1);
    const problems = [];
    for (const [v, n] of counts) {
      if (countOcc(c, v) < n) problems.push({ type: 'missing', value: v });
    }
    let rest = c;
    for (const v of [...counts.keys()].sort((a, b) => b.length - a.length)) rest = rest.split(v).join(' ');
    const stray = rest.match(/\d+/g);
    if (stray) problems.push({ type: 'unexpected-number', value: stray.join(', ') });
    return { ok: problems.length === 0, problems, entities: ents };
  }

  const api = { extract, mask, unmask, verify, normSpaces };
  root.LangwaProtect = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
