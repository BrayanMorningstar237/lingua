// Run with:  node --test tests/
// The "translations" below are FAKE markers ("<<...>>") used only to test the mechanics.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/protect.js');
const E = require('../src/engine.js');
const source = require('../lang/source.json');

const fake = (id, t) => ({ id, t, verified: true });
const overrides = {
  available_balance: '<<SOLDE-DISPO>>',
  amount: '<<MONTANT>>',
  beneficiary: '<<BENEF>>',
  send_amount_to: '<<ENVOYER {amount} VERS {name}>>',
  pin_incorrect_attempts: '<<PIN FAUX, RESTE {count}>>',
  account_number: '<<NUM-COMPTE>>',
  current_account: '<<COMPTE-COURANT>>',
  hello_name: '<<SALUT {name}>>',
  gist_error: '<<MESSAGE-ERREUR>>',
  gist_warning: '<<AVERTISSEMENT>>',
  gist_info: '<<INFO>>',
  gist_keywords: '<<MOTS>>',
  transfer_fees: '<<FRAIS-VIREMENT>>',
  balance: '<<SOLDE>>',
};
const pack = {
  entries: source.entries.map(e => ({ ...e, ...(overrides[e.id] ? fake(e.id, overrides[e.id]) : { t: '' }) })),
};
const engine = E.createEngine(pack);

test('masks signed amounts, account numbers, phones, references, dates', () => {
  const cases = {
    '-12,500 FCFA': 'money', '+180,000 FCFA': 'money', '250,000 FCFA': 'money', '25 000 FCFA': 'money',
    'CM 001 2345 6789 01': 'account', '+237 6 99 12 34 56': 'phone', '677 12 34 56': 'phone',
    'SAF-2026-WX13I2': 'reference', 'TRX-2026-00451': 'reference', 'November 5, 2026': 'date', '5 novembre 2026': 'date',
  };
  for (const [v, type] of Object.entries(cases)) {
    const m = P.mask(`Valeur ${v} ici`);
    assert.equal(m.tokens.length, 1, v);
    assert.equal(m.tokens[0].value, v);
    assert.equal(m.tokens[0].type, type, v);
  }
});

test('unmask rejects dropped, duplicated or invented tokens', () => {
  const m = P.mask('Vous allez envoyer 25 000 FCFA à Jean Mbarga.');
  assert.equal(P.unmask('X ⟦A⟧ Y ⟦B⟧', m.tokens).ok, true);
  assert.equal(P.unmask('X ⟦A⟧ Y', m.tokens).ok, false);
  assert.equal(P.unmask('X ⟦A⟧ ⟦A⟧ ⟦B⟧', m.tokens).ok, false);
  assert.equal(P.unmask('X ⟦A⟧ ⟦B⟧ ⟦C⟧', m.tokens).ok, false);
});

test('verify catches a changed amount, a lost minus sign and an invented number', () => {
  assert.equal(P.verify('Total : 25,000 FCFA', 'T : 25,000 FCFA').ok, true);
  assert.equal(P.verify('Total : 25,000 FCFA', 'T : 25,500 FCFA').ok, false);
  assert.equal(P.verify('-12,500 FCFA', '12,500 FCFA').ok, false);
  assert.equal(P.verify('Solde', 'Solde 3').ok, false);
});

test('glossary template keeps amount and beneficiary verbatim', () => {
  const r = engine.translateLocal('Vous allez envoyer 25 000 FCFA à Jean Mbarga.');
  assert.equal(r.status, 'ok');
  assert.equal(r.text, '<<ENVOYER 25 000 FCFA VERS Jean Mbarga>>');
  const r2 = engine.translateLocal('You are about to send 25,000 FCFA to Jean-Paul Mbarga.');
  assert.equal(r2.text, '<<ENVOYER 25,000 FCFA VERS Jean-Paul Mbarga>>');
});

test('label : value -> label translated, value untouched', () => {
  const r = engine.translateLocal('Account number: CM 001 2345 6789 01');
  assert.equal(r.status, 'ok');
  assert.equal(r.text, '<<NUM-COMPTE>>: CM 001 2345 6789 01');
  const r2 = engine.translateLocal('Bénéficiaire : Jean-Paul Mbarga');
  assert.equal(r2.text, '<<BENEF>> : Jean-Paul Mbarga');
});

test('pure values and proper names are not translated', () => {
  assert.equal(engine.plan('250,000 FCFA').skip, true);
  assert.equal(engine.plan('+237 6 99 12 34 56').skip, true);
  assert.equal(engine.plan('Jean-Paul Mbarga').skip, true);
  assert.equal(engine.plan('Amina Ngo Bell').skip, true);
  assert.equal(engine.plan('Current Account').skip, undefined);
});

test('template with a count', () => {
  const r = engine.translateLocal('Code PIN incorrect. Il vous reste 2 tentatives.');
  assert.equal(r.text, '<<PIN FAUX, RESTE 2>>');
  assert.equal(r.kind, 'error');
});

test('greeting with a name', () => {
  assert.equal(engine.translateLocal('Hello, Amina').text, '<<SALUT Amina>>');
});

test('unknown new message -> safe gist with kind, key words and exact amounts', () => {
  const msg = 'Erreur : le virement de 30 000 FCFA a échoué car votre solde est insuffisant.';
  const r = engine.translateLocal(msg);
  assert.equal(r.status, 'gist');
  assert.equal(r.kind, 'error');
  assert.ok(r.text.startsWith('<<MESSAGE-ERREUR>>'));
  assert.ok(r.text.includes('30 000 FCFA'));
  assert.ok(r.text.includes('<<SOLDE>>'));
  assert.equal(r.integrity.ok, true);
});

test('security warning from the test page is classified as warning', () => {
  assert.equal(E.classify('This beneficiary has never been used on this account. Please verify the number before proceeding.'), 'warning');
  assert.equal(E.classify('Always check the beneficiary\'s name and number before confirming a transfer.'), 'warning');
  assert.equal(E.classify('Your transfer has been sent successfully.'), 'success');
});

test('machine translation output that alters an amount is blocked', () => {
  const p = engine.plan('Le transfert de 25 000 FCFA est en attente de validation.');
  const part = p.parts[0];
  const llm = part.masked.replace('⟦A⟧', '26 000 FCFA');           // model "translated" the number itself
  const un = P.unmask(llm, part.tokens);
  assert.equal(un.ok, false);
  const r = engine.finalize(p.text, p, [{ blocked: true, problems: un.problems }]);
  assert.notEqual(r.status, 'ok');
  assert.ok(r.text.includes('25 000 FCFA'));
  assert.ok(!r.text.includes('26 000'));
});
