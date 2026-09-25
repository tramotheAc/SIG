/**
 * Gestion des couches de référence (limites, zonages, référentiels) dans MapLibre.
 * Chargement paresseux : une couche n'est téléchargée qu'à sa première activation.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { buffer } from '@turf/buffer';
import { appConfig } from '../config/app.config';
import { referenceLayers, zoneColors, type ReferenceLayerDef } from '../config/layers.config';
import { fetchCommuneContours, fetchDepartementContour, fetchEpciContour } from '../data/referentiels/geoApi';
import { reverse } from '../data/referentiels/geocodage';
import { ServiceError } from '../data/referentiels/http';
import { fetchGeoJson } from '../data/referentiels/localFiles';
import type { FilteredView, PatrimoineIndex } from '../domain/patrimoineIndex';
import { MISSING } from '../domain/symbology';
import { referentiels } from '../store/bootstrap';
import { colorRegistry } from '../store/colorRegistry';
import { useAppStore, type LayerState } from '../store/useAppStore';
import { PAT_ANCHOR } from './patrimoineLayers';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const sub = (id: string, part: 'fill' | 'line' | 'circle' | 'label' | 'raster' | 'hatch') => `ref-${id}-${part}`;
const srcId = (id: string) => `ref-${id}`;
const labelSrc = (id: string) => `ref-${id}-labels`;

export const INTERACTIVE_REF_LAYERS = referenceLayers.filter((l) => l.interactive).map((l) => sub(l.id, l.geometry === 'circle' ? 'circle' : 'fill'));

export interface RefContext {
  index?: PatrimoineIndex;
  view?: FilteredView;
  zoom: number;
}

type Loader = () => Promise<FeatureCollection>;

async function limit<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => {
    while (queue.length) await fn(queue.shift()!);
  }));
}

function territoryDeps(index?: PatrimoineIndex): string[] {
  const deps = new Set<string>(appConfig.departements);
  if (index) for (const r of index.residences.values()) if (r.communeInsee) deps.add(r.communeInsee.slice(0, 2));
  return [...deps];
}

export class ReferenceLayerManager {
  /** Couches dont les calques MapLibre sont créés. */
  private created = new Set<string>();
  /** État de chargement des données : un échec n'est retenté qu'après désactivation/réactivation. */
  private dataState = new Map<string, 'loading' | 'loaded' | 'failed'>();
  private communesFc?: Promise<FeatureCollection>;
  private banTimer?: ReturnType<typeof setTimeout>;
  private lastBanCenter?: string;

  constructor(private readonly map: MlMap) {
    this.addHatchImage();
    map.on('error', (e) => {
      const sourceId = (e as unknown as { sourceId?: string }).sourceId;
      if (!sourceId?.startsWith('ref-')) return;
      const id = sourceId.replace(/^ref-/, '').replace(/-labels$/, '');
      const st = useAppStore.getState().layers[id];
      if (!st || st.status === 'error') return;
      useAppStore.getState().setLayer(id, { status: 'error', message: 'Service cartographique indisponible — diagnostic en cours…' });
      const def = referenceLayers.find((l) => l.id === id);
      if (def?.kind.type === 'raster') {
        void diagnoseTile(def.kind.tiles[0], map).then((message) => useAppStore.getState().setLayer(id, { status: 'error', message }));
      }
    });
  }

  private addHatchImage() {
    const size = 8;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = 'rgba(33,37,41,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();
    if (!this.map.hasImage('hatch')) this.map.addImage('hatch', ctx.getImageData(0, 0, size, size));
  }

  /** Synchronise toutes les couches avec l'état applicatif. */
  sync(layers: Record<string, LayerState>, order: string[], ctx: RefContext) {
    for (const def of referenceLayers) {
      const st = layers[def.id];
      if (!st) continue;
      if (st.visible) {
        this.ensure(def, ctx);
        this.style(def, st, ctx);
      } else if (this.dataState.get(def.id) === 'failed') {
        this.dataState.delete(def.id); // réactivation = nouvelle tentative
      }
      this.setVisibility(def, st.visible && st.status !== 'unavailable');
    }
    this.reorder(order);
    if (layers.ban?.visible) this.scheduleBan(ctx.zoom);
  }

  private parts(def: ReferenceLayerDef): string[] {
    if (def.geometry === 'raster') return [sub(def.id, 'raster')];
    if (def.geometry === 'circle') return [sub(def.id, 'circle'), sub(def.id, 'label')];
    if (def.geometry === 'line') return [sub(def.id, 'line'), sub(def.id, 'label')];
    return [sub(def.id, 'fill'), sub(def.id, 'hatch'), sub(def.id, 'line'), sub(def.id, 'label')];
  }

  private setVisibility(def: ReferenceLayerDef, visible: boolean) {
    for (const id of this.parts(def)) if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  }

  private reorder(order: string[]) {
    // order[0] = couche du dessus : on insère de bas en haut sous le patrimoine.
    for (let i = order.length - 1; i >= 0; i--) {
      const def = referenceLayers.find((d) => d.id === order[i]);
      if (!def) continue;
      for (const id of this.parts(def)) if (this.map.getLayer(id)) this.map.moveLayer(id, PAT_ANCHOR);
    }
  }

  /* ---------------------------- Création ---------------------------- */

  private ensure(def: ReferenceLayerDef, ctx: RefContext) {
    if (!this.created.has(def.id)) {
      this.createLayers(def);
      this.created.add(def.id);
    }
    if (this.dataState.has(def.id)) return;
    this.loadData(def, ctx);
  }

  private createLayers(def: ReferenceLayerDef) {
    const map = this.map;
    if (def.kind.type === 'raster') {
      map.addSource(srcId(def.id), { type: 'raster', tiles: def.kind.tiles, tileSize: def.kind.tileSize ?? 256 });
      map.addLayer({ id: sub(def.id, 'raster'), type: 'raster', source: srcId(def.id), minzoom: def.minzoom ?? 0 }, PAT_ANCHOR);
      return;
    }

    map.addSource(srcId(def.id), { type: 'geojson', data: EMPTY, promoteId: 'code' });
    map.addSource(labelSrc(def.id), { type: 'geojson', data: EMPTY });
    const minzoom = def.minzoom ?? 0;
    if (def.geometry === 'fill') {
      map.addLayer({ id: sub(def.id, 'fill'), type: 'fill', source: srcId(def.id), minzoom }, PAT_ANCHOR);
      map.addLayer({ id: sub(def.id, 'hatch'), type: 'fill', source: srcId(def.id), minzoom, paint: { 'fill-pattern': 'hatch' }, filter: ['==', 1, 0] }, PAT_ANCHOR);
    }
    if (def.geometry === 'fill' || def.geometry === 'line') {
      map.addLayer({ id: sub(def.id, 'line'), type: 'line', source: srcId(def.id), minzoom }, PAT_ANCHOR);
    }
    if (def.geometry === 'circle') {
      map.addLayer({ id: sub(def.id, 'circle'), type: 'circle', source: srcId(def.id), minzoom }, PAT_ANCHOR);
    }
    map.addLayer(
      {
        id: sub(def.id, 'label'),
        type: 'symbol',
        source: def.geometry === 'circle' ? srcId(def.id) : labelSrc(def.id),
        minzoom: Math.max(minzoom, def.id === 'communes' || def.id === 'apl' || def.id === 'pinel' ? 9 : def.id === 'epci' ? 7.5 : 0),
        layout: {
          'text-field': ['coalesce', ['get', def.labelProp ?? 'nom'], ''],
          'text-font': [...(def.id === 'departements' || def.id === 'epci' ? appConfig.fonts.bold : appConfig.fonts.regular)],
          'text-size': def.id === 'departements' ? 14 : def.geometry === 'circle' ? 10 : 12,
          'text-offset': def.geometry === 'circle' ? [0, 0.9] : [0, 0],
          'text-optional': true,
          'text-max-width': 8,
        },
        paint: { 'text-color': '#343a40', 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 1.3 },
      },
      PAT_ANCHOR,
    );
  }

  private loadData(def: ReferenceLayerDef, ctx: RefContext) {
    const map = this.map;
    const setStatus = (status: LayerState['status'], message?: string) => useAppStore.getState().setLayer(def.id, { status, message });
    const loader = def.kind.type === 'raster' ? undefined : this.loaderFor(def, ctx);
    if (!loader) {
      this.dataState.set(def.id, 'loaded');
      if (def.kind.type === 'raster') setStatus('ready');
      return;
    }
    this.dataState.set(def.id, 'loading');
    setStatus('loading');
    loader()
      .then((fc) => {
        (map.getSource(srcId(def.id)) as GeoJSONSource).setData(fc);
        const bb = bboxOf(fc);
        if (bb) layerBounds.set(def.id, bb);
        if (def.geometry !== 'circle') (map.getSource(labelSrc(def.id)) as GeoJSONSource).setData(labelPoints(fc, def.labelProp ?? 'nom'));
        const cur = useAppStore.getState().layers[def.id];
        if (cur.status !== 'error' && cur.status !== 'unavailable') setStatus(fc.features.length ? 'ready' : 'unavailable', fc.features.length ? undefined : 'Aucune donnée sur le territoire.');
        // Relance du style avec les données chargées
        const s = useAppStore.getState();
        this.dataState.set(def.id, 'loaded');
        this.style(def, s.layers[def.id], { index: s.index, view: lastView, zoom: map.getZoom() });
      })
      .catch((e) => {
        this.dataState.set(def.id, 'failed');
        const unavailable = e instanceof ServiceError && e.status === 404;
        console.warn(`[couche ${def.id}]`, e instanceof ServiceError ? e.detail : e);
        setStatus(unavailable ? 'unavailable' : 'error', unavailable ? 'Référentiel non installé (voir docs/SOURCES.md).' : 'Service indisponible pour le moment. Désactivez puis réactivez la couche pour réessayer.');
      });
  }

  private communesContours(ctx: RefContext): Promise<FeatureCollection> {
    this.communesFc ??= (async () => {
      const deps = territoryDeps(ctx.index);
      const results = await Promise.allSettled(deps.map((d) => fetchCommuneContours(d)));
      const features = results.flatMap((r) => (r.status === 'fulfilled' ? r.value.features : []));
      if (!features.length) {
        this.communesFc = undefined;
        throw (results.find((r) => r.status === 'rejected') as PromiseRejectedResult)?.reason ?? new ServiceError('Aucune commune.');
      }
      for (const f of features) f.properties = { ...f.properties, code: f.properties?.code };
      return { type: 'FeatureCollection', features } as FeatureCollection;
    })();
    return this.communesFc;
  }

  private loaderFor(def: ReferenceLayerDef, ctx: RefContext): Loader | undefined {
    const k = def.kind;
    if (k.type === 'geojson-url') {
      if (def.id === 'qpv') return async () => referentiels.qpvFc ?? withCodes(await fetchGeoJson(k.url));
      return async () => withCodes(await fetchGeoJson(k.url));
    }
    if (k.type !== 'service') return undefined;
    switch (k.service) {
      case 'communes':
      case 'zonage-apl':
      case 'zonage-pinel':
        return () => this.communesContours(ctx);
      case 'departements':
        return async () => {
          const deps = territoryDeps(ctx.index);
          const res = await Promise.allSettled(deps.map((d) => fetchDepartementContour(d)));
          const features = res.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
          if (!features.length) throw (res[0] as PromiseRejectedResult).reason;
          return { type: 'FeatureCollection', features };
        };
      case 'epci':
        return async () => {
          const codes = new Set<string>();
          const deps = new Set(territoryDeps(ctx.index));
          for (const c of referentiels.communes.values()) if (c.epciCode && deps.has(c.departement ?? '')) codes.add(c.epciCode);
          if (!codes.size) throw new ServiceError('Référentiel EPCI non chargé.');
          const features: Feature<Geometry>[] = [];
          await limit([...codes], 6, async (code) => {
            try {
              const f = await fetchEpciContour(code);
              if (f) features.push(f);
            } catch {
              /* EPCI isolé indisponible : ignoré */
            }
          });
          if (!features.length) throw new ServiceError('Contours EPCI indisponibles.');
          return { type: 'FeatureCollection', features };
        };
      case 'qpv-buffer':
        return async () => {
          const qpv = referentiels.qpvFc ?? (await fetchGeoJson((referenceLayers.find((l) => l.id === 'qpv')!.kind as { url: string }).url));
          const buffered = buffer(qpv, appConfig.qpvBufferMeters, { units: 'meters' });
          return withCodes(buffered as FeatureCollection);
        };
      case 'ban':
        return async () => EMPTY;
    }
  }

  /* ---------------------------- Styles ---------------------------- */

  private style(def: ReferenceLayerDef, st: LayerState, ctx: RefContext) {
    const map = this.map;
    const fill = sub(def.id, 'fill');
    const line = sub(def.id, 'line');
    const label = sub(def.id, 'label');
    if (def.kind.type === 'raster') {
      map.setPaintProperty(sub(def.id, 'raster'), 'raster-opacity', st.opacity);
      return;
    }
    if (map.getLayer(label)) map.setLayoutProperty(label, 'visibility', st.labels ? 'visible' : 'none');

    if (def.id === 'communes' || def.id === 'epci') {
      this.styleAdmin(def, st, ctx);
      return;
    }
    if (def.id === 'apl' || def.id === 'pinel') {
      const zones = def.id === 'apl' ? referentiels.apl : referentiels.pinel;
      const palette = def.id === 'apl' ? zoneColors.apl : zoneColors.pinel;
      const expr: unknown[] = ['match', ['get', 'code']];
      const codes: string[] = [];
      zones?.forEach((z, insee) => {
        if (palette[z]) {
          expr.push(insee, palette[z]);
          codes.push(insee);
        }
      });
      expr.push('rgba(0,0,0,0)');
      map.setPaintProperty(fill, 'fill-color', (codes.length ? expr : 'rgba(0,0,0,0)') as ExpressionSpecification);
      map.setPaintProperty(fill, 'fill-opacity', st.opacity);
      map.setFilter(fill, codes.length ? ['in', ['get', 'code'], ['literal', codes]] : ['==', 1, 0]);
      map.setPaintProperty(line, 'line-color', '#ffffff');
      map.setPaintProperty(line, 'line-width', st.width);
      map.setPaintProperty(line, 'line-opacity', Math.min(1, st.opacity + 0.2));
      if (!zones && useAppStore.getState().layers[def.id].status === 'ready') {
        useAppStore.getState().setLayer(def.id, { status: 'unavailable', message: 'Table de zonage non installée (voir docs/SOURCES.md).' });
      }
      return;
    }
    if (def.geometry === 'fill') {
      map.setPaintProperty(fill, 'fill-color', st.color);
      map.setPaintProperty(fill, 'fill-opacity', st.opacity);
      map.setPaintProperty(line, 'line-color', st.color);
      map.setPaintProperty(line, 'line-width', st.width);
      map.setPaintProperty(line, 'line-opacity', Math.min(1, st.opacity + 0.35));
    } else if (def.geometry === 'line') {
      map.setPaintProperty(line, 'line-color', st.color);
      map.setPaintProperty(line, 'line-width', st.width);
      map.setPaintProperty(line, 'line-opacity', st.opacity);
    } else if (def.geometry === 'circle') {
      const circle = sub(def.id, 'circle');
      map.setPaintProperty(circle, 'circle-color', st.color);
      map.setPaintProperty(circle, 'circle-radius', st.size);
      map.setPaintProperty(circle, 'circle-opacity', st.opacity);
      map.setPaintProperty(circle, 'circle-stroke-color', '#fff');
      map.setPaintProperty(circle, 'circle-stroke-width', 1);
    }
  }

  /**
   * Communes / EPCI : filtre « avec patrimoine » et coloration par agence.
   * Plusieurs agences → couleur de l'agence majoritaire + hachures + libellé « n agences ».
   */
  private styleAdmin(def: ReferenceLayerDef, st: LayerState, ctx: RefContext) {
    const map = this.map;
    const fill = sub(def.id, 'fill');
    const line = sub(def.id, 'line');
    const hatch = sub(def.id, 'hatch');
    const label = sub(def.id, 'label');
    const aggs = def.id === 'communes' ? ctx.view?.byCommune : ctx.view?.byEpci;
    const withPat = [...(aggs?.values() ?? [])].filter((a) => a.code !== MISSING && (a.logements > 0 || a.residences.size > 0));
    const codes = withPat.map((a) => a.code);
    const onlyFilter: ExpressionSpecification | null = st.patrimoineOnly ? ['in', ['get', 'code'], ['literal', codes]] : null;
    map.setFilter(fill, onlyFilter);
    map.setFilter(line, onlyFilter);
    map.setFilter(label, onlyFilter);

    if (st.colorByAgence && withPat.length) {
      const expr: unknown[] = ['match', ['get', 'code']];
      const multi: string[] = [];
      for (const a of withPat) {
        const sorted = [...a.byAgence.entries()].sort((x, y) => y[1] - x[1]);
        expr.push(a.code, colorRegistry.colorOf('agence', sorted[0][0]));
        if (sorted.length > 1) multi.push(a.code);
      }
      expr.push('rgba(0,0,0,0)');
      map.setPaintProperty(fill, 'fill-color', expr as ExpressionSpecification);
      map.setPaintProperty(fill, 'fill-opacity', st.opacity);
      map.setFilter(hatch, multi.length ? ['in', ['get', 'code'], ['literal', multi]] : ['==', 1, 0]);
      map.setPaintProperty(hatch, 'fill-opacity', Math.min(1, st.opacity + 0.3));
      map.setPaintProperty(line, 'line-color', '#343a40');
      // Libellé enrichi : nombre d'agences
      const lbl: unknown[] = ['match', ['get', 'code']];
      for (const a of withPat) {
        const n = a.byAgence.size;
        lbl.push(a.code, n > 1 ? `\n${n} agences` : '');
      }
      lbl.push('');
      map.setLayoutProperty(label, 'text-field', ['concat', ['coalesce', ['get', 'nom'], ''], lbl] as unknown as ExpressionSpecification);
    } else {
      map.setPaintProperty(fill, 'fill-color', st.color);
      map.setPaintProperty(fill, 'fill-opacity', st.patrimoineOnly ? st.opacity * 0.5 : st.opacity * 0.15);
      map.setFilter(hatch, ['==', 1, 0]);
      map.setPaintProperty(line, 'line-color', st.color);
      map.setLayoutProperty(label, 'text-field', ['coalesce', ['get', 'nom'], '']);
    }
    map.setPaintProperty(line, 'line-width', st.width);
    map.setPaintProperty(line, 'line-opacity', Math.min(1, st.opacity + 0.4));
  }

  /* ---------------------------- BAN ---------------------------- */

  private scheduleBan(zoom: number) {
    const def = referenceLayers.find((l) => l.id === 'ban')!;
    if (zoom < (def.minzoom ?? 17)) return;
    clearTimeout(this.banTimer);
    this.banTimer = setTimeout(async () => {
      const c = this.map.getCenter();
      const key = `${c.lng.toFixed(4)},${c.lat.toFixed(4)}`;
      if (key === this.lastBanCenter) return;
      this.lastBanCenter = key;
      try {
        const feats = await reverse(c.lng, c.lat, 50);
        const fc: FeatureCollection = {
          type: 'FeatureCollection',
          features: feats.map((f) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: f.geometry.coordinates },
            properties: { code: f.properties.id, label: f.properties.label, numero: f.properties.housenumber ?? '', kind: 'adresse' },
          })),
        };
        (this.map.getSource(srcId('ban')) as GeoJSONSource | undefined)?.setData(fc);
        useAppStore.getState().setLayer('ban', { status: 'ready', message: undefined });
      } catch (e) {
        this.lastBanCenter = undefined;
        useAppStore.getState().setLayer('ban', { status: 'error', message: e instanceof ServiceError ? e.userMessage : 'Service BAN indisponible.' });
      }
    }, 350);
  }
}

