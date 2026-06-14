# CDS Monitor V2 — Top 5 Dashboard-opties
*Gebaseerd op analyse van de CDS Monitor V2 (31 IZA-regio's, 4 domeinen)*
*Datum: 14 juni 2026*

---

## Optie 1 — Interactieve Nederland-kaart (geo-dashboard)
**Aanbevolen voor: bestuurlijke en politieke rapportage**

Een klikbare kaart van Nederland met alle 31 IZA-regio's, RAG-gekleurd per domein:
- Rood = Niet gestart
- Grijs = Onbekend
- Geel = Verkenning
- Groen = Implementatie / Actief

Klik op een regio → detail pop-up met status op alle 4 domeinen (Datasamenwerking, PZP, Zorgcoördinatie, ICM).

**Filtermogelijkheden:** per zorgverzekeraar (CZ / VGZ / Menzis / Zilveren Kruis), per ROAZ-regio, per dataplatform (HinQ, KPN HEX, VIPPLive, Boards, Digizorg…)

**Technische opties:** Power BI + Shape Map, Tableau, of Plotly Dash + GeoJSON

**Meerwaarde:** Met één oogopslag ziet VWS/CDS waar de witte vlekken in Nederland zitten.

*Vergelijkbaar met: NHS England Regional Dashboards, RIVM COVID-regionaal dashboard*

---

## Optie 2 — Multidimensionele RAG-heatmap
**Aanbevolen voor: intern programmamanagement**

Matrix-weergave: **31 regio's (rijen) × 4 domeinen + KPI's (kolommen)**. Elke cel toont status én een volledigheidspercentage. Klik op een cel voor drilldown naar het detail.

Extra's:
- Automatisch berekende "Datavolledigheid %" per regio
- Sorteerbaar op slechtst-scorende regio's bovenaan
- Exporteerbaar naar PDF of Excel voor overleg
- Kleurcodering direct zichtbaar zonder toelichting nodig

**Technische opties:** Power BI Matrix visual, Google Looker Studio, of Streamlit (Python)

**Meerwaarde:** Directe prioritering — in één tabel zichtbaar welke regio's de meeste aandacht nodig hebben.

---

## Optie 3 — Gelaagd KPI Scorecard Dashboard
**Aanbevolen voor: voortgangsrapportage aan stuurgroep**

Drie lagen in één dashboard:

1. **KPI-tiles bovenaan** (snel overzicht):
   - % regio's gestart
   - Aantal koplopers
   - % contactpersonen bekend
   - Aantal actieve dataplatforms

2. **Domein-tabs** (klikbaar): Datasamenwerking / ICM / Zorgcoördinatie / PZP

3. **Regio-selectie** (filterpanel): zoom in op één regio of groep

Zodra een datum-kolom wordt toegevoegd, is ook een **trendlijn** mogelijk ("wat is er veranderd t.o.v. vorige maand?").

**Technische opties:** Power BI, Tableau, of Grafana

**Meerwaarde:** Stuurt op beweging in de data — ideaal als vaste slide in een maandelijkse stuurgroeprapportage.

*Vergelijkbaar met: VWS IZA-voortgangsrapportages, programmamonitors McKinsey/BCG*

---

## Optie 4 — Platform-ecosysteem Netwerk-visualisatie
**Aanbevolen voor: strategische analyse dataplatforms**

Sankey-diagram of netwerk-grafiek waarbij:
- **Links:** dataplatforms (HinQ, KPN HEX, VIPPLive, Boards, Digizorg, Zorgviewer…)
- **Rechts:** IZA-regio's
- **Lijndikte:** aantal use cases per platform (PZP / Zorgcoördinatie / 360-beeld)

Filtermogelijkheid per zorgverzekeraar om te zien wie welk platform stuurt.

**Technische opties:** D3.js, Plotly Dash, of Power BI Sankey custom visual

**Meerwaarde:** Strategisch inzicht — welke platforms winnen terrein, waar zijn schaalkansen, waar ontstaan afhankelijkheden?

---

## Optie 5 — Collaboratief Live Data-portaal (data-invoer + dashboard geïntegreerd)
**Aanbevolen voor: structurele, duurzame oplossing**

Combineer data-invoer en monitoring in één portaal:
- Elke regio-eigenaar logt in en ziet **alleen zijn eigen regio**
- Pre-ingevuld formulier op basis van wat al bekend is
- Invuller vult alleen de lege velden aan (± 10 minuten per regio)
- Dashboard updatet direct na opslaan
- Automatische herinnering bij ontbrekende data

**Technische opties:** Microsoft Power Apps (form) + SharePoint/Dataverse (backend) + Power BI (dashboard) — volledig binnen de Microsoft 365 omgeving

**Meerwaarde:** Lost tegelijkertijd het datakwaliteitsprobleem op. Geen handmatige Excel-rondes meer nodig. Regio's zijn eigenaar van hun eigen data.

---

## Vergelijkingsoverzicht

| # | Naam | Doelgroep | Techniek | Bouwtijd (schatting) |
|---|------|-----------|----------|----------------------|
| 1 | Nederland-kaart | Bestuur / VWS / extern | Power BI / Tableau | 2–3 dagen |
| 2 | RAG-heatmap | Programmamanagement | Power BI / Looker | 1–2 dagen |
| 3 | KPI Scorecard | Stuurgroep | Power BI / Tableau | 2–3 dagen |
| 4 | Netwerk-visualisatie | Strategie / analyse | D3.js / Plotly | 3–5 dagen |
| 5 | Collaboratief portaal | Regio-eigenaren | Power Apps + Power BI | 2–4 weken |

---

*Opgesteld op basis van analyse van CDS Monitor V2.xlsx — wereldwijde best practices voor gezondheidszorg monitoring dashboards (NHS, WHO, RIVM, VWS)*
