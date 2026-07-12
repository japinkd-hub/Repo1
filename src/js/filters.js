// Filter- en viewstate, URL-sync, filterchips
let activeHlo = null;
// === STATE ===
let curView = "thematafels";
let selectedNr = null;
let dpHistory = [];
let activeClusterId = null;  // null = geen cluster-filter

const activeTFs = new Set(["T1","T2","T3","IZA"]);
const activeSrcs = new Set(Object.keys(SRC_LABELS));
const activeStats = new Set(ALL_STATUS_FILTER_KEYS);
const activeOnds = new Set(Object.keys(OND_LABELS));

// === URL FILTER STATE ===
function getFilterParams(){
  const params = new URLSearchParams();
  if(activeTFs.size < Object.keys(TF_META).length) params.set('tf',[...activeTFs].join(','));
  if(activeSrcs.size < Object.keys(SRC_LABELS).length) params.set('src',[...activeSrcs].join(','));
  const allStats = ALL_STATUS_FILTER_KEYS;
  if(activeStats.size < allStats.length) params.set('status',[...activeStats].join(','));
  if(activeOnds.size < Object.keys(OND_LABELS).length) params.set('ond',[...activeOnds].join(','));
  const q = document.getElementById('q')?.value||'';
  if(q) params.set('q',q);
  return params;
}
function syncURL(){
  const params = getFilterParams();
  const url = window.location.pathname + (params.toString() ? '?'+params.toString() : '');
  window.history.replaceState(null,'',url);
}
function loadFromURL(){
  const params = new URLSearchParams(window.location.search);
  if(params.has('tf')){ activeTFs.clear(); params.get('tf').split(',').forEach(v=>activeTFs.add(v)); }
  if(params.has('src')){ activeSrcs.clear(); params.get('src').split(',').forEach(v=>activeSrcs.add(v)); }
  if(params.has('status')){ activeStats.clear(); params.get('status').split(',').forEach(v=>activeStats.add(v)); }
  if(params.has('ond')){ activeOnds.clear(); params.get('ond').split(',').forEach(v=>activeOnds.add(v)); }
  if(params.has('q')){ const sq=document.getElementById('q'); if(sq) sq.value=params.get('q'); }
}
function copyFilterLink(){
  const url = window.location.origin + window.location.pathname + '?' + getFilterParams().toString();
  navigator.clipboard.writeText(url).then(()=>{
    const btn = document.getElementById('copyLinkBtn');
    const orig = btn.textContent;
    btn.textContent = '✓ Gekopieerd!';
    setTimeout(()=>btn.textContent=orig,2000);
  });
}

// === FILTER CHIPS INIT ===
// === TOGGLE GROUP (aan/uit per filter group) ===
const GROUP_CONFIG_V2 = {
  tf: {
    set: () => activeTFs,
    keys: () => Object.keys(TF_META),
    onStyle: (k) => { return { bg: TF_META[k].color, color: '#fff', border: TF_META[k].color }; },
    offStyle: () => { return { bg: '', color: '#444', border: '' }; },
    selector: '#tf-chips .chip',
    keyOf: (c, i) => Object.keys(TF_META)[i]
  },
  src: {
    set: () => activeSrcs,
    keys: () => Object.keys(SRC_LABELS),
    onStyle: (k) => { return { bg: SRC_COLORS[k], color: '#fff', border: SRC_COLORS[k] }; },
    offStyle: () => { return { bg: '', color: '#444', border: '' }; },
    selector: '#src-chips .chip',
    keyOf: (c, i) => Object.keys(SRC_LABELS)[i]
  },
  stat: {
    set: () => activeStats,
    keys: () => ALL_STATUS_FILTER_KEYS,
    onStyle: (k) => { const col = k==="⚠ Deadlinerisico" ? "#C00000" : (STATUS_NORM_COLORS[k]||"#555"); return { bg: col, color: k==="⚠ Deadlinerisico" ? '#fff' : statusTextColor(k), border: col }; },
    offStyle: () => { return { bg: '', color: '#444', border: '' }; },
    selector: '#stat-chips .chip',
    keyOf: (c, i) => ALL_STATUS_FILTER_KEYS[i]
  },
  ond: {
    set: () => activeOnds,
    keys: () => Object.keys(OND_LABELS),
    onStyle: () => { return { bg: '#555', color: '#fff', border: '#555' }; },
    offStyle: () => { return { bg: '', color: '#444', border: '#555' }; },
    selector: '#ond-chips .chip',
    keyOf: (c, i) => Object.keys(OND_LABELS)[i]
  }
};

