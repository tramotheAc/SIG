import { useMemo, useState } from 'react';
import type { EntityKind, RoleKey } from '../../domain/model';
import { MISSING, type ColorBy } from '../../domain/symbology';
import { colorRegistry } from '../../store/colorRegistry';
import { selectAndZoom } from '../../store/navigation';
import { useAppStore } from '../../store/useAppStore';
import { useFilteredView } from '../../store/useFilteredView';
import { exportRows } from '../../export/excelExport';
import { Icon } from '../components/Icon';
import { fmt } from '../components/controls';
import { ROLE_LABELS } from './filterOptions';

type AnalysisId = 'commune' | 'epci' | 'agence' | 'qpv' | 'apl' | 'pinel' | RoleKey;

const ANALYSES: { id: AnalysisId; label: string; group: string }[] = [
  { id: 'commune', label: 'Logements par commune', group: 'Territoire' },
  { id: 'epci', label: 'Logements par EPCI', group: 'Territoire' },
  { id: 'agence', label: 'Logements par agence', group: 'Organisation' },
  { id: 'qpv', label: 'Logements en QPV / à moins de 300 m', group: 'Géographie prioritaire' },
  { id: 'apl', label: 'Logements par zone APL', group: 'Zonages' },
  { id: 'pinel', label: 'Logements par zone Pinel (ABC)', group: 'Zonages' },
  ...(Object.keys(ROLE_LABELS) as RoleKey[]).map((k) => ({ id: k, label: `Répartition par ${ROLE_LABELS[k].toLowerCase()}`, group: 'Métiers' })),
];

const COLOR_FOR: Partial<Record<AnalysisId, ColorBy>> = { agence: 'agence', qpv: 'qpv', apl: 'zoneApl', pinel: 'zonePinel' };

interface Row {
  key: string;
  label: string;
  logements: number;
  residences: number;
  color?: string;
  ref?: { kind: EntityKind; id: string };
}

/**
 * Analyses géographiques simples, calculées sur le périmètre filtré.
 * Pas de moteur statistique : des comptages directement représentables sur la carte.
 */
