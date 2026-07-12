// Beheer (v1.1): aanleveringen samenvoegen, Excel/CSV-sjabloon en
// werkgroepbeheer (hernoemen, samenvoegen, toevoegen, verwijderen).

function renderBeheer() {
  const wgSel = document.getElementById('bhSjabloonWg');
  if (wgSel) {
    const huidig = wgSel.value;
    wgSel.innerHTML = '<option value="">Alle werkgroepen</option>' + werkgroepOpties();
    if ([...wgSel.options].some(o => o.value === huidig)) wgSel.value = huidig;
  }
  renderWerkgroepTabel();
}

function renderWerkgroepTabel() {
  const el = document.getElementById('bhWerkgroepen');
  if (!el) return;
  const afsprakenPer = {}, ledenPer = {};
  AGRS.forEach(a => { afsprakenPer[a.werkgroepId] = (afsprakenPer[a.werkgroepId] || 0) + 1; });
  DB.personen.forEach(p => (p.lidmaatschappen || []).forEach(l => {
    ledenPer[l.werkgroepId] = (ledenPer[l.werkgroepId] || 0) + 1;
  }));

  const hoofd = DB.werkgroepen.filter(w => !w.parentId).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  let h = `<table class="rp-tabel"><thead><tr>
    <th scope="col">Werkgroep</th><th scope="col">Tafel</th>
    <th scope="col">Afspraken</th><th scope="col">Deelnemers</th>
    <th scope="col"><span class="sr-only">Acties</span></th></tr></thead><tbody>`;
  const rij = (w, sub) => {
    const leeg = !(afsprakenPer[w.id] || ledenPer[w.id]) &&
      !DB.werkgroepen.some(x => x.parentId === w.id);
    h += `<tr>
      <td>${sub ? '<span style="color:#bbb">└─</span> ' : ''}<b>${esc(w.naam)}</b>${w.gremium ? ' <span class="dl-wg-chip" title="Aanspreekpunt-gremium uit het PoC">gremium</span>' : ''}</td>
      <td>${esc(w.tafel || '—')}</td>
      <td>${afsprakenPer[w.id] || 0}</td>
      <td>${ledenPer[w.id] || 0}</td>
      <td class="dl-acties">
        <button class="dl-btn" onclick="hernoemWerkgroep('${esc(w.id)}')" title="Hernoem ${esc(w.naam)}" aria-label="Hernoem ${esc(w.naam)}">✎</button>
        ${w.gremium ? '' : `<button class="dl-btn" onclick="openSamenvoegen('${esc(w.id)}')" title="Voeg ${esc(w.naam)} samen met een andere werkgroep" aria-label="Voeg ${esc(w.naam)} samen">⇄</button>`}
        ${leeg && !w.gremium ? `<button class="dl-btn" onclick="verwijderWerkgroep('${esc(w.id)}')" title="Verwijder ${esc(w.naam)} (leeg)" aria-label="Verwijder ${esc(w.naam)}">🗑</button>` : ''}
      </td></tr>`;
  };
  for (const w of hoofd) {
    rij(w, false);
    for (const s of DB.werkgroepen.filter(x => x.parentId === w.id).sort((a, b) => a.naam.localeCompare(b.naam, 'nl')))
      rij(s, true);
  }
  el.innerHTML = h + '</tbody></table>';
}

function subboomIds(id) {
  const ids = [id];
  for (const w of DB.werkgroepen.filter(x => x.parentId === id)) ids.push(...subboomIds(w.id));
  return ids;
}

function hernoemWerkgroep(id) {
  const w = werkgroep(id);
  if (!w) return;
  const naam = prompt(`Nieuwe naam voor "${w.naam}":`, w.naam);
  if (!naam || !naam.trim() || naam.trim() === w.naam) return;
  w.naam = naam.trim();
  AGRS.filter(a => a.werkgroepId === id).forEach(a => { a.wg = werkgroepNaam(id).replace(' — ', ' / '); });
  bewaarDB();
  herrenderAlles();
  renderBeheer();
  toon(`Werkgroep hernoemd naar "${w.naam}".`);
}

