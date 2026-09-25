/**
 * Transformation PURE d'un classeur (feuilles → lignes) en modèle métier normalisé.
 * Aucune dépendance au navigateur ni à la librairie de lecture Excel : testable unitairement.
 */
import { excelMapping, TRUE_VALUES, type SheetKey, type SheetMapping } from '../../config/excel.mapping';
import type {
  Agence,
  Batiment,
  Cage,
  DataIssue,
  Logement,
  PatrimoineDataset,
  Residence,
  Responsables,
} from '../../domain/model';
import { centroid, parseNumber, toWgs84 } from './coordinates';

/** Classeur brut : nom de feuille → lignes (la première ligne contient les en-têtes). */
export type RawWorkbook = Record<string, unknown[][]>;

type Row = Record<string, unknown>;

export const normalizeKey = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Collecteur d'anomalies regroupées par message (évite 10 000 lignes identiques). */
class IssueCollector {
  private map = new Map<string, DataIssue>();
  add(level: DataIssue['level'], message: string, context?: string) {
    const key = `${level}|${message}`;
    const ex = this.map.get(key);
    if (ex) {
      ex.count = (ex.count ?? 1) + 1;
    } else {
      this.map.set(key, { level, message, context, count: 1 });
    }
  }
  list(): DataIssue[] {
    const order = { error: 0, warning: 1, info: 2 };
    return [...this.map.values()].sort((a, b) => order[a.level] - order[b.level]);
  }
}

function findSheet(wb: RawWorkbook, mapping: SheetMapping): string | undefined {
  const names = Object.keys(wb);
  for (const candidate of mapping.sheets) {
    const found = names.find((n) => normalizeKey(n) === normalizeKey(candidate));
    if (found) return found;
  }
  return undefined;
}

/** Lit une feuille selon son mapping ; retourne des objets indexés par champ interne. */
export function readSheet(
  wb: RawWorkbook,
  key: SheetKey,
  issues: IssueCollector,
): { rows: Row[]; present: boolean; missingColumns: string[] } {
  const mapping: SheetMapping = excelMapping[key];
  const sheetName = findSheet(wb, mapping);
  if (!sheetName) {
    if (!mapping.optional) issues.add('error', `Feuille « ${mapping.sheets[0]} » introuvable dans le fichier.`);
    else if (key !== 'affectations') issues.add('info', `Feuille « ${mapping.sheets[0]} » absente : informations correspondantes non disponibles.`);
    return { rows: [], present: false, missingColumns: [] };
  }
  const data = wb[sheetName];
  const header = (data[0] ?? []).map((h) => normalizeKey(String(h ?? '')));
  const colIndex: Record<string, number> = {};
  const missingColumns: string[] = [];
  for (const [field, aliases] of Object.entries(mapping.columns)) {
    const idx = aliases.map((a) => header.indexOf(normalizeKey(a))).find((i) => i >= 0);
    if (idx === undefined) missingColumns.push(field);
    else colIndex[field] = idx;
  }
  const missingRequired = mapping.required.filter((f) => colIndex[f] === undefined);
  if (missingRequired.length) {
    const labels = missingRequired.map((f) => mapping.columns[f][0]).join(', ');
    issues.add('error', `Feuille « ${sheetName} » : colonne(s) obligatoire(s) manquante(s) : ${labels}.`);
    return { rows: [], present: true, missingColumns };
  }
  const optionalMissing = missingColumns.filter((f) => !mapping.required.includes(f));
  if (optionalMissing.length) {
    issues.add(
      'info',
      `Feuille « ${sheetName} » : colonnes absentes (champs non renseignés) : ${optionalMissing
        .map((f) => mapping.columns[f][0])
        .join(', ')}.`,
    );
  }
  const rows: Row[] = [];
  for (let r = 1; r < data.length; r++) {
    const line = data[r];
    if (!line || line.every((c) => c === null || c === undefined || c === '')) continue;
    const obj: Row = {};
    for (const [field, idx] of Object.entries(colIndex)) obj[field] = line[idx];
    obj.__row = r + 1;
    rows.push(obj);
  }
  if (rows.length === 0) issues.add('warning', `Feuille « ${sheetName} » : aucune ligne de données.`);
  return { rows, present: true, missingColumns };
}

