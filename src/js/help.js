// Hulp en onboarding: contexthulp per scherm (?-knop) en een rondleiding
// voor nieuwe gebruikers. Teksten hier bijhouden; docs/HANDLEIDING.md is de
// uitgebreide handleiding.

const HELP_TEKSTEN = {
  thematafels: `<p><b>Thematafels</b> groepeert alle afspraken per thematafel en werkgroep.</p>
    <ul><li>Klik op een afspraak voor het detailpaneel met status, tijdlijn en mijlpalen.</li>
    <li>Filter links op thematafel, bron, status of onderdeel; zoek op nummer, titel of trekker.</li>
    <li>Kopieer met 🔗 een link die je huidige filters onthoudt.</li>
    <li>⚠ markeert afspraken met deadlinerisico.</li></ul>`,
  lijst: `<p>De <b>Lijst</b> toont alle gefilterde afspraken als tabel met werkgroep, status en deadline.
    Klik op een rij voor het detailpaneel.</p>`,
  onderdelen: `<p><b>Onderdelen</b> groepeert de afspraken per IZA-onderdeel (AZWA, B t/m N).</p>`,
  deelnemers: `<p><b>Deelnemers</b> is het register van personen per (sub)werkgroep.</p>
    <ul><li>Voeg met <b>＋ Nieuwe deelnemer</b> iemand toe: naam, organisatie, rol, zakelijk
    e-mailadres, herkomst (AZWA-partij en regionale IZA-AZWA-tafel) en lidmaatschappen.</li>
    <li>Bekijk "wie zit waar" met de weergaven <b>Per partij</b>, <b>Per regio</b> en <b>Per werkgroep</b>.</li>
    <li>Exporteer de huidige selectie als CSV (opent in Excel).</li>
    <li>Beheer de keuzelijsten via <b>⚙ Lijsten</b>.</li>
    <li>AVG: registreer alleen zakelijke contactgegevens.</li></ul>`,
  rapportage: `<p><b>Rapportage</b> maakt een kwartaalrapportage voor bestuurlijke tafels.</p>
    <ul><li>Kies periode (kwartaal), thematafel en/of werkgroep als scope.</li>
    <li><b>🖨 PDF / afdrukken</b> geeft een nette afdrukversie — kies "Opslaan als PDF" als printer.</li>
    <li><b>⬇ CSV</b> exporteert de statustabel met risico's en laatste updates.</li></ul>`,
  algemeen: `<p><b>Gegevens bewaren en delen.</b> Wijzigingen worden automatisch in deze browser
    bewaard. Gebruik <b>⬇ Exporteer</b> (header) om alles als JSON-bestand te bewaren of te delen;
    een collega laadt dat bestand via <b>⬆ Importeer</b>. <b>↺ Herstel</b> zet de meegeleverde
    data terug.</p>
    <p><b>Sneltoetsen.</b> Esc sluit het detailpaneel of een venster.</p>
    <p>De volledige handleiding staat in <code>docs/HANDLEIDING.md</code> in de projectmap.</p>`,
};

function openHelp() {
  const context = HELP_TEKSTEN[curView] || '';
  const body = `<div class="help-tekst">${context}<div class="dp-divider"></div>${HELP_TEKSTEN.algemeen}</div>`;
  const footer = `
    <button class="btn-secondary" onclick="sluitModal(); startTour()">▶ Start rondleiding</button>
    <button class="btn-primary" onclick="sluitModal()">Sluiten</button>`;
  openModal('Hulp — ' + (VIEW_CONFIG[curView] ? {
    thematafels: 'Thematafels', lijst: 'Lijst', onderdelen: 'Onderdelen',
    deelnemers: 'Deelnemers', rapportage: 'Rapportage' }[curView] : 'Dashboard'), body, footer);
}

