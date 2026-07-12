# Handleiding IZA-AZWA Dashboard (v1.1)

Voor werkgroepsecretarissen en programmacoördinatoren van de IZA-AZWA-samenwerking.
Het dashboard is één HTML-bestand (`dist/AZWA_IZA_Dashboard.html`) dat zonder installatie
of server in elke moderne browser werkt (Edge, Chrome, Firefox, Safari).

---

## 1. Starten

1. Open `AZWA_IZA_Dashboard.html` door erop te dubbelklikken (of via *Bestand → Openen* in de browser).
2. Bij het eerste bezoek vraagt het dashboard: **"Wil je uitleg bij het dashboard?"**
   Kies *Ja* voor een korte rondleiding (±1 minuut) of *Nee, direct beginnen* om meteen te
   werken. De vraag verschijnt daarna niet meer; de rondleiding is altijd te starten via
   de **?**-knop rechtsboven.
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
- **💡 Signaleren aan de thematafel** — vink dit aan als de update een *nieuw inzicht of
  aandachtspunt* bevat (bijvoorbeeld overlap met een andere afspraak, of een besluit dat
  bestuurlijke aandacht vraagt). Gesignaleerde updates krijgen een aparte sectie
  "Signalen & nieuwe inzichten" in de kwartaalrapportage, zodat ze niet verdwijnen in de massa.
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

## 6a. Samenwerken via de Teams-map ("aanleveringen")

Zo houd je het dashboard met meerdere werkgroepen actueel zonder server:

**Als deelnemer of werkgroepsecretaris**
1. Open het dashboard en voer je statusupdates, mijlpalen en deelnemerswijzigingen in.
2. Klik in de header op **📤 Deel wijzigingen** (het cijfer toont hoeveel eigen wijzigingen
   er klaarstaan). Je downloadt een klein *aanleverbestand* met alleen jouw wijzigingen.
3. Zet dat bestand in de Teams-map **Aanleveringen**. Klaar.

Liever Excel? Vraag de beheerder om het **aanleversjabloon** van jouw werkgroep
(tabblad Beheer): vul per afspraak de kolommen *NieuweStatus*, *Datum*, *Auteur*,
*Toelichting* en eventueel *Signaal* (ja) in, sla op als CSV en zet het in dezelfde map.

**Als beheerder (één persoon per databestand)**
1. Open het dashboard met de actuele totaalstand (importeer zo nodig de laatste export).
2. Ga naar **Beheer → Aanleveringen samenvoegen** en selecteer alle bestanden uit de
   Teams-map in één keer. Ingevulde Excel-sjablonen lees je in via **Ingevuld sjabloon…**
3. Controleer het samenvoegverslag. Dubbel verwerken kan geen kwaad: updates die er al
   staan worden automatisch overgeslagen.
4. Exporteer de nieuwe totaalstand (**⬇ Exporteer**) naar de Teams-map en verplaats de
   verwerkte aanleveringen naar het archief.

## 6b. Werkgroepen beheren (hernoemen, samenvoegen)

Tabblad **Beheer → Werkgroepen**: hernoem een (sub)werkgroep (✎), voeg werkgroepen samen
(⇄, bijvoorbeeld wanneer subwerkgroepen fuseren) of maak een nieuwe (sub)werkgroep aan.
Bij samenvoegen gaan alle afspraken en deelnemers automatisch mee naar de doelwerkgroep en
blijft de volledige statushistorie bewaard; dubbele lidmaatschappen worden opgeruimd.
Maak vóór een samenvoeging altijd eerst een export (back-up) — samenvoegen kan niet
ongedaan worden gemaakt.

## 7. Gegevens bewaren, delen en samenwerken

- Wijzigingen worden **automatisch bewaard in je browser** (op deze computer, in deze browser).
- **⬇ Exporteer** (header): download alle data als JSON-bestand — dit is je back-up én het
  bestand waarmee je deelt. De bestandsnaam bevat de datum.
- **⬆ Importeer**: laad een JSON-bestand van een collega of een eerdere export. Het bestand
  wordt eerst gecontroleerd; bij fouten wordt niets overschreven.
- **↺ Herstel**: wist lokale wijzigingen en zet de meegeleverde data terug.

**Samenwerkingsafspraak:** één beheerder per databestand tegelijk. Deelnemers leveren
aan via **📤 Deel wijzigingen** of het Excel-sjabloon (zie §6a); de beheerder voegt samen
en verspreidt de nieuwe export via de Teams-map.

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
