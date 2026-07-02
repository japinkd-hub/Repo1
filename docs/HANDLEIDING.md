# Handleiding IZA-AZWA Dashboard (v1.0)

Voor werkgroepsecretarissen en programmacoördinatoren van de IZA-AZWA-samenwerking.
Het dashboard is één HTML-bestand (`dist/AZWA_IZA_Dashboard.html`) dat zonder installatie
of server in elke moderne browser werkt (Edge, Chrome, Firefox, Safari).

---

## 1. Starten

1. Open `AZWA_IZA_Dashboard.html` door erop te dubbelklikken (of via *Bestand → Openen* in de browser).
2. Bij het eerste bezoek start automatisch een korte **rondleiding**. Later opnieuw starten:
   klik rechtsboven op **?** en kies *▶ Start rondleiding*.
3. Rechtsboven in de header zie je de **datastand** (datum van de laatste wijziging) en de
   knoppen voor gegevensbeheer (zie §7).

## 2. Schermopbouw

| Onderdeel | Functie |
|---|---|
| Header | Weergaven (tabbladen), gegevensbeheer, hulp (**?**) |
| Linkerzijbalk | Zoeken, filters, clustering, legenda (alleen bij afspraakweergaven) |
| Hoofdvlak | De gekozen weergave |
| Detailpaneel (rechts) | Alle informatie over één afspraak |
| Statusbalk (onder) | Legenda statuskleuren |

## 3. Afspraken bekijken (Thematafels / Lijst / Onderdelen)

- **Thematafels**: afspraken gegroepeerd per thematafel en werkgroep.
- **Lijst**: tabel met werkgroep, status en deadline.
- **Onderdelen**: gegroepeerd per IZA-onderdeel (AZWA, B t/m N).
- Zoek in de zijbalk op nummer, titel of trekker; filter op thematafel, bron, status of onderdeel.
- **🔗 Filterlink**: kopieert een URL die je huidige filters onthoudt — handig om een selectie te delen.
- **⚠** bij een afspraak betekent **deadlinerisico**: een mijlpaal is verstreken, of de deadline
  valt binnen 90 dagen terwijl de afspraak nog niet gestart is of aandacht vraagt.

## 4. Voortgang bijhouden

Open een afspraak (klik erop) en gebruik in het detailpaneel:

- **＋ Statusupdate** — leg een update vast met datum, auteur, nieuwe status en toelichting.
  De nieuwste update bepaalt de actuele status van de afspraak. Alle updates blijven zichtbaar
  in de **tijdlijn**; een foutieve update verwijder je met ✕ (de vorige status wordt dan hersteld).
- **＋ Mijlpaal** — leg tussenstappen met een datum vast en vink ze af zodra ze gehaald zijn.
  Niet-afgevinkte mijlpalen waarvan de datum is verstreken geven een risicosignaal.

**Statuscategorieën:** Afgerond · Op schema · Gestart · Nog niet gestart · Aandacht · Geparkeerd.

## 5. Deelnemers registreren

Tabblad **Deelnemers**:

1. Klik **＋ Nieuwe deelnemer** en vul in: naam, organisatie, rol, zakelijk e-mailadres,
   herkomst **AZWA-partij**, herkomst **regionale IZA-AZWA-tafel** en één of meer
   **lidmaatschappen** van (sub)werkgroepen met de rol daarin.
2. Bewerk of verwijder met ✎ / 🗑 in de lijst; klik in de groepsweergaven op een persoon om te bewerken.
3. **Wie zit waar**: schakel tussen *Lijst*, *Per partij*, *Per regio* en *Per werkgroep*.
4. **⬇ CSV** exporteert de huidige selectie als deelnemerslijst (opent in Excel).
5. **⚙ Lijsten**: beheer de keuzelijsten met AZWA-partijen en regiotafels.

De geregistreerde deelnemers verschijnen automatisch als **aanspreekpunten** in het
detailpaneel van bijbehorende afspraken.

## 6. Rapportage

Tabblad **Rapportage**:

