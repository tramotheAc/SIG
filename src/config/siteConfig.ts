/**
 * Configuration « site » éditable depuis la page d'administration.
 *
 * Le site est statique : la configuration publiée est un fichier `config/site.json` servi à côté
 * de l'application. Ordre de priorité au démarrage :
 *   1. brouillon enregistré dans CE navigateur par la page admin (prévisualisation) ;
 *   2. `config/site.json` publié ;
 *   3. valeurs par défaut du code (layers.config.ts, app.config.ts…).
 *
 * La configuration est appliquée AVANT le rendu de l'application (voir main.tsx) : les modules
 * de configuration existants sont ajustés en place, les composants n'ont presque rien à connaître.
 */
import { appConfig } from './app.config';
import { basemaps, referenceLayers, zonageFiles, type ReferenceLayerDef } from './layers.config';
import { COLOR_BY_OPTIONS, type ColorBy } from '../domain/symbology';

export type Control = 'opacity' | 'color' | 'width' | 'size' | 'labels';
export type TabKey = 'patrimoine' | 'couches' | 'filtres' | 'analyse';
export type FilterKey = 'agences' | 'communes' | 'epcis' | 'residences' | 'qpv' | 'apl' | 'pinel' | 'roles';

export interface BasemapSetting {
  id: string;
  enabled: boolean;
  label: string;
  tiles: string[];
}

export interface LayerSetting {
  id: string;
  enabled: boolean;
  label: string;
  /** Source modifiable : URL GeoJSON (fichier ou API) ou modèle d'URL de tuiles. */
  sourceType: 'geojson' | 'tuiles' | 'service';
  url: string;
  visible: boolean;
  color: string;
  opacity: number;
  width: number;
  size: number;
  labels: boolean;
  /** Réglages proposés à l'utilisateur. */
  controls: Control[];
  millesime: string;
}

export type ZoneType = 'residence' | 'commune' | 'epci' | 'departement' | 'agence';
export type TemplateOutput = 'carte' | 'image' | 'les-deux';
export type Representation = 'auto' | 'commune' | 'residence' | 'batiment' | 'logement';

/** Modèle d'export (« export type ») défini par l'administrateur, utilisé par les utilisateurs. */
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  zoneTypes: ZoneType[];
  /** Titre de l'image ; {zone} est remplacé par le nom de la zone. */
  title: string;
  basemap: string;
  layers: string[];
  colorBy: ColorBy;
  sizeMode: 'fixe' | 'logements';
  /** Facteur de taille des points (lisibilité à l'impression). */
  sizeScale: number;
  representation: Representation;
  labels: boolean;
  /** Ne montrer que le patrimoine de la zone choisie. */
  restrictToZone: boolean;
  /** Image : taille en pixels CSS et résolution (2 = qualité impression). */
  width: number;
  height: number;
  pixelRatio: number;
  /** Marge autour de la zone (px) et zoom maximal (évite de trop zoomer sur une petite résidence). */
  padding: number;
  maxZoom: number;
  output: TemplateOutput;
}

/** Couche créée par l'administrateur (WMTS, WMS, XYZ ou GeoJSON). */
export interface CustomLayer {
  id: string;
  label: string;
  group: 'referentiels' | 'limites' | 'zonages';
  type: 'wmts' | 'wms' | 'xyz' | 'geojson';
  /** Modèle d'URL de tuiles ({z} {x} {y} / {bbox-epsg-3857}) ou URL GeoJSON. */
  url: string;
  /** Adresse GetCapabilities d'origine (WMTS / WMS), pour mémoire. */
  capabilitiesUrl?: string;
  /** GeoJSON : représentation. */
  geometry: 'fill' | 'line' | 'circle';
  labelProp: string;
  enabled: boolean;
  visible: boolean;
  color: string;
  opacity: number;
  width: number;
  size: number;
  labels: boolean;
  minzoom: number;
  controls: Control[];
  source: string;
  millesime: string;
  attribution: string;
}

/** Page web (ex. rapport Power BI) ouverte depuis la fiche d'un objet, dans un cadre intégré. */
export type EmbedKind = 'residence' | 'batiment' | 'logement' | 'commune' | 'epci' | 'agence' | 'qpv';
export interface EmbedConfig {
  kind: EmbedKind;
  enabled: boolean;
  /** Texte du bouton dans la fiche. */
  label: string;
  /** Ouverture : panneau intégré (iframe) ou nouvel onglet (sites qui refusent l'intégration). */
  mode?: 'panneau' | 'onglet';
  /** Adresse avec variables : {id} {code} {nom} {insee} {commune} {epci} {epciNom} {agence} {agenceNom} {departement}. */
  url: string;
}
export const EMBED_KIND_LABELS: Record<EmbedKind, string> = {
  residence: 'Résidence',
  batiment: 'Bâtiment / adresse',
  logement: 'Logement',
  commune: 'Commune',
  epci: 'EPCI',
  agence: 'Agence',
  qpv: 'QPV',
};

