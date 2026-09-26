import type { RoleKey } from '../domain/model';
import { activeFilterCount, type Filters } from '../domain/patrimoineIndex';
import { MISSING, QPV_LABELS } from '../domain/symbology';
import { useAppStore } from '../store/useAppStore';
import { regionName } from '../domain/regions';
import { Icon } from './components/Icon';
import { ROLE_LABELS } from './panels/filterOptions';

/** Bandeau des filtres actifs, au-dessus de la carte. */
export function ActiveFilters() {
  const filters = useAppStore((s) => s.filters);
  const index = useAppStore((s) => s.index);
  const hidden = useAppStore((s) => s.patrimoine.hidden);
  const setFilters = useAppStore((s) => s.setFilters);
  const setRole = useAppStore((s) => s.setRoleFilter);
  const reset = useAppStore((s) => s.resetFilters);
  const hiddenCount = Object.values(hidden).reduce((s, v) => s + (v?.length ?? 0), 0);
  if (!index || (activeFilterCount(filters) === 0 && hiddenCount === 0)) return null;

  const lab = (v: string, f: (x: string) => string | undefined) => (v === MISSING ? 'Non renseigné' : (f(v) ?? v));
  const chips: { key: string; label: string; remove: () => void }[] = [];
  const add = <K extends Exclude<keyof Filters, 'roles' | 'departements' | 'regions' | 'quartiers' | 'batiments' | 'cages'>>(key: K, title: string, f: (x: string) => string | undefined) => {
    for (const v of filters[key] as string[]) {
      chips.push({ key: `${key}-${v}`, label: `${title} : ${lab(v, f)}`, remove: () => setFilters({ [key]: (filters[key] as string[]).filter((x) => x !== v) } as Partial<Filters>) });
    }
  };
  add('agences', 'Agence', (v) => index.agences.get(v)?.nom);
  add('communes', 'Commune', (v) => index.communes.get(v)?.nom);
  add('epcis', 'EPCI', (v) => [...index.communes.values()].find((c) => c.epciCode === v)?.epciNom);
  add('residences', 'Résidence', (v) => index.residences.get(v)?.nom);
  const extra: [keyof Filters, string, (v: string) => string][] = [
    ['regions', 'Région', (v) => regionName(v)],
    ['quartiers', 'Quartier', (v) => v],
    ['batiments', 'Adresse', (v) => index.batiments.get(v)?.adresse ?? v],
    ['cages', 'Cage', (v) => { const c = index.cages.get(v); return c ? `${c.libelle} (${c.code})` : v; }],
  ];
  for (const [key, lab, f] of extra) {
    const vals = (filters[key] as string[] | undefined) ?? [];
    for (const v of vals) chips.push({ key: `${key}-${v}`, label: `${lab} : ${f(v)}`, remove: () => setFilters({ [key]: vals.filter((x) => x !== v) } as Partial<Filters>) });
  }
  for (const d of filters.departements ?? []) chips.push({ key: `dep-${d}`, label: `Département : ${d}`, remove: () => setFilters({ departements: (filters.departements ?? []).filter((x) => x !== d) }) });
  add('qpv', 'QPV', (v) => QPV_LABELS[v as keyof typeof QPV_LABELS]);
  add('zonesApl', 'APL', (v) => `zone ${v}`);
  add('zonesPinel', 'Pinel', (v) => `zone ${v}`);
  for (const [role, values] of Object.entries(filters.roles) as [RoleKey, string[]][]) {
    for (const v of values ?? []) chips.push({ key: `${role}-${v}`, label: `${ROLE_LABELS[role]} : ${lab(v, (x) => x)}`, remove: () => setRole(role, values.filter((x) => x !== v)) });
  }

  return (
    <div className="active-filters" role="region" aria-label="Filtres actifs">
      <Icon name="filter" size={15} />
      {chips.map((c) => (
        <span key={c.key} className="chip chip-dark">
          {c.label}
          <button type="button" aria-label={`Retirer le filtre ${c.label}`} onClick={c.remove}><Icon name="close" size={12} /></button>
        </span>
      ))}
      {hiddenCount > 0 && <span className="chip chip-dark">{hiddenCount} catégorie(s) masquée(s)</span>}
      <button type="button" className="link-btn" onClick={reset}>Réinitialiser les filtres</button>
    </div>
  );
}
