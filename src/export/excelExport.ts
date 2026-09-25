/**
 * Export Excel du périmètre courant (filtres + catégories visibles).
 * Les colonnes sont celles du MODÈLE MÉTIER (libellés lisibles), pas celles de la source.
 */
import { activeFilterCount, PatrimoineIndex, type FilteredView } from '../domain/patrimoineIndex';
import { COLOR_BY_OPTIONS, QPV_LABELS } from '../domain/symbology';
import { useAppStore } from '../store/useAppStore';

type Cell = string | number | undefined;

async function writeWorkbook(filename: string, sheets: { name: string; rows: Record<string, Cell>[] }[]) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Atlas Patrimoine';
  wb.created = new Date();
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.slice(0, 31));
    const headers = s.rows.length ? Object.keys(s.rows[0]) : ['Information'];
    ws.columns = headers.map((h) => ({ header: h, key: h, width: Math.min(45, Math.max(12, h.length + 4)) }));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C5C' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    if (s.rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
    for (const r of s.rows) ws.addRow(r);
  }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

export async function exportExcel(view: FilteredView) {
  const s = useAppStore.getState();
  const ix = s.index!;
  const geo = (g: ReturnType<PatrimoineIndex['geoOf']>) => ({
    QPV: QPV_LABELS[PatrimoineIndex.qpvStatus(g)],
    'Nom QPV': g?.qpvNom ?? g?.qpvProcheNom,
    'Distance QPV (m)': g?.distanceQpvM !== undefined && Number.isFinite(g.distanceQpvM) ? g.distanceQpvM : undefined,
    'Zone APL': g?.zoneApl,
    'Zone Pinel': g?.zonePinel,
  });
  const residences = view.residences.map(({ item: r, n }) => ({
    'Code résidence': r.code,
    Résidence: r.nom,
    Agence: ix.agenceNom(r.agenceId),
    Commune: ix.communes.get(r.communeInsee ?? '')?.nom ?? r.communeNom,
    'Code INSEE': r.communeInsee,
    EPCI: ix.epciOf(r.communeInsee).nom,
    'Nb bâtiments': r.batimentIds.length,
    'Nb logements (périmètre)': n,
    'Nb logements (total)': r.nbLogements,
    ...geo(ix.geoOf(r)),
    'Conseiller commercial': r.responsables.conseillerCommercial,
    'Gérant immobilier': r.responsables.gerantImmobilier,
    'Conseiller social': r.responsables.conseillerSocial,
    'Travailleur social': r.responsables.travailleurSocial,
    Latitude: r.position?.lat,
    Longitude: r.position?.lon,
  }));
  const batiments = view.batiments.length
    ? view.batiments.map(({ item: b, n }) => ({
        'Code bâtiment': b.code,
        Adresse: b.adresse ?? b.libelle,
        Résidence: ix.residences.get(b.residenceId ?? '')?.nom,
        Agence: ix.agenceNom(b.agenceId),
        Commune: b.communeNom,
        'Code INSEE': b.communeInsee,
        'Nb logements (périmètre)': n,
        ...geo(ix.geoOf(b)),
        Latitude: b.position?.lat,
        Longitude: b.position?.lon,
      }))
    : [];
  const logements = view.logements.map(({ item: l }) => ({
    'Code logement': l.code,
    RPLS: l.rpls,
    Résidence: ix.residences.get(l.residenceId ?? '')?.nom,
    Adresse: l.adresse,
    Cage: ix.cages.get(l.cageId ?? '')?.libelle,
    Commune: l.communeNom,
    'Code INSEE': l.communeInsee,
    EPCI: ix.epciOf(l.communeInsee).nom,
    Agence: ix.agenceNom(l.agenceId),
    Type: l.typeLot,
    Étage: l.etage,
    'Surface (m²)': l.surfaceHabitable,
    Financement: l.financement,
    ...geo(ix.geoOf(l)),
    'Conseiller commercial': l.responsables.conseillerCommercial,
    'Gérant immobilier': l.responsables.gerantImmobilier,
    'Conseiller social': l.responsables.conseillerSocial,
    'Travailleur social': l.responsables.travailleurSocial,
  }));
  const info: Record<string, Cell>[] = [
    { Paramètre: 'Date d’export', Valeur: new Date().toLocaleString('fr-FR') },
    { Paramètre: 'Source des données', Valeur: s.dataset?.source.label },
    { Paramètre: 'Données synthétiques', Valeur: s.dataset?.source.synthetic ? 'OUI — ne correspondent à aucun patrimoine réel' : 'Non' },
    { Paramètre: 'Filtres actifs', Valeur: activeFilterCount(s.filters) ? JSON.stringify(s.filters) : 'Aucun' },
    { Paramètre: 'Coloration', Valeur: COLOR_BY_OPTIONS.find((o) => o.key === s.patrimoine.colorBy)?.label },
    { Paramètre: 'Résidences', Valeur: view.totals.residences },
    { Paramètre: 'Logements', Valeur: view.totals.logements },
  ];
  await writeWorkbook(`atlas-patrimoine-${stamp()}.xlsx`, [
    { name: 'Contexte', rows: info },
    { name: 'Résidences', rows: residences },
    ...(batiments.length ? [{ name: 'Bâtiments', rows: batiments }] : []),
    { name: 'Logements', rows: logements },
  ]);
}

/** Export d'un tableau d'analyse. */
export async function exportRows(title: string, rows: Record<string, Cell>[]) {
  await writeWorkbook(`analyse-${stamp()}.xlsx`, [{ name: title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31), rows }]);
}
