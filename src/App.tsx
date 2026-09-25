import { useEffect } from 'react';
import { ExcelDataProvider } from './data/excel/ExcelDataProvider';
import { MapView } from './map/MapView';
import { loadData } from './store/bootstrap';
import { DetailPanel } from './ui/DetailPanel';
import { Header } from './ui/Header';
import { ImportDialog } from './ui/ImportDialog';
import { LeftPanel } from './ui/LeftPanel';
import { MapOverlays } from './ui/MapOverlays';

/**
 * Point d'entrée : le DataProvider est choisi ICI (et seulement ici).
 * Pour brancher les API du bailleur : remplacer ExcelDataProvider.demo() par un ApiDataProvider.
 */
export default function App() {
  useEffect(() => {
    void loadData(ExcelDataProvider.demo());
  }, []);
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
      <ImportDialog />
    </div>
  );
}
