import type { Agence, Batiment, Logement, PatrimoineDataset, Residence } from '../../domain/model';
import { DataSourceError, type DataProvider, type LoadOptions } from '../DataProvider';

/**
 * SQUELETTE — DataProvider pour les futures API internes du bailleur.
 *
 * Les endpoints ne sont pas connus : ils sont décrits par `ApiEndpoints` et les réponses
 * sont traduites vers le modèle par des fonctions `map*` à adapter (équivalent du mapping Excel).
 * Voir docs/API_MIGRATION.md.
 *
 * Aucun secret ne doit être placé ici : l'authentification passe par le cookie de session /
 * SSO de l'intranet ou par un backend-for-frontend (BFF) qui détient les jetons.
 */
export interface ApiEndpoints {
  baseUrl: string;
  agences: string; // ex. '/agences'
  residences: string; // ex. '/residences'
  batiments: string; // ex. '/batiments'
  logements: string; // ex. '/logements'
  pageSize: number;
}

export interface ApiMappers {
  agence(raw: unknown): Agence;
  residence(raw: unknown): Residence;
  batiment(raw: unknown): Batiment;
  logement(raw: unknown): Logement;
}

export class ApiDataProvider implements DataProvider {
  readonly id = 'api';
  readonly label = 'API patrimoine';

  constructor(
    private readonly endpoints: ApiEndpoints,
    private readonly mappers: ApiMappers,
    private readonly fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {}

  async load(options: LoadOptions = {}): Promise<PatrimoineDataset> {
    const [agences, residences, batiments, logements] = await Promise.all([
      this.fetchAll(this.endpoints.agences, this.mappers.agence, options),
      this.fetchAll(this.endpoints.residences, this.mappers.residence, options),
      this.fetchAll(this.endpoints.batiments, this.mappers.batiment, options),
      this.fetchAll(this.endpoints.logements, this.mappers.logement, options),
    ]);
    return {
      agences,
      residences,
      batiments,
      cages: [],
      logements,
      issues: [],
      source: { kind: 'api', label: this.label, loadedAt: new Date().toISOString(), synthetic: false },
    };
  }

  /** Chargement par emprise (si l'API expose un paramètre bbox). */
  async loadInBounds(bbox: [number, number, number, number], level: 'batiment' | 'logement') {
    const path = level === 'batiment' ? this.endpoints.batiments : this.endpoints.logements;
    const mapper = level === 'batiment' ? this.mappers.batiment : this.mappers.logement;
    const items = await this.fetchAll(`${path}?bbox=${bbox.join(',')}`, mapper as (r: unknown) => Batiment | Logement, {});
    return level === 'batiment' ? { batiments: items as Batiment[] } : { logements: items as Logement[] };
  }

  /** Pagination générique `?page=&size=` — à adapter au contrat réel de l'API. */
  private async fetchAll<T>(path: string, map: (r: unknown) => T, options: LoadOptions): Promise<T[]> {
    const out: T[] = [];
    for (let page = 0; ; page++) {
      const sep = path.includes('?') ? '&' : '?';
      const url = `${this.endpoints.baseUrl}${path}${sep}page=${page}&size=${this.endpoints.pageSize}`;
      let res: Response;
      try {
        res = await this.fetchImpl(url, { signal: options.signal, credentials: 'include' });
      } catch {
        throw new DataSourceError('Le service patrimoine est injoignable. Réessayez dans quelques instants.');
      }
      if (!res.ok) throw new DataSourceError('Le service patrimoine a renvoyé une erreur.', `HTTP ${res.status} ${url}`);
      const body = (await res.json()) as { items?: unknown[] } | unknown[];
      const items = Array.isArray(body) ? body : (body.items ?? []);
      out.push(...items.map(map));
      options.onProgress?.(`Chargement ${path}…`);
      if (items.length < this.endpoints.pageSize) break;
    }
    return out;
  }
}
