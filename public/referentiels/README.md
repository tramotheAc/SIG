# Référentiels « fichiers »

Fichiers attendus par l'application (non versionnés) :

| Fichier | Contenu | Obtention |
|---|---|---|
| `qpv.geojson` | Contours des QPV 2024 (propriétés `code`, `nom`) | `npm run referentiels:fetch` |
| `zonage_abc.csv` | `insee;zone` (Abis, A, B1, B2, C) | `npm run referentiels:fetch` |
| `zonage_apl.csv` | `insee;zone` (1, 2, 3) | `npm run referentiels:fetch` |
| `quartiers.geojson` | Quartiers (propriétés `code`, `nom`) | À fournir par le bailleur (optionnel) |

Si un fichier est absent, la couche correspondante est signalée « Non disponible » dans l'interface
et les analyses concernées affichent « Non déterminé ».
