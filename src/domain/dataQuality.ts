/**
 * Contrôle qualité des données patrimoine : règles simples, explicables, sans valeur nominative.
 * Chaque règle renvoie le nombre d'objets concernés et quelques exemples (codes).
 */
import type { PatrimoineDataset } from './model';

export type QualityLevel = 'erreur' | 'alerte' | 'info';

export interface QualityCheck {
  id: string;
  level: QualityLevel;
  label: string;
  help: string;
  /** Objet concerné (résidence, bâtiment, logement…). */
  objet: string;
  total: number;
  count: number;
  /** Lignes détaillées (export Excel). */
  rows: { code: string; libelle?: string; commune?: string; detail?: string }[];
}

/** Emprise attendue (Bretagne + Loire-Atlantique, avec marge). */
const BBOX = { w: -5.3, e: -0.8, s: 46.8, n: 49.0 };

export function checkDataQuality(ds: PatrimoineDataset, knownCommunes?: ReadonlySet<string>): QualityCheck[] {
  const out: QualityCheck[] = [];
  const add = (c: Omit<QualityCheck, 'count'>) => out.push({ ...c, count: c.rows.length });
  const resIds = new Set(ds.residences.map((r) => r.id));
  const batIds = new Set(ds.batiments.map((b) => b.id));

  add({
    id: 'res-sans-position', level: 'erreur', objet: 'Résidences', total: ds.residences.length,
    label: 'Résidences sans position',
    help: 'Non affichées sur la carte ni prises en compte dans les analyses QPV / zonages.',
    rows: ds.residences.filter((r) => !r.position).map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom })),
  });
  add({
    id: 'res-position-derivee', level: 'info', objet: 'Résidences', total: ds.residences.length,
    label: 'Résidences positionnées d’après leurs adresses',
    help: 'Pas de coordonnées propres : position calculée au centre de leurs bâtiments.',
    rows: ds.residences.filter((r) => r.positionSource === 'derivee').map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom })),
  });
  add({
    id: 'bat-sans-position', level: 'alerte', objet: 'Bâtiments / adresses', total: ds.batiments.length,
    label: 'Adresses sans position',
    help: 'Invisibles aux niveaux de zoom fins.',
    rows: ds.batiments.filter((b) => !b.position).map((b) => ({ code: b.code, libelle: b.adresse ?? b.libelle, commune: b.communeNom })),
  });
  add({
    id: 'hors-territoire', level: 'alerte', objet: 'Résidences', total: ds.residences.length,
    label: 'Positions hors du territoire',
    help: 'Coordonnées en dehors de la Bretagne / Loire-Atlantique : inversion latitude / longitude ou erreur de saisie probable.',
    rows: ds.residences
      .filter((r) => r.position && (r.position.lon < BBOX.w || r.position.lon > BBOX.e || r.position.lat < BBOX.s || r.position.lat > BBOX.n))
      .map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom, detail: `${r.position!.lat.toFixed(5)}, ${r.position!.lon.toFixed(5)}` })),
  });
  add({
    id: 'insee-invalide', level: 'erreur', objet: 'Résidences', total: ds.residences.length,
    label: 'Code INSEE absent ou invalide',
    help: 'Empêche le rattachement à la commune, à l’EPCI, aux zonages APL / Pinel.',
    rows: ds.residences
      .filter((r) => !r.communeInsee || !/^(\d{5}|2[AB]\d{3})$/.test(r.communeInsee) || (knownCommunes?.size ? !knownCommunes.has(r.communeInsee) : false))
      .map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom, detail: r.communeInsee ?? '(vide)' })),
  });
  add({
    id: 'res-sans-logement', level: 'alerte', objet: 'Résidences', total: ds.residences.length,
    label: 'Résidences sans logement',
    help: 'Ensemble déclaré sans lot rattaché (lots manquants ou mauvais code de rattachement).',
    rows: ds.residences.filter((r) => !r.nbLogements).map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom })),
  });
  add({
    id: 'res-sans-agence', level: 'alerte', objet: 'Résidences', total: ds.residences.length,
    label: 'Résidences sans agence',
    help: 'Apparaissent en « Non renseigné » dans la légende par agence.',
    rows: ds.residences.filter((r) => !r.agenceId).map((r) => ({ code: r.code, libelle: r.nom, commune: r.communeNom })),
  });
  add({
    id: 'bat-orphelin', level: 'erreur', objet: 'Bâtiments / adresses', total: ds.batiments.length,
    label: 'Adresses rattachées à une résidence inconnue',
    help: 'Code de patrimoine niveau 1 absent de la table Patrimoine.',
    rows: ds.batiments.filter((b) => !b.residenceId || !resIds.has(b.residenceId)).map((b) => ({ code: b.code, libelle: b.adresse ?? b.libelle, commune: b.communeNom, detail: b.residenceId ?? '(vide)' })),
  });
  add({
    id: 'lgt-orphelin', level: 'erreur', objet: 'Logements', total: ds.logements.length,
    label: 'Logements sans adresse ni résidence connue',
    help: 'Lots non rattachés au patrimoine : absents de la carte.',
    rows: ds.logements
      .filter((l) => !(l.batimentId && batIds.has(l.batimentId)) && !(l.residenceId && resIds.has(l.residenceId)))
      .map((l) => ({ code: l.code, commune: l.communeNom, detail: l.batimentId ?? l.residenceId ?? '(vide)' })),
  });
  for (const [key, label] of [['typeLot', 'typologie'], ['financement', 'financement']] as const) {
    add({
      id: `lgt-sans-${key}`, level: 'info', objet: 'Logements', total: ds.logements.length,
      label: `Logements sans ${label}`,
      help: `Apparaissent en « Non renseigné » lorsque la légende porte sur le ${label}.`,
      rows: ds.logements.filter((l) => !l[key]).map((l) => ({ code: l.code, commune: l.communeNom })),
    });
  }
  const dup = <T extends { code: string }>(items: T[]) => {
    const seen = new Map<string, number>();
    for (const i of items) seen.set(i.code, (seen.get(i.code) ?? 0) + 1);
    return [...seen].filter(([, n]) => n > 1).map(([code, n]) => ({ code, detail: `${n} occurrences` }));
  };
  add({ id: 'res-doublon', level: 'erreur', objet: 'Résidences', total: ds.residences.length, label: 'Codes résidence en double', help: 'Deux ensembles partagent le même code : l’un masque l’autre.', rows: dup(ds.residences) });
  add({ id: 'lgt-doublon', level: 'erreur', objet: 'Logements', total: ds.logements.length, label: 'Codes logement en double', help: 'Un même lot compté plusieurs fois.', rows: dup(ds.logements) });
  return out;
}

/** Score global simple (0–100) : part des objets sans erreur ni alerte. */
export function qualityScore(checks: QualityCheck[]): number {
  const w = { erreur: 1, alerte: 0.4, info: 0 };
  let pen = 0, tot = 0;
  for (const c of checks) {
    if (!c.total || !w[c.level]) continue;
    pen += w[c.level] * (c.count / c.total);
    tot += w[c.level];
  }
  return tot ? Math.max(0, Math.round(100 * (1 - pen / tot))) : 100;
}
