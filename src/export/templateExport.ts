/**
 * Exports types : applique un modèle défini par l'administrateur à une zone choisie par
 * l'utilisateur, soit sur la carte principale (carte dynamique), soit sur une carte hors écran
 * à la taille exacte du modèle (image), indépendante de l'écran de l'utilisateur.
 */
import { Map as MlMap } from 'maplibre-gl';
import { appConfig } from '../config/app.config';
import { basemaps, referenceLayers } from '../config/layers.config';
import { ZONE_LABELS, type ExportTemplate, type ZoneType } from '../config/siteConfig';
import type { GeoPoint } from '../domain/model';
import { EMPTY_FILTERS, type Filters, type PatrimoineIndex } from '../domain/patrimoineIndex';
import { applyBasemap } from '../map/basemap';
import { applyRepresentation, ensurePatrimoineLayers, PAT_ANCHOR, updatePatrimoineData } from '../map/patrimoineLayers';
import { ReferenceLayerManager } from '../map/referenceLayers';
import { locate } from '../store/navigation';
import { useAppStore, type LayerState, type PatrimoineStyle } from '../store/useAppStore';
import { composeMapImage } from './imageExport';
import { download } from './excelExport';

type Bounds = [[number, number], [number, number]];

export interface ZoneOption {
  value: string;
  label: string;
  hint?: string;
}

