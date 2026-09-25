/**
 * Génère public/demo/patrimoine_demo.xlsx : jeu de données SYNTHÉTIQUE au format exact
 * des tables DWH (Organisation, Patrimoine, Lot, Client) + feuille optionnelle Affectations.
 *
 * Volumétrie cible : ~8 000 ensembles, ~12 000 adresses, ~14 000 cages, ~26 000 logements, 10 agences.
 * Générateur pseudo-aléatoire à graine fixe : le fichier est reproductible.
 * AUCUNE de ces données ne correspond à du patrimoine réel.
 */
import ExcelJS from 'exceljs';
import { mkdirSync } from 'node:fs';
import { AGENCES, COMMUNES } from './demo-communes.mjs';

let seed = 20260925;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

const TARGET_RES = 8000;
const RUES = ['rue de la République', 'rue Jean Jaurès', 'avenue Pasteur', 'rue Victor Hugo', 'boulevard de la Liberté',
  'rue des Écoles', 'rue du Moulin', 'allée des Tilleuls', 'rue de Bretagne', 'rue Anatole France', 'square des Hortensias',
  'rue Émile Zola', 'rue de la Gare', 'avenue des Sports', 'rue du Stade', 'impasse des Genêts', 'rue Louis Pasteur',
  'rue Jules Ferry', 'rue des Lilas', 'rue de Brest', 'rue de Nantes', 'rue Saint-Michel', 'allée des Chênes', 'rue du Port'];
const NOMS_RES = ['Les Mimosas', 'Le Clos', 'Les Ajoncs', 'Ker', 'Les Bruyères', 'Le Hameau', 'Les Terrasses', 'Le Parc',
  'Les Jardins', 'La Prairie', 'Les Hauts', 'Le Verger', 'Les Camélias', 'Les Goélands', 'Le Moulin', 'Les Iris'];
const PRENOMS = ['Camille', 'Dominique', 'Claude', 'Alex', 'Morgane', 'Yann', 'Gwen', 'Sacha', 'Maël', 'Loïc', 'Nolwenn',
  'Erwan', 'Soizic', 'Ronan', 'Anne', 'Tristan', 'Léna', 'Hugo', 'Inès', 'Paul'];
const NOMS = ['Le Gall', 'Le Goff', 'Guillou', 'Tanguy', 'Morvan', 'Le Roux', 'Martin', 'Bernard', 'Kerjean', 'Riou',
  'Le Bihan', 'Hamon', 'Perrot', 'Jaouen', 'Cadiou', 'Le Meur', 'Prigent', 'Rolland', 'Salaün', 'Quéré'];
const person = () => `${pick(NOMS)} ${pick(PRENOMS)} (fictif)`;

// Responsables fictifs par agence
const staff = {};
for (const [code] of AGENCES) {
  staff[code] = {
    cc: Array.from({ length: 3 }, person),
    gi: Array.from({ length: 4 }, person),
    csr: Array.from({ length: 3 }, person),
    ts: Array.from({ length: 2 }, person),
  };
}

const totalW = COMMUNES.reduce((s, c) => s + c[4], 0);
const wb = new ExcelJS.Workbook();

/* Organisation */
const orgCols = ['ID_organisation', 'Niveau_organisation', 'Code_societe', 'Code_niveau_organisation_1', 'Code_niveau_organisation_2',
  'Code_niveau_organisation_3', 'Libelle_organisation', 'Adresse', 'Indicateur_validite', 'Date_actualisation'];
const org = wb.addWorksheet('DWH.Organisation');
org.addRow(orgCols);
const orgId = {};
AGENCES.forEach(([code, lib, ville], i) => {
  orgId[code] = 100 + i;
  org.addRow([100 + i, 1, 'DEMO', code, null, null, lib, `1 place de l’Agence, ${ville}`, 1, '2026-09-01']);
});

