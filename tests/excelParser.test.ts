import { describe, expect, it } from 'vitest';
import { parseWorkbook, normInsee, dateStr, type RawWorkbook } from '../src/data/excel/excelParser';
import { toWgs84, parseNumber } from '../src/data/excel/coordinates';

const ORG = [
  ['ID_organisation', 'Niveau_organisation', 'Code_niveau_organisation_1', 'Libelle_organisation', 'Indicateur_validite'],
  [1, 1, 'AG1', 'Agence Nord', 1],
  [2, 1, 'AG2', 'Agence Sud', 1],
];
const PAT_H = ['ID_patrimoine', 'ID_organisation', 'Niveau_patrimoine', 'Code_niveau_patrimoine_1', 'Code_niveau_patrimoine_2', 'Code_niveau_patrimoine_3', 'Libelle_patrimoine', 'Adresse', 'Libelle_commune', 'Code_INSEE_commune', 'Latitude', 'Longitude', 'Indicateur_annulation'];
const LOT_H = ['ID_client_lot', 'ID_lot', 'ID_patrimoine', 'Code_lot', 'Code_niveau_patrimoine_1', 'Code_niveau_patrimoine_2', 'Code_niveau_patrimoine_3', 'Libelle_type_lot', 'Surface_habitable'];

function workbook(): RawWorkbook {
  return {
    'DWH.Organisation': ORG,
    'DWH.Patrimoine': [
      PAT_H,
      [100, 1, 1, 'E1', null, null, 'Résidence A', 'rue A', 'Rennes', 35238, 48.11, -1.68, 0],
      [101, 1, 2, 'E1', '01', null, '1 rue A', '1 rue A', 'Rennes', 35238, 48.111, -1.681, 0],
      [102, 1, 3, 'E1', '01', 'A', 'Cage A', '1 rue A', 'Rennes', 35238, null, null, 0],
      [103, 1, 2, 'E1', '02', null, '3 rue A', '3 rue A', 'Rennes', 35238, '48,112', '-1,682', 0],
      [200, 2, 1, 'E2', null, null, 'Résidence B (sans coordonnées)', null, 'Brest', '29019', null, null, 0],
      [201, 2, 2, 'E2', '01', null, '2 rue B', '2 rue B', 'Brest', '29019', 6_838_000, 145_000, 0], // Lambert-93
      [300, 2, 1, 'E3', null, null, 'Résidence annulée', null, 'Brest', '29019', 48.39, -4.48, 1],
      [null, 2, 1, null, null, null, 'Ligne invalide', null, null, null, null, null, 0],
    ],
    'DWH.Lot': [
      LOT_H,
      [1, 'L1', 102, 'E1-01A-1', 'E1', '01', 'A', 'T3', 65],
      [2, 'L2', 102, 'E1-01A-2', 'E1', '01', 'A', 'T2', '47,5'],
      [3, 'L3', null, 'E1-02-1', 'E1', '02', null, 'T4', 80], // rattaché par codes
      [4, 'L4', 201, 'E2-01-1', 'E2', '01', null, 'T3', 60],
      [5, 'L5', 999, 'X', 'EX', null, null, 'T1', 30], // orphelin
    ],
    'DWH.Client': [
      ['ID_client_lot', 'Indicateur_statut_presence', 'Nom_prenom_CSR_referent', 'Nom_prenom_client'],
      [1, 1, 'CSR Alpha', 'Nom Confidentiel'],
      [2, 1, 'CSR Alpha', 'Nom Confidentiel'],
      [3, 0, 'CSR Beta', 'Nom Confidentiel'],
    ],
    Affectations: [
      ['Code_patrimoine', 'Conseiller_commercial', 'Gerant_immobilier', 'Travailleur_social'],
      ['E1', 'CC One', 'GI One', 'TS One'],
    ],
  };
}

