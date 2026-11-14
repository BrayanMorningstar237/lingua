const api = globalThis.browser ?? globalThis.chrome;
const $ = id => document.getElementById(id);
const send = msg => api.runtime.sendMessage(msg);

// Interface language: national language when translated, else the browser's (French or English).
const BASE = !/^fr/i.test(navigator.language || '') ? 'en' : 'fr';
document.documentElement.lang = BASE;
const TEXT = {
  fr: { validated: 'validées', toValidate: 'à valider', missing: 'manquantes', progress: 'Phrases traduites et validées par un locuteur natif' },
  en: { validated: 'validated', toValidate: 'to validate', missing: 'missing', progress: 'Phrases translated and validated by a native speaker' },
}[BASE];
// Languages, most complete first (translated share, then automatic drafts, then by name).
const rankLangs = langs => Object.entries(langs || {}).sort(([, a], [, b]) =>
  (b.count || 0) - (a.count || 0) || (b.machineTranslation ? 1 : 0) - (a.machineTranslation ? 1 : 0) || a.name.localeCompare(b.name));
const coverageText = l => (l.count ? `${l.pct ?? 0} %` : l.machineTranslation
  ? (BASE === 'en' ? 'Automatic draft' : 'Brouillon automatique') : (BASE === 'en' ? 'Soon' : 'Bientôt'));
const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ'’ʼ]/g, '').toLowerCase();
let UI = new Map();
const ui = (id, fallback) => UI.get(id) || fallback;

function applyUi(pack) {
  UI = new Map(pack.entries.filter(e => e.group === 'ui').map(e => [e.id, e.t || (BASE === 'en' ? e.en : e.fr)]));
  for (const el of document.querySelectorAll('[data-ui]')) el.textContent = ui(el.dataset.ui, el.textContent);
}

async function save(patch) {
  const cur = await send({ type: 'getSettings' });
  await api.storage.local.set({ settings: { ...cur, ...patch } });
}

