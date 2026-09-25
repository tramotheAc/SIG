/**
 * Référentiels déposés sous forme de fichiers (public/referentiels) :
 * QPV (GeoJSON), zonages APL et ABC/Pinel (CSV).
 * Lecture tolérante : fichiers officiels en Lambert-93 ou Web Mercator reprojetés, CSV Excel
 * (séparateur ; , ou tabulation, colonnes quelconques repérées par leur en-tête).
 */
import type { FeatureCollection, Position } from 'geojson';
import proj4 from 'proj4';
import { zonageFiles } from '../../config/layers.config';
import '../excel/coordinates'; // enregistre EPSG:2154 dans proj4
import { ServiceError } from './http';

async function fetchText(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-cache' });
  } catch (e) {
    throw new ServiceError('Fichier inaccessible (serveur local arrêté ?).', String(e));
  }
  if (res.status === 404) throw new ServiceError('Fichier absent.', url, 404);
  if (!res.ok) throw new ServiceError(`Lecture impossible (HTTP ${res.status}).`, url);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new ServiceError('Fichier absent.', `HTML reçu pour ${url}`, 404);
  return text.replace(/^﻿/, '');
}

const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const p = fn();
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return cache.get(key) as Promise<T>;
}

/* ------------------------------ GeoJSON ------------------------------ */

function firstCoord(c: unknown): Position | undefined {
  let x = c;
  while (Array.isArray(x) && Array.isArray(x[0])) x = x[0];
  return Array.isArray(x) && typeof x[0] === 'number' ? (x as Position) : undefined;
}

function mapCoords(c: unknown, f: (p: Position) => Position): unknown {
  if (Array.isArray(c) && typeof c[0] === 'number') return f(c as Position);
  return Array.isArray(c) ? c.map((x) => mapCoords(x, f)) : c;
}

/** Détecte le système de coordonnées d'un GeoJSON et le ramène en WGS84. */
export function normalizeGeoJson(fc: FeatureCollection & { crs?: { properties?: { name?: string } } }): FeatureCollection {
  const sample = fc.features.map((f) => firstCoord((f.geometry as { coordinates?: unknown } | null)?.coordinates)).find(Boolean);
  if (!sample) return fc;
  const crsName = fc.crs?.properties?.name ?? '';
  let from: string | undefined;
  if (/2154/.test(crsName) || (Math.abs(sample[0]) > 1000 && sample[1] > 6_050_000 && sample[1] < 7_200_000 && sample[0] > 0)) from = 'EPSG:2154';
  else if (/3857|900913/.test(crsName) || Math.abs(sample[0]) > 180) from = 'EPSG:3857';
  if (!from) return fc;
  const conv = proj4(from, 'EPSG:4326');
  for (const f of fc.features) {
    const g = f.geometry as { coordinates?: unknown } | null;
    if (g?.coordinates) g.coordinates = mapCoords(g.coordinates, (p) => conv.forward([p[0], p[1]]));
  }
  delete fc.crs;
  console.info(`[référentiel] reprojection ${from} → WGS84 (${fc.features.length} objets)`);
  return fc;
}

export function fetchGeoJson(url: string): Promise<FeatureCollection> {
  return once(url, async () => {
    const text = await fetchText(url);
    let fc: FeatureCollection;
    try {
      fc = JSON.parse(text);
    } catch {
      throw new ServiceError('Fichier GeoJSON illisible (JSON invalide).', url);
    }
    if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
      throw new ServiceError('Le fichier n’est pas un GeoJSON « FeatureCollection ».', url);
    }
    if (!fc.features.some((f) => f.geometry && /Polygon/.test(f.geometry.type))) {
      throw new ServiceError('Aucun polygone dans le fichier GeoJSON.', url);
    }
    return normalizeGeoJson(fc);
  });
}

/* ------------------------------ Zonages CSV ------------------------------ */

const INSEE_RE = /^([0-9][0-9AB]\d{3}|\d{4})$/i;
const INSEE_HEADER = /insee|codgeo|code.?com|depcom|cog/i;
const ZONE_HEADER = /zon/i;

/**
 * Parse une table commune → zone. Colonnes repérées par l'en-tête (« code INSEE », « zone »…) ;
 * à défaut : 1re colonne = INSEE, 2e = zone.
 */
export function parseZonageCsv(text: string, normalizeZone: (z: string) => string | undefined): Map<string, string> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const sep = [';', '\t', ','].map((s) => [s, (lines[0] ?? '').split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, '').trim()));
  let ci = 0;
  let zi = 1;
  let start = 0;
  const h = rows.slice(0, 10).findIndex((r) => r.some((c) => INSEE_HEADER.test(c)) && r.some((c) => ZONE_HEADER.test(c)));
  if (h >= 0) {
    ci = rows[h].findIndex((c) => INSEE_HEADER.test(c));
    zi = rows[h].findIndex((c, i) => i !== ci && ZONE_HEADER.test(c));
    start = h + 1;
  }
  const map = new Map<string, string>();
  for (const r of rows.slice(start)) {
    let insee = r[ci] ?? '';
    if (!INSEE_RE.test(insee)) continue;
    if (insee.length === 4) insee = `0${insee}`;
    const z = normalizeZone(r[zi] ?? '');
    if (z) map.set(insee.toUpperCase(), z);
  }
  return map;
}

export const normalizeApl = (z: string) => z.match(/^\s*(?:zone\s*)?([123])\s*$/i)?.[1];
export const normalizeAbc = (z: string) => {
  const s = z.toUpperCase().replace(/\s|ZONE|_/g, '');
  if (s === 'ABIS') return 'Abis';
  return ['A', 'B1', 'B2', 'C'].includes(s) ? s : undefined;
};

export function fetchZonage(kind: 'apl' | 'pinel'): Promise<Map<string, string>> {
  return once(zonageFiles[kind], async () => {
    const text = await fetchText(zonageFiles[kind]);
    const map = parseZonageCsv(text, kind === 'apl' ? normalizeApl : normalizeAbc);
    if (!map.size) {
      const first = text.split(/\r?\n/).slice(0, 2).join(' / ').slice(0, 120);
      throw new ServiceError(
        `Aucune ligne « code INSEE + zone » reconnue. Début du fichier : « ${first} ». Attendu : une colonne code INSEE et une colonne zone (${kind === 'apl' ? '1, 2, 3' : 'Abis, A, B1, B2, C'}).`,
      );
    }
    console.info(`[référentiel] zonage ${kind} : ${map.size} communes`);
    return map;
  });
}
