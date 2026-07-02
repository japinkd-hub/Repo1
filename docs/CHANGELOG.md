# Changelog — IZA-AZWA Dashboard

Alle noemenswaardige wijzigingen aan het dashboard worden hier vastgelegd.
Formaat gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/); versienummers volgen SemVer.

## [Unreleased]

### Toegevoegd
- Hulp en training: onboarding-rondleiding (start automatisch bij eerste bezoek,
  herstartbaar via de ?-knop), contexthulp per tabblad en een volledige Nederlandse
  gebruikershandleiding (`docs/HANDLEIDING.md`) met AVG-paragraaf en snelinstructie
  voor werkgroepsecretarissen.
- Tabblad **Rapportage**: kwartaalrapportage-view voor bestuurlijke tafels met
  samenvattingstegels, statusverdeling per thematafel en per werkgroep,
  risicotabel en statusupdates per periode; scope instelbaar op periode
  (kwartaal), thematafel of werkgroep. Export als PDF (print-geoptimaliseerde
  weergave) en CSV.
- Voortgangsrapportage per afspraak: statusupdates met datum, auteur en toelichting;
  tijdlijn (statushistorie) in het detailpaneel; mijlpalen met deadline en afvinken;
  risicosignalering (⚠) bij verstreken mijlpalen of een deadline binnen 90 dagen
  terwijl de afspraak niet op koers is. Deadline-teksten (Q-notatie, jaarbereiken)
  worden nu echt geparseerd; het PoC markeerde elk "Q1/Q2" als risico.
- Tabblad **Deelnemers**: registratie en beheer van personen (naam, organisatie,
  rol, zakelijk e-mailadres) met herkomst AZWA-partij en regionale IZA-AZWA-tafel,
  lidmaatschappen van (sub)werkgroepen, zoeken en filteren, overzichten "wie zit
  waar" per partij / regio / werkgroep en CSV-export. Referentielijsten (partijen,
  regiotafels) zijn in het dashboard te beheren.
- Datamodel schemaVersion 1: werkgroepen (incl. subwerkgroepen via `parentId`),
  voortgangslog per afspraak, personen (deelnemers) met AZWA-partij en regionale
  IZA-AZWA-tafel, bewerkbare referentielijsten en mijlpalen. Zie `docs/DATAMODEL.md`.
- Data-export (JSON-download), data-import met schemavalidatie en "Herstel" in de
  header; wijzigingen worden automatisch lokaal bewaard (localStorage).
- Aanspreekpunten in het detailpaneel tonen nu geregistreerde deelnemers per gremium.

### Opgelost
- 21 afspraken waren standaard onzichtbaar doordat bron "Passende Zorg" en de
  onderdelen L/M/N ontbraken in de filterlijsten; onderdeel-labels (B–N) kloppen nu
  met de werkelijke data.
- Dubbele statusnormalisatie geconsolideerd naar één indeling: Afgerond / Op schema /
  Gestart / Nog niet gestart / Aandacht / Geparkeerd (+ Onbekend).

### Gewijzigd
- PoC (`AZWA_IZA_Dashboard_v3.html`) gerefactord naar modulaire structuur: data in
  `src/data/dashboard-data.json`, logica in `src/js/`, styles in `src/css/`;
  `build/build.mjs` bundelt naar self-contained `dist/AZWA_IZA_Dashboard.html`.
  Functioneel identiek aan het PoC (regressiecheck: 17/17 PASS, 0 consolefouten).
