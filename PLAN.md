# Plan van aanpak — IZA-AZWA Dashboard v1.0 (Fase 0)

Status: **concept, wacht op akkoord** · Datum: 2026-07-02 · Branch: `claude/iza-azwa-dashboard-v1-9e5i4c`

---

## 1. Analyse van PoC en repository

### 1.1 Wat er staat

| Bestand | Rol |
|---|---|
| `AZWA_IZA_Dashboard_v3.html` | **Leidend PoC** (1.430 regels, ~171 KB). 93 beleidsafspraken (`AGRS`), views: thematafels / lijst / onderdelen, detailpaneel, filters met URL-sync, HLO-zijbalk, voortgangsbalken, instelbaar detailpaneel (localStorage). |
| `AZWA_IZA_HLO_Clustering_Voorstel_v2.html` | Tweede PoC met cluster-/lijst-/funnelweergave, 12 clusters, eigen kopie van `AGRS` en `CONTACTS`. |
| `AZWA_IZA_Dashboard_v2.html`, `AZWA_IZA_HLO_Clustering_Voorstel.html` | Oudere versies (referentie). |
| `DigiDex_ZonMw_*.html` (3×) | Ander project — **buiten scope**. |

### 1.2 Datamodel PoC (v3)

- **`AGRS`** — 93 afspraken met o.a. `nr`, `t` (titel), `kern`, `tf` (T1: 30, T2: 12, T3: 23, IZA: 28), `wg` (werkgroep als vrije tekst), `trekker`, `deadline`, `status` (19 ruwe varianten), `vg` (voortgang, één vrij tekstveld), `prio`, `samenhang`, `bron`, `hlo`, `mib`, `ezk`, `src`, `ond`.
- **`CONTACTS`** — 10 gremia (werkgroepen/thematafels/overleggen) met `id`, `label`, `toel` en **lege `personen[]`**.
- **Statuslogica** — er zijn er *twee* naast elkaar: `STATUS_MAP` → 6 categorieën (Actief / Op schema / Aandacht / Niet gestart / Geparkeerd / Onbekend) én `STAT_GROUPS` → 5 categorieën (Afgerond / Op schema / Gestart / Nog niet gestart / Aandacht).
- **Risicosignalering** — `isDeadlineRisk()` bestaat al maar is grof (matcht elk "Q1"/"Q2", ongeacht jaartal).

### 1.3 Technische schuld

1. **Dataduplicatie**: `AGRS` en `CONTACTS` staan (uiteenlopend) in beide PoC-bestanden; wijzigingen driften uit elkaar.
2. **Dubbele statusnormalisatie** (§1.2) — verwarrend en foutgevoelig.
3. **Werkgroep is een string**, geen entiteit: 42 unieke `wg`-waarden, inconsistent gespeld (soms met `\n`, soms opsommingen van organisaties), geen koppeling met `CONTACTS.id`.
4. **Alles in één bestand**: data, logica, views en styles ongesepareerd; geen tests, geen versienummer in de data.
5. Voortgang (`vg`) is één overschrijfbaar tekstveld — geen historie, datum of auteur.

## 2. Scope v1

**Wel:** de twee kernfunctionaliteiten (voortgangsrapportage + deelnemerregistratie) bovenop het functioneel ongewijzigde v3-dashboard, met modulaire codebase, JSON-datalaag met import/export, rapportage-export, hulpfunctie en onderhoudsworkflow.

**Niet (v1):** server/backend, gelijktijdig bewerken door meerdere gebruikers, authenticatie, integratie van de funnel-/clusterweergave uit het Clustering-PoC (blijft als los bestand beschikbaar; zie open vraag OV-1), automatische Excel-inlezing van bronbestanden.

## 3. Architectuur en datamodel-uitbreiding

### 3.1 Bestandsstructuur (repo)

```
src/
  data/dashboard-data.json     # alle data, schemaVersion erin
  js/   data.js, status.js, filters.js, views/*.js,
        deelnemers.js, voortgang.js, rapportage.js, help.js, export.js
  css/  base.css, components.css, print.css
  index.html                   # skelet met include-markers
build/build.mjs                # bundelt src → dist (geen dependencies, Node)
dist/AZWA_IZA_Dashboard.html   # self-contained deliverable (werkt via file://)
tests/scenarios.md + smoke.spec.mjs (Playwright)
docs/HANDLEIDING.md, ONDERHOUD.md, CHANGELOG.md
```

