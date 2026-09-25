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
  if (admin) return <AdminPage />;
  return (
    <div className="app">
      <Header />
      <main className="workspace">
        <LeftPanel />
        <div className="map-area">
          <MapView />
          <MapOverlays />
        </div>
        <DetailPanel />
      </main>
    </div>
  );
}
