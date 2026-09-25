/**
 * Référentiels déposés sous forme de fichiers (public/referentiels) :
 * QPV (GeoJSON), zonages APL et ABC/Pinel (CSV « insee;zone »).
 * Ces fichiers sont produits par `npm run referentiels:fetch` ou fournis par le bailleur.
 */
import type { FeatureCollection } from 'geojson';
import { zonageFiles } from '../../config/layers.config';
import { fetchCached, ServiceError } from './http';

export async function fetchGeoJson(url: string): Promise<FeatureCollection> {
  const fc = await fetchCached<FeatureCollection>(url);
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new ServiceError('Fichier de référentiel invalide.', url);
  }
  return fc;
}

/** Parse un CSV simple (séparateur ; ou ,) → Map insee → zone. Tolère un en-tête. */
export function parseZonageCsv(text: string, normalizeZone: (z: string) => string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(/[;,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;
    let insee = cols[0];
    if (/^\d{4}$/.test(insee)) insee = `0${insee}`;
    if (!/^[0-9][0-9AB]\d{3}$/i.test(insee)) continue; // en-tête ou ligne invalide
    const z = normalizeZone(cols[1]);
    if (z) map.set(insee.toUpperCase(), z);
  }
  return map;
}

export const normalizeApl = (z: string) => {
  const m = z.match(/[123]/);
  return m ? m[0] : undefined;
};
export const normalizeAbc = (z: string) => {
  const s = z.toUpperCase().replace(/\s|ZONE/g, '');
  if (s === 'ABIS' || s === 'A BIS' || s === 'A_BIS') return 'Abis';
  return ['A', 'B1', 'B2', 'C'].includes(s) ? s : undefined;
};

export async function fetchZonage(kind: 'apl' | 'pinel'): Promise<Map<string, string>> {
  const text = await fetchCached<string>(zonageFiles[kind], 'text');
  if (/^\s*</.test(text)) throw new ServiceError('Données non disponibles.', 'HTML reçu au lieu du CSV', 404); // fallback SPA
  const map = parseZonageCsv(text, kind === 'apl' ? normalizeApl : normalizeAbc);
  if (!map.size) throw new ServiceError('Fichier de zonage vide ou illisible.');
  return map;
}
