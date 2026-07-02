// Instellingen detailpaneel + sidebar-toggle
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
