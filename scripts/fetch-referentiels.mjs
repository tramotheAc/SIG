/**
 * Téléchargement des référentiels « fichiers » depuis data.gouv.fr → public/referentiels/
 *
 *   qpv.geojson       Quartiers prioritaires de la politique de la ville (ANCT, QPV 2024)
 *   zonage_abc.csv    Zonage ABC / Pinel par commune (insee;zone)
 *   zonage_apl.csv    Zonage APL 1/2/3 par commune (insee;zone)
 *
 * Usage :
 *   npm run referentiels:fetch
 *   npm run referentiels:fetch -- --qpv <url> --abc <url> --apl <url>   (URLs explicites)
 *
 * Les jeux sont recherchés via l'API data.gouv.fr ; la ressource retenue et son URL sont
 * affichées pour traçabilité (à reporter dans docs/SOURCES.md → millésime).
 * Les données sont restreintes aux départements du territoire (22, 29, 35, 56, 44).
 * Nécessite un accès Internet (non disponible dans certains environnements d'intégration).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import proj4 from 'proj4';

const DEPS = ['22', '29', '35', '56', '44'];
const OUT = new URL('../public/referentiels/', import.meta.url);
const API = 'https://www.data.gouv.fr/api/1';
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));

proj4.defs('EPSG:2154', '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
mkdirSync(OUT, { recursive: true });

async function get(url, as = 'json') {
  const res = await fetch(url, { headers: { 'User-Agent': 'atlas-patrimoine-poc' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return as === 'json' ? res.json() : as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

/** Cherche un jeu de données et retourne la meilleure ressource au format souhaité. */
async function findResource(query, formats, titleRe) {
  const res = await get(`${API}/datasets/?q=${encodeURIComponent(query)}&page_size=15`);
  for (const ds of res.data) {
    if (titleRe && !titleRe.test(ds.title)) continue;
    const r = ds.resources
      .filter((x) => formats.includes((x.format ?? '').toLowerCase()))
      .sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified))[0];
    if (r) return { dataset: ds.title, page: ds.page, url: r.url, format: r.format.toLowerCase(), modified: r.last_modified };
  }
  throw new Error(`Aucune ressource ${formats.join('/')} trouvée pour « ${query} »`);
}

const report = (name, info) => console.log(`\n✔ ${name}\n  jeu : ${info.dataset ?? '(URL fournie)'}\n  page : ${info.page ?? '-'}\n  ressource : ${info.url}\n  mise à jour : ${info.modified ?? 'inconnue'}`);

/* ---------------- QPV ---------------- */
async function qpv() {
  const info = args.qpv ? { url: args.qpv } : await findResource('quartiers prioritaires politique de la ville 2024', ['geojson', 'json'], /quartier|qpv/i);
  const fc = await get(info.url);
  const reproj = (c) => (Array.isArray(c[0]) ? c.map(reproj) : proj4('EPSG:2154', 'EPSG:4326', c));
  const needsReproj = JSON.stringify(fc.features[0]?.geometry?.coordinates ?? []).match(/\d{6,}/);
  const features = fc.features.filter((f) => {
    const p = f.properties ?? {};
    const dep = String(p.insee_dep ?? p.code_departement ?? p.dep ?? p.DEP ?? p.code_dep ?? '').padStart(2, '0');
    const com = String(p.insee_com ?? p.code_insee ?? p.commune_qp ?? '').slice(0, 2);
    return DEPS.includes(dep) || DEPS.includes(com) || (!dep.trim() && !com);
  });
  for (const f of features) {
    if (needsReproj) f.geometry.coordinates = reproj(f.geometry.coordinates);
    const p = f.properties;
    p.code ??= p.code_qp ?? p.CODE_QP ?? p.code_qpv;
    p.nom ??= p.lib_qp ?? p.nom_qp ?? p.NOM_QP ?? p.nom_qpv;
  }
  writeFileSync(new URL('qpv.geojson', OUT), JSON.stringify({ type: 'FeatureCollection', features }));
  report(`QPV (${features.length} quartiers sur le territoire)`, info);
}

/* ------------- Zonages communaux ------------- */
async function tableFrom(info) {
  if (info.format === 'csv' || /\.csv(\?|$)/i.test(info.url)) {
    const text = await get(info.url, 'text');
    const sep = (text.split('\n')[0].match(/;/g) ?? []).length ? ';' : ',';
    return text.split(/\r?\n/).filter(Boolean).map((l) => l.split(sep).map((c) => c.replace(/^"|"$/g, '').trim()));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await get(info.url, 'buffer'));
  const rows = [];
  wb.worksheets[0].eachRow((row) => rows.push(row.values.slice(1).map((v) => (v?.result ?? v?.text ?? v ?? '').toString().trim())));
  return rows;
}

async function zonage(name, query, titleRe, key, file, normalize) {
  const info = args[key] ? { url: args[key] } : await findResource(query, ['csv', 'xlsx', 'xls'], titleRe);
  const rows = await tableFrom(info);
  const headerIdx = rows.findIndex((r) => r.some((c) => /insee|codgeo|code.?commune|code_com/i.test(c)));
  const header = rows[headerIdx] ?? [];
  const ci = header.findIndex((c) => /insee|codgeo|code.?commune|code_com/i.test(c));
  const zi = header.findIndex((c, i) => i !== ci && /zon/i.test(c));
  if (ci < 0 || zi < 0) throw new Error(`Colonnes code INSEE / zone introuvables (en-tête : ${header.join(' | ')})`);
  const out = ['insee;zone'];
  for (const r of rows.slice(headerIdx + 1)) {
    const insee = String(r[ci]).padStart(5, '0');
    const z = normalize(String(r[zi]));
    if (DEPS.includes(insee.slice(0, 2)) && z) out.push(`${insee};${z}`);
  }
  writeFileSync(new URL(file, OUT), out.join('\n'));
  report(`${name} (${out.length - 1} communes)`, info);
}

const normAbc = (z) => {
  const s = z.toUpperCase().replace(/\s|ZONE/g, '');
  return s === 'ABIS' ? 'Abis' : ['A', 'B1', 'B2', 'C'].includes(s) ? s : undefined;
};
const normApl = (z) => z.match(/[123]/)?.[0];

const tasks = [
  ['QPV', qpv],
  ['Zonage ABC', () => zonage('Zonage ABC / Pinel', 'zonage ABC communes', /abc/i, 'abc', 'zonage_abc.csv', normAbc)],
  ['Zonage APL', () => zonage('Zonage APL', 'zonage aides personnelles au logement APL communes', /apl|aides? personnelles/i, 'apl', 'zonage_apl.csv', normApl)],
];
let failed = 0;
for (const [name, fn] of tasks) {
  try {
    await fn();
  } catch (e) {
    failed++;
    console.error(`\n✖ ${name} : ${e.message}\n  → fournir l'URL explicitement (voir docs/SOURCES.md) ou déposer le fichier dans public/referentiels/.`);
  }
}
process.exit(failed ? 1 : 0);
