import { afterEach, describe, expect, it, vi } from 'vitest';
import { DabDataProvider, discoverEntities, toSheet } from '../src/data/api/DabDataProvider';
import type { ApiSourceConfig } from '../src/config/siteConfig';

const cfg: ApiSourceConfig = {
  baseUrl: 'https://api.test/rest',
  entities: { organisation: 'Organisation', patrimoine: 'Patrimoine', lot: 'Lot', client: '', affectations: '' },
  filters: { organisation: '', patrimoine: 'Indicateur_annulation eq 0', lot: '', client: '', affectations: '' },
  pageSize: 2,
  authHeader: '',
  authValue: '',
};

const DATA: Record<string, Record<string, unknown>[]> = {
  Organisation: [{ ID_organisation: 1, Niveau_organisation: 1, Code_niveau_organisation_1: 'AG1', Libelle_organisation: 'Agence Nord', Indicateur_validite: 1 }],
  Patrimoine: [
    { ID_patrimoine: 10, ID_organisation: 1, Niveau_patrimoine: 1, Code_niveau_patrimoine_1: 'E1', Libelle_patrimoine: 'Résidence A', Code_INSEE_commune: '35238', Latitude: 48.11, Longitude: -1.68, Date_construction: '1998-01-01T00:00:00' },
    { ID_patrimoine: 11, ID_organisation: 1, Niveau_patrimoine: 2, Code_niveau_patrimoine_1: 'E1', Code_niveau_patrimoine_2: '01', Libelle_patrimoine: '1 rue A', Code_INSEE_commune: '35238', Latitude: 48.111, Longitude: -1.681 },
    { ID_patrimoine: 12, ID_organisation: 1, Niveau_patrimoine: 3, Code_niveau_patrimoine_1: 'E1', Code_niveau_patrimoine_2: '01', Code_niveau_patrimoine_3: 'A', Libelle_patrimoine: 'Cage A' },
  ],
  Lot: [
    { ID_lot: 'L1', ID_patrimoine: 12, Code_lot: 'E1-01A-1' },
    { ID_lot: 'L2', ID_patrimoine: 12, Code_lot: 'E1-01A-2' },
    { ID_lot: 'L3', ID_patrimoine: 12, Code_lot: 'E1-01A-3' },
  ],
};

afterEach(() => vi.unstubAllGlobals());

function mockDab() {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (input: string) => {
    calls.push(input);
    const url = new URL(input);
    const entity = url.pathname.split('/').pop()!;
    if (entity === 'openapi') return new Response(JSON.stringify({ paths: { '/Patrimoine': {}, '/Lot': {}, '/Lot/ID_lot/{ID_lot}': {}, '/Organisation': {} } }), { status: 200 });
    const rows = DATA[entity];
    if (!rows) return new Response('not found', { status: 404 });
    const first = Number(url.searchParams.get('$first'));
    const after = Number(url.searchParams.get('$after') ?? 0);
    const page = rows.slice(after, after + first);
    const next = after + first < rows.length ? `${url.origin}${url.pathname}?$first=${first}&$after=${after + first}` : undefined;
    return new Response(JSON.stringify({ value: page, ...(next ? { nextLink: next } : {}) }), { status: 200 });
  });
  return calls;
}

describe('DabDataProvider (Data API Builder)', () => {
  it('suit la pagination nextLink, transmet le filtre et produit le modèle normalisé', async () => {
    const calls = mockDab();
    const ds = await new DabDataProvider(cfg).load();
    expect(ds.agences.map((a) => a.nom)).toEqual(['Agence Nord']);
    expect(ds.residences).toHaveLength(1);
    expect(ds.residences[0]).toMatchObject({ nom: 'Résidence A', nbLogements: 3, dateConstruction: '1998-01-01', agenceId: 'AG1' });
    expect(ds.logements.map((l) => l.id)).toEqual(['L1', 'L2', 'L3']);
    expect(ds.source.kind).toBe('api');
    expect(calls.filter((c) => c.includes('/Lot'))).toHaveLength(2); // 3 lignes, pages de 2
    expect(decodeURIComponent(calls.find((c) => c.includes('/Patrimoine'))!)).toContain('$filter=Indicateur_annulation eq 0'.replace(/ /g, '+'));
  });

  it('message clair si une entité est introuvable', async () => {
    mockDab();
    await expect(new DabDataProvider({ ...cfg, entities: { ...cfg.entities, lot: 'Lots' } }).load()).rejects.toThrow(/Lots/);
  });

  it('découvre les entités depuis l’OpenAPI', async () => {
    mockDab();
    expect(await discoverEntities(cfg.baseUrl)).toEqual(['Lot', 'Organisation', 'Patrimoine']);
  });

  it('toSheet : union des colonnes', () => {
    expect(toSheet([{ a: 1 }, { b: 2 }])).toEqual([['a', 'b'], [1, undefined], [undefined, 2]]);
  });
});
