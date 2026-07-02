function validateAGRS(data) {
  const required = ['nr','t','status','tf','wg','kern'];
  data.forEach(d => required.forEach(k => {
    if (!d[k]) console.warn(`Record ${d.nr}: veld '${k}' ontbreekt`);
  }));
}
// === DATA ===

// ═══ AANSPREEKPUNTEN BRANCHES ════════════════════════════════
// Gevuld vanuit Excel-tab "Aanspreekpunten Branches" in v5
// Personen worden ingevuld door elke branche; dashboard laadt automatisch

// ═══ HLO-CLUSTER DATA ════════════════════════════════════════
const HLO_COLORS = {
  'C5':'#DEEBF7','C6':'#FCE4D6','C7':'#E2EFDA','C8':'#FFF2CC',
  'C11':'#FDEBD0','C13':'#EAD1DC','C14':'#F4CCCC','C15':'#D0E4F1','C16':'#E8DAEF'
};
const HLO_TEXT_COLORS = {
  'C5':'#1F4E79','C6':'#833C00','C7':'#375623','C8':'#7F6000',
  'C11':'#833C00','C13':'#4A0020','C14':'#C00000','C15':'#1F4E79','C16':'#4A235A'
};
function hloColor(val) {
  if (!val || val==='—') return '#F2F2F2';
  const first = val.split('/')[0].trim().split(' ')[0];
  return HLO_COLORS[first] || '#F2F2F2';
}
function hloTextColor(val) {
  if (!val || val==='—') return '#666';
  const first = val.split('/')[0].trim().split(' ')[0];
  return HLO_TEXT_COLORS[first] || '#333';
}
let activeHlo = null;


// === CONSTANTS ===
validateAGRS(AGRS);
const STATUS_MAP = {
  "Gestart":                           "Actief",
  "In uitvoering":                     "Actief",
  "In uitwerking":                     "Actief",
  "In opstart":                        "Actief",
  "In voorbereiding":                  "Actief",
  "Concept besproken":                 "Actief",
  "Concept besproken (23 mrt 2026)":   "Actief",
  "In ontwikkeling":                   "Actief",
  "Nader uit te werken":               "Actief",
  "Nader te concretiseren":            "Actief",
  "Op schema":                         "Op schema",
  "Structureel":                       "Op schema",
  "Achter op schema":                  "Aandacht",
  "Nog niet gestart":                  "Niet gestart",
  "Nog te starten":                    "Niet gestart",
  "Geparkeerd":                        "Geparkeerd",
  "Niet geprioriteerd; ongoing":       "Geparkeerd",
  "—":                                 "Onbekend"
};
const STATUS_NORM_COLORS = {
  "Actief":       "#0277BD",
  "Op schema":    "#2E7D32",
  "Aandacht":     "#C00000",
  "Niet gestart": "#888",
  "Geparkeerd":   "#aaa",
  "Onbekend":     "#bbb"
};
function normStatus(raw){ return STATUS_MAP[raw] || "Onbekend"; }
function isDeadlineRisk(a){
  const dl = (a.deadline||"").toLowerCase();
  const riskDl = dl.includes("q1 2026") || dl.includes("q2 2026") || dl.includes("q1") || dl.includes("q2");
  const riskStat = ["Niet gestart","Aandacht"].includes(normStatus(a.status));
  return riskDl && riskStat;
}
const TF_META = {
  T1:{label:"T1 — Medische technologie & digitale zorg",color:"#1565C0",short:"Medtech & DHZ"},
  T2:{label:"T2 — Opschaling Passende Zorg",color:"#2E7D32",short:"Passende Zorg"},
  T3:{label:"T3 — Databeschikbaarheid & AI",color:"#6A1B9A",short:"AI"},
  IZA:{label:"IZA — Overige Afspraken",color:"#86004D",short:"IZA Overig"}
};

const SRC_COLORS = {
  Medtech:"#1565C0", DHZ:"#2E75B6", E2:"#2E7D32", E3:"#558B2F",
  AI:"#6A1B9A", IZA:"#86004D", Overig:"#555"
};

const SRC_LABELS = {
  Medtech:"Medtech", DHZ:"DHZ", E2:"AZWA E2", E3:"AZWA E3",
  AI:"AI", IZA:"IZA Overig", Overig:"Overig"
};

const OND_LABELS = {
  AZWA:"AZWA", A:"A — Passende zorg", B:"B — Regionale samenwerking",
  C:"C — Acute zorg", D:"D — Concentratie & spreiding",
  E:"E — Eerstelijnszorg", F:"F — GGZ & Sociaal domein",
  G:"G — Preventie", H:"H — Arbeidsmarkt", I:"I — Digitalisering",
  J:"J — Contractering", K:"K — Financiën"
};