Waarom een buildstap: ES-modules en `fetch()` van JSON werken niet via `file://`. De bron blijft modulair (tokenzuinig voor agents); de oplevering blijft één zelfstandig HTML-bestand zoals het PoC.

### 3.2 Datamodel v1 (JSON, `schemaVersion: 1`)

```jsonc
{
  "schemaVersion": 1, "laatstGewijzigd": "…",
  "afspraken":   [{ "nr": "1.1", …bestaande velden…, "werkgroepId": "WG_MEDTECH",
                    "mijlpalen": [{ "id","titel","datum","gehaald" }] }],
  "voortgang":   [{ "id","afspraakNr","datum","auteur","status","toelichting" }],
  "werkgroepen": [{ "id","naam","tafel","parentId","toelichting" }],   // parentId ⇒ subwerkgroep
  "personen":    [{ "id","naam","organisatie","rol","email",
                    "azwaPartij","regioTafel",
                    "lidmaatschappen": [{ "werkgroepId","rol" }] }],
  "referentie":  { "azwaPartijen": [...], "regioTafels": [...] }       // bewerkbaar in dashboard
}
```

- **Migratie**: eenmalig script normaliseert de 42 `wg`-strings naar `werkgroepen[]` (gekoppeld aan bestaande `CONTACTS`-id's waar mogelijk), zet het huidige `vg`-veld om naar één eerste voortgangsrecord per afspraak, en consolideert de statusnormalisatie naar **één** indeling: *Afgerond / Op schema / Gestart / Nog niet gestart / Aandacht* (+ *Geparkeerd*), met behoud van de ruwe status als bronveld.
- **Persistentie**: wijzigingen in het dashboard → localStorage (autosave) + expliciete **export/import van het JSON-databestand** (verliesvrij, met schemavalidatie bij import). Het JSON-bestand is de bron van waarheid en gaat mee in de repo.
- **AVG**: alleen naam, organisatie, rol en zakelijk e-mailadres; privacyparagraaf in de handleiding; export bevat waarschuwingsregel.

### 3.3 Schermontwerpen (tekstueel)

1. **Bestaande views** (thematafels/lijst/onderdelen + detailpaneel) — ongewijzigd, ZN-paars `#86004D`, plus per afspraak in het detailpaneel: statustijdlijn, mijlpalen, knop "Statusupdate toevoegen".
2. **Statusupdate-formulier** (modaal): datum (default vandaag), auteur, nieuwe status (dropdown genormaliseerd), toelichting. Schrijft een voortgangsrecord; laatste record bepaalt de actuele status.
3. **Tab "Deelnemers"**: tabel personen met filters (partij / regiotafel / werkgroep / organisatie), CRUD-formulier, matrixoverzichten "wie zit waar" (per partij, per regio, per werkgroep incl. subwerkgroepen), CSV-export.
4. **Tab "Rapportage"**: keuze periode + thematafel/werkgroep → kwartaalrapportage-view (samenvatting per tafel, statusverdeling, risico-afspraken = deadline binnen 90 dagen én status Nog niet gestart/Aandacht, recente updates) → **PDF via print-geoptimaliseerde weergave**, tabellen als **CSV (Excel-compatibel)**.
5. **Hulp**: "?"-knop → onboarding-tour (eerste bezoek), contexthulp per tab, link naar handleiding.

## 4. Agentteam (Fase 1)

Orchestratie door de hoofdagent (deze sessie); definities komen in `.claude/agents/`.

| Agent | Model | Taak |
|---|---|---|
| `architect` | Sonnet | Datamodel, bestandsstructuur, buildscript, migratie PoC → v1 |
| `feature-dev` | Sonnet | Bouwt increments 2–5 via gerichte diffs per module |
| `ux-designer` | Sonnet | Schermflows, WCAG AA, NL-microcopy, consistentie met PoC-huisstijl |
| `debugger` | Sonnet | Reproduceert en fixt bugs, schrijft regressietests |
| `tester` | Haiku | Draait testscenario's + Playwright-smoke (Chromium is voorgeïnstalleerd) |
| `docs-training` | Haiku | Handleiding, hulpteksten, onboarding-tour-teksten, instructie secretarissen |

Tokenzuinige werkregels uit de opdracht gelden onverkort: gerichte reads (regelbereiken), diffs i.p.v. herschrijvingen, per agent alleen de relevante modules, samenvattingen ≤ 10 regels.

## 5. Stappenplan

| # | Deliverable | Agent | Acceptatiecriterium | Omvang |
|---|---|---|---|---|
| 1 | Modulaire structuur + buildscript + JSON-datalaag; `dist/` functioneel identiek aan PoC v3 | architect + feature-dev | Regressiecheck: alle views/filters/detailpaneel werken als in v3; geen consolefouten; build < 5 s | L |
| 2 | Datamodel v1 + migratiescript (werkgroepen, voortgangslog, personen, referentielijsten) + import/export met validatie | architect | Import → export is verliesvrij; migratie levert valide schema; 93 afspraken behouden | M |
| 3 | Deelnemerregistratie-UI (CRUD, filters, matrixoverzichten, CSV-export) | feature-dev + ux-designer | Persoon aanmaken/wijzigen/verwijderen werkt; overzichten per partij/regio/werkgroep kloppen met testdata; export opent correct in Excel | L |
| 4 | Voortgangsrapportage-UI (statusupdate-formulier, tijdlijn, mijlpalen, risicosignalering) | feature-dev + ux-designer | Update wijzigt actuele status + verschijnt in tijdlijn; risicobadge verschijnt bij deadline < 90 dgn + status Nog niet gestart/Aandacht | L |
| 5 | Rapportagemodule (kwartaal-/tafelrapport, print-PDF, CSV) | feature-dev | Rapport per tafel/werkgroep/periode; nette PDF via browser-print; cijfers consistent met dashboard | M |
| 6 | Onboarding-tour, contexthulp, `HANDLEIDING.md`, instructie secretarissen | docs-training + ux-designer | Tour dekt alle tabs; handleiding dekt alle taken incl. import/export en AVG-paragraaf | M |
| 7 | Eindtest + release v1.0 (`CHANGELOG.md`, tag) | tester + debugger | Alle testscenario's groen; WCAG AA-basischeck; import/export verliesvrij; 0 consolefouten | M |
| 8 | Fase 3: `ONDERHOUD.md`, onderhouds-agentdefinities (triage/data-beheer/fix/regressie/release), vaste testscenario's | architect + docs-training | Workflow uitvoerbaar door een nieuwe sessie zonder extra context | M |

Na elke stap: testronde, werkende `dist/`-versie, changelog-regel, commit + push.

## 6. Risico's

| Risico | Mitigatie |
|---|---|
| Regressie bij refactor (stap 1 is de grootste ingreep) | Byte-for-byte vergelijking van gerenderde data + Playwright-smoke vóór en na; PoC blijft onaangeroerd in repo |
| Migratie van 42 vrije `wg`-strings vergt interpretatie | Mappingtabel als apart reviewbaar bestand; onduidelijke gevallen krijgen `tafel`-koppeling en label "te bevestigen" |
| Gegevensverlies bij localStorage-only gebruik | Export-herinnering bij afsluiten met onopgeslagen wijzigingen; import/export als primaire workflow in handleiding |
| Meerdere bewerkers overschrijven elkaars JSON | v1-werkafspraak in handleiding (één beheerder per datafile); merge-hulp is v2 |
| Print-PDF oogt anders per browser | Print-CSS testen in Chromium + aanwijzingen in handleiding |

## 7. Open vragen (aannames als er geen antwoord komt)

- **OV-1** Clusterweergave uit `AZWA_IZA_HLO_Clustering_Voorstel_v2.html` integreren in v1? *Aanname: nee, blijft los bestand; integratie is v1.1.*
- **OV-2** Lijsten **AZWA-partijen** en **regionale IZA-AZWA-tafels** zijn niet in het PoC aanwezig. *Aanname: bewerkbare referentielijsten in het dashboard, initieel gevuld met een beste-inschatting die de gebruiker corrigeert.*
- **OV-3** Excel-export: echte `.xlsx` vereist een embedded bibliotheek (~800 KB in het HTML-bestand). *Aanname: CSV (opent direct in Excel) + PDF via print; `.xlsx` alleen op verzoek.*
- **OV-4** Statusnormalisatie consolideren naar de 5 categorieën uit de opdracht + "Geparkeerd" als zesde. *Aanname: ja.*
