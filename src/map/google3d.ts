/**
 * Fond Google Photorealistic 3D Tiles, rendu par deck.gl SOUS la carte MapLibre : le canvas deck.gl
 * est placé derrière le canvas (transparent) de MapLibre, qui continue de dessiner le patrimoine
 * et les couches métier par-dessus. (Le mode « entrelacé » de deck.gl 9.4 n'est pas compatible
 * avec MapLibre 6.)
 * Conditions Google : clé API, affichage des mentions de copyright de la vue, pas d'export d'image.
 * Les modules deck.gl (~1 Mo) ne sont chargés qu'à la première activation.
 */
import type { Map as MlMap } from 'maplibre-gl';
import { siteConfig } from '../config/siteConfig';
import { basemaps } from '../config/layers.config';
import { useAppStore } from '../store/useAppStore';

type Overlay = { setProps(p: unknown): void; _container?: HTMLElement } & object;
let overlay: Overlay | undefined;
let creditsEl: HTMLDivElement | undefined;

/** Échec : message + retour au premier fond classique (évite une carte sans fond). */
function abort(message: string) {
  const s = useAppStore.getState();
  s.notify(message, 'error');
  const fallback = basemaps.find((b) => !b.google3d);
  if (fallback) s.set({ basemap: fallback.id });
}

export async function enableGoogle3D(map: MlMap) {
  const key = siteConfig.services.googleMapsKey;
  if (!key) {
    abort('Fond Google 3D : aucune clé API configurée (administration → Services & API).');
    return;
  }
  // Vérification préalable (clé, API activée, réseau) : message clair plutôt qu'une erreur interne.
  const ROOT = 'https://tile.googleapis.com/v1/3dtiles/root.json';
  try {
    const res = await fetch(ROOT, { headers: { 'X-GOOG-API-KEY': key } });
    if (!res.ok) {
      abort(
        res.status === 403 || res.status === 400
          ? 'Google 3D refusé : clé invalide, API « Map Tiles » non activée ou domaine non autorisé pour cette clé.'
          : res.status === 429
            ? 'Google 3D : quota atteint.'
            : `Google 3D indisponible (HTTP ${res.status}).`,
      );
      return;
    }
  } catch {
    abort('Google 3D injoignable : le réseau bloque probablement tile.googleapis.com.');
    return;
  }
  const [{ MapboxOverlay }, { Tile3DLayer }, { Tiles3DLoader }] = await Promise.all([
    import('@deck.gl/mapbox'),
    import('@deck.gl/geo-layers'),
    import('@loaders.gl/3d-tiles'),
  ]);
  if (!creditsEl) {
    creditsEl = document.createElement('div');
    creditsEl.className = 'google-credits';
    map.getContainer().appendChild(creditsEl);
  }
  creditsEl.textContent = 'Google';
  let errored = false;
  const fail = () => {
    if (errored) return;
    errored = true;
    abort('Google 3D indisponible : clé invalide, API « Map Tiles » non activée, quota atteint ou réseau bloqué.');
  };
  const layer = new Tile3DLayer({
    id: 'google-3d',
    data: ROOT,
    loader: Tiles3DLoader,
    loadOptions: { fetch: { headers: { 'X-GOOG-API-KEY': key } } },
    operation: 'terrain+draw',
    onTilesetLoad: (tileset: { options: { onTraversalComplete?: (t: unknown[]) => unknown[] } }) => {
      tileset.options.onTraversalComplete = (selected) => {
        const credits = new Set<string>();
        for (const t of selected as { content?: { gltf?: { asset?: { copyright?: string } } } }[]) {
          t.content?.gltf?.asset?.copyright?.split(';').forEach((c) => c.trim() && credits.add(c.trim()));
        }
        if (creditsEl) creditsEl.textContent = ['Google', ...credits].join(' · ');
        return selected;
      };
    },
    onTileError: fail,
  } as never);
  if (!overlay) {
    overlay = new MapboxOverlay({ interleaved: false, layers: [layer], onError: fail }) as unknown as Overlay;
    map.addControl(overlay as never);
    // Le rendu deck.gl passe DERRIÈRE le canvas MapLibre (premier enfant, plein cadre).
    const el = overlay._container;
    if (el) {
      Object.assign(el.style, { width: '100%', height: '100%', zIndex: '0' });
      map.getContainer().insertBefore(el, map.getContainer().firstChild);
    }
  } else overlay.setProps({ layers: [layer] });

  map.dragRotate.enable();
  map.touchZoomRotate.enableRotation();
  map.setMaxPitch(80);
  map.easeTo({ pitch: 60, duration: 800 });
}

export function disableGoogle3D(map: MlMap) {
  if (!overlay) return;
  map.removeControl(overlay as never);
  overlay._container?.remove();
  overlay = undefined;
  creditsEl?.remove();
  creditsEl = undefined;
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
}
