/**
 * Croisement du patrimoine avec les référentiels territoriaux :
 * EPCI (via la commune), QPV (inclusion + distance), zonages APL et ABC (via le code INSEE).
 */
import type { Batiment, Commune, GeoContext, Residence } from '../domain/model';
import { nearestPolygon, type PreparedPolygon } from './spatial';

export interface Referentiels {
  communes: Map<string, Commune>;
  qpv?: PreparedPolygon[];
  apl?: Map<string, string>;
  pinel?: Map<string, string>;
}

/** Distance maximale de recherche du QPV le plus proche (m). */
const QPV_SEARCH_M = 3000;

export function computeGeoContexts(objects: (Residence | Batiment)[], ref: Referentiels): Map<string, GeoContext> {
  const out = new Map<string, GeoContext>();
  for (const o of objects) {
    const c = o.communeInsee ? ref.communes.get(o.communeInsee) : undefined;
    const ctx: GeoContext = {
      epciCode: c?.epciCode,
      epciNom: c?.epciNom,
      zoneApl: o.communeInsee ? ref.apl?.get(o.communeInsee) : undefined,
      zonePinel: o.communeInsee ? ref.pinel?.get(o.communeInsee) : undefined,
    };
    if (ref.qpv && o.position) {
      const near = nearestPolygon(o.position, ref.qpv, QPV_SEARCH_M);
      if (near) {
        ctx.distanceQpvM = Math.round(near.distance);
        ctx.qpvProcheCode = near.poly.id;
        ctx.qpvProcheNom = near.poly.nom;
        if (near.distance === 0) {
          ctx.qpvCode = near.poly.id;
          ctx.qpvNom = near.poly.nom;
        }
      } else {
        ctx.distanceQpvM = Infinity; // > QPV_SEARCH_M
      }
    }
    out.set(o.id, ctx);
  }
  return out;
}
