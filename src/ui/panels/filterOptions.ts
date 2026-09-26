import { useMemo } from 'react';
import { zoneColors } from '../../config/layers.config';
import type { QpvStatus, RoleKey } from '../../domain/model';
import { MISSING, QPV_LABELS } from '../../domain/symbology';
import { colorRegistry } from '../../store/colorRegistry';
import { useAppStore } from '../../store/useAppStore';
import { DEPARTEMENT_NAMES, regionName, regionOfDep } from '../../domain/regions';
import type { Option } from '../components/controls';

export const ROLE_LABELS: Record<RoleKey, string> = {
  conseillerCommercial: 'Conseiller commercial',
  gerantImmobilier: 'Gérant immobilier',
  conseillerSocial: 'Conseiller social / recouvrement',
  travailleurSocial: 'Travailleur social',
};

/** Options des filtres, dérivées des données chargées (jamais codées en dur). */
export function useFilterOptions() {
  const index = useAppStore((s) => s.index);
  const geoVersion = useAppStore((s) => s.geoVersion);
  return useMemo(() => {
    void geoVersion;
    const empty = { regions: [] as Option[], departements: [] as Option[], quartiers: [] as Option[], batiments: [] as Option[], cages: [] as Option[], agences: [] as Option[], communes: [] as Option[], epcis: [] as Option[], residences: [] as Option[], qpv: [] as Option[], apl: [] as Option[], pinel: [] as Option[], roles: {} as Record<RoleKey, Option[]> };
    if (!index) return empty;
    const communes = new Map<string, { n: number; nom: string }>();
    const epcis = new Map<string, { n: number; nom: string }>();
    const roles: Record<RoleKey, Map<string, number>> = { conseillerCommercial: new Map(), gerantImmobilier: new Map(), conseillerSocial: new Map(), travailleurSocial: new Map() };
    const apl = new Set<string>();
    const pinel = new Set<string>();
    for (const r of index.residences.values()) {
      if (r.communeInsee) {
        const c = communes.get(r.communeInsee) ?? { n: 0, nom: index.communes.get(r.communeInsee)?.nom ?? r.communeNom ?? r.communeInsee };
        c.n += r.nbLogements;
        communes.set(r.communeInsee, c);
        const e = index.epciOf(r.communeInsee);
        if (e.code) {
          const x = epcis.get(e.code) ?? { n: 0, nom: e.nom ?? e.code };
          x.n += r.nbLogements;
          epcis.set(e.code, x);
        }
      }
      const g = index.geo.get(r.id);
      if (g?.zoneApl) apl.add(g.zoneApl);
      if (g?.zonePinel) pinel.add(g.zonePinel);
    }
    for (const l of index.logements.values()) {
      for (const k of Object.keys(roles) as RoleKey[]) {
        const v = l.responsables[k];
        if (v) roles[k].set(v, (roles[k].get(v) ?? 0) + 1);
      }
    }
    const byName = (a: Option, b: Option) => a.label.localeCompare(b.label, 'fr');
    const roleOptions = Object.fromEntries(
      (Object.keys(roles) as RoleKey[]).map((k) => [k, [...roles[k].entries()].map(([v, n]) => ({ value: v, label: v, hint: `${n} lgt` })).sort(byName)]),
    ) as Record<RoleKey, Option[]>;
    const qpvStatuses: QpvStatus[] = ['en_qpv', 'moins_300m', 'hors_qpv', 'inconnu'];
    const count = (m: Map<string, number>, k: string | undefined, n: number) => k && m.set(k, (m.get(k) ?? 0) + n);
    const regs = new Map<string, number>();
    const deps = new Map<string, number>();
    const quarts = new Map<string, number>();
    for (const r of index.residences.values()) {
      const d = r.communeInsee?.slice(0, 2);
      count(deps, d, r.nbLogements);
      count(regs, regionOfDep(d), r.nbLogements);
      count(quarts, r.quartier, r.nbLogements);
    }
    const lgt = (n: number) => `${n.toLocaleString('fr-FR')} lgt`;
    return {
      regions: [...regs.entries()].map(([v, n]) => ({ value: v, label: regionName(v), hint: lgt(n) })).sort(byName),
      departements: [...deps.entries()].map(([v, n]) => ({ value: v, label: `${v} – ${DEPARTEMENT_NAMES[v] ?? 'Département'}`, hint: lgt(n) })).sort((a, b) => a.value.localeCompare(b.value)),
      quartiers: [...quarts.entries()].map(([v, n]) => ({ value: v, label: v, hint: lgt(n) })).sort(byName),
      batiments: [...index.batiments.values()].map((b) => ({ value: b.id, label: b.adresse ?? b.libelle, hint: b.code })).sort(byName),
      cages: [...index.cages.values()].map((c) => {
        const b = c.batimentId ? index.batiments.get(c.batimentId) : undefined;
        return { value: c.id, label: `${c.libelle} — ${b?.adresse ?? b?.libelle ?? ''}`, hint: c.code };
      }).sort(byName),
      agences: [...index.agences.values()].map((a) => ({ value: a.id, label: a.nom, color: colorRegistry.colorOf('agence', a.id) })),
      communes: [...communes.entries()].map(([v, c]) => ({ value: v, label: c.nom, hint: `${c.n} lgt` })).sort(byName),
      epcis: [...epcis.entries()].map(([v, c]) => ({ value: v, label: c.nom, hint: `${c.n} lgt` })).sort(byName),
      residences: [...index.residences.values()].map((r) => ({ value: r.id, label: r.nom, hint: r.code })).sort(byName),
      qpv: qpvStatuses.map((s) => ({ value: s, label: QPV_LABELS[s], color: zoneColors.qpv[s] })),
      apl: [...apl].sort().map((z) => ({ value: z, label: `Zone ${z}`, color: zoneColors.apl[z] })).concat([{ value: MISSING, label: 'Non renseigné', color: '#adb5bd' }]),
      pinel: ['Abis', 'A', 'B1', 'B2', 'C'].filter((z) => pinel.has(z)).map((z) => ({ value: z, label: `Zone ${z === 'Abis' ? 'A bis' : z}`, color: zoneColors.pinel[z] })).concat([{ value: MISSING, label: 'Non renseigné', color: '#adb5bd' }]),
      roles: roleOptions,
    };
  }, [index, geoVersion]);
}
