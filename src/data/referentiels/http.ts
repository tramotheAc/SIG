import { appConfig } from '../../config/app.config';

/** Erreur réseau « propre » : message utilisateur + détail technique (console uniquement). */
export class ServiceError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly detail?: string,
    public readonly status?: number,
  ) {
    super(userMessage);
  }
}

const cache = new Map<string, Promise<unknown>>();

/** GET avec timeout et cache mémoire de session (les référentiels changent au plus annuellement). */
export function fetchCached<T>(url: string, parse: 'json' | 'text' = 'json', useCache = true): Promise<T> {
  if (useCache && cache.has(url)) return cache.get(url) as Promise<T>;
  const p = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), appConfig.services.timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.status === 404) throw new ServiceError('Données non disponibles.', url, 404);
      if (!res.ok) throw new ServiceError('Le service ne répond pas correctement.', `${res.status} ${url}`, res.status);
      // Serveur statique avec repli SPA : un fichier absent renvoie index.html.
      if (parse === 'json' && (res.headers.get('content-type') ?? '').includes('text/html')) {
        throw new ServiceError('Données non disponibles.', `HTML reçu pour ${url}`, 404);
      }
      return (parse === 'json' ? await res.json() : await res.text()) as T;
    } catch (e) {
      if (e instanceof ServiceError) throw e;
      throw new ServiceError(
        ctrl.signal.aborted ? 'Le service met trop de temps à répondre.' : 'Service injoignable (réseau indisponible ?).',
        String(e),
      );
    } finally {
      clearTimeout(timer);
    }
  })();
  if (useCache) {
    cache.set(url, p);
    p.catch(() => cache.delete(url)); // pas de mise en cache des échecs
  }
  return p;
}
