/**
 * Couches « patrimoine » : représentation progressive selon le zoom.
 *
 *   zoom <  9     agrégats par commune (camemberts : répartition selon le critère de couleur)
 *   9  – 13.5     ensembles résidentiels
 *   13.5 – 16.5   bâtiments (adresses)
 *   ≥ 16.5        logements (position schématique autour de la cage / de l'adresse)
 *
 * Les données sont injectées en GeoJSON dans MapLibre (découpage en tuiles dans un worker,
 * geojson-vt) : fluide jusqu'à plusieurs dizaines de milliers de points. Les niveaux fins ne
 * sont injectés que lorsqu'ils sont réellement affichables (économie de calcul et de mémoire).
 */
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { appConfig } from '../config/app.config';
import { symbologyConfig } from '../config/symbology.config';
import type { EntityRef, GeoPoint } from '../domain/model';
import type { FilteredView, PatrimoineIndex } from '../domain/patrimoineIndex';
import { percentile, radiusFor, type ColorBy } from '../domain/symbology';
import { colorRegistry } from '../store/colorRegistry';
import type { PatrimoineStyle, Representation } from '../store/useAppStore';

export const PAT_LAYERS = {
  communes: 'pat-communes',
  communesLabel: 'pat-communes-label',
  residences: 'pat-residences',
  residencesLabel: 'pat-residences-label',
  batiments: 'pat-batiments',
  batimentsLabel: 'pat-batiments-label',
  logements: 'pat-logements',
  selection: 'pat-selection',
} as const;
export const PAT_ANCHOR = 'anchor-patrimoine';
export const INTERACTIVE_PAT_LAYERS = [PAT_LAYERS.logements, PAT_LAYERS.batiments, PAT_LAYERS.residences, PAT_LAYERS.communes];

const z = appConfig.zoom;
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export function levelForZoom(zoom: number, rep: Representation): Exclude<Representation, 'auto'> {
  if (rep !== 'auto') return rep;
  if (zoom < z.communeMax) return 'commune';
  if (zoom < z.residenceMax) return 'residence';
  if (zoom < z.batimentMax) return 'batiment';
  return 'logement';
}

export function ensurePatrimoineLayers(map: MlMap) {
  if (map.getSource(PAT_LAYERS.residences)) return;
  for (const id of [PAT_LAYERS.communes, PAT_LAYERS.residences, PAT_LAYERS.batiments, PAT_LAYERS.logements, PAT_LAYERS.selection]) {
    map.addSource(id, { type: 'geojson', data: EMPTY, promoteId: 'fid' });
  }
  const font = [...appConfig.fonts.regular];
  const bold = [...appConfig.fonts.bold];
  // Rayon = rayon métier (nb de logements) × échelle utilisateur × atténuation aux petites échelles.
  const r = ['*', ['get', 'r'], ['coalesce', ['global-state', 'scale'], 1]];
  const radius = ['interpolate', ['linear'], ['zoom'], 8, ['*', r, 0.45], 11, ['*', r, 0.7], 14, r];

  map.addLayer({
    id: PAT_LAYERS.communes,
    type: 'symbol',
    source: PAT_LAYERS.communes,
    layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'symbol-sort-key': ['-', ['get', 'n']] },
  });
  map.addLayer({
    id: PAT_LAYERS.communesLabel,
    type: 'symbol',
    source: PAT_LAYERS.communes,
    layout: {
      'text-field': ['concat', ['get', 'nom'], '\n', ['get', 'label']],
      'text-font': font,
      'text-size': 11,
      'text-offset': ['literal', [0, 1.6]] as never,
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: { 'text-color': '#212529', 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 1.4 },
  });
  map.addLayer({
    id: PAT_LAYERS.residences,
    type: 'circle',
    source: PAT_LAYERS.residences,
    layout: { 'circle-sort-key': ['-', ['get', 'n']] },
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': radius as never,
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#212529', '#ffffff'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
    },
  });
  map.addLayer({
    id: PAT_LAYERS.residencesLabel,
    type: 'symbol',
    source: PAT_LAYERS.residences,
    minzoom: 12,
    layout: { 'text-field': ['get', 'nom'], 'text-font': font, 'text-size': 11, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true },
    paint: { 'text-color': '#343a40', 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 1.2 },
  });
  map.addLayer({
    id: PAT_LAYERS.batiments,
    type: 'circle',
    source: PAT_LAYERS.batiments,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': radius as never,
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#212529', '#ffffff'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1.2],
    },
  });
  map.addLayer({
    id: PAT_LAYERS.batimentsLabel,
    type: 'symbol',
    source: PAT_LAYERS.batiments,
    minzoom: 15.5,
    layout: { 'text-field': ['get', 'nom'], 'text-font': font, 'text-size': 11, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-optional': true },
    paint: { 'text-color': '#343a40', 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 1.2 },
  });
  map.addLayer({
    id: PAT_LAYERS.logements,
    type: 'circle',
    source: PAT_LAYERS.logements,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 2.5, 19, symbologyConfig.logementRadius + 2],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#212529', '#ffffff'],
      'circle-stroke-width': 1,
    },
  });
  map.addLayer({
    id: PAT_LAYERS.selection,
    type: 'circle',
    source: PAT_LAYERS.selection,
    paint: {
      'circle-color': 'rgba(0,0,0,0)',
      'circle-radius': ['+', ['get', 'r'], 5],
      'circle-stroke-color': symbologyConfig.selectionColor,
      'circle-stroke-width': 3.5,
    },
  });
  void bold;
}

