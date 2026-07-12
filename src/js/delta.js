// Aanleveringen (v1.1): deelnemers delen hun eigen wijzigingen als klein
// "aanleverbestand" (delta-export); de beheerder voegt meerdere aanleveringen
// in één keer samen. Samenvoegen is idempotent: dezelfde aanlevering twee keer
// verwerken verandert niets.
const DELTA_KEY = 'izaDelta_v1';
let deltaLog = { voortgang: [], personen: [], personenVerwijderd: [], mijlpalen: [], referentie: false };

function laadDeltaLog() {
  try {
    const raw = localStorage.getItem(DELTA_KEY);
    if (raw) deltaLog = { ...deltaLog, ...JSON.parse(raw) };
  } catch (e) { /* niets */ }
}
function bewaarDeltaLog() {
  try { localStorage.setItem(DELTA_KEY, JSON.stringify(deltaLog)); } catch (e) { /* niets */ }
  updateDeelKnop();
}
function wisDeltaLog() {
  deltaLog = { voortgang: [], personen: [], personenVerwijderd: [], mijlpalen: [], referentie: false };
  bewaarDeltaLog();
}

// Wordt aangeroepen vanuit de formulieren zodra de gebruiker iets wijzigt.
// soort: 'voortgang' (id) | 'persoon' (id) | 'persoonVerwijderd' (id)
//        | 'mijlpaal' ({afspraakNr, id}) | 'referentie'
function registreerDelta(soort, ref) {
  if (soort === 'voortgang' && !deltaLog.voortgang.includes(ref)) deltaLog.voortgang.push(ref);
  if (soort === 'persoon' && !deltaLog.personen.includes(ref)) deltaLog.personen.push(ref);
  if (soort === 'persoonVerwijderd') {
    deltaLog.personen = deltaLog.personen.filter(id => id !== ref);
    if (!deltaLog.personenVerwijderd.includes(ref)) deltaLog.personenVerwijderd.push(ref);
  }
  if (soort === 'mijlpaal' && !deltaLog.mijlpalen.some(m => m.afspraakNr === ref.afspraakNr && m.id === ref.id))
    deltaLog.mijlpalen.push(ref);
  if (soort === 'referentie') deltaLog.referentie = true;
  bewaarDeltaLog();
}

function aantalDeltaWijzigingen() {
  return deltaLog.voortgang.length + deltaLog.personen.length +
    deltaLog.personenVerwijderd.length + deltaLog.mijlpalen.length + (deltaLog.referentie ? 1 : 0);
}

function updateDeelKnop() {
  const el = document.getElementById('deelBadge');
  if (!el) return;
  const n = aantalDeltaWijzigingen();
  el.textContent = n ? String(n) : '';
  el.style.display = n ? '' : 'none';
}

