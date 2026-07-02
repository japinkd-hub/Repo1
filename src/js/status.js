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
const STATUS_MAP = {
  "Gestart":                           "Actief",
  "In uitvoering":                     "Actief",
  "In uitwerking":                     "Actief",
  "In opstart":                        "Actief",
  "In voorbereiding":                  "Actief",
  "Concept besproken":                 "Actief",
  "Concept besproken (23 mrt 2026)":   "Actief",
  "In ontwikkeling":                   "Actief",
  "Nader uit te werken":               "Actief",
  "Nader te concretiseren":            "Actief",
  "Op schema":                         "Op schema",
  "Structureel":                       "Op schema",
  "Achter op schema":                  "Aandacht",
  "Nog niet gestart":                  "Niet gestart",
  "Nog te starten":                    "Niet gestart",
  "Geparkeerd":                        "Geparkeerd",
  "Niet geprioriteerd; ongoing":       "Geparkeerd",
  "—":                                 "Onbekend"
};
const STATUS_NORM_COLORS = {
  "Actief":       "#0277BD",
  "Op schema":    "#2E7D32",
  "Aandacht":     "#C00000",
  "Niet gestart": "#888",
  "Geparkeerd":   "#aaa",
  "Onbekend":     "#bbb"
};
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

const SRC_COLORS = {
  Medtech:"#1565C0", DHZ:"#2E75B6", E2:"#2E7D32", E3:"#558B2F",
  AI:"#6A1B9A", IZA:"#86004D", Overig:"#555"
};

const SRC_LABELS = {
  Medtech:"Medtech", DHZ:"DHZ", E2:"AZWA E2", E3:"AZWA E3",
  AI:"AI", IZA:"IZA Overig", Overig:"Overig"
};

const OND_LABELS = {
  AZWA:"AZWA", A:"A — Passende zorg", B:"B — Regionale samenwerking",
  C:"C — Acute zorg", D:"D — Concentratie & spreiding",
  E:"E — Eerstelijnszorg", F:"F — GGZ & Sociaal domein",
  G:"G — Preventie", H:"H — Arbeidsmarkt", I:"I — Digitalisering",
  J:"J — Contractering", K:"K — Financiën"
};

const STAT_GROUPS = {
  "Afgerond":[/^afgerond$/i,/^structureel$/i,/^niet geprioriteerd; ongoing$/i],
  "Op schema":[/^op schema$/i,/^in uitvoering$/i],
  "Gestart":[/^gestart$/i,/^in voorbereiding$/i,/^in opstart$/i,
              /^concept besproken/i,/^in uitwerking$/i,/^in ontwikkeling$/i],
  "Nog niet gestart":[/^nog niet gestart$/i,/^nog te starten$/i,
                       /^nader te concretiseren$/i,/^nader uit te werken$/i],
  "Aandacht":[/^achter op schema$/i,/^geparkeerd$/i]
};

const STAT_COLORS = {
  "Afgerond":"#2E7D32","Op schema":"#0277BD","Gestart":"#F57C00",
  "Nog niet gestart":"#888","Aandacht":"#C00000","—":"#bbb"
};

function statGroup(status) {
  for (const [g, pats] of Object.entries(STAT_GROUPS))
    if (pats.some(p => p.test(status))) return g;
  return "—";
}

function statColor(status) {
  return STATUS_NORM_COLORS[normStatus(status)] || "#bbb";
}

function tfColor(tf) { return (TF_META[tf]||{color:"#888"}).color; }
