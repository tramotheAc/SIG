/**
 * Géocodage BAN via le service de géocodage de la Géoplateforme IGN
 * (API compatible avec l'ancienne api-adresse.data.gouv.fr).
 */
import { appConfig } from '../../config/app.config';
import type { SearchResult } from '../../domain/search';
import { fetchCached } from './http';

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { id: string; label: string; context?: string; citycode?: string; city?: string; type?: string; housenumber?: string; score?: number };
}

const territoire = new Set<string>(appConfig.departements);

export async function geocode(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 3) return [];
  const url = `${appConfig.services.geocodage}/search?q=${encodeURIComponent(query)}&limit=8&index=address`;
  const res = await fetchCached<{ features: BanFeature[] }>(url);
  // Priorité aux adresses du territoire du bailleur.
  const feats = [...res.features].sort(
    (a, b) => Number(territoire.has(b.properties.citycode?.slice(0, 2) ?? '')) - Number(territoire.has(a.properties.citycode?.slice(0, 2) ?? '')),
  );
  return feats.slice(0, 6).map((f) => ({
    kind: 'adresse' as const,
    id: f.properties.id,
    label: f.properties.label,
    sublabel: f.properties.context,
    position: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
    payload: { ...f.properties },
  }));
}

/** Adresses BAN proches d'un point (couche « Adresses BAN » à fort zoom). */
export async function reverse(lon: number, lat: number, limit = 50) {
  const url = `${appConfig.services.geocodage}/reverse?lon=${lon.toFixed(5)}&lat=${lat.toFixed(5)}&limit=${limit}&index=address`;
  const res = await fetchCached<{ features: BanFeature[] }>(url);
  return res.features;
}
