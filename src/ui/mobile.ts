/** Affichage mobile (téléphone) : panneaux en « feuilles » basses, barre d'onglets en bas. */
export const MOBILE_QUERY = '(max-width: 720px)';
export const isMobile = () => typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches;
