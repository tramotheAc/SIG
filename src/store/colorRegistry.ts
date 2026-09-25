import { ColorRegistry } from '../domain/symbology';

/** Registre unique pour la session : garantit la stabilité valeur → couleur. */
export const colorRegistry = new ColorRegistry();
