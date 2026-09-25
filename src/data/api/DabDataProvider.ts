/**
 * DataProvider pour l'API de l'entrepôt exposée par Microsoft Data API Builder (DAB) :
 *   GET {baseUrl}/{Entité}?$first=N[&$filter=…]  →  { "value": [...], "nextLink": "…" }
 *
 * Les lignes reçues sont converties en « feuilles » (en-têtes + lignes) puis passées au MÊME
 * parser que l'import Excel (excelParser.ts) : mapping des colonnes, contrôles, hiérarchie et
 * rapport d'anomalies sont strictement identiques quelle que soit la source.
 */
import { excelMapping, type SheetKey } from '../../config/excel.mapping';
import type { ApiSourceConfig } from '../../config/siteConfig';
import type { PatrimoineDataset } from '../../domain/model';
import { DataSourceError, type DataProvider, type LoadOptions } from '../DataProvider';
import { parseWorkbook, type RawWorkbook } from '../excel/excelParser';

const TABLES: SheetKey[] = ['organisation', 'patrimoine', 'lot', 'client', 'affectations'];

export class DabDataProvider implements DataProvider {
  readonly id = 'api';
  readonly label: string;

  constructor(private readonly cfg: ApiSourceConfig, label = 'API entrepôt') {
    this.label = label;
  }

  private headers(): HeadersInit {
    return this.cfg.authHeader && this.cfg.authValue ? { [this.cfg.authHeader]: this.cfg.authValue } : {};
  }

  /** Toutes les lignes d'une entité, en suivant la pagination nextLink. */
  async fetchEntity(entity: string, filter: string, options: LoadOptions = {}): Promise<Record<string, unknown>[]> {
    const base = this.cfg.baseUrl.replace(/\/$/, '');
    const params = new URLSearchParams({ $first: String(this.cfg.pageSize || 5000) });
    if (filter.trim()) params.set('$filter', filter.trim());
    let url: string | undefined = `${base}/${encodeURIComponent(entity)}?${params}`;
    const rows: Record<string, unknown>[] = [];
    for (let page = 1; url && page < 10_000; page++) {
      let res: Response;
      try {
        res = await fetch(url, { headers: this.headers(), signal: options.signal });
      } catch {
        throw new DataSourceError(
          'L’API de l’entrepôt est injoignable depuis ce poste (réseau, VPN ou autorisation CORS de l’API).',
          url,
        );
      }
      if (res.status === 401 || res.status === 403) throw new DataSourceError('Accès refusé par l’API (authentification requise).', `HTTP ${res.status} ${url}`);
      if (res.status === 404) throw new DataSourceError(`Entité « ${entity} » introuvable dans l’API.`, url);
      if (!res.ok) throw new DataSourceError(`L’API a renvoyé une erreur sur « ${entity} ».`, `HTTP ${res.status} ${await res.text().catch(() => '')}`);
      const body = (await res.json()) as { value?: Record<string, unknown>[]; nextLink?: string };
      rows.push(...(body.value ?? []));
      options.onProgress?.(`${entity} : ${rows.length.toLocaleString('fr-FR')} lignes…`);
      url = body.nextLink || undefined;
    }
    return rows;
  }

  async load(options: LoadOptions = {}): Promise<PatrimoineDataset> {
    const wb: RawWorkbook = {};
    for (const key of TABLES) {
      const entity = this.cfg.entities[key]?.trim();
      if (!entity) continue;
      const rows = await this.fetchEntity(entity, this.cfg.filters[key] ?? '', options);
      wb[excelMapping[key].sheets[0]] = toSheet(rows);
    }
    options.onProgress?.('Contrôle et normalisation des données…');
    await new Promise((r) => setTimeout(r, 0)); // laisse l'interface afficher la progression
    const result = parseWorkbook(wb);
    if (result.residences.length === 0) {
      throw new DataSourceError(
        'L’API ne renvoie pas de patrimoine exploitable.',
        result.issues.filter((i) => i.level === 'error').map((i) => i.message).join('\n'),
      );
    }
    return {
      ...result,
      source: { kind: 'api', label: this.label, loadedAt: new Date().toISOString(), synthetic: false, dateActualisation: result.dateActualisation },
    };
  }
}

/** Lignes JSON → feuille (1re ligne = union des noms de colonnes). */
export function toSheet(rows: Record<string, unknown>[]): unknown[][] {
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const r of rows.slice(0, 200)) for (const k of Object.keys(r)) if (!seen.has(k)) (seen.add(k), cols.push(k));
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) (seen.add(k), cols.push(k));
  return [cols, ...rows.map((r) => cols.map((c) => r[c] ?? undefined))];
}

/** Liste des entités exposées, lue dans le document OpenAPI de DAB ({baseUrl}/openapi). */
export async function discoverEntities(baseUrl: string, headers: HeadersInit = {}): Promise<string[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/openapi`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = (await res.json()) as { paths?: Record<string, unknown> };
  const names = Object.keys(doc.paths ?? {})
    .map((p) => p.replace(/^\//, '').split('/')[0])
    .filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}
