# Sources des couches externes

Toutes les définitions sont dans `src/config/layers.config.ts` ; la fiche de chaque couche est
aussi consultable dans l'application (icône ⓘ du panneau Couches).

> Les URLs n'ont pas pu être testées depuis l'environnement de développement (réseau sortant
> restreint). Elles suivent la documentation publique des services. Les lignes marquées ⚠ sont
> à confirmer en priorité.

| Couche | Source | Type | Endpoint | Millésime | Format | CRS | Mise à jour |
|---|---|---|---|---|---|---|---|
| Fond neutre | CARTO Positron (OSM) | XYZ raster | `https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png` | Continu | PNG | EPSG:3857 | Hebdo |
| Plan N&B | IGN Plan IGN v2 (désaturé côté client) | WMTS | `https://data.geopf.fr/wmts` `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` | Continu | PNG | EPSG:3857 (PM) | Mensuelle |
| Plan couleur | IGN Plan IGN v2 | WMTS | idem | Continu | PNG | EPSG:3857 (PM) | Mensuelle |
| Satellite | IGN BD ORTHO | WMTS | `ORTHOIMAGERY.ORTHOPHOTOS` | Par département (cycle 3 ans) | JPEG | EPSG:3857 (PM) | Triennale |
| Parcellaire cadastral | IGN / DGFiP Parcellaire Express | WMTS | `CADASTRALPARCELS.PARCELLAIRE_EXPRESS` (style `PCI vecteur`) | Trimestriel | PNG | EPSG:3857 (PM) | Trimestrielle |
| Adresses BAN | Base Adresse Nationale via Géoplateforme | REST | `https://data.geopf.fr/geocodage/search` et `/reverse` | Continu | GeoJSON | EPSG:4326 | Quotidienne |
| ⚠ Zones inondables | Géorisques – PPRN inondation approuvés | WMS | `https://georisques.gouv.fr/services` couche `PPRN_COMMUNE_RISQINOND_APPROUV` | Selon PPR | PNG | EPSG:3857 | Au fil de l'eau |
| Départements | geo.api.gouv.fr (IGN Admin Express / COG) | REST | `/departements/{code}?format=geojson&geometry=contour` | COG de l'année | GeoJSON | EPSG:4326 | Annuelle |
| EPCI | geo.api.gouv.fr | REST | `/epcis/{code}?format=geojson&geometry=contour` | Périmètres au 1ᵉʳ janvier | GeoJSON | EPSG:4326 | Annuelle |
| Communes | geo.api.gouv.fr | REST | `/departements/{dep}/communes?format=geojson&geometry=contour` | COG de l'année | GeoJSON | EPSG:4326 | Annuelle |
| Rattachement commune → EPCI | geo.api.gouv.fr | REST | `/departements/{dep}/communes?fields=…,epci,centre` | COG de l'année | JSON | EPSG:4326 | Annuelle |
| ⚠ QPV | ANCT – QPV 2024 (data.gouv.fr) | Fichier | `public/referentiels/qpv.geojson` via `npm run referentiels:fetch` | QPV 2024 (décret 2023-1314) | GeoJSON | EPSG:4326 (reprojeté si L93) | Pluriannuelle |
| Tampon 300 m QPV | Calculé (Turf) | — | — | Celui des QPV | GeoJSON | EPSG:4326 | Au chargement |
| ⚠ Zonage APL | Ministère du Logement (data.gouv.fr) | Table INSEE → zone | `public/referentiels/zonage_apl.csv` | Selon fichier | CSV | — | Rare |
| ⚠ Zonage ABC / Pinel | Ministère du Logement (data.gouv.fr) | Table INSEE → zone | `public/referentiels/zonage_abc.csv` | Selon fichier (révision 2024-2025) | CSV | — | Ponctuelle |
| Quartiers | À fournir (bailleur, IRIS INSEE ou municipal) | Fichier | `public/referentiels/quartiers.geojson` | — | GeoJSON | EPSG:4326 | — |
| Libellés | OpenMapTiles fonts | PBF | `https://fonts.openmaptiles.org/{fontstack}/{range}.pbf` | — | — | — | — (repli local automatique) |

## Points à confirmer au premier déploiement

1. **Zones inondables** : `GetCapabilities` du WMS Géorisques pour choisir la couche (PPRi approuvés,
   TRI, AZI) ; mettre à jour `layers.config.ts → inondation`.
2. **QPV / APL / ABC** : lancer `npm run referentiels:fetch` ; le script affiche le jeu data.gouv.fr
   et la ressource retenus. En cas d'ambiguïté, passer l'URL explicite :
   `npm run referentiels:fetch -- --qpv <url> --abc <url> --apl <url>`.
   Reporter le millésime dans `layers.config.ts → meta.millesime` pour affichage dans l'application.
3. **Géocodage** : `data.geopf.fr/geocodage` est le successeur d'`api-adresse.data.gouv.fr` ;
   l'URL de base est configurable (`app.config.ts → services.geocodage`).

## Systèmes de coordonnées

La carte travaille en WGS84 (EPSG:4326) / Web Mercator (EPSG:3857). Les conversions sont faites à
l'intégration : Lambert-93 (EPSG:2154) des fichiers Excel (`coordinates.ts`) et des QPV
(`fetch-referentiels.mjs`). Les tuiles IGN sont demandées dans le TileMatrixSet `PM` (Web Mercator).

## Fond Google 3D (optionnel)

| Couche | Source | Type | Endpoint | Conditions |
|---|---|---|---|---|
| Google 3D | Google Maps Platform – Photorealistic 3D Tiles | OGC 3D Tiles (deck.gl) | `https://tile.googleapis.com/v1/3dtiles/root.json` | Clé API (Map Tiles API, facturation Google Cloud), restreinte au domaine de l'application ; mentions Google affichées ; export d'image interdit (désactivé dans l'application). |

La clé se saisit dans l'administration (Services & API). Sans clé, le fond n'est pas proposé.
La clé d'une API Google « navigateur » est visible dans le code de la page : c'est son
fonctionnement normal ; la protection repose sur la restriction par domaine (HTTP referrer)
configurée dans la console Google Cloud.
