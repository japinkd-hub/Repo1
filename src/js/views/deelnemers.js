// Deelnemerregistratie: beheer van personen per (sub)werkgroep,
// met herkomst AZWA-partij en regionale IZA-AZWA-tafel.
let dlView = 'lijst'; // lijst | partij | regio | werkgroep

function renderDeelnemers() {
  vulDlSelects();
  const el = document.getElementById('dlBody');
  const lijst = gefilterdePersonen();
  document.getElementById('dl-count').textContent =
    `${lijst.length} van ${DB.personen.length} deelnemers`;
  if (!DB.personen.length) {
    el.innerHTML = `<div class="empty">Nog geen deelnemers geregistreerd.
      Klik op <b>+ Nieuwe deelnemer</b> om de eerste toe te voegen, of importeer een databestand.</div>`;
    return;
  }
  if (dlView === 'lijst') renderDlLijst(el, lijst);
  else renderDlGroepen(el, lijst, dlView);
}

function gefilterdePersonen() {
  const q = (document.getElementById('dlQ')?.value || '').toLowerCase().trim();
  const partij = document.getElementById('dlPartij')?.value || '';
  const regio = document.getElementById('dlRegio')?.value || '';
  const wg = document.getElementById('dlWg')?.value || '';
  return DB.personen.filter(p => {
    if (partij && (p.azwaPartij || '') !== partij) return false;
    if (regio && (p.regioTafel || '') !== regio) return false;
    if (wg && !(p.lidmaatschappen || []).some(l => l.werkgroepId === wg || werkgroep(l.werkgroepId)?.parentId === wg)) return false;
    if (!q) return true;
    return [p.naam, p.organisatie, p.rol, p.email, p.azwaPartij, p.regioTafel,
            ...(p.lidmaatschappen || []).map(l => werkgroepNaam(l.werkgroepId))]
      .some(v => String(v || '').toLowerCase().includes(q));
  }).sort((a, b) => (a.naam || '').localeCompare(b.naam || '', 'nl'));
}

function vulDlSelects() {
  const opties = (el, waarden, leegLabel) => {
    if (!el) return;
    const huidig = el.value;
    el.innerHTML = `<option value="">${leegLabel}</option>` +
      waarden.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if ([...el.options].some(o => o.value === huidig)) el.value = huidig;
  };
  opties(document.getElementById('dlPartij'), DB.referentie.azwaPartijen, 'Alle AZWA-partijen');
  opties(document.getElementById('dlRegio'), DB.referentie.regioTafels, 'Alle regiotafels');
  const wgSel = document.getElementById('dlWg');
  if (wgSel) {
    const huidig = wgSel.value;
    wgSel.innerHTML = '<option value="">Alle werkgroepen</option>' + werkgroepOpties();
    if ([...wgSel.options].some(o => o.value === huidig)) wgSel.value = huidig;
  }
}

function werkgroepOpties(geselecteerd) {
  const hoofd = DB.werkgroepen.filter(w => !w.parentId)
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  let h = '';
  for (const w of hoofd) {
    const sel = id => id === geselecteerd ? ' selected' : '';
    h += `<option value="${esc(w.id)}"${sel(w.id)}>${esc(w.naam)}</option>`;
    for (const s of DB.werkgroepen.filter(x => x.parentId === w.id)
        .sort((a, b) => a.naam.localeCompare(b.naam, 'nl')))
      h += `<option value="${esc(s.id)}"${sel(s.id)}>&nbsp;&nbsp;— ${esc(s.naam)}</option>`;
  }
  return h;
}

function dlZetView(v) {
  dlView = v;
  const map = { lijst: 'dlvL', partij: 'dlvP', regio: 'dlvR', werkgroep: 'dlvW' };
  Object.entries(map).forEach(([k, id]) => {
    const b = document.getElementById(id);
    if (b) b.className = 'dlv-btn' + (k === v ? ' on' : '');
  });
  renderDeelnemers();
}

