/**
 * Service métier central : index en mémoire du patrimoine normalisé + filtrage + agrégations.
 * Indépendant de la source (Excel/API), de la carte et de l'UI → testable unitairement.
 */
import type {
  Agence,
  Batiment,
  Cage,
  Commune,
  GeoContext,
  GeoPoint,
  Logement,
  PatrimoineDataset,
  QpvStatus,
  Residence,
  RoleKey,
} from './model';
import { MISSING, QPV_LABELS, type ColorBy } from './symbology';
import { appConfig } from '../config/app.config';
import { regionOfDep } from './regions';

export interface Filters {
  agences: string[];
  communes: string[];
  epcis: string[];
  residences: string[];
  qpv: QpvStatus[];
  zonesApl: string[];
  zonesPinel: string[];
  roles: Partial<Record<RoleKey, string[]>>;
  /** Codes département (2 premiers caractères du code INSEE). */
  departements?: string[];
  /** Codes région INSEE. */
  regions?: string[];
  /** Codes quartier (Code_quartier). */
  quartiers?: string[];
  /** Adresses (Patrimoine niveau 2) et cages d'escalier (niveau 3). */
  batiments?: string[];
  cages?: string[];
}

export const EMPTY_FILTERS: Filters = {
  agences: [],
  communes: [],
  epcis: [],
  residences: [],
  qpv: [],
  zonesApl: [],
  zonesPinel: [],
  roles: {},
  departements: [],
  regions: [],
  quartiers: [],
  batiments: [],
  cages: [],
};

export function activeFilterCount(f: Filters): number {
  return (
    (f.departements?.length ?? 0) +
    (f.regions?.length ?? 0) +
    (f.quartiers?.length ?? 0) +
    (f.batiments?.length ?? 0) +
    (f.cages?.length ?? 0) +
    f.agences.length +
    f.communes.length +
    f.epcis.length +
    f.residences.length +
    f.qpv.length +
    f.zonesApl.length +
    f.zonesPinel.length +
    Object.values(f.roles).reduce((s, v) => s + (v?.length ?? 0), 0)
  );
}

export interface CategoryStat {
  value: string;
  logements: number;
  residences: number;
}

export interface AreaAggregate {
  code: string;
  nom: string;
  logements: number;
  residences: Set<string>;
  byAgence: Map<string, number>;
  /** Répartition selon le critère de coloration courant. */
  byCat: Map<string, number>;
  position?: GeoPoint;
}

export interface FilteredView {
  residences: { item: Residence; n: number; cat: string }[];
  batiments: { item: Batiment; n: number; cat: string }[];
  logements: { item: Logement; cat: string }[];
  categories: CategoryStat[];
  byCommune: Map<string, AreaAggregate>;
  byEpci: Map<string, AreaAggregate>;
  totals: { logements: number; residences: number; batiments: number };
}

export class PatrimoineIndex {
  readonly residences = new Map<string, Residence>();
  readonly batiments = new Map<string, Batiment>();
  readonly cages = new Map<string, Cage>();
  readonly logements = new Map<string, Logement>();
  readonly agences = new Map<string, Agence>();

  constructor(
    readonly dataset: PatrimoineDataset,
    readonly communes: Map<string, Commune> = new Map(),
    /** Contexte géographique par id de résidence OU de bâtiment. */
    readonly geo: Map<string, GeoContext> = new Map(),
  ) {
    for (const a of dataset.agences) this.agences.set(a.id, a);
    for (const r of dataset.residences) this.residences.set(r.id, r);
    for (const b of dataset.batiments) this.batiments.set(b.id, b);
    for (const c of dataset.cages) this.cages.set(c.id, c);
    for (const l of dataset.logements) this.logements.set(l.id, l);
  }

  /* ---------------------------- Accès contextuel ---------------------------- */

  geoOf(obj: Residence | Batiment | Logement): GeoContext | undefined {
    if ('batimentIds' in obj) return this.geo.get(obj.id);
    if ('cageIds' in obj) return this.geo.get(obj.id) ?? (obj.residenceId ? this.geo.get(obj.residenceId) : undefined);
    return (obj.batimentId && this.geo.get(obj.batimentId)) || (obj.residenceId ? this.geo.get(obj.residenceId) : undefined);
  }

  epciOf(insee?: string): { code?: string; nom?: string } {
    const c = insee ? this.communes.get(insee) : undefined;
    return { code: c?.epciCode, nom: c?.epciNom };
  }

  agenceNom(id?: string) {
    return id ? (this.agences.get(id)?.nom ?? id) : undefined;
  }

  static qpvStatus(ctx?: GeoContext): QpvStatus {
    if (!ctx || ctx.distanceQpvM === undefined) return ctx?.qpvCode ? 'en_qpv' : 'inconnu';
    if (ctx.qpvCode || ctx.distanceQpvM === 0) return 'en_qpv';
    if (ctx.distanceQpvM <= appConfig.qpvBufferMeters) return 'moins_300m';
    return 'hors_qpv';
  }

