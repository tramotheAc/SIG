/**
 * Lecteur .xlsx minimal et rapide (≈ 10× plus rapide qu'ExcelJS sur 30 000 lignes).
 * Décompression ZIP (fflate) puis lecture directe du XML des feuilles (valeurs uniquement :
 * ni styles, ni formules, ni mise en forme — inutiles à l'import de données).
 * Les dates Excel arrivent sous forme de numéros de série : conversion dans excelParser (dateStr).
 */
import { unzipSync, strFromU8 } from 'fflate';
import type { RawWorkbook } from './excelParser';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decode(s: string): string {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

function colIndex(ref: string): number {
  let n = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/** Lecture d'attribut sans regex (appelée des centaines de milliers de fois). */
function attr(attrs: string, name: string): string | undefined {
  let i = attrs.indexOf(`${name}="`);
  while (i > 0 && attrs.charCodeAt(i - 1) > 32) i = attrs.indexOf(`${name}="`, i + 1);
  if (i < 0) return undefined;
  const start = i + name.length + 2;
  return attrs.slice(start, attrs.indexOf('"', start));
}

function textOf(xml: string): string {
  // Concatène tous les <t>…</t> (texte riche : plusieurs runs)
  let out = '';
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out += m[1];
  return decode(out);
}

export function readXlsxFast(buffer: ArrayBuffer): RawWorkbook {
  const files = unzipSync(new Uint8Array(buffer), {
    filter: (f) => f.name === 'xl/workbook.xml' || f.name === 'xl/_rels/workbook.xml.rels' || f.name === 'xl/sharedStrings.xml' || f.name.startsWith('xl/worksheets/sheet'),
  });
  const get = (name: string) => (files[name] ? strFromU8(files[name]) : undefined);
  const workbook = get('xl/workbook.xml');
  if (!workbook) throw new Error('Structure xlsx invalide (workbook.xml absent)');

  const rels = new Map<string, string>();
  for (const m of (get('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship\s([^>]*)\/?>/g)) {
    const id = attr(m[1], 'Id');
    const target = attr(m[1], 'Target');
    if (id && target) rels.set(id, target.replace(/^\/?(xl\/)?/, 'xl/'));
  }

  const shared: string[] = [];
  const ss = get('xl/sharedStrings.xml');
  if (ss) for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1]));

  const out: RawWorkbook = {};
  for (const m of workbook.matchAll(/<sheet\s([^>]*)\/?>/g)) {
    const name = decode(attr(m[1], 'name') ?? '');
    const rid = attr(m[1], 'r:id');
    const path = (rid && rels.get(rid)) ?? undefined;
    const xml = path ? get(path) : undefined;
    if (!xml) continue;
    out[name] = parseSheet(xml, shared);
  }
  return out;
}

function parseSheet(xml: string, shared: string[]): unknown[][] {
  const rows: unknown[][] = [];
  const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let rm: RegExpExecArray | null;
  let implicitRow = 0;
  while ((rm = rowRe.exec(xml))) {
    const r = attr(rm[1], 'r');
    const rowIdx = r ? Number(r) - 1 : implicitRow;
    implicitRow = rowIdx + 1;
    const body = rm[2];
    if (!body) continue;
    const row: unknown[] = [];
    let implicitCol = 0;
    let cm: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(body))) {
      const a = cm[1];
      const ref = attr(a, 'r');
      const ci = ref ? colIndex(ref) : implicitCol;
      implicitCol = ci + 1;
      const inner = cm[2];
      if (!inner) continue;
      const t = attr(a, 't');
      let v: unknown;
      if (t === 'inlineStr') v = textOf(inner);
      else {
        const vs = inner.indexOf('<v>');
        if (vs < 0) continue;
        const raw = inner.slice(vs + 3, inner.indexOf('</v>', vs));
        if (t === 's') v = shared[Number(raw)];
        else if (t === 'b') v = raw === '1';
        else if (t === 'str' || t === 'e') v = t === 'e' ? undefined : decode(raw);
        else {
          const n = Number(raw);
          v = Number.isFinite(n) ? n : decode(raw);
        }
      }
      row[ci] = v;
    }
    rows[rowIdx] = row;
  }
  for (let i = 0; i < rows.length; i++) rows[i] ??= [];
  return rows;
}