export function AnalysePanel() {
  const [id, setId] = useState<AnalysisId>('commune');
  const view = useFilteredView();
  const index = useAppStore((s) => s.index);
  const setP = useAppStore((s) => s.setPatrimoine);
  const setLayer = useAppStore((s) => s.setLayer);
  const flyTo = useAppStore((s) => s.flyTo);
  const layers = useAppStore((s) => s.layers);
  const notify = useAppStore((s) => s.notify);

  const rows: Row[] = useMemo(() => {
    if (!view || !index) return [];
    if (id === 'commune' || id === 'epci') {
      const aggs = id === 'commune' ? view.byCommune : view.byEpci;
      return [...aggs.values()].map((a) => ({
        key: a.code,
        label: a.nom,
        logements: a.logements,
        residences: a.residences.size,
        ref: a.code !== MISSING ? { kind: id, id: a.code } : undefined,
      }));
    }
    const by: ColorBy = COLOR_FOR[id] ?? (id as RoleKey);
    const map = new Map<string, Row>();
    const resSeen = new Map<string, Set<string>>();
    for (const { item } of view.logements) {
      const cat = index.categoryOf(by, item);
      const row = map.get(cat) ?? { key: cat, label: index.categoryLabel(by, cat), logements: 0, residences: 0, color: colorRegistry.colorOf(by, cat), ref: by === 'agence' && cat !== MISSING ? { kind: 'agence' as const, id: cat } : undefined };
      row.logements++;
      map.set(cat, row);
      const s = resSeen.get(cat) ?? new Set();
      if (item.residenceId) s.add(item.residenceId);
      resSeen.set(cat, s);
    }
    for (const [cat, s] of resSeen) map.get(cat)!.residences = s.size;
    return [...map.values()];
  }, [view, index, id]);

  const sorted = [...rows].sort((a, b) => (a.key === MISSING ? 1 : b.key === MISSING ? -1 : b.logements - a.logements));
  const total = rows.reduce((s, r) => s + r.logements, 0);
  const max = Math.max(1, ...rows.map((r) => r.logements));
  const def = ANALYSES.find((a) => a.id === id)!;
  const geoMissing =
    (id === 'qpv' && layers.qpv.status !== 'ready') || (id === 'apl' && layers.apl.status !== 'ready') || (id === 'pinel' && layers.pinel.status !== 'ready') || (id === 'epci' && layers.epci.status === 'error');

  const showOnMap = () => {
    if (id === 'commune') {
      setP({ representation: 'commune' });
      setLayer('communes', { visible: true, patrimoineOnly: true, colorByAgence: true });
      notify('Agrégats par commune affichés (taille = logements, secteurs = répartition).', 'info');
    } else if (id === 'epci') {
      setLayer('epci', { visible: true, patrimoineOnly: true, colorByAgence: true });
      notify('EPCI avec patrimoine affichés, colorés par agence majoritaire.', 'info');
    } else {
      setP({ colorBy: COLOR_FOR[id] ?? (id as RoleKey) });
      if (id === 'qpv') {
        setLayer('qpv', { visible: true });
        setLayer('qpv300', { visible: true });
      }
      if (id === 'apl') setLayer('apl', { visible: true });
      if (id === 'pinel') setLayer('pinel', { visible: true });
      notify('Coloration de la carte mise à jour.', 'info');
    }
    if (index) {
      flyTo({ bounds: [[-5.2, 46.85], [-0.95, 48.95]] });
    }
  };

  return (
    <div className="panel-content">
      <div className="field pad-x">
        <label className="field-label" htmlFor="analysis">Analyse</label>
        <select id="analysis" className="select" value={id} onChange={(e) => setId(e.target.value as AnalysisId)}>
          {[...new Set(ANALYSES.map((a) => a.group))].map((g) => (
            <optgroup key={g} label={g}>
              {ANALYSES.filter((a) => a.group === g).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </optgroup>
          ))}
        </select>
        <p className="help">Calculée sur le périmètre filtré : {fmt(total)} logements.</p>
      </div>
      {geoMissing && <p className="notice"><Icon name="warning" size={15} /> Référentiel nécessaire non disponible : les logements apparaissent en « Non renseigné / Non déterminé ».</p>}
      <div className="pad-x analysis-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={showOnMap}><Icon name="pin" size={15} /> Représenter sur la carte</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportRows(def.label, sorted.map((r) => ({ Valeur: r.label, Logements: r.logements, Résidences: r.residences, 'Part (%)': total ? Math.round((r.logements / total) * 1000) / 10 : 0 })))}>
          <Icon name="table" size={15} /> Excel
        </button>
      </div>
      <table className="analysis-table">
        <thead>
          <tr><th>{id === 'commune' ? 'Commune' : id === 'epci' ? 'EPCI' : 'Valeur'}</th><th className="num">Logts</th><th className="num">%</th></tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.key} className={r.ref ? 'is-clickable' : ''} onClick={() => r.ref && selectAndZoom(r.ref)} tabIndex={r.ref ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && r.ref && selectAndZoom(r.ref)}>
              <td>
                <div className="bar-label">
                  {r.color && <span className="dot" style={{ background: r.color }} />}
                  <span>{r.label}</span>
                  <span className="muted small">{fmt(r.residences)} rés.</span>
                </div>
                <div className="bar"><span style={{ width: `${(r.logements / max) * 100}%`, background: r.color ?? 'var(--accent)' }} /></div>
              </td>
              <td className="num">{fmt(r.logements)}</td>
              <td className="num">{total ? `${((r.logements / total) * 100).toFixed(1)}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sorted.length && <p className="empty">Aucun logement dans le périmètre filtré.</p>}
    </div>
  );
}