const STAT_GROUPS = {
  "Afgerond":[/^afgerond$/i,/^structureel$/i,/^niet geprioriteerd; ongoing$/i],
  "Op schema":[/^op schema$/i,/^in uitvoering$/i],
  "Gestart":[/^gestart$/i,/^in voorbereiding$/i,/^in opstart$/i,
              /^concept besproken/i,/^in uitwerking$/i,/^in ontwikkeling$/i],
  "Nog niet gestart":[/^nog niet gestart$/i,/^nog te starten$/i,
                       /^nader te concretiseren$/i,/^nader uit te werken$/i],
  "Aandacht":[/^achter op schema$/i,/^geparkeerd$/i]
};

const STAT_COLORS = {
  "Afgerond":"#2E7D32","Op schema":"#0277BD","Gestart":"#F57C00",
  "Nog niet gestart":"#888","Aandacht":"#C00000","—":"#bbb"
};

function statGroup(status) {
  for (const [g, pats] of Object.entries(STAT_GROUPS))
    if (pats.some(p => p.test(status))) return g;
  return "—";
}

function statColor(status) {
  return STATUS_NORM_COLORS[normStatus(status)] || "#bbb";
}

function tfColor(tf) { return (TF_META[tf]||{color:"#888"}).color; }

// === CLUSTERS ===
const CLUSTERS = [
  {
    id: 1,
    label: "Opschaling Medtech-innovaties",
    status: "In praktijk",
    nrs: ["1.3", "3.5", "3.7"],
    beschrijving: "Schaalbare innovaties, financiering bundelen & richten, en faciliteren & ondersteunen opschaling worden in de praktijk al als één samenhangende aanpak behandeld."
  },
  {
    id: 2,
    label: "Waardebepaling & Hybride Zorg",
    status: "In onderzoek",
    nrs: ["3.6", "DHZ-A", "E2-2"],
    beschrijving: "Verbinding tussen waardebepaling medtech-innovaties, geaccepteerd bewijs voor hybride zorg en de voorselectie/beoordeling van opschalingsstappen passende zorg."
  }
];

// Lookup: welk cluster hoort bij dit afspraaknummer?
function getAgrCluster(nr) {
  return CLUSTERS.find(cl => cl.nrs.includes(nr)) || null;
}

// === STATE ===
let curView = "thematafels";
let selectedNr = null;
let dpHistory = [];
let activeClusterId = null;  // null = geen cluster-filter

const activeTFs = new Set(["T1","T2","T3","IZA"]);
const activeSrcs = new Set(Object.keys(SRC_LABELS));
const activeStats = new Set(["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend","⚠ Deadlinerisico"]);
const activeOnds = new Set(Object.keys(OND_LABELS));

// === URL FILTER STATE ===
function getFilterParams(){
  const params = new URLSearchParams();
  if(activeTFs.size < Object.keys(TF_META).length) params.set('tf',[...activeTFs].join(','));
  if(activeSrcs.size < Object.keys(SRC_LABELS).length) params.set('src',[...activeSrcs].join(','));
  const allStats = ["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend","⚠ Deadlinerisico"];
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
    keys: () => ["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend","⚠ Deadlinerisico"],
    onStyle: (k) => { const col = k==="⚠ Deadlinerisico" ? "#C00000" : (STATUS_NORM_COLORS[k]||"#555"); return { bg: col, color: '#fff', border: col }; },
    offStyle: () => { return { bg: '', color: '#444', border: '' }; },
    selector: '#stat-chips .chip',
    keyOf: (c, i) => ["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend","⚠ Deadlinerisico"][i]
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
  const NORM_STAT_KEYS = ["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend","⚠ Deadlinerisico"];
  for (const g of NORM_STAT_KEYS) {
    const c = document.createElement('span');
    c.className = 'chip chip-stat on';
    c.textContent = g;
    const gColor = g === "⚠ Deadlinerisico" ? "#C00000" : (STATUS_NORM_COLORS[g] || "#555");
    c.style.background = gColor; c.style.color='#fff'; c.style.borderColor=gColor;
    c.setAttribute('role','checkbox');
    c.setAttribute('aria-checked','true');
    c.setAttribute('tabindex','0');
    c.onkeydown = (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); } };
    c.onclick = () => {
      activeStats.has(g) ? activeStats.delete(g) : activeStats.add(g);
      c.style.background = activeStats.has(g) ? gColor : '';
      c.style.color = activeStats.has(g) ? '#fff' : '#444';
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
  updateAllToggleBtns();
  syncURL();
  const visible = AGRS.filter(matches);
  document.getElementById('result-count').textContent = `${visible.length} van ${AGRS.length} afspraken`;
  if (curView === 'thematafels') renderThematafels(visible);
  else if (curView === 'lijst') renderLijst(visible);
  else if (curView === 'onderdelen') renderOnderdelen(visible);
}

