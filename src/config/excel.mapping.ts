/**
 * Mapping explicite Excel (tables DWH du bailleur) → champs internes.
 *
 * - `sheets` : noms de feuilles acceptés (le premier trouvé est utilisé, comparaison insensible
 *   à la casse / aux accents).
 * - `columns` : pour chaque champ interne, la liste des en-têtes acceptés (alias).
 * - `required` : champs sans lesquels la feuille est inexploitable.
 *
 * Aucun composant d'interface ne référence ces noms de colonnes : seul
 * src/data/excel/excelParser.ts utilise ce fichier.
 */
export interface SheetMapping {
  sheets: string[];
  columns: Record<string, string[]>;
  required: string[];
  optional?: boolean;
}

export const excelMapping = {
  organisation: {
    sheets: ['DWH.Organisation', 'Organisation', 'Agences'],
    required: ['id', 'niveau'],
    // Facultative : à défaut, les agences sont reconstituées depuis Patrimoine (Code_niveau_organisation_1).
    optional: true,
    columns: {
      id: ['ID_organisation'],
      niveau: ['Niveau_organisation'],
      codeSociete: ['Code_societe'],
      codeN1: ['Code_niveau_organisation_1'],
      codeN2: ['Code_niveau_organisation_2'],
      codeN3: ['Code_niveau_organisation_3'],
      libelle: ['Libelle_organisation'],
      adresse: ['Adresse'],
      valide: ['Indicateur_validite'],
      dateActualisation: ['Date_actualisation'],
    },
  },
  patrimoine: {
    sheets: ['DWH.Patrimoine', 'Patrimoine'],
    required: ['id', 'niveau', 'codeN1'],
    columns: {
      id: ['ID_patrimoine'],
      organisationId: ['ID_organisation'],
      niveau: ['Niveau_patrimoine'],
      codeN1: ['Code_niveau_patrimoine_1'],
      codeN2: ['Code_niveau_patrimoine_2'],
      codeN3: ['Code_niveau_patrimoine_3'],
      libelle: ['Libelle_patrimoine'],
      orgN1: ['Code_niveau_organisation_1'],
      orgLibelle: ['Libelle_organisation'],
      adresseComplete: ['Adresse_complete'],
      adresse: ['Adresse'],
      commune: ['Libelle_commune'],
      codePostal: ['Code_postal'],
      insee: ['Code_INSEE_commune'],
      latitude: ['Latitude', 'Y'],
      longitude: ['Longitude', 'X'],
      departement: ['Code_département', 'Code_departement'],
      quartier: ['Code_quartier'],
      dateConstruction: ['Date_construction'],
      modeAcquisition: ['Mode_acquisition'],
      annule: ['Indicateur_annulation'],
      dateFinValidite: ['Date_fin_validite'],
      lienFiche: ['Lien_IKOS_synthese_patrimoine'],
      dateActualisation: ['Date_actualisation'],
    },
  },
  lot: {
    sheets: ['DWH.Lot', 'Lot', 'Logements'],
    required: ['idLot'],
    optional: true,
    columns: {
      idClientLot: ['ID_client_lot'],
      idLot: ['ID_lot'],
      patrimoineId: ['ID_patrimoine'],
      rpls: ['ID_RPLS'],
      codeLot: ['Code_lot'],
      codeN1: ['Code_niveau_patrimoine_1'],
      codeN2: ['Code_niveau_patrimoine_2'],
      codeN3: ['Code_niveau_patrimoine_3'],
      usage: ['Libelle_usage_lot'],
      nature: ['Libelle_nature_lot'],
      etage: ['Etage'],
      porte: ['Numero_porte'],
      individuelCollectif: ['Libelle_individuel_collectif'],
      financement: ['Libelle_categorie_financement'],
      typeLot: ['Libelle_type_lot'],
      surface: ['Surface_habitable'],
      chambres: ['Nombre_chambres'],
      etat: ['Libelle_etat_actuel'],
      finGestion: ['Indicateur_fin_gestion'],
      lienFiche: ['Lien_IKOS_synthese_lot'],
    },
  },
  client: {
    sheets: ['DWH.Client', 'Client'],
    required: ['idClientLot'],
    optional: true,
    // NB : Nom_prenom_client et les revenus ne sont volontairement PAS mappés (données personnelles
    // inutiles à la cartographie).
    columns: {
      idClientLot: ['ID_client_lot'],
      presence: ['Indicateur_statut_presence'],
      dateFinOccupation: ['Date_fin_occupation'],
      conseillerSocial: ['Nom_prenom_CSR_referent'],
    },
  },
  /**
   * Feuille OPTIONNELLE (hypothèse du POC) : les rôles conseiller commercial, gérant immobilier
   * et travailleur social n'existent pas dans les tables DWH fournies. Cette feuille permet de
   * les rattacher à un objet patrimoine (tous niveaux) ; ils sont hérités par les enfants.
   */
  affectations: {
    sheets: ['Affectations', 'Responsables'],
    required: ['codePatrimoine'],
    optional: true,
    columns: {
      codePatrimoine: ['Code_patrimoine', 'Code_niveau_patrimoine_1', 'ID_patrimoine'],
      conseillerCommercial: ['Conseiller_commercial'],
      gerantImmobilier: ['Gerant_immobilier', 'Gérant_immobilier'],
      conseillerSocial: ['Conseiller_social', 'CSR'],
      travailleurSocial: ['Travailleur_social'],
    },
  },
} satisfies Record<string, SheetMapping>;

export type ExcelMapping = typeof excelMapping;
export type SheetKey = keyof ExcelMapping;

/** Valeurs d'indicateurs interprétées comme « vrai ». */
export const TRUE_VALUES = ['1', 'o', 'oui', 'y', 'yes', 'true', 'vrai', 'x'];