/** Visibilité et plages de zoom selon le mode de représentation. */
export function applyRepresentation(map: MlMap, style: PatrimoineStyle) {
  const rep = style.representation;
  const ranges: Record<string, [number, number]> =
    rep === 'auto'
      ? {
          commune: [0, z.communeMax],
          residence: [z.communeMax, z.residenceMax],
          batiment: [z.residenceMax, z.batimentMax],
          logement: [z.batimentMax, 24],
        }
      : { commune: [0, 0], residence: [0, 0], batiment: [0, 0], logement: [0, 0], [rep]: [0, 24] };
  const pairs: [string, string][] = [
    [PAT_LAYERS.communes, 'commune'],
    [PAT_LAYERS.communesLabel, 'commune'],
    [PAT_LAYERS.residences, 'residence'],
    [PAT_LAYERS.residencesLabel, 'residence'],
    [PAT_LAYERS.batiments, 'batiment'],
    [PAT_LAYERS.batimentsLabel, 'batiment'],
    [PAT_LAYERS.logements, 'logement'],
  ];
  const baseMin: Record<string, number> = { [PAT_LAYERS.residencesLabel]: 12, [PAT_LAYERS.batimentsLabel]: 15.5 };
  for (const [layer, level] of pairs) {
    const [min, max] = ranges[level];
    const visible = style.visible && max > min;
    map.setLayoutProperty(layer, 'visibility', visible ? 'visible' : 'none');
    if (visible) map.setLayerZoomRange(layer, rep === 'auto' ? Math.max(min, baseMin[layer] ?? 0) : (baseMin[layer] ?? 0), max);
  }
  for (const layer of [PAT_LAYERS.residencesLabel, PAT_LAYERS.batimentsLabel, PAT_LAYERS.communesLabel]) {
    if (!style.labels) map.setLayoutProperty(layer, 'visibility', 'none');
  }
  for (const layer of [PAT_LAYERS.residences, PAT_LAYERS.batiments, PAT_LAYERS.logements]) {
    map.setPaintProperty(layer, 'circle-opacity', style.opacity);
    map.setPaintProperty(layer, 'circle-stroke-opacity', Math.min(1, style.opacity + 0.1));
  }
  map.setPaintProperty(PAT_LAYERS.communes, 'icon-opacity', style.opacity);
  map.setGlobalStateProperty('scale', style.sizeScale);
}

const pt = (p: GeoPoint): Point => ({ type: 'Point', coordinates: [p.lon, p.lat] });

/* ------------------------------------------------------------------ */
/* Mise à jour des données                                             */
/* ------------------------------------------------------------------ */