// === VIEW SWITCHER ===
function setView(v) {
  curView = v;
  ['T','L','O'].forEach(x => { const b=document.getElementById('nav'+x); if(b) b.className='hnav-btn'; });
  const map={thematafels:'T',lijst:'L',onderdelen:'O'};
  const nb=document.getElementById('nav'+map[v]); if(nb) nb.className='hnav-btn on';
  document.getElementById('viewThematafels').className = v==='thematafels' ? '' : 'hidden';
  document.getElementById('viewLijst').className = v==='lijst' ? '' : 'hidden';
  document.getElementById('viewOnderdelen').className = v==='onderdelen' ? '' : 'hidden';
  applyFilters();
}

// === RENDER: THEMATAFELS ===
function renderThematafels(visible) {
  const el = document.getElementById('viewThematafels');
  el.innerHTML = '';
  const visNrs = new Set(visible.map(a => a.nr));

  for (const [tfKey, tfMeta] of Object.entries(TF_META)) {
    const tfAgrs = visible.filter(a => a.tf === tfKey);
    if (!tfAgrs.length) continue;

    // Group by werkgroep
    const wgMap = {};
    for (const a of tfAgrs) {
      const wg = a.wg || 'Overig';
      if (!wgMap[wg]) wgMap[wg] = [];
      wgMap[wg].push(a);
    }

    const sec = document.createElement('div');
    sec.className = 'tf-section';
    sec.innerHTML = `<div class="tf-hdr" style="background:${tfMeta.color}">
      <h2>${tfMeta.label}</h2>
      <span class="tf-badge">${tfAgrs.length} afspraken</span>
    </div>`;

    const body = document.createElement('div');
    body.className = 'tf-body';

    for (const [wg, wgAgrs] of Object.entries(wgMap)) {
      const block = document.createElement('div');
      block.className = 'wg-block';
      const wgShort = wg.length > 45 ? wg.substring(0,45)+'…' : wg;
      block.innerHTML = `<div class="wg-hdr" style="background:${tfMeta.color}cc">
        <span>${esc(wgShort)}</span>
        <span style="margin-left:auto;font-size:10px;opacity:.85">${wgAgrs.length}</span>
      </div><div class="wg-body"></div>`;
      const wb = block.querySelector('.wg-body');
      for (const a of wgAgrs) {
        wb.appendChild(makeAgrTag(a, tfMeta.color));
      }
      body.appendChild(block);
    }
    sec.appendChild(body);
    el.appendChild(sec);
  }
  if (!el.innerHTML) el.innerHTML = '<div class="empty">Geen afspraken gevonden voor de geselecteerde filters.</div>';
}

// === RENDER: LIJST ===
function renderLijst(visible) {
  const tbody = document.getElementById('listBody');
  tbody.innerHTML = '';
  if (!visible.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Geen afspraken gevonden.</td></tr>';
    return;
  }
  for (const a of visible) {
    const tr = document.createElement('tr');
    if (a.nr === selectedNr) tr.className = 'selected';
    const sc = statColor(a.status);
    const tfc = tfColor(a.tf);
    const srcc = SRC_COLORS[a.src] || '#555';
    const wgShort = a.wg.length > 40 ? a.wg.substring(0,40)+'…' : a.wg;
    tr.innerHTML = `
      <td class="nr-cell"><span style="background:${srcc};color:#fff;padding:2px 5px;border-radius:3px;font-size:10px">${esc(a.nr)}</span></td>
      <td>${esc(a.t)}</td>
      <td class="tf-cell"><span style="background:${tfc}">${TF_META[a.tf]?.short||a.tf}</span></td>
      <td class="src-cell"><span style="background:${srcc}">${esc(SRC_LABELS[a.src]||a.src)}</span></td>
      <td style="color:#555;font-size:11px">${esc(wgShort)}</td>
      <td><span class="status-pill" style="background:${sc}">${esc(a.status)}</span></td>
      <td style="color:#555;font-size:11px;white-space:nowrap">${esc(a.deadline)}</td>`;
    tr.onclick = () => showDetail(a.nr);
    tbody.appendChild(tr);
  }
}

// === RENDER: ONDERDELEN ===
function renderOnderdelen(visible) {
  const el = document.getElementById('viewOnderdelen');
  el.innerHTML = '';

  const ondMap = {};
  for (const a of visible) {
    const o = a.ond;
    if (!ondMap[o]) ondMap[o] = [];
    ondMap[o].push(a);
  }

  // Order: AZWA first, then A-K
  const orderedOnds = ['AZWA', ...Object.keys(OND_LABELS).filter(k => k !== 'AZWA')];

  for (const ond of orderedOnds) {
    const ondAgrs = ondMap[ond];
    if (!ondAgrs || !ondAgrs.length) continue;

    const sec = document.createElement('div');
    sec.className = 'ond-section';
    sec.innerHTML = `<div class="ond-hdr">
      <h3>${esc(OND_LABELS[ond]||ond)}</h3>
      <span class="ond-badge">${ondAgrs.length}</span>
    </div>`;

    const body = document.createElement('div');
    body.className = 'ond-body';
    for (const a of ondAgrs) {
      const tfc = tfColor(a.tf);
      body.appendChild(makeAgrTag(a, tfc));
    }
    sec.appendChild(body);
    el.appendChild(sec);
  }
  if (!el.innerHTML) el.innerHTML = '<div class="empty">Geen afspraken gevonden.</div>';
}