/** Zones disponibles d'un type donné (uniquement celles où le bailleur a du patrimoine). */
export function zoneOptions(index: PatrimoineIndex, type: ZoneType): ZoneOption[] {
  const out = new Map<string, ZoneOption & { n: number }>();
  const add = (value: string | undefined, label: string | undefined, n: number) => {
    if (!value) return;
    const o = out.get(value) ?? { value, label: label ?? value, n: 0 };
    o.n += n;
    out.set(value, o);
  };
  for (const r of index.residences.values()) {
    if (type === 'residence') add(r.id, `${r.nom} (${r.code})`, r.nbLogements);
    else if (type === 'commune') add(r.communeInsee, index.communes.get(r.communeInsee ?? '')?.nom ?? r.communeNom, r.nbLogements);
    else if (type === 'epci') {
      const e = index.epciOf(r.communeInsee);
      add(e.code, e.nom, r.nbLogements);
    } else if (type === 'departement') add(r.communeInsee?.slice(0, 2), `Département ${r.communeInsee?.slice(0, 2)}`, r.nbLogements);
    else if (type === 'agence') add(r.agenceId, index.agenceNom(r.agenceId), r.nbLogements);
  }
  return [...out.values()]
    .map((o) => ({ value: o.value, label: o.label, hint: `${o.n.toLocaleString('fr-FR')} lgt` }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function zoneFilters(type: ZoneType, id: string): Filters {
  const f: Filters = { ...EMPTY_FILTERS, departements: [] };
  if (type === 'residence') f.residences = [id];
  if (type === 'commune') f.communes = [id];
  if (type === 'epci') f.epcis = [id];
  if (type === 'agence') f.agences = [id];
  if (type === 'departement') f.departements = [id];
  return f;
}

function boundsOf(points: (GeoPoint | undefined)[]): Bounds | undefined {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of points) {
    if (!p) continue;
    w = Math.min(w, p.lon); e = Math.max(e, p.lon); s = Math.min(s, p.lat); n = Math.max(n, p.lat);
  }
  if (!Number.isFinite(w)) return undefined;
  const pad = 0.0015; // évite une emprise nulle (résidence d'un seul bâtiment)
  return [[w - pad, s - pad], [e + pad, n + pad]];
}

export function zoneBounds(index: PatrimoineIndex, type: ZoneType, id: string): Bounds | undefined {
  if (type === 'residence') {
    const r = index.residences.get(id);
    return boundsOf([r?.position, ...(r?.batimentIds.map((b) => index.batiments.get(b)?.position) ?? [])]);
  }
  if (type === 'departement') return boundsOf([...index.residences.values()].filter((r) => r.communeInsee?.startsWith(id)).map((r) => r.position));
  const t = locate(index, { kind: type, id });
  return t.bounds ?? (t.position ? boundsOf([t.position]) : undefined);
}

export function zoneName(index: PatrimoineIndex, type: ZoneType, id: string): string {
  return zoneOptions(index, type).find((o) => o.value === id)?.label.replace(/ \([^)]*\)$/, '') ?? `${ZONE_LABELS[type]} ${id}`;
}

function templateStyle(tpl: ExportTemplate, base: PatrimoineStyle): PatrimoineStyle {
  return { ...base, visible: true, colorBy: tpl.colorBy, sizeMode: tpl.sizeMode, sizeScale: tpl.sizeScale, representation: tpl.representation, labels: tpl.labels, hidden: {} };
}

function templateLayers(tpl: ExportTemplate, current: Record<string, LayerState>): Record<string, LayerState> {
  const out: Record<string, LayerState> = {};
  for (const [id, st] of Object.entries(current)) out[id] = { ...st, visible: tpl.layers.includes(id) };
  return out;
}

const basemapOf = (tpl: ExportTemplate) => (basemaps.find((b) => b.id === tpl.basemap) ?? basemaps[0]).id;

/** Carte dynamique : applique le modèle à la carte principale et cadre la zone. */
export function applyTemplateToMap(tpl: ExportTemplate, type: ZoneType, id: string) {
  const s = useAppStore.getState();
  if (!s.index) return;
  const bounds = zoneBounds(s.index, type, id);
  useAppStore.setState({
    basemap: basemapOf(tpl),
    layers: templateLayers(tpl, s.layers),
    patrimoine: templateStyle(tpl, s.patrimoine),
    filters: tpl.restrictToZone ? zoneFilters(type, id) : { ...EMPTY_FILTERS, departements: [] },
    selection: undefined,
  });
  if (bounds) s.flyTo({ bounds, zoom: tpl.maxZoom });
}

/** Image : carte hors écran aux dimensions du modèle, puis composition titre + légende. */
export async function renderTemplateImage(tpl: ExportTemplate, type: ZoneType, id: string): Promise<Blob> {
  const s = useAppStore.getState();
  const index = s.index;
  if (!index) throw new Error('Données non chargées');
  const bounds = zoneBounds(index, type, id);
  if (!bounds) throw new Error('Zone sans position connue');

  const style = templateStyle(tpl, s.patrimoine);
  const filters = tpl.restrictToZone ? zoneFilters(type, id) : { ...EMPTY_FILTERS, departements: [] };
  const view = index.compute(filters, style.colorBy, new Set());
  const layers = templateLayers(tpl, s.layers);

  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-${tpl.width + 100}px;top:0;width:${tpl.width}px;height:${tpl.height}px;`;
  document.body.appendChild(div);
  const map = new MlMap({
    container: div,
    style: {
      version: 8,
      glyphs: appConfig.glyphs,
      sources: {},
      layers: [{ id: PAT_ANCHOR, type: 'background', layout: { visibility: 'none' }, paint: { 'background-opacity': 0 } }],
    },
    bounds,
    fitBoundsOptions: { padding: tpl.padding, maxZoom: tpl.maxZoom },
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    pixelRatio: tpl.pixelRatio,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  try {
    await new Promise<void>((resolve, reject) => {
      map.once('load', () => resolve());
      map.once('error', (e) => reject(e.error));
      setTimeout(() => reject(new Error('Délai dépassé au chargement de la carte')), 20000);
    });
    await applyBasemap(map, basemapOf(tpl));
    ensurePatrimoineLayers(map);
    applyRepresentation(map, style);
    updatePatrimoineData(map, index, view, style, map.getZoom(), { pieImages: new Set() }, 'export');
    const refs = new ReferenceLayerManager(map);
    refs.sync(layers, s.layerOrder, { index, view, zoom: map.getZoom() });

    // Attente des couches de référence (chargement réseau) puis du rendu complet.
    const t0 = Date.now();
    while (tpl.layers.some((l) => useAppStore.getState().layers[l]?.status === 'loading') && Date.now() - t0 < 20000) {
      await new Promise((r) => setTimeout(r, 200));
    }
    refs.sync(layers, s.layerOrder, { index, view, zoom: map.getZoom() });
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (map.loaded() && map.areTilesLoaded()) setTimeout(done, 300);
      else map.once('idle', done);
      setTimeout(done, 15000);
    });
    return await composeMapImage(map, view, {
      title: tpl.title.replace('{zone}', zoneName(index, type, id)),
      subtitle: tpl.name,
      colorBy: style.colorBy,
      basemapId: basemapOf(tpl),
    });
  } finally {
    map.remove();
    div.remove();
  }
}

export async function downloadTemplateImage(tpl: ExportTemplate, type: ZoneType, id: string) {
  const blob = await renderTemplateImage(tpl, type, id);
  const index = useAppStore.getState().index!;
  const slug = zoneName(index, type, id).normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  download(blob, `${tpl.id}-${slug}.png`);
}

/** Couches du modèle réellement disponibles (une couche désactivée en admin est ignorée). */
export const availableLayers = (tpl: ExportTemplate) => tpl.layers.filter((l) => referenceLayers.some((d) => d.id === l));
