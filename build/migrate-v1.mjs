// Migratie schemaVersion 0 → 1 (eenmalig).
// - werkgroepen[]: genormaliseerd uit de vrije wg-strings + bestaande gremia (CONTACTS)
// - subwerkgroepen via parentId (patroon "Thema / Subthema")
// - voortgang[]: één startrecord per afspraak vanuit het oude vg-veld
// - personen[] en referentielijsten (AZWA-partijen, regionale tafels)
// Gebruik: node build/migrate-v1.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/data/dashboard-data.json';
const MIGRATIEDATUM = '2026-07-02';
const db = JSON.parse(readFileSync(FILE, 'utf8'));
if (db.schemaVersion !== 0) { console.error(`Onverwachte schemaVersion ${db.schemaVersion}; verwacht 0`); process.exit(1); }

// ── Gremia uit het PoC (CONTACTS) worden werkgroepen met vaste id ──
const GREMIUM_TAFEL = {
  WG_MEDTECH: 'T1', WG_HLO_TECH: 'T1', WG_DHZ: 'T1', BO_MEDTECH: 'T1',
  TF_OPSCHALING: 'T2', TF_DAI: 'T3', IBZ: 'T3',
  TF_ARBEIDSMARKT: 'IZA', TF_1LIJN: 'IZA', TF_ACUTE: 'IZA',
};

// ── Expliciete koppeling wg-string → bestaand gremium of samengevoegde werkgroep ──
const WG_OVERRIDES = {
  'Werkgroep Medische Technologie': 'WG_MEDTECH',
  'Werkgroep Digitale en Hybride Zorg': 'WG_DHZ',
  'Werkgroep Realisatie AI in de Zorg': 'TF_DAI',
  'Werkgroep Realisatie AI in de Zorg\nDoorbraakmiddel #3': 'TF_DAI',
  'Thematafel Opschaling Passende Zorg  /  BO IZA/AZWA': 'TF_OPSCHALING',
  'Sectorale/Sectoroverstijgende overleggen (coördinatie: FMS, NVZ, UMCNL, V&VN)': 'WG_SECT_OVERLEG',
  'Sectorale/Sectoroverstijgende overleggen': 'WG_SECT_OVERLEG',
  'Sectoroverstijgend overleg  /  Sectoraal overleg': 'WG_SECT_OVERLEG',
};

// Subwerkgroep-uitzondering: intensiveringsagenda valt onder DHZ
const SUB_OVERRIDES = {
  'Werkgroep Digitale en Hybride Zorg – Intensiveringsagenda':
    { id: 'WG_DHZ__INTENSIVERING', naam: 'Intensiveringsagenda DHZ', parentId: 'WG_DHZ' },
};

// Thema's waarvan "Thema / Subthema" wordt gesplitst in werkgroep + subwerkgroep
const SPLIT_PARENTS = [
  'Arbeidsmarkt', 'Concentratie en Spreiding', 'Digitalisering', 'Eerstelijnszorg',
  'Passende Contractering', 'Passende Zorg', 'Preventie', 'Regionale Samenwerking',
  'Samenwerking Acute Zorg',
];

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'EN').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();

const werkgroepen = [];
const byId = new Map();
function addWg(w) { if (!byId.has(w.id)) { byId.set(w.id, w); werkgroepen.push(w); } return byId.get(w.id); }

for (const c of db.contacts) {
  addWg({ id: c.id, naam: c.label, tafel: GREMIUM_TAFEL[c.id] || '', parentId: null,
          toelichting: c.toel || '', gremium: true });
}
addWg({ id: 'WG_SECT_OVERLEG', naam: 'Sectorale / sectoroverstijgende overleggen',
        tafel: 'IZA', parentId: null,
        toelichting: 'coördinatie: FMS, NVZ, UMC’s (NFU), V&VN', gremium: false });