// === AGR TAG ===
function makeAgrTag(a, color) {
  const div = document.createElement('div');
  div.className = 'agr-tag' + (a.nr === selectedNr ? ' selected' : '');
  div.id = 'tag-' + a.nr.replace(/[^a-zA-Z0-9]/g,'_');
  const sc = statColor(a.status);
  div.innerHTML = `<span class="agr-nr" style="background:${color}">${esc(a.nr)}</span>
    <div>
      <div class="agr-titel">${esc(a.t)}</div>
      <div class="agr-meta">
        <span class="status-pill" style="background:${sc}">${esc(a.status)}</span>
        ${a.deadline ? `<span style="font-size:10px;color:#888">${esc(a.deadline)}</span>` : ''}
      </div>
    </div>`;
  div.setAttribute('role','button');
  div.setAttribute('tabindex','0');
  div.setAttribute('aria-label', a.nr + ': ' + a.t);
  div.onkeydown = (e) => { if(e.key==='Enter'){ e.preventDefault(); showDetail(a.nr); } };
  div.onclick = () => showDetail(a.nr);
  // Add deadline risk badge if applicable
  if (isDeadlineRisk(a)) {
    const badge = document.createElement('span');
    badge.title = 'Deadlinerisico: deadline nabij en status niet gestart/aandacht';
    badge.style.cssText = 'font-size:10px;position:absolute;top:2px;right:4px;cursor:default';
    badge.textContent = '⚠';
    div.style.position = 'relative';
    div.appendChild(badge);
  }
  return div;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// === DETAIL PANEL ===
function showDetail(nr) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  if (selectedNr && selectedNr !== nr) dpHistory.push(selectedNr);
  selectedNr = nr;

  document.getElementById('dpNr').textContent = a.nr;
  document.getElementById('dpTitel').textContent = a.t;

  // Nav bar
  const nav = document.getElementById('dpNav');
  nav.innerHTML = dpHistory.length
    ? `<button class="dp-nav-btn" onclick="navBack()">← Terug</button>` : '';

  // Body
  const sc = statColor(a.status);
  const tfc = tfColor(a.tf);
  const srcc = SRC_COLORS[a.src] || '#555';

  let html = `<div data-dpsec="context">
    <div class="dp-field">
      <div class="dp-label">Bron</div>
      <div><span class="dp-src-badge" style="background:${srcc}">${esc(SRC_LABELS[a.src]||a.src)}</span></div>
    </div>
    <div class="dp-field">
      <div class="dp-label">Thematafel</div>
      <div><span class="dp-tf-badge" style="background:${tfc}">${esc(TF_META[a.tf]?.short||a.tf)}</span></div>
    </div>
    <div class="dp-field">
      <div class="dp-label">Werkgroep</div>
      <div class="dp-value">${esc(a.wg)}</div>
    </div>
  </div>`;

  if (a.hlo && a.hlo !== '—') {
    html += '<div data-dpsec="hlo"><div class="dp-field"><div class="dp-label">HLO-cluster (samenhang)</div>'
      + '<div class="dp-hlo-row">'
      + a.hlo.split('/').map(function(h) {
          var hv = h.trim(); var bg = hloColor(hv); var tc = hloTextColor(hv);
          return '<span class="hlo-badge" style="background:' + bg + ';color:' + tc + '">' + esc(hv) + '</span>';
        }).join('')
      + '</div></div></div>';
  }

  if (a.kern && a.kern !== '—') html += `
    <div data-dpsec="kern"><div class="dp-field">
      <div class="dp-label">Tekst (kern)</div>
      <div class="dp-value" style="font-size:11px;color:#444">${esc(a.kern)}</div>
    </div></div>`;

  html += `<div data-dpsec="status"><div class="dp-divider"></div>
    <div class="dp-field">
      <div class="dp-label">Status</div>
      <div><span class="status-pill" style="background:${sc}">${esc(a.status)}</span></div>
    </div>`;

  if (a.vg && a.vg !== '—') html += `
    <div class="dp-field">
      <div class="dp-label">Voortgang / Toelichting</div>
      <div class="dp-value" style="font-size:11px;color:#444">${esc(a.vg)}</div>
    </div>`;
  html += `</div>`;

  html += `<div data-dpsec="meta"><div class="dp-field">
      <div class="dp-label">Trekker</div>
      <div class="dp-value">${esc(a.trekker||'—')}</div>
    </div>
    <div class="dp-field">
      <div class="dp-label">Deadline</div>
      <div class="dp-value">${esc(a.deadline||'—')}</div>
    </div>
    <div class="dp-field">
      <div class="dp-label">Prioritering</div>
      <div class="dp-value">${esc(a.prio||'—')}</div>
    </div>
    <div class="dp-field">
      <div class="dp-label">IZA Onderdeel</div>
      <div class="dp-value">${esc(OND_LABELS[a.ond]||a.ond)}</div>
    </div></div>`;

  let samHtml = '';
  if (a.samenhang && a.samenhang !== '—') samHtml += `
    <div class="dp-field">
      <div class="dp-label">Samenhang</div>
      <div class="dp-value" style="font-size:11px">${esc(a.samenhang)}</div>
    </div>`;
  if (samHtml) html += `<div data-dpsec="samenhang"><div class="dp-divider"></div>${samHtml}</div>`;

  let dbHtml = '';
  if (a.doorbraak && a.doorbraak !== '—') dbHtml += `
    <div class="dp-field">
      <div class="dp-label">Doorbraakmiddel</div>
      <div class="dp-value" style="font-size:11px">${esc(a.doorbraak)}</div>
    </div>`;
  if (a.mib && a.mib !== '—' && !a.mib.startsWith('— Geen')) dbHtml += `
    <div class="dp-field">
      <div class="dp-label">MIB Connectie</div>
      <div class="dp-value" style="font-size:11px">${esc(a.mib)}</div>
    </div>`;
  if (a.ezk && a.ezk !== '—' && !a.ezk.startsWith('— Geen')) dbHtml += `
    <div class="dp-field">
      <div class="dp-label">EZK Industriebeleid</div>
      <div class="dp-value" style="font-size:11px">${esc(a.ezk)}</div>
    </div>`;
  if (dbHtml) html += `<div data-dpsec="doorbraak">${dbHtml}</div>`;

  if (a.bron && a.bron !== '—') html += `
    <div data-dpsec="brondoc"><div class="dp-divider"></div>
    <div class="dp-field">
      <div class="dp-label">Brondocument</div>
      <div class="dp-value" style="font-size:11px;color:#555">${esc(a.bron)}</div>
    </div></div>`;

  // === VOORSTEL CLUSTERING ===
  const myCl = getAgrCluster(nr);
  if (myCl) {
    const badgeClass = myCl.status === 'In praktijk' ? 'cl-badge-praktijk' : 'cl-badge-onderzoek';
    html += `<div data-dpsec="clustering"><div class="dp-divider"></div>
      <div class="dp-field">
        <div class="dp-label" style="display:flex;align-items:center;gap:6px">
          Voorstel clustering
          <span class="cl-badge ${badgeClass}" style="font-size:9px;padding:2px 6px;border-radius:8px">${esc(myCl.status)}</span>
        </div>
        <div style="font-size:11px;color:#666;margin:3px 0 6px;font-style:italic">${esc(myCl.label)}</div>
        <div class="dp-cl-row">`;
    for (const cnr of myCl.nrs.filter(x => x !== nr)) {
      const ca = AGRS.find(x => x.nr === cnr);
      if (ca) {
        const cc = SRC_COLORS[ca.src]||'#555';
        html += `<div class="dp-cl-btn" onclick="showDetail('${cnr.replace(/'/g,"\'")}')">
          <span class="dp-cl-nr" style="background:${cc}">${esc(cnr)}</span>
          <span class="dp-cl-t">${esc(ca.t)}</span>
        </div>`;
      }
    }
    html += `</div>
        <div style="font-size:10px;color:#999;margin-top:4px;padding-top:4px;border-top:1px dashed #e8d0e0">${esc(myCl.beschrijving)}</div>
      </div></div>`;
  }

  // === AANSPREEKPUNTEN ===
  const myContacts = getContactsForAgr(a);
  if (myContacts.length) {
    html += `<div data-dpsec="contacts"><div class="dp-divider"></div>
      <div class="dp-field">
        <div class="dp-label" style="display:flex;align-items:center;gap:5px">
          Aanspreekpunten Branches
          <span style="font-size:9px;background:#f5eaf2;color:var(--primary);border:1px solid #d4a8c8;border-radius:8px;padding:1px 6px;font-weight:400">per werkgroep</span>
        </div>
        ${renderContacts(myContacts)}
      </div></div>`;
  }

  // Related in same werkgroep
  const related = AGRS.filter(x => x.nr !== nr && x.wg === a.wg && x.wg);
  const clNrs = myCl ? myCl.nrs : [];
  const relFiltered = related.filter(x => !clNrs.includes(x.nr));
  if (relFiltered.length) {
    html += `<div data-dpsec="werkgroep"><div class="dp-divider"></div>
      <div class="dp-label" style="padding:0 0 6px">Overige in werkgroep</div>`;
    for (const r of relFiltered.slice(0,6)) {
      const rc = SRC_COLORS[r.src]||'#555';
      html += `<div class="related-tag" onclick="showDetail('${r.nr.replace(/'/g,"\'")}')">
        <span class="related-nr" style="background:${rc}">${esc(r.nr)}</span>
        <span class="related-t">${esc(r.t)}</span>
      </div>`;
    }
    html += `</div>`;
  }

  document.getElementById('dpBody').innerHTML = html;
  document.getElementById('detailPanel').classList.add('open');

  // Highlight selected tag
  document.querySelectorAll('.agr-tag.selected, tr.selected').forEach(el => {
    el.classList.remove('selected');
  });
  const tag = document.getElementById('tag-' + nr.replace(/[^a-zA-Z0-9]/g,'_'));
  if (tag) tag.classList.add('selected');
  // Also highlight list row
  document.querySelectorAll('#listBody tr').forEach(tr => {
    const cell = tr.querySelector('.nr-cell span');
    if (cell && cell.textContent === nr) tr.classList.add('selected');
  });
}

