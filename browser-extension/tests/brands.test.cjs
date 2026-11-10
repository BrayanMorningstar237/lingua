const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/protect.js');
const E = require('../src/engine.js');
const source = require('../lang/source.json');

const engine = E.createEngine({ entries: source.entries.map(e => ({ ...e, t: e.id === 'safinum_account' ? 'Konte Safinum' : '', verified: false })) });

test('platform and bank names are protected, never translated', () => {
  assert.equal(P.mask('Safinum Pay').masked, '⟦A⟧');
  assert.equal(P.mask('Payez avec Orange Money ou MTN MoMo').tokens.map(t => t.value).join('|'), 'Orange Money|MTN MoMo');
  const p = engine.plan('Safinum Pay');
  assert.equal(p.skip, true);
  assert.equal(p.brand, true);
});

test('a sentence containing a brand still matches the glossary', () => {
  const r = engine.translateLocal('Safinum account');
  assert.equal(r.text, 'Konte Safinum');
  assert.equal(r.integrity.ok, true);
});

test('names read from the page itself are protected too', () => {
  const p = engine.plan('Kalaba Wallet', [], ['Kalaba Wallet']);
  assert.equal(p.skip, true);
  assert.equal(p.brand, true);
});

test('a word that merely contains a brand is not cut', () => {
  assert.equal(P.mask('Visage').tokens.length, 0);
});