1. Kies de scope: **periode** (kwartaal), **thematafel** en/of **werkgroep**.
2. Het rapport toont samenvattingstegels, statusverdeling per tafel en werkgroep,
   de afspraken met deadlinerisico en de statusupdates in de gekozen periode.
3. **🖨 PDF / afdrukken**: opent het printvenster; kies *Opslaan als PDF* voor een
   PDF-bestand voor de bestuurlijke tafel.
4. **⬇ CSV**: exporteert de complete statustabel (opent in Excel).

**Kwartaalritme (advies):** verwerk vóór elke bestuurlijke rapportageronde eerst alle
statusupdates, controleer de risicotabel en exporteer daarna PDF + JSON-back-up.

## 7. Gegevens bewaren, delen en samenwerken

- Wijzigingen worden **automatisch bewaard in je browser** (op deze computer, in deze browser).
- **⬇ Exporteer** (header): download alle data als JSON-bestand — dit is je back-up én het
  bestand waarmee je deelt. De bestandsnaam bevat de datum.
- **⬆ Importeer**: laad een JSON-bestand van een collega of een eerdere export. Het bestand
  wordt eerst gecontroleerd; bij fouten wordt niets overschreven.
- **↺ Herstel**: wist lokale wijzigingen en zet de meegeleverde data terug.

**Samenwerkingsafspraak (v1):** één beheerder per databestand tegelijk. Werkwijze:
de beheerder exporteert → collega's leveren wijzigingen aan (of werken na elkaar) →
de beheerder importeert/verwerkt en verspreidt de nieuwe export. Bewaar exports op een
gedeelde, beveiligde locatie (bijv. SharePoint/Teams van de samenwerking).

## 8. Privacy (AVG)

- Registreer **alleen zakelijke contactgegevens**: naam, organisatie, functie/rol en
  zakelijk e-mailadres. Geen privé-adressen, telefoonnummers of andere persoonsgegevens.
- Deel exports (JSON/CSV met deelnemers) alleen binnen de samenwerking en bewaar ze op een
  beveiligde locatie. Verwijder deelnemers die de samenwerking verlaten.
- Grondslag: gerechtvaardigd belang (werkcontact binnen de samenwerking). Wijs deelnemers
  erop dat ze geregistreerd staan en verwijder op verzoek.

## 9. Veelgestelde vragen

**Ik zie mijn wijzigingen niet op een andere computer.** Wijzigingen staan lokaal in de browser.
Exporteer op de ene computer en importeer op de andere.

**Import geeft een foutmelding.** Het bestand voldoet niet aan het datamodel (zie
`docs/DATAMODEL.md`). Controleer of je het juiste, ongewijzigde exportbestand gebruikt.

**Kan ik iets terugdraaien?** Een statusupdate of mijlpaal verwijder je met ✕. Alles kwijt?
Importeer je laatste JSON-export, of gebruik ↺ Herstel voor de meegeleverde stand.

**De PDF ziet er anders uit dan het scherm.** De afdrukweergave is bewust versoberd voor A4.
Chrome/Edge geven het strakste resultaat.

**Esc** sluit het detailpaneel en vensters.

---

## Bijlage: snelinstructie voor werkgroepsecretarissen

Jouw taak per kwartaal, in vijf stappen (±15 minuten per werkgroep):

1. **Open** het dashboard en filter op jouw werkgroep (zoekveld of tabblad Deelnemers → Per werkgroep).
2. **Werk de status bij** van elke afspraak van jouw werkgroep: open de afspraak →
   **＋ Statusupdate** → datum, je naam/organisatie, status en een korte toelichting
   (wat is er gebeurd, wat is de volgende stap?).
3. **Controleer mijlpalen**: vink gehaalde mijlpalen af en voeg nieuwe toe voor het komende kwartaal.
4. **Controleer de deelnemerslijst** van je werkgroep: kloppen namen, rollen en e-mailadressen?
   Verwerk wijzigingen direct (tabblad Deelnemers).
5. **Exporteer** de data (⬇ Exporteer) en stuur het JSON-bestand naar de programmacoördinator,
   of bewaar het op de afgesproken gedeelde locatie.

Vragen? Klik rechtsboven op **?** voor hulp per scherm.