function navBack() {
  if (dpHistory.length) showDetail(dpHistory.pop());
}

function closeDetail() {
  selectedNr = null;
  dpHistory = [];
  document.getElementById('detailPanel').classList.remove('open');
  document.querySelectorAll('.agr-tag.selected, tr.selected').forEach(el => el.classList.remove('selected'));
}

// === KEYBOARD ===
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDetail();
});

// === RENDER: CLUSTERING SIDEBAR ===
function renderClusterSidebar() {
  const el = document.getElementById('cl-sidebar');
  el.innerHTML = '';
  for (const cl of CLUSTERS) {
    const card = document.createElement('div');
    card.className = 'cl-card' + (activeClusterId === cl.id ? ' active' : '');
    card.id = 'cl-card-' + cl.id;

    const badgeClass = cl.status === 'In praktijk' ? 'cl-badge-praktijk' : 'cl-badge-onderzoek';
    card.innerHTML = `
      <div class="cl-card-hdr">
        <span class="cl-name">Cluster ${cl.id}: ${esc(cl.label)}</span>
        <span class="cl-badge ${badgeClass}">${esc(cl.status)}</span>
      </div>
      <div class="cl-nrs">${cl.nrs.map(nr => {
        const a = AGRS.find(x => x.nr === nr);
        const c = a ? (SRC_COLORS[a.src]||'#555') : '#888';
        return `<span class="cl-nr-btn" style="background:${c}" onclick="event.stopPropagation();showDetail('${nr.replace(/'/g,"\\'")}')" title="${esc(a?a.t:'')}">${esc(nr)}</span>`;
      }).join('')}</div>`;

    card.addEventListener('click', () => toggleClusterFilter(cl.id));
    el.appendChild(card);
  }
}

function toggleClusterFilter(id) {
  if (activeClusterId === id) {
    // Deactivate
    activeClusterId = null;
  } else {
    activeClusterId = id;
  }
  renderClusterSidebar();
  applyFilters();
}


// ═══ CONTACT HELPERS ═════════════════════════════════════════
function getContactsForAgr(a) {
  const wg = ((a.wg||'').split('\n')[0]).toLowerCase().trim();
  const tf = (a.tf_label||'').toLowerCase();
  const ids = new Set();
  // werkgroep-niveau
  if (wg.includes('medische technologie')) ids.add('WG_MEDTECH');
  if (wg.includes('digitale en hybride') || wg.includes('digitale & hybride')) ids.add('WG_DHZ');
  if (wg.includes('realisatie ai') || wg.includes('ai in de zorg')) ids.add('TF_DAI');
  // thematafel-niveau
  if (tf.includes('medische technologie')) ids.add('BO_MEDTECH');
  if (tf.includes('opschaling passende zorg')) ids.add('TF_OPSCHALING');
  if (tf.includes('databeschikbaarheid') || wg.includes('realisatie ai') || wg.includes('ai in de zorg')) ids.add('TF_DAI');
  if (tf.includes('arbeidsmarkt')) ids.add('TF_ARBEIDSMARKT');
  if (tf.includes('eerstelijnszorg') || tf.includes('1e lijn')) ids.add('TF_1LIJN');
  if (tf.includes('acute zorg') || tf.includes('samenwerking acute') || tf.includes('concentratie en spreiding')) ids.add('TF_ACUTE');
  // fallback op src
  const src = (a.src||'').toLowerCase();
  if (ids.size===0 && src.includes('medtech')) ids.add('WG_MEDTECH');
  if (ids.size===0 && (src.includes('dhz')||src.includes('digitale'))) ids.add('WG_DHZ');
  if (ids.size===0 && src.includes('ai')) ids.add('TF_DAI');
  return [...ids].map(id=>CONTACTS.find(c=>c.id===id)).filter(Boolean);
}

function getContactsBySrc(src) {
  src = (src||'').toLowerCase();
  const ids = [];
  if (src.includes('medtech'))                                ids.push('WG_MEDTECH','BO_MEDTECH');
  else if (src.includes('dhz')||src.includes('digitale'))    ids.push('WG_DHZ','BO_MEDTECH');
  else if (src.includes('ai'))                               ids.push('TF_DAI');
  return ids.map(id=>CONTACTS.find(c=>c.id===id)).filter(Boolean);
}

function renderContacts(groups) {
  if (!groups.length) return '';
  let allEmails = [];
  let h = '<div class="dp-contacts">';
  for (const cg of groups) {
    h += '<div class="dp-contact-group">';
    h += `<div class="dp-contact-group-label">${esc(cg.label)}${cg.toel?`<span class="dp-contact-toel"> — ${esc(cg.toel)}</span>`:''}</div>`;
    if (!cg.personen.length) {
      h += '<div class="dp-contact-empty">Nog niet ingevuld — branches vullen contactpersoon in</div>';
    } else {
      for (const p of cg.personen) {
        if (p.email) allEmails.push(p.email);
        h += `<div class="dp-contact-person">`;
        if (p.branche) h += `<span class="dp-contact-branche">${esc(p.branche)}</span>`;
        h += `<span class="dp-contact-naam">${esc(p.naam||'—')}</span>`;
        if (p.email) h += `<span class="dp-contact-email" onclick="cpEmail(event,'${p.email.replace(/'/g,"\'")}')">✉ ${esc(p.email)}</span>`;
        h += '</div>';
      }
    }
    h += '</div>';
  }
  if (allEmails.length) {
    const ej = JSON.stringify(allEmails);
    h += `<button class="dp-copy-btn" onclick="cpAllEmails(event,${ej})">📋 Kopieer alle mailadressen (${allEmails.length})</button>`;
  }
  h += '</div>';
  return h;
}