// ── Mapping per unieke wg-string ──
const mapping = {}; // wg-string → werkgroepId (subwerkgroep-id indien van toepassing)
const tafelVoorWg = {}; // meest voorkomende thematafel per wg-string
for (const a of db.afspraken) {
  const key = a.wg || '';
  (tafelVoorWg[key] ||= {})[a.tf] = ((tafelVoorWg[key] || {})[a.tf] || 0) + 1;
}
const modeTafel = key => Object.entries(tafelVoorWg[key] || {}).sort((x, y) => y[1] - x[1])[0]?.[0] || '';

for (const key of [...new Set(db.afspraken.map(a => a.wg || ''))]) {
  if (!key) continue;
  if (WG_OVERRIDES[key]) { mapping[key] = WG_OVERRIDES[key]; continue; }
  if (SUB_OVERRIDES[key]) {
    const s = SUB_OVERRIDES[key];
    addWg({ id: s.id, naam: s.naam, tafel: modeTafel(key), parentId: s.parentId, toelichting: '', gremium: false });
    mapping[key] = s.id; continue;
  }
  const parent = SPLIT_PARENTS.find(p => key.startsWith(p + ' / '));
  if (parent) {
    const subNaam = key.slice(parent.length + 3).trim();
    const pid = 'WG_' + slug(parent);
    addWg({ id: pid, naam: parent, tafel: modeTafel(key), parentId: null, toelichting: '', gremium: false });
    const sid = pid + '__' + slug(subNaam);
    addWg({ id: sid, naam: subNaam, tafel: modeTafel(key), parentId: pid, toelichting: '', gremium: false });
    mapping[key] = sid;
  } else {
    const id = 'WG_' + slug(key.split('\n')[0]).slice(0, 48);
    addWg({ id, naam: key.split('\n')[0].trim(), tafel: modeTafel(key), parentId: null, toelichting: '', gremium: false });
    mapping[key] = id;
  }
}

// ── Afspraken: werkgroepId + mijlpalen; voortgang-seed uit vg ──
const voortgang = [];
let vid = 1;
for (const a of db.afspraken) {
  a.werkgroepId = mapping[a.wg || ''] || null;
  a.mijlpalen = [];
  if (a.vg && a.vg !== '—') {
    voortgang.push({
      id: 'VG-' + String(vid++).padStart(4, '0'),
      afspraakNr: a.nr, datum: MIGRATIEDATUM, auteur: 'Migratie PoC v3',
      status: a.status, toelichting: a.vg,
    });
  }
}

const out = {
  schemaVersion: 1,
  laatstGewijzigd: MIGRATIEDATUM,
  afspraken: db.afspraken,
  voortgang,
  werkgroepen,
  personen: [],
  referentie: {
    // Bewerkbaar via het dashboard (Beheer); onderstaande lijsten zijn een startpunt.
    azwaPartijen: [
      'VWS', 'ZN (Zorgverzekeraars Nederland)', 'ActiZ', 'de Nederlandse ggz',
      'FMS (Federatie Medisch Specialisten)', 'InEen', 'KNMP', 'LHV', 'NFU', 'NVZ',
      'Patiëntenfederatie Nederland', 'V&VN', 'VGN', 'VNG', 'ZKN', 'Zorgthuisnl',
    ],
    regioTafels: [
      'Noord-Nederland', 'Oost-Nederland', 'Zwolle e.o.', 'Midden-Nederland',
      'Noord-Holland & Flevoland', 'Amsterdam e.o.', 'West-Nederland',
      'Zuidwest-Nederland', 'Brabant', 'Limburg', 'Utrecht e.o.',
    ],
  },
};

writeFileSync(FILE, JSON.stringify(out, null, 1));
console.log(`Migratie klaar: ${out.afspraken.length} afspraken, ${werkgroepen.length} werkgroepen ` +
  `(${werkgroepen.filter(w => w.parentId).length} subwerkgroepen), ${voortgang.length} voortgangsrecords`);
console.log('\nMappingtabel wg-string → werkgroepId (ter review):');
for (const [k, v] of Object.entries(mapping)) console.log(`  ${v.padEnd(44)} ← ${k.replace(/\n/g, '\\n')}`);
