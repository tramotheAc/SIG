/** Actions de navigation partagées (recherche, fiches, légende) : sélectionner + zoomer. */
import { appConfig } from '../config/app.config';
import type { EntityRef, GeoPoint } from '../domain/model';
import type { PatrimoineIndex } from '../domain/patrimoineIndex';
import { useAppStore } from './useAppStore';

function boundsOf(points: (GeoPoint | undefined)[]): [[number, number], [number, number]] | undefined {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  let count = 0;
  for (const p of points) {
    if (!p) continue;
    count++;
    w = Math.min(w, p.lon);
    e = Math.max(e, p.lon);
    s = Math.min(s, p.lat);
    n = Math.max(n, p.lat);
  }
  if (!count) return undefined;
  const pad = 0.002;
  return [[w - pad, s - pad], [e + pad, n + pad]];
}

export function locate(index: PatrimoineIndex, ref: EntityRef): { position?: GeoPoint; bounds?: [[number, number], [number, number]]; zoom?: number } {
  const z = appConfig.zoom;
  switch (ref.kind) {
    case 'residence': {
      const r = index.residences.get(ref.id);
      if (!r) return {};
      const b = boundsOf(r.batimentIds.map((id) => index.batiments.get(id)?.position));
      return b && r.batimentIds.length > 1 ? { bounds: b, zoom: z.flyToBatiment } : { position: r.position, zoom: z.flyToResidence };
    }
    case 'batiment':
      return { position: index.batiments.get(ref.id)?.position, zoom: z.flyToBatiment };
    case 'cage':
      return { position: index.cages.get(ref.id)?.position, zoom: z.flyToLogement };
    case 'logement':
      return { position: index.logements.get(ref.id)?.position, zoom: z.flyToLogement };
    case 'commune': {
      const pts = [...index.residences.values()].filter((r) => r.communeInsee === ref.id).map((r) => r.position);
      const b = boundsOf(pts);
      return b ? { bounds: b, zoom: 14 } : { position: index.communes.get(ref.id)?.centre, zoom: z.flyToCommune };
    }
    case 'epci': {
      const pts = [...index.residences.values()].filter((r) => index.epciOf(r.communeInsee).code === ref.id).map((r) => r.position);
      return { bounds: boundsOf(pts), zoom: 13 };
    }
    case 'agence': {
      const pts = [...index.residences.values()].filter((r) => r.agenceId === ref.id).map((r) => r.position);
      return { bounds: boundsOf(pts), zoom: 13 };
    }
    case 'adresse':
      return { position: ref.payload?.position as GeoPoint | undefined, zoom: 17.5 };
    default:
      return {};
  }
}

export function selectAndZoom(ref: EntityRef, zoom = true) {
  const s = useAppStore.getState();
  s.select(ref);
  if (!zoom || !s.index) return;
  const target = locate(s.index, ref);
  if (target.bounds || target.position) s.flyTo(target);
  else if (ref.kind !== 'qpv') s.notify('Cet objet n’a pas de position connue sur la carte.', 'info');
}