describe('parseWorkbook — mapping DWH → modèle', () => {
  const ds = parseWorkbook(workbook());

  it('construit la hiérarchie agence / résidence / bâtiment / cage / logement', () => {
    expect(ds.agences.map((a) => a.nom)).toEqual(['Agence Nord', 'Agence Sud']);
    expect(ds.residences).toHaveLength(2); // annulée et invalide exclues
    const a = ds.residences.find((r) => r.code === 'E1')!;
    expect(a.agenceId).toBe('AG1');
    expect(a.batimentIds).toHaveLength(2);
    expect(a.nbLogements).toBe(3);
    expect(ds.cages).toHaveLength(1);
    expect(ds.cages[0].logementIds).toEqual(['L1', 'L2']);
  });

  it('rattache les logements par ID_patrimoine puis par codes', () => {
    const l3 = ds.logements.find((l) => l.id === 'L3')!;
    expect(l3.batimentId).toBe('103');
    expect(l3.residenceId).toBe('100');
    const l5 = ds.logements.find((l) => l.id === 'L5')!;
    expect(l5.residenceId).toBeUndefined();
    expect(ds.issues.some((i) => i.message.includes('non rattaché'))).toBe(true);
  });

  it('hérite et dérive les positions, convertit Lambert-93 et virgules décimales', () => {
    const cage = ds.cages[0];
    expect(cage.positionSource).toBe('derivee');
    expect(cage.position).toEqual({ lon: -1.681, lat: 48.111 });
    const bat3 = ds.batiments.find((b) => b.id === '103')!;
    expect(bat3.position).toEqual({ lon: -1.682, lat: 48.112 });
    const resB = ds.residences.find((r) => r.code === 'E2')!;
    expect(resB.positionSource).toBe('derivee');
    expect(resB.position!.lon).toBeGreaterThan(-5.5);
    expect(resB.position!.lon).toBeLessThan(-4);
    expect(resB.position!.lat).toBeGreaterThan(48);
  });

  it('normalise le code INSEE numérique', () => {
    expect(ds.residences.find((r) => r.code === 'E1')!.communeInsee).toBe('35238');
  });

  it('propage les rôles métier et n’importe aucune donnée nominative locataire', () => {
    const l1 = ds.logements.find((l) => l.id === 'L1')!;
    expect(l1.responsables).toEqual({ conseillerSocial: 'CSR Alpha', conseillerCommercial: 'CC One', gerantImmobilier: 'GI One', travailleurSocial: 'TS One' });
    expect(JSON.stringify(ds)).not.toContain('Nom Confidentiel');
    expect(ds.residences.find((r) => r.code === 'E1')!.responsables.conseillerSocial).toBe('CSR Alpha');
    expect(ds.logements.find((l) => l.id === 'L2')!.surfaceHabitable).toBe(47.5);
  });

  it('signale clairement une feuille ou des colonnes obligatoires manquantes, sans exception', () => {
    const r1 = parseWorkbook({ Feuil1: [['a']] });
    expect(r1.residences).toHaveLength(0);
    expect(r1.issues.find((i) => i.level === 'error')?.message).toMatch(/Patrimoine/);
    const r2 = parseWorkbook({ 'DWH.Patrimoine': [['ID_patrimoine', 'Libelle_patrimoine'], [1, 'x']] });
    expect(r2.issues.some((i) => i.level === 'error' && i.message.includes('Niveau_patrimoine'))).toBe(true);
  });

  it('crée les agences depuis la feuille Patrimoine si Organisation est absente', () => {
    const wb = workbook();
    delete wb['DWH.Organisation'];
    wb['DWH.Patrimoine'][0] = [...PAT_H, 'Code_niveau_organisation_1'];
    wb['DWH.Patrimoine'][1] = [...(wb['DWH.Patrimoine'][1] as unknown[]), 'AGX'];
    const ds2 = parseWorkbook(wb);
    expect(ds2.agences.map((a) => a.id)).toContain('AGX');
  });
});

describe('utilitaires de normalisation', () => {
  it('toWgs84', () => {
    expect(toWgs84(48.1, -1.6).point).toEqual({ lon: -1.6, lat: 48.1 });
    expect(toWgs84(-1.6, 48.1).point).toEqual({ lon: -1.6, lat: 48.1 }); // inversion
    expect(toWgs84(0, 0).issue).toBeDefined();
    expect(toWgs84(40.7, -74).issue).toBeDefined(); // hors France
    expect(toWgs84(null, undefined).point).toBeUndefined();
    const l93 = toWgs84(6_789_000, 352_000).point!; // ~ Rennes
    expect(l93.lat).toBeCloseTo(48.11, 1);
    expect(l93.lon).toBeCloseTo(-1.68, 1);
  });
  it('parseNumber / normInsee / dateStr', () => {
    expect(parseNumber('1 234,5')).toBe(1234.5);
    expect(parseNumber('abc')).toBeUndefined();
    expect(normInsee(1053)).toBe('01053');
    expect(normInsee('2A004')).toBe('2A004');
    expect(normInsee('xx')).toBeUndefined();
    expect(dateStr(45000)).toBe('2023-03-15');
    expect(dateStr('01/02/2020')).toBe('2020-02-01');
  });
});