/**
 * Diagnostic d'une couche de tuiles en échec : on demande UNE tuile au centre de la vue et on
 * traduit la réponse (exception WMS, code HTTP, blocage CORS) en message compréhensible.
 */
export async function diagnoseTile(template: string, map: MlMap): Promise<string> {
  const z = Math.max(0, Math.min(18, Math.round(map.getZoom())));
  const c = map.getCenter();
  const n = 2 ** z;
  const x = Math.floor(((c.lng + 180) / 360) * n);
  const latR = (c.lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n);
  const R = 6378137 * Math.PI;
  const size = (2 * R) / n;
  const bbox = [-R + x * size, R - (y + 1) * size, -R + (x + 1) * size, R - y * size].join(',');
  const url = template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)).replace('{bbox-epsg-3857}', bbox);
  let res: Response;
  try {
    res = await fetch(url, { mode: 'cors' });
  } catch {
    try {
      await fetch(url, { mode: 'no-cors' });
      return 'Le service répond mais interdit l’affichage de ses images dans une autre application (CORS). Solution : passer par un relais (proxy) interne ou télécharger la donnée (fichier) sur data.gouv.fr / Géorisques.';
    } catch {
      return 'Service injoignable depuis ce poste (réseau de l’entreprise ou adresse incorrecte).';
    }
  }
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok) return `Le service répond « HTTP ${res.status} » pour les images de la carte.`;
  if (/xml|text/i.test(type)) {
    const body = await res.text();
    const m = body.match(/<(?:\w+:)?ServiceException[^>]*>([\s\S]*?)<\/|<(?:\w+:)?ExceptionText>([\s\S]*?)<\//);
    const detail = (m?.[1] ?? m?.[2] ?? body).replace(/\s+/g, ' ').trim().slice(0, 220);
    return `Le service refuse la demande : « ${detail} »${/CRS|SRS/i.test(detail) ? ' — la projection Web Mercator (EPSG:3857) n’est pas proposée pour cette couche.' : ''}`;
  }
  return 'Les images sont bien reçues mais ne peuvent pas être affichées (format ou CORS). Voir la console du navigateur (F12).';
}