function openSamenvoegen(bronId) {
  const bron = werkgroep(bronId);
  if (!bron) return;
  if (bron.gremium) { alert('Gremia (aanspreekpunten uit het PoC) kunnen niet worden samengevoegd.'); return; }
  const verboden = new Set(subboomIds(bronId)); // geen samenvoegen met zichzelf of eigen subwerkgroep
  const opties = DB.werkgroepen.filter(w => !verboden.has(w.id))
    .sort((a, b) => werkgroepNaam(a.id).localeCompare(werkgroepNaam(b.id), 'nl'))
    .map(w => `<option value="${esc(w.id)}">${esc(werkgroepNaam(w.id))}</option>`).join('');
  const nAfspraken = AGRS.filter(a => a.werkgroepId === bronId).length;
  const nLeden = DB.personen.filter(p => (p.lidmaatschappen || []).some(l => l.werkgroepId === bronId)).length;
  const nSubs = DB.werkgroepen.filter(w => w.parentId === bronId).length;
  const body = `
    <p style="font-size:12px">Alles van <b>${esc(werkgroepNaam(bronId))}</b> gaat over naar de gekozen
    doelwerkgroep: ${nAfspraken} afspraak/afspraken, ${nLeden} deelnemer(s)${nSubs ? ` en ${nSubs} subwerkgroep(en)` : ''}.
    De statushistorie blijft volledig bewaard (die hangt aan de afspraken). Daarna wordt
    "${esc(bron.naam)}" verwijderd. Dit kan niet ongedaan worden gemaakt — exporteer eerst een back-up.</p>
    <div class="frm-veld"><label>Samenvoegen met (doelwerkgroep)
      <select id="bhDoelWg">${opties}</select></label></div>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="voerSamenvoegingUit('${esc(bronId)}')">Samenvoegen</button>`;
  openModal(`Werkgroep samenvoegen — ${bron.naam}`, body, footer);
}

function voerSamenvoegingUit(bronId) {
  const doelId = document.getElementById('bhDoelWg').value;
  const bron = werkgroep(bronId), doel = werkgroep(doelId);
  if (!bron || !doel || bronId === doelId || subboomIds(bronId).includes(doelId)) return;

  AGRS.filter(a => a.werkgroepId === bronId).forEach(a => {
    a.werkgroepId = doelId;
    a.wg = werkgroepNaam(doelId).replace(' — ', ' / ');
  });
  DB.werkgroepen.filter(w => w.parentId === bronId).forEach(w => { w.parentId = doel.parentId ? doel.parentId : doelId; });
  for (const p of DB.personen) {
    if (!(p.lidmaatschappen || []).length) continue;
    p.lidmaatschappen.forEach(l => { if (l.werkgroepId === bronId) l.werkgroepId = doelId; });
    p.lidmaatschappen = p.lidmaatschappen.filter((l, i, all) =>
      all.findIndex(x => x.werkgroepId === l.werkgroepId) === i);
  }
  DB.werkgroepen = DB.werkgroepen.filter(w => w.id !== bronId);
  setDB(DB);
  bewaarDB();
  sluitModal();
  herrenderAlles();
  renderBeheer();
  toon(`"${bron.naam}" is samengevoegd met "${doel.naam}".`);
}

function nieuweWerkgroep() {
  const opties = DB.werkgroepen.filter(w => !w.parentId)
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
    .map(w => `<option value="${esc(w.id)}">${esc(w.naam)}</option>`).join('');
  const body = `
    <div class="frm-veld"><label>Naam *<input id="bhNieuwNaam" required placeholder="bijv. Werkgroep Hybride Zorg"></label></div>
    <div class="frm-rij">
      <div class="frm-veld"><label>Thematafel
        <select id="bhNieuwTafel"><option value="">—</option>
          ${Object.entries(TF_META).map(([k, m]) => `<option value="${k}">${esc(m.label)}</option>`).join('')}
        </select></label></div>
      <div class="frm-veld"><label>Valt onder (subwerkgroep van)
        <select id="bhNieuwParent"><option value="">— zelfstandige werkgroep —</option>${opties}</select></label></div>
    </div>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal()">Annuleren</button>
    <button class="btn-primary" onclick="slaNieuweWerkgroepOp()">Werkgroep toevoegen</button>`;
  openModal('Nieuwe (sub)werkgroep', body, footer);
}

function slaNieuweWerkgroepOp() {
  const naam = document.getElementById('bhNieuwNaam').value.trim();
  if (!naam) return;
  let id = 'WG_' + naam.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '').toUpperCase().slice(0, 48);
  while (DB.werkgroepen.some(w => w.id === id)) id += '_2';
  const parentId = document.getElementById('bhNieuwParent').value || null;
  DB.werkgroepen.push({ id, naam,
    tafel: document.getElementById('bhNieuwTafel').value || (parentId ? werkgroep(parentId)?.tafel || '' : ''),
    parentId, toelichting: '', gremium: false });
  bewaarDB();
  sluitModal();
  renderBeheer();
  toon(`Werkgroep "${naam}" toegevoegd.`);
}

function verwijderWerkgroep(id) {
  const w = werkgroep(id);
  if (!w) return;
  const inGebruik = AGRS.some(a => a.werkgroepId === id) ||
    DB.personen.some(p => (p.lidmaatschappen || []).some(l => l.werkgroepId === id)) ||
    DB.werkgroepen.some(x => x.parentId === id);
  if (inGebruik) { alert('Deze werkgroep is nog in gebruik. Voeg hem eerst samen met een andere werkgroep.'); return; }
  if (!confirm(`Lege werkgroep "${w.naam}" verwijderen?`)) return;
  DB.werkgroepen = DB.werkgroepen.filter(x => x.id !== id);
  setDB(DB);
  bewaarDB();
  renderBeheer();
  toon(`Werkgroep "${w.naam}" verwijderd.`);
}
