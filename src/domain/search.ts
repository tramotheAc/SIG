/**
 * Recherche locale dans le patrimoine et les référentiels chargés.
 * La recherche d'adresses « hors patrimoine » (BAN) est faite par src/data/referentiels/geocodage.ts.
 */
import type { EntityKind, GeoPoint } from './model';
import type { PatrimoineIndex } from './patrimoineIndex';

export interface SearchResult {
  kind: EntityKind;
  id: string;
  label: string;
  sublabel?: string;
  position?: GeoPoint;
  payload?: Record<string, unknown>;
}

export const SEARCH_GROUPS: { kind: EntityKind; label: string }[] = [
  { kind: 'commune', label: 'Communes' },
  { kind: 'epci', label: 'EPCI' },
  { kind: 'agence', label: 'Agences' },
  { kind: 'residence', label: 'Résidences' },
  { kind: 'batiment', label: 'Bâtiments / adresses du patrimoine' },
  { kind: 'logement', label: 'Logements' },
  { kind: 'adresse', label: 'Adresses (BAN)' },
];

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface Entry {
  kind: EntityKind;
  id: string;
  text: string;
  label: string;
  sublabel?: string;
  weight: number;
}

export class SearchIndex {
  private entries: Entry[] = [];

  constructor(index: PatrimoineIndex) {
    const ix = index;
    const communesWithPat = new Set<string>();
    const epcisWithPat = new Map<string, string>();
    for (const r of ix.residences.values()) {
      if (r.communeInsee) communesWithPat.add(r.communeInsee);
      const e = ix.epciOf(r.communeInsee);
      if (e.code) epcisWithPat.set(e.code, e.nom ?? e.code);
      this.add('residence', r.id, `${r.nom} ${r.code} ${r.communeNom ?? ''} ${r.adresse ?? ''}`, r.nom, `${r.code} · ${r.communeNom ?? ''}`, 3);
    }
    for (const b of ix.batiments.values()) {
      this.add('batiment', b.id, `${b.adresse ?? b.libelle} ${b.communeNom ?? ''} ${b.code}`, b.adresse ?? b.libelle, `${b.communeNom ?? ''} · ${ix.residences.get(b.residenceId ?? '')?.nom ?? ''}`, 2);
    }
    for (const l of ix.logements.values()) {
      // Recherche par identifiants uniquement (évite le bruit sur les adresses).
      this.add('logement', l.id, `${l.code} ${l.rpls ?? ''} ${l.id}`, `Logement ${l.code}`, `${l.adresse ?? ''} ${l.communeNom ?? ''}`, 1);
    }
    for (const a of ix.agences.values()) this.add('agence', a.id, `${a.nom} ${a.code}`, a.nom, a.code, 5);
    for (const c of ix.communes.values()) {
      const has = communesWithPat.has(c.insee);
      this.add('commune', c.insee, `${c.nom} ${c.insee}`, c.nom, `${c.insee}${has ? ' · patrimoine' : ''}`, has ? 6 : 4);
    }
    // Communes du patrimoine absentes du référentiel (référentiel non chargé) :
    for (const r of ix.residences.values()) {
      if (r.communeInsee && !ix.communes.has(r.communeInsee) && r.communeNom) {
        this.add('commune', r.communeInsee, `${r.communeNom} ${r.communeInsee}`, r.communeNom, r.communeInsee, 6);
        ix.communes.set(r.communeInsee, { insee: r.communeInsee, nom: r.communeNom });
      }
    }
    for (const [code, nom] of epcisWithPat) this.add('epci', code, `${nom} ${code}`, nom, code, 5);
  }

  private add(kind: EntityKind, id: string, text: string, label: string, sublabel: string | undefined, weight: number) {
    this.entries.push({ kind, id, text: normalize(text), label, sublabel, weight });
  }

  /** Recherche par tokens (tous les mots doivent être présents) ; résultats groupés et limités. */
  search(query: string, perGroup = 6): SearchResult[] {
    const q = normalize(query);
    if (q.length < 2) return [];
    const tokens = q.split(' ').filter(Boolean);
    const buckets = new Map<EntityKind, { e: Entry; score: number }[]>();
    for (const e of this.entries) {
      if (!tokens.every((t) => e.text.includes(t))) continue;
      const lab = normalize(e.label);
      const score = e.weight * 10 + (lab === q ? 50 : lab.startsWith(q) ? 20 : e.text.startsWith(tokens[0]) ? 8 : 0) - lab.length / 100;
      const arr = buckets.get(e.kind) ?? [];
      arr.push({ e, score });
      buckets.set(e.kind, arr);
    }
    const out: SearchResult[] = [];
    for (const [, arr] of buckets) {
      arr.sort((a, b) => b.score - a.score);
      for (const { e } of arr.slice(0, perGroup)) out.push({ kind: e.kind, id: e.id, label: e.label, sublabel: e.sublabel });
    }
    return out;
  }
}
