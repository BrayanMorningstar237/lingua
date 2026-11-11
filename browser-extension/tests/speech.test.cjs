const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/speech.js');
const E = require('../src/engine.js');
const source = require('../lang/source.json');

test('amounts are turned into an exact spoken form', () => {
  assert.equal(S.speakValue('25,000 FCFA', 'money'), '25000 francs CFA');
  assert.equal(S.speakValue('25 000 FCFA', 'money'), '25000 francs CFA');
  assert.equal(S.speakValue('-12,500 FCFA', 'money'), 'moins 12500 francs CFA');
  assert.equal(S.speakValue('+180,000 FCFA', 'money'), 'plus 180000 francs CFA');
  assert.equal(S.speakValue('1.500,50 €', 'money'), '1500,50 euros');
  assert.equal(S.speakValue('1,5 %', 'percent'), '1,5 pour cent');
  assert.equal(S.speakValue('+237 6 99 12 34 56', 'phone'), 'plus 237, 6, 99, 12, 34, 56');
  assert.equal(S.speakValue('SAF-2026-WX13I2', 'reference'), 'S A F, 2 0 2 6, W X 1 3 I 2');
});

const AUDIO = 'data:audio/webm;base64,AAAA';
function engineWith(over) {
  return E.createEngine({ entries: source.entries.map(e => ({ ...e, t: '', ...(over[e.id] || {}) })) });
}

test('template speech = recorded pieces with the exact values in between', () => {
  const engine = engineWith({ send_amount_to: { t: 'ZZ {amount} YY {name}.', verified: true, audioParts: [AUDIO + '1', AUDIO + '2'] } });
  const r = engine.translateLocal('Vous allez envoyer 25 000 FCFA à Jean-Paul Mbarga.');
  assert.deepEqual(r.speech, [
    { audio: AUDIO + '1' }, { value: '25 000 FCFA', type: 'money' },
    { audio: AUDIO + '2' }, { value: 'Jean-Paul Mbarga', type: 'name' },
  ]);
  const player = S.createPlayer();
  assert.ok(player.prepare(r.speech, false));
});

test('a missing recording disables listening (never a partial sentence)', () => {
  const engine = engineWith({ send_amount_to: { t: 'ZZ {amount} YY {name}.', verified: true, audioParts: [AUDIO] } });
  const r = engine.translateLocal('Vous allez envoyer 25 000 FCFA à Jean-Paul Mbarga.');
  const player = S.createPlayer();
  assert.equal(player.prepare(r.speech, false), null);
  assert.ok(player.prepare(r.speech, true), 'a local neural voice can fill the gap');
});

test('label : value -> recorded label then the value read exactly', () => {
  const engine = engineWith({ account_number: { t: 'NN', verified: true, audio: AUDIO } });
  const r = engine.translateLocal('Account number: CM 001 2345 6789 01');
  assert.deepEqual(r.speech, [{ audio: AUDIO }, { value: 'CM 001 2345 6789 01' }]);
  assert.equal(S.speakable('CM 001 2345 6789 01'), 'C M, 0 0 1, 2 3 4 5, 6 7 8 9, 0 1');
});

// ---- who speaks: the card is told live, and the browser voice takes over instead of silence ----
function stubVoices() {
  const spoken = [];
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  globalThis.speechSynthesis = { getVoices: () => [], speak: u => { spoken.push(u.text); u.onend(); }, cancel() {} };
  globalThis.Audio = class { constructor(u) { this.src = u; } play() { setTimeout(() => this.onended(), 0); return Promise.resolve(); } pause() {} };
  return spoken;
}

test('local voice off: browser voice reads the sentence and the reason is reported', async () => {
  const spoken = stubVoices();
  const S = require('../src/speech.js');
  const player = S.createPlayer({ tts: async () => ({ fail: 'offline' }), online: () => false, language: () => ({}) });
  const steps = player.prepare([{ missing: true, text: 'Mbolo' }], { tts: true, approx: true });
  assert.equal(steps.voice, 'neural');
  const seen = [];
  await new Promise(res => player.play(steps, res, (src, why) => seen.push(why ? `${src}:${why}` : src)));
  assert.deepEqual(seen, ['wait', 'browser:offline']);
  assert.equal(spoken.length, 1, 'the sentence is still read');
});

test('local voice on: the model audio plays and "local" is reported', async () => {
  const spoken = stubVoices();
  const S = require('../src/speech.js');
  const player = S.createPlayer({ tts: async () => 'data:audio/wav;base64,AA', online: () => false, language: () => ({}) });
  const steps = player.prepare([{ missing: true, text: 'Mbolo' }], { tts: true, approx: true });
  const seen = [];
  await new Promise(res => player.play(steps, res, src => seen.push(src)));
  assert.deepEqual(seen, ['wait', 'local']);
  assert.equal(spoken.length, 0, 'no browser voice needed');
});

test('Pidgin with the local model: words, amount and name are one request, one voice', async () => {
  stubVoices();
  const S = require('../src/speech.js');
  const asked = [];
  const player = S.createPlayer({ tts: async t => { asked.push(t); return 'data:audio/wav;base64,AA'; }, online: () => false, language: () => ({ reading: 'none' }) });
  const steps = player.prepare([{ missing: true, text: 'You go send' }, { value: '25 000 FCFA', type: 'money' }, { missing: true, text: 'give' }, { value: 'Jean Mballa', type: 'name' }], { tts: true, approx: true });
  await new Promise(res => player.play(steps, res));
  assert.equal(asked.length, 1, 'a single model request');
  assert.match(asked[0], /^You go send .*CFA francs give Jean Mballa$/);
});
