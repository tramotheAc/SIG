import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { readXlsxFast } from '../src/data/excel/xlsxReader';
import { parseWorkbook } from '../src/data/excel/excelParser';

describe('readXlsxFast', () => {
  it('lit chaînes partagées, nombres, booléens, cellules vides et entités XML', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Test & Co');
    ws.addRow(['A', 'B', 'C']);
    ws.addRow(['x < y & "z"', 42.5, true]);
    ws.addRow([null, null, 'fin']);
    const buf = await wb.xlsx.writeBuffer();
    const out = readXlsxFast(buf as ArrayBuffer);
    expect(Object.keys(out)).toEqual(['Test & Co']);
    expect(out['Test & Co'][1]).toEqual(['x < y & "z"', 42.5, true]);
    expect(out['Test & Co'][2][2]).toBe('fin');
    expect(out['Test & Co'][2][0]).toBeUndefined();
  });

  it('rejette un fichier non ZIP', () => {
    expect(() => readXlsxFast(new TextEncoder().encode('pas un xlsx').buffer as ArrayBuffer)).toThrow();
  });

  it('charge le jeu de démonstration (volumétrie cible)', () => {
    const buf = readFileSync('public/demo/patrimoine_demo.xlsx');
    const t = performance.now();
    const ds = parseWorkbook(readXlsxFast(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer));
    const ms = performance.now() - t;
    expect(ds.agences).toHaveLength(10);
    expect(ds.residences.length).toBeGreaterThan(7000);
    expect(ds.batiments.length).toBeGreaterThan(11000);
    expect(ds.logements.length).toBeGreaterThanOrEqual(20000);
    expect(ds.logements.length).toBeLessThanOrEqual(30000);
    expect(ds.issues.filter((i) => i.level !== 'info')).toEqual([]);
    expect(ms).toBeLessThan(15000);
  }, 30000);
});
