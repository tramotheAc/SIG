import type { LayerSpecification, Map as MlMap, SourceSpecification, StyleSpecification } from 'maplibre-gl';
import { appConfig } from '../config/app.config';
import { basemaps } from '../config/layers.config';

export const BASEMAP_LAYER = 'basemap';
/** Préfixe des sources / couches / sprite issus d'un style vectoriel. */
const VT = 'bm-';

const styleCache = new Map<string, Promise<StyleSpecification>>();
/** Jeton : seul le dernier fond demandé est appliqué (chargements asynchrones). */
const tokens = new WeakMap<MlMap, number>();

function isBasemapLayer(id: string) {
  return id === BASEMAP_LAYER || id.startsWith(VT);
}

function clear(map: MlMap) {
  for (const l of [...map.getStyle().layers]) if (isBasemapLayer(l.id)) map.removeLayer(l.id);
  for (const s of Object.keys(map.getStyle().sources)) if (isBasemapLayer(s)) map.removeSource(s);
  try {
    if (map.getSprite().some((s) => s.id === 'bm')) map.removeSprite('bm');
  } catch {
    /* sprite absent */
  }
}

export async function applyBasemap(map: MlMap, id: string): Promise<void> {
  const def = basemaps.find((b) => b.id === id) ?? basemaps[0];
  const token = (tokens.get(map) ?? 0) + 1;
  tokens.set(map, token);
  const firstLayer = () => map.getStyle().layers.find((l) => !isBasemapLayer(l.id))?.id;

  if (def.style) {
    let style: StyleSpecification;
    try {
      if (!styleCache.has(def.style)) {
        styleCache.set(
          def.style,
          fetch(def.style).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
        );
      }
      style = await styleCache.get(def.style)!;
    } catch (e) {
      styleCache.delete(def.style);
      console.warn('Style vectoriel indisponible', def.style, e);
      if (tokens.get(map) !== token) return;
      clear(map);
      map.addLayer({ id: BASEMAP_LAYER, type: 'background', paint: { 'background-color': '#e5e7ea' } }, firstLayer());
      return;
    }
    if (tokens.get(map) !== token) return;
    clear(map);
    addVectorStyle(map, style, def.attribution, firstLayer());
    return;
  }

  clear(map);
  if (!def.tiles.length) {
    map.addLayer({ id: BASEMAP_LAYER, type: 'background', paint: { 'background-color': def.color ?? '#e5e7ea' } }, firstLayer());
    return;
  }
  map.addSource(BASEMAP_LAYER, { type: 'raster', tiles: def.tiles, tileSize: 256, maxzoom: def.maxzoom, attribution: def.attribution });
  map.addLayer({ id: BASEMAP_LAYER, type: 'raster', source: BASEMAP_LAYER, paint: { 'raster-fade-duration': 150, ...(def.paint ?? {}) } }, firstLayer());
}

/**
 * Insère un style MapLibre complet SOUS les couches métier : sources et couches préfixées,
 * sprite nommé « bm », polices remplacées par celles de l'application (un seul serveur de glyphes).
 */
function addVectorStyle(map: MlMap, style: StyleSpecification, attribution: string, before: string | undefined) {
  for (const [sid, src] of Object.entries(style.sources)) {
    const s = { ...src } as SourceSpecification & { attribution?: string };
    if (!s.attribution && attribution) s.attribution = attribution;
    map.addSource(VT + sid, s);
  }
  const sprite = typeof style.sprite === 'string' ? style.sprite : Array.isArray(style.sprite) ? style.sprite[0]?.url : undefined;
  if (sprite) {
    try {
      map.addSprite('bm', sprite);
    } catch {
      /* sprite déjà présent */
    }
  }
  for (const layer of style.layers) {
    const l = structuredClone(layer) as LayerSpecification & { source?: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> };
    l.id = VT + l.id;
    if (l.source) l.source = VT + l.source;
    if (l.layout) {
      const font = l.layout['text-font'];
      if (Array.isArray(font) && font.every((f) => typeof f === 'string')) {
        l.layout['text-font'] = [...(font.some((f) => /bold/i.test(f)) ? appConfig.fonts.bold : appConfig.fonts.regular)];
      }
      if (l.layout['icon-image'] !== undefined) l.layout['icon-image'] = spriteRef(l.layout['icon-image']);
    }
    if (l.paint) {
      for (const k of ['fill-pattern', 'line-pattern', 'fill-extrusion-pattern', 'background-pattern']) {
        if (l.paint[k] !== undefined) l.paint[k] = spriteRef(l.paint[k]);
      }
    }
    try {
      map.addLayer(l, before);
    } catch (e) {
      console.warn('Couche de fond ignorée', l.id, e);
    }
  }
}

/** Référence d'image vers le sprite nommé « bm » (chaînes, jetons {champ} ou expressions). */
function spriteRef(v: unknown): unknown {
  if (typeof v === 'string') return v ? `bm:${v}` : v;
  if (Array.isArray(v)) return ['concat', 'bm:', ['to-string', v]];
  return v;
}
