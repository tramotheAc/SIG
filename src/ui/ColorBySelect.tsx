import { siteConfig } from '../config/siteConfig';
import { COLOR_BY_OPTIONS, COLOR_GROUP_LABELS, type ColorBy, type ColorGroup } from '../domain/symbology';
import { useAppStore } from '../store/useAppStore';

/** Choix du critère de légende (couleur), partagé entre le panneau Patrimoine et la légende de la carte. */
export function ColorBySelect({ id, compact }: { id: string; compact?: boolean }) {
  const colorBy = useAppStore((s) => s.patrimoine.colorBy);
  const setP = useAppStore((s) => s.setPatrimoine);
  const options = COLOR_BY_OPTIONS.filter((o) => siteConfig.ui.colorBy.includes(o.key));
  const groups = [...new Set(options.map((o) => o.group))] as ColorGroup[];
  return (
    <select id={id} className={`select ${compact ? 'select-compact' : ''}`} value={colorBy} onChange={(e) => setP({ colorBy: e.target.value as ColorBy })} aria-label="Critère de légende">
      {groups.map((g) => (
        <optgroup key={g} label={COLOR_GROUP_LABELS[g]}>
          {options.filter((o) => o.group === g).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
