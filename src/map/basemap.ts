import type { Map as MlMap } from 'maplibre-gl';
import { basemaps } from '../config/layers.config';

export const BASEMAP_LAYER = 'basemap';

export function applyBasemap(map: MlMap, id: string) {
  const def = basemaps.find((b) => b.id === id) ?? basemaps[0];
  const firstLayer = map.getStyle().layers.find((l) => l.id !== BASEMAP_LAYER)?.id;
  if (map.getLayer(BASEMAP_LAYER)) map.removeLayer(BASEMAP_LAYER);
  if (map.getSource(BASEMAP_LAYER)) map.removeSource(BASEMAP_LAYER);
  map.addSource(BASEMAP_LAYER, { type: 'raster', tiles: def.tiles, tileSize: 256, maxzoom: def.maxzoom, attribution: def.attribution });
  map.addLayer({ id: BASEMAP_LAYER, type: 'raster', source: BASEMAP_LAYER, paint: { 'raster-fade-duration': 150, ...(def.paint ?? {}) } }, firstLayer);
}
