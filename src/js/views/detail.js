// Detailpaneel
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
  if (e.key !== 'Escape') return;
  if (modalIsOpen()) { sluitModal(); return; }
  closeDetail();
});