export function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'null' || s === '#N/A' ? undefined : s;
}
/** Date → AAAA-MM-JJ. Accepte Date, texte ISO/JJ/MM/AAAA ou numéro de série Excel. */
export function dateStr(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 59 && v < 80000) {
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = str(v);
  if (!s) return undefined;
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  return s.slice(0, 10);
}
const bool = (v: unknown) => {
  const s = str(v);
  return s ? TRUE_VALUES.includes(s.toLowerCase()) : false;
};
const intStr = (v: unknown) => {
  const n = parseNumber(v);
  return n === undefined ? str(v) : String(Math.trunc(n));
};
/** Code INSEE sur 5 caractères (les zéros de tête sont perdus quand Excel stocke un nombre). */
export function normInsee(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  if (/^\d{4}$/.test(s)) return `0${s}`;
  return /^[0-9][0-9AB]\d{3}$/i.test(s) ? s.toUpperCase() : undefined;
}

function mergeResp(target: Responsables, src: Responsables) {
  for (const k of Object.keys(src) as (keyof Responsables)[]) if (src[k] && !target[k]) target[k] = src[k];
}

export interface ParseResult extends Omit<PatrimoineDataset, 'source'> {
  dateActualisation?: string;
}

/**
 * Construit le jeu de données normalisé.
 * Règles :
 *  - lignes annulées ou hors validité exclues ;
 *  - rattachement hiérarchique par codes (N1 → N1|N2 → N1|N2|N3) ;
 *  - positions héritées/dérivées lorsque manquantes (cage ← bâtiment ← résidence, résidence ← centroïde) ;
 *  - valeurs manquantes conservées `undefined` (jamais de valeur inventée).
 */
