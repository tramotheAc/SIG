/**
 * Transitions de la carte (Anime.js) : au changement de filtre ou de légende, les points du
 * patrimoine réapparaissent en fondu et se « posent » (rayon 85 % → 100 %). Court et discret.
 */
import type { Map as MlMap } from 'maplibre-gl';
import type { JSAnimation } from 'animejs';
import { tween } from '../ui/motion';
import { PAT_LAYERS } from './patrimoineLayers';

let running: JSAnimation | void;

export function revealPatrimoine(map: MlMap, opacity: number, sizeScale: number) {
  if (running) running.pause();
  const circles = [PAT_LAYERS.residences, PAT_LAYERS.batiments, PAT_LAYERS.logements].filter((l) => map.getLayer(l));
  running = tween((t) => {
    const e = 0.25 + 0.75 * t;
    for (const l of circles) {
      map.setPaintProperty(l, 'circle-opacity', opacity * e);
      map.setPaintProperty(l, 'circle-stroke-opacity', Math.min(1, opacity + 0.1) * e);
    }
    if (map.getLayer(PAT_LAYERS.communes)) map.setPaintProperty(PAT_LAYERS.communes, 'icon-opacity', opacity * e);
    map.setGlobalStateProperty('scale', sizeScale * (0.85 + 0.15 * t));
  }, 460);
}
