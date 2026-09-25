import { siteConfig } from '../config/siteConfig';
import { DabDataProvider } from './api/DabDataProvider';
import type { DataProvider } from './DataProvider';
import { ExcelDataProvider } from './excel/ExcelDataProvider';

/** Source de données choisie dans l'administration (Excel ou API). Seul point de choix du provider. */
export function configuredProvider(cfg = siteConfig): DataProvider {
  return cfg.data.source === 'api' ? new DabDataProvider(cfg.data.api, cfg.data.label) : ExcelDataProvider.demo();
}
