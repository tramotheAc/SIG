import { describe, expect, it } from 'vitest';
import type { PatrimoineDataset } from '../src/domain/model';
import { EMPTY_FILTERS, PatrimoineIndex } from '../src/domain/patrimoineIndex';
import { ColorRegistry, MISSING, percentile, radiusFor } from '../src/domain/symbology';
import { SearchIndex } from '../src/domain/search';
import { computeGeoContexts } from '../src/geo/enrichment';
import { distanceToPolygon, preparePolygons } from '../src/geo/spatial';
import { parseZonageCsv, normalizeAbc, normalizeApl } from '../src/data/referentiels/localFiles';

const pos = (lon: number, lat: number) => ({ lon, lat });

function dataset(): PatrimoineDataset {
  const resp = (g?: string) => ({ gerantImmobilier: g });
  return {
    agences: [{ id: 'A', code: 'A', nom: 'Agence A' }, { id: 'B', code: 'B', nom: 'Agence B' }],
    residences: [
      { id: 'r1', code: 'E1', nom: 'Les Ajoncs', agenceId: 'A', position: pos(-1.68, 48.11), positionSource: 'source', communeInsee: '35238', communeNom: 'Rennes', batimentIds: ['b1'], nbLogements: 2, responsables: resp('Gi 1') },
      { id: 'r2', code: 'E2', nom: 'Le Parc', agenceId: 'B', position: pos(-1.55, 47.21), positionSource: 'source', communeInsee: '44109', communeNom: 'Nantes', batimentIds: ['b2'], nbLogements: 1, responsables: resp() },
      { id: 'r3', code: 'E3', nom: 'Sans logement', agenceId: 'B', position: pos(-1.56, 47.22), positionSource: 'source', communeInsee: '44109', communeNom: 'Nantes', batimentIds: [], nbLogements: 0, responsables: resp() },
    ],
    batiments: [
      { id: 'b1', code: 'E1/01', residenceId: 'r1', libelle: '1 rue A', adresse: '1 rue A', agenceId: 'A', position: pos(-1.68, 48.11), positionSource: 'source', communeInsee: '35238', cageIds: [], logementIds: ['l1', 'l2'], nbLogements: 2, responsables: resp('Gi 1') },
      { id: 'b2', code: 'E2/01', residenceId: 'r2', libelle: '2 rue B', adresse: '2 rue B', agenceId: 'B', position: pos(-1.55, 47.21), positionSource: 'source', communeInsee: '44109', cageIds: [], logementIds: ['l3'], nbLogements: 1, responsables: resp() },
    ],
    cages: [],
    logements: [
      { id: 'l1', code: 'L1', batimentId: 'b1', residenceId: 'r1', agenceId: 'A', communeInsee: '35238', positionSource: 'derivee', position: pos(-1.68, 48.11), responsables: resp('Gi 1') },
      { id: 'l2', code: 'L2', rpls: 'RPLS99', batimentId: 'b1', residenceId: 'r1', agenceId: 'A', communeInsee: '35238', positionSource: 'derivee', position: pos(-1.68, 48.11), responsables: resp('Gi 1') },
      { id: 'l3', code: 'L3', batimentId: 'b2', residenceId: 'r2', agenceId: 'B', communeInsee: '44109', positionSource: 'derivee', position: pos(-1.55, 47.21), responsables: resp() },
    ],
    issues: [],
    source: { kind: 'memory', label: 'test', loadedAt: '', synthetic: true },
  };
}

const communes = new Map([
  ['35238', { insee: '35238', nom: 'Rennes', epciCode: '243500139', epciNom: 'Rennes Métropole' }],
  ['44109', { insee: '44109', nom: 'Nantes', epciCode: '244400404', epciNom: 'Nantes Métropole' }],
]);