(async () => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  let origin = '';
  try {
    const u = new URL(tab.url);
    if (/^(https?|file):$/.test(u.protocol)) origin = u.protocol === 'file:' ? 'file://' : u.origin;
  } catch { /* browser pages */ }

  const [settings, langs] = await Promise.all([send({ type: 'getSettings' }), send({ type: 'getLangs' })]);
  applyUi(await send({ type: 'getPack', lang: settings.lang }));

  // ---------- first use: choose a language ----------
  if (!settings.lang) {
    $('chooser').hidden = false;
    const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text != null ? { textContent: text } : {});
    const buttons = rankLangs(langs).map(([code, l]) => {
      const b = el('button', `lang-btn${l.count || l.machineTranslation ? '' : ' empty'}`);
      b.append(el('b', '', l.name), el('small', '', l.region || ''));
      if (l.count) {
        const bar = el('span', 'covbar');
        const fill = el('i');
        fill.style.width = `${l.pct ?? 0}%`;
        bar.append(fill);
        const cov = el('span', 'cov');
        cov.append(bar, el('span', '', coverageText(l)));
        b.append(cov);
        b.title = `${l.count} / ${l.total} ${BASE === 'en' ? 'phrases translated' : 'phrases traduites'}`;
      } else {
        b.append(el('span', 'soon', coverageText(l)));
      }
      b.dataset.q = fold(`${code} ${l.name} ${l.region || ''} ${l.search || ''}`);
      b.onclick = async () => { await save({ lang: code }); location.reload(); };
      return b;
    });
    $('langs').append(...buttons);
    // Search: names, other names, regions and towns, accents ignored. Only shows or hides buttons.
    const search = $('lsearch');
    search.placeholder = BASE === 'en' ? 'Search: Pidgin, Fulani, Bamiléké, Kumbo…' : 'Rechercher : pidgin, peul, bamiléké, Kumbo…';
    search.setAttribute('aria-label', BASE === 'en' ? 'Search a language' : 'Rechercher une langue');
    $('nolang').textContent = BASE === 'en' ? 'No language found. Try another name or a town.' : 'Aucune langue trouvée. Essayez un autre nom ou une ville.';
    search.oninput = () => {
      const words = fold(search.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const b of buttons) { const ok = words.every(w => b.dataset.q.includes(w)); b.hidden = !ok; shown += ok; }
      $('nolang').hidden = shown > 0;
    };
    search.onkeydown = e => { if (e.key === 'Enter') { const first = buttons.find(b => !b.hidden); if (first) first.click(); } };
    search.focus();
    return;
  }

  $('main').hidden = false;

  // ---------- site switch (and reload hint for pages opened before install) ----------
  $('origin').textContent = origin ? origin.replace(/^https?:\/\//, '') : ui('ui_unsupported', 'Page non prise en charge');
  $('site').checked = !!origin && settings.sites.includes(origin);
  $('site').disabled = !origin;
  const ping = () => api.tabs.sendMessage(tab.id, { type: 'ping' }).then(r => !!r, () => false);
  const loaded = origin ? await ping() : false;
  const setActions = on => {
    for (const id of ['panel', 'page', 'readAll']) $(id).disabled = !on || !loaded;
    $('reloadBox').classList.toggle('show', on && !loaded);
  };
  setActions($('site').checked);
  $('reload').onclick = () => { api.tabs.reload(tab.id); window.close(); };
  $('site').onchange = async () => {
    const cur = await send({ type: 'getSettings' });
    const sites = new Set(cur.sites);
    if ($('site').checked) sites.add(origin); else sites.delete(origin);
    await save({ sites: [...sites] });
    setActions($('site').checked);
  };

  // ---------- language ----------
  for (const [code, l] of rankLangs(langs)) {
    const o = new Option(`${l.name} · ${coverageText(l)}`, code);
    o.title = l.region || '';
    o.selected = code === settings.lang;
    $('lang').append(o);
  }
  $('lang').onchange = async () => {
    await save({ lang: $('lang').value });
    applyUi(await send({ type: 'getPack', lang: $('lang').value }));
    progress();
  };

  // ---------- display mode ----------
  const segs = [...$('hover').querySelectorAll('button')];
  const mark = v => segs.forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); });
  mark(settings.hover || 'ctrl');
  segs.forEach(b => { b.onclick = () => { mark(b.dataset.v); save({ hover: b.dataset.v }); }; });

  // ---------- actions ----------
  const toTab = type => api.tabs.sendMessage(tab.id, { type }).catch(() => {}).finally(() => window.close());
  $('panel').onclick = () => toTab('togglePanel');
  $('page').onclick = () => toTab('togglePage');
  $('page').classList.toggle('on', !!settings.pageMode);
  $('readAll').onclick = () => toTab('readAll');

  // Automatic reading (cards are read aloud as soon as they appear)
  $('autoRead').checked = !!settings.autoRead;
  $('autoRead').onchange = () => save({ autoRead: $('autoRead').checked });
  $('onlineVoice').checked = !!settings.onlineVoice;
  $('onlineVoice').onchange = () => { settings.onlineVoice = $('onlineVoice').checked; save({ onlineVoice: settings.onlineVoice }); };
  $('opts').onclick = () => api.runtime.openOptionsPage();
  // The guided tour runs on the page itself (where the controls are).
  $('guide').disabled = !loaded;
  $('guide').onclick = () => toTab('startTour');

  // ---------- local natural voice: live status while the popup is open (hidden when not running) ----------
  const V = BASE === 'en'
    ? { inst: (p, m) => `Natural voice: installing ${p}%${m}`, min: n => ` · ~${n} min`, soon: ' · <1 min', start: 'Natural voice: starting…', ready: '✓ Natural voice ready', sleep: 'Natural voice: resting, wakes on use', notReady: 'Natural voice: not ready', setup: 'Set up', online: 'Online natural voice in use' }
    : { inst: (p, m) => `Voix naturelle : installation ${p} %${m}`, min: n => ` · ~${n} min`, soon: ' · <1 min', start: 'Voix naturelle : démarrage…', ready: '✓ Voix naturelle prête', sleep: 'Voix naturelle en veille, se réveille à l’usage', notReady: 'Voix naturelle : pas prête', setup: 'Installer', online: 'Voix naturelle en ligne utilisée' };
  async function voiceLine() {
    const tts = settings.tts || {};
    if (tts.mode === 'none' || document.hidden) return;
    let j = null;
    try {
      const r = await fetch((tts.africaEndpoint || 'http://127.0.0.1:8770/tts').replace(/\/tts\/?$/, '/health'), { signal: AbortSignal.timeout(1500) });
      j = r.ok ? await r.json() : null;
    } catch { /* not running: the browser voice is used, nothing to show */ }
    const line = $('vline');
    // Not running: the natural voice is the default, so say it is not ready and how to set it up
    // (only for languages it can read).
    const natural = !!((langs[settings.lang] || {}).africaTts);
    $('vlineSet').hidden = true;
    if (!j && natural) {
      line.hidden = false;
      line.dataset.s = 'notready';
      $('vlineText').textContent = settings.onlineVoice ? V.online : V.notReady;
      line.dataset.s = settings.onlineVoice ? 'ready' : 'notready';
      $('vlineSet').hidden = false;
      $('vlineSet').textContent = V.setup;
      $('vlineSet').onclick = () => { api.tabs.create({ url: 'https://langwa-five.vercel.app/#voice-setup' }); window.close(); };
      setTimeout(voiceLine, 3000);
      return;
    }
    line.hidden = !j || j.status === 'error';
    if (!line.hidden) {
      const pct = Math.max(1, Math.round((j.progress || 0) * 100));
      line.dataset.s = j.status;
      $('vlineText').textContent = j.status === 'installing' ? V.inst(pct, j.etaSec == null ? '' : j.etaSec < 60 ? V.soon : V.min(Math.round(j.etaSec / 60)))
        : j.status === 'ready' ? V.ready : j.status === 'sleeping' ? V.sleep : V.start;
      $('vlineBar').style.width = `${pct}%`;
    }
    if (!j || j.status !== 'ready') setTimeout(voiceLine, 3000);
  }
  voiceLine();

  // ---------- progress of the language pack ----------
  async function progress() {
    const pack = await send({ type: 'getPack', lang: $('lang').value });
    const list = pack.entries.filter(e => e.group !== 'ui');
    const n = list.length;
    const v = list.filter(e => e.t && e.verified).length;
    const t = list.filter(e => e.t && !e.verified).length;
    $('progress').title = TEXT.progress;
    $('barV').style.width = `${(100 * v) / n}%`;
    $('barT').style.width = `${(100 * t) / n}%`;
    $('legV').textContent = `${v} ${TEXT.validated}`;
    $('legT').textContent = `${t} ${TEXT.toValidate}`;
    $('legN').textContent = `${n - v - t} ${TEXT.missing}`;
  }
  progress();
})();
