# Datamodel IZA-AZWA Dashboard — schemaVersion 1

Bron van waarheid: `src/data/dashboard-data.json` (meegebouwd in `dist/`).
In de browser leeft een werkkopie in localStorage; delen en back-uppen gaat via
**Exporteer / Importeer** in de dashboardheader. Import valideert tegen dit model
(`valideerDB()` in `src/js/data.js`).

```jsonc
{
  "schemaVersion": 1,
  "laatstGewijzigd": "2026-07-02",          // JJJJ-MM-DD, gezet bij elke opslag

  "afspraken": [{
    "nr": "1.1",                            // uniek afspraaknummer (string)
    "t": "…",                               // titel
    "kern": "…",                            // kerntekst van de afspraak
    "tf": "T1",                             // thematafel: T1 | T2 | T3 | IZA
    "wg": "…",                              // werkgroep als tekst (PoC, weergave)
    "werkgroepId": "WG_MEDTECH",            // v1: koppeling naar werkgroepen[].id
    "status": "…",                          // ruwe status; normStatus() → categorie
    "deadline": "Q1 2027",                  // vrij veld (kwartaal, datum of 'Doorlopend')
    "mijlpalen": [{                         // v1
      "id": "MP-0001", "titel": "…", "datum": "2026-10-01", "gehaald": false
    }],
    "trekker": "…", "prio": "…", "samenhang": "…", "bron": "…",
    "hlo": "…", "mib": "…", "ezk": "…", "src": "…", "ond": "…", "vg": "…"
    // vg = laatste PoC-voortgangstekst; historie staat in voortgang[]
  }],

  "voortgang": [{                           // v1: statushistorie per afspraak
    "id": "VG-0001",
    "afspraakNr": "1.1",                    // → afspraken[].nr
    "datum": "2026-07-02",                  // JJJJ-MM-DD
    "auteur": "…",
    "status": "Op schema",                  // één van de statuscategorieën (of ruwe PoC-status)
    "toelichting": "…"
  }],

  "werkgroepen": [{                         // v1: genormaliseerd uit wg-strings + gremia
    "id": "WG_EERSTELIJNSZORG__VISIE_2030",
    "naam": "Visie 2030",
    "tafel": "IZA",                         // T1 | T2 | T3 | IZA | ""
    "parentId": "WG_EERSTELIJNSZORG",       // null = hoofdwerkgroep; anders subwerkgroep
    "toelichting": "…",
    "gremium": true                         // true = aanspreekpunt-gremium uit het PoC (CONTACTS)
  }],

  "personen": [{                            // v1: deelnemerregistratie (AVG: alleen zakelijk)
    "id": "P-0001",
    "naam": "…", "organisatie": "…", "rol": "…", "email": "…",
    "azwaPartij": "…",                      // herkomst: AZWA-partij (referentielijst)
    "regioTafel": "…",                      // herkomst: regionale IZA-AZWA-tafel (referentielijst)
    "lidmaatschappen": [{ "werkgroepId": "WG_MEDTECH", "rol": "Lid" }]
  }],

  "referentie": {                           // bewerkbaar via het dashboard
    "azwaPartijen": ["VWS", "ZN (Zorgverzekeraars Nederland)", "…"],
    "regioTafels": ["Brabant", "…"]
  }
}
```

## Statusnormalisatie (v1, geconsolideerd)

Eén indeling (`STATUS_MAP` in `src/js/status.js`); het PoC had er twee naast elkaar.

| Categorie | Kleur | Ruwe PoC-statussen |
|---|---|---|
| Afgerond | `#2E7D32` | Afgerond, Structureel |
| Op schema | `#0277BD` | Op schema, In uitvoering |
| Gestart | `#F57C00` | Gestart, In voorbereiding, In opstart, Concept besproken*, In uitwerking, In ontwikkeling |
| Nog niet gestart | `#757575` | Nog niet gestart, Nog te starten, Nader te concretiseren, Nader uit te werken |
| Aandacht | `#C00000` | Achter op schema |
| Geparkeerd | `#aaa` | Geparkeerd, Niet geprioriteerd; ongoing |
| Onbekend | `#bbb` | — (leeg) |

Nieuwe statusupdates gebruiken de categorienamen zelf; de ruwe PoC-statussen blijven
geldig als invoer voor `normStatus()`.

## Migratie v0 → v1

Eenmalig uitgevoerd met `build/migrate-v1.mjs` (mappingtabel wg-string → werkgroepId
staat in de scriptoutput). Kernbeslissingen:

- 42 vrije `wg`-strings → 53 werkgroepen, waarvan 25 subwerkgroepen via het patroon
  "Thema / Subthema" (bijv. *Eerstelijnszorg / Visie 2030*).
- De 10 PoC-gremia (`CONTACTS`) zijn werkgroepen met `gremium: true`; hun ids
  (WG_MEDTECH, TF_DAI, …) zijn behouden voor de aanspreekpunten-logica.
- Drie "Sectorale/Sectoroverstijgende overleggen"-varianten zijn samengevoegd tot
  `WG_SECT_OVERLEG`.
- Het oude `vg`-veld is per afspraak omgezet naar één voortgangsrecord
  (auteur "Migratie PoC v3", datum 2026-07-02).
- Datafixes: bron "Passende Zorg" en onderdelen L/M/N toegevoegd aan de filterlijsten
  (in het PoC waren daardoor 21 afspraken standaard verborgen); onderdeel-labels
  gelijkgetrokken met de werkelijke data.

Bij een volgende schemawijziging: `schemaVersion` ophogen, migratielogica toevoegen
en dit document bijwerken.