export interface PatrimoineRenderCache {
  resKey?: string;
  batKey?: string;
  logKey?: string;
  pieImages: Set<string>;
}

/**
 * Injecte les objets filtrés dans les sources. Chaque niveau n'est recalculé que si la vue
 * (filtres, symbologie) a changé (`viewKey`) ; les niveaux bâtiment/logement ne sont calculés
 * que si l'utilisateur est à un zoom (ou une représentation forcée) qui les affiche.
 */
export function updatePatrimoineData(
  map: MlMap,
  index: PatrimoineIndex,
  view: FilteredView,
  style: PatrimoineStyle,
  zoom: number,
  cache: PatrimoineRenderCache,
  viewKey: string,
) {
  const by = style.colorBy;
  const color = (cat: string) => colorRegistry.colorOf(by, cat);
  const { size } = symbologyConfig;
  const fixed = style.sizeMode === 'fixe';

  // Ensembles résidentiels + agrégats communaux (camemberts)
  if (cache.resKey !== viewKey) {
    updateResidences(map, view, by, fixed);
    updateCommuneAggregates(map, view, by, cache);
    cache.resKey = viewKey;
  }

  const wantBat = style.representation === 'batiment' || (style.representation === 'auto' && zoom >= z.residenceMax - 1.5);
  const wantLog = style.representation === 'logement' || (style.representation === 'auto' && zoom >= z.batimentMax - 1);
  void index;

  if (wantBat && cache.batKey !== viewKey) {
    const batCap = percentile(view.batiments.map((b) => b.n), size.capPercentile);
    const features: Feature[] = [];
    for (const { item, n, cat } of view.batiments) {
      if (!item.position) continue;
      features.push({
        type: 'Feature',
        geometry: pt(item.position),
        properties: {
          fid: features.length,
          kind: 'batiment',
          id: item.id,
          nom: item.adresse ?? item.libelle,
          n,
          color: color(cat),
          r: fixed ? size.fixedRadius : radiusFor(n, batCap, size.minRadius + 1, size.maxRadius - 3),
        },
      });
    }
    (map.getSource(PAT_LAYERS.batiments) as GeoJSONSource).setData({ type: 'FeatureCollection', features });
    cache.batKey = viewKey;
  }

  if (wantLog && cache.logKey !== viewKey) {
    const features: Feature[] = [];
    const slot = new Map<string, number>();
    for (const { item, cat } of view.logements) {
      if (!item.position) continue;
      const anchor = item.cageId ?? item.batimentId ?? item.residenceId ?? '';
      const i = slot.get(anchor) ?? 0;
      slot.set(anchor, i + 1);
      features.push({
        type: 'Feature',
        geometry: pt(spiral(item.position, i)),
        properties: { fid: features.length, kind: 'logement', id: item.id, color: color(cat), r: symbologyConfig.logementRadius },
      });
    }
    (map.getSource(PAT_LAYERS.logements) as GeoJSONSource).setData({ type: 'FeatureCollection', features });
    cache.logKey = viewKey;
  }
}

function updateResidences(map: MlMap, view: FilteredView, by: ColorBy, fixed: boolean) {
  const { size } = symbologyConfig;
  const color = (cat: string) => colorRegistry.colorOf(by, cat);
  const resCap = percentile(view.residences.map((r) => r.n), size.capPercentile);
  const resFeatures: Feature[] = [];
  for (const { item, n, cat } of view.residences) {
    if (!item.position) continue;
    resFeatures.push({
      type: 'Feature',
      geometry: pt(item.position),
      properties: {
        fid: resFeatures.length,
        kind: 'residence',
        id: item.id,
        nom: item.nom,
        n,
        color: color(cat),
        r: fixed ? size.fixedRadius : radiusFor(n, resCap, size.minRadius, size.maxRadius),
      },
    });
  }
  (map.getSource(PAT_LAYERS.residences) as GeoJSONSource).setData({ type: 'FeatureCollection', features: resFeatures });
}

/**
 * Position SCHÉMATIQUE d'un logement : les logements d'une même cage partagent la position de celle-ci ;
 * on les répartit en spirale (≈ 3 m entre points) pour qu'ils soient tous visibles et cliquables.
 */