// ── Delta-export: "Deel wijzigingen" ──
function deelWijzigingen() {
  const n = aantalDeltaWijzigingen();
  if (!n) { toon('Geen eigen wijzigingen om te delen. Voeg eerst een statusupdate of deelnemer toe.'); return; }
  let auteur = '';
  try { auteur = localStorage.getItem('izaAuteur') || ''; } catch (e) { /* niets */ }
  const mijlpalen = [];
  for (const m of deltaLog.mijlpalen) {
    const a = AGRS.find(x => x.nr === m.afspraakNr);
    const rec = (a?.mijlpalen || []).find(x => x.id === m.id);
    if (rec) mijlpalen.push({ afspraakNr: m.afspraakNr, record: rec });
  }
  const bestand = {
    type: 'iza-azwa-aanlevering',
    schemaVersion: 1,
    gemaaktOp: vandaag(),
    auteur,
    voortgang: DB.voortgang.filter(v => deltaLog.voortgang.includes(v.id)),
    personen: DB.personen.filter(p => deltaLog.personen.includes(p.id)),
    personenVerwijderd: [...deltaLog.personenVerwijderd],
    mijlpalen,
    referentie: deltaLog.referentie ? DB.referentie : null,
  };
  const blob = new Blob([JSON.stringify(bestand, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const wie = (auteur || 'aanlevering').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'aanlevering';
  a.download = `aanlevering_${wie}_${vandaag()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toon(`Aanleverbestand met ${n} wijziging(en) gedownload. Zet het in de Teams-map "Aanleveringen".`);
}

// ── Samenvoeg-import: beheerder verwerkt één of meer aanleverbestanden ──
function voegAanleveringenSamen(files) {
  if (!files || !files.length) return;
  const rapport = [];
  let teLezen = files.length;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      let d;
      try { d = JSON.parse(reader.result); }
      catch (e) { rapport.push({ bestand: file.name, fout: 'geen geldige JSON' }); klaar(); return; }
      if (d && d.type !== 'iza-azwa-aanlevering' && d.schemaVersion === 1 && Array.isArray(d.afspraken)) {
        rapport.push({ bestand: file.name, fout: 'dit is een volledige export — gebruik hiervoor ⬆ Importeer in de header' });
        klaar(); return;
      }
      if (!d || d.type !== 'iza-azwa-aanlevering') {
        rapport.push({ bestand: file.name, fout: 'geen aanleverbestand (type ontbreekt)' });
        klaar(); return;
      }
      rapport.push({ bestand: file.name, ...verwerkAanlevering(d) });
      klaar();
    };
    reader.onerror = () => { rapport.push({ bestand: file.name, fout: 'niet leesbaar' }); klaar(); };
    reader.readAsText(file);
  }
  function klaar() {
    if (--teLezen > 0) return;
    bewaarDB();
    herrenderAlles();
    toonSamenvoegRapport(rapport);
  }
}

function verwerkAanlevering(d) {
  const r = { updates: 0, dubbel: 0, signalen: 0, personenNieuw: 0, personenBijgewerkt: 0,
              personenVerwijderd: 0, mijlpalen: 0, onbekend: 0 };
  const nrs = new Set(AGRS.map(a => a.nr));
  const geraakt = new Set();

  for (const v of d.voortgang || []) {
    if (!v.afspraakNr || !nrs.has(v.afspraakNr)) { r.onbekend++; continue; }
    const dubbel = DB.voortgang.some(x => x.afspraakNr === v.afspraakNr && x.datum === v.datum &&
      x.auteur === v.auteur && x.status === v.status && (x.toelichting || '') === (v.toelichting || ''));
    if (dubbel) { r.dubbel++; continue; }
    const rec = { ...v };
    if (DB.voortgang.some(x => x.id === rec.id)) rec.id = nieuwId('VG', DB.voortgang);
    DB.voortgang.push(rec);
    geraakt.add(rec.afspraakNr);
    r.updates++;
    if (rec.signaal) r.signalen++;
  }
  for (const nr of geraakt) {
    const a = AGRS.find(x => x.nr === nr);
    if (a) werkAfspraakStatusBij(a);
  }

  for (const p of d.personen || []) {
    if (!p || !p.naam) { r.onbekend++; continue; }
    const kopie = { ...p, lidmaatschappen: (p.lidmaatschappen || []).filter(l => DB.werkgroepen.some(w => w.id === l.werkgroepId)) };
    const opId = DB.personen.find(x => x.id === kopie.id);
    const zelfde = x => x.naam === kopie.naam && (x.email || '') === (kopie.email || '');
    if (opId && zelfde(opId)) { DB.personen[DB.personen.indexOf(opId)] = kopie; r.personenBijgewerkt++; }
    else {
      const opNaam = DB.personen.find(zelfde);
      if (opNaam) { kopie.id = opNaam.id; DB.personen[DB.personen.indexOf(opNaam)] = kopie; r.personenBijgewerkt++; }
      else { if (opId) kopie.id = nieuwId('P', DB.personen); DB.personen.push(kopie); r.personenNieuw++; }
    }
  }

  for (const id of d.personenVerwijderd || []) {
    const voor = DB.personen.length;
    DB.personen = DB.personen.filter(x => x.id !== id);
    if (DB.personen.length < voor) r.personenVerwijderd++;
  }

  for (const m of d.mijlpalen || []) {
    const a = AGRS.find(x => x.nr === m.afspraakNr);
    if (!a || !m.record) { r.onbekend++; continue; }
    a.mijlpalen = a.mijlpalen || [];
    const match = a.mijlpalen.find(x => x.titel === m.record.titel && x.datum === m.record.datum);
    if (match) { if (match.gehaald !== m.record.gehaald) { match.gehaald = m.record.gehaald; r.mijlpalen++; } }
    else { a.mijlpalen.push({ ...m.record, id: nieuwId('MP', a.mijlpalen) }); r.mijlpalen++; }
  }

  if (d.referentie) {
    for (const v of d.referentie.azwaPartijen || [])
      if (!DB.referentie.azwaPartijen.includes(v)) DB.referentie.azwaPartijen.push(v);
    for (const v of d.referentie.regioTafels || [])
      if (!DB.referentie.regioTafels.includes(v)) DB.referentie.regioTafels.push(v);
  }
  return r;
}

function toonSamenvoegRapport(rapport) {
  let h = '<table class="rp-tabel"><thead><tr><th scope="col">Bestand</th><th scope="col">Resultaat</th></tr></thead><tbody>';
  for (const r of rapport) {
    const tekst = r.fout ? `⚠ Overgeslagen: ${esc(r.fout)}` : esc([
      r.updates && `${r.updates} statusupdate(s)`,
      r.signalen && `waarvan ${r.signalen} signaal/signalen`,
      r.dubbel && `${r.dubbel} al aanwezig (overgeslagen)`,
      r.personenNieuw && `${r.personenNieuw} deelnemer(s) nieuw`,
      r.personenBijgewerkt && `${r.personenBijgewerkt} deelnemer(s) bijgewerkt`,
      r.personenVerwijderd && `${r.personenVerwijderd} deelnemer(s) verwijderd`,
      r.mijlpalen && `${r.mijlpalen} mijlpa(a)l(en)`,
      r.onbekend && `${r.onbekend} regel(s) met onbekend nummer overgeslagen`,
    ].filter(Boolean).join(' · ') || 'geen wijzigingen (alles al aanwezig)');
    h += `<tr><td>${esc(r.bestand)}</td><td>${tekst}</td></tr>`;
  }
  h += '</tbody></table><p class="frm-hint" style="margin-top:8px">Controleer het resultaat en exporteer daarna de nieuwe totaalstand (⬇ Exporteer) naar de Teams-map.</p>';
  openModal('Aanleveringen samengevoegd', h, '<button class="btn-primary" onclick="sluitModal()">Sluiten</button>');
}

// ── Excel/CSV-aanleversjabloon ──
function downloadSjabloon() {
  const wgId = document.getElementById('bhSjabloonWg')?.value || '';
  const lijst = AGRS.filter(a => !wgId || a.werkgroepId === wgId || werkgroep(a.werkgroepId)?.parentId === wgId);
  csvDownload(`aanleversjabloon_${vandaag()}.csv`,
    ['Nr', 'Afspraak', 'HuidigeStatus', 'NieuweStatus', 'Datum', 'Auteur', 'Toelichting', 'Signaal'],
    lijst.map(a => [a.nr, a.t, normStatus(a.status), '', '', '', '', '']));
  toon(`Sjabloon met ${lijst.length} afspraken gedownload. Vul de kolommen NieuweStatus t/m Signaal in Excel in.`);
}

function parseCsv(tekst) {
  tekst = tekst.replace(/^﻿/, '');
  const rijen = [];
  let rij = [], veld = '', inQuote = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (inQuote) {
      if (c === '"' && tekst[i + 1] === '"') { veld += '"'; i++; }
      else if (c === '"') inQuote = false;
      else veld += c;
    } else if (c === '"') inQuote = true;
    else if (c === ';' || c === ',') { rij.push(veld); veld = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && tekst[i + 1] === '\n') i++;
      rij.push(veld); veld = '';
      if (rij.some(v => v.trim() !== '')) rijen.push(rij);
      rij = [];
    } else veld += c;
  }
  if (veld !== '' || rij.length) { rij.push(veld); if (rij.some(v => v.trim() !== '')) rijen.push(rij); }
  return rijen;
}

function importeerSjabloon(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rijen = parseCsv(String(reader.result));
    if (!rijen.length) { alert('Het bestand is leeg of niet leesbaar als CSV.'); return; }
    const kop = rijen[0].map(k => k.trim().toLowerCase());
    const kol = naam => kop.indexOf(naam);
    if (kol('nr') < 0 || kol('nieuwestatus') < 0) {
      alert('Dit lijkt geen aanleversjabloon: kolommen "Nr" en "NieuweStatus" ontbreken. Download het sjabloon via Beheer.');
      return;
    }
    let ok = 0, leeg = 0, fout = [];
    const geraakt = new Set();
    for (const rij of rijen.slice(1)) {
      const nr = (rij[kol('nr')] || '').trim();
      const status = (rij[kol('nieuwestatus')] || '').trim();
      const toelichting = kol('toelichting') >= 0 ? (rij[kol('toelichting')] || '').trim() : '';
      if (!status && !toelichting) { leeg++; continue; }
      const a = AGRS.find(x => x.nr === nr);
      if (!a) { fout.push(`rij met nr "${nr}": onbekend afspraaknummer`); continue; }
      if (status && !STATUS_CATS.includes(status)) {
        fout.push(`${nr}: status "${status}" onbekend (gebruik: ${STATUS_CATS.join(', ')})`);
        continue;
      }
      let datum = kol('datum') >= 0 ? (rij[kol('datum')] || '').trim() : '';
      if (datum && !/^\d{4}-\d{2}-\d{2}$/.test(datum)) { fout.push(`${nr}: datum "${datum}" is geen JJJJ-MM-DD`); continue; }
      if (!datum) datum = vandaag();
      const auteur = (kol('auteur') >= 0 ? (rij[kol('auteur')] || '').trim() : '') || 'Excel-aanlevering';
      const signaal = kol('signaal') >= 0 && /^(ja|j|x|1|waar|true)$/i.test((rij[kol('signaal')] || '').trim());
      const rec = { id: nieuwId('VG', DB.voortgang), afspraakNr: nr, datum, auteur,
        status: status || normStatus(a.status), toelichting };
      if (signaal) rec.signaal = true;
      DB.voortgang.push(rec);
      registreerDelta('voortgang', rec.id);
      geraakt.add(nr);
      ok++;
    }
    for (const nr of geraakt) werkAfspraakStatusBij(AGRS.find(x => x.nr === nr));
    bewaarDB();
    herrenderAlles();
    let h = `<p>${ok} statusupdate(s) verwerkt; ${leeg} rij(en) zonder invulling overgeslagen.</p>`;
    if (fout.length) h += `<p style="color:#C00000;font-size:12px"><b>${fout.length} rij(en) niet verwerkt:</b></p><ul class="help-tekst" style="font-size:11px"><li>${fout.slice(0, 10).map(esc).join('</li><li>')}</li></ul>`;
    openModal('Sjabloon verwerkt', h, '<button class="btn-primary" onclick="sluitModal()">Sluiten</button>');
  };
  reader.readAsText(file);
}

laadDeltaLog();
