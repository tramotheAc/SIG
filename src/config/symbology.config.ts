/**
 * Paramètres de symbologie du patrimoine.
 */
export const symbologyConfig = {
  /**
   * Palette catégorielle (16 teintes, les 10 premières très contrastées, lisibles sur fond clair et sombre).
   * Attribuée dans l'ordre d'apparition trié des catégories, puis figée pour la session.
   */
  palette: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#17becf',
    '#bcbd22', '#393b79', '#ad494a', '#637939', '#e7ba52', '#7b4173', '#3182bd', '#31a354',
  ],
  /** Couleur de la catégorie « Non renseigné ». */
  missingColor: '#adb5bd',
  missingLabel: 'Non renseigné',
  /** Couleur de la catégorie « Plusieurs valeurs » (agrégats mixtes). */
  mixedColor: '#343a40',
  mixedLabel: 'Plusieurs',

  /**
   * Couleurs imposées par code agence (Code_niveau_organisation_1).
   * Laisser vide : les agences reçoivent alors la palette par défaut.
   * Exemple : { 'AG01': '#1f77b4' }
   */
  agenceColors: {} as Record<string, string>,

  /**
   * Taille des ponctuels selon le nombre de logements :
   * rayon = min + (max - min) * sqrt(min(n, plafond) / plafond)
   * plafond = percentile 95 du nombre de logements de la couche.
   * La racine carrée rend la SURFACE proportionnelle au nombre de logements ;
   * le plafond évite que quelques très grosses résidences écrasent les autres.
   */
  size: {
    fixedRadius: 5,
    minRadius: 3,
    maxRadius: 16,
    capPercentile: 0.95,
  },
  /** Rayons des niveaux fins. */
  logementRadius: 4,
  communeAggregate: { minRadius: 6, maxRadius: 30 },
  selectionColor: '#ffd43b',
} as const;
