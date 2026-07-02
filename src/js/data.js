// Datalaag. Het object DATA wordt door build/build.mjs vóór dit bestand
// geïnjecteerd vanuit src/data/dashboard-data.json.
const AGRS = DATA.afspraken;
const CONTACTS = DATA.contacts;

function validateAGRS(data) {
  const required = ['nr','t','status','tf','wg','kern'];
  data.forEach(d => required.forEach(k => {
    if (!d[k]) console.warn(`Record ${d.nr}: veld '${k}' ontbreekt`);
  }));
}
validateAGRS(AGRS);
