const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const source = require('../lang/source.json');

// Small test dictionary; real data comes from Wiktionary (CC BY-SA) via tools/harvest-*.
const lexicon = { fr: { payer: ['sáwa'], facture: ['kálati'] }, en: { money: ['mɔ̀nì'] } };
const engine = E.createEngine({ entries: source.entries.map(e => ({ ...e, t: '' })), lexicon });

test('untranslated sentence gets dictionary words as hints', () => {
  const r = engine.translateLocal('Vous devez payer la facture de 12 000 FCFA.');
  assert.equal(r.status, 'untranslated');
  assert.deepEqual(r.words.map(w => w.term), ['sáwa', 'kálati']);
  assert.ok(!r.words.some(w => /\d/.test(w.term)), 'amounts are never looked up');
});

test('English pages are matched too', () => {
  const r = engine.translateLocal('Send money to your family.');
  assert.deepEqual(r.words.map(w => w.term), ['mɔ̀nì']);
});

test('no dictionary, no hints', () => {
  const plain = E.createEngine({ entries: source.entries.map(e => ({ ...e, t: '' })) });
  assert.deepEqual(plain.translateLocal('Vous devez payer la facture.').words, []);
});
