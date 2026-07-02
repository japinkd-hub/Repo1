// Regressie-smoketest IZA-AZWA Dashboard.
// Draaien: node tests/smoke.mjs   (bouwt niet zelf; draai eerst node build/build.mjs)
// Vereist Playwright + Chromium (in de Claude-omgeving voorgeïnstalleerd).
import { readFileSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const DASHBOARD_URL = new URL('../dist/AZWA_IZA_Dashboard.html', import.meta.url).href;
const browser = await chromium.launch();
const page = await browser.newContext().then(c => c.newPage());
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
// Rondleiding niet automatisch starten tijdens tests
await page.addInitScript(() => { try { localStorage.setItem('izaTourGezien', '1'); } catch (e) { /* niets */ } });
await page.goto(DASHBOARD_URL);
await page.waitForTimeout(400);

const res = {};

// ── Laden & data-integriteit ──
res['dashboard laadt'] = (await page.title()).includes('AZWA / IZA');
res['schemaVersion 1, validatie 0 fouten'] = await page.evaluate(() =>
  DB.schemaVersion === 1 && valideerDB(DB).length === 0);
res['93 afspraken, alle met werkgroepId'] = await page.evaluate(() =>
  AGRS.length === 93 && AGRS.every(a => a.werkgroepId));
res['alle statussen normaliseerbaar'] = await page.evaluate(() =>
  AGRS.every(a => normStatus(a.status) !== undefined));
res['normStatus(Aandacht) is Aandacht'] = await page.evaluate(() => normStatus('Aandacht') === 'Aandacht');
res['export/import roundtrip verliesvrij'] = await page.evaluate(() =>
  JSON.stringify(JSON.parse(JSON.stringify(DB))) === JSON.stringify(DB));

// ── Afspraakviews ──
res['thematafels: alle afspraken zichtbaar'] = (await page.textContent('#result-count')).includes('93 van 93');
await page.click('#navL');
res['lijstview rendert 93 rijen'] = await page.locator('#listBody tr').count() === 93;
await page.click('#navO');
res['onderdelenview rendert'] = await page.locator('.ond-section').count() >= 10;
await page.click('#navT');

// Filters
await page.locator('#stat-chips .chip').first().click();
const naFilter = await page.textContent('#result-count');
res['statusfilter filtert'] = !naFilter.includes('93 van 93');
await page.locator('#stat-chips .chip').first().click();
await page.fill('#q', 'innovatieplatform');
await page.evaluate(() => applyFilters());
res['zoeken werkt'] = (await page.textContent('#result-count')).startsWith('1 van');
await page.fill('#q', '');
await page.evaluate(() => applyFilters());

// ── Detailpaneel & voortgang ──
await page.evaluate(() => showDetail('1.1'));
res['detailpaneel opent met tijdlijn'] = (await page.innerHTML('#dpBody')).includes('Tijdlijn');
await page.click('text=＋ Statusupdate');
await page.fill('#vgAuteur', 'Smoketest');
await page.selectOption('#vgStatus', 'Op schema');
await page.fill('#vgToel', 'Smoketest-update');
await page.click('text=Update opslaan');
await page.waitForTimeout(200);
res['statusupdate past afspraak aan'] = await page.evaluate(() =>
  AGRS.find(a => a.nr === '1.1').status === 'Op schema');
await page.click('text=＋ Mijlpaal');
await page.fill('#mpTitel', 'Smoketest-mijlpaal');
await page.fill('#mpDatum', '2020-01-01');
await page.click('text=Mijlpaal toevoegen');
await page.waitForTimeout(200);
res['verstreken mijlpaal geeft risico'] = await page.evaluate(() =>
  isDeadlineRisk(AGRS.find(a => a.nr === '1.1')));

// ── Deelnemers ──
await page.click('#navD');
await page.click('text=＋ Nieuwe deelnemer');
await page.fill('#pfNaam', 'Smoke Tester');
await page.fill('#pfPartij', 'ZN (Zorgverzekeraars Nederland)');
await page.selectOption('#pfLms .pf-lm-wg', 'WG_MEDTECH');
await page.click('text=Deelnemer toevoegen');
await page.waitForTimeout(200);
res['deelnemer toegevoegd'] = (await page.innerHTML('#dlBody')).includes('Smoke Tester');
await page.click('#dlvW');
res['overzicht per werkgroep'] = (await page.innerHTML('#dlBody')).includes('Medische Technologie');
await page.click('#dlvL');

// ── Rapportage ──
await page.click('#navR');
await page.waitForTimeout(200);
res['rapportage rendert'] = (await page.innerHTML('#rpBody')).includes('Kwartaalrapportage IZA-AZWA');
const dl = page.waitForEvent('download');
await page.click('#viewRapportage button:has-text("CSV")');
const csv = readFileSync(await (await dl).path(), 'utf8');
res['rapportage-CSV: 93 datarijen'] = csv.trim().split('\r\n').length === 94;
await page.emulateMedia({ media: 'print' });
res['printweergave verbergt interface'] = await page.evaluate(() =>
  getComputedStyle(document.querySelector('header')).display === 'none');
await page.emulateMedia({ media: 'screen' });

// ── Hulp ──
await page.click('.hdr-help-btn');
res['contexthulp opent'] = (await page.textContent('#modalRoot')).includes('Rapportage');
await page.keyboard.press('Escape');
res['escape sluit modal'] = await page.evaluate(() => !document.querySelector('#modalRoot .modal-overlay'));

// ── Persistentie & herstel ──
await page.reload(); await page.waitForTimeout(400);
res['wijzigingen overleven herladen'] = await page.evaluate(() =>
  DB.personen.some(p => p.naam === 'Smoke Tester') && AGRS.find(a => a.nr === '1.1').status === 'Op schema');
page.once('dialog', d => d.accept());
await page.evaluate(() => herstelDB());
await page.waitForTimeout(200);
res['herstel zet meegeleverde data terug'] = await page.evaluate(() =>
  DB.personen.length === 0 && AGRS.find(a => a.nr === '1.1').status === 'Nog niet gestart');

res['0 consolefouten'] = errors.length === 0 || errors.join(' | ');

let fail = 0;
for (const [k, v] of Object.entries(res)) {
  const ok = v === true;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}${ok ? '' : ' → ' + JSON.stringify(v)}`);
}
console.log(fail ? `\n${fail} van ${Object.keys(res).length} checks FAALDEN` : `\nAlle ${Object.keys(res).length} checks geslaagd`);
await browser.close();
process.exit(fail ? 1 : 0);
