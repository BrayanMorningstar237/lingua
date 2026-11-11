/*
 * Langwa: assistant tab ("Ask"). Answers questions about the current page in the user's
 * language, by text or by voice.
 *
 * - Built-in answers (instant, offline, exact): what is this page, how much will I pay, who
 *   receives the money, is there a warning, what do I do next, what is my balance. Built from
 *   the page itself and the validated glossary, so amounts are always the page's own.
 * - Free questions: an open-source model running on this computer (Ollama / llama.cpp), if set
 *   up. Any number in its answer must exist on the page, otherwise the answer is refused.
 * - Voice questions: local open-source speech server (Meta MMS: detects the language and
 *   transcribes, server/asr_server.py), or with consent the browser's speech recognition
 *   (French, English, Pidgin through Nigerian English).
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect;

  const foldQ = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ɓ/g, 'b').replace(/ɗ/g, 'd').replace(/ƴ/g, 'y').replace(/ŋ/g, 'ng');

  // Keywords in French, English, Pidgin and Fulfulde (draft) for each built-in question.
  const INTENTS = [
    ['balance', /\b(solde|balance|il me reste|combien j.?ai|how much (money )?(i get|i have|i remain)|money wey i get|money wey dey|ceede am|ceede maa)\b/],
    ['receiver', /\b(qui|who|benefici\w*|receive|recoit|recevra|pesin|person|jaboowo|moye|nom|name|innde)\b/],
    ['steps', /\b(steps?|stages?|process|etapes?|how (?:does|do) (?:the )?(?:transfer|payment) work|what happens next)\b/],
    ['next', /\b(next|ensuite|apres|faire|fais|maintenant|now|do now|go do|continue[rz]?|bouton|button|click|cliquer|press|jokku|wad\w*|jooni)\b/],
    ['warning', /\b(danger|attention|warning|alerte?|risk|risque|safe|secur\w*|reentino|kisal|probleme?|problem|erreur|error|wahala)\b/],
    ['amount', /\b(combien|how much|montant|amount|payer|pay|moni|money|ceede|total|frais|fees|charges?|cost|cout|debit|yob\w*|no foti)\b/],
    ['page', /\b(page|what|quoi|wetin|wtin|happen\w*|passe|about|sujet|expliqu\w*|explain|hondum|ki be|ndoo|doo|hello ngol)\b/],
  ];
  const detectIntent = q => (INTENTS.find(([, re]) => re.test(foldQ(q))) || [null])[0];

  function create(ctx) {
    const { h, icon, ui, state, send, player, voiceOpts, shownText, setLight, api } = ctx;
    const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    const chat = [];
    let els = null;

    // ---------------- facts from the page ----------------
    function facts() {
      const units = state.units;
      const idx = id => units.findIndex(u => u.result && ((u.result.ids || []).includes(id) || u.result.id === id));
      const hasId = ids => units.some(u => u.result && ids.some(id => (u.result.ids || []).includes(id) || u.result.id === id));
      const valueAfter = i => {
        const u = units[i];
        if (/:\s*\S/.test(u.text) && u.result && u.result.status === 'ok') return u.text.split(/:\s*/).slice(1).join(': ');
        for (let k = i + 1; k < Math.min(units.length, i + 4); k++) {
          const next = units[k];
          // Stepper badges are protected values too. A nearby bare "4" is a step
          // number, never an amount or beneficiary value.
          if (next.result && next.result.value && /\p{L}/u.test(next.text)) return next.text;
        }
        return null;
      };
      const val = ids => { for (const id of ids) { const i = idx(id); if (i >= 0) { const v = valueAfter(i); if (v) return v; } } return null; };
      const numberNear = ids => {
        for (const id of ids) {
          const i = idx(id);
          if (i < 0) continue;
          for (let k = i; k < Math.min(units.length, i + 10); k++) {
            const u = units[k];
            const idsHere = u.result ? [...(u.result.ids || []), u.result.id || ''] : [];
            if (!u.result || !u.result.value || idsHere.some(x => /step/i.test(x))) continue;
            const candidate = u.text.trim();
            if (/^\d(?:[\d\s,.'’]*\d)?$/.test(candidate)) return candidate;
          }
        }
        return null;
      };
      const currencyValue = u => u && u.result && u.result.value && /(?:FCFA|CFA|XAF|XOF)/i.test(u.text) ? u.text.trim() : null;
      // Financial labels and values are often separate, deeply nested DOM blocks. Search
      // nearby protected values instead of assuming the amount is one of the next three units.
      const moneyNear = ids => {
        for (const id of ids) {
          const i = idx(id);
          if (i < 0) continue;
          const direct = currencyValue(units[i]);
          if (direct) return direct;
          for (let k = i + 1; k < Math.min(units.length, i + 16); k++) {
            const v = currencyValue(units[k]);
            if (v) return v;
          }
        }
        return null;
      };
      const stepDefs = [
        ['step_pay', 'Pay'], ['step_costs', 'Costs'], ['step_beneficiary', 'Beneficiary'],
        ['step_summary', 'Summary'], ['step_confirmation', 'Confirmation'],
      ];
      const heading = units.find(u => /^H[1-3]$/.test(u.el.tagName) && !(u.result && u.result.value)
        && !/^(hello|bonjour)\b/i.test(u.text) && !u.el.closest('nav, aside, [role="navigation"]'));
      const headingText = heading ? heading.text.trim() : '';
      const pageText = units.map(u => u.text).join(' ');
      const activeStep = units.find(u => {
        const isStep = stepDefs.some(([id]) => u.result && ((u.result.ids || []).includes(id) || u.result.id === id));
        if (!isStep) return false;
        return !!u.el.closest('[aria-current="step"], [aria-current="page"], [aria-selected="true"], [data-state="active"], [data-active="true"], .active, .current, .is-active, .step-active');
      });
      const activeDef = activeStep && stepDefs.find(([id]) => (activeStep.result.ids || []).includes(id) || activeStep.result.id === id);
      let pageKind = 'account';
      if (hasId(['transfer_completed', 'transfer_sent_success', 'transfer_success']) || /transfer completed|transfer has been sent successfully|virement termin[eé]|transfert effectu[eé]/i.test(pageText)) pageKind = 'complete';
      else if (hasId(['transfer_summary']) || /^(transfer )?summary$|^r[eé]capitulatif( du virement)?$/i.test(headingText)) pageKind = 'summary';
      else if (hasId(['enter_recipient_info', 'new_beneficiary_warning']) || /enter the recipient.?s information|always check the number before submitting|saisissez les informations du destinataire/i.test(pageText) || /^beneficiary|^b[eé]n[eé]ficiaire$/i.test(headingText)) pageKind = 'beneficiary';
      else if (hasId(['transfer_fees', 'choose_type_amount']) || /choose the transfer type and amount|transfer fees|frais de virement/i.test(pageText) || /^(transfer )?(fees|costs)$|^frais( de virement)?$/i.test(headingText)) pageKind = 'costs';
      else if (activeDef) pageKind = ({ step_pay: 'account', step_costs: 'costs', step_beneficiary: 'beneficiary', step_summary: 'summary', step_confirmation: 'confirmation' })[activeDef[0]];
      else if (/^confirmation$/i.test(headingText)) pageKind = 'confirmation';
      const isButton = u => /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button' || (u.el.tagName === 'INPUT' && /submit|button/.test(u.el.type));
      const buttons = units.filter(u => isButton(u) && u.result && !u.result.value);
      const order = ['confirm_transfer', 'confirm', 'continue', 'perform_transfer', 'new_transfer'];
      const main = order.map(id => buttons.find(b => (b.result.ids || []).includes(id) || b.result.id === id)).find(Boolean) || buttons[buttons.length - 1];
      return {
        title: heading ? shownText(heading) : (document.title || '').split(/\s+[|·•–—-]\s+/)[0],
        total: moneyNear(['total_debited']) || val(['total_debited']),
        amount: moneyNear(['amount', 'amount_to_send']) || val(['amount', 'amount_to_send']),
        amountNumber: numberNear(['amount', 'amount_to_send']),
        fees: moneyNear(['fees', 'transfer_fees', 'transaction_fees']) || val(['fees', 'transfer_fees', 'transaction_fees']),
        receiver: (() => {
          const candidate = val(['beneficiary_name', 'beneficiary']);
          return candidate && /^[\p{Lu}][\p{L}'’.-]*(?:\s+[\p{Lu}][\p{L}'’.-]*){0,3}$/u.test(candidate.trim()) ? candidate.trim() : null;
        })(),
        balance: moneyNear(['available_balance', 'balance']) || val(['available_balance', 'balance']),
        warnings: units.filter(u => u.result && (u.result.kind === 'warning' || u.result.kind === 'error') && !u.result.value).map(shownText),
        next: main ? `«${shownText(main)}»` : null,
        pageKind,
        activeStep: activeDef ? activeDef[1] : null,
      };
    }

    // ---------------- built-in answers ----------------
    function answer(intent) {
      const f = facts();
      const out = [];
      const say = (id, fr, vars = {}) => out.push(fill(ui(id, fr), vars));
      if (intent === 'page') {
        const en = /^en/i.test(navigator.language || '');
        const descriptions = {
          account: en ? 'This is your account overview. It shows your available balance and recent transactions.' : 'Voici le récapitulatif de votre compte : solde disponible et transactions récentes.',
          costs: en ? 'This is the costs step. Choose the transfer type and amount; the fee and total are shown before you continue.' : 'Vous êtes à l’étape des frais. Choisissez le type de virement et le montant ; les frais et le total sont affichés avant de continuer.',
          beneficiary: en ? 'This is the beneficiary step. Enter the recipient’s name and phone number, then check both before continuing.' : 'Vous êtes à l’étape du bénéficiaire. Saisissez son nom et son numéro de téléphone, puis vérifiez-les avant de continuer.',
          summary: en ? 'This is the transfer summary. Check the amount, fees, recipient, and phone number before confirming.' : 'Voici le récapitulatif du virement. Vérifiez le montant, les frais, le bénéficiaire et son numéro avant de confirmer.',
          confirmation: en ? 'This is the confirmation step. Review the transfer details, then confirm only if they are correct.' : 'Vous êtes à l’étape de confirmation. Relisez les détails et confirmez seulement s’ils sont corrects.',
          complete: en ? 'The transfer is complete. This page shows its amount, recipient, and status.' : 'Le virement est terminé. Cette page indique son montant, son bénéficiaire et son statut.',
        };
        out.push(descriptions[f.pageKind] || descriptions.account);
        if (f.pageKind !== 'complete') out.push(en
          ? 'The five steps are Pay, Costs, Beneficiary, Summary, and Confirmation.'
          : 'Les cinq étapes sont : payer, frais, bénéficiaire, récapitulatif et confirmation.');
        const total = [f.total, f.amount].find(v => v && /(?:FCFA|CFA|XAF|XOF)/i.test(v));
        if (total) say('ans_amount', 'Montant total : {total}.', { total });
        if (f.receiver) say('ans_receiver', "L'argent va à {name}.", { name: f.receiver });
      } else if (intent === 'amount') {
        const total = [f.total, f.amount].find(v => v && /(?:FCFA|CFA|XAF|XOF)/i.test(v));
        const fees = f.fees && /(?:FCFA|CFA|XAF|XOF)/i.test(f.fees) ? f.fees : null;
        if (total) say('ans_amount', 'Montant total : {total}.', { total });
        if (fees) say('ans_fees', 'Frais : {fees}.', { fees });
        if (!out.length) say('ans_no_amount', 'Je ne vois pas de montant à payer sur cette page.');
      } else if (intent === 'receiver') {
        if (f.receiver) say('ans_receiver', "L'argent va à {name}.", { name: f.receiver });
        else say('ans_no_receiver', 'Je ne vois pas encore de bénéficiaire sur cette page.');
      } else if (intent === 'warning') {
        if (f.warnings.length) f.warnings.slice(0, 2).forEach(m => say('ans_warning', 'Attention : {message}', { message: m }));
        else say('ans_no_warning', "Pas d'alerte sur cette page.");
      } else if (intent === 'next') {
        if (f.next) say('ans_next', 'Ensuite, appuyez sur {button}.', { button: f.next });
        else say('ans_no_next', 'Je ne vois pas de bouton à appuyer.');
      } else if (intent === 'balance') {
        if (f.balance) say('ans_balance', 'Argent disponible : {balance}.', { balance: f.balance });
        else say('ans_no_amount', 'Je ne vois pas de montant à payer sur cette page.');
      } else if (intent === 'steps') {
        const en = /^en/i.test(navigator.language || '');
        out.push(en
          ? 'A transfer has five steps: 1) Pay: start the transfer. 2) Costs: choose the type and amount, then review the fee. 3) Beneficiary: enter and check the recipient’s name and number. 4) Summary: review all details. 5) Confirmation: confirm only when everything is correct.'
          : 'Un virement comporte cinq étapes : 1) Payer : démarrer le virement. 2) Frais : choisir le type et le montant, puis vérifier les frais. 3) Bénéficiaire : saisir et vérifier son nom et son numéro. 4) Récapitulatif : relire les informations. 5) Confirmation : confirmer seulement si tout est correct.');
      }
      return out.join(' ');
    }

    /** Kamtok replies use the same page facts as the built-in answers, with short natural wording. */
    function answerKamtok(intent) {
      if (state.pack.code !== 'wes') return null;
      const f = facts();
      // A bare step number can be mistaken for the transfer amount when a page
      // has several stages. Only report values that visibly carry the currency.
      const money = value => value && /(?:FCFA|CFA|XAF|F\s*CFA)/i.test(value) ? value : null;
      const amount = money(f.amount) || (f.amountNumber ? `${f.amountNumber} FCFA` : null);
      const total = money(f.total);
      const fees = money(f.fees);
      const balance = money(f.balance);
      const out = [];
      if (intent === 'page') {
        const page = {
          account: 'Dis na your account page. E show the money wey dey your account and your recent transactions. To send money, follow the five transfer steps: Pay, Costs, Beneficiary, Summary, Confirmation.',
          costs: 'You dey the Costs step. Choose the transfer type and amount here; check the charges and total before you continue. The full steps na Pay, Costs, Beneficiary, Summary, Confirmation.',
          beneficiary: 'You dey the Beneficiary step. Put the receiver name and phone number, then check them well before you continue. The full steps na Pay, Costs, Beneficiary, Summary, Confirmation.',
          summary: 'You dey the Summary step. Check the amount, charges, receiver name, and phone number before you confirm. The full steps na Pay, Costs, Beneficiary, Summary, Confirmation.',
          confirmation: 'You dey the Confirmation step. Read the transfer details again and confirm only if everything correct.',
          complete: 'The transfer don complete. Dis page show the amount, who receive am, and the status.',
        };
        out.push(page[f.pageKind] || page.account);
        if (amount && f.pageKind !== 'costs') out.push(`You wan send ${amount}.`);
        if (fees && f.pageKind === 'costs') out.push(fees === '0 FCFA' ? 'The transfer charge na free.' : `The transfer charge na ${fees}.`);
        if (total && f.pageKind === 'summary') out.push(`The total wey go comot your account na ${total}.`);
        if (f.receiver && ['beneficiary', 'summary', 'complete'].includes(f.pageKind)) out.push(`Na ${f.receiver} go receive the money.`);
      } else if (intent === 'steps') {
        out.push('Transfer get five steps: 1) Pay: start the transfer. 2) Costs: choose the type and amount, then check the charges. 3) Beneficiary: put and check the receiver name and number. 4) Summary: review everything. 5) Confirmation: confirm only when all the details correct.');
      } else if (intent === 'amount') {
        if (total || amount) out.push(`All the money wey go comot for your account na ${total || amount}.`);
        if (fees) out.push(`The charges na ${fees}.`);
        if (!out.length && balance) out.push(`You never choose how much to send yet. The money wey you fit use na ${balance}.`);
        if (!out.length) out.push('I no see the amount for this page.');
      } else if (intent === 'receiver') {
        out.push(f.receiver ? `Na ${f.receiver} go receive the money.` : 'The person wey go receive the money never show for this page.');
      } else if (intent === 'warning') {
        out.push(f.warnings.length ? 'Before you confirm, check the receiver name and number well.' : 'I no see any warning for this page.');
      } else if (intent === 'next') {
        out.push(f.next ? `If you don check everything, press ${f.next}.` : 'I no see the next button for this page.');
      } else if (intent === 'balance') {
        out.push(balance ? `The money wey you fit use now na ${balance}.` : 'I no see your available balance for this page.');
      }
      return out.length ? out.join(' ') : null;
    }

    /** Answer text -> speech steps: words in the national voice, amounts/names read exactly. */
    function stepsOf(text) {
      const m = P.mask(text, { brands: state.brands || [] });
      const steps = [];
      let rest = m.masked;
      for (const t of m.tokens) {
        const [before, after] = rest.split(t.key);
        if (/\p{L}/u.test(before)) steps.push({ missing: true, text: before.trim() });
        if (['wes', 'lns'].includes(state.pack.code) && t.type === 'money') {
          // Keep the exact numeric value, but send it through the selected language voice.
          // Lamnso' uses its local MMS voice; CFA is a familiar French loanword in the region.
          const rawNumber = (t.value.match(/\d[\d\s.,]*\d|\d/) || [''])[0];
          const number = root.LangwaSpeech ? root.LangwaSpeech.spokenNumber(rawNumber) : rawNumber.replace(/[\s.,]/g, '');
          steps.push({ missing: true, text: state.pack.code === 'lns' ? `${number} francs CFA` : `${number} CFA francs` });
        } else steps.push({ value: t.value, type: t.type });
        rest = after || '';
      }
      if (/\p{L}/u.test(rest)) steps.push({ missing: true, text: rest.trim() });
      return player.prepare(steps, voiceOpts());
    }

    /** Numbers in a model's answer must all exist on the page (no invented amounts). */
    function numbersAreFromPage(text) {
      const page = state.units.map(u => u.text).join(' ').replace(/[\s  .,]/g, '');
      return (text.match(/\d[\d\s  .,]*\d|\d/g) || []).every(n => page.includes(n.replace(/[\s  .,]/g, '')));
    }

    async function ask(question, intentHint) {
      const q = String(question || '').trim();
      if (!q) return;
      push({ role: 'me', text: q });
      const intent = intentHint || detectIntent(q);
      if (intent) return reply(answerKamtok(intent) || answer(intent));
      // Free question: local open-source model, if set up.
      if (state.settings.mt && state.settings.mt.mode === 'openai') {
        const thinking = push({ role: 'bot', text: '…', pending: true });
        const context = state.units.filter(u => u.result).slice(0, 80).map(u => (u.result.value ? u.text : `${shownText(u)} (${u.text})`));
        let res = null;
        try { res = await send({ type: 'chat', lang: state.pack.code, question: q, context }); } catch { res = null; }
        chat.splice(chat.indexOf(thinking), 1);
        if (res && res.text && numbersAreFromPage(res.text)) {
          // Do not show unconstrained model prose as Kamtok: many local models only know
          // Nigerian Pidgin or produce literal English word order. Keep the grounded path.
          if (state.pack.code !== 'wes') return reply(res.text, { model: true });
        }
      }
      reply(ui('ans_unknown', 'Je peux répondre à ces questions :'), { chips: true });
    }

    function reply(text, extra = {}) {
      const m = push({ role: 'bot', text, ...extra });
      if (state.settings.autoRead || extra.spoken) {
        const steps = stepsOf(text);
        if (steps) player.play(steps);
      }
      return m;
    }

    function push(m) { chat.push(m); render(); return m; }

    // ---------------- voice questions ----------------
    let rec = null;
    async function listen() {
      const asr = (state.settings && state.settings.asr) || {};
      if (rec) { rec.stop(); return; }
      if (asr.mode === 'local') return listenLocal();
      const SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) return reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.'));
      if (!state.settings.onlineSpeech) return askSpeechConsent(() => listenBrowser(SR));
      listenBrowser(SR);
    }

    function listenBrowser(SR) {
      const code = state.pack.code;
      const base = /^en/i.test(navigator.language || '') ? 'en-US' : 'fr-FR';
      const lang = code === 'wes' ? 'en-NG' : base;
      const r = new SR();
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = 1;
      rec = { stop: () => r.stop() };
      setMic(true);
      r.onresult = e => { const t = e.results[0][0].transcript; ask(t); };
      r.onerror = () => {};
      r.onend = () => { rec = null; setMic(false); };
      r.start();
    }

    async function listenLocal() {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.')); }
      const chunks = [];
      const mr = new MediaRecorder(stream);
      rec = { stop: () => mr.state !== 'inactive' && mr.stop() };
      setMic(true);
      const timer = setTimeout(() => rec && rec.stop(), 12000);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach(t => t.stop());
        rec = null;
        setMic(false);
        const wav = await toWav16k(new Blob(chunks, { type: mr.mimeType }));
        const thinking = push({ role: 'bot', text: '…', pending: true });
        let res = null;
        try { res = await send({ type: 'asr', audio: wav, hint: state.pack.code }); } catch { res = null; }
        chat.splice(chat.indexOf(thinking), 1);
        if (!res || !res.text) { reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.')); return; }
        if (res.lang && res.lang !== state.pack.code && state.langs && state.langs[res.lang]) offerLanguage(res.lang);
        ask(res.text);
      };
      mr.start();
    }

    /** Recording -> 16 kHz mono WAV (base64), the format the open-source speech models expect. */
    async function toWav16k(blob) {
      const buf = await blob.arrayBuffer();
      const ac = new (root.AudioContext || root.webkitAudioContext)();
      const decoded = await ac.decodeAudioData(buf);
      ac.close();
      const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const src = off.createBufferSource();
      src.buffer = decoded; src.connect(off.destination); src.start();
      const pcm = (await off.startRendering()).getChannelData(0);
      const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
      const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); out.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true);
      out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, 16000, true); out.setUint32(28, 32000, true);
      out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, pcm.length * 2, true);
      for (let i = 0; i < pcm.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
      let bin = '';
      const bytes = new Uint8Array(out.buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }

    /** The speaker used another language than the one set: offer to switch, one tap. */
    function offerLanguage(code) {
      const name = state.langs[code].name;
      push({ role: 'bot', text: fill(ui('ans_lang_detected', 'Vous parlez {lang} ?'), { lang: name }), action: { label: fill(ui('ui_switch_to', 'Passer en {lang}'), { lang: name }), run: async () => {
        const cur = await send({ type: 'getSettings' });
        await api.storage.local.set({ settings: { ...cur, lang: code } });
      } } });
    }

    function askSpeechConsent(then) {
      push({ role: 'bot', text: ui('ans_speech_consent', 'Pour comprendre votre voix, le navigateur envoie l’enregistrement au service de reconnaissance de Google (français, anglais, pidgin).'), action: { label: ui('ui_enable', 'Activer'), run: () => { setLight({ onlineSpeech: true }); then(); } } });
    }

    function setMic(on) { if (els) { els.mic.classList.toggle('on', on); els.mic.setAttribute('aria-pressed', on); els.input.placeholder = on ? ui('ui_listening', 'J’écoute…') : ui('ui_ask_placeholder', 'Posez votre question…'); } }

    // ---------------- view ----------------
    const QUESTIONS = [
      ['page', 'q_page', 'C’est quoi cette page ?'],
      ['steps', 'q_steps', state.pack.code === 'wes' ? 'Wetin be the transfer steps?' : (/^en/i.test(navigator.language || '') ? 'What are the transfer steps?' : 'Quelles sont les étapes du virement ?')],
      ['amount', 'q_amount', 'Combien je vais payer ?'],
      ['receiver', 'q_receiver', 'Qui reçoit l’argent ?'],
      ['warning', 'q_warning', 'Y a-t-il un danger ?'],
      ['next', 'q_next', 'Je fais quoi maintenant ?'],
    ];

    function mount() {
      const log = h('div', { class: 'log', 'aria-live': 'polite' });
      const chips = h('div', { class: 'qchips' }, QUESTIONS.map(([intent, id, fr]) => h('button', { type: 'button', class: 'qchip', onclick: () => ask(ui(id, fr), intent) }, ui(id, fr))));
      const input = h('input', { type: 'text', class: 'askin', placeholder: ui('ui_ask_placeholder', 'Posez votre question…'), 'aria-label': ui('ui_ask_placeholder', 'Posez votre question…'), enterkeyhint: 'send' });
      const mic = h('button', { type: 'button', class: 'mic', title: ui('ui_mic', 'Parler'), 'aria-label': ui('ui_mic', 'Parler'), onclick: listen }, icon('mic'));
      const sendBtn = h('button', { type: 'submit', class: 'sendq', 'aria-label': ui('ui_send', 'Envoyer') }, icon('send'));
      const form = h('form', { class: 'askrow' }, mic, input, sendBtn);
      form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
      input.addEventListener('keydown', e => e.stopPropagation()); // typing never triggers page shortcuts
      const view = h('div', { class: 'chat' }, log, chips, form);
      els = { view, log, chips, input, mic };
      render();
      return view;
    }

    function render() {
      if (!els) return;
      if (!chat.length) chat.push({ role: 'bot', text: ui('ans_welcome', 'Bonjour ! Posez-moi une question sur cette page, en écrivant ou à voix haute.') });
      els.log.replaceChildren(...chat.map(m => {
        if (m.role === 'me') return h('div', { class: 'msg me' }, m.text);
        const steps = !m.pending && stepsOf(m.text);
        return h('div', { class: `msg bot${m.pending ? ' pending' : ''}` },
          h('div', { class: 'mrow' }, h('div', { class: 'mtext' }, m.pending ? h('span', { class: 'dots' }, h('i'), h('i'), h('i')) : m.text),
            steps ? ctx.sayButton(steps, ui('ui_listen', 'Écouter'), { compact: true }) : null),
          m.model ? h('div', { class: 'mnote' }, ui('ans_model_note', 'Réponse d’un modèle local, à vérifier.')) : null,
          m.action ? h('button', { class: 'maction', type: 'button', onclick: e => { e.stopPropagation(); m.action.run(); m.action = null; render(); } }, m.action.label) : null);
      }));
      els.log.scrollTop = els.log.scrollHeight;
    }

    return { mount, render, ask, reset: () => { chat.length = 0; render(); } };
  }

  root.LangwaAssistant = { create, detectIntent };
  if (typeof module !== 'undefined' && module.exports) module.exports = { detectIntent };
})(typeof globalThis !== 'undefined' ? globalThis : this);
