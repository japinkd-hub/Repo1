# Plan: DigiDex v6 — Overstijgend sectorfiltersysteem

**Branch:** `claude/digidex-sector-filters-dvucy8` (v5 blijft onaangeroerd; v6 wordt een nieuw bestand)
**Visuele voorzet:** `Mockup_DigiDex_v6_sectorfilter.html`
**Status:** wacht op akkoord vóór implementatie

## 1. Doel

Een overstijgende, prominente knoppenbalk bovenop de DigiDex die filtert per sector
in zorg & welzijn: Sociaal domein, 1e lijn, 2e/3e lijn, VVT en GGZ. Dit vervangt de
huidige smalle sector-tabs in de rechterzijbalk, zodat er één duidelijk
sectorfiltersysteem overblijft.

## 2. Uitgangssituatie (v5)

- 42 processen, elk met `sectoren:[...]` op basis van zes codes: VVT, GGZ, HA, HAP, MSZ, SD.
- Bestaand sectorfilter: verticale tabs rechts (`buildSectorTabs`/`filterSector`), single-select.
- Bestaand bronfilter: STOZ / ZonMw VVH / Beide (`filterBron`), gecombineerd in `computeFiltered()`.
- URL-state-sync (`?bron=&sector=&kaart=`) en kopieer-link-knop aanwezig.
- Sectorkleuren staan al als CSS-variabelen in `:root` (--s-vvt, --s-ggz, …).

## 3. Sectorindeling (mapping op bestaande data)

| Knop | Subsectoren (datacodes) | Sub-chips zichtbaar? |
|---|---|---|
| Alle sectoren | alle | nee |
| Sociaal domein | SD | nee |
| 1e lijn | HA, HAP | ja: Alles / Huisartsen / Huisartsenpost |
| 2e/3e lijn | MSZ | nee |
| VVT | VVT | nee |
| GGZ | GGZ | nee |

**Besloten (3e lijn):** één gecombineerde knop "2e/3e lijn" voor zorgaanbieders.
De 3e-lijns/universitaire dimensie komt terug als aparte **🎓 Academische
link**-toggle rechts in de knoppenbalk: een aan/uit-filter dat met élke sectorknop
combineert en processen toont waarvan een gekoppelde STOZ-kennispartner van het
type "Academisch ziekenhuis/UMC" of "Universiteit" is (8 processen in de huidige
data, o.a. UMC Groningen en LUMC). GGZ is formeel ook 2e-lijns maar blijft
conform de opdracht een eigen knop.

## 4. Ontwerp (zie mockup)

1. **Knoppenbalk** boven de bronbalk: witte kaart-achtige balk met pill-knoppen,
   kleurstip + live teller per sector, actieve knop volledig ingekleurd in sectorkleur.
2. **Sub-chips** verschijnen alleen onder een actieve hoofdsector met meerdere
   subsectoren (nu alleen 1e lijn).
3. **Gedrag:** single-select (consistent met huidig filtergedrag); "Alle sectoren" reset.
   Sectorfilter × bronfilter × 🎓-toggle combineren; tellers rekenen live mee.
4. **🎓 Academische link**-toggle (gestippelde knop, rechts in de balk): filtert op
   processen met UMC-/universiteitskennispartner in de gekoppelde STOZ-data;
   combineert met elke sector- en bronkeuze.
5. **Zijbalk-tabs** vervallen (vervangen door de knoppenbalk) — keuze ter
   bevestiging, zie `Mockup_DigiDex_v6_variant_AB.html` voor het verschil
   (variant A = zonder zijbalk, aanbevolen; variant B = beide, gesynchroniseerd).
5. **URL-state:** `?sector=lijn1&sub=HA`; oude links met `?sector=VVT` blijven werken
   (legacy-codes worden naar de juiste hoofdsector gemapt).

## 5. Implementatiestappen (na akkoord)

1. `cp DigiDex_ZonMw_v5.html DigiDex_ZonMw_v6.html` — v5 blijft het werkende anker.
2. CSS: `.sector-bar`, `.sec-btn`, `.sub-chips` toevoegen (additief; bestaande regels ongemoeid).
3. HTML: knoppenbalk + sub-chips-container tussen `.page-header` en `.source-bar`;
   `#sector-tabs` uit `.machine-wrap` verwijderen.
4. JS (additief):
   - `const ECHELONS = [{id:'sd',label:'Sociaal domein',subs:['SD']}, …]`
   - state: `currentEchelon='all'`, `currentSub='all'` (vervangt `currentSector` intern,
     `sectorMatch()` behoudt zijn `_infokaart`/`_implkaart`-pass-through)
   - `filterEchelon()`, `filterSub()`, `buildSectorBar()` (met `data-ech`-attributen,
     géén positionele indexen)
   - tellers per knop = **unie** van subsector-matches × actieve bron (processen met
     meerdere sectoren niet dubbel tellen)
   - `getStateParams`/`loadFromURL` uitbreiden + legacy `?sector=`-mapping
5. Responsive: knoppenbalk wrapt op smal scherm (max-width 760px-kader bestaat al).
6. Verificatie: JS extraheren en `node --check`; browser-smoketest van alle
   knop×bron-combinaties, pips/teller/kaartnavigatie, URL-roundtrip; screenshot.

## 6. Lessen uit eerdere sessies (toegepast)

Uit de commit-historie van v4_fixed_3–5 en de v5-rebuilds:

- **Geen agressieve refactors**: geen IIFE-wrapping, geen hernoemen van bestaande
  ID's/classes — dat brak twee keer de onclick-handlers. Alleen additieve wijzigingen.
- **Werk vanaf de known-good baseline** (v5, commit e68863e) in een nieuw bestand.
- **Geen positionele selectors**: knoppen krijgen `data-ech`/`data-sub`-attributen,
  net als de `data-bron`-fix in v5.
- **Pass-through bewaken**: `_infokaart`/`_implkaart`-entries moeten elk sectorfilter
  passeren (de v5 `bronMatch`/`sectorMatch`-fix niet opnieuw breken).
- **CSS-volledigheid checken**: eerder slopen afgekapte regels erin; na elke bewerking
  het bestand integraal valideren.
- **`node --check`** op het geëxtraheerde script vóór elke commit.
