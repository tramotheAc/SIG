/**
 * Calculs géographiques légers (sans dépendance) pour le croisement patrimoine × référentiels.
 * Distances calculées dans une projection locale équirectangulaire (erreur < 0,5 % à l'échelle
 * de quelques kilomètres) : largement suffisant pour un seuil de 300 m.
 */
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon, Position } from 'geojson';
import type { GeoPoint } from '../domain/model';

const R = 6371008.8;
const toRad = Math.PI / 180;

export interface PreparedPolygon {
  id: string;
  nom: string;
  rings: Position[][][]; // [polygone][anneau][point]
  bbox: [number, number, number, number];
  properties: Record<string, unknown>;
}

export function preparePolygons(fc: FeatureCollection, idProps: string[], nameProps: string[]): PreparedPolygon[] {
  const out: PreparedPolygon[] = [];
  fc.features.forEach((f: Feature<Geometry | null>, i) => {
    const g = f.geometry;
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return;
    const polys = g.type === 'Polygon' ? [(g as Polygon).coordinates] : (g as MultiPolygon).coordinates;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polys) for (const [x, y] of p[0]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const pick = (keys: string[]) => keys.map((k) => props[k]).find((v) => v !== undefined && v !== null && v !== '');
    out.push({
      id: String(pick(idProps) ?? f.id ?? i),
      nom: String(pick(nameProps) ?? pick(idProps) ?? `Polygone ${i + 1}`),
      rings: polys,
      bbox: [minX, minY, maxX, maxY],
      properties: props,
    });
  });
  return out;
}

function pointInRing(x: number, y: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(p: GeoPoint, poly: PreparedPolygon): boolean {
  const [a, b, c, d] = poly.bbox;
  if (p.lon < a || p.lon > c || p.lat < b || p.lat > d) return false;
  for (const rings of poly.rings) {
    if (!pointInRing(p.lon, p.lat, rings[0])) continue;
    let inHole = false;
    for (let h = 1; h < rings.length; h++) if (pointInRing(p.lon, p.lat, rings[h])) inHole = true;
    if (!inHole) return true;
  }
  return false;
}

/** Distance (m) d'un point au contour d'un polygone (0 si à l'intérieur). */
export function distanceToPolygon(p: GeoPoint, poly: PreparedPolygon): number {
  if (pointInPolygon(p, poly)) return 0;
  const kx = Math.cos(p.lat * toRad) * R * toRad;
  const ky = R * toRad;
  let best = Infinity;
  for (const rings of poly.rings) {
    for (const ring of rings) {
      for (let i = 1; i < ring.length; i++) {
        const ax = (ring[i - 1][0] - p.lon) * kx, ay = (ring[i - 1][1] - p.lat) * ky;
        const bx = (ring[i][0] - p.lon) * kx, by = (ring[i][1] - p.lat) * ky;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
        const cx = ax + t * dx, cy = ay + t * dy;
        const d = cx * cx + cy * cy;
        if (d < best) best = d;
      }
    }
  }
  return Math.sqrt(best);
}

/** Distance en mètres entre deux points (haversine). */
export function haversine(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * QPV le plus proche d'un point, recherche limitée à `maxM` mètres (au-delà : undefined).
 * Pré-filtrage par emprise élargie pour rester rapide sur des dizaines de milliers de points.
 */
export function nearestPolygon(p: GeoPoint, polys: PreparedPolygon[], maxM = 2000): { poly: PreparedPolygon; distance: number } | undefined {
  const dLat = maxM / 111_000;
  const dLon = maxM / (111_000 * Math.cos(p.lat * toRad));
  let best: { poly: PreparedPolygon; distance: number } | undefined;
  for (const poly of polys) {
    const [a, b, c, d] = poly.bbox;
    if (p.lon < a - dLon || p.lon > c + dLon || p.lat < b - dLat || p.lat > d + dLat) continue;
    const dist = distanceToPolygon(p, poly);
    if (dist <= maxM && (!best || dist < best.distance)) best = { poly, distance: dist };
    if (best?.distance === 0) break;
  }
  return best;
}
