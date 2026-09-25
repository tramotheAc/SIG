import { useRef, useState } from 'react';
import { excelMapping } from '../config/excel.mapping';
import { ExcelDataProvider } from '../data/excel/ExcelDataProvider';
import { loadData } from '../store/bootstrap';
import { useAppStore } from '../store/useAppStore';
import { Icon } from './components/Icon';
import { fmt } from './components/controls';

/** Source de données : état du jeu chargé, rapport de contrôle, import d'un nouveau fichier. */
export function ImportDialog() {
  const show = useAppStore((s) => s.showImport);
  const set = useAppStore((s) => s.set);
  const dataset = useAppStore((s) => s.dataset);
  const status = useAppStore((s) => s.status);
  const progress = useAppStore((s) => s.progress);
  const error = useAppStore((s) => s.error);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  if (!show) return null;

  const onFile = (f?: File) => {
    if (!f) return;
    void loadData(ExcelDataProvider.fromFile(f));
  };
  const close = () => set({ showImport: false });

  return (
    <div className="dialog-backdrop" onClick={close}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && close()}>
        <header className="dialog-head">
          <h2 id="import-title">Source de données</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Fermer"><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          {dataset && (
            <div className="source-card">
              <div className="source-title">
                <Icon name="database" /> {dataset.source.label}
                {dataset.source.synthetic && <span className="badge badge-warn">Synthétique</span>}
              </div>
              <div className="muted small">
                Chargé le {new Date(dataset.source.loadedAt).toLocaleString('fr-FR')}
                {dataset.source.dateActualisation && ` · données actualisées le ${String(dataset.source.dateActualisation).slice(0, 10)}`}
              </div>
              <div className="kpis">
                <div className="kpi"><span className="kpi-value">{fmt(dataset.agences.length)}</span><span className="kpi-label">agences</span></div>
                <div className="kpi"><span className="kpi-value">{fmt(dataset.residences.length)}</span><span className="kpi-label">résidences</span></div>
                <div className="kpi"><span className="kpi-value">{fmt(dataset.batiments.length)}</span><span className="kpi-label">bâtiments</span></div>
                <div className="kpi"><span className="kpi-value">{fmt(dataset.logements.length)}</span><span className="kpi-label">logements</span></div>
              </div>
              {dataset.issues.length > 0 && (
                <details className="issues" open={dataset.issues.some((i) => i.level === 'error')}>
                  <summary>Rapport de contrôle ({dataset.issues.length} point(s))</summary>
                  <ul>
                    {dataset.issues.map((i, k) => (
                      <li key={k} className={`issue issue-${i.level}`}>
                        <span className="issue-level">{i.level === 'error' ? 'Erreur' : i.level === 'warning' ? 'Attention' : 'Info'}</span>
                        <span>{i.message}{i.count && i.count > 1 ? ` (${fmt(i.count)} occurrences${i.context ? `, ex. ${i.context}` : ''})` : i.context ? ` (${i.context})` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {error && (
            <div className="notice notice-error" role="alert">
              <Icon name="warning" size={16} />
              <div>
                <strong>{error.message}</strong>
                {error.detail && <pre className="small">{error.detail}</pre>}
              </div>
            </div>
          )}

          <div
            className={`dropzone ${drag ? 'is-drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
          >
            <Icon name="upload" size={28} />
            <p><strong>Importer un fichier Excel (.xlsx)</strong><br /><span className="muted small">Glissez-déposez le fichier ici ou</span></p>
            <button type="button" className="btn btn-primary" disabled={status === 'loading'} onClick={() => input.current?.click()}>
              {status === 'loading' ? progress ?? 'Chargement…' : 'Choisir un fichier'}
            </button>
            <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />
            <p className="help">Le fichier est lu localement dans votre navigateur : il n’est envoyé à aucun serveur.</p>
          </div>

          <details className="format-help">
            <summary>Format attendu</summary>
            <p className="small">Feuilles reconnues (en-têtes en ligne 1) — correspondance avec le modèle :</p>
            <ul className="small">
              <li><strong>{excelMapping.organisation.sheets[0]}</strong> : niveau 1 = <em>agence</em></li>
              <li><strong>{excelMapping.patrimoine.sheets[0]}</strong> : niveau 1 = <em>ensemble résidentiel</em>, 2 = <em>adresse / bâtiment</em>, 3 = <em>cage d’escalier</em> (Latitude/Longitude en WGS84 ou Lambert-93)</li>
              <li><strong>{excelMapping.lot.sheets[0]}</strong> : <em>logements</em> (rattachés par ID_patrimoine ou par les codes patrimoine)</li>
              <li><strong>{excelMapping.client.sheets[0]}</strong> (facultatif) : occupation et conseiller social référent — les noms des locataires ne sont pas importés</li>
              <li><strong>{excelMapping.affectations.sheets[0]}</strong> (facultatif) : Code_patrimoine, Conseiller_commercial, Gerant_immobilier, Travailleur_social</li>
            </ul>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void loadData(ExcelDataProvider.demo())}>
              Recharger le jeu de démonstration
            </button>
          </details>
        </div>
      </div>
    </div>
  );
}
