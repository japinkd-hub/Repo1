// Bundelt src/ naar één self-contained dashboard-HTML (werkt via file://).
// Gebruik: node build/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = p => path.join(root, p);
const read = p => readFileSync(r(p), 'utf8');

const CSS_FILES = ['src/css/base.css', 'src/css/components.css', 'src/css/print.css'];
const JS_FILES = [
  'src/js/data.js',
  'src/js/ui.js',
  'src/js/export.js',
  'src/js/help.js',
  'src/js/status.js',
  'src/js/clusters.js',
  'src/js/filters.js',
  'src/js/views/overzichten.js',
  'src/js/views/detail.js',
  'src/js/views/sidebar.js',
  'src/js/views/voortgang.js',
  'src/js/views/deelnemers.js',
  'src/js/views/rapportage.js',
  'src/js/settings.js',
  'src/js/main.js',
];

const data = JSON.parse(read('src/data/dashboard-data.json'));

const css = CSS_FILES.filter(f => existsSync(r(f)))
  .map(f => `/* ── ${f} ── */\n` + read(f)).join('\n');

const js = [
  `// Gegenereerd door build/build.mjs — bewerk src/, niet dit bestand.`,
  `const DATA = ${JSON.stringify(data)};`,
  ...JS_FILES.filter(f => existsSync(r(f))).map(f => `// ── ${f} ──\n` + read(f)),
].join('\n');

let html = read('src/index.html');
if (!html.includes('<!--INJECT:STYLES-->') || !html.includes('<!--INJECT:SCRIPTS-->'))
  throw new Error('INJECT-markers ontbreken in src/index.html');
html = html.replace('<!--INJECT:STYLES-->', () => `<style>\n${css}\n</style>`);
html = html.replace('<!--INJECT:SCRIPTS-->', () => `<script>\n${js}\n</script>`);

const out = r('dist/AZWA_IZA_Dashboard.html');
writeFileSync(out, html);
console.log(`Gebouwd: dist/AZWA_IZA_Dashboard.html (${(html.length / 1024).toFixed(0)} KB, ` +
  `${data.afspraken.length} afspraken, schemaVersion ${data.schemaVersion})`);
