/// <reference lib="webworker" />
/**
 * Web Worker : lecture + normalisation du fichier Excel hors du thread UI
 * (30 000 lignes ≈ quelques secondes de calcul qui ne doivent pas figer la carte).
 */
import { readXlsxFast } from './xlsxReader';
import { parseWorkbook } from './excelParser';

export type WorkerRequest = { buffer: ArrayBuffer };
export type WorkerResponse =
  | { type: 'progress'; step: string }
  | { type: 'done'; result: ReturnType<typeof parseWorkbook> }
  | { type: 'error'; message: string };

const post = (m: WorkerResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    post({ type: 'progress', step: 'Lecture du fichier…' });
    const wb = readXlsxFast(e.data.buffer);
    post({ type: 'progress', step: 'Contrôle et normalisation des données…' });
    const result = parseWorkbook(wb);
    post({ type: 'done', result });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
