import { describe, expect, it } from 'vitest';
import { imagesToPdf } from '../src/export/pdf';

describe('imagesToPdf', () => {
  it('produit un PDF multipage avec une table xref cohérente', async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const blob = imagesToPdf([{ jpeg, width: 200, height: 100 }, { jpeg, width: 100, height: 200 }], 'Test été');
    const text = new TextDecoder('latin1').decode(new Uint8Array(await blob.arrayBuffer()));
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/Count 2');
    expect(text).toContain('/Title (Test ete)');
    const xref = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(xref, xref + 4)).toBe('xref');
    // Chaque offset pointe bien sur « n 0 obj »
    const offs = [...text.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offs.forEach((o, i) => expect(text.slice(o, o + 10)).toContain(`${i + 1} 0 obj`));
  });
});
