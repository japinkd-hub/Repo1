# Onderhoudsworkflow IZA-AZWA Dashboard

Lichtgewicht, herhaalbaar proces voor beheer en doorontwikkeling. Uitvoerbaar door een
nieuwe Claude-sessie (Sonnet of Haiku) zonder extra context: dit document + de
agentdefinities in `.claude/agents/` bevatten alles wat nodig is.

## Vaste feiten

- Bron: `src/` · Oplevering: `dist/AZWA_IZA_Dashboard.html` (gegenereerd — nooit handmatig bewerken)
- Bouwen: `node build/build.mjs` · Regressietest: `node tests/smoke.mjs` (24 checks)
- Data: `src/data/dashboard-data.json`, schema in `docs/DATAMODEL.md` (schemaVersion 1)
- Handmatige scenario's: `tests/scenarios.md` · Gebruikersdocs: `docs/HANDLEIDING.md`
- Wijzigingslog: `docs/CHANGELOG.md` (Keep a Changelog, SemVer)

## Agentteam onderhoud

| Agent (`.claude/agents/`) | Model | Rol |
|---|---|---|
| `onderhoud-triage` | Haiku | Verzoeken innemen, classificeren (bug / datawijziging / feature / vraag), impact schatten |
| `onderhoud-data` | Haiku | Periodieke data-updates verwerken en valideren |
| `onderhoud-fix` | Sonnet | Bugfixes en kleine features via gerichte diffs; groot werk eerst als voorstel |
| `tester` | Haiku | Regressietest na elke wijziging (smoke + relevante scenario's) |
| `onderhoud-release` | Haiku | Versienummer, changelog, commit/push, notificatietekst |

Escaleer alleen naar een zwaarder model bij hardnekkige bugs of ontwerpvragen.

## Proces per verzoek

```
verzoek → onderhoud-triage ─┬─ datawijziging → onderhoud-data ─┐
                            ├─ bug / kleine feature → onderhoud-fix ─┤→ tester → onderhoud-release
                            ├─ groot → voorstel aan gebruiker (stop) │
                            └─ vraag → beantwoorden (klaar)          ┘
```

1. **Triage** — classificeer en kies de route (zie agentdefinitie).
2. **Uitvoeren** — data-update of fix, altijd in `src/`, altijd met changelog-regel.
3. **Regressietest** — `node build/build.mjs && node tests/smoke.mjs`; bij UI-wijzigingen
   ook de betrokken scenario's uit `tests/scenarios.md`. Rood = terug naar stap 2.
4. **Release** — alleen bij groene tests: versie bumpen, changelog-sectie, commit + push,
   notificatietekst voor gebruikers.

**Definition of done:** tests groen, 0 consolefouten, export→import verliesvrij,
NL-interface, changelog bijgewerkt, `src/` en `dist/` samen gecommit.

## Kwartaalritme (vóór elke bestuurlijke rapportageronde)

1. Vraag de actuele JSON-export of Excel-aanlevering op bij de programmacoördinator.
2. `onderhoud-data`: verwerk statusupdates en deelnemerswijzigingen; valideer.
3. `tester`: smoke + scenario's E (rapportage) en F (gegevensbeheer).
4. `onderhoud-release`: patch-release met changelog en gebruikersnotificatie.
5. Herinner de secretarissen aan de snelinstructie in `docs/HANDLEIDING.md` (bijlage).

## Randvoorwaarden

- Geen externe dependencies of servers introduceren; het dashboard blijft één zelfstandig
  HTML-bestand.
- Huisstijl: ZN-paars `#86004D`, statuskleuren en labels uit `src/js/status.js`.
- Schemawijzigingen: `schemaVersion` ophogen + migratie + `docs/DATAMODEL.md` bijwerken —
  altijd eerst als voorstel voorleggen.
- AVG: alleen zakelijke contactgegevens in de data; geen persoonsgegevens in changelog,
  commits of issues.
