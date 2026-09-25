import type { RoleKey } from '../../domain/model';
import { activeFilterCount } from '../../domain/patrimoineIndex';
import { useAppStore } from '../../store/useAppStore';
import { useFilteredView } from '../../store/useFilteredView';
import { Icon } from '../components/Icon';
import { MultiSelect, Section, fmt, type Option } from '../components/controls';
import { ROLE_LABELS, useFilterOptions } from './filterOptions';

export function FiltersPanel() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const setRoleFilter = useAppStore((s) => s.setRoleFilter);
  const reset = useAppStore((s) => s.resetFilters);
  const layers = useAppStore((s) => s.layers);
  const opts = useFilterOptions();
  const view = useFilteredView();
  const n = activeFilterCount(filters);

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

      <Section title="Organisation">
        <MultiSelect label="Agence" options={opts.agences} value={filters.agences} onChange={(v) => setFilters({ agences: v })} />
      </Section>
      <Section title="Territoire">
        <MultiSelect label="Commune" options={opts.communes} value={filters.communes} onChange={(v) => setFilters({ communes: v })} />
        <MultiSelect label="EPCI" options={opts.epcis} value={filters.epcis} onChange={(v) => setFilters({ epcis: v })} placeholder={opts.epcis.length ? 'Rechercher…' : 'Référentiel EPCI non chargé'} />
        <MultiSelect label="Résidence" options={opts.residences} value={filters.residences} onChange={(v) => setFilters({ residences: v })} />
      </Section>
      <Section title="Géographie prioritaire et zonages">
        <ChipGroup label="QPV" options={opts.qpv} value={filters.qpv} onChange={(v) => setFilters({ qpv: v as typeof filters.qpv })} disabled={layers.qpv.status === 'unavailable' || layers.qpv.status === 'error'} disabledText="Référentiel QPV non disponible." />
        <ChipGroup label="Zone APL" options={opts.apl} value={filters.zonesApl} onChange={(v) => setFilters({ zonesApl: v })} disabled={opts.apl.length <= 1} disabledText="Table de zonage APL non disponible." />
        <ChipGroup label="Zone Pinel (ABC)" options={opts.pinel} value={filters.zonesPinel} onChange={(v) => setFilters({ zonesPinel: v })} disabled={opts.pinel.length <= 1} disabledText="Table de zonage ABC non disponible." />
      </Section>
      <Section title="Responsables métier" defaultOpen={false}>
        {(Object.keys(ROLE_LABELS) as RoleKey[]).map((k) => (
          <MultiSelect key={k} label={ROLE_LABELS[k]} options={opts.roles[k] ?? []} value={filters.roles[k] ?? []} onChange={(v) => setRoleFilter(k, v)} />
        ))}
      </Section>
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
