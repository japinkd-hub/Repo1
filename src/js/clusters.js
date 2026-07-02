// Clustervoorstel-data en lookup
// === CLUSTERS ===
const CLUSTERS = [
  {
    id: 1,
    label: "Opschaling Medtech-innovaties",
    status: "In praktijk",
    nrs: ["1.3", "3.5", "3.7"],
    beschrijving: "Schaalbare innovaties, financiering bundelen & richten, en faciliteren & ondersteunen opschaling worden in de praktijk al als één samenhangende aanpak behandeld."
  },
  {
    id: 2,
    label: "Waardebepaling & Hybride Zorg",
    status: "In onderzoek",
    nrs: ["3.6", "DHZ-A", "E2-2"],
    beschrijving: "Verbinding tussen waardebepaling medtech-innovaties, geaccepteerd bewijs voor hybride zorg en de voorselectie/beoordeling van opschalingsstappen passende zorg."
  }
];

// Lookup: welk cluster hoort bij dit afspraaknummer?
function getAgrCluster(nr) {
  return CLUSTERS.find(cl => cl.nrs.includes(nr)) || null;
}
