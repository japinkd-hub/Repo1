// Views: thematafels, lijst, onderdelen + afspraaktegels
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
      <td><span class="status-pill" style="background:${sc};color:${statusTextColor(a.status)}">${esc(a.status)}</span></td>
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
        <span class="status-pill" style="background:${sc};color:${statusTextColor(a.status)}">${esc(a.status)}</span>
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