function cpEmail(e, email) {
  e.stopPropagation();
  const el = e.currentTarget;
  navigator.clipboard.writeText(email).then(() => {
    const orig = el.textContent;
    el.textContent = '✓ gekopieerd';
    el.style.color = '#219382';
    setTimeout(()=>{ el.textContent=orig; el.style.color=''; }, 1800);
  }).catch(()=>{ prompt('Kopieer dit mailadres:', email); });
}

function cpAllEmails(e, emails) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const text = emails.join('; ');
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = `✓ ${emails.length} mailadressen gekopieerd!`;
    btn.style.cssText = 'background:#d4f0e8;border-color:#219382;color:#155724;width:100%;padding:5px 8px;border:1px solid;border-radius:4px;font-size:11px;cursor:pointer;text-align:center;transition:all .15s';
    setTimeout(()=>{ btn.textContent=orig; btn.style.cssText=''; }, 2000);
  }).catch(()=>{ prompt('Kopieer deze mailadressen:', text); });
}


// ═══ HLO SIDEBAR ════════════════════════════════════════════
function renderHloSidebar() {
  const el = document.getElementById('hlo-sidebar');
  if (!el) return;
  // Verzamel unieke HLO-waarden (gesplitst op /)
  const allVals = new Set();
  AGRS.forEach(a => {
    if (a.hlo && a.hlo !== '—') {
      a.hlo.split('/').forEach(h => allVals.add(h.trim()));
    }
  });
  const vals = [...allVals].sort();
  el.innerHTML = '';
  // Reset knop
  if (activeHlo !== null) {
    const rst = document.createElement('div');
    rst.className = 'hlo-chip active';
    rst.style.cssText = 'background:#f5eaf2;color:var(--primary);border-color:var(--primary);font-size:10px;padding:2px 8px;margin-bottom:4px;display:inline-block;cursor:pointer';
    rst.textContent = '✕ ' + activeHlo;
    rst.onclick = () => { activeHlo = null; renderHloSidebar(); applyFilters(); };
    el.appendChild(rst);
  }
  vals.forEach(val => {
    const cnt = AGRS.filter(a => a.hlo && a.hlo.includes(val)).length;
    const chip = document.createElement('div');
    chip.className = 'hlo-chip' + (activeHlo === val ? ' active' : '');
    const bg = hloColor(val); const tc = hloTextColor(val);
    chip.style.cssText = `background:${bg};color:${tc};font-size:10px;padding:2px 8px;border-radius:3px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border:1px solid transparent`;
    if (activeHlo === val) chip.style.border = '2px solid ' + tc;
    chip.innerHTML = `<span>${esc(val)}</span><span style="opacity:.6;font-size:9px;margin-left:4px">${cnt}</span>`;
    chip.onclick = () => { activeHlo = activeHlo === val ? null : val; renderHloSidebar(); applyFilters(); };
    el.appendChild(chip);
  });
}