function toggleGroup(groupId) {
  const cfg = GROUP_CONFIG_V2[groupId];
  if (!cfg) return;
  const s = cfg.set();
  const keys = cfg.keys();
  const allOn = keys.every(k => s.has(k));
  const chips = document.querySelectorAll(cfg.selector);
  if (allOn) {
    // Turn all off
    s.clear();
    chips.forEach((c, i) => {
      const k = cfg.keyOf(c, i);
      const st = cfg.offStyle(k);
      c.style.background = st.bg;
      c.style.color = st.color;
      if (st.border !== undefined) c.style.borderColor = st.border;
    });
  } else {
    // Turn all on
    keys.forEach(k => s.add(k));
    chips.forEach((c, i) => {
      const k = cfg.keyOf(c, i);
      const st = cfg.onStyle(k);
      c.style.background = st.bg;
      c.style.color = st.color;
      if (st.border !== undefined) c.style.borderColor = st.border;
    });
  }
  updateToggleBtn(groupId);
  applyFilters();
}

function updateToggleBtn(groupId) {
  const cfg = GROUP_CONFIG_V2[groupId];
  if (!cfg) return;
  const s = cfg.set();
  const keys = cfg.keys();
  const btn = document.getElementById('toggle-' + groupId);
  if (!btn) return;
  const allOn = keys.every(k => s.has(k));
  btn.textContent = allOn ? '↓ uit' : '↑ aan';
}

function updateAllToggleBtns() {
  ['tf','src','stat','ond'].forEach(updateToggleBtn);
}

function buildChips() {
  // TF chips
  const tfEl = document.getElementById('tf-chips');
  for (const [k, m] of Object.entries(TF_META)) {
    const c = document.createElement('span');
    c.className = `chip chip-${k} on`;
    c.textContent = m.short;
    c.style.setProperty('--c', m.color);
    c.setAttribute('role','checkbox');
    c.setAttribute('aria-checked','true');
    c.setAttribute('tabindex','0');
    c.setAttribute('aria-label', m.label);
    c.onkeydown = (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } };
    c.onclick = () => toggleSet(activeTFs, k, c, () => {
      tfEl.querySelectorAll('.chip').forEach((ch,i) => {
        const key = Object.keys(TF_META)[i];
        ch.style.background = activeTFs.has(key) ? TF_META[key].color : '';
        ch.style.borderColor = TF_META[key].color;
        ch.style.color = activeTFs.has(key) ? '#fff' : '#444';
        ch.setAttribute('aria-checked', activeTFs.has(key) ? 'true' : 'false');
      });
      syncURL();
      applyFilters();
    });
    c.style.background = m.color; c.style.color='#fff'; c.style.borderColor=m.color;
    tfEl.appendChild(c);
  }

  // Src chips
  const srcEl = document.getElementById('src-chips');
  for (const [k, label] of Object.entries(SRC_LABELS)) {
    const c = document.createElement('span');
    c.className = 'chip chip-src on';
    c.textContent = label;
    c.style.background = SRC_COLORS[k]; c.style.color='#fff'; c.style.borderColor=SRC_COLORS[k];
    c.setAttribute('role','checkbox');
    c.setAttribute('aria-checked','true');
    c.setAttribute('tabindex','0');
    c.onkeydown = (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } };
    c.onclick = () => {
      activeSrcs.has(k) ? activeSrcs.delete(k) : activeSrcs.add(k);
      c.style.background = activeSrcs.has(k) ? SRC_COLORS[k] : '';
      c.style.color = activeSrcs.has(k) ? '#fff' : '#444';
      c.setAttribute('aria-checked', activeSrcs.has(k) ? 'true' : 'false');
      syncURL();
      applyFilters();
    };
    srcEl.appendChild(c);
  }

  // Stat chips — 6 normalized categories + deadline risk
  const statEl = document.getElementById('stat-chips');
  const NORM_STAT_KEYS = ALL_STATUS_FILTER_KEYS;
  for (const g of NORM_STAT_KEYS) {
    const c = document.createElement('span');
    c.className = 'chip chip-stat on';
    c.textContent = g;
    const gColor = g === "⚠ Deadlinerisico" ? "#C00000" : (STATUS_NORM_COLORS[g] || "#555");
    const gText = g === "⚠ Deadlinerisico" ? '#fff' : statusTextColor(g);
    c.style.background = gColor; c.style.color=gText; c.style.borderColor=gColor;
    c.setAttribute('role','checkbox');
    c.setAttribute('aria-checked','true');
    c.setAttribute('tabindex','0');
    c.onkeydown = (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } };
    c.onclick = () => {
      activeStats.has(g) ? activeStats.delete(g) : activeStats.add(g);
      c.style.background = activeStats.has(g) ? gColor : '';
      c.style.color = activeStats.has(g) ? gText : '#444';
      c.setAttribute('aria-checked', activeStats.has(g) ? 'true' : 'false');
      syncURL();
      applyFilters();
    };
    statEl.appendChild(c);
  }

  // Ond chips
  const ondEl = document.getElementById('ond-chips');
  for (const [k, label] of Object.entries(OND_LABELS)) {
    const c = document.createElement('span');
    c.className = 'chip chip-ond on';
    c.textContent = k === 'AZWA' ? 'AZWA' : k;
    c.title = label;
    c.style.background = '#555'; c.style.color='#fff'; c.style.borderColor='#555';
    c.setAttribute('role','checkbox');
    c.setAttribute('aria-checked','true');
    c.setAttribute('tabindex','0');
    c.onkeydown = (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } };
    c.onclick = () => {
      activeOnds.has(k) ? activeOnds.delete(k) : activeOnds.add(k);
      c.style.background = activeOnds.has(k) ? '#555' : '';
      c.style.color = activeOnds.has(k) ? '#fff' : '#444';
      c.style.borderColor = '#555';
      c.setAttribute('aria-checked', activeOnds.has(k) ? 'true' : 'false');
      syncURL();
      applyFilters();
    };
    ondEl.appendChild(c);
  }
}

