const api = globalThis.browser ?? globalThis.chrome;
const $ = id => document.getElementById(id);
const send = msg => api.runtime.sendMessage(msg);

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

  // Site switch
  $('origin').textContent = origin ? origin.replace(/^https?:\/\//, '') : 'Page non prise en charge';
  $('site').checked = !!origin && settings.sites.includes(origin);
  $('site').disabled = !origin;
  const setActions = on => { $('panel').disabled = !on; $('subs').disabled = !on; };
  setActions($('site').checked);
  $('site').onchange = async () => {
    const cur = await send({ type: 'getSettings' });
    const sites = new Set(cur.sites);
    if ($('site').checked) sites.add(origin); else sites.delete(origin);
    await save({ sites: [...sites] });
    setActions($('site').checked);
  };

  // Language
  for (const [code, l] of Object.entries(langs)) {
    const o = new Option(`${l.name} (${l.region})`, code);
    o.selected = code === settings.lang;
    $('lang').append(o);
  }
  $('lang').onchange = async () => { await save({ lang: $('lang').value }); progress(); };

  // Hover mode (segmented control)
  const segs = [...$('hover').querySelectorAll('button')];
  const mark = v => segs.forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); });
  mark(settings.hover || 'ctrl');
  segs.forEach(b => { b.onclick = () => { mark(b.dataset.v); save({ hover: b.dataset.v }); }; });

  // Actions
  const toTab = type => api.tabs.sendMessage(tab.id, { type }).catch(() => {}).finally(() => window.close());
  $('panel').onclick = () => toTab('togglePanel');
  $('subs').onclick = () => toTab('toggleSubtitles');
  $('opts').onclick = () => api.runtime.openOptionsPage();

  // Progress of the language pack
  async function progress() {
    const pack = await send({ type: 'getPack', lang: $('lang').value });
    const list = pack.entries.filter(e => e.group !== 'ui');
    const n = list.length;
    const v = list.filter(e => e.t && e.verified).length;
    const t = list.filter(e => e.t && !e.verified).length;
    $('barV').style.width = `${(100 * v) / n}%`;
    $('barT').style.width = `${(100 * t) / n}%`;
    $('legV').textContent = `${v} validées`;
    $('legT').textContent = `${t} à valider`;
    $('legN').textContent = `${n - v - t} manquantes`;
  }
  progress();
})();
