import { useEffect, useMemo, useRef, useState } from 'react';
import { usePopIn } from './motion';
import { createPortal } from 'react-dom';
import { siteConfig, ZONE_LABELS, type TemplateOutput, type ZoneType } from '../config/siteConfig';
import { applyTemplateToMap, downloadTemplateImage, zoneOptions } from '../export/templateExport';
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
  const [zone, setZone] = useState<string>();
  const [q, setQ] = useState('');
  const [output, setOutput] = useState<TemplateOutput>(tpl?.output ?? 'les-deux');
  const [busy, setBusy] = useState(false);
  const dlg = useRef<HTMLDivElement>(null);
  usePopIn(dlg, 'scale');

  useEffect(() => {
    setZoneType(tpl?.zoneTypes[0]);
    setOutput(tpl?.output ?? 'les-deux');
    setZone(undefined);
  }, [tplId]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo(() => (index && zoneType ? zoneOptions(index, zoneType) : []), [index, zoneType]);
  const filtered = useMemo(() => {
    const n = normalize(q);
    return options.filter((o) => !n || normalize(o.label).includes(n)).slice(0, 80);
  }, [options, q]);

  const run = async () => {
    if (!tpl || !zoneType || !zone) return;
    setBusy(true);
    try {
      if (output !== 'carte') await downloadTemplateImage(tpl, zoneType, zone);
      if (output !== 'image') applyTemplateToMap(tpl, zoneType, zone);
      notify(output === 'carte' ? 'Carte cadrée sur la zone.' : 'Image générée.', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      notify('La génération a échoué (couche indisponible ou zone sans position).', 'error');
    } finally {
      setBusy(false);
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
                      <button key={z} type="button" role="radio" aria-checked={z === zoneType} className={z === zoneType ? 'is-active' : ''} onClick={() => { setZoneType(z); setZone(undefined); }}>
                        {ZONE_LABELS[z]}
                      </button>
                    ))}
                  </div>
                )}
                <input className="input" placeholder={`Rechercher : ${zoneType ? ZONE_LABELS[zoneType].toLowerCase() : ''}…`} value={q} onChange={(e) => setQ(e.target.value)} />
                <ul className="tpl-zones" role="listbox">
                  {filtered.map((o) => (
                    <li key={o.value}>
                      <button type="button" role="option" aria-selected={o.value === zone} className={o.value === zone ? 'is-selected' : ''} onClick={() => setZone(o.value)}>
                        <span className="grow">{o.label}</span>
                        <span className="muted small">{o.hint}</span>
                      </button>
                    </li>
                  ))}
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
              <div className="tpl-actions">
                <button type="button" className="btn btn-primary" disabled={!zone || busy} onClick={run}>
                  <Icon name={output === 'carte' ? 'pin' : 'download'} size={16} /> {busy ? 'Génération…' : 'Générer'}
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