function renderDlLijst(el, lijst) {
  if (!lijst.length) { el.innerHTML = '<div class="empty">Geen deelnemers gevonden voor deze filters.</div>'; return; }
  let h = `<div class="list-wrap"><table><thead><tr>
    <th scope="col">Naam</th><th scope="col">Organisatie</th><th scope="col">Rol</th>
    <th scope="col">E-mail</th><th scope="col">AZWA-partij</th><th scope="col">Regiotafel</th>
    <th scope="col">Werkgroepen</th><th scope="col"><span class="sr-only">Acties</span></th>
  </tr></thead><tbody>`;
  for (const p of lijst) {
    const wgs = (p.lidmaatschappen || [])
      .map(l => `<span class="dl-wg-chip" title="${esc(l.rol || 'Lid')}">${esc(werkgroepNaam(l.werkgroepId))}</span>`).join(' ');
    h += `<tr>
      <td><b>${esc(p.naam)}</b></td>
      <td>${esc(p.organisatie || '—')}</td>
      <td>${esc(p.rol || '—')}</td>
      <td>${p.email ? `<span class="dp-contact-email" onclick="cpEmail(event,'${p.email.replace(/'/g, "\\'")}')">✉ ${esc(p.email)}</span>` : '—'}</td>
      <td>${esc(p.azwaPartij || '—')}</td>
      <td>${esc(p.regioTafel || '—')}</td>
      <td>${wgs || '—'}</td>
      <td class="dl-acties">
        <button class="dl-btn" onclick="openPersoonForm('${esc(p.id)}')" title="Bewerk ${esc(p.naam)}" aria-label="Bewerk ${esc(p.naam)}">✎</button>
        <button class="dl-btn" onclick="verwijderPersoon('${esc(p.id)}')" title="Verwijder ${esc(p.naam)}" aria-label="Verwijder ${esc(p.naam)}">🗑</button>
      </td></tr>`;
  }
  el.innerHTML = h + '</tbody></table></div>';
}

// "Wie zit waar": gegroepeerde kaarten per partij, regio of werkgroep
function renderDlGroepen(el, lijst, soort) {
  const groepen = new Map();
  const voegToe = (sleutel, p, extra) => {
    if (!groepen.has(sleutel)) groepen.set(sleutel, []);
    groepen.get(sleutel).push({ p, extra });
  };
  if (soort === 'partij') lijst.forEach(p => voegToe(p.azwaPartij || 'Partij onbekend', p));
  if (soort === 'regio') lijst.forEach(p => voegToe(p.regioTafel || 'Regiotafel onbekend', p));
  if (soort === 'werkgroep') lijst.forEach(p => {
    if (!(p.lidmaatschappen || []).length) voegToe('Zonder werkgroep', p);
    (p.lidmaatschappen || []).forEach(l => voegToe(werkgroepNaam(l.werkgroepId), p, l.rol));
  });

  const sleutels = [...groepen.keys()].sort((a, b) => a.localeCompare(b, 'nl'));
  if (!sleutels.length) { el.innerHTML = '<div class="empty">Geen deelnemers gevonden voor deze filters.</div>'; return; }
  let h = '<div class="dl-groepen">';
  for (const s of sleutels) {
    const leden = groepen.get(s);
    h += `<div class="dl-groep">
      <div class="dl-groep-hdr"><span>${esc(s)}</span><span class="dl-groep-badge">${leden.length}</span></div>
      <div class="dl-groep-body">`;
    for (const { p, extra } of leden) {
      h += `<div class="dl-persoon" onclick="openPersoonForm('${esc(p.id)}')" role="button" tabindex="0"
              onkeydown="if(event.key==='Enter')openPersoonForm('${esc(p.id)}')" title="Klik om te bewerken">
        <span class="dl-persoon-naam">${esc(p.naam)}</span>
        <span class="dl-persoon-meta">${esc([p.organisatie, extra || p.rol].filter(Boolean).join(' · ') || '—')}</span>
      </div>`;
    }
    h += '</div></div>';
  }
  el.innerHTML = h + '</div>';
}

// ── Formulier ──
function openPersoonForm(id) {
  const p = id ? DB.personen.find(x => x.id === id) : null;
  const lms = p ? (p.lidmaatschappen || []) : [];
  const veld = (label, inputHtml, hint) => `
    <div class="frm-veld"><label>${label}${inputHtml}</label>${hint ? `<div class="frm-hint">${hint}</div>` : ''}</div>`;
  const datalijst = (id, waarden) =>
    `<datalist id="${id}">${waarden.map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;

  const body = `
    <form id="persoonForm" onsubmit="event.preventDefault(); slaPersoonOp(${p ? `'${esc(p.id)}'` : 'null'})">
      <div class="frm-avg">Registreer alleen zakelijke contactgegevens (AVG).</div>
      <div class="frm-rij">
        ${veld('Naam *', `<input id="pfNaam" required value="${esc(p?.naam || '')}" autocomplete="off">`)}
        ${veld('Organisatie / branche', `<input id="pfOrg" value="${esc(p?.organisatie || '')}" autocomplete="off">`)}
      </div>
      <div class="frm-rij">
        ${veld('Rol / functie', `<input id="pfRol" value="${esc(p?.rol || '')}" placeholder="bijv. voorzitter, secretaris, lid" autocomplete="off">`)}
        ${veld('Zakelijk e-mailadres', `<input id="pfEmail" type="email" value="${esc(p?.email || '')}" autocomplete="off">`)}
      </div>
      <div class="frm-rij">
        ${veld('Herkomst: AZWA-partij', `<input id="pfPartij" list="pfPartijLijst" value="${esc(p?.azwaPartij || '')}" autocomplete="off">`,
          'Kies uit de lijst of typ een nieuwe waarde; beheer de lijst via ⚙ Lijsten.')}
        ${veld('Herkomst: regionale IZA-AZWA-tafel', `<input id="pfRegio" list="pfRegioLijst" value="${esc(p?.regioTafel || '')}" autocomplete="off">`)}
      </div>
      ${datalijst('pfPartijLijst', DB.referentie.azwaPartijen)}
      ${datalijst('pfRegioLijst', DB.referentie.regioTafels)}
      <div class="frm-veld">
        <span class="frm-label">Lidmaatschappen (werkgroep of subwerkgroep)</span>
        <div id="pfLms">${lms.map(l => lidmaatschapRij(l)).join('')}</div>
        <button type="button" class="btn-secondary" onclick="voegLidmaatschapToe()">＋ Lidmaatschap toevoegen</button>
      </div>
    </form>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="document.getElementById('persoonForm').requestSubmit()">${p ? 'Wijzigingen opslaan' : 'Deelnemer toevoegen'}</button>`;
  openModal(p ? `Deelnemer bewerken — ${p.naam}` : 'Nieuwe deelnemer', body, footer);
  if (!lms.length) voegLidmaatschapToe();
}

function lidmaatschapRij(l) {
  return `<div class="pf-lm-rij">
    <select class="pf-lm-wg" aria-label="Werkgroep">${werkgroepOpties(l?.werkgroepId)}</select>
    <input class="pf-lm-rol" value="${esc(l?.rol || '')}" placeholder="rol in werkgroep (bijv. lid)" aria-label="Rol in werkgroep">
    <button type="button" class="dl-btn" onclick="this.parentElement.remove()" title="Lidmaatschap verwijderen" aria-label="Lidmaatschap verwijderen">✕</button>
  </div>`;
}

function voegLidmaatschapToe() {
  document.getElementById('pfLms').insertAdjacentHTML('beforeend', lidmaatschapRij(null));
}

function slaPersoonOp(id) {
  const naam = document.getElementById('pfNaam').value.trim();
  if (!naam) return;
  const lidmaatschappen = [...document.querySelectorAll('#pfLms .pf-lm-rij')]
    .map(rij => ({
      werkgroepId: rij.querySelector('.pf-lm-wg').value,
      rol: rij.querySelector('.pf-lm-rol').value.trim() || 'Lid',
    }))
    .filter((l, i, all) => l.werkgroepId && all.findIndex(x => x.werkgroepId === l.werkgroepId) === i);
  const record = {
    id: id || nieuwId('P', DB.personen),
    naam,
    organisatie: document.getElementById('pfOrg').value.trim(),
    rol: document.getElementById('pfRol').value.trim(),
    email: document.getElementById('pfEmail').value.trim(),
    azwaPartij: document.getElementById('pfPartij').value.trim(),
    regioTafel: document.getElementById('pfRegio').value.trim(),
    lidmaatschappen,
  };
  // Nieuwe partij/regio automatisch aan de referentielijst toevoegen
  if (record.azwaPartij && !DB.referentie.azwaPartijen.includes(record.azwaPartij)) DB.referentie.azwaPartijen.push(record.azwaPartij);
  if (record.regioTafel && !DB.referentie.regioTafels.includes(record.regioTafel)) DB.referentie.regioTafels.push(record.regioTafel);
  const idx = DB.personen.findIndex(x => x.id === id);
  if (idx >= 0) DB.personen[idx] = record; else DB.personen.push(record);
  registreerDelta('persoon', record.id);
  bewaarDB();
  sluitModal();
  renderDeelnemers();
  toon(id ? `Deelnemer ${naam} bijgewerkt.` : `Deelnemer ${naam} toegevoegd.`);
}

function verwijderPersoon(id) {
  const p = DB.personen.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Deelnemer "${p.naam}" verwijderen?`)) return;
  DB.personen = DB.personen.filter(x => x.id !== id);
  setDB(DB); // AGRS/CONTACTS-verwijzingen blijven kloppen
  registreerDelta('persoonVerwijderd', id);
  bewaarDB();
  renderDeelnemers();
  toon(`Deelnemer ${p.naam} verwijderd.`);
}

// ── Referentielijsten (AZWA-partijen, regiotafels) ──
function openReferentieBeheer() {
  const body = `
    <p class="frm-hint" style="margin-bottom:8px">Eén waarde per regel. Deze lijsten vullen de
    keuzevelden bij deelnemers. Bestaande deelnemers behouden hun waarde, ook als je die hier weghaalt.</p>
    <div class="frm-rij">
      <div class="frm-veld"><label>AZWA-partijen
        <textarea id="refPartijen" rows="14">${esc(DB.referentie.azwaPartijen.join('\n'))}</textarea></label></div>
      <div class="frm-veld"><label>Regionale IZA-AZWA-tafels
        <textarea id="refRegios" rows="14">${esc(DB.referentie.regioTafels.join('\n'))}</textarea></label></div>
    </div>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="slaReferentiesOp()">Lijsten opslaan</button>`;
  openModal('Referentielijsten beheren', body, footer);
}

function slaReferentiesOp() {
  const lees = id => [...new Set(document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean))];
  DB.referentie.azwaPartijen = lees('refPartijen');
  DB.referentie.regioTafels = lees('refRegios');
  registreerDelta('referentie');
  bewaarDB();
  sluitModal();
  renderDeelnemers();
  toon('Referentielijsten opgeslagen.');
}

// ── Export ──
function exporteerDeelnemersCsv() {
  const lijst = gefilterdePersonen();
  csvDownload(`deelnemers_${vandaag()}.csv`,
    ['Naam', 'Organisatie', 'Rol', 'E-mail', 'AZWA-partij', 'Regiotafel', 'Werkgroepen (rol)'],
    lijst.map(p => [p.naam, p.organisatie, p.rol, p.email, p.azwaPartij, p.regioTafel,
      (p.lidmaatschappen || []).map(l => `${werkgroepNaam(l.werkgroepId)} (${l.rol || 'Lid'})`).join(' | ')]));
  toon(`${lijst.length} deelnemers geëxporteerd als CSV. Let op: het bestand bevat persoonsgegevens.`);
}
