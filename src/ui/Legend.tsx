import { useMemo } from 'react';
import { MISSING, COLOR_BY_OPTIONS, type ColorBy } from '../domain/symbology';

/** Critères ordonnés : légende triée par valeur (T1→T5, décennies) et non par effectif. */
const ORDINAL: ColorBy[] = ['typeLot', 'periode', 'zoneApl', 'zonePinel', 'departement'];
import { colorRegistry } from '../store/colorRegistry';
import { useAppStore } from '../store/useAppStore';
import { useFilteredView } from '../store/useFilteredView';
import { Icon } from './components/Icon';
import { fmt } from './components/controls';

/**
 * Légende générée automatiquement à partir des données (jamais codée en dur).
 * Clic sur le libellé : filtre sur la catégorie. Œil : masque / affiche la catégorie.
 */
export function Legend({ compact = false }: { compact?: boolean }) {
  const index = useAppStore((s) => s.index);
  const colorBy = useAppStore((s) => s.patrimoine.colorBy);
  const hidden = useAppStore((s) => s.patrimoine.hidden[colorBy]);
  const filters = useAppStore((s) => s.filters);
  const geoVersion = useAppStore((s) => s.geoVersion);
  const isolate = useAppStore((s) => s.isolateCategory);
  const toggleHidden = useAppStore((s) => s.toggleHidden);
  const view = useFilteredView();

  const entries = useMemo(() => {
    if (!index) return [];
    void geoVersion;
    const stats = new Map(view?.categories.map((c) => [c.value, c]) ?? []);
    const all = new Set(index.allCategories(colorBy));
    for (const c of stats.keys()) all.add(c);
    return [...all]
      .map((value) => ({
        value,
        label: index.categoryLabel(colorBy, value),
        color: colorRegistry.colorOf(colorBy, value),
        logements: stats.get(value)?.logements ?? 0,
        residences: stats.get(value)?.residences ?? 0,
      }))
      .sort((a, b) =>
        a.value === MISSING ? 1 : b.value === MISSING ? -1 : ORDINAL.includes(colorBy) ? a.value.localeCompare(b.value, 'fr', { numeric: true }) : b.logements - a.logements || a.label.localeCompare(b.label, 'fr'),
      );
  }, [index, colorBy, view, geoVersion]);

  if (!index) return null;
  const selected = activeValues(colorBy, filters);
  const title = COLOR_BY_OPTIONS.find((o) => o.key === colorBy)?.label ?? '';

  return (
    <div className={`legend ${compact ? 'legend-compact' : ''}`}>
      <div className="legend-title">
        <span>Couleur : {title}</span>
        {compact && <span className="muted small">logements</span>}
      </div>
      {!entries.length && <div className="muted small">Aucune donnée pour ce critère.</div>}
      <ul className="legend-list">
        {entries.map((e) => {
          const isHidden = hidden?.includes(e.value);
          const isSel = selected.includes(e.value);
          return (
            <li key={e.value} className={`legend-item ${isHidden ? 'is-hidden' : ''} ${isSel ? 'is-selected' : ''} ${e.logements + e.residences === 0 ? 'is-empty' : ''}`}>
              <button type="button" className="legend-main" onClick={() => isolate(e.value)} title={isSel ? 'Retirer le filtre' : `Filtrer : ${e.label}`} aria-pressed={isSel}>
                <span className="legend-swatch" style={{ background: e.color }} />
                <span className="legend-label">{e.label}</span>
                <span className="legend-count">{fmt(e.logements)}</span>
              </button>
              <button type="button" className="icon-btn legend-eye" onClick={() => toggleHidden(e.value)} aria-label={isHidden ? `Afficher ${e.label}` : `Masquer ${e.label}`} title={isHidden ? 'Afficher' : 'Masquer'}>
                <Icon name={isHidden ? 'eyeOff' : 'eye'} size={15} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function activeValues(colorBy: string, f: ReturnType<typeof useAppStore.getState>['filters']): string[] {
  if (colorBy === 'agence') return f.agences;
  if (colorBy === 'qpv') return f.qpv;
  if (colorBy === 'zoneApl') return f.zonesApl;
  if (colorBy === 'zonePinel') return f.zonesPinel;
  if (colorBy === 'commune') return f.communes;
  if (colorBy === 'epci') return f.epcis;
  if (colorBy === 'departement') return f.departements ?? [];
  if (colorBy === 'quartier') return f.quartiers ?? [];
  return f.roles[colorBy as keyof typeof f.roles] ?? [];
}