// ── Rondleiding ──
const TOUR_STAPPEN = [
  { titel: 'Welkom bij het IZA-AZWA Dashboard',
    tekst: 'Dit dashboard volgt de beleidsafspraken van de IZA-AZWA-samenwerking: voortgang, deelnemers en rapportages. Deze rondleiding duurt een halve minuut.' },
  { doel: '.hnav', titel: 'Weergaven',
    tekst: 'Wissel hier tussen de afspraakweergaven (Thematafels, Lijst, Onderdelen), het deelnemersregister en de rapportagemodule.' },
  { doel: '.sidebar-left', titel: 'Zoeken en filteren', view: 'thematafels',
    tekst: 'Filter op thematafel, bron, status of IZA-onderdeel en zoek op nummer, titel of trekker. Met 🔗 kopieer je een link die je filters onthoudt.' },
  { doel: '#detailPanel', titel: 'Detailpaneel: status en tijdlijn', view: 'thematafels',
    actie: () => { const a = AGRS[0]; if (a) showDetail(a.nr); },
    tekst: 'Klik op een afspraak voor alle details. Voeg met ＋ Statusupdate een update toe (datum, auteur, toelichting) en leg mijlpalen vast; ⚠ signaleert deadlinerisico.' },
  { doel: '#navD', titel: 'Deelnemers',
    actie: () => closeDetail(),
    tekst: 'Registreer wie in welke (sub)werkgroep zit, inclusief AZWA-partij en regionale tafel. Met de overzichten zie je in één oogopslag wie waar zit.' },
  { doel: '#navR', titel: 'Rapportage',
    tekst: 'Maak per kwartaal, thematafel of werkgroep een bestuurlijke rapportage en exporteer die als PDF of CSV.' },
  { doel: '.hdr-data', titel: 'Gegevens bewaren en delen',
    tekst: 'Wijzigingen worden automatisch in deze browser bewaard. Exporteer regelmatig een JSON-bestand als back-up of om te delen; importeren kan met één klik.' },
  { titel: 'Klaar!',
    tekst: 'Klik rechtsboven op ? voor hulp per scherm. Veel succes!' },
];
let tourIndex = -1;

function startTour() {
  tourIndex = -1;
  volgendeTourStap(1);
}

function volgendeTourStap(richting) {
  tourIndex += richting;
  if (tourIndex < 0) tourIndex = 0;
  if (tourIndex >= TOUR_STAPPEN.length) { eindigTour(); return; }
  const stap = TOUR_STAPPEN[tourIndex];
  if (stap.view && curView !== stap.view) setView(stap.view);
  if (stap.actie) stap.actie();
  toonTourStap(stap);
}

function toonTourStap(stap) {
  let overlay = document.getElementById('tourOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tourOverlay';
    document.body.appendChild(overlay);
  }
  const doelEl = stap.doel ? document.querySelector(stap.doel) : null;
  let marker = '';
  if (doelEl) {
    const r = doelEl.getBoundingClientRect();
    marker = `<div class="tour-marker" style="left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"></div>`;
  }
  const laatste = tourIndex === TOUR_STAPPEN.length - 1;
  overlay.innerHTML = `${marker}
    <div class="tour-kaart" role="dialog" aria-label="Rondleiding stap ${tourIndex + 1}">
      <div class="tour-titel">${esc(stap.titel)}</div>
      <div class="tour-tekst">${esc(stap.tekst)}</div>
      <div class="tour-voet">
        <span class="tour-teller">${tourIndex + 1} / ${TOUR_STAPPEN.length}</span>
        <button class="btn-secondary" onclick="eindigTour()">Overslaan</button>
        ${tourIndex > 0 ? '<button class="btn-secondary" onclick="volgendeTourStap(-1)">← Vorige</button>' : ''}
        <button class="btn-primary" onclick="${laatste ? 'eindigTour()' : 'volgendeTourStap(1)'}">${laatste ? 'Afronden' : 'Volgende →'}</button>
      </div>
    </div>`;
  const kaart = overlay.querySelector('.tour-kaart');
  if (doelEl) {
    const r = doelEl.getBoundingClientRect();
    const onderruimte = window.innerHeight - r.bottom;
    if (onderruimte > 190) { kaart.style.top = (r.bottom + 14) + 'px'; }
    else { kaart.style.bottom = (window.innerHeight - r.top + 14) + 'px'; }
    const links = Math.max(12, Math.min(r.left, window.innerWidth - 380));
    kaart.style.left = links + 'px';
  } else {
    kaart.style.top = '50%'; kaart.style.left = '50%';
    kaart.style.transform = 'translate(-50%,-50%)';
  }
  kaart.querySelector('.btn-primary').focus();
}

function eindigTour() {
  tourIndex = -1;
  const overlay = document.getElementById('tourOverlay');
  if (overlay) overlay.remove();
  closeDetail();
  if (curView !== 'thematafels') setView('thematafels');
  try { localStorage.setItem('izaTourGezien', '1'); } catch (e) { /* niets */ }
}

function startTourAlsNieuw() {
  try { if (localStorage.getItem('izaTourGezien')) return; } catch (e) { return; }
  startTour();
}
