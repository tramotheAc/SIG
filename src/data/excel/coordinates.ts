import proj4 from 'proj4';
import type { GeoPoint } from '../../domain/model';

/**
 * Normalisation des coordonnées sources vers WGS84 (EPSG:4326), le système de la carte.
 *
 * Les sources françaises peuvent fournir :
 *   - du WGS84 en degrés décimaux (cas attendu des colonnes Latitude/Longitude),
 *   - du Lambert-93 (EPSG:2154) en mètres (fréquent dans les SIG et exports métiers),
 *   - des nombres au format texte avec virgule décimale.
 * La détection est faite par plage de valeurs ; tout ce qui sort du territoire français
 * est rejeté (position considérée comme absente plutôt que fausse).
 */
proj4.defs(
  'EPSG:2154',
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

export type CoordinateSystem = 'EPSG:4326' | 'EPSG:2154';

export function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const s = String(value).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Emprise de validité (France métropolitaine élargie). */
const FR_BOUNDS = { minLon: -6, maxLon: 10, minLat: 41, maxLat: 51.5 };

export function isInFrance(p: GeoPoint): boolean {
  return p.lon >= FR_BOUNDS.minLon && p.lon <= FR_BOUNDS.maxLon && p.lat >= FR_BOUNDS.minLat && p.lat <= FR_BOUNDS.maxLat;
}

export function detectSystem(x: number, y: number): CoordinateSystem | undefined {
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) return 'EPSG:4326';
  if (x > 50_000 && x < 1_300_000 && y > 6_000_000 && y < 7_200_000) return 'EPSG:2154';
  return undefined;
}

/**
 * Convertit un couple (latitude, longitude) source en point WGS84.
 * `latRaw`/`lonRaw` contiennent Y/X si la source est en Lambert-93.
 * Gère aussi l'inversion lat/lon fréquente dans les saisies manuelles.
 */
export function toWgs84(latRaw: unknown, lonRaw: unknown): { point?: GeoPoint; issue?: string } {
  const lat = parseNumber(latRaw);
  const lon = parseNumber(lonRaw);
  if (lat === undefined || lon === undefined) return {};
  if (lat === 0 && lon === 0) return { issue: 'coordonnées nulles (0,0)' };

  const sys = detectSystem(lon, lat);
  let p: GeoPoint | undefined;
  if (sys === 'EPSG:4326') {
    p = { lon, lat };
    if (!isInFrance(p) && isInFrance({ lon: lat, lat: lon })) p = { lon: lat, lat: lon }; // inversion
  } else if (sys === 'EPSG:2154') {
    const [x, y] = proj4('EPSG:2154', 'EPSG:4326', [lon, lat]);
    p = { lon: x, lat: y };
  }
  if (!p || !isInFrance(p)) return { issue: 'coordonnées hors de France ou système non reconnu' };
  return { point: { lon: round6(p.lon), lat: round6(p.lat) } };
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function centroid(points: (GeoPoint | undefined)[]): GeoPoint | undefined {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const p of points) {
    if (!p) continue;
    sx += p.lon;
    sy += p.lat;
    n++;
  }
  return n ? { lon: round6(sx / n), lat: round6(sy / n) } : undefined;
}
