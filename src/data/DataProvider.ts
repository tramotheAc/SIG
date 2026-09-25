import type { PatrimoineDataset } from '../domain/model';

/**
 * Contrat d'accès aux données métier.
 *
 * L'application ne connaît QUE cette interface et le modèle normalisé (domain/model.ts).
 * Implémentations :
 *   - ExcelDataProvider : fichier Excel au format des tables DWH (POC)
 *   - ApiDataProvider   : API internes du bailleur (squelette, voir docs/API_MIGRATION.md)
 *
 * Le POC charge l'intégralité du patrimoine en mémoire (≈ 30 000 logements, quelques Mo),
 * ce qui est le plus performant à cette volumétrie. Pour une source API volumineuse, les
 * méthodes optionnelles `loadInBounds` / `loadChildren` permettent un chargement progressif
 * (par emprise ou à la demande) sans changer l'UI : le store fusionne les objets reçus.
 */
export interface DataProvider {
  readonly id: string;
  readonly label: string;

  /** Charge le jeu de données (ou le socle initial : agences + résidences). */
  load(options?: LoadOptions): Promise<PatrimoineDataset>;

  /** Optionnel : charge les objets détaillés présents dans une emprise [ouest, sud, est, nord]. */
  loadInBounds?(bbox: [number, number, number, number], level: 'batiment' | 'logement'): Promise<Partial<PatrimoineDataset>>;

  /** Optionnel : charge les enfants d'un objet (bâtiments d'une résidence, logements d'un bâtiment). */
  loadChildren?(kind: 'residence' | 'batiment', id: string): Promise<Partial<PatrimoineDataset>>;
}

export interface LoadOptions {
  signal?: AbortSignal;
  onProgress?: (step: string, ratio?: number) => void;
}

/** Erreur « métier » affichable telle quelle à l'utilisateur. */
export class DataSourceError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly detail?: string,
  ) {
    super(userMessage);
    this.name = 'DataSourceError';
  }
}
