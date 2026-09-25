import { useEffect, useRef, useState } from 'react';
import { Map as MlMap, NavigationControl, Popup, ScaleControl, setWorkerUrl, type MapGeoJSONFeature, type PointLike } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { appConfig } from '../config/app.config';
import type { EntityRef } from '../domain/model';
import { useAppStore } from '../store/useAppStore';
import { useFilteredView } from '../store/useFilteredView';
import { applyBasemap } from './basemap';
import { disableGoogle3D, enableGoogle3D } from './google3d';
import { basemaps } from '../config/layers.config';
import { mapRef } from './mapRef';
import {
  applyRepresentation,
  ensurePatrimoineLayers,
  INTERACTIVE_PAT_LAYERS,
  PAT_ANCHOR,
  updatePatrimoineData,
  updateSelection,
  type PatrimoineRenderCache,
} from './patrimoineLayers';
import { INTERACTIVE_REF_LAYERS, ReferenceLayerManager, setLastView } from './referenceLayers';

// Worker MapLibre empaqueté explicitement (compatible dev + build).
setWorkerUrl(maplibreWorkerUrl);

/** Priorité de sélection lorsque plusieurs objets se superposent sous le clic. */
const CLICK_PRIORITY = [...INTERACTIVE_PAT_LAYERS, 'ref-ban-circle', 'ref-qpv-fill', 'ref-apl-fill', 'ref-pinel-fill', 'ref-communes-fill', 'ref-epci-fill'];

function featureToRef(f: MapGeoJSONFeature): EntityRef | undefined {
  const p = f.properties ?? {};
  const layer = f.layer.id;
  if (layer.startsWith('pat-')) {
    if (p.kind === 'logement' && f.geometry.type === 'Point') {
      const [lon, lat] = f.geometry.coordinates;
      return { kind: 'logement', id: String(p.id), payload: { displayPosition: { lon, lat } } };
    }
    return { kind: p.kind, id: String(p.id) };
  }
  if (layer === 'ref-ban-circle' && f.geometry.type === 'Point') {
    const [lon, lat] = f.geometry.coordinates;
    return { kind: 'adresse', id: String(p.code), payload: { label: p.label, position: { lon, lat } } };
  }
  if (layer === 'ref-qpv-fill') return { kind: 'qpv', id: String(p.code), payload: { ...p } };
  if (layer === 'ref-epci-fill') return { kind: 'epci', id: String(p.code) };
  if (layer.startsWith('ref-')) return { kind: 'commune', id: String(p.code) };
  return undefined;
}

