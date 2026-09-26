import { symbologyConfig } from '../config/symbology.config';
import { zoneColors } from '../config/layers.config';
import type { QpvStatus, RoleKey } from './model';

/** Critères de coloration du patrimoine. */
export type ColorBy =
  | 'agence'
  | RoleKey
  | 'qpv'
  | 'zoneApl'
  | 'zonePinel'
  | 'commune'
  | 'epci'
  | 'departement'
  | 'quartier'
  | 'typeLot'
  | 'financement'
  | 'individuelCollectif'
  | 'etat'
  | 'periode'
  | 'modeAcquisition';

/** Critères portés par les logements : la résidence / l'adresse prend la valeur majoritaire. */
export const LOGEMENT_LEVEL: ColorBy[] = ['typeLot', 'financement', 'individuelCollectif', 'etat'];

export type ColorGroup = 'metier' | 'territoire' | 'patrimoine' | 'geo';
export const COLOR_GROUP_LABELS: Record<ColorGroup, string> = {
  metier: 'Organisation / métiers',
  territoire: 'Territoire',
  patrimoine: 'Caractéristiques du patrimoine',
  geo: 'Référentiels',
};

export const COLOR_BY_OPTIONS: { key: ColorBy; label: string; group: ColorGroup }[] = [
  { key: 'agence', label: 'Agence', group: 'metier' },
  { key: 'conseillerCommercial', label: 'Conseiller commercial', group: 'metier' },
  { key: 'gerantImmobilier', label: 'Gérant immobilier', group: 'metier' },
  { key: 'conseillerSocial', label: 'Conseiller social / recouvrement', group: 'metier' },
  { key: 'travailleurSocial', label: 'Travailleur social', group: 'metier' },
  { key: 'qpv', label: 'Situation QPV', group: 'geo' },
  { key: 'zoneApl', label: 'Zone APL', group: 'geo' },
  { key: 'zonePinel', label: 'Zone Pinel (ABC)', group: 'geo' },
  { key: 'departement', label: 'Département', group: 'territoire' },
  { key: 'epci', label: 'EPCI', group: 'territoire' },
  { key: 'commune', label: 'Commune', group: 'territoire' },
  { key: 'quartier', label: 'Quartier', group: 'territoire' },
  { key: 'typeLot', label: 'Typologie (T1…T5)', group: 'patrimoine' },
  { key: 'financement', label: 'Financement', group: 'patrimoine' },
  { key: 'individuelCollectif', label: 'Individuel / collectif', group: 'patrimoine' },
  { key: 'etat', label: 'État du logement', group: 'patrimoine' },
  { key: 'periode', label: 'Période de construction', group: 'patrimoine' },
  { key: 'modeAcquisition', label: 'Mode d’acquisition', group: 'patrimoine' },
];

export const MISSING = '__missing__';

export const QPV_LABELS: Record<QpvStatus, string> = {
  en_qpv: 'En QPV',
  moins_300m: 'À moins de 300 m d’un QPV',
  hors_qpv: 'Hors QPV (> 300 m)',
  inconnu: 'Non déterminé',
};

/**
 * Registre de couleurs STABLE pendant la session :
 * une valeur reçoit une couleur la première fois qu'elle est rencontrée (catégories triées),
 * puis la conserve, même si les filtres changent l'ensemble des valeurs visibles.
 */
export class ColorRegistry {
  private readonly maps = new Map<ColorBy, Map<string, string>>();

  /** Initialise l'ordre des couleurs à partir de l'ensemble complet des valeurs d'un critère. */
  register(by: ColorBy, values: Iterable<string>, fixed?: Record<string, string>) {
    const map = this.maps.get(by) ?? new Map<string, string>();
    const sorted = [...new Set(values)].filter((v) => v !== MISSING).sort((a, b) => a.localeCompare(b, 'fr'));
    for (const v of sorted) {
      if (map.has(v)) continue;
      map.set(v, fixed?.[v] ?? this.nextColor(map));
    }
    this.maps.set(by, map);
  }

  colorOf(by: ColorBy, value: string | undefined): string {
    if (value === undefined || value === MISSING) return symbologyConfig.missingColor;
    const fixed = fixedColors(by)?.[value];
    if (fixed) return fixed;
    const map = this.maps.get(by) ?? new Map<string, string>();
    let c = map.get(value);
    if (!c) {
      c = this.nextColor(map);
      map.set(value, c);
      this.maps.set(by, map);
    }
    return c;
  }

  private nextColor(map: Map<string, string>): string {
    const palette = symbologyConfig.palette;
    const used = new Set(map.values());
    const free = palette.find((c) => !used.has(c));
    if (free) return free;
    // Palette épuisée : dérive déterministe (rotation de teinte).
    return hslColor((map.size * 137.508) % 360);
  }
}

function fixedColors(by: ColorBy): Record<string, string> | undefined {
  if (by === 'qpv') return zoneColors.qpv;
  if (by === 'zoneApl') return zoneColors.apl;
  if (by === 'zonePinel') return zoneColors.pinel;
  return undefined;
}

function hslColor(h: number) {
  return `hsl(${h.toFixed(0)}, 55%, 45%)`;
}

/* ------------------------------------------------------------------ */
/* Taille des ponctuels                                               */
/* ------------------------------------------------------------------ */

export type SizeMode = 'fixe' | 'logements';

/** Percentile (0–1) d'une liste de nombres. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))));
  return s[idx];
}

/**
 * Rayon (px) en fonction du nombre de logements.
 * Échelle racine carrée (surface ∝ logements), bornée par un plafond (p95) : au-delà, rayon max.
 */
export function radiusFor(n: number, cap: number, min: number, max: number): number {
  if (!(n > 0) || !(cap > 0)) return min;
  const r = min + (max - min) * Math.sqrt(Math.min(n, cap) / cap);
  return Math.round(r * 10) / 10;
}
