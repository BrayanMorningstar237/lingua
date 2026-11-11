const api = globalThis.browser ?? globalThis.chrome;
const $ = id => document.getElementById(id);
const send = msg => api.runtime.sendMessage(msg);

// Interface language: national language when translated, else the browser's (French or English).
const BASE = /^en/i.test(navigator.language || '') ? 'en' : 'fr';
document.documentElement.lang = BASE;
const TEXT = {
  fr: { validated: 'validées', toValidate: 'à valider', missing: 'manquantes', progress: 'Phrases traduites et validées par un locuteur natif' },
  en: { validated: 'validated', toValidate: 'to validate', missing: 'missing', progress: 'Phrases translated and validated by a native speaker' },
}[BASE];
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
    const list = Object.entries(langs).sort((a, b) => ((b[1].count > 0 || b[1].machineTranslation) - (a[1].count > 0 || a[1].machineTranslation)));
    for (const [code, l] of list) {
      const b = document.createElement('button');
      b.className = `lang-btn${l.count || l.machineTranslation ? '' : ' empty'}`;
      const name = document.createElement('b');
      name.textContent = l.name;
      const region = document.createElement('small');
      region.textContent = l.region || '';
      b.append(name, region);
      if (!l.count) {
        const soon = document.createElement('span');
        soon.className = 'soon';
        soon.textContent = l.machineTranslation
          ? (BASE === 'en' ? 'MT draft - unvalidated' : 'Brouillon MT - non validé')
          : ui('ui_soon', BASE === 'en' ? 'Soon' : 'Bientôt');
        b.append(soon);
      }
      b.onclick = async () => { await save({ lang: code }); location.reload(); };
      $('langs').append(b);
    }
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
  for (const [code, l] of Object.entries(langs)) {
    const status = l.machineTranslation
      ? (BASE === 'en' ? ' - MT draft, unvalidated' : ' - Brouillon MT, non validé')
      : ` - ${ui('ui_soon', BASE === 'en' ? 'Soon' : 'Bientôt')}`;
    const o = new Option(`${l.name}${l.count ? '' : status}`, code);
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
  $('onlineVoice').onchange = () => save({ onlineVoice: $('onlineVoice').checked });
  $('opts').onclick = () => api.runtime.openOptionsPage();

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