describe('PatrimoineIndex.compute', () => {
  const ix = new PatrimoineIndex(dataset(), communes);

  it('sans filtre : tout le patrimoine, compteurs cohérents', () => {
    const v = ix.compute(EMPTY_FILTERS, 'agence', new Set());
    expect(v.totals).toEqual({ logements: 3, residences: 3, batiments: 2 });
    expect(v.byCommune.get('35238')!.logements).toBe(2);
    expect(v.byEpci.get('244400404')!.residences.size).toBe(2);
  });

  it('filtres combinés (ET) agence + commune + EPCI', () => {
    const v = ix.compute({ ...EMPTY_FILTERS, agences: ['B'], communes: ['44109'] }, 'agence', new Set());
    expect(v.residences.map((r) => r.item.id).sort()).toEqual(['r2', 'r3']);
    expect(ix.compute({ ...EMPTY_FILTERS, agences: ['A'], communes: ['44109'] }, 'agence', new Set()).totals.logements).toBe(0);
    expect(ix.compute({ ...EMPTY_FILTERS, epcis: ['243500139'] }, 'agence', new Set()).totals.logements).toBe(2);
  });

  it('masquage de catégorie et catégorie « Non renseigné »', () => {
    const v = ix.compute(EMPTY_FILTERS, 'gerantImmobilier', new Set([MISSING]));
    expect(v.totals.logements).toBe(2);
    const stat = v.categories.find((c) => c.value === MISSING)!;
    expect(stat.logements).toBe(1); // compté même masqué (légende)
    expect(ix.categoryLabel('gerantImmobilier', MISSING)).toBe('Non renseigné');
  });

  it('filtres région, département, quartier, adresse (HP2)', () => {
    const d = dataset();
    d.residences[0].quartier = 'Q1';
    const ix2 = new PatrimoineIndex(d, communes);
    expect(ix2.compute({ ...EMPTY_FILTERS, regions: ['53'] }, 'agence', new Set()).totals.logements).toBe(2); // Bretagne
    expect(ix2.compute({ ...EMPTY_FILTERS, regions: ['52'] }, 'agence', new Set()).totals.logements).toBe(1); // Pays de la Loire
    expect(ix2.compute({ ...EMPTY_FILTERS, departements: ['44'] }, 'agence', new Set()).totals.residences).toBe(2);
    expect(ix2.compute({ ...EMPTY_FILTERS, quartiers: ['Q1'] }, 'agence', new Set()).totals.logements).toBe(2);
    expect(ix2.compute({ ...EMPTY_FILTERS, batiments: ['b2'] }, 'agence', new Set()).totals).toMatchObject({ logements: 1, batiments: 1 });
  });

  it('nouveaux critères de légende : territoire et caractéristiques (valeur majoritaire)', () => {
    const d = dataset();
    d.logements[0].typeLot = 'T3';
    d.logements[1].typeLot = 'T3';
    d.logements[2].typeLot = 'T2';
    d.residences[0].dateConstruction = '1974-01-01';
    const ix2 = new PatrimoineIndex(d, communes);
    expect(ix2.categoryOf('typeLot', d.residences[0])).toBe('T3');
    expect(ix2.categoryOf('typeLot', d.logements[2])).toBe('T2');
    expect(ix2.categoryOf('departement', d.residences[1])).toBe('44');
    expect(ix2.categoryOf('periode', d.logements[0])).toBe('1970s');
    expect(ix2.categoryLabel('periode', '1970s')).toBe('1970–1979');
    expect(ix2.categoryLabel('epci', '244400404')).toBe('Nantes Métropole');
    const v = ix2.compute(EMPTY_FILTERS, 'typeLot', new Set(['T2']));
    expect(v.totals.logements).toBe(2);
  });

  it('filtre de rôle métier', () => {
    const v = ix.compute({ ...EMPTY_FILTERS, roles: { gerantImmobilier: ['Gi 1'] } }, 'agence', new Set());
    expect(v.totals).toMatchObject({ logements: 2, residences: 1 });
  });

  it('filtre QPV via contexte géographique', () => {
    const qpv = preparePolygons(
      { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { code: 'QN035', nom: 'Quartier test' }, geometry: { type: 'Polygon', coordinates: [[[-1.681, 48.109], [-1.679, 48.109], [-1.679, 48.111], [-1.681, 48.111], [-1.681, 48.109]]] } }] },
      ['code'], ['nom'],
    );
    const geo = computeGeoContexts([...dataset().residences, ...dataset().batiments], { communes, qpv, apl: new Map([['35238', '2']]) });
    const ix2 = new PatrimoineIndex(dataset(), communes, geo);
    expect(geo.get('r1')).toMatchObject({ qpvCode: 'QN035', distanceQpvM: 0, zoneApl: '2', epciNom: 'Rennes Métropole' });
    expect(ix2.compute({ ...EMPTY_FILTERS, qpv: ['en_qpv'] }, 'qpv', new Set()).totals.logements).toBe(2);
    expect(ix2.compute({ ...EMPTY_FILTERS, zonesApl: [MISSING] }, 'agence', new Set()).totals.logements).toBe(1);
  });
});

describe('Symbologie', () => {
  it('couleurs stables et indépendantes de l’ordre de rencontre', () => {
    const reg = new ColorRegistry();
    reg.register('agence', ['B', 'A', 'C']);
    const a = reg.colorOf('agence', 'A');
    reg.register('agence', ['A', 'Z']);
    expect(reg.colorOf('agence', 'A')).toBe(a);
    expect(reg.colorOf('agence', 'Z')).not.toBe(a);
    expect(reg.colorOf('agence', MISSING)).toBe('#adb5bd');
    expect(new Set(['A', 'B', 'C', 'Z'].map((v) => reg.colorOf('agence', v))).size).toBe(4);
  });
  it('couleurs imposées par configuration', () => {
    const reg = new ColorRegistry();
    reg.register('agence', ['A', 'B'], { B: '#000000' });
    expect(reg.colorOf('agence', 'B')).toBe('#000000');
  });
  it('taille bornée (racine carrée, plafond)', () => {
    expect(radiusFor(0, 100, 3, 16)).toBe(3);
    expect(radiusFor(100, 100, 3, 16)).toBe(16);
    expect(radiusFor(5000, 100, 3, 16)).toBe(16);
    expect(radiusFor(25, 100, 3, 16)).toBe(9.5);
    expect(percentile([1, 2, 3, 4, 100], 0.5)).toBe(3);
  });
});