/** Emprise des couches GeoJSON chargées (bouton « Zoomer sur la couche »). */
export const layerBounds = new Map<string, [[number, number], [number, number]]>();

function bboxOf(fc: FeatureCollection): [[number, number], [number, number]] | undefined {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as number[];
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  for (const f of fc.features) walk((f.geometry as { coordinates?: unknown } | null)?.coordinates);
  return Number.isFinite(w) ? [[w, s], [e, n]] : undefined;
}

/** Dernière vue filtrée (utilisée lors du chargement asynchrone d'une couche). */
let lastView: FilteredView | undefined;
export const setLastView = (v?: FilteredView) => (lastView = v);

/** Normalise la propriété `code` (identifiant de jointure) et `nom`. */
function withCodes(fc: FeatureCollection): FeatureCollection {
  fc.features.forEach((f, i) => {
    const p = (f.properties ??= {});
    p.code ??= p.code_qp ?? p.CODE_QP ?? p.code_qpv ?? p.id ?? String(i);
    p.nom ??= p.lib_qp ?? p.NOM_QP ?? p.nom_qp ?? p.name ?? p.libelle;
  });
  return fc;
}

/** Points d'ancrage des libellés (centre de l'emprise du plus grand polygone). */
function labelPoints(fc: FeatureCollection, prop: string): FeatureCollection {
  const features: Feature[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let best = polys[0];
    let bestArea = -1;
    for (const p of polys) {
      const a = Math.abs(ringArea(p[0]));
      if (a > bestArea) {
        bestArea = a;
        best = p;
      }
    }
    let sx = 0, sy = 0;
    const ring = best[0];
    for (const [x, y] of ring) {
      sx += x;
      sy += y;
    }
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [sx / ring.length, sy / ring.length] },
      properties: { code: f.properties?.code, [prop]: f.properties?.[prop] ?? f.properties?.nom },
    });
  }
  return { type: 'FeatureCollection', features };
}

function ringArea(r: number[][]) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return a / 2;
}
