/**
 * Orchestration du chargement : DataProvider → modèle → index métier → enrichissement géographique.
 * La carte s'affiche dès que le patrimoine est chargé ; les référentiels arrivent ensuite (rendu progressif).
 */
import { appConfig } from '../config/app.config';
import { symbologyConfig } from '../config/symbology.config';
import { DataSourceError, type DataProvider } from '../data/DataProvider';
import { fetchCommunes } from '../data/referentiels/geoApi';
import { fetchGeoJson, fetchZonage } from '../data/referentiels/localFiles';
import { ServiceError } from '../data/referentiels/http';
import { referenceLayers } from '../config/layers.config';
import type { Commune } from '../domain/model';
import { PatrimoineIndex } from '../domain/patrimoineIndex';
import { SearchIndex } from '../domain/search';
import { COLOR_BY_OPTIONS } from '../domain/symbology';
import { computeGeoContexts, type Referentiels } from '../geo/enrichment';
import { preparePolygons } from '../geo/spatial';
import { colorRegistry } from './colorRegistry';
import { useAppStore } from './useAppStore';
import type { FeatureCollection } from 'geojson';

/** Référentiels partagés (mutés au fil du chargement, versionnés via geoVersion). */
export const referentiels: Referentiels & { qpvFc?: FeatureCollection } = { communes: new Map() };

let loadSeq = 0;

export async function loadData(provider: DataProvider) {
  const st = useAppStore.getState();
  const seq = ++loadSeq;
  st.set({ status: 'loading', progress: 'Chargement du patrimoine…', error: undefined });
  try {
    const dataset = await provider.load({ onProgress: (step) => useAppStore.getState().set({ progress: step }) });
    if (seq !== loadSeq) return;
    const index = new PatrimoineIndex(dataset, referentiels.communes, new Map());
    // Couleurs figées pour la session, dans l'ordre alphabétique des valeurs complètes.
    for (const { key } of COLOR_BY_OPTIONS) {
      const fixed = key === 'agence' ? agenceFixedColors(index) : undefined;
      colorRegistry.register(key, index.allCategories(key), fixed);
    }
    useAppStore.setState((s) => ({
      status: 'ready',
      progress: undefined,
      dataset,
      index,
      search: new SearchIndex(index),
      selection: undefined,
      filters: { ...s.filters, agences: [], residences: [] },
      geoVersion: s.geoVersion + 1,
    }));
    const errors = dataset.issues.filter((i) => i.level !== 'info').length;
    useAppStore.getState().notify(
      `${dataset.residences.length.toLocaleString('fr-FR')} résidences et ${dataset.logements.length.toLocaleString('fr-FR')} logements chargés${errors ? ` — ${errors} type(s) d’anomalie à consulter` : ''}.`,
      errors ? 'info' : 'success',
    );
    void enrich(seq);
  } catch (e) {
    if (seq !== loadSeq) return;
    const err = e instanceof DataSourceError ? e : new DataSourceError('Chargement des données impossible.', String(e));
    console.error(err.detail ?? err);
    // Si un jeu était déjà chargé, on le conserve.
    const prev = useAppStore.getState().dataset;
    useAppStore.setState({ status: prev ? 'ready' : 'error', progress: undefined, error: { message: err.userMessage, detail: err.detail } });
    if (prev) useAppStore.getState().notify(err.userMessage, 'error');
  }
}

function agenceFixedColors(index: PatrimoineIndex) {
  const out: Record<string, string> = {};
  for (const a of index.agences.values()) {
    const c = symbologyConfig.agenceColors[a.code];
    if (c) out[a.id] = c;
  }
  return out;
}

function recomputeGeo() {
  const { index } = useAppStore.getState();
  if (!index) return;
  const ctx = computeGeoContexts([...index.residences.values(), ...index.batiments.values()], referentiels);
  index.geo.clear();
  for (const [k, v] of ctx) index.geo.set(k, v);
  for (const key of ['qpv', 'zoneApl', 'zonePinel'] as const) colorRegistry.register(key, index.allCategories(key));
  useAppStore.setState((s) => ({ geoVersion: s.geoVersion + 1, search: new SearchIndex(index) }));
}

const setStatus = (id: string, status: 'loading' | 'ready' | 'unavailable' | 'error', message?: string) =>
  useAppStore.getState().setLayer(id, { status, message });

function describe(e: unknown): { status: 'unavailable' | 'error'; message: string } {
  if (e instanceof ServiceError) {
    console.warn(e.detail ?? e.message);
    return e.status === 404
      ? { status: 'unavailable', message: 'Référentiel non installé (voir la documentation).' }
      : { status: 'error', message: e.userMessage };
  }
  console.warn(e);
  return { status: 'error', message: 'Couche indisponible.' };
}

/** Enrichissement progressif : communes/EPCI, puis QPV, puis zonages. Chaque échec est isolé. */
async function enrich(seq: number) {
  const { index } = useAppStore.getState();
  if (!index) return;
  const deps = new Set<string>(appConfig.departements);
  for (const r of index.residences.values()) if (r.communeInsee) deps.add(r.communeInsee.slice(0, 2));

  const communeLayers = ['communes', 'epci', 'departements', 'apl', 'pinel'];
  communeLayers.forEach((id) => setStatus(id, 'loading'));
  const results = await Promise.allSettled([...deps].map((d) => fetchCommunes(d)));
  if (seq !== loadSeq) return;
  const ok = results.filter((r): r is PromiseFulfilledResult<Commune[]> => r.status === 'fulfilled');
  for (const r of ok) for (const c of r.value) referentiels.communes.set(c.insee, c);
  if (!ok.length) {
    const d = describe((results[0] as PromiseRejectedResult).reason);
    communeLayers.forEach((id) => setStatus(id, d.status, 'Référentiel administratif injoignable : EPCI et contours non disponibles.'));
  } else {
    ['communes', 'epci', 'departements'].forEach((id) => setStatus(id, 'ready'));
  }
  recomputeGeo();

  const qpvDef = referenceLayers.find((l) => l.id === 'qpv')!;
  if (qpvDef.kind.type === 'geojson-url') {
    setStatus('qpv', 'loading');
    setStatus('qpv300', 'loading');
    try {
      const fc = await fetchGeoJson(qpvDef.kind.url);
      referentiels.qpvFc = fc;
      referentiels.qpv = preparePolygons(fc, ['code', 'code_qp', 'CODE_QP', 'code_qpv', 'id'], ['nom', 'lib_qp', 'NOM_QP', 'nom_qp', 'name']);
      setStatus('qpv', 'ready');
      setStatus('qpv300', 'ready');
    } catch (e) {
      const d = describe(e);
      setStatus('qpv', d.status, d.message);
      setStatus('qpv300', d.status, 'Nécessite la couche QPV.');
    }
  }
  for (const kind of ['apl', 'pinel'] as const) {
    try {
      referentiels[kind] = await fetchZonage(kind);
      if (ok.length) setStatus(kind, 'ready');
    } catch (e) {
      const d = describe(e);
      setStatus(kind, d.status, d.message);
    }
  }
  if (seq !== loadSeq) return;
  recomputeGeo();
}
