/**
 * Lecture des GetCapabilities WMTS / WMS pour proposer les couches disponibles et construire
 * automatiquement le modèle d'URL de tuiles compatible avec la carte (Web Mercator).
 */
export interface OgcLayer {
  id: string;
  title: string;
  /** Modèle d'URL prêt pour MapLibre. */
  url: string;
  warning?: string;
}

/** Les anciens services wxs.ign.fr sont fermés : redirection vers la Géoplateforme. */
export function modernizeIgnUrl(url: string): { url: string; changed: boolean } {
  const m = url.match(/^https?:\/\/wxs\.ign\.fr\/[^/]+\/geoportail\/(wmts|r\/wms|v\/wms)/i);
  if (!m) return { url, changed: false };
  const kind = m[1].toLowerCase();
  const base = kind === 'wmts' ? 'https://data.geopf.fr/wmts' : kind === 'r/wms' ? 'https://data.geopf.fr/wms-r/wms' : 'https://data.geopf.fr/wms-v/ows';
  const query = url.split('?')[1] ?? `SERVICE=${kind === 'wmts' ? 'WMTS' : 'WMS'}&REQUEST=GetCapabilities`;
  return { url: `${base}?${query}`, changed: true };
}

const text = (el: Element | null | undefined) => el?.textContent?.trim() ?? '';
/** Tous les éléments d'un nom local donné, quel que soit le préfixe d'espace de noms. */
const all = (doc: Document | Element, name: string) => [...doc.getElementsByTagName('*')].filter((e) => e.localName === name);

/** Diagnostic lisible quand un document ne contient pas de couche. */
export function describeResponse(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement?.localName ?? '?';
  if (root === 'parsererror' || doc.getElementsByTagName('parsererror').length) {
    const snippet = xml.replace(/\s+/g, ' ').slice(0, 160);
    return `La réponse n’est pas du XML (page de proxy ou d’erreur ?) : « ${snippet}… »`;
  }
  if (/Exception/i.test(root)) return `Le service renvoie une erreur : ${text(all(doc, 'ExceptionText')[0] ?? all(doc, 'ServiceException')[0] ?? doc.documentElement).slice(0, 200)}`;
  return `Document « ${root} » reçu, sans couche lisible. Vérifiez le type choisi (WMTS / WMS) et l’adresse.`;
}
const child = (el: Element, name: string) => [...el.children].find((c) => c.localName === name);
const children = (el: Element, name: string) => [...el.children].filter((c) => c.localName === name);

function baseUrl(capsUrl: string, doc: Document, service: 'WMTS' | 'WMS'): string {
  // URL de requête annoncée par le service (Operation GetTile / GetMap), sinon celle des capabilities.
  const xhref = (e?: Element) => e?.getAttribute('xlink:href') ?? e?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '';
  const op = all(doc, 'Operation').find((o) => o.getAttribute('name') === (service === 'WMTS' ? 'GetTile' : 'GetMap'));
  const href = op ? xhref(all(op, 'Get')[0]) : '';
  const getMap = all(doc, 'GetMap')[0];
  const fromDoc = service === 'WMS' && getMap ? xhref(all(getMap, 'OnlineResource')[0]) : '';
  return (href || fromDoc || capsUrl).split('?')[0];
}

export function parseWmts(xml: string, capsUrl: string): OgcLayer[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const base = baseUrl(capsUrl, doc, 'WMTS');
  const contents = all(doc, 'Contents')[0];
  if (!contents) return [];
  // Jeux de tuilage Web Mercator disponibles
  const sets = new Map<string, string>();
  for (const tms of children(contents, 'TileMatrixSet')) {
    const id = text(child(tms, 'Identifier'));
    const crs = text(child(tms, 'SupportedCRS'));
    const first = child(tms, 'TileMatrix');
    const firstId = first ? text(child(first, 'Identifier')) : '0';
    if (/3857|900913|GoogleMaps/i.test(crs + id)) sets.set(id, firstId.replace(/\d+$/, '')); // préfixe éventuel « EPSG:3857: »
  }
  const out: OgcLayer[] = [];
  for (const layer of children(contents, 'Layer')) {
    const id = text(child(layer, 'Identifier'));
    const title = text(child(layer, 'Title')) || id;
    const styles = children(layer, 'Style');
    const style = text(child(styles.find((s) => s.getAttribute('isDefault') === 'true') ?? styles[0] ?? layer, 'Identifier')) || 'normal';
    const format = text(child(layer, 'Format')) || 'image/png';
    const links = children(layer, 'TileMatrixSetLink').map((l) => text(child(l, 'TileMatrixSet')));
    const tms = links.find((l) => sets.has(l));
    if (!tms) {
      out.push({ id, title, url: '', warning: 'Pas de tuilage Web Mercator (EPSG:3857) : non affichable.' });
      continue;
    }
    const prefix = sets.get(tms) ?? '';
    const p = (k: string, v: string) => `${k}=${encodeURIComponent(v)}`;
    out.push({
      id,
      title,
      url: `${base}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&${p('LAYER', id)}&${p('STYLE', style)}&${p('FORMAT', format)}&${p('TILEMATRIXSET', tms)}&TILEMATRIX=${encodeURIComponent(prefix)}{z}&TILEROW={y}&TILECOL={x}`,
    });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}

export function parseWms(xml: string, capsUrl: string): OgcLayer[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const base = baseUrl(capsUrl, doc, 'WMS');
  const version = doc.documentElement.getAttribute('version') ?? '1.3.0';
  const crsParam = version.startsWith('1.3') ? 'CRS' : 'SRS';
  const out: OgcLayer[] = [];
  // Projections déclarées (héritées des couches parentes, cf. norme WMS)
  const crsOf = (layer: Element): string[] => {
    const own = [...layer.children].filter((c) => c.localName === 'CRS' || c.localName === 'SRS').flatMap((c) => text(c).split(/\s+/));
    const parent = layer.parentElement;
    return parent && parent.localName === 'Layer' ? [...own, ...crsOf(parent)] : own;
  };
  for (const layer of all(doc, 'Layer')) {
    const name = text(child(layer, 'Name'));
    if (!name) continue;
    const title = text(child(layer, 'Title')) || name;
    const crs = crsOf(layer).map((c) => c.toUpperCase());
    const epsg = crs.includes('EPSG:3857') || !crs.length ? 'EPSG:3857' : crs.includes('EPSG:900913') ? 'EPSG:900913' : crs.includes('EPSG:102100') ? 'EPSG:102100' : '';
    if (!epsg) {
      out.push({ id: name, title, url: '', warning: 'Projection Web Mercator non proposée par le service : non affichable.' });
      continue;
    }
    out.push({
      id: name,
      title,
      url: `${base}?SERVICE=WMS&REQUEST=GetMap&VERSION=${version}&LAYERS=${encodeURIComponent(name)}&STYLES=&FORMAT=image/png&TRANSPARENT=true&${crsParam}=${epsg}&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}
