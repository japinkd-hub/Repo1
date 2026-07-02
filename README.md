# IZA-AZWA Dashboard

Operationeel dashboard voor de IZA-AZWA-samenwerking: 93 beleidsafspraken over
4 thematafels, met voortgangsrapportage (statusupdates, tijdlijn, mijlpalen,
risicosignalering), deelnemerregistratie per (sub)werkgroep en een
kwartaalrapportagemodule met PDF- en CSV-export. Nederlandstalig, zonder server:
één zelfstandig HTML-bestand.

**Gebruiken:** open `dist/AZWA_IZA_Dashboard.html` in een moderne browser.
Gebruikersdocumentatie: [`docs/HANDLEIDING.md`](docs/HANDLEIDING.md).

## Projectstructuur

```
dist/AZWA_IZA_Dashboard.html   ← de oplevering (gegenereerd, niet handmatig bewerken)
src/
  data/dashboard-data.json     ← alle data (schema: docs/DATAMODEL.md)
  js/                          ← logica en views (per module)
  css/                         ← basis-, component- en printstijlen
  index.html                   ← skelet met inject-markers
build/build.mjs                ← bundelt src/ → dist/ (node build/build.mjs)
tests/smoke.mjs                ← geautomatiseerde regressietest (node tests/smoke.mjs)
tests/scenarios.md             ← vaste handmatige testscenario's
docs/                          ← HANDLEIDING, DATAMODEL, CHANGELOG, ONDERHOUD
.claude/agents/                ← agentdefinities voor ontwikkeling en onderhoud
```

## Ontwikkelen

1. Wijzig bestanden in `src/` (nooit rechtstreeks in `dist/`).
2. Bouw: `node build/build.mjs`
3. Test: `node tests/smoke.mjs` (vereist Playwright met Chromium)
4. Werk `docs/CHANGELOG.md` bij en commit `src/` + `dist/` samen.

Onderhoudsproces en agentworkflow: [`docs/ONDERHOUD.md`](docs/ONDERHOUD.md).

De oorspronkelijke proof-of-concept-bestanden (`AZWA_IZA_Dashboard_v3.html`,
`AZWA_IZA_HLO_Clustering_Voorstel_v2.html` e.a.) blijven als referentie in de
repowortel staan; het cluster-/funnelvoorstel is bewust niet in v1 geïntegreerd.