export function parseWorkbook(wb: RawWorkbook): ParseResult {
  const issues = new IssueCollector();
  const today = new Date().toISOString().slice(0, 10);

  /* ---------- Organisation → agences ---------- */
  const org = readSheet(wb, 'organisation', issues);
  const agences = new Map<string, Agence>();
  const orgIdToAgence = new Map<string, string>();
  const orgN1Label = new Map<string, string>();
  let dateActualisation: string | undefined;
  for (const r of org.rows) {
    const niveau = intStr(r.niveau);
    const codeN1 = str(r.codeN1);
    const id = str(r.id);
    if (!codeN1) continue;
    if (id) orgIdToAgence.set(id, codeN1);
    dateActualisation ??= dateStr(r.dateActualisation);
    if (niveau === '1') {
      if (str(r.valide) !== undefined && !bool(r.valide)) continue;
      orgN1Label.set(codeN1, str(r.libelle) ?? codeN1);
      agences.set(codeN1, { id: codeN1, code: codeN1, nom: str(r.libelle) ?? codeN1, adresse: str(r.adresse) });
    }
  }

  /* ---------- Affectations (optionnel) ---------- */
  const aff = readSheet(wb, 'affectations', issues);
  const affByCode = new Map<string, Responsables>();
  for (const r of aff.rows) {
    const code = str(r.codePatrimoine);
    if (!code) continue;
    affByCode.set(code, {
      conseillerCommercial: str(r.conseillerCommercial),
      gerantImmobilier: str(r.gerantImmobilier),
      conseillerSocial: str(r.conseillerSocial),
      travailleurSocial: str(r.travailleurSocial),
    });
  }

  /* ---------- Patrimoine ---------- */
  const pat = readSheet(wb, 'patrimoine', issues);
  const residences = new Map<string, Residence>();
  const batiments = new Map<string, Batiment>();
  const cages = new Map<string, Cage>();
  const resByCode = new Map<string, Residence>();
  const batByCode = new Map<string, Batiment>();
  const cageByCode = new Map<string, Cage>();
  const byPatId = new Map<string, { kind: 'residence' | 'batiment' | 'cage'; id: string }>();

  const agenceOf = (r: Row): string | undefined => {
    const orgId = str(r.organisationId);
    let code = (orgId && orgIdToAgence.get(orgId)) || str(r.orgN1);
    if (!code) return undefined;
    if (!agences.has(code)) {
      agences.set(code, { id: code, code, nom: orgN1Label.get(code) ?? str(r.orgLibelle) ?? code });
    }
    return code;
  };

  // Tri par niveau pour garantir que les parents existent avant les enfants.
  const patRows = [...pat.rows].sort((a, b) => Number(intStr(a.niveau) ?? 9) - Number(intStr(b.niveau) ?? 9));
  for (const r of patRows) {
    const id = str(r.id);
    const niveau = intStr(r.niveau);
    const n1 = str(r.codeN1);
    const ctx = `ligne ${r.__row}`;
    if (!id || !n1) {
      issues.add('warning', 'Patrimoine : ligne sans identifiant ou sans code ensemble — ignorée.', ctx);
      continue;
    }
    if (bool(r.annule)) continue;
    const fin = dateStr(r.dateFinValidite);
    if (fin && /^\d{4}-\d{2}-\d{2}/.test(fin) && fin < today) continue;
    dateActualisation ??= dateStr(r.dateActualisation);

    const { point, issue } = toWgs84(r.latitude, r.longitude);
    if (issue) issues.add('warning', `Patrimoine : ${issue} — position ignorée.`, ctx);
    const insee = normInsee(r.insee);
    if (str(r.insee) && !insee) issues.add('warning', 'Patrimoine : code INSEE invalide.', ctx);
    const common = {
      communeInsee: insee,
      communeNom: str(r.commune),
      codePostal: intStr(r.codePostal)?.padStart(5, '0'),
    };
    const affectation = affByCode.get(id) ?? {};
    const n2 = str(r.codeN2);
    const n3 = str(r.codeN3);

    if (niveau === '1') {
      const res: Residence = {
        id,
        code: n1,
        nom: str(r.libelle) ?? n1,
        agenceId: agenceOf(r),
        position: point,
        positionSource: point ? 'source' : 'absente',
        adresse: str(r.adresseComplete) ?? str(r.adresse),
        ...common,
        departement: str(r.departement) ?? insee?.slice(0, 2),
        quartier: str(r.quartier),
        dateConstruction: dateStr(r.dateConstruction),
        modeAcquisition: str(r.modeAcquisition),
        lienFiche: str(r.lienFiche),
        batimentIds: [],
        nbLogements: 0,
        responsables: { ...(affByCode.get(n1) ?? {}), ...stripEmpty(affectation) },
      };
      residences.set(id, res);
      resByCode.set(n1, res);
      byPatId.set(id, { kind: 'residence', id });
    } else if (niveau === '2') {
      const parent = resByCode.get(n1);
      if (!parent) issues.add('warning', 'Patrimoine : adresse sans ensemble résidentiel parent.', ctx);
      const bat: Batiment = {
        id,
        code: `${n1}/${n2 ?? id}`,
        residenceId: parent?.id,
        libelle: str(r.libelle) ?? str(r.adresse) ?? id,
        adresse: str(r.adresseComplete) ?? str(r.adresse),
        agenceId: agenceOf(r) ?? parent?.agenceId,
        position: point,
        positionSource: point ? 'source' : 'absente',
        ...common,
        cageIds: [],
        logementIds: [],
        nbLogements: 0,
        responsables: stripEmpty(affectation),
      };
      if (!bat.communeInsee && parent) {
        bat.communeInsee = parent.communeInsee;
        bat.communeNom = parent.communeNom;
      }
      batiments.set(id, bat);
      batByCode.set(`${n1}|${n2}`, bat);
      parent?.batimentIds.push(id);
      byPatId.set(id, { kind: 'batiment', id });
    } else if (niveau === '3') {
      const parentBat = batByCode.get(`${n1}|${n2}`);
      if (!parentBat) issues.add('warning', 'Patrimoine : cage sans adresse parente.', ctx);
      const cage: Cage = {
        id,
        code: `${n1}/${n2 ?? ''}/${n3 ?? id}`,
        libelle: str(r.libelle) ?? `Cage ${n3 ?? ''}`,
        batimentId: parentBat?.id,
        residenceId: parentBat?.residenceId ?? resByCode.get(n1)?.id,
        position: point,
        positionSource: point ? 'source' : 'absente',
        logementIds: [],
      };
      cages.set(id, cage);
      cageByCode.set(`${n1}|${n2}|${n3}`, cage);
      parentBat?.cageIds.push(id);
      byPatId.set(id, { kind: 'cage', id });
    } else {
      issues.add('warning', `Patrimoine : niveau « ${str(r.niveau) ?? '?'} » non géré — ligne ignorée.`, ctx);
    }
  }

  /* ---------- Client (optionnel) : occupation + CSR référent ---------- */
  const cli = readSheet(wb, 'client', issues);
  const clientByLot = new Map<string, { occupe: boolean; csr?: string }>();
  for (const r of cli.rows) {
    const k = str(r.idClientLot);
    if (!k) continue;
    const fin = dateStr(r.dateFinOccupation);
    const present = str(r.presence) !== undefined ? bool(r.presence) : !fin || fin >= today;
    const prev = clientByLot.get(k);
    if (!prev || present) clientByLot.set(k, { occupe: present, csr: str(r.conseillerSocial) ?? prev?.csr });
  }

  /* ---------- Lots → logements ---------- */
  const lot = readSheet(wb, 'lot', issues);
  const logements = new Map<string, Logement>();
  for (const r of lot.rows) {
    const id = str(r.idLot);
    if (!id) {
      issues.add('warning', 'Lot : ligne sans ID_lot — ignorée.', `ligne ${r.__row}`);
      continue;
    }
    if (bool(r.finGestion)) continue;
    const existing = logements.get(id);
    const client = clientByLot.get(str(r.idClientLot) ?? '');
    if (existing) {
      // Une ligne par couple client/lot : on fusionne l'occupation.
      if (client?.occupe) existing.occupe = true;
      if (client?.csr) existing.responsables.conseillerSocial ??= client.csr;
      continue;
    }
    // Rattachement : ID_patrimoine prioritaire, sinon codes hiérarchiques.
    const link = byPatId.get(str(r.patrimoineId) ?? '');
    const n1 = str(r.codeN1);
    const n2 = str(r.codeN2);
    const n3 = str(r.codeN3);
    let cage: Cage | undefined;
    let bat: Batiment | undefined;
    let res: Residence | undefined;
    if (link?.kind === 'cage') cage = cages.get(link.id);
    else if (link?.kind === 'batiment') bat = batiments.get(link.id);
    else if (link?.kind === 'residence') res = residences.get(link.id);
    else {
      cage = cageByCode.get(`${n1}|${n2}|${n3}`);
      bat = batByCode.get(`${n1}|${n2}`);
      res = n1 ? resByCode.get(n1) : undefined;
    }
    bat ??= cage?.batimentId ? batiments.get(cage.batimentId) : undefined;
    res ??= bat?.residenceId ? residences.get(bat.residenceId) : cage?.residenceId ? residences.get(cage.residenceId) : undefined;
    if (!res) issues.add('warning', 'Lot : logement non rattaché à un ensemble résidentiel connu.', `ligne ${r.__row}`);

    const lg: Logement = {
      id,
      code: str(r.codeLot) ?? id,
      rpls: str(r.rpls),
      cageId: cage?.id,
      batimentId: bat?.id,
      residenceId: res?.id,
      agenceId: bat?.agenceId ?? res?.agenceId,
      communeInsee: bat?.communeInsee ?? res?.communeInsee,
      communeNom: bat?.communeNom ?? res?.communeNom,
      adresse: bat?.adresse ?? res?.adresse,
      positionSource: 'absente',
      etage: str(r.etage),
      porte: str(r.porte),
      usage: str(r.usage),
      nature: str(r.nature),
      typeLot: str(r.typeLot),
      individuelCollectif: str(r.individuelCollectif),
      financement: str(r.financement),
      surfaceHabitable: parseNumber(r.surface),
      nbChambres: parseNumber(r.chambres),
      etat: str(r.etat),
      lienFiche: str(r.lienFiche),
      occupe: client?.occupe,
      responsables: { conseillerSocial: client?.csr },
    };
    logements.set(id, lg);
    cage?.logementIds.push(id);
    bat?.logementIds.push(id);
  }

  /* ---------- Consolidation : positions, compteurs, héritage des rôles ---------- */
  for (const c of cages.values()) {
    const b = c.batimentId ? batiments.get(c.batimentId) : undefined;
    if (!c.position && b?.position) {
      c.position = b.position;
      c.positionSource = 'derivee';
    }
  }
  for (const b of batiments.values()) {
    if (!b.position) {
      b.position = centroid(b.cageIds.map((id) => cages.get(id)?.position));
      if (b.position) b.positionSource = 'derivee';
    }
    for (const cid of b.cageIds) {
      const c = cages.get(cid);
      if (c && !c.position && b.position) {
        c.position = b.position;
        c.positionSource = 'derivee';
      }
    }
    b.nbLogements = b.logementIds.length;
  }
  let resNoPos = 0;
  for (const res of residences.values()) {
    const bats = res.batimentIds.map((id) => batiments.get(id)!).filter(Boolean);
    if (!res.position) {
      res.position = centroid(bats.map((b) => b.position));
      if (res.position) res.positionSource = 'derivee';
      else resNoPos++;
    }
    for (const b of bats) {
      if (!b.position && res.position) {
        b.position = res.position;
        b.positionSource = 'derivee';
      }
      mergeResp(b.responsables, res.responsables);
      if (!b.communeInsee) b.communeInsee = res.communeInsee;
    }
  }
  if (resNoPos) issues.add('warning', `${resNoPos} ensemble(s) résidentiel(s) sans aucune position : non affichés sur la carte.`);

  // Logements : position de la cage / bâtiment, rôles hérités, compteurs de la résidence.
  const lotsPerRes = new Map<string, number>();
  for (const lg of logements.values()) {
    const c = lg.cageId ? cages.get(lg.cageId) : undefined;
    const b = lg.batimentId ? batiments.get(lg.batimentId) : undefined;
    const res = lg.residenceId ? residences.get(lg.residenceId) : undefined;
    const pos = c?.position ?? b?.position ?? res?.position;
    if (pos) {
      lg.position = pos;
      lg.positionSource = 'derivee';
    }
    mergeResp(lg.responsables, b?.responsables ?? {});
    mergeResp(lg.responsables, res?.responsables ?? {});
    if (lg.residenceId) lotsPerRes.set(lg.residenceId, (lotsPerRes.get(lg.residenceId) ?? 0) + 1);
  }
  for (const res of residences.values()) res.nbLogements = lotsPerRes.get(res.id) ?? 0;

  // Rôle « conseiller social » de la résidence : valeur dominante parmi ses logements si non affecté.
  const csrCount = new Map<string, Map<string, number>>();
  for (const lg of logements.values()) {
    const v = lg.responsables.conseillerSocial;
    if (!v || !lg.residenceId) continue;
    const m = csrCount.get(lg.residenceId) ?? new Map<string, number>();
    m.set(v, (m.get(v) ?? 0) + 1);
    csrCount.set(lg.residenceId, m);
  }
  for (const [resId, m] of csrCount) {
    const res = residences.get(resId);
    if (res && !res.responsables.conseillerSocial) {
      res.responsables.conseillerSocial = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  if (residences.size === 0 && !issues.list().some((i) => i.level === 'error')) {
    issues.add('error', 'Aucun ensemble résidentiel (Patrimoine niveau 1) exploitable dans le fichier.');
  }
  if (lot.present && logements.size === 0) {
    issues.add('warning', 'Aucun logement exploitable : les compteurs de logements seront à zéro.');
  }

  return {
    agences: [...agences.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    residences: [...residences.values()],
    batiments: [...batiments.values()],
    cages: [...cages.values()],
    logements: [...logements.values()],
    issues: issues.list(),
    dateActualisation,
  };
}

function stripEmpty(r: Responsables): Responsables {
  const o: Responsables = {};
  for (const [k, v] of Object.entries(r)) if (v) o[k as keyof Responsables] = v;
  return o;
}
