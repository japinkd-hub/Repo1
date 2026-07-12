# Vaste testscenario's — IZA-AZWA Dashboard

Draai na elke wijziging minimaal de geautomatiseerde smoketest; loop bij wijzigingen aan
een module ook de bijbehorende handmatige scenario's na.

**Geautomatiseerd:** `node build/build.mjs && node tests/smoke.mjs` (29 checks, alles moet PASS zijn).

## A. Basis (altijd)

| # | Scenario | Verwacht |
|---|---|---|
| A1 | Open `dist/AZWA_IZA_Dashboard.html` in de browser | Dashboard laadt, geen consolefouten (F12), "93 van 93 afspraken" |
| A2 | Wissel alle zes tabbladen | Elke view rendert; zijbalk verdwijnt bij Deelnemers/Rapportage/Beheer |
| A3 | Herlaad de pagina | Zelfde stand als voor het herladen |

## B. Filters & detailpaneel

| # | Scenario | Verwacht |
|---|---|---|
| B1 | Zet statuschip "Op schema" uit | Teller daalt; chip wordt grijs |
| B2 | Zoek op "innovatieplatform" | 1 resultaat (afspraak 1.1) |
| B3 | Klik 🔗 en open de gekopieerde link in een nieuw tabblad | Zelfde filters actief |
| B4 | Klik een afspraak aan | Detailpaneel met status, tijdlijn, mijlpalen; Esc sluit |

## C. Voortgang

| # | Scenario | Verwacht |
|---|---|---|
| C1 | ＋ Statusupdate: vandaag, jouw naam, "Op schema", toelichting | Status(pill) verandert; update bovenaan tijdlijn; voortgangsbalk verschuift |
| C2 | Verwijder de update (✕, bevestigen) | Vorige status hersteld |
| C3 | ＋ Mijlpaal met datum in het verleden | Mijlpaal met "verstreken"-badge; ⚠ deadlinerisico bij afspraak |
| C4 | Vink de mijlpaal af | Doorgestreept; risico verdwijnt (tenzij deadline zelf riskant) |

## D. Deelnemers

| # | Scenario | Verwacht |
|---|---|---|
| D1 | ＋ Nieuwe deelnemer, volledig ingevuld met 2 lidmaatschappen | Verschijnt in lijst met werkgroep-chips |
| D2 | Filter op partij, regio en werkgroep (ook hoofdwerkgroep bij sublidmaatschap) | Alleen passende deelnemers zichtbaar |
| D3 | Weergaven Per partij / Per regio / Per werkgroep | Correcte groepen en aantallen |
| D4 | Bewerk en verwijder een deelnemer | Wijziging direct zichtbaar; verwijderen vraagt bevestiging |
| D5 | ⚙ Lijsten: wijzig regiotafels | Nieuwe waarden in filter en formulier |
| D6 | ⬇ CSV | Opent correct in Excel, incl. werkgroepen en rollen |
| D7 | Open een Medtech-afspraak (bijv. 1.1) | Deelnemer van WG Medische Technologie bij Aanspreekpunten |

## E. Rapportage

| # | Scenario | Verwacht |
|---|---|---|
| E1 | Open Rapportage zonder filters | Tegels tellen op tot 93; 4 tafelbalken; risicotabel |
| E2 | Scope T1 / een werkgroep / een kwartaal | Aantallen en updatelijst volgen de scope |
| E3 | 🖨 PDF / afdrukken → Opslaan als PDF | Alleen het rapport, netjes op A4, tabellen niet afgekapt |
| E4 | ⬇ CSV | 93 rijen (zonder scope), kolommen incl. risico en laatste update |

## F. Gegevensbeheer

| # | Scenario | Verwacht |
|---|---|---|
| F1 | ⬇ Exporteer → ↺ Herstel → ⬆ Importeer het bestand | Alle wijzigingen exact terug (verliesvrij) |
| F2 | Importeer een kapot bestand (bijv. leeg .json) | Duidelijke foutmelding; bestaande data onaangetast |
| F3 | Header toont "(lokaal bewerkt)" na een wijziging | Ja, met datum |

## G. Hulp & toegankelijkheid

| # | Scenario | Verwacht |
|---|---|---|
| G1 | Eerste bezoek (of localStorage wissen) | Vraag "Wil je uitleg?" (zie I1); rondleiding via *Ja* heeft 8 stappen |
| G2 | ?-knop per tabblad | Contextuele hulptekst |
| G3 | Bedien filters en formulieren met alleen het toetsenbord | Tab-volgorde logisch, focus zichtbaar, Enter/spatie togglet chips, Esc sluit |
| G4 | Browser-zoom 200% | Interface blijft bruikbaar |

## I. Aanleveringen & beheer (v1.1)

| # | Scenario | Verwacht |
|---|---|---|
| I1 | Eerste bezoek (vers profiel) | Vraag "Wil je uitleg?"; *Nee* → direct werkbaar; *Ja* → rondleiding; vraag komt niet terug |
| I2 | Statusupdate met 💡-vinkje | Badge in tijdlijn; sectie "Signalen & nieuwe inzichten" in rapportage |
| I3 | Doe 2 wijzigingen → 📤 Deel wijzigingen | Badge telt 2; klein aanleverbestand gedownload |
| I4 | Beheer → Aanleveringen samenvoegen met dat bestand (op andere pc/profiel) | Verslag klopt; status en deelnemers overgenomen |
| I5 | Zelfde bestand nogmaals samenvoegen | "al aanwezig (overgeslagen)" — geen dubbelingen |
| I6 | Sjabloon downloaden per werkgroep, invullen, inlezen | Updates verwerkt; foute status/datum netjes gemeld |
| I7 | Werkgroep samenvoegen (sub → hoofd) | Afspraken, deelnemers en historie mee; bron weg; data valide |
| I8 | Werkgroep hernoemen en lege werkgroep verwijderen | Naam overal bijgewerkt; verwijderen alleen als leeg |

## H. Cross-browser (bij release)

Scenario's A1–A3, C1, D1, E3 en F1 in: Chrome/Edge (primair), Firefox, Safari.
