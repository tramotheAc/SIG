import type { Map as MlMap } from 'maplibre-gl';
import { basemaps } from '../config/layers.config';

export const BASEMAP_LAYER = 'basemap';

export function applyBasemap(map: MlMap, id: string) {
  const def = basemaps.find((b) => b.id === id) ?? basemaps[0];
  const firstLayer = map.getStyle().layers.find((l) => l.id !== BASEMAP_LAYER)?.id;
  if (map.getLayer(BASEMAP_LAYER)) map.removeLayer(BASEMAP_LAYER);
  if (map.getSource(BASEMAP_LAYER)) map.removeSource(BASEMAP_LAYER);
  if (def.google3d) return; // canvas transparent : le rendu Google 3D (deck.gl) est dessous
  if (!def.tiles.length) {
    map.addLayer({ id: BASEMAP_LAYER, type: 'background', paint: { 'background-color': def.color ?? '#e5e7ea' } }, firstLayer);
    return;
  }
  map.addSource(BASEMAP_LAYER, { type: 'raster', tiles: def.tiles, tileSize: 256, maxzoom: def.maxzoom, attribution: def.attribution });
  map.addLayer({ id: BASEMAP_LAYER, type: 'raster', source: BASEMAP_LAYER, paint: { 'raster-fade-duration': 150, ...(def.paint ?? {}) } }, firstLayer);
}