export function spiral(p: GeoPoint, i: number): GeoPoint {
  if (i === 0) return p;
  const angle = i * 2.39996; // angle d'or
  const dist = 3.2 * Math.sqrt(i); // mètres
  const dLat = (dist * Math.sin(angle)) / 111_320;
  const dLon = (dist * Math.cos(angle)) / (111_320 * Math.cos((p.lat * Math.PI) / 180));
  return { lon: p.lon + dLon, lat: p.lat + dLat };
}

function updateCommuneAggregates(map: MlMap, view: FilteredView, by: ColorBy, cache: PatrimoineRenderCache) {
  const { minRadius, maxRadius } = symbologyConfig.communeAggregate;
  const aggs = [...view.byCommune.values()].filter((a) => a.position && a.code !== '__missing__');
  const cap = percentile(aggs.map((a) => a.logements), 0.98);
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const used = new Set<string>();
  const features: Feature[] = aggs.map((a, i) => {
    const r = radiusFor(a.logements, cap, minRadius, maxRadius);
    const parts = [...a.byCat.entries()].sort((x, y) => y[1] - x[1]).map(([cat, n]) => ({ color: colorRegistry.colorOf(by, cat), n }));
    const key = `pie-${Math.round(r)}-${parts.map((p) => `${p.color}:${p.n}`).join('|')}`;
    const iconId = key.length > 180 ? `pie-${a.code}-${hash(key)}` : key;
    used.add(iconId);
    if (!map.hasImage(iconId)) map.addImage(iconId, drawPie(parts, r, ratio), { pixelRatio: ratio });
    const nbCat = parts.length;
    return {
      type: 'Feature',
      geometry: pt(a.position!),
      properties: {
        fid: i,
        kind: 'commune',
        id: a.code,
        nom: a.nom,
        n: a.logements,
        r,
        icon: iconId,
        label: `${a.logements.toLocaleString('fr-FR')} lgt${nbCat > 1 && by === 'agence' ? ` · ${nbCat} agences` : ''}`,
      },
    };
  });
  for (const id of cache.pieImages) if (!used.has(id) && map.hasImage(id)) map.removeImage(id);
  cache.pieImages = used;
  (map.getSource(PAT_LAYERS.communes) as GeoJSONSource).setData({ type: 'FeatureCollection', features });
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Camembert : une commune multi-agences n'est jamais réduite à une seule couleur. */
function drawPie(parts: { color: string; n: number }[], r: number, ratio: number): ImageData {
  const size = Math.ceil((r * 2 + 4) * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const rad = r * ratio;
  const total = parts.reduce((s, p) => s + p.n, 0) || 1;
  let a0 = -Math.PI / 2;
  for (const p of parts) {
    const a1 = a0 + (p.n / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, rad, a0, a1);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    a0 = a1;
  }
  ctx.beginPath();
  ctx.arc(c, c, rad, 0, Math.PI * 2);
  ctx.lineWidth = 1.5 * ratio;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

/** Met en évidence l'objet sélectionné. */
export function updateSelection(map: MlMap, index: PatrimoineIndex | undefined, sel: EntityRef | undefined) {
  const src = map.getSource(PAT_LAYERS.selection) as GeoJSONSource | undefined;
  if (!src) return;
  let p: GeoPoint | undefined;
  let r = 8;
  if (index && sel) {
    if (sel.kind === 'residence') p = index.residences.get(sel.id)?.position;
    else if (sel.kind === 'batiment') p = index.batiments.get(sel.id)?.position;
    else if (sel.kind === 'logement') {
      const l = index.logements.get(sel.id);
      p = (sel.payload?.displayPosition as GeoPoint | undefined) ?? l?.position;
      r = 4;
    } else if (sel.kind === 'adresse') p = sel.payload?.position as GeoPoint | undefined;
    if (sel.kind === 'residence' || sel.kind === 'batiment') r = 10;
  }
  src.setData({ type: 'FeatureCollection', features: p ? [{ type: 'Feature', geometry: pt(p), properties: { r } }] : [] });
}
