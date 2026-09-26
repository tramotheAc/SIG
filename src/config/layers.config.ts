/**
 * Catalogue des fonds de carte et des couches de référence.
 *
 * Chaque couche est décrite par une fiche (source, type, endpoint, millésime, format,
 * système de coordonnées, fréquence de mise à jour) affichée dans l'interface (ⓘ).
 * Pour remplacer une source (ex. couche fournie par le bailleur), modifier uniquement l'entrée ici.
 *
 * ⚠ Les URLs ont été renseignées d'après la documentation publique des services ; celles marquées
 * `aVerifier: true` n'ont pas pu être testées depuis l'environnement de développement (accès
 * réseau restreint) : l'application affiche « couche indisponible » si le service ne répond pas.
 */

export interface SourceMeta {
  source: string;
  type: string;
  endpoint: string;
  millesime: string;
  format: string;
  crs: string;
  frequence: string;
  licence?: string;
  aVerifier?: boolean;
  note?: string;
}

const IGN_WMTS = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
const ign = (layer: string, format = 'image/png', style = 'normal') =>
  `${IGN_WMTS}&LAYER=${layer}&STYLE=${encodeURIComponent(style)}&FORMAT=${format}`;
const IGN_ATTR = '© IGN – Géoplateforme';

export interface BasemapDef {
  id: string;
  label: string;
  tiles: string[];
  attribution: string;
  maxzoom: number;
  /** Ajustements de rendu MapLibre (désaturation pour le plan N&B, etc.). */
  paint?: Record<string, number>;
  /** Fond uni (pas de tuiles). */
  color?: string;
  meta: SourceMeta;
}

