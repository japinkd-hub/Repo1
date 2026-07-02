// Gedeelde UI-helpers: modals en meldingen
function openModal(titel, bodyHtml, footerHtml) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) sluitModal()">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitel">
        <div class="modal-hdr">
          <h2 id="modalTitel">${esc(titel)}</h2>
          <button class="modal-close" onclick="sluitModal()" aria-label="Venster sluiten">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>`;
  const eerste = root.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
  if (eerste) eerste.focus();
}

function sluitModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

function modalIsOpen() {
  return !!document.querySelector('#modalRoot .modal-overlay');
}

// Kort bevestigingsbericht rechtsonder
function toon(bericht) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = bericht;
  el.className = 'zichtbaar';
  clearTimeout(toon._t);
  toon._t = setTimeout(() => { el.className = ''; }, 2600);
}