// === PROGRESS BARS ===
function renderProgressBars() {
  const el = document.getElementById('tf-progress-bars');
  if (!el) return;
  const NORM_CATS = ["Actief","Op schema","Aandacht","Niet gestart","Geparkeerd","Onbekend"];
  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px">';
  for (const [tfKey, tfMeta] of Object.entries(TF_META)) {
    const tfAgrs = AGRS.filter(a => a.tf === tfKey);
    if (!tfAgrs.length) continue;
    const counts = {};
    NORM_CATS.forEach(c => counts[c] = 0);
    tfAgrs.forEach(a => { const ns = normStatus(a.status); counts[ns] = (counts[ns]||0)+1; });
    const total = tfAgrs.length;
    const onTrack = (counts["Actief"]||0) + (counts["Op schema"]||0);
    const pct = total ? Math.round(onTrack/total*100) : 0;
    let barSegs = NORM_CATS.map(cat => {
      const cnt = counts[cat]||0;
      if (!cnt) return '';
      const w = (cnt/total*100).toFixed(1);
      return `<div title="${cat}: ${cnt}" style="width:${w}%;background:${STATUS_NORM_COLORS[cat]};height:100%;display:inline-block;min-width:2px"></div>`;
    }).join('');
    html += `<div style="flex:1;min-width:180px;background:#fff;border-radius:4px;border:1px solid #ddd;padding:6px 8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:10px;font-weight:700;color:${tfMeta.color}">${esc(tfMeta.short)}</span>
        <span style="font-size:10px;color:#888">${onTrack}/${total} (${pct}% actief/schema)</span>
      </div>
      <div style="height:8px;border-radius:4px;overflow:hidden;background:#eee;display:flex">${barSegs}</div>
    </div>`;
  }
  html += '</div>';
  el.innerHTML = html;
}

