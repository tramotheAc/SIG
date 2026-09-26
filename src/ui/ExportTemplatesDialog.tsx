import { useEffect, useMemo, useRef, useState } from 'react';
import { usePopIn } from './motion';
import { createPortal } from 'react-dom';
import { siteConfig, ZONE_LABELS, type TemplateOutput, type ZoneType } from '../config/siteConfig';
import { applyTemplateToMap, downloadTemplateImages, zoneOptions } from '../export/templateExport';
import { useAppStore } from '../store/useAppStore';
import { Icon } from './components/Icon';
import { normalize } from '../domain/search';

const OUTPUT_LABELS: Record<TemplateOutput, string> = { carte: 'Carte dynamique', image: 'Image (PNG)', 'les-deux': 'Carte + image' };

/** Exports types : modèle (défini en admin) + zone → carte cadrée et/ou image. */
export function ExportTemplatesDialog({ onClose }: { onClose: () => void }) {
  const index = useAppStore((s) => s.index);
  const notify = useAppStore((s) => s.notify);
  const templates = siteConfig.exportTemplates;
  const [tplId, setTplId] = useState(templates[0]?.id);
  const tpl = templates.find((t) => t.id === tplId);
  const [zoneType, setZoneType] = useState<ZoneType | undefined>(tpl?.zoneTypes[0]);
  const [zones, setZones] = useState<string[]>([]);
  const [q, setQ] = useState('');
  /** Restriction par rattachement : « epci:CODE » ou « dep:35 ». */
  const [scope, setScope] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; label: string }>();
  const cancel = useRef({ cancelled: false });
  const [output, setOutput] = useState<TemplateOutput>(tpl?.output ?? 'les-deux');
  const [busy, setBusy] = useState(false);
  const dlg = useRef<HTMLDivElement>(null);
  usePopIn(dlg, 'scale');

  useEffect(() => {
    setZoneType(tpl?.zoneTypes[0]);
    setOutput(tpl?.output ?? 'les-deux');
    setZones([]);
    setScope('');
  }, [tplId]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo(() => (index && zoneType ? zoneOptions(index, zoneType) : []), [index, zoneType]);
  /** Rattachements proposés (EPCI, départements) pour les communes / résidences / EPCI. */
  const scopes = useMemo(() => {
    if (!index || !zoneType || zoneType === 'departement' || zoneType === 'agence') return [];
    const epcis = new Map<string, string>();
    const deps = new Set<string>();
    for (const o of options) {
      if (o.epci && zoneType !== 'epci') epcis.set(o.epci, index.categoryLabel('epci', o.epci));
      if (o.departement) deps.add(o.departement);
    }
    return [
      ...[...deps].sort().map((d) => ({ value: `dep:${d}`, label: `Département ${d}` })),
      ...[...epcis].sort((a, b) => a[1].localeCompare(b[1], 'fr')).map(([v, l]) => ({ value: `epci:${v}`, label: l })),
    ];
  }, [index, options, zoneType]);
  const inScope = useMemo(() => {
    if (!scope) return options;
    const [k, v] = scope.split(':');
    return options.filter((o) => (k === 'dep' ? o.departement === v : o.epci === v));
  }, [options, scope]);
  const filtered = useMemo(() => {
    const n = normalize(q);
    return inScope.filter((o) => !n || normalize(o.label).includes(n));
  }, [inScope, q]);
  const shown = filtered.slice(0, 150);
  const selected = new Set(zones);
  const toggle = (v: string) => setZones((z) => (z.includes(v) ? z.filter((x) => x !== v) : [...z, v]));
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.value));

  const run = async () => {
    if (!tpl || !zoneType || !zones.length) return;
    setBusy(true);
    cancel.current = { cancelled: false };
    try {
      let msg = zones.length > 1 ? `Carte cadrée sur ${zones.length} zones.` : 'Carte cadrée sur la zone.';
      if (output !== 'carte') {
        const r = await downloadTemplateImages(tpl, zoneType, zones, (done, total, label) => setProgress({ done, total, label }), cancel.current);
        msg = zones.length > 1 ? `${r.ok} image(s) générée(s) dans un ZIP.` : 'Image générée.';
        if (cancel.current.cancelled) msg = `Export interrompu : ${r.ok} image(s) générée(s).`;
        if (r.failed.length) msg += ` ${r.failed.length} zone(s) ignorée(s) (sans position) : ${r.failed.slice(0, 5).join(', ')}${r.failed.length > 5 ? '…' : ''}`;
      }
      if (output !== 'image') applyTemplateToMap(tpl, zoneType, zones);
      notify(msg, 'success');
      onClose();
    } catch (e) {
      console.error(e);
      notify('La génération a échoué (couche indisponible ou zone sans position).', 'error');
    } finally {
      setBusy(false);
      setProgress(undefined);
    }
  };

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div ref={dlg} className="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="tpl-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <header className="dialog-head">
          <h2 id="tpl-title">Exports types</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          {!templates.length && <p className="empty">Aucun modèle n’est configuré. Voir l’administration.</p>}
          <div className="field">
            <div className="field-label">1. Modèle</div>
            <div className="tpl-cards">
              {templates.map((t) => (
                <button key={t.id} type="button" className={`tpl-card ${t.id === tplId ? 'is-active' : ''}`} onClick={() => setTplId(t.id)} aria-pressed={t.id === tplId}>
                  <strong>{t.name}</strong>
                  <span className="muted small">{t.description}</span>
                  <span className="small tpl-meta">{t.zoneTypes.map((z) => ZONE_LABELS[z]).join(' · ')} — {t.width}×{t.height}</span>
                </button>
              ))}
            </div>
          </div>
          {tpl && (
            <>
              <div className="field">
                <div className="field-label">2. Zone</div>
                {tpl.zoneTypes.length > 1 && (
                  <div className="segmented" role="radiogroup" aria-label="Type de zone">
                    {tpl.zoneTypes.map((z) => (
                      <button key={z} type="button" role="radio" aria-checked={z === zoneType} className={z === zoneType ? 'is-active' : ''} onClick={() => { setZoneType(z); setZones([]); setScope(''); }}>
                        {ZONE_LABELS[z]}
                      </button>
                    ))}
                  </div>
                )}
                <div className="tpl-zone-tools">
                  {scopes.length > 0 && (
                    <select className="select" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Limiter à un territoire">
                      <option value="">Tout le territoire</option>
                      {scopes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                  <input className="input" placeholder={`Rechercher : ${zoneType ? ZONE_LABELS[zoneType].toLowerCase() : ''}…`} value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="tpl-zone-bar small">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      disabled={!filtered.length}
                      onChange={() => {
                        const vals = filtered.map((o) => o.value);
                        setZones((z) => (allFilteredSelected ? z.filter((x) => !vals.includes(x)) : [...new Set([...z, ...vals])]));
                      }}
                    />
                    Tout cocher ({filtered.length})
                  </label>
                  <span className="grow" />
                  <span className="muted">{zones.length} sélectionnée(s)</span>
                  {zones.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setZones([])}>Vider</button>}
                </div>
                <ul className="tpl-zones" role="listbox" aria-multiselectable="true">
                  {shown.map((o) => (
                    <li key={o.value}>
                      <button type="button" role="option" aria-selected={selected.has(o.value)} className={selected.has(o.value) ? 'is-selected' : ''} onClick={() => toggle(o.value)}>
                        <input type="checkbox" readOnly checked={selected.has(o.value)} tabIndex={-1} aria-hidden="true" />
                        <span className="grow">{o.label}</span>
                        <span className="muted small">{o.hint}</span>
                      </button>
                    </li>
                  ))}
                  {filtered.length > shown.length && <li className="dropdown-empty">+ {filtered.length - shown.length} autres (affinez la recherche ; « Tout cocher » les inclut)</li>}
                  {!filtered.length && <li className="dropdown-empty">Aucune zone</li>}
                </ul>
              </div>
              <div className="field">
                <div className="field-label">3. Résultat</div>
                <div className="segmented" role="radiogroup" aria-label="Résultat">
                  {(Object.keys(OUTPUT_LABELS) as TemplateOutput[]).map((o) => (
                    <button key={o} type="button" role="radio" aria-checked={o === output} className={o === output ? 'is-active' : ''} onClick={() => setOutput(o)}>
                      {OUTPUT_LABELS[o]}
                    </button>
                  ))}
                </div>
              </div>
              {output !== 'carte' && zones.length > 1 && (
                <p className="help">Une image par zone ({zones.length}), regroupées dans un fichier ZIP.{zones.length > 60 ? ' Comptez quelques secondes par image.' : ''}</p>
              )}
              {progress && (
                <div className="tpl-progress" aria-live="polite">
                  <div className="tpl-progress-bar"><span style={{ width: `${(100 * progress.done) / Math.max(1, progress.total)}%` }} /></div>
                  <span className="small muted">{progress.done} / {progress.total}{progress.label ? ` — ${progress.label}` : ''}</span>
                </div>
              )}
              <div className="tpl-actions">
                {busy && progress && progress.total > 1 && (
                  <button type="button" className="btn" onClick={() => (cancel.current.cancelled = true)}>Arrêter</button>
                )}
                <button type="button" className="btn btn-primary" disabled={!zones.length || busy} onClick={run}>
                  <Icon name={output === 'carte' ? 'pin' : 'download'} size={16} /> {busy ? 'Génération…' : zones.length > 1 && output !== 'carte' ? `Générer ${zones.length} images` : 'Générer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
