import { useEffect } from 'react';
import { configuredProvider } from './data/configuredProvider';
import { MapView } from './map/MapView';
import { loadData } from './store/bootstrap';
import { DetailPanel } from './ui/DetailPanel';
import { Header } from './ui/Header';
import { useState } from 'react';
import { AdminPage } from './admin/AdminPage';
import { LeftPanel } from './ui/LeftPanel';
import { MapOverlays } from './ui/MapOverlays';
import { EmbedViewer } from './ui/EmbedViewer';
import { useAppStore } from './store/useAppStore';
import { applyView, viewFromLocation } from './store/viewState';

/**
 * Point d'entrée : le DataProvider est choisi ICI (et seulement ici).
 * Pour brancher les API du bailleur : remplacer ExcelDataProvider.demo() par un ApiDataProvider.
 */
const isAdmin = () => window.location.hash.startsWith('#/admin');

export default function App() {
  const [admin, setAdmin] = useState(isAdmin());
  useEffect(() => {
    const on = () => setAdmin(isAdmin());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  // Les données sont chargées une fois, partagées par la carte et la page admin.
  useEffect(() => {
    void loadData(configuredProvider());
  }, []);
  // Lien partagé (#v=…) : la vue est appliquée une fois les données prêtes.
  const ready = useAppStore((s) => s.status === 'ready');
  useEffect(() => {
    if (!ready || admin) return;
    const v = viewFromLocation();
    if (!v) return;
    applyView(v);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [ready, admin]);
  if (admin) return <AdminPage />;
  return (
    <div className="app">
      <Header />
      <main className="workspace">
        <LeftPanel />
        <div className="map-area">
          <MapView />
          <MapOverlays />
          <EmbedViewer />
        </div>
        <DetailPanel />
      </main>
    </div>
  );
}