export const ZONE_LABELS: Record<ZoneType, string> = {
  residence: 'Résidence',
  commune: 'Commune',
  epci: 'EPCI',
  departement: 'Département',
  agence: 'Agence',
};

/** API REST au format Data API Builder (GET /rest/{entité}, pagination « nextLink »). */
export interface ApiSourceConfig {
  baseUrl: string;
  /** Nom de l'entité exposée pour chaque table DWH (vide = table non chargée). */
  entities: { organisation: string; patrimoine: string; lot: string; client: string; affectations: string };
  /** Filtre OData facultatif par entité (ex. Indicateur_annulation eq 0). */
  filters: { organisation: string; patrimoine: string; lot: string; client: string; affectations: string };
  pageSize: number;
  /** En-tête d'authentification facultatif (visible dans le navigateur : pas de secret). */
  authHeader: string;
  authValue: string;
}

export interface SiteConfig {
  version: 1;
  exportTemplates: ExportTemplate[];
  customLayers: CustomLayer[];
  embeds: EmbedConfig[];
  data: {
    /** Source des données patrimoine : fichier Excel ou API (Data API Builder). */
    source: 'excel' | 'api';
    excelUrl: string;
    label: string;
    synthetic: boolean;
    api: ApiSourceConfig;
  };
  basemaps: BasemapSetting[];
  defaultBasemap: string;
  layers: LayerSetting[];
  ui: {
    tabs: Record<TabKey, boolean>;
    filters: Record<FilterKey, boolean>;
    colorBy: ColorBy[];
    defaultColorBy: ColorBy;
    exportExcel: boolean;
    exportImage: boolean;
    exportTemplates: boolean;
    searchBan: boolean;
  };
  services: { geoApi: string; geocodage: string; zonageApl: string; zonagePinel: string };
}

export const TAB_LABELS: Record<TabKey, string> = { patrimoine: 'Patrimoine', couches: 'Couches', filtres: 'Filtres', analyse: 'Analyse' };
export const FILTER_LABELS: Record<FilterKey, string> = {
  agences: 'Agence',
  communes: 'Commune',
  epcis: 'EPCI',
  residences: 'Résidence',
  qpv: 'QPV',
  apl: 'Zone APL',
  pinel: 'Zone Pinel',
  roles: 'Responsables métier',
};
export const CONTROL_LABELS: Record<Control, string> = { opacity: 'Opacité', color: 'Couleur', width: 'Épaisseur', size: 'Taille', labels: 'Libellés' };

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function layerToSetting(l: ReferenceLayerDef): LayerSetting {
  const k = l.kind;
  return {
    id: l.id,
    // Zones inondables (WMS Géorisques) : refus CORS des images + nom de couche non confirmé → désactivée par défaut.
    enabled: l.id !== 'inondation',
    label: l.label,
    sourceType: k.type === 'geojson-url' ? 'geojson' : k.type === 'raster' ? 'tuiles' : 'service',
    url: k.type === 'geojson-url' ? k.url : k.type === 'raster' ? k.tiles[0] : '',
    visible: false,
    color: l.defaults.color,
    opacity: l.defaults.opacity,
    width: l.defaults.width ?? 1,
    size: l.defaults.size ?? 4,
    labels: l.defaults.labels ?? false,
    controls: [...l.controls] as Control[],
    millesime: l.meta.millesime,
  };
}

/** Valeurs par défaut issues du code (capturées avant toute surcharge). */
const tpl = (t: Partial<ExportTemplate> & Pick<ExportTemplate, 'id' | 'name'>): ExportTemplate => ({
  description: '',
  zoneTypes: ['commune'],
  title: '{zone}',
  basemap: 'neutre',
  layers: [],
  colorBy: 'agence',
  sizeMode: 'logements',
  sizeScale: 1.2,
  representation: 'residence',
  labels: true,
  restrictToZone: true,
  width: 1600,
  height: 1131,
  pixelRatio: 2,
  padding: 60,
  maxZoom: 16,
  output: 'les-deux',
  ...t,
});

export const DEFAULT_EXPORT_TEMPLATES: ExportTemplate[] = [
  tpl({
    id: 'fiche-residence',
    name: 'Plan de résidence',
    description: 'Bâtiments d’une résidence sur plan, avec cadastre.',
    zoneTypes: ['residence'],
    title: 'Résidence {zone}',
    basemap: 'plan-nb',
    layers: ['cadastre'],
    representation: 'batiment',
    sizeScale: 1.6,
    maxZoom: 18,
    padding: 120,
  }),
  tpl({
    id: 'patrimoine-commune',
    name: 'Patrimoine d’une commune',
    description: 'Résidences de la commune, contours communaux et QPV.',
    zoneTypes: ['commune', 'epci'],
    title: 'Patrimoine — {zone}',
    layers: ['communes', 'qpv'],
    maxZoom: 15,
  }),
  tpl({
    id: 'carte-agence',
    name: 'Territoire d’une agence',
    description: 'Implantation d’une agence, par commune et EPCI.',
    zoneTypes: ['agence', 'departement'],
    title: '{zone}',
    layers: ['departements', 'epci'],
    representation: 'auto',
    maxZoom: 12,
  }),
];

