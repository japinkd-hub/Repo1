// Datalaag. Het object DATA (standaarddata, schemaVersion 1) wordt door
// build/build.mjs vóór dit bestand geïnjecteerd vanuit src/data/dashboard-data.json.
// De werkkopie (DB) leeft in localStorage; delen/back-uppen gaat via JSON-export/-import.
const LS_KEY = 'izaAzwaDashboardData_v1';
let DB = null;
let AGRS = null;      // verwijzing naar DB.afspraken (bestaande views gebruiken deze naam)
let CONTACTS = null;  // gremia-subset van DB.werkgroepen (aanspreekpunten in detailpaneel)

function valideerDB(d) {
  const fouten = [];
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['Geen geldig data-object'];
  if (d.schemaVersion !== 1) fouten.push(`schemaVersion moet 1 zijn (gevonden: ${d.schemaVersion ?? 'geen'})`);
  for (const k of ['afspraken', 'voortgang', 'werkgroepen', 'personen'])
    if (!Array.isArray(d[k])) fouten.push(`veld '${k}' ontbreekt of is geen lijst`);
  if (!d.referentie || !Array.isArray(d.referentie.azwaPartijen) || !Array.isArray(d.referentie.regioTafels))
    fouten.push("veld 'referentie' (azwaPartijen/regioTafels) ontbreekt of is onvolledig");
  if (fouten.length) return fouten;

  const wgIds = new Set(d.werkgroepen.map(w => w.id));
  const nrs = new Set(d.afspraken.map(a => a.nr));
  d.afspraken.forEach(a => {
    ['nr', 't', 'status', 'tf', 'wg', 'kern'].forEach(k => { if (!a[k]) fouten.push(`Afspraak ${a.nr || '?'}: veld '${k}' ontbreekt`); });
    if (a.werkgroepId && !wgIds.has(a.werkgroepId)) fouten.push(`Afspraak ${a.nr}: onbekende werkgroepId '${a.werkgroepId}'`);
  });
  d.werkgroepen.forEach(w => {
    if (!w.id || !w.naam) fouten.push(`Werkgroep zonder id of naam: ${JSON.stringify(w).slice(0, 60)}`);
    if (w.parentId && !wgIds.has(w.parentId)) fouten.push(`Werkgroep ${w.id}: onbekende parentId '${w.parentId}'`);
  });
  d.voortgang.forEach(v => {
    if (!v.afspraakNr || !nrs.has(v.afspraakNr)) fouten.push(`Voortgangsrecord ${v.id || '?'}: onbekend afspraakNr '${v.afspraakNr}'`);
    if (!v.datum || !v.status) fouten.push(`Voortgangsrecord ${v.id || '?'}: datum of status ontbreekt`);
  });
  d.personen.forEach(p => {
    if (!p.id || !p.naam) fouten.push(`Persoon zonder id of naam: ${JSON.stringify(p).slice(0, 60)}`);
    (p.lidmaatschappen || []).forEach(l => {
      if (!wgIds.has(l.werkgroepId)) fouten.push(`Persoon ${p.naam}: onbekende werkgroepId '${l.werkgroepId}' in lidmaatschap`);
    });
  });
  return fouten;
}

function setDB(d) {
  DB = d;
  AGRS = DB.afspraken;
  CONTACTS = DB.werkgroepen.filter(w => w.gremium);
}

function laadDB() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const fouten = valideerDB(d);
      if (!fouten.length) { setDB(d); return; }
      console.warn('Lokale data ongeldig, standaarddata geladen:', fouten);
    }
  } catch (e) { console.warn('Lokale data niet leesbaar, standaarddata geladen:', e); }
  setDB(JSON.parse(JSON.stringify(DATA)));
}

function bewaarDB() {
  DB.laatstGewijzigd = vandaag();
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
  catch (e) { console.warn('Opslaan in browser mislukt:', e); alert('Let op: lokaal opslaan lukt niet. Exporteer je data om wijzigingen te bewaren.'); }
  updateDataStatus();
}

function vandaag() { return new Date().toISOString().slice(0, 10); }

function nieuwId(prefix, lijst) {
  let n = lijst.length + 1;
  const bestaand = new Set(lijst.map(x => x.id));
  while (bestaand.has(`${prefix}-${String(n).padStart(4, '0')}`)) n++;
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

// ── Werkgroep-helpers ──
function werkgroep(id) { return DB.werkgroepen.find(w => w.id === id) || null; }
function werkgroepNaam(id) {
  const w = werkgroep(id);
  if (!w) return id || '—';
  return w.parentId ? `${werkgroep(w.parentId)?.naam || w.parentId} — ${w.naam}` : w.naam;
}
function personenVoorWerkgroep(wgId) {
  return DB.personen.filter(p => (p.lidmaatschappen || []).some(l => l.werkgroepId === wgId));
}

// ── Export / import / herstel ──
function exporteerDB() {
  const blob = new Blob([JSON.stringify(DB, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `iza-azwa-dashboard-data_${vandaag()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importeerDB(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let d;
    try { d = JSON.parse(reader.result); }
    catch (e) { alert('Importeren mislukt: het bestand is geen geldige JSON.'); return; }
    const fouten = valideerDB(d);
    if (fouten.length) {
      alert('Importeren mislukt, het bestand voldoet niet aan het datamodel:\n\n• ' + fouten.slice(0, 12).join('\n• ') + (fouten.length > 12 ? `\n… en ${fouten.length - 12} meer` : ''));
      return;
    }
    setDB(d);
    bewaarDB();
    herrenderAlles();
    alert(`Data geïmporteerd: ${d.afspraken.length} afspraken, ${d.personen.length} deelnemers, ${d.voortgang.length} voortgangsrecords.`);
  };
  reader.readAsText(file);
}

function herstelDB() {
  if (!confirm('Alle lokale wijzigingen wissen en terug naar de meegeleverde data? Exporteer eerst als je je wijzigingen wilt bewaren.')) return;
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* niets */ }
  setDB(JSON.parse(JSON.stringify(DATA)));
  updateDataStatus();
  herrenderAlles();
}

function updateDataStatus() {
  const el = document.getElementById('data-status');
  if (!el) return;
  let lokaal = false;
  try { lokaal = !!localStorage.getItem(LS_KEY); } catch (e) { /* niets */ }
  el.textContent = `Data: ${DB.laatstGewijzigd}${lokaal ? ' (lokaal bewerkt)' : ''}`;
  el.title = lokaal
    ? 'Er staan lokale wijzigingen in deze browser. Exporteer de data om ze te delen of te bewaren.'
    : 'Meegeleverde data; nog geen lokale wijzigingen.';
}

function herrenderAlles() {
  renderClusterSidebar();
  renderHloSidebar();
  renderProgressBars();
  if (selectedNr && !AGRS.some(a => a.nr === selectedNr)) closeDetail();
  else if (selectedNr) showDetail(selectedNr);
  applyFilters();
}

laadDB();
