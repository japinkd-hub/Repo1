// Rapportagemodule: kwartaalrapportage voor bestuurlijke tafels,
// scope per thematafel/werkgroep/periode, PDF via afdrukken en CSV-export.

function kwartaalVan(datum) {
  if (!datum) return null;
  const [j, m] = datum.split('-').map(Number);
  return `${j} Q${Math.ceil(m / 3)}`;
}

function kwartaalOpties() {
  const set = new Set(DB.voortgang.map(v => kwartaalVan(v.datum)).filter(Boolean));
  set.add(kwartaalVan(vandaag()));
  return [...set].sort().reverse();
}

function rpScope() {
  return {
    periode: document.getElementById('rpPeriode')?.value || '',
    tf: document.getElementById('rpTafel')?.value || '',
    wgId: document.getElementById('rpWg')?.value || '',
  };
}

function rpAfspraken() {
  const { tf, wgId } = rpScope();
  return AGRS.filter(a => {
    if (tf && a.tf !== tf) return false;
    if (wgId && !(a.werkgroepId === wgId || werkgroep(a.werkgroepId)?.parentId === wgId)) return false;
    return true;
  });
}

function rpUpdates(afspraken) {
  const { periode } = rpScope();
  const nrs = new Set(afspraken.map(a => a.nr));
  return DB.voortgang
    .filter(v => nrs.has(v.afspraakNr) && (!periode || kwartaalVan(v.datum) === periode))
    .sort((x, y) => (y.datum || '').localeCompare(x.datum || ''));
}

function renderRapportage() {
  vulRpSelects();
  const { periode, tf, wgId } = rpScope();
  const afspraken = rpAfspraken();
  const updates = rpUpdates(afspraken);
  const signalen = updates.filter(u => u.signaal);
  const risicos = afspraken.filter(isDeadlineRisk);

  const counts = {};
  [...STATUS_CATS, 'Onbekend'].forEach(c => counts[c] = 0);
  afspraken.forEach(a => counts[normStatus(a.status)]++);

  const scopeTekst = [
    tf ? TF_META[tf]?.label || tf : 'alle thematafels',
    wgId ? `werkgroep ${werkgroepNaam(wgId)}` : null,
    periode ? `periode ${periode}` : 'alle perioden',
  ].filter(Boolean).join(' · ');

  let h = `<div class="rp-rapport" id="rpRapport">
    <div class="rp-titelblok">
      <h2>Kwartaalrapportage IZA-AZWA</h2>
      <div class="rp-sub">${esc(scopeTekst)}</div>
      <div class="rp-meta">Gegenereerd op ${esc(vandaag())} · datastand ${esc(DB.laatstGewijzigd)} · ${afspraken.length} afspraken in scope</div>
    </div>`;

  // Samenvatting
  h += '<div class="rp-tegels">';
  h += rpTegel(afspraken.length, 'afspraken', '#555');
  for (const c of [...STATUS_CATS, 'Onbekend'])
    if (counts[c]) h += rpTegel(counts[c], c, STATUS_NORM_COLORS[c]);
  h += rpTegel(risicos.length, '⚠ deadlinerisico', '#C00000');
  if (signalen.length) h += rpTegel(signalen.length, '💡 signalen', '#B8860B');
  h += rpTegel(updates.length, periode ? `updates in ${periode}` : 'statusupdates totaal', 'var(--primary)');
  h += '</div>';

  // Statusverdeling per thematafel
  if (!wgId) {
    h += '<h3 class="rp-h3">Statusverdeling per thematafel</h3><div class="rp-balken">';
    for (const [tfKey, meta] of Object.entries(TF_META)) {
      if (tf && tfKey !== tf) continue;
      const lijst = afspraken.filter(a => a.tf === tfKey);
      if (!lijst.length) continue;
      h += rpStatusBalk(meta.label, lijst, meta.color);
    }
    h += '</div>';
  }

  // Per werkgroep
  const perWg = new Map();
  for (const a of afspraken) {
    const hoofdId = werkgroep(a.werkgroepId)?.parentId || a.werkgroepId;
    if (!perWg.has(hoofdId)) perWg.set(hoofdId, []);
    perWg.get(hoofdId).push(a);
  }
  if (perWg.size > 1) {
    h += '<h3 class="rp-h3">Per werkgroep</h3><div class="rp-balken">';
    for (const [id, lijst] of [...perWg.entries()].sort((x, y) => y[1].length - x[1].length))
      h += rpStatusBalk(werkgroepNaam(id), lijst, '#777');
    h += '</div>';
  }

  // Signalen: door werkgroepen gemarkeerde nieuwe inzichten/aandachtspunten
  if (signalen.length) {
    h += `<h3 class="rp-h3">💡 Signalen &amp; nieuwe inzichten (${signalen.length})</h3>
      <table class="rp-tabel"><thead><tr><th scope="col">Datum</th><th scope="col">Afspraak</th>
      <th scope="col">Auteur</th><th scope="col">Signaal</th></tr></thead><tbody>`;
    for (const u of signalen) {
      const a = AGRS.find(x => x.nr === u.afspraakNr);
      h += `<tr><td style="white-space:nowrap">${esc(u.datum)}</td>
        <td><b>${esc(u.afspraakNr)}</b> ${esc(a?.t || '')}</td>
        <td>${esc(u.auteur || '—')}</td><td>${esc(u.toelichting || '—')}</td></tr>`;
    }
    h += '</tbody></table>';
  }

  // Risico's
  h += `<h3 class="rp-h3">Afspraken met deadlinerisico (${risicos.length})</h3>`;
  if (!risicos.length) h += '<p class="rp-leeg">Geen afspraken met deadlinerisico binnen deze scope.</p>';
  else {
    h += `<table class="rp-tabel"><thead><tr><th scope="col">Nr.</th><th scope="col">Afspraak</th>
      <th scope="col">Tafel</th><th scope="col">Werkgroep</th><th scope="col">Status</th>
      <th scope="col">Deadline</th><th scope="col">Signaal</th></tr></thead><tbody>`;
    for (const a of risicos) {
      const mpLaat = (a.mijlpalen || []).filter(m => !m.gehaald && m.datum && m.datum < vandaag());
      const signaal = mpLaat.length
        ? `mijlpaal verstreken: ${mpLaat[0].titel}${mpLaat.length > 1 ? ` (+${mpLaat.length - 1})` : ''}`
        : 'deadline nabij of verstreken';
      h += `<tr><td>${esc(a.nr)}</td><td>${esc(a.t)}</td><td>${esc(TF_META[a.tf]?.short || a.tf)}</td>
        <td>${esc(werkgroepNaam(a.werkgroepId))}</td>
        <td><span class="status-pill" style="background:${statColor(a.status)};color:${statusTextColor(a.status)}">${esc(normStatus(a.status))}</span></td>
        <td>${esc(a.deadline || '—')}</td><td>${esc(signaal)}</td></tr>`;
    }
    h += '</tbody></table>';
  }

  // Statusupdates in periode
  h += `<h3 class="rp-h3">Statusupdates ${periode ? `in ${esc(periode)}` : '(alle)'} — ${updates.length}</h3>`;
  if (!updates.length) h += '<p class="rp-leeg">Geen statusupdates in deze periode.</p>';
  else {
    h += `<table class="rp-tabel"><thead><tr><th scope="col">Datum</th><th scope="col">Afspraak</th>
      <th scope="col">Status</th><th scope="col">Auteur</th><th scope="col">Toelichting</th></tr></thead><tbody>`;
    for (const u of updates.slice(0, 200)) {
      const a = AGRS.find(x => x.nr === u.afspraakNr);
      h += `<tr><td style="white-space:nowrap">${esc(u.datum)}</td>
        <td><b>${esc(u.afspraakNr)}</b> ${esc(a?.t || '')}</td>
        <td><span class="status-pill" style="background:${statColor(u.status)};color:${statusTextColor(u.status)}">${esc(u.status)}</span></td>
        <td>${esc(u.auteur || '—')}</td><td>${esc(u.toelichting || '')}</td></tr>`;
    }
    h += '</tbody></table>';
  }

  h += '</div>';
  document.getElementById('rpBody').innerHTML = h;
}

