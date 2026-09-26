import { describe, expect, it } from 'vitest';
import { buildEmbedUrl } from '../src/ui/embed';

describe('Tableaux de bord intégrés', () => {
  it('remplace et encode les variables', () => {
    expect(buildEmbedUrl("https://app.powerbi.com/reportEmbed?r=1&filter=Patrimoine/Code eq '{code}'&c={commune}&x={inconnue}", { code: 'E00012', commune: 'Saint-Malo' })).toBe(
      "https://app.powerbi.com/reportEmbed?r=1&filter=Patrimoine/Code eq 'E00012'&c=Saint-Malo&x=",
    );
    expect(buildEmbedUrl('https://x/?n={nom}', { nom: 'Les Ajoncs & Co' })).toBe('https://x/?n=Les%20Ajoncs%20%26%20Co');
  });
});

describe('buildEmbedUrl — sécurité', () => {
  it('refuse les schémas non web', () => {
    expect(buildEmbedUrl('javascript:alert(1)', {})).toBe('about:blank');
    expect(buildEmbedUrl('data:text/html,x', {})).toBe('about:blank');
    expect(buildEmbedUrl('https://x/?id={id}', { id: 'a b' })).toBe('https://x/?id=a%20b');
  });
});
