// Voortgangsrapportage per afspraak: statusupdates met historie (tijdlijn),
// mijlpalen met deadlines en risicosignalering.

function nrVeilig(nr) { return String(nr).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function voortgangVoorAfspraak(nr) {
  return DB.voortgang
    .filter(v => v.afspraakNr === nr)
    .sort((x, y) => (y.datum || '').localeCompare(x.datum || '') || (y.id || '').localeCompare(x.id || ''));
}

// ── Detailpaneel: status + tijdlijn ──
function voortgangSectieHtml(a) {
  const sc = statColor(a.status);
  const updates = voortgangVoorAfspraak(a.nr);
  let h = `<div data-dpsec="status"><div class="dp-divider"></div>
    <div class="dp-field">
      <div class="dp-label dp-label-rij">Status
        <button class="dp-mini-btn" onclick="openStatusUpdateForm('${nrVeilig(a.nr)}')">＋ Statusupdate</button>
      </div>
      <div><span class="status-pill" style="background:${sc}">${esc(a.status)}</span>
        ${isDeadlineRisk(a) ? '<span class="risk-badge" title="Deadline nabij of mijlpaal verstreken terwijl de afspraak niet op koers is">⚠ Deadlinerisico</span>' : ''}
      </div>
    </div>`;
  if (updates.length) {
    h += `<div class="dp-field"><div class="dp-label">Tijdlijn (${updates.length} update${updates.length === 1 ? '' : 's'})</div>
      <div class="vg-tijdlijn">`;
    for (const u of updates) {
      h += `<div class="vg-item">
        <span class="vg-dot" style="background:${statColor(u.status)}"></span>
        <div class="vg-inhoud">
          <div class="vg-kop"><b>${esc(u.datum)}</b> · ${esc(u.auteur || '—')} ·
            <span class="status-pill" style="background:${statColor(u.status)}">${esc(u.status)}</span>
            <button class="vg-del" onclick="verwijderVoortgang('${esc(u.id)}')" title="Verwijder deze update" aria-label="Verwijder statusupdate van ${esc(u.datum)}">✕</button>
          </div>
          ${u.toelichting ? `<div class="vg-toel">${esc(u.toelichting)}</div>` : ''}
        </div>
      </div>`;
    }
    h += '</div></div>';
  }
  return h + '</div>';
}

// ── Detailpaneel: mijlpalen ──
function mijlpalenSectieHtml(a) {
  const mps = (a.mijlpalen || []).slice().sort((x, y) => (x.datum || '').localeCompare(y.datum || ''));
  let h = `<div data-dpsec="mijlpalen"><div class="dp-field">
    <div class="dp-label dp-label-rij">Mijlpalen
      <button class="dp-mini-btn" onclick="openMijlpaalForm('${nrVeilig(a.nr)}')">＋ Mijlpaal</button>
    </div>`;
  if (!mps.length) {
    h += '<div class="dp-value" style="color:#999;font-size:11px">Nog geen mijlpalen vastgelegd.</div>';
  } else {
    for (const m of mps) {
      const teLaat = !m.gehaald && m.datum && m.datum < vandaag();
      h += `<div class="mp-item${m.gehaald ? ' gehaald' : ''}">
        <input type="checkbox" id="mp-${esc(m.id)}" ${m.gehaald ? 'checked' : ''}
          onchange="toggleMijlpaal('${nrVeilig(a.nr)}','${esc(m.id)}',this.checked)">
        <label for="mp-${esc(m.id)}">
          <span class="mp-datum">${esc(m.datum || '—')}</span> ${esc(m.titel)}
          ${teLaat ? '<span class="mp-laat">verstreken</span>' : ''}
        </label>
        <button class="vg-del" onclick="verwijderMijlpaal('${nrVeilig(a.nr)}','${esc(m.id)}')" title="Verwijder mijlpaal" aria-label="Verwijder mijlpaal ${esc(m.titel)}">✕</button>
      </div>`;
    }
  }
  return h + '</div></div>';
}

// ── Statusupdate ──
function openStatusUpdateForm(nr) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  let auteur = '';
  try { auteur = localStorage.getItem('izaAuteur') || ''; } catch (e) { /* niets */ }
  const huidig = normStatus(a.status);
  const opties = STATUS_CATS.map(s =>
    `<option value="${esc(s)}"${s === huidig ? ' selected' : ''}>${esc(s)}</option>`).join('');
  const body = `
    <form id="vgForm" onsubmit="event.preventDefault(); slaStatusUpdateOp('${nrVeilig(nr)}')">
      <div class="frm-rij">
        <div class="frm-veld"><label>Datum *<input id="vgDatum" type="date" required value="${vandaag()}"></label></div>
        <div class="frm-veld"><label>Auteur *<input id="vgAuteur" required value="${esc(auteur)}" placeholder="naam of organisatie"></label></div>
      </div>
      <div class="frm-veld"><label>Nieuwe status *<select id="vgStatus">${opties}</select></label></div>
      <div class="frm-veld"><label>Toelichting<textarea id="vgToel" rows="4" placeholder="Wat is er gebeurd of besloten? Wat is de volgende stap?"></textarea></label></div>
    </form>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="document.getElementById('vgForm').requestSubmit()">Update opslaan</button>`;
  openModal(`Statusupdate — ${a.nr} ${a.t}`, body, footer);
}

