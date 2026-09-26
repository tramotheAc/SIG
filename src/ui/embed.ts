/** Construction de l'adresse d'une page intégrée (ex. Power BI filtré) pour l'objet sélectionné. */
import { siteConfig, type EmbedKind, type EmbedLink } from '../config/siteConfig';
import type { EntityRef } from '../domain/model';
import type { PatrimoineIndex } from '../domain/patrimoineIndex';

/** Liens de la bibliothèque proposés sur la fiche d'un type d'objet. */
export function embedsFor(kind: string): EmbedLink[] {
  return siteConfig.embedLibrary.filter((e) => e.enabled && e.url.trim() && e.kinds.includes(kind as EmbedKind));
}

/** Liens du menu général (en-tête). */
export function menuEmbeds(): EmbedLink[] {
  return siteConfig.embedLibrary.filter((e) => e.enabled && e.url.trim() && e.inMenu);
}

/** Valeurs disponibles pour les variables de l'adresse. */
export function entityValues(index: PatrimoineIndex, ref: EntityRef): Record<string, string> {
  const v: Record<string, string | undefined> = { id: ref.id };
  const area = (insee?: string) => {
    const e = index.epciOf(insee);
    v.insee = insee;
    v.commune = insee ? (index.communes.get(insee)?.nom ?? undefined) : undefined;
    v.epci = e.code;
    v.epciNom = e.nom;
    v.departement = insee?.slice(0, 2);
  };
  const ag = (id?: string) => {
    v.agence = id;
    v.agenceNom = index.agenceNom(id);
  };
  if (ref.kind === 'residence') {
    const r = index.residences.get(ref.id);
    Object.assign(v, { code: r?.code, nom: r?.nom });
    area(r?.communeInsee);
    ag(r?.agenceId);
  } else if (ref.kind === 'batiment') {
    const b = index.batiments.get(ref.id);
    Object.assign(v, { code: b?.code, nom: b?.adresse ?? b?.libelle });
    area(b?.communeInsee);
    ag(b?.agenceId);
  } else if (ref.kind === 'logement') {
    const l = index.logements.get(ref.id);
    Object.assign(v, { code: l?.code, nom: l?.code, rpls: l?.rpls });
    area(l?.communeInsee);
    ag(l?.agenceId);
  } else if (ref.kind === 'commune') {
    area(ref.id);
    Object.assign(v, { code: ref.id, nom: v.commune });
  } else if (ref.kind === 'epci') {
    const c = [...index.communes.values()].find((x) => x.epciCode === ref.id);
    Object.assign(v, { code: ref.id, nom: c?.epciNom, epci: ref.id, epciNom: c?.epciNom });
  } else if (ref.kind === 'agence') {
    const a = index.agences.get(ref.id);
    Object.assign(v, { code: a?.code, nom: a?.nom });
    ag(ref.id);
  } else if (ref.kind === 'qpv') {
    Object.assign(v, { code: ref.id, nom: String(ref.payload?.nom ?? '') });
  }
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) if (val) out[k] = val;
  return out;
}

/** Remplace {variable} par sa valeur encodée pour une URL (vide si inconnue). */
export function buildEmbedUrl(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(values[k] ?? ''));
}
