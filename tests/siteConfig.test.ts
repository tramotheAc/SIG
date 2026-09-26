import { describe, expect, it } from 'vitest';
import { mergeConfig } from '../src/config/siteConfig';

describe('site.json', () => {
  it('convertit l’ancien format de tableaux de bord en bibliothèque', () => {
    const cfg = mergeConfig({ embeds: [{ kind: 'residence', enabled: true, label: 'Rapport', url: 'https://x/?c={code}', mode: 'onglet' }] } as never);
    expect(cfg.embedLibrary).toEqual([{ id: 'lien-residence', enabled: true, name: 'Rapport', description: '', url: 'https://x/?c={code}', mode: 'onglet', kinds: ['residence'], inMenu: false }]);
  });
  it('valeurs par défaut sans fichier', () => {
    const cfg = mergeConfig(undefined);
    expect(cfg.embedLibrary).toEqual([]);
    expect(cfg.customBasemaps).toEqual([]);
    expect(cfg.data.source).toBe('excel');
  });
});
