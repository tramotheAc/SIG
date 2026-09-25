import { useState } from 'react';
import { appConfig } from '../config/app.config';
import { siteConfig } from '../config/siteConfig';
import { exportExcel } from '../export/excelExport';
import { exportImage } from '../export/imageExport';
import { useAppStore } from '../store/useAppStore';
import { useFilteredView } from '../store/useFilteredView';
import { Icon } from './components/Icon';
import { SearchBox } from './SearchBox';

export function Header() {
  const notify = useAppStore((s) => s.notify);
  const view = useFilteredView();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setMenu(false);
    setBusy(true);
    try {
      await fn();
      notify(ok, 'success');
    } catch (e) {
      console.error(e);
      notify('L’export a échoué. Réessayez ou réduisez la sélection.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <div className="brand-name">{appConfig.appName}</div>
          <div className="brand-sub">Bretagne · Loire-Atlantique</div>
        </div>
      </div>
      <SearchBox />
      <div className="header-actions">
        {(siteConfig.ui.exportExcel || siteConfig.ui.exportImage) && <div className="menu-wrap">
          <button type="button" className="btn btn-primary" aria-haspopup="menu" aria-expanded={menu} disabled={!view || busy} onClick={() => setMenu(!menu)}>
            <Icon name="download" />
            <span className="hide-sm">{busy ? 'Export…' : 'Exporter'}</span>
          </button>
          {menu && view && (
            <div className="menu" role="menu" onMouseLeave={() => setMenu(false)}>
              {siteConfig.ui.exportExcel && <button type="button" role="menuitem" onClick={() => run(() => exportExcel(view), 'Fichier Excel généré.')}>
                <Icon name="table" />
                <span>
                  Données filtrées (Excel)
                  <small>{view.totals.residences.toLocaleString('fr-FR')} résidences · {view.totals.logements.toLocaleString('fr-FR')} logements</small>
                </span>
              </button>}
              {siteConfig.ui.exportImage && <button type="button" role="menuitem" onClick={() => run(() => exportImage(view), 'Image de la carte générée.')}>
                <Icon name="image" />
                <span>
                  Carte + légende (PNG)
                  <small>Vue actuelle, avec titre et légende</small>
                </span>
              </button>}
            </div>
          )}
        </div>}
        <a className="avatar" href="#/admin" title="Administration (experts)" aria-label="Administration" 
        >
          <Icon name="sliders" size={16} />
        </a>
      </div>
    </header>
  );
}
