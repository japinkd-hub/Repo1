// Statuslogica, kleuren en labels (PoC-huisstijl)
// ═══ HLO-CLUSTER DATA ════════════════════════════════════════
const HLO_COLORS = {
  'C5':'#DEEBF7','C6':'#FCE4D6','C7':'#E2EFDA','C8':'#FFF2CC',
  'C11':'#FDEBD0','C13':'#EAD1DC','C14':'#F4CCCC','C15':'#D0E4F1','C16':'#E8DAEF'
};
const HLO_TEXT_COLORS = {
  'C5':'#1F4E79','C6':'#833C00','C7':'#375623','C8':'#7F6000',
  'C11':'#833C00','C13':'#4A0020','C14':'#C00000','C15':'#1F4E79','C16':'#4A235A'
};
function hloColor(val) {
  if (!val || val==='—') return '#F2F2F2';
  const first = val.split('/')[0].trim().split(' ')[0];
  return HLO_COLORS[first] || '#F2F2F2';
}
function hloTextColor(val) {
  if (!val || val==='—') return '#666';
  const first = val.split('/')[0].trim().split(' ')[0];
  return HLO_TEXT_COLORS[first] || '#333';
}
// Eén statusnormalisatie (v1): ruwe PoC-statussen → zes categorieën + Onbekend.
// Nieuwe statusupdates gebruiken de categorieën zelf als status.
const STATUS_CATS = ["Afgerond","Op schema","Gestart","Nog niet gestart","Aandacht","Geparkeerd"];
const STATUS_MAP = {
  "Afgerond":                          "Afgerond",
  "Structureel":                       "Afgerond",
  "Op schema":                         "Op schema",
  "In uitvoering":                     "Op schema",
  "Gestart":                           "Gestart",
  "In voorbereiding":                  "Gestart",
  "In opstart":                        "Gestart",
  "Concept besproken":                 "Gestart",
  "Concept besproken (23 mrt 2026)":   "Gestart",
  "In uitwerking":                     "Gestart",
  "In ontwikkeling":                   "Gestart",
  "Nog niet gestart":                  "Nog niet gestart",
  "Nog te starten":                    "Nog niet gestart",
  "Nader te concretiseren":            "Nog niet gestart",
  "Nader uit te werken":               "Nog niet gestart",
  "Achter op schema":                  "Aandacht",
  "Geparkeerd":                        "Geparkeerd",
  "Niet geprioriteerd; ongoing":       "Geparkeerd",
  "—":                                 "Onbekend"
};
const STATUS_NORM_COLORS = {
  "Afgerond":         "#2E7D32",
  "Op schema":        "#0277BD",
  "Gestart":          "#F57C00",
  "Nog niet gestart": "#888",
  "Aandacht":         "#C00000",
  "Geparkeerd":       "#aaa",
  "Onbekend":         "#bbb"
};
const ALL_STATUS_FILTER_KEYS = [...STATUS_CATS, "Onbekend", "⚠ Deadlinerisico"];
function normStatus(raw){ return STATUS_MAP[raw] || "Onbekend"; }
function isDeadlineRisk(a){
  const dl = (a.deadline||"").toLowerCase();
  const riskDl = dl.includes("q1 2026") || dl.includes("q2 2026") || dl.includes("q1") || dl.includes("q2");
  const riskStat = ["Niet gestart","Aandacht"].includes(normStatus(a.status));
  return riskDl && riskStat;
}
const TF_META = {
  T1:{label:"T1 — Medische technologie & digitale zorg",color:"#1565C0",short:"Medtech & DHZ"},
  T2:{label:"T2 — Opschaling Passende Zorg",color:"#2E7D32",short:"Passende Zorg"},
  T3:{label:"T3 — Databeschikbaarheid & AI",color:"#6A1B9A",short:"AI"},
  IZA:{label:"IZA — Overige Afspraken",color:"#86004D",short:"IZA Overig"}
};

// Bron- en onderdeellijsten volgen de werkelijke datawaarden (v1-fix: in het
// PoC ontbraken 'Passende Zorg' en L/M/N, waardoor 21 afspraken standaard
// verborgen waren; ook klopten enkele onderdeel-labels niet met de data).
const SRC_COLORS = {
  Medtech:"#1565C0", DHZ:"#2E75B6", "Passende Zorg":"#375623",
  AI:"#6A1B9A", IZA:"#86004D"
};

const SRC_LABELS = {
  Medtech:"Medtech", DHZ:"DHZ", "Passende Zorg":"Passende Zorg",
  AI:"AI", IZA:"IZA Overig"
};

const OND_LABELS = {
  AZWA:"AZWA",
  B:"B — Opschaling passende zorg (E2/E3)",
  D:"D — Digitalisering & gegevensuitwisseling",
  E:"E — Passende contractering",
  F:"F — Regionale samenwerking",
  G:"G — GGZ & sociaal domein",
  H:"H — Aanpak regeldruk",
  I:"I — Acute zorg",
  J:"J — Passende zorg",
  K:"K — Concentratie & spreiding",
  L:"L — Eerstelijnszorg",
  M:"M — Preventie",
  N:"N — Arbeidsmarkt"
};

function statColor(status) {
  return STATUS_NORM_COLORS[normStatus(status)] || "#bbb";
}

function tfColor(tf) { return (TF_META[tf]||{color:"#888"}).color; }
