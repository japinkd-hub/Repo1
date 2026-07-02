// Zijbalken: clusters, HLO, voortgangsbalken + aanspreekpunten
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
    const personen = personenVoorWerkgroep(cg.id);
    h += '<div class="dp-contact-group">';
    h += `<div class="dp-contact-group-label">${esc(cg.naam)}${cg.toelichting?`<span class="dp-contact-toel"> — ${esc(cg.toelichting)}</span>`:''}</div>`;
    if (!personen.length) {
      h += '<div class="dp-contact-empty">Nog niet ingevuld — voeg deelnemers toe via het tabblad Deelnemers</div>';
    } else {
      for (const p of personen) {
        if (p.email) allEmails.push(p.email);
        h += `<div class="dp-contact-person">`;
        if (p.organisatie) h += `<span class="dp-contact-branche">${esc(p.organisatie)}</span>`;
        h += `<span class="dp-contact-naam">${esc(p.naam||'—')}${p.rol?` <span style="color:#888;font-weight:400">(${esc(p.rol)})</span>`:''}</span>`;
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
  const NORM_CATS = [...STATUS_CATS, "Onbekend"];
  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px">';
  for (const [tfKey, tfMeta] of Object.entries(TF_META)) {
    const tfAgrs = AGRS.filter(a => a.tf === tfKey);
    if (!tfAgrs.length) continue;
    const counts = {};
    NORM_CATS.forEach(c => counts[c] = 0);
    tfAgrs.forEach(a => { const ns = normStatus(a.status); counts[ns] = (counts[ns]||0)+1; });
    const total = tfAgrs.length;
    const onTrack = (counts["Afgerond"]||0) + (counts["Op schema"]||0) + (counts["Gestart"]||0);
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
        <span style="font-size:10px;color:#888">${onTrack}/${total} (${pct}% loopt of klaar)</span>
      </div>
      <div style="height:8px;border-radius:4px;overflow:hidden;background:#eee;display:flex">${barSegs}</div>
    </div>`;
  }
  html += '</div>';
  el.innerHTML = html;
}
