/**
 * Configuration générale de l'application.
 * Tous les paramètres susceptibles d'évoluer (URLs, seuils, symbologie) sont centralisés ici
 * ou dans les fichiers voisins (layers.config.ts, excel.mapping.ts, symbology.config.ts).
 * Aucune clé secrète ne doit figurer dans ce fichier : il est embarqué dans le frontend.
 */
export const appConfig = {
  appName: 'Atlas Patrimoine',

  /** Emprise initiale : Bretagne + Loire-Atlantique (lon/lat WGS84). */
  initialBounds: [[-5.2, 46.85], [-0.95, 48.95]] as [[number, number], [number, number]],
  /** Emprise de navigation maximale (toute la France métropolitaine + marge). */
  maxBounds: [[-12, 40], [12, 53]] as [[number, number], [number, number]],

  /** Départements du territoire du bailleur (utilisés pour charger les référentiels). */
  departements: ['22', '29', '35', '56', '44'],

  /** Fichier de démonstration chargé au démarrage (données SYNTHÉTIQUES). */
  demoDataUrl: `${import.meta.env.BASE_URL}demo/patrimoine_demo.xlsx`,

  /** Import Excel : taille maximale acceptée. */
  maxImportSizeMb: 60,

  /**
   * Seuils de zoom de la représentation automatique (voir docs/ARCHITECTURE.md §Niveaux).
   *   zoom < communeMax            → agrégats par commune
   *   communeMax ≤ zoom < residenceMax → ensembles résidentiels
   *   residenceMax ≤ zoom < batimentMax → bâtiments (adresses)
   *   zoom ≥ batimentMax           → logements
   */
  zoom: {
    communeMax: 9,
    residenceMax: 13.5,
    batimentMax: 16.5,
    flyToResidence: 15,
    flyToBatiment: 17,
    flyToLogement: 18.5,
    flyToCommune: 12,
  },

  /** Services publics (sans clé). Remplaçables par des services internes. */
  services: {
    /** API Découpage administratif (communes, EPCI, départements, contours). */
    geoApi: 'https://geo.api.gouv.fr',
    /** Géocodage BAN via la Géoplateforme IGN (successeur d'api-adresse.data.gouv.fr). */
    geocodage: 'https://data.geopf.fr/geocodage',
    /** Délai (ms) avant interrogation du géocodeur pendant la saisie. */
    geocodageDebounceMs: 300,
    /** Timeout réseau par défaut (ms). */
    timeoutMs: 15000,
  },

  /** Polices des libellés cartographiques (glyphes PBF). */
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  fonts: { regular: ['Open Sans Regular'], bold: ['Open Sans Bold'] },

  /** Distance d'analyse autour des QPV (mètres). */
  qpvBufferMeters: 300,
} as const;

export type AppConfig = typeof appConfig;
