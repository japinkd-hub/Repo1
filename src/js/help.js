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
  beheer: `<p><b>Beheer</b> is voor de dashboardbeheerder (secretaris/coördinator).</p>
    <ul><li><b>Aanleveringen samenvoegen</b>: verwerk de aanleverbestanden uit de Teams-map
    in één keer; dubbele updates worden automatisch overgeslagen.</li>
    <li><b>Excel-aanleversjabloon</b>: download het sjabloon per werkgroep en lees het
    ingevulde CSV-bestand weer in.</li>
    <li><b>Werkgroepen</b>: hernoem of voeg (sub)werkgroepen samen — afspraken, deelnemers
    en historie gaan automatisch mee.</li></ul>`,
  algemeen: `<p><b>Gegevens bewaren en delen.</b> Wijzigingen worden automatisch in deze browser
    bewaard. Met <b>📤 Deel wijzigingen</b> download je alleen je eigen updates als klein
    aanleverbestand voor de Teams-map "Aanleveringen"; de beheerder voegt die samen via het
    tabblad Beheer. <b>⬇ Exporteer</b> downloadt de complete datastand; een collega laadt die
    via <b>⬆ Importeer</b>. <b>↺ Herstel</b> zet de meegeleverde data terug.</p>
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
    deelnemers: 'Deelnemers', rapportage: 'Rapportage', beheer: 'Beheer' }[curView] : 'Dashboard'), body, footer);
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
    tekst: 'Wijzigingen worden automatisch in deze browser bewaard. Met "Deel wijzigingen" download je jouw updates als klein aanleverbestand voor de Teams-map; de beheerder voegt alle aanleveringen samen via het tabblad Beheer.' },
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

// Eerste bezoek: vraag of de gebruiker uitleg wil, in plaats van de
// rondleiding automatisch te starten. "Nee" sluit direct; daarna wordt
// de vraag nooit meer gesteld (herstarten kan altijd via de ?-knop).
function startTourAlsNieuw() {
  try { if (localStorage.getItem('izaTourGezien')) return; } catch (e) { return; }
  const body = `
    <p style="font-size:13px;line-height:1.55">Welkom bij het IZA-AZWA Dashboard.
    Wil je een korte uitleg (rondleiding van ±1 minuut) langs de belangrijkste functies?</p>
    <p class="frm-hint" style="margin-top:6px">Je kunt de rondleiding later altijd starten via de <b>?</b>-knop rechtsboven.</p>`;
  const footer = `
    <button class="btn-secondary" onclick="markeerTourGezien(); sluitModal()">Nee, direct beginnen</button>
    <button class="btn-primary" onclick="markeerTourGezien(); sluitModal(); startTour()">Ja, geef me de uitleg</button>`;
  openModal('Wil je uitleg bij het dashboard?', body, footer);
}

function markeerTourGezien() {
  try { localStorage.setItem('izaTourGezien', '1'); } catch (e) { /* niets */ }
}
