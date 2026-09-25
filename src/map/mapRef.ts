import type { Map as MlMap } from 'maplibre-gl';

/** Référence partagée vers l'instance MapLibre (export image, zoom programmatique). */
export const mapRef: { current?: MlMap } = {};
