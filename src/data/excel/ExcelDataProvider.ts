import { appConfig } from '../../config/app.config';
import { siteConfig } from '../../config/siteConfig';
import type { PatrimoineDataset } from '../../domain/model';
import { DataSourceError, type DataProvider, type LoadOptions } from '../DataProvider';
import type { WorkerResponse } from './excel.worker';

type Input = { kind: 'url'; url: string; label: string; synthetic: boolean } | { kind: 'file'; file: File };

/**
 * DataProvider Excel (POC) : fichier au format des tables DWH (Organisation, Patrimoine, Lot, Client).
 * Le mapping colonnes → modèle est défini dans config/excel.mapping.ts.
 */
export class ExcelDataProvider implements DataProvider {
  readonly id = 'excel';
  readonly label: string;

  constructor(private readonly input: Input) {
    this.label = input.kind === 'url' ? input.label : input.file.name;
  }

  static fromFile(file: File) {
    return new ExcelDataProvider({ kind: 'file', file });
  }
  static demo() {
    return new ExcelDataProvider({
      kind: 'url',
      url: siteConfig.data.excelUrl,
      label: siteConfig.data.label,
      synthetic: siteConfig.data.synthetic,
    });
  }

  async load(options: LoadOptions = {}): Promise<PatrimoineDataset> {
    const buffer = await this.readBuffer(options);
    options.onProgress?.('Lecture du fichier…');
    const result = await runWorker(buffer, options);
    if (result.issues.some((i) => i.level === 'error') && result.residences.length === 0) {
      throw new DataSourceError(
        'Le fichier ne contient pas de données exploitables.',
        result.issues.filter((i) => i.level === 'error').map((i) => i.message).join('\n'),
      );
    }
    const synthetic = this.input.kind === 'url' ? this.input.synthetic : false;
    return {
      ...result,
      source: {
        kind: 'excel',
        label: this.label,
        loadedAt: new Date().toISOString(),
        synthetic,
        dateActualisation: result.dateActualisation,
      },
    };
  }

  private async readBuffer(options: LoadOptions): Promise<ArrayBuffer> {
    if (this.input.kind === 'file') {
      const f = this.input.file;
      if (!/\.xlsx$/i.test(f.name)) {
        throw new DataSourceError('Format non pris en charge : merci de fournir un fichier Excel .xlsx.');
      }
      if (f.size > appConfig.maxImportSizeMb * 1024 * 1024) {
        throw new DataSourceError(`Fichier trop volumineux (maximum ${appConfig.maxImportSizeMb} Mo).`);
      }
      const buf = await f.arrayBuffer();
      // Signature ZIP « PK » : un .xlsx est une archive ZIP.
      const sig = new Uint8Array(buf.slice(0, 2));
      if (sig[0] !== 0x50 || sig[1] !== 0x4b) {
        throw new DataSourceError('Le fichier ne semble pas être un classeur Excel valide.');
      }
      return buf;
    }
    options.onProgress?.('Téléchargement des données…');
    let res: Response;
    try {
      res = await fetch(this.input.url, { signal: options.signal });
    } catch {
      throw new DataSourceError('Impossible de récupérer le fichier de données (réseau indisponible).');
    }
    if (!res.ok) throw new DataSourceError('Le fichier de données est introuvable sur le serveur.', `HTTP ${res.status}`);
    return res.arrayBuffer();
  }
}

function runWorker(buffer: ArrayBuffer, options: LoadOptions) {
  return new Promise<Extract<WorkerResponse, { type: 'done' }>['result']>((resolve, reject) => {
    const worker = new Worker(new URL('./excel.worker.ts', import.meta.url), { type: 'module' });
    const stop = () => worker.terminate();
    options.signal?.addEventListener('abort', () => {
      stop();
      reject(new DataSourceError('Chargement annulé.'));
    });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const m = e.data;
      if (m.type === 'progress') options.onProgress?.(m.step);
      else if (m.type === 'done') {
        stop();
        resolve(m.result);
      } else {
        stop();
        reject(new DataSourceError('Le fichier Excel n’a pas pu être lu. Vérifiez qu’il n’est pas corrompu ou protégé.', m.message));
      }
    };
    worker.onerror = (e) => {
      stop();
      reject(new DataSourceError('Erreur inattendue pendant la lecture du fichier.', e.message));
    };
    worker.postMessage({ buffer }, [buffer]);
  });
}
