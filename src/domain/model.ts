/**
 * Modèle métier normalisé.
 *
 * Ce modèle est la SEULE représentation des données consommée par l'UI, la carte, les
 * analyses et les exports. Il ne contient aucune référence à la structure de la source
 * (noms de colonnes Excel, format d'API…). La traduction source → modèle est faite par
 * les DataProviders (src/data/*).
 *
 * Correspondance avec le schéma DWH du bailleur :
 *   Organisation niveau 1 → Agence
 *   Patrimoine niveau 1   → Residence (ensemble résidentiel)
 *   Patrimoine niveau 2   → Batiment (adresse)
 *   Patrimoine niveau 3   → Cage (cage d'escalier)
 *   Lot (+ Client)        → Logement
 */

export interface GeoPoint {
  lon: number;
  lat: number;
}

/** Origine de la position d'un objet (utile pour signaler les positions approximatives). */
export type PositionSource = 'source' | 'derivee' | 'absente';

/** Rôles métier pouvant servir à la coloration et au filtrage. */
export interface Responsables {
  conseillerCommercial?: string;
  gerantImmobilier?: string;
  conseillerSocial?: string;
  travailleurSocial?: string;
}
export type RoleKey = keyof Responsables;

export interface Agence {
  id: string;
  code: string;
  nom: string;
  adresse?: string;
}

export interface Residence {
  id: string;
  code: string;
  nom: string;
  agenceId?: string;
  position?: GeoPoint;
  positionSource: PositionSource;
  adresse?: string;
  communeInsee?: string;
  communeNom?: string;
  codePostal?: string;
  departement?: string;
  quartier?: string;
  dateConstruction?: string;
  modeAcquisition?: string;
  lienFiche?: string;
  batimentIds: string[];
  nbLogements: number;
  responsables: Responsables;
}

/** Bâtiment = adresse (Patrimoine niveau 2). */
export interface Batiment {
  id: string;
  code: string;
  residenceId?: string;
  libelle: string;
  adresse?: string;
  agenceId?: string;
  position?: GeoPoint;
  positionSource: PositionSource;
  communeInsee?: string;
  communeNom?: string;
  codePostal?: string;
  cageIds: string[];
  logementIds: string[];
  nbLogements: number;
  responsables: Responsables;
}

/** Cage d'escalier (Patrimoine niveau 3). */
export interface Cage {
  id: string;
  code: string;
  libelle: string;
  batimentId?: string;
  residenceId?: string;
  position?: GeoPoint;
  positionSource: PositionSource;
  logementIds: string[];
}

export interface Logement {
  id: string;
  code: string;
  rpls?: string;
  cageId?: string;
  batimentId?: string;
  residenceId?: string;
  agenceId?: string;
  communeInsee?: string;
  communeNom?: string;
  adresse?: string;
  position?: GeoPoint;
  positionSource: PositionSource;
  etage?: string;
  porte?: string;
  usage?: string;
  nature?: string;
  typeLot?: string;
  individuelCollectif?: string;
  financement?: string;
  surfaceHabitable?: number;
  nbChambres?: number;
  etat?: string;
  lienFiche?: string;
  /** Occupation (sans données nominatives : le nom du client n'est jamais importé). */
  occupe?: boolean;
  responsables: Responsables;
}

export interface DataIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  /** Contexte (feuille, ligne) — affiché dans le rapport d'import, jamais les valeurs sensibles. */
  context?: string;
  /** Nombre d'occurrences regroupées. */
  count?: number;
}

export interface DatasetSource {
  kind: 'excel' | 'api' | 'memory';
  label: string;
  loadedAt: string;
  /** true si les données sont synthétiques (démo) : bandeau d'avertissement dans l'UI. */
  synthetic: boolean;
  /** Date d'actualisation déclarée par la source si connue. */
  dateActualisation?: string;
}

/** Jeu de données complet produit par un DataProvider. */
export interface PatrimoineDataset {
  agences: Agence[];
  residences: Residence[];
  batiments: Batiment[];
  cages: Cage[];
  logements: Logement[];
  issues: DataIssue[];
  source: DatasetSource;
}

/* ------------------------------------------------------------------ */
/* Référentiels territoriaux (issus des services géographiques)        */
/* ------------------------------------------------------------------ */

export interface Commune {
  insee: string;
  nom: string;
  departement?: string;
  epciCode?: string;
  epciNom?: string;
  population?: number;
  centre?: GeoPoint;
}

export interface Epci {
  code: string;
  nom: string;
}

/** Contexte géographique calculé pour une résidence (croisement avec les référentiels). */
export interface GeoContext {
  epciCode?: string;
  epciNom?: string;
  /** QPV contenant l'objet, sinon undefined. */
  qpvCode?: string;
  qpvNom?: string;
  /** Distance (m) au QPV le plus proche (0 si à l'intérieur). */
  distanceQpvM?: number;
  qpvProcheCode?: string;
  qpvProcheNom?: string;
  zoneApl?: string;
  zonePinel?: string;
}

export type QpvStatus = 'en_qpv' | 'moins_300m' | 'hors_qpv' | 'inconnu';

/** Types d'objets sélectionnables / affichables en fiche. */
export type EntityKind =
  | 'residence'
  | 'batiment'
  | 'cage'
  | 'logement'
  | 'agence'
  | 'commune'
  | 'epci'
  | 'qpv'
  | 'adresse'
  /** Zone d'une couche de surfaces (quartier, couche créée…). */
  | 'zone';

export interface EntityRef {
  kind: EntityKind;
  id: string;
  /** Données complémentaires pour les objets externes (ex. adresse BAN, QPV). */
  payload?: Record<string, unknown>;
}