function rpTegel(n, label, kleur) {
  return `<div class="rp-tegel" style="border-top-color:${kleur}">
    <div class="rp-tegel-n">${n}</div><div class="rp-tegel-l">${esc(label)}</div></div>`;
}

function rpStatusBalk(label, lijst, labelKleur) {
  const cats = [...STATUS_CATS, 'Onbekend'];
  const totaal = lijst.length;
  const segs = cats.map(c => {
    const n = lijst.filter(a => normStatus(a.status) === c).length;
    if (!n) return '';
    return `<div title="${esc(c)}: ${n}" style="width:${(n / totaal * 100).toFixed(1)}%;background:${STATUS_NORM_COLORS[c]}"></div>`;
  }).join('');
  const klaar = lijst.filter(a => ['Afgerond', 'Op schema', 'Gestart'].includes(normStatus(a.status))).length;
  return `<div class="rp-balkrij">
    <div class="rp-balklabel" style="color:${labelKleur}">${esc(label)}</div>
    <div class="rp-balk">${segs}</div>
    <div class="rp-balkinfo">${klaar}/${totaal} loopt of klaar</div>
  </div>`;
}

function vulRpSelects() {
  const per = document.getElementById('rpPeriode');
  if (per && !per.dataset.gevuld) {
    per.innerHTML = '<option value="">Alle perioden</option>' +
      kwartaalOpties().map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
    per.dataset.gevuld = '1';
  }
  const tfSel = document.getElementById('rpTafel');
  if (tfSel && !tfSel.dataset.gevuld) {
    tfSel.innerHTML = '<option value="">Alle thematafels</option>' +
      Object.entries(TF_META).map(([k, m]) => `<option value="${k}">${esc(m.label)}</option>`).join('');
    tfSel.dataset.gevuld = '1';
  }
  const wgSel = document.getElementById('rpWg');
  if (wgSel) {
    const huidig = wgSel.value;
    wgSel.innerHTML = '<option value="">Alle werkgroepen</option>' + werkgroepOpties();
    if ([...wgSel.options].some(o => o.value === huidig)) wgSel.value = huidig;
  }
}

function printRapport() {
  window.print();
}

function exporteerRapportCsv() {
  const afspraken = rpAfspraken();
  csvDownload(`rapportage_${vandaag()}.csv`,
    ['Nr', 'Titel', 'Thematafel', 'Werkgroep', 'Status (ruw)', 'Statuscategorie', 'Deadline',
     'Deadlinerisico', 'Mijlpalen (gehaald/totaal)', 'Laatste update', 'Laatste auteur', 'Laatste toelichting'],
    afspraken.map(a => {
      const u = voortgangVoorAfspraak(a.nr)[0];
      const mps = a.mijlpalen || [];
      return [a.nr, a.t, TF_META[a.tf]?.label || a.tf, werkgroepNaam(a.werkgroepId),
        a.status, normStatus(a.status), a.deadline,
        isDeadlineRisk(a) ? 'ja' : 'nee', `${mps.filter(m => m.gehaald).length}/${mps.length}`,
        u?.datum || '', u?.auteur || '', u?.toelichting || ''];
    }));
  toon(`${afspraken.length} afspraken geëxporteerd als CSV.`);
}