export const DEFAULT_SITE_CONFIG: SiteConfig = clone({
  version: 1,
  exportTemplates: DEFAULT_EXPORT_TEMPLATES,
  customLayers: [],
  embeds: (['residence', 'batiment', 'logement', 'commune', 'epci', 'agence', 'qpv'] as EmbedKind[]).map((kind) => ({ kind, enabled: false, label: 'Tableau de bord', url: '' })),
  data: {
    source: 'excel',
    excelUrl: appConfig.demoDataUrl,
    label: 'Jeu de démonstration (données synthétiques)',
    synthetic: true,
    api: {
      baseUrl: 'https://entrepotdevapi.ambitiousdesert-de2c4b66.francecentral.azurecontainerapps.io/rest',
      entities: { organisation: 'Organisation', patrimoine: 'Patrimoine', lot: 'Lot', client: 'Client', affectations: '' },
      filters: { organisation: '', patrimoine: '', lot: '', client: '', affectations: '' },
      pageSize: 5000,
      authHeader: '',
      authValue: '',
    },
  },
  basemaps: basemaps.map((b) => ({ id: b.id, enabled: true, label: b.label, tiles: b.tiles })),
  defaultBasemap: basemaps[0].id,
  layers: referenceLayers.map(layerToSetting),
  ui: {
    tabs: { patrimoine: true, couches: true, filtres: true, analyse: true },
    filters: { agences: true, communes: true, epcis: true, residences: true, qpv: true, apl: true, pinel: true, roles: true },
    colorBy: COLOR_BY_OPTIONS.map((o) => o.key),
    defaultColorBy: 'agence',
    exportExcel: true,
    exportImage: true,
    exportTemplates: true,
    searchBan: true,
  },
  services: {
    geoApi: appConfig.services.geoApi,
    geocodage: appConfig.services.geocodage,
    zonageApl: zonageFiles.apl,
    zonagePinel: zonageFiles.pinel,
  },
} satisfies SiteConfig);

/** Catalogue complet (y compris éléments désactivés) pour la page admin. */
export const CATALOG = {
  basemaps: clone(basemaps.map((b) => ({ id: b.id, meta: b.meta }))),
  layers: clone(referenceLayers.map((l) => ({ id: l.id, group: l.group, geometry: l.geometry, controls: l.controls, meta: l.meta }))),
};

/** Fusion tolérante : un site.json incomplet ou ancien ne casse jamais l'application. */
export function mergeConfig(partial: Partial<SiteConfig> | undefined): SiteConfig {
  const d = clone(DEFAULT_SITE_CONFIG);
  if (!partial || typeof partial !== 'object') return d;
  const byId = <T extends { id: string }>(defs: T[], over?: Partial<T>[]) =>
    defs.map((x) => ({ ...x, ...(over?.find((o) => o?.id === x.id) ?? {}) }));
  return {
    version: 1,
    customLayers: Array.isArray(partial.customLayers) ? partial.customLayers : [],
    embeds: d.embeds.map((e) => ({ ...e, ...((partial.embeds ?? []).find((x) => x?.kind === e.kind) ?? {}) })),
    exportTemplates: Array.isArray(partial.exportTemplates) ? partial.exportTemplates.map((t) => tpl({ ...t })) : d.exportTemplates,
    data: {
      ...d.data,
      ...(partial.data ?? {}),
      api: {
        ...d.data.api,
        ...(partial.data?.api ?? {}),
        entities: { ...d.data.api.entities, ...(partial.data?.api?.entities ?? {}) },
        filters: { ...d.data.api.filters, ...(partial.data?.api?.filters ?? {}) },
      },
    },
    basemaps: byId(d.basemaps, partial.basemaps),
    defaultBasemap: partial.defaultBasemap ?? d.defaultBasemap,
    layers: byId(d.layers, partial.layers),
    ui: {
      ...d.ui,
      ...(partial.ui ?? {}),
      tabs: { ...d.ui.tabs, ...(partial.ui?.tabs ?? {}) },
      filters: { ...d.ui.filters, ...(partial.ui?.filters ?? {}) },
      colorBy: (partial.ui?.colorBy ?? d.ui.colorBy).filter((k) => d.ui.colorBy.includes(k)),
    },
    services: { ...d.services, ...(partial.services ?? {}) },
  };
}

