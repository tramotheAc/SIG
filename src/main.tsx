import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './theme/charte-jetons.css';
import './theme/charte-bandeau.css';
import './styles.css';

import { loadSiteConfig } from './config/siteConfig';

// La configuration du site (config/site.json ou brouillon admin) est appliquée AVANT de charger
// l'application : le store et les composants démarrent directement avec les bons réglages.
async function main() {
  await loadSiteConfig();
  const { default: App } = await import('./App');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void main();
