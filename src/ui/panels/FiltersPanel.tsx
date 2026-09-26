import type { RoleKey } from '../../domain/model';
import { activeFilterCount, type Filters } from '../../domain/patrimoineIndex';
import { useAppStore } from '../../store/useAppStore';
import { siteConfig } from '../../config/siteConfig';
import { useFilteredView } from '../../store/useFilteredView';
import { Icon } from '../components/Icon';
import { MultiSelect, Section, fmt, type Option } from '../components/controls';
import { ROLE_LABELS, useFilterOptions } from './filterOptions';

const F = siteConfig.ui.filters;

/** Nombre de critères actifs d'un groupe (affiché dans le titre replié). */
const countOf = (f: Filters, keys: (keyof Filters)[]) =>
  keys.reduce((s, k) => s + (k === 'roles' ? Object.values(f.roles).reduce((a, v) => a + (v?.length ?? 0), 0) : ((f[k] as unknown[] | undefined)?.length ?? 0)), 0);
const title = (label: string, n: number) => (n ? `${label} (${n})` : label);

export function FiltersPanel() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const setRoleFilter = useAppStore((s) => s.setRoleFilter);
  const reset = useAppStore((s) => s.resetFilters);
  const layers = useAppStore((s) => s.layers);
  const opts = useFilterOptions();
  const view = useFilteredView();
  const n = activeFilterCount(filters);

  const geo = F.regions || F.departements || F.epcis || F.communes || F.quartiers;
  const ref = F.qpv || F.apl || F.pinel;
  const pat = F.agences || F.residences || F.batiments || F.cages;

  return (
    <div className="panel-content">
      <div className="filter-summary">
        <div>
          <strong>{fmt(view?.totals.logements)}</strong> logements · <strong>{fmt(view?.totals.residences)}</strong> résidences
          <div className="muted small">{n ? `${n} critère(s) actif(s) — combinés par ET` : 'Aucun filtre actif'}</div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={!n} onClick={reset}>
          <Icon name="reset" size={15} /> Réinitialiser
        </button>
      </div>

      {geo && (
        <Section title={title('Géographie', countOf(filters, ['regions', 'departements', 'epcis', 'communes', 'quartiers']))} defaultOpen={false}>
          {F.regions && <MultiSelect label="Région" options={opts.regions} value={filters.regions ?? []} onChange={(v) => setFilters({ regions: v })} />}
          {F.departements && <MultiSelect label="Département" options={opts.departements} value={filters.departements ?? []} onChange={(v) => setFilters({ departements: v })} />}
          {F.epcis && <MultiSelect label="EPCI" options={opts.epcis} value={filters.epcis} onChange={(v) => setFilters({ epcis: v })} placeholder={opts.epcis.length ? 'Rechercher…' : 'Référentiel EPCI non chargé'} />}
          {F.communes && <MultiSelect label="Commune" options={opts.communes} value={filters.communes} onChange={(v) => setFilters({ communes: v })} />}
          {F.quartiers && <MultiSelect label="Quartier" options={opts.quartiers} value={filters.quartiers ?? []} onChange={(v) => setFilters({ quartiers: v })} placeholder={opts.quartiers.length ? 'Rechercher…' : 'Aucun code quartier dans les données'} />}
        </Section>
      )}

      {ref && (
        <Section title={title('Référentiels', countOf(filters, ['qpv', 'zonesApl', 'zonesPinel']))} defaultOpen={false}>
          {F.qpv && <ChipGroup label="Géographie prioritaire (QPV)" options={opts.qpv} value={filters.qpv} onChange={(v) => setFilters({ qpv: v as typeof filters.qpv })} disabled={layers.qpv?.status === 'unavailable' || layers.qpv?.status === 'error'} disabledText="Référentiel QPV non disponible." />}
          {F.apl && <ChipGroup label="Zonage APL" options={opts.apl} value={filters.zonesApl} onChange={(v) => setFilters({ zonesApl: v })} disabled={opts.apl.length <= 1} disabledText="Table de zonage APL non disponible." />}
          {F.pinel && <ChipGroup label="Zonage Pinel (ABC)" options={opts.pinel} value={filters.zonesPinel} onChange={(v) => setFilters({ zonesPinel: v })} disabled={opts.pinel.length <= 1} disabledText="Table de zonage ABC non disponible." />}
        </Section>
      )}

      {pat && (
        <Section title={title('Patrimoine', countOf(filters, ['agences', 'residences', 'batiments', 'cages']))} defaultOpen={false}>
          {F.agences && <MultiSelect label="Agence" options={opts.agences} value={filters.agences} onChange={(v) => setFilters({ agences: v })} />}
          {F.residences && <MultiSelect label="Ensemble résidentiel (HP1)" options={opts.residences} value={filters.residences} onChange={(v) => setFilters({ residences: v })} />}
          {F.batiments && <MultiSelect label="Adresse (HP2)" options={opts.batiments} value={filters.batiments ?? []} onChange={(v) => setFilters({ batiments: v })} />}
          {F.cages && <MultiSelect label="Cage d’escalier (HP3)" options={opts.cages} value={filters.cages ?? []} onChange={(v) => setFilters({ cages: v })} />}
        </Section>
      )}

      {F.roles && (
        <Section title={title('Métier', countOf(filters, ['roles']))} defaultOpen={false}>
          {(Object.keys(ROLE_LABELS) as RoleKey[]).map((k) => (
            <MultiSelect key={k} label={ROLE_LABELS[k]} options={opts.roles[k] ?? []} value={filters.roles[k] ?? []} onChange={(v) => setRoleFilter(k, v)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function ChipGroup({ label, options, value, onChange, disabled, disabledText }: { label: string; options: Option[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean; disabledText?: string }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {disabled ? (
        <p className="help">{disabledText}</p>
      ) : (
        <div className="chip-toggles">
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <button key={o.value} type="button" className={`chip-toggle ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}>
                {o.color && <span className="dot" style={{ background: o.color }} />}
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