export function MapView() {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MlMap>();
  const refManager = useRef<ReferenceLayerManager>(undefined);
  const cache = useRef<PatrimoineRenderCache>({ pieImages: new Set() });

  const view = useFilteredView();
  const index = useAppStore((s) => s.index);
  const basemap = useAppStore((s) => s.basemap);
  const patrimoine = useAppStore((s) => s.patrimoine);
  const layers = useAppStore((s) => s.layers);
  const layerOrder = useAppStore((s) => s.layerOrder);
  const selection = useAppStore((s) => s.selection);
  const flyTarget = useAppStore((s) => s.flyTarget);
  const zoom = useAppStore((s) => s.zoom);

  /* Initialisation */
  useEffect(() => {
    if (!container.current) return;
    const m = new MlMap({
      container: container.current,
      style: {
        version: 8,
        glyphs: appConfig.glyphs,
        sources: {},
        layers: [{ id: PAT_ANCHOR, type: 'background', layout: { visibility: 'none' }, paint: { 'background-opacity': 0 } }],
      },
      bounds: appConfig.initialBounds,
      fitBoundsOptions: { padding: 20 },
      maxBounds: appConfig.maxBounds,
      attributionControl: { compact: true },
      canvasContextAttributes: { preserveDrawingBuffer: true }, // export image
      dragRotate: false,
      pitchWithRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    m.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right');
    m.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-right');
    m.on('load', () => {
      applyBasemap(m, useAppStore.getState().basemap);
      ensurePatrimoineLayers(m);
      refManager.current = new ReferenceLayerManager(m);
      mapRef.current = m;
      useAppStore.getState().set({ zoom: m.getZoom() });
      setMap(m);
    });
    m.on('zoomend', () => useAppStore.getState().set({ zoom: Math.round(m.getZoom() * 10) / 10 }));
    m.on('moveend', () => {
      const s = useAppStore.getState();
      if (s.layers.ban?.visible) refManager.current?.sync(s.layers, s.layerOrder, { index: s.index, zoom: m.getZoom() });
    });

    // Clic : sélection de l'objet prioritaire sous le curseur.
    m.on('click', (e) => {
      const bbox: [PointLike, PointLike] = [
        [e.point.x - 4, e.point.y - 4],
        [e.point.x + 4, e.point.y + 4],
      ];
      const available = [...INTERACTIVE_PAT_LAYERS, ...INTERACTIVE_REF_LAYERS].filter((l) => m.getLayer(l));
      const feats = m.queryRenderedFeatures(bbox, { layers: available });
      feats.sort((a, b) => CLICK_PRIORITY.indexOf(a.layer.id) - CLICK_PRIORITY.indexOf(b.layer.id));
      const ref = feats.length ? featureToRef(feats[0]) : undefined;
      useAppStore.getState().select(ref);
    });

    // Survol : curseur + infobulle légère.
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 10, className: 'map-tooltip' });
    let hovered: { source: string; id: string | number } | undefined;
    m.on('mousemove', (e) => {
      const available = [...INTERACTIVE_PAT_LAYERS, 'ref-ban-circle', 'ref-qpv-fill'].filter((l) => m.getLayer(l));
      const f = m.queryRenderedFeatures(e.point, { layers: available })[0];
      if (hovered) m.setFeatureState(hovered, { hover: false });
      hovered = undefined;
      m.getCanvas().style.cursor = f ? 'pointer' : '';
      if (!f) {
        popup.remove();
        return;
      }
      if (f.id !== undefined && f.source.startsWith('pat-')) {
        hovered = { source: f.source, id: f.id };
        m.setFeatureState(hovered, { hover: true });
      }
      const p = f.properties ?? {};
      const text =
        p.kind === 'commune'
          ? `<strong>${esc(p.nom)}</strong><br>${esc(p.label)}`
          : p.kind === 'residence'
            ? `<strong>${esc(p.nom)}</strong><br>${Number(p.n).toLocaleString('fr-FR')} logement(s)`
            : p.kind === 'batiment'
              ? `<strong>${esc(p.nom)}</strong><br>${Number(p.n).toLocaleString('fr-FR')} logement(s)`
              : p.kind === 'logement'
                ? 'Logement — cliquer pour la fiche'
                : esc(p.label ?? p.nom ?? '');
      popup.setLngLat(e.lngLat).setHTML(text).addTo(m);
    });
    m.getCanvas().addEventListener('mouseleave', () => popup.remove());

    return () => {
      mapRef.current = undefined;
      m.remove();
    };
  }, []);

  /* Fond de carte */
  useEffect(() => {
    if (!map) return;
    applyBasemap(map, basemap);
    if (basemaps.find((b) => b.id === basemap)?.google3d) void enableGoogle3D(map);
    else disableGoogle3D(map);
  }, [map, basemap]);

  /* Représentation / style patrimoine */
  useEffect(() => {
    if (map) applyRepresentation(map, patrimoine);
  }, [map, patrimoine]);

  /* Données patrimoine (dépend de la vue filtrée et du zoom pour les niveaux fins) */
  const viewKey = useRef(0);
  const lastView = useRef<typeof view>(undefined);
  const lastStyle = useRef<string>('');
  useEffect(() => {
    if (!map || !view || !index) return;
    const styleKey = `${patrimoine.sizeMode}|${patrimoine.colorBy}`;
    if (lastView.current !== view || lastStyle.current !== styleKey) {
      viewKey.current++;
      lastView.current = view;
      lastStyle.current = styleKey;
    }
    setLastView(view);
    updatePatrimoineData(map, index, view, patrimoine, zoom, cache.current, String(viewKey.current));
  }, [map, index, view, patrimoine, zoom]);

  /* Couches de référence */
  useEffect(() => {
    if (map) refManager.current?.sync(layers, layerOrder, { index, view, zoom });
  }, [map, layers, layerOrder, index, view, zoom]);

  /* Sélection */
  useEffect(() => {
    if (map) updateSelection(map, index, selection);
  }, [map, index, selection]);

  /* Navigation programmatique */
  useEffect(() => {
    if (!map || !flyTarget) return;
    const padding = { top: 60, bottom: 60, left: 60, right: useAppStore.getState().selection ? 420 : 60 };
    if (flyTarget.bounds) map.fitBounds(flyTarget.bounds, { padding, maxZoom: flyTarget.zoom ?? 16, duration: 900 });
    else if (flyTarget.position) {
      map.flyTo({ center: [flyTarget.position.lon, flyTarget.position.lat], zoom: flyTarget.zoom ?? map.getZoom(), duration: 900, padding });
    }
  }, [map, flyTarget]);

  return <div ref={container} className="map-container" role="application" aria-label="Carte du patrimoine" />;
}

function esc(v: unknown) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