/* Patrimoine */
const patCols = ['ID_patrimoine', 'ID_organisation', 'Niveau_patrimoine', 'Code_societe', 'Code_niveau_patrimoine_1', 'Code_niveau_patrimoine_2',
  'Code_niveau_patrimoine_3', 'Libelle_patrimoine', 'Code_niveau_organisation_1', 'Code_niveau_organisation_2', 'Code_niveau_organisation_3',
  'Libelle_organisation', 'Adresse_complete', 'Adresse', 'Libelle_commune', 'Code_postal', 'Code_INSEE_commune', 'Latitude', 'Longitude',
  'Code_département', 'Code_bassin_habitat', 'Code_quartier', 'Date_construction', 'Mode_acquisition', 'Date_acquisition',
  'Indicateur_annulation', 'Date_fin_validite', 'Lien_IKOS_synthese_patrimoine', 'Lien_Google_Maps', 'Lien_Google_Earth', 'Date_actualisation'];
const pat = wb.addWorksheet('DWH.Patrimoine');
pat.addRow(patCols);

const lotCols = ['ID_client_lot', 'ID_lot', 'ID_patrimoine', 'ID_RPLS', 'Code_societe', 'Code_lot', 'Code_niveau_patrimoine_1',
  'Code_niveau_patrimoine_2', 'Code_niveau_patrimoine_3', 'Libelle_activite_lot', 'Libelle_usage_lot', 'Code_nature_lot', 'Libelle_nature_lot',
  'Etage', 'Numero_porte', 'Libelle_individuel_collectif', 'Libelle_categorie_financement', 'Libelle_type_lot', 'Surface_habitable',
  'Nombre_chambres', 'Libelle_etat_actuel', 'Indicateur_fin_gestion'];
const lot = wb.addWorksheet('DWH.Lot');
lot.addRow(lotCols);
const cliCols = ['ID_client_lot', 'ID_client', 'Code_societe', 'Code_client', 'Indicateur_statut_presence', 'Date_fin_occupation', 'Nom_prenom_CSR_referent'];
const cli = wb.addWorksheet('DWH.Client');
cli.addRow(cliCols);
const affCols = ['Code_patrimoine', 'Conseiller_commercial', 'Gerant_immobilier', 'Travailleur_social'];
const aff = wb.addWorksheet('Affectations');
aff.addRow(affCols);

let patId = 1_000_000;
let lotId = 5_000_000;
let clientLot = 9_000_000;
let nRes = 0, nBat = 0, nCage = 0, nLot = 0;
const TYPES = ['T1', 'T2', 'T2', 'T3', 'T3', 'T3', 'T4', 'T4', 'T5'];
const FIN = ['PLUS', 'PLUS', 'PLAI', 'PLS', 'PLUS'];