  /** Valeur de catégorie (clé stable) d'un objet pour un critère de coloration. */
  categoryOf(by: ColorBy, obj: Residence | Batiment | Logement): string {
    switch (by) {
      case 'agence':
        return obj.agenceId ?? MISSING;
      case 'qpv': {
        const s = PatrimoineIndex.qpvStatus(this.geoOf(obj));
        return s === 'inconnu' ? MISSING : s;
      }
      case 'zoneApl':
        return this.geoOf(obj)?.zoneApl ?? MISSING;
      case 'zonePinel':
        return this.geoOf(obj)?.zonePinel ?? MISSING;
      default:
        return obj.responsables[by] ?? MISSING;
    }
  }

  /** Libellé lisible d'une catégorie. */
  categoryLabel(by: ColorBy, value: string): string {
    if (value === MISSING) return 'Non renseigné';
    if (by === 'agence') return this.agenceNom(value) ?? value;
    if (by === 'qpv') return QPV_LABELS[value as QpvStatus] ?? value;
    if (by === 'zoneApl') return `Zone ${value}`;
    if (by === 'zonePinel') return `Zone ${value === 'Abis' ? 'A bis' : value}`;
    return value;
  }

  /** Toutes les valeurs possibles d'un critère (pour figer les couleurs). */
  allCategories(by: ColorBy): string[] {
    const set = new Set<string>();
    if (by === 'agence') for (const a of this.agences.keys()) set.add(a);
    for (const r of this.residences.values()) set.add(this.categoryOf(by, r));
    if (by === 'conseillerSocial') for (const l of this.logements.values()) set.add(this.categoryOf(by, l));
    return [...set];
  }

  /* ---------------------------- Filtrage ---------------------------- */

  private matches(obj: Residence | Batiment | Logement, f: Filters): boolean {
    if (f.agences.length && !f.agences.includes(obj.agenceId ?? MISSING)) return false;
    if (f.communes.length && !f.communes.includes(obj.communeInsee ?? MISSING)) return false;
    if (f.departements?.length && !f.departements.includes((obj.communeInsee ?? '').slice(0, 2))) return false;
    if (f.regions?.length && !f.regions.includes(regionOfDep((obj.communeInsee ?? '').slice(0, 2)) ?? MISSING)) return false;
    if (f.quartiers?.length) {
      const res = 'batimentIds' in obj ? obj : obj.residenceId ? this.residences.get(obj.residenceId) : undefined;
      if (!f.quartiers.includes(res?.quartier ?? MISSING)) return false;
    }
    if (f.batiments?.length) {
      const ok = 'batimentIds' in obj ? obj.batimentIds.some((b) => f.batiments!.includes(b)) : 'cageIds' in obj ? f.batiments.includes(obj.id) : f.batiments.includes(obj.batimentId ?? MISSING);
      if (!ok) return false;
    }
    if (f.cages?.length) {
      const ok =
        'batimentIds' in obj
          ? obj.batimentIds.some((b) => this.batiments.get(b)?.cageIds.some((c) => f.cages!.includes(c)))
          : 'cageIds' in obj
            ? obj.cageIds.some((c) => f.cages!.includes(c))
            : f.cages.includes(obj.cageId ?? MISSING);
      if (!ok) return false;
    }
    if (f.epcis.length && !f.epcis.includes(this.epciOf(obj.communeInsee).code ?? MISSING)) return false;
    if (f.residences.length) {
      const resId = 'batimentIds' in obj ? obj.id : obj.residenceId;
      if (!f.residences.includes(resId ?? MISSING)) return false;
    }
    if (f.qpv.length || f.zonesApl.length || f.zonesPinel.length) {
      const g = this.geoOf(obj);
      if (f.qpv.length && !f.qpv.includes(PatrimoineIndex.qpvStatus(g))) return false;
      if (f.zonesApl.length && !f.zonesApl.includes(g?.zoneApl ?? MISSING)) return false;
      if (f.zonesPinel.length && !f.zonesPinel.includes(g?.zonePinel ?? MISSING)) return false;
    }
    for (const [role, values] of Object.entries(f.roles) as [RoleKey, string[] | undefined][]) {
      if (values?.length && !values.includes(obj.responsables[role] ?? MISSING)) return false;
    }
    return true;
  }

