/**
 * Référentiel administratif — API Découpage administratif (https://geo.api.gouv.fr).
 * Source officielle (DINUM / INSEE COG / IGN Admin Express), sans clé, CORS ouvert.
 * Remplaçable par un service interne : seules ces fonctions sont à réécrire.
 */
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { appConfig } from '../../config/app.config';
import type { Commune } from '../../domain/model';
import { fetchCached } from './http';

const API = appConfig.services.geoApi;

interface ApiCommune {
  code: string;
  nom: string;
  codeDepartement?: string;
  codeEpci?: string;
  epci?: { code: string; nom: string };
  population?: number;
  centre?: { type: 'Point'; coordinates: [number, number] };
}

/** Communes d'un département avec leur EPCI et leur centre. */
export async function fetchCommunes(dep: string): Promise<Commune[]> {
  const url = `${API}/departements/${dep}/communes?fields=nom,code,codeDepartement,codeEpci,epci,population,centre`;
  const list = await fetchCached<ApiCommune[]>(url);
  return list.map((c) => ({
    insee: c.code,
    nom: c.nom,
    departement: c.codeDepartement,
    epciCode: c.epci?.code ?? c.codeEpci,
    epciNom: c.epci?.nom,
    population: c.population,
    centre: c.centre ? { lon: c.centre.coordinates[0], lat: c.centre.coordinates[1] } : undefined,
  }));
}

export async function fetchCommuneContours(dep: string): Promise<FeatureCollection> {
  return fetchCached<FeatureCollection>(`${API}/departements/${dep}/communes?format=geojson&geometry=contour&fields=nom,code,codeEpci`);
}

export async function fetchEpciContour(code: string): Promise<Feature<Geometry> | undefined> {
  const r = await fetchCached<Feature<Geometry> | FeatureCollection>(`${API}/epcis/${code}?format=geojson&geometry=contour&fields=nom,code`);
  return 'features' in r ? r.features[0] : r;
}

export async function fetchDepartementContour(code: string): Promise<Feature<Geometry> | undefined> {
  const r = await fetchCached<Feature<Geometry> | FeatureCollection>(`${API}/departements/${code}?format=geojson&geometry=contour&fields=nom,code`);
  return 'features' in r ? r.features[0] : r;
}