// === INIT ===

// === DP VISIBILITY SETTINGS ===
const DP_SEC_LABELS_V2 = {
  context:    "Bron / Thematafel / Werkgroep",
  hlo:        "HLO-cluster",
  kern:       "Tekst (kern)",
  status:     "Status & Voortgang",
  meta:       "Trekker / Deadline / Prioritering / Onderdeel",
  samenhang:  "Samenhang",
  doorbraak:  "Doorbraakmiddel / MIB / EZK",
  brondoc:    "Brondocument",
  clustering: "Voorstel clustering",
  contacts:   "Aanspreekpunten",
  werkgroep:  "Overige in werkgroep"
};
let dpVis = {};
function initDpVis() {
  const saved = localStorage.getItem('dpVis_v2');
  const defaults = Object.fromEntries(Object.keys(DP_SEC_LABELS_V2).map(k => [k, true]));
  dpVis = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}
function saveDpVis() {
  localStorage.setItem('dpVis_v2', JSON.stringify(dpVis));
}
function applyDpVis() {
  Object.keys(DP_SEC_LABELS_V2).forEach(k => {
    document.querySelectorAll('[data-dpsec="' + k + '"]').forEach(el => {
      el.style.display = dpVis[k] ? '' : 'none';
    });
  });
}
function buildSettingsPanel() {
  const panel = document.getElementById('dpSettingsPanel');
  let html = '<div class="dps-header"><span>&#9881; Detailkolom</span><button class="dps-close" onclick="closeDpSettings()">&#x2715;</button></div>';
  html += '<div class="dps-subtitle">Toon/verberg secties</div>';
  for (const [k, label] of Object.entries(DP_SEC_LABELS_V2)) {
    const checked = dpVis[k] ? 'checked' : '';
    html += `<label class="dps-row"><input type="checkbox" ${checked} onchange="setDpSec('${k}', this.checked)"> ${label}</label>`;
  }
  panel.innerHTML = html;
}
function setDpSec(key, val) {
  dpVis[key] = val;
  saveDpVis();
  applyDpVis();
}
function toggleDpSettings() {
  const p = document.getElementById('dpSettingsPanel');
  if (p.style.display === 'none' || !p.style.display) {
    buildSettingsPanel();
    p.style.display = 'block';
  } else {
    p.style.display = 'none';
  }
}
function closeDpSettings() {
  document.getElementById('dpSettingsPanel').style.display = 'none';
}

function toggleSidebar(){
  const sb = document.querySelector('.sidebar-left');
  const btn = document.getElementById('sbToggleBtn');
  const collapsed = sb.classList.toggle('collapsed');
  btn.innerHTML = collapsed ? '&#9654;' : '&#9776;';
  btn.title = collapsed ? 'Sidebar tonen' : 'Sidebar verbergen';
  try { localStorage.setItem('sbCollapsed_v3', collapsed ? '1' : '0'); } catch(e){}
}

loadFromURL();
buildChips();
updateAllToggleBtns();
initDpVis();
renderClusterSidebar();
renderHloSidebar();
renderProgressBars();
applyFilters();
try { if(localStorage.getItem('sbCollapsed_v3')==='1') toggleSidebar(); } catch(e){}