/* ------------------------------------------------------------------ */
/* Chargement / brouillon                                              */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = 'atlas.siteConfig.draft';
export const SITE_JSON_URL = `${import.meta.env.BASE_URL}config/site.json`;

export function readDraft(): Partial<SiteConfig> | undefined {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}
export function saveDraft(cfg: SiteConfig) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg));
  } catch {
    /* stockage indisponible : la prévisualisation ne sera pas conservée */
  }
}
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Configuration effective de la session. */
export let siteConfig: SiteConfig = clone(DEFAULT_SITE_CONFIG);
export let siteConfigOrigin: 'brouillon' | 'publiée' | 'défaut' = 'défaut';
export let publishedConfig: SiteConfig = clone(DEFAULT_SITE_CONFIG);

export async function loadSiteConfig(): Promise<SiteConfig> {
  let published: Partial<SiteConfig> | undefined;
  try {
    const res = await fetch(SITE_JSON_URL, { cache: 'no-cache' });
    if (res.ok && !(res.headers.get('content-type') ?? '').includes('text/html')) published = await res.json();
  } catch {
    /* pas de site.json : valeurs par défaut */
  }
  publishedConfig = mergeConfig(published);
  const draft = readDraft();
  siteConfig = draft ? mergeConfig(draft) : publishedConfig;
  siteConfigOrigin = draft ? 'brouillon' : published ? 'publiée' : 'défaut';
  applySiteConfig(siteConfig);
  return siteConfig;
}

/** Applique la configuration aux modules de configuration (avant création du store). */
export function applySiteConfig(cfg: SiteConfig) {
  // Services
  const services = appConfig.services as { geoApi: string; geocodage: string };
  services.geoApi = cfg.services.geoApi;
  services.geocodage = cfg.services.geocodage;
  zonageFiles.apl = cfg.services.zonageApl;
  zonageFiles.pinel = cfg.services.zonagePinel;

  // Fonds de carte : filtrage + surcharge, fond par défaut en tête.
  const bm = [...basemaps];
  basemaps.length = 0;
  for (const s of cfg.basemaps) {
    const def = bm.find((b) => b.id === s.id);
    if (!def || !s.enabled) continue;
    basemaps.push({ ...def, label: s.label || def.label, tiles: s.tiles?.length || !def.tiles.length ? s.tiles : def.tiles });
  }
  if (!basemaps.length) basemaps.push(bm[0]);
  const i = basemaps.findIndex((b) => b.id === cfg.defaultBasemap);
  if (i > 0) basemaps.unshift(...basemaps.splice(i, 1));

  // Couches de référence
  const layers = [...referenceLayers];
  referenceLayers.length = 0;
  for (const s of cfg.layers) {
    const def = layers.find((l) => l.id === s.id);
    if (!def || !s.enabled) continue;
    const kind =
      def.kind.type === 'geojson-url' && s.url
        ? { ...def.kind, url: s.url }
        : def.kind.type === 'raster' && s.url
          ? { ...def.kind, tiles: [s.url] }
          : def.kind;
    referenceLayers.push({
      ...def,
      label: s.label || def.label,
      kind,
      controls: s.controls,
      defaults: { ...def.defaults, color: s.color, opacity: s.opacity, width: s.width, size: s.size, labels: s.labels },
      meta: { ...def.meta, millesime: s.millesime || def.meta.millesime, endpoint: s.url || def.meta.endpoint },
    });
  }
  // Couches créées dans l'administration
  for (const c of cfg.customLayers) if (c.enabled && c.url) referenceLayers.push(customToDef(c));
}

export function customToDef(c: CustomLayer): ReferenceLayerDef {
  const raster = c.type !== 'geojson';
  return {
    id: c.id,
    label: c.label,
    group: c.group,
    geometry: raster ? 'raster' : c.geometry,
    kind: raster ? { type: 'raster', tiles: [c.url], tileSize: 256 } : { type: 'geojson-url', url: c.url },
    defaults: { color: c.color, opacity: c.opacity, width: c.width, size: c.size, labels: c.labels },
    minzoom: c.minzoom || undefined,
    interactive: !raster,
    labelProp: c.labelProp || 'nom',
    controls: raster ? c.controls.filter((k) => k === 'opacity') : c.controls,
    meta: {
      source: c.source || 'Couche ajoutée par l’administrateur',
      type: c.type.toUpperCase(),
      endpoint: c.capabilitiesUrl || c.url,
      millesime: c.millesime || '—',
      format: raster ? 'Tuiles image' : 'GeoJSON',
      crs: raster ? 'EPSG:3857' : 'EPSG:4326 (Lambert-93 converti)',
      frequence: '—',
      note: c.attribution ? `Attribution : ${c.attribution}` : undefined,
    },
  };
}

export function downloadJson(cfg: SiteConfig) {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'site.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