describe('Recherche', () => {
  const s = new SearchIndex(new PatrimoineIndex(dataset(), new Map(communes)));
  it('trouve résidence, commune, agence, logement (RPLS), insensible aux accents', () => {
    expect(s.search('ajoncs').find((r) => r.kind === 'residence')?.id).toBe('r1');
    expect(s.search('RENNES').some((r) => r.kind === 'commune' && r.id === '35238')).toBe(true);
    expect(s.search('agence b').some((r) => r.kind === 'agence' && r.id === 'B')).toBe(true);
    expect(s.search('rpls99')[0]).toMatchObject({ kind: 'logement', id: 'l2' });
    expect(s.search('nantes metropole').some((r) => r.kind === 'epci')).toBe(true);
    expect(s.search('x')).toEqual([]);
  });
});

describe('Géométrie et référentiels', () => {
  it('distance point-polygone', () => {
    const [poly] = preparePolygons({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 45], [0.01, 45], [0.01, 45.01], [0, 45.01], [0, 45]]] } }] }, [], []);
    expect(distanceToPolygon({ lon: 0.005, lat: 45.005 }, poly)).toBe(0);
    const d = distanceToPolygon({ lon: 0.005, lat: 45.0127 }, poly); // ~300 m au nord
    expect(d).toBeGreaterThan(280);
    expect(d).toBeLessThan(320);
  });
  it('lecture des tables de zonage CSV', () => {
    const apl = parseZonageCsv('code_insee;zone\n35238;Zone 2\n1053;1\nbad;3\n', normalizeApl);
    expect([...apl]).toEqual([['35238', '2'], ['01053', '1']]);
    const abc = parseZonageCsv('insee,zone\n44109,B1\n75056,A bis\n29019,Z\n', normalizeAbc);
    expect([...abc]).toEqual([['44109', 'B1'], ['75056', 'Abis']]);
  });
});

describe('Référentiels fichiers tolérants', () => {
  it('CSV Excel avec colonnes supplémentaires et en-tête', () => {
    const csv = 'Code INSEE;Nom commune;Département;Zonage ABC 2024\r\n35238;Rennes;35;B1\r\n29019;Brest;29;B2\r\n';
    expect([...parseZonageCsv(csv, normalizeAbc)]).toEqual([['35238', 'B1'], ['29019', 'B2']]);
  });
  it('reprojette un GeoJSON en Lambert-93', async () => {
    const { normalizeGeoJson } = await import('../src/data/referentiels/localFiles');
    const fc = normalizeGeoJson({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[352000, 6789000], [353000, 6789000], [353000, 6790000], [352000, 6789000]]] } }] });
    const [lon, lat] = (fc.features[0].geometry as { coordinates: number[][][] }).coordinates[0][0];
    expect(lon).toBeCloseTo(-1.68, 1);
    expect(lat).toBeCloseTo(48.11, 1);
  });
});

import { checkDataQuality, qualityScore } from '../src/domain/dataQuality';

describe('checkDataQuality', () => {
  it('détecte positions absentes, INSEE invalides, orphelins et doublons', () => {
    const base = { batimentIds: [], responsables: {}, positionSource: 'source' as const };
    const ds = {
      agences: [],
      residences: [
        { ...base, id: 'r1', code: 'R1', nom: 'A', nbLogements: 1, agenceId: 'a', communeInsee: '35238', position: { lon: -1.68, lat: 48.11 } },
        { ...base, id: 'r2', code: 'R1', nom: 'B', nbLogements: 0, communeInsee: '3523', positionSource: 'absente' as const },
      ],
      batiments: [{ id: 'b1', code: 'B1', libelle: 'x', residenceId: 'zz', cageIds: [], logementIds: [], nbLogements: 0, responsables: {}, positionSource: 'absente' as const }],
      cages: [],
      logements: [{ id: 'l1', code: 'L1', responsables: {}, positionSource: 'absente' as const, residenceId: 'r1', typeLot: 'T2', financement: 'PLUS' }],
      issues: [],
      source: { kind: 'memory' as const, label: 't', loadedAt: '', synthetic: true },
    };
    const c = Object.fromEntries(checkDataQuality(ds).map((x) => [x.id, x.count]));
    expect(c['res-sans-position']).toBe(1);
    expect(c['insee-invalide']).toBe(1);
    expect(c['res-doublon']).toBe(1);
    expect(c['bat-orphelin']).toBe(1);
    expect(c['lgt-orphelin']).toBe(0);
    expect(c['res-sans-agence']).toBe(1);
    expect(qualityScore(checkDataQuality(ds))).toBeLessThan(100);
  });
});
