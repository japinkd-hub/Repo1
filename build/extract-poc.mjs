// Eenmalige extractie: splitst AZWA_IZA_Dashboard_v3.html (PoC) in
// data (JSON), styles, body-html en script — als basis voor de src/-modules.
// Gebruik: node build/extract-poc.mjs <uitvoermap>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const SRC = 'AZWA_IZA_Dashboard_v3.html';
const outDir = process.argv[2] || 'build/extract-out';
mkdirSync(outDir, { recursive: true });

const html = readFileSync(SRC, 'utf8');

// Vind een top-level array-literal na "const NAME" en match haakjes,
// met respect voor strings en escapes.
function sliceArrayLiteral(source, constName) {
  const declRe = new RegExp(`const ${constName}\\s*=\\s*\\[`);
  const m = declRe.exec(source);
  if (!m) throw new Error(`const ${constName} niet gevonden`);
  const start = m.index + m[0].length - 1; // positie van '['
  let depth = 0, inStr = null, esc = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) return { text: source.slice(start, i + 1), declStart: m.index, end: i + 1 };
    }
  }
  throw new Error(`Array van ${constName} niet gesloten`);
}

const agrs = sliceArrayLiteral(html, 'AGRS');
const contacts = sliceArrayLiteral(html, 'CONTACTS');
const AGRS = vm.runInNewContext('(' + agrs.text + ')');
const CONTACTS = vm.runInNewContext('(' + contacts.text + ')');
console.log(`AGRS: ${AGRS.length} afspraken, CONTACTS: ${CONTACTS.length} gremia`);

writeFileSync(path.join(outDir, 'dashboard-data.json'),
  JSON.stringify({ schemaVersion: 0, afspraken: AGRS, contacts: CONTACTS }, null, 1));

// Styles
const style = html.match(/<style>([\s\S]*?)<\/style>/);
writeFileSync(path.join(outDir, 'poc-styles.css'), style[1].trim() + '\n');

// Script, met de datadeclaraties eruit geknipt
const scriptM = /<script>([\s\S]*?)<\/script>/.exec(html);
const scriptStart = scriptM.index + '<script>'.length;
let js = scriptM[1];
// posities relatief t.o.v. script-inhoud
function cutDecl(jsText, constName) {
  const s = sliceArrayLiteral(jsText, constName);
  // knip t/m puntkomma/regeleinde na de array
  let end = s.end;
  while (end < jsText.length && /[;\s]/.test(jsText[end])) { end++; if (jsText[end - 1] === '\n') break; }
  return jsText.slice(0, s.declStart) + jsText.slice(end);
}
js = cutDecl(js, 'AGRS');
js = cutDecl(js, 'CONTACTS');
writeFileSync(path.join(outDir, 'poc-script.js'), js.trim() + '\n');

// Body-html: alles binnen <body> zonder style/script
const body = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html)[1]
  .replace(/<script>[\s\S]*?<\/script>/, '<!--INJECT:SCRIPTS-->')
  .trim();
writeFileSync(path.join(outDir, 'poc-body.html'), body + '\n');

// Head zonder style
const head = /<head>([\s\S]*?)<\/head>/.exec(html)[1]
  .replace(/<style>[\s\S]*?<\/style>/, '<!--INJECT:STYLES-->')
  .trim();
writeFileSync(path.join(outDir, 'poc-head.html'), head + '\n');
console.log('Extractie klaar →', outDir);