function toggleSet(set, k, el, fn) {
  set.has(k) ? set.delete(k) : set.add(k);
  fn();
}

// === FILTER LOGIC ===
function matches(a) {
  const q = document.getElementById('q').value.toLowerCase().trim();
  // Cluster filter: als een cluster actief is, alleen die nummers tonen
  if (activeHlo !== null) {
    if (!a.hlo || !a.hlo.includes(activeHlo)) return false;
  }
  if (activeClusterId !== null) {
    const cl = CLUSTERS.find(c => c.id === activeClusterId);
    if (!cl || !cl.nrs.includes(a.nr)) return false;
  }
  if (!activeTFs.has(a.tf)) return false;
  if (!activeSrcs.has(a.src)) return false;
  // status/deadline risk filter
  if (activeStats.has("⚠ Deadlinerisico") && activeStats.size === 1) {
    if (!isDeadlineRisk(a)) return false;
  } else if (activeStats.has("⚠ Deadlinerisico")) {
    const ns = normStatus(a.status);
    if (!isDeadlineRisk(a) && !activeStats.has(ns)) return false;
  } else {
    const ns = normStatus(a.status);
    if (!activeStats.has(ns)) return false;
  }
  if (!activeOnds.has(a.ond)) return false;
  if (!q) return true;
  return [a.nr, a.t, a.src, a.ond, a.wg, a.trekker, OND_LABELS[a.ond]||"",
          TF_META[a.tf]?.label||""].some(f => String(f).toLowerCase().includes(q));
}

function applyFilters() {
  if (curView === 'deelnemers') { renderDeelnemers(); return; }
  if (curView === 'rapportage' && typeof renderRapportage === 'function') { renderRapportage(); return; }
  if (curView === 'beheer') { renderBeheer(); return; }
  updateAllToggleBtns();
  syncURL();
  const visible = AGRS.filter(matches);
  document.getElementById('result-count').textContent = `${visible.length} van ${AGRS.length} afspraken`;
  if (curView === 'thematafels') renderThematafels(visible);
  else if (curView === 'lijst') renderLijst(visible);
  else if (curView === 'onderdelen') renderOnderdelen(visible);
}

// === VIEW SWITCHER ===
// Afspraakviews delen de linkerzijbalk met filters; beheerviews (deelnemers,
// rapportage) hebben eigen filters en verbergen zijbalk + voortgangsbalken.
const VIEW_CONFIG = {
  thematafels: { btn: 'navT', el: 'viewThematafels' },
  lijst:       { btn: 'navL', el: 'viewLijst' },
  onderdelen:  { btn: 'navO', el: 'viewOnderdelen' },
  deelnemers:  { btn: 'navD', el: 'viewDeelnemers', beheer: true },
  rapportage:  { btn: 'navR', el: 'viewRapportage', beheer: true },
  beheer:      { btn: 'navB', el: 'viewBeheer', beheer: true },
};
function setView(v) {
  if (!VIEW_CONFIG[v]) return;
  curView = v;
  for (const [key, cfg] of Object.entries(VIEW_CONFIG)) {
    const b = document.getElementById(cfg.btn);
    if (b) b.className = 'hnav-btn' + (key === v ? ' on' : '');
    const el = document.getElementById(cfg.el);
    if (el) el.className = key === v ? '' : 'hidden';
  }
  const beheer = !!VIEW_CONFIG[v].beheer;
  document.getElementById('tf-progress-bars').style.display = beheer ? 'none' : '';
  document.body.classList.toggle('view-beheer', beheer);
  applyFilters();
}
