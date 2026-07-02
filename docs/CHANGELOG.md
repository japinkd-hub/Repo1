# Changelog — IZA-AZWA Dashboard

Alle noemenswaardige wijzigingen aan het dashboard worden hier vastgelegd.
Formaat gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/); versienummers volgen SemVer.

## [Unreleased]

### Gewijzigd
- PoC (`AZWA_IZA_Dashboard_v3.html`) gerefactord naar modulaire structuur: data in
  `src/data/dashboard-data.json`, logica in `src/js/`, styles in `src/css/`;
  `build/build.mjs` bundelt naar self-contained `dist/AZWA_IZA_Dashboard.html`.
  Functioneel identiek aan het PoC (regressiecheck: 17/17 PASS, 0 consolefouten).