  /**
   * Calcule la vue filtrée. Les filtres s'évaluent au niveau LOGEMENT (niveau le plus fin) :
   * une résidence est visible si au moins un de ses logements l'est ; les compteurs affichés sont
   * ceux des logements retenus. Les résidences sans logement connu sont évaluées directement.
   * `hidden` = catégories masquées dans la légende (pour le critère `colorBy`).
   */
  compute(f: Filters, colorBy: ColorBy, hidden: ReadonlySet<string>): FilteredView {
    const resCount = new Map<string, number>();
    const batCount = new Map<string, number>();
    const catStats = new Map<string, CategoryStat>();
    const catResidences = new Map<string, Set<string>>();
    const byCommune = new Map<string, AreaAggregate>();
    const byEpci = new Map<string, AreaAggregate>();
    const logements: FilteredView['logements'] = [];

    const stat = (cat: string) => {
      let s = catStats.get(cat);
      if (!s) catStats.set(cat, (s = { value: cat, logements: 0, residences: 0 }));
      return s;
    };
    const addArea = (map: Map<string, AreaAggregate>, code: string | undefined, nom: string | undefined, obj: Logement | Residence, n: number, cat: string) => {
      const k = code ?? MISSING;
      let a = map.get(k);
      if (!a) map.set(k, (a = { code: k, nom: nom ?? 'Non renseigné', logements: 0, residences: new Set(), byAgence: new Map(), byCat: new Map() }));
      a.logements += n;
      const resId = 'batimentIds' in obj ? obj.id : obj.residenceId;
      if (resId) a.residences.add(resId);
      const ag = obj.agenceId ?? MISSING;
      a.byAgence.set(ag, (a.byAgence.get(ag) ?? 0) + Math.max(n, 1));
      a.byCat.set(cat, (a.byCat.get(cat) ?? 0) + Math.max(n, 1));
    };

    for (const l of this.logements.values()) {
      if (!this.matches(l, f)) continue;
      const cat = this.categoryOf(colorBy, l);
      stat(cat).logements++;
      if (l.residenceId) {
        let set = catResidences.get(cat);
        if (!set) catResidences.set(cat, (set = new Set()));
        set.add(l.residenceId);
      }
      if (hidden.has(cat)) continue;
      logements.push({ item: l, cat });
      if (l.residenceId) resCount.set(l.residenceId, (resCount.get(l.residenceId) ?? 0) + 1);
      if (l.batimentId) batCount.set(l.batimentId, (batCount.get(l.batimentId) ?? 0) + 1);
      const c = this.communes.get(l.communeInsee ?? '');
      addArea(byCommune, l.communeInsee, c?.nom ?? l.communeNom, l, 1, cat);
      addArea(byEpci, c?.epciCode, c?.epciNom, l, 1, cat);
    }

    const residences: FilteredView['residences'] = [];
    for (const r of this.residences.values()) {
      const cat = this.categoryOf(colorBy, r);
      if (r.nbLogements === 0) {
        // Résidence sans logement connu : évaluée sur ses propres attributs.
        if (!this.matches(r, f)) continue;
        stat(cat).residences++;
        if (hidden.has(cat)) continue;
        residences.push({ item: r, n: 0, cat });
        const c = this.communes.get(r.communeInsee ?? '');
        addArea(byCommune, r.communeInsee, c?.nom ?? r.communeNom, r, 0, cat);
        addArea(byEpci, c?.epciCode, c?.epciNom, r, 0, cat);
        continue;
      }
      const n = resCount.get(r.id);
      if (n) residences.push({ item: r, n, cat });
    }
    for (const [cat, set] of catResidences) stat(cat).residences += set.size;

    const visibleRes = new Set(residences.map((r) => r.item.id));
    const batiments: FilteredView['batiments'] = [];
    for (const b of this.batiments.values()) {
      const n = batCount.get(b.id);
      if (n) batiments.push({ item: b, n, cat: this.categoryOf(colorBy, b) });
      else if (b.nbLogements === 0 && b.residenceId && visibleRes.has(b.residenceId) && this.matches(b, f)) {
        batiments.push({ item: b, n: 0, cat: this.categoryOf(colorBy, b) });
      }
    }

    // Position des agrégats : barycentre des résidences visibles (ou centre de la commune).
    const sums = new Map<string, [number, number, number]>();
    for (const { item } of residences) {
      if (!item.position || !item.communeInsee) continue;
      const s = sums.get(item.communeInsee) ?? [0, 0, 0];
      s[0] += item.position.lon;
      s[1] += item.position.lat;
      s[2]++;
      sums.set(item.communeInsee, s);
    }
    for (const a of byCommune.values()) {
      const s = sums.get(a.code);
      a.position = this.communes.get(a.code)?.centre ?? (s ? { lon: s[0] / s[2], lat: s[1] / s[2] } : undefined);
    }

    return {
      residences,
      batiments,
      logements,
      categories: [...catStats.values()].sort((a, b) => b.logements - a.logements || b.residences - a.residences),
      byCommune,
      byEpci,
      totals: { logements: logements.length, residences: residences.length, batiments: batiments.length },
    };
  }
}