for (const [insee, nom, lat, lon, w, agList] of COMMUNES) {
  const nb = Math.max(4, Math.round((w / totalW) * TARGET_RES));
  const spread = 0.006 + Math.sqrt(w) * 0.0045; // étalement autour du centre (degrés)
  const agencesCommune = agList.split('|');
  const dep = insee.slice(0, 2);
  const cp = `${dep}${String(Math.floor(rnd() * 9) * 10).padStart(3, '0')}`;
  for (let i = 0; i < nb; i++) {
    nRes++;
    const code1 = `E${String(nRes).padStart(5, '0')}`;
    const ag = agencesCommune.length > 1 ? agencesCommune[lat + gauss() * spread > lat ? 0 : 1] : agencesCommune[0];
    const rlat = lat + gauss() * spread;
    const rlon = lon + gauss() * spread * 1.4;
    // Taille : majorité de petits ensembles (individuel), quelques grands collectifs
    const collectif = rnd() < 0.35;
    const nbBat = collectif ? 1 + Math.floor(rnd() * rnd() * 8) : rnd() < 0.15 ? 2 : 1;
    const libRes = `${pick(NOMS_RES)} ${nRes % 97 === 0 ? 'II' : ''}`.trim() + ` — ${nom}`;
    const annee = 1955 + Math.floor(rnd() * 70);
    const resId = ++patId;
    const quartier = collectif && rnd() < 0.5 ? `Q${insee}-${1 + Math.floor(rnd() * 4)}` : null;
    const rue0 = pick(RUES);
    pat.addRow([resId, orgId[ag], 1, 'DEMO', code1, null, null, libRes, ag, null, null, null,
      `${rue0}, ${cp} ${nom}`, rue0, nom, cp, insee, +rlat.toFixed(6), +rlon.toFixed(6), dep, null, quartier,
      `${annee}-01-01`, pick(['Construction', 'Construction', 'VEFA', 'Acquisition']), null, 0, null, null, null, null, '2026-09-01']);
    const s = staff[ag];
    aff.addRow([code1, pick(s.cc), pick(s.gi), pick(s.ts)]);

    for (let b = 1; b <= nbBat; b++) {
      nBat++;
      const code2 = String(b).padStart(2, '0');
      const blat = rlat + (nbBat > 1 ? gauss() * 0.0009 : 0);
      const blon = rlon + (nbBat > 1 ? gauss() * 0.0012 : 0);
      const num = 1 + Math.floor(rnd() * 80);
      const rue = b === 1 ? rue0 : pick(RUES);
      const adr = `${num} ${rue}`;
      const batId = ++patId;
      pat.addRow([batId, orgId[ag], 2, 'DEMO', code1, code2, null, adr, ag, null, null, null,
        `${adr}, ${cp} ${nom}`, adr, nom, cp, insee, +blat.toFixed(6), +blon.toFixed(6), dep, null, quartier,
        `${annee}-01-01`, null, null, 0, null, null, null, null, '2026-09-01']);
      const nbCage = collectif ? 1 + Math.floor(rnd() * 2) : 1;
      for (let c = 1; c <= nbCage; c++) {
        nCage++;
        const code3 = String.fromCharCode(64 + c);
        const cageId = ++patId;
        // Coordonnées de cage parfois absentes (héritées de l'adresse à l'import)
        const withPos = rnd() < 0.7;
        pat.addRow([cageId, orgId[ag], 3, 'DEMO', code1, code2, code3, `Cage ${code3}`, ag, null, null, null,
          `${adr}, ${cp} ${nom}`, adr, nom, cp, insee, withPos ? +(blat + gauss() * 0.00008).toFixed(6) : null,
          withPos ? +(blon + gauss() * 0.00012).toFixed(6) : null, dep, null, quartier, `${annee}-01-01`, null, null, 0, null, null, null, null, '2026-09-01']);
        const nbLot = collectif ? 1 + Math.floor(rnd() * 3.2) : 1;
        const etages = collectif ? 1 + Math.floor(rnd() * 5) : 1;
        for (let l = 0; l < nbLot; l++) {
          nLot++;
          const id = ++lotId;
          const cl = ++clientLot;
          const etage = collectif ? Math.floor(l / Math.max(1, Math.ceil(nbLot / etages))) : 0;
          const t = collectif ? pick(TYPES) : pick(['T3', 'T4', 'T4', 'T5']);
          const surf = { T1: 30, T2: 47, T3: 65, T4: 80, T5: 95 }[t] + Math.round(gauss() * 5);
          lot.addRow([cl, id, cageId, `RPLS${String(id).slice(-7)}`, 'DEMO', `${code1}-${code2}${code3}-${String(l + 1).padStart(3, '0')}`,
            code1, code2, code3, 'Location', 'Habitation', 'LOG', 'Logement', etage, `${etage}${String(l + 1).padStart(2, '0')}`,
            collectif ? 'Collectif' : 'Individuel', pick(FIN), t, surf, Math.max(0, Number(t.slice(1)) - 1),
            rnd() < 0.95 ? 'Loué' : 'Vacant', 0]);
          cli.addRow([cl, 70_000_000 + cl, 'DEMO', `C${cl}`, rnd() < 0.95 ? 1 : 0, null, pick(s.csr)]);
        }
      }
    }
  }
}

mkdirSync(new URL('../public/demo/', import.meta.url), { recursive: true });
const out = new URL('../public/demo/patrimoine_demo.xlsx', import.meta.url);
await wb.xlsx.writeFile(out.pathname);
console.log(`Généré : ${nRes} ensembles, ${nBat} adresses, ${nCage} cages, ${nLot} logements, ${AGENCES.length} agences → ${out.pathname}`);
