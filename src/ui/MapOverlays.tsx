import { useEffect, useState } from 'react';
import { levelForZoom } from '../map/patrimoineLayers';
import { useAppStore } from '../store/useAppStore';
import { ActiveFilters } from './ActiveFilters';
import { Icon } from './components/Icon';
import { Legend } from './Legend';
import { LEVEL_LABELS } from './panels/PatrimoinePanel';

/** Éléments superposés à la carte : filtres actifs, légende, niveau, chargement, notifications. */
export function MapOverlays() {
  const status = useAppStore((s) => s.status);
  const progress = useAppStore((s) => s.progress);
  const error = useAppStore((s) => s.error);
  const dataset = useAppStore((s) => s.dataset);
  const zoom = useAppStore((s) => s.zoom);
  const rep = useAppStore((s) => s.patrimoine.representation);
  const visible = useAppStore((s) => s.patrimoine.visible);
  const set = useAppStore((s) => s.set);
  const [legendOpen, setLegendOpen] = useState(true);
  const level = levelForZoom(zoom, rep);

  return (
    <>
      <div className="overlay-top">
        {dataset?.source.synthetic && (
          <div className="banner-synthetic" role="note">
            <Icon name="warning" size={14} /> Données de démonstration <strong>synthétiques</strong> — aucun patrimoine réel.
            <button type="button" className="link-btn" onClick={() => set({ showImport: true })}>Importer un fichier</button>
          </div>
        )}
        <ActiveFilters />
      </div>

      {status === 'ready' && visible && (
        <div className={`legend-float ${legendOpen ? '' : 'is-collapsed'}`}>
          <button type="button" className="legend-float-toggle" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen}>
            <Icon name={legendOpen ? 'chevronDown' : 'chevronRight'} size={14} />
            <span className="grow">Légende</span>
            <span className="muted small legend-level">{LEVEL_LABELS[level]}</span>
          </button>
          {legendOpen && <Legend compact />}
        </div>
      )}

      <div className="zoom-badge" aria-live="polite">Zoom {zoom.toFixed(1)} · {LEVEL_LABELS[level]}</div>

      {status === 'loading' && (
        <div className="loading-overlay" role="status">
          <div className="spinner" aria-hidden="true" />
          <div>{progress ?? 'Chargement…'}</div>
        </div>
      )}
      {status === 'error' && (
        <div className="loading-overlay" role="alert">
          <Icon name="warning" size={28} />
          <div><strong>{error?.message ?? 'Chargement impossible.'}</strong></div>
          <button type="button" className="btn btn-primary" onClick={() => set({ showImport: true })}>Importer un fichier Excel</button>
        </div>
      )}
      <Toast />
    </>
  );
}

function Toast() {
  const toast = useAppStore((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), toast.tone === 'error' ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || !visible) return null;
  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      {toast.message}
      <button type="button" className="icon-btn" aria-label="Fermer" onClick={() => setVisible(false)}><Icon name="close" size={14} /></button>
    </div>
  );
}