export const basemaps: BasemapDef[] = [
  {
    id: 'neutre',
    label: 'Neutre',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
    maxzoom: 16,
    meta: {
      source: 'Esri World Light Gray Base (sans clé API)',
      type: 'Tuiles raster XYZ',
      endpoint: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer',
      millesime: 'Continu',
      format: 'PNG',
      crs: 'EPSG:3857',
      frequence: 'Continue',
      licence: 'Conditions Esri (attribution obligatoire) — à valider pour un usage en production',
      note: 'Fond gris clair peu détaillé, sans libellés : conçu pour mettre en valeur les données et pour les exports.',
    },
  },
  {
    id: 'uni',
    label: 'Uni',
    tiles: [],
    color: '#e5e7ea',
    attribution: '',
    maxzoom: 22,
    meta: {
      source: 'Aucune (fond uni)',
      type: 'Couleur unie',
      endpoint: '—',
      millesime: '—',
      format: '—',
      crs: '—',
      frequence: '—',
      note: 'Fond gris neutre, sans dépendance réseau : idéal pour lire les données métier (combiner avec Communes / Départements).',
    },
  },
  {
    id: 'plan-nb',
    label: 'Plan N&B',
    tiles: [ign('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2')],
    attribution: IGN_ATTR,
    maxzoom: 19,
    paint: { 'raster-saturation': -1, 'raster-contrast': 0.05 },
    meta: {
      source: 'IGN – Plan IGN v2 (désaturé côté client)',
      type: 'WMTS',
      endpoint: 'https://data.geopf.fr/wmts — GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      millesime: 'Mis à jour en continu par l’IGN',
      format: 'PNG',
      crs: 'EPSG:3857 (TileMatrixSet PM)',
      frequence: 'Mensuelle',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'plan',
    label: 'Plan couleur',
    tiles: [ign('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2')],
    attribution: IGN_ATTR,
    maxzoom: 19,
    meta: {
      source: 'IGN – Plan IGN v2',
      type: 'WMTS',
      endpoint: 'https://data.geopf.fr/wmts — GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      millesime: 'Mis à jour en continu par l’IGN',
      format: 'PNG',
      crs: 'EPSG:3857 (TileMatrixSet PM)',
      frequence: 'Mensuelle',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'satellite',
    label: 'Satellite',
    tiles: [ign('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg')],
    attribution: IGN_ATTR,
    maxzoom: 20,
    meta: {
      source: 'IGN – BD ORTHO® (orthophotographies)',
      type: 'WMTS',
      endpoint: 'https://data.geopf.fr/wmts — ORTHOIMAGERY.ORTHOPHOTOS',
      millesime: 'Variable selon le département (prises de vue sur 3 ans)',
      format: 'JPEG',
      crs: 'EPSG:3857 (TileMatrixSet PM)',
      frequence: 'Renouvellement triennal par département',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
];

/* ------------------------------------------------------------------ */

export type LayerGroup = 'referentiels' | 'limites' | 'zonages';
export type LayerGeometry = 'fill' | 'line' | 'circle' | 'raster';

/**
 * Nature de la donnée :
 *  - raster        : tuiles WMTS/WMS affichées telles quelles ;
 *  - geojson-url   : fichier GeoJSON (service ou fichier déposé dans public/referentiels) ;
 *  - service       : couche calculée par l'application à partir d'un service (geo.api.gouv.fr, BAN…).
 */
export type LayerKind =
  | { type: 'raster'; tiles: string[]; tileSize?: number; minzoom?: number }
  | { type: 'geojson-url'; url: string }
  | { type: 'service'; service: 'departements' | 'epci' | 'communes' | 'qpv-buffer' | 'ban' | 'zonage-apl' | 'zonage-pinel' };

export interface LayerStyleDefaults {
  color: string;
  opacity: number;
  width?: number;
  size?: number;
  labels?: boolean;
}

export interface ReferenceLayerDef {
  id: string;
  label: string;
  group: LayerGroup;
  geometry: LayerGeometry;
  kind: LayerKind;
  defaults: LayerStyleDefaults;
  /** Zoom minimal d'affichage (au-dessous, la couche est signalée « zoomer pour afficher »). */
  minzoom?: number;
  /** Couches cliquables (fiche). */
  interactive?: boolean;
  /** Propriété utilisée pour le libellé. */
  labelProp?: string;
  /** Réglages proposés à l'utilisateur. */
  controls: ('opacity' | 'color' | 'width' | 'size' | 'labels')[];
  /** Pour les couches « avec patrimoine » : option de filtre proposée. */
  patrimoineOnlyOption?: boolean;
  meta: SourceMeta;
}

const base = import.meta.env.BASE_URL;

export const referenceLayers: ReferenceLayerDef[] = [
  /* ----------------------- Référentiels ----------------------- */
  {
    id: 'cadastre',
    label: 'Parcellaire cadastral',
    group: 'referentiels',
    geometry: 'raster',
    kind: { type: 'raster', tiles: [ign('CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'image/png', 'PCI vecteur')] },
    defaults: { color: '#000000', opacity: 0.8 },
    minzoom: 14,
    controls: ['opacity'],
    meta: {
      source: 'IGN / DGFiP – Parcellaire Express (PCI)',
      type: 'WMTS',
      endpoint: 'https://data.geopf.fr/wmts — CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      millesime: 'Édition trimestrielle',
      format: 'PNG',
      crs: 'EPSG:3857 (TileMatrixSet PM)',
      frequence: 'Trimestrielle',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'ban',
    label: 'Adresses (BAN)',
    group: 'referentiels',
    geometry: 'circle',
    kind: { type: 'service', service: 'ban' },
    defaults: { color: '#5f3dc4', opacity: 0.9, size: 3.5, labels: true },
    minzoom: 17,
    interactive: true,
    labelProp: 'numero',
    controls: ['opacity', 'color', 'size', 'labels'],
    meta: {
      source: 'Base Adresse Nationale (via service de géocodage de la Géoplateforme)',
      type: 'API REST (géocodage inverse autour du centre de la carte)',
      endpoint: 'https://data.geopf.fr/geocodage/reverse',
      millesime: 'Continu',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      frequence: 'Quotidienne',
      licence: 'Licence Ouverte Etalab 2.0',
      note: 'Affiche jusqu’à 50 adresses autour du centre de la carte à fort zoom.',
    },
  },
  {
    id: 'inondation',
    label: 'Zones inondables',
    group: 'referentiels',
    geometry: 'raster',
    kind: {
      type: 'raster',
      tileSize: 256,
      tiles: [
        'https://www.georisques.gouv.fr/services?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=ALEA_SYNT_01_01FOR,ALEA_SYNT_01_02MOY,ALEA_SYNT_01_04FAI&STYLES=&FORMAT=image/png&TRANSPARENT=true&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256',
      ],
    },
    defaults: { color: '#1c7ed6', opacity: 0.6 },
    minzoom: 9,
    controls: ['opacity'],
    meta: {
      source: 'Géorisques (MTE / BRGM) – TRI, aléa débordement de cours d’eau (fort / moyen / faible)',
      type: 'WMS',
      endpoint: 'https://www.georisques.gouv.fr/services — ALEA_SYNT_01_01FOR, _02MOY, _04FAI',
      millesime: 'Selon la date d’approbation de chaque PPR',
      format: 'PNG',
      crs: 'EPSG:3857',
      frequence: 'Au fil des approbations',
      licence: 'Licence Ouverte Etalab 2.0',
      aVerifier: true,
      note: 'Nom de couche WMS à confirmer via GetCapabilities ; possibilité d’utiliser à la place les TRI ou AZI.',
    },
  },

  /* ----------------------- Limites ----------------------- */
  {
    id: 'departements',
    label: 'Départements',
    group: 'limites',
    geometry: 'line',
    kind: { type: 'geojson-url', url: `${base}referentiels/departements.geojson` },
    defaults: { color: '#212529', opacity: 0.9, width: 2, labels: true },
    interactive: false,
    labelProp: 'nom',
    controls: ['opacity', 'color', 'width', 'labels'],
    meta: {
      source: 'IGN Admin Express, version simplifiée (projet france-geojson), livrée avec l’application',
      type: 'Fichier GeoJSON local',
      endpoint: '/referentiels/departements.geojson (Bretagne, Loire-Atlantique et départements limitrophes)',
      millesime: 'Limites départementales (stables)',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      frequence: 'Annuelle',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'epci',
    label: 'EPCI',
    group: 'limites',
    geometry: 'fill',
    kind: { type: 'service', service: 'epci' },
    defaults: { color: '#495057', opacity: 0.35, width: 1.5, labels: true },
    interactive: true,
    labelProp: 'nom',
    controls: ['opacity', 'width', 'labels'],
    patrimoineOnlyOption: true,
    meta: {
      source: 'API Découpage administratif (geo.api.gouv.fr)',
      type: 'API REST',
      endpoint: 'https://geo.api.gouv.fr/epcis/{code}?format=geojson&geometry=contour',
      millesime: 'Périmètres EPCI au 1er janvier de l’année en cours',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      frequence: 'Annuelle',
      licence: 'Licence Ouverte Etalab 2.0',
      note: 'Coloration par agence (dominante) ; hachures + pastille lorsque plusieurs agences sont présentes.',
    },
  },
  {
    id: 'communes',
    label: 'Communes',
    group: 'limites',
    geometry: 'fill',
    kind: { type: 'service', service: 'communes' },
    defaults: { color: '#868e96', opacity: 0.35, width: 0.8, labels: true },
    minzoom: 7,
    interactive: true,
    labelProp: 'nom',
    controls: ['opacity', 'width', 'labels'],
    patrimoineOnlyOption: true,
    meta: {
      source: 'API Découpage administratif (geo.api.gouv.fr)',
      type: 'API REST',
      endpoint: 'https://geo.api.gouv.fr/departements/{dep}/communes?format=geojson&geometry=contour',
      millesime: 'COG INSEE de l’année en cours',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      frequence: 'Annuelle',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'qpv',
    label: 'Quartiers prioritaires (QPV)',
    group: 'limites',
    geometry: 'fill',
    kind: { type: 'geojson-url', url: `${base}referentiels/qpv.geojson` },
    defaults: { color: '#e03131', opacity: 0.45, width: 1.5, labels: true },
    interactive: true,
    labelProp: 'nom',
    controls: ['opacity', 'color', 'width', 'labels'],
    meta: {
      source: 'ANCT – Quartiers prioritaires de la politique de la ville 2024 (data.gouv.fr / SIG Ville)',
      type: 'Fichier GeoJSON local (téléchargé par `npm run referentiels:fetch`)',
      endpoint: '/referentiels/qpv.geojson',
      millesime: 'QPV 2024 (décret n° 2023-1314 du 28/12/2023)',
      format: 'GeoJSON',
      crs: 'EPSG:4326 (reprojeté si besoin par le script)',
      frequence: 'Révision de la géographie prioritaire (pluriannuelle)',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'quartiers',
    label: 'Quartiers',
    group: 'limites',
    geometry: 'fill',
    kind: { type: 'geojson-url', url: `${base}referentiels/quartiers.geojson` },
    defaults: { color: '#0b7285', opacity: 0.2, width: 1.2, labels: true },
    interactive: true,
    labelProp: 'nom',
    controls: ['opacity', 'color', 'width', 'labels'],
    meta: {
      source: 'Source à fournir (quartiers du bailleur, IRIS INSEE ou quartiers municipaux)',
      type: 'Fichier GeoJSON local',
      endpoint: '/referentiels/quartiers.geojson (propriétés attendues : code, nom)',
      millesime: 'Selon la source',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      frequence: 'Selon la source',
      note: 'Emplacement prévu pour brancher un référentiel de quartiers fourni par le bailleur.',
    },
  },

  /* ----------------------- Zonages ----------------------- */
  {
    id: 'qpv300',
    label: 'Périmètre 300 m autour des QPV',
    group: 'zonages',
    geometry: 'fill',
    kind: { type: 'service', service: 'qpv-buffer' },
    defaults: { color: '#f76707', opacity: 0.25, width: 1 },
    controls: ['opacity', 'color', 'width'],
    meta: {
      source: 'Calculé dans l’application (tampon de 300 m autour des QPV)',
      type: 'Calcul géométrique (Turf.js)',
      endpoint: '—',
      millesime: 'Celui de la couche QPV',
      format: 'GeoJSON',
      crs: 'EPSG:4326 (tampon calculé en mètres)',
      frequence: 'Recalculé au chargement',
    },
  },
  {
    id: 'apl',
    label: 'Zonage APL (1 / 2 / 3)',
    group: 'zonages',
    geometry: 'fill',
    kind: { type: 'service', service: 'zonage-apl' },
    defaults: { color: '#1971c2', opacity: 0.45, width: 0.5, labels: false },
    interactive: true,
    controls: ['opacity', 'width'],
    meta: {
      source: 'Ministère du Logement – Zonage des aides personnelles au logement (arrêté du 17/03/1978 modifié)',
      type: 'Table commune → zone (CSV local) jointe aux contours communaux',
      endpoint: '/referentiels/zonage_apl.csv (colonnes : insee;zone)',
      millesime: 'À renseigner selon le fichier téléchargé',
      format: 'CSV',
      crs: '— (jointure par code INSEE)',
      frequence: 'Rare (révisions ponctuelles)',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
  {
    id: 'pinel',
    label: 'Zonage Pinel / ABC (A bis, A, B1, B2, C)',
    group: 'zonages',
    geometry: 'fill',
    kind: { type: 'service', service: 'zonage-pinel' },
    defaults: { color: '#2f9e44', opacity: 0.45, width: 0.5, labels: false },
    interactive: true,
    controls: ['opacity', 'width'],
    meta: {
      source: 'Ministère du Logement – Zonage ABC (arrêté du 1er août 2014 modifié)',
      type: 'Table commune → zone (CSV local) jointe aux contours communaux',
      endpoint: '/referentiels/zonage_abc.csv (colonnes : insee;zone)',
      millesime: 'À renseigner selon le fichier téléchargé (dernière révision : 2024-2025)',
      format: 'CSV',
      crs: '— (jointure par code INSEE)',
      frequence: 'Révisions ponctuelles',
      licence: 'Licence Ouverte Etalab 2.0',
    },
  },
];

/** Palettes fixes des zonages (ordre = légende). */
export const zoneColors = {
  apl: { '1': '#1864ab', '2': '#4dabf7', '3': '#d0ebff' } as Record<string, string>,
  pinel: { Abis: '#5c0a0a', A: '#c92a2a', B1: '#f08c00', B2: '#fcc419', C: '#d8f5a2' } as Record<string, string>,
  qpv: { en_qpv: '#e03131', moins_300m: '#f76707', hors_qpv: '#74c0fc', inconnu: '#adb5bd' } as Record<string, string>,
};

/** Emplacements des tables de zonage (fichiers déposés dans public/referentiels). */
export const zonageFiles = {
  apl: `${base}referentiels/zonage_apl.csv`,
  pinel: `${base}referentiels/zonage_abc.csv`,
};