function slaStatusUpdateOp(nr) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  const datum = document.getElementById('vgDatum').value;
  const auteur = document.getElementById('vgAuteur').value.trim();
  const status = document.getElementById('vgStatus').value;
  const toelichting = document.getElementById('vgToel').value.trim();
  if (!datum || !auteur || !status) return;
  DB.voortgang.push({ id: nieuwId('VG', DB.voortgang), afspraakNr: nr, datum, auteur, status, toelichting });
  werkAfspraakStatusBij(a);
  try { localStorage.setItem('izaAuteur', auteur); } catch (e) { /* niets */ }
  bewaarDB();
  sluitModal();
  herrenderAlles();
  toon(`Statusupdate voor ${nr} opgeslagen.`);
}

// Actuele status van de afspraak = status van het meest recente voortgangsrecord
function werkAfspraakStatusBij(a) {
  const laatste = voortgangVoorAfspraak(a.nr)[0];
  if (!laatste) return;
  a.status = laatste.status;
  if (laatste.toelichting) a.vg = laatste.toelichting;
}

function verwijderVoortgang(id) {
  const v = DB.voortgang.find(x => x.id === id);
  if (!v) return;
  if (!confirm(`Statusupdate van ${v.datum} (${v.status}) verwijderen?`)) return;
  DB.voortgang = DB.voortgang.filter(x => x.id !== id);
  const a = AGRS.find(x => x.nr === v.afspraakNr);
  if (a) werkAfspraakStatusBij(a);
  bewaarDB();
  herrenderAlles();
  toon('Statusupdate verwijderd.');
}

// ── Mijlpalen ──
function openMijlpaalForm(nr) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  const body = `
    <form id="mpForm" onsubmit="event.preventDefault(); slaMijlpaalOp('${nrVeilig(nr)}')">
      <div class="frm-veld"><label>Omschrijving *<input id="mpTitel" required placeholder="bijv. Plan van aanpak vastgesteld"></label></div>
      <div class="frm-rij">
        <div class="frm-veld"><label>Datum / deadline *<input id="mpDatum" type="date" required></label></div>
        <div class="frm-veld"><label style="margin-top:16px"><input type="checkbox" id="mpGehaald" style="width:auto;margin-right:6px">Al gehaald</label></div>
      </div>
    </form>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="document.getElementById('mpForm').requestSubmit()">Mijlpaal toevoegen</button>`;
  openModal(`Mijlpaal — ${a.nr} ${a.t}`, body, footer);
}

function slaMijlpaalOp(nr) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  const titel = document.getElementById('mpTitel').value.trim();
  const datum = document.getElementById('mpDatum').value;
  if (!titel || !datum) return;
  a.mijlpalen = a.mijlpalen || [];
  a.mijlpalen.push({ id: nieuwId('MP', a.mijlpalen), titel, datum, gehaald: document.getElementById('mpGehaald').checked });
  bewaarDB();
  sluitModal();
  herrenderAlles();
  toon(`Mijlpaal voor ${nr} toegevoegd.`);
}

function toggleMijlpaal(nr, id, gehaald) {
  const m = (AGRS.find(x => x.nr === nr)?.mijlpalen || []).find(x => x.id === id);
  if (!m) return;
  m.gehaald = gehaald;
  bewaarDB();
  herrenderAlles();
}

function verwijderMijlpaal(nr, id) {
  const a = AGRS.find(x => x.nr === nr);
  if (!a) return;
  const m = (a.mijlpalen || []).find(x => x.id === id);
  if (!m || !confirm(`Mijlpaal "${m.titel}" verwijderen?`)) return;
  a.mijlpalen = a.mijlpalen.filter(x => x.id !== id);
  bewaarDB();
  herrenderAlles();
  toon('Mijlpaal verwijderd.');
}
