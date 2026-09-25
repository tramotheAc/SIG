# Remplacer Excel par les API du bailleur

L'interface, la carte, les filtres, les analyses et les exports ne dépendent que de
`PatrimoineDataset` (`src/domain/model.ts`). Brancher une API consiste à fournir un autre
`DataProvider` ; **aucun composant UI n'est à modifier**.

## Étapes

1. **Décrire les endpoints** réels dans une configuration (ex. `src/config/api.config.ts`) :

   ```ts
   export const apiEndpoints = {
     baseUrl: '/api/patrimoine',      // idéalement via un reverse-proxy / BFF de l'intranet
     agences: '/agences',
     residences: '/residences',
     batiments: '/batiments',
     logements: '/logements',
     pageSize: 2000,
   };
   ```

2. **Écrire les mappers** réponse API → modèle (équivalent de `excel.mapping.ts`) :

   ```ts
   const mappers: ApiMappers = {
     agence: (r: any) => ({ id: r.code, code: r.code, nom: r.libelle }),
     residence: (r: any) => ({
       id: String(r.id), code: r.code, nom: r.libelle, agenceId: r.codeAgence,
       position: r.lat && r.lon ? { lat: r.lat, lon: r.lon } : undefined,
       positionSource: r.lat ? 'source' : 'absente',
       communeInsee: r.insee, communeNom: r.commune,
       batimentIds: [], nbLogements: r.nbLogements ?? 0,
       responsables: { gerantImmobilier: r.gerant, conseillerCommercial: r.commercial },
     }),
     // batiment, logement…
   };
   ```

   Si l'API renvoie du Lambert-93, réutiliser `toWgs84()` (`src/data/excel/coordinates.ts`).
   Les relations (batimentIds, logementIds, compteurs, héritage des rôles) peuvent être
   reconstituées par une fonction de consolidation : extraire la partie « Consolidation » de
   `excelParser.ts` dans un module commun (`data/consolidate.ts`) réutilisé par les deux providers.

3. **Instancier le provider** dans `src/App.tsx` :

   ```ts
   void loadData(new ApiDataProvider(apiEndpoints, mappers));
   ```

   Le bouton « Données » / import Excel peut être conservé comme mode de secours.

## Pagination et chargement progressif

`ApiDataProvider.fetchAll` gère une pagination `?page=&size=` (à adapter : curseur, `offset`,
en-têtes `Link`…). À la volumétrie actuelle (≈ 30 k logements), charger tout le patrimoine au
démarrage (≈ 5 Mo compressés) reste le plus simple et le plus rapide.

Si la volumétrie ou les droits l'imposent, deux stratégies sont prévues par le contrat :

| Stratégie | Méthode | Effet |
|---|---|---|
| Socle léger + détail à la demande | `load()` ne renvoie qu'agences + résidences ; `loadChildren('residence', id)` charge bâtiments/logements à l'ouverture d'une fiche | Premier affichage très rapide |
| Chargement par emprise | `loadInBounds(bbox, 'batiment' \| 'logement')` appelé par la carte au-delà du zoom 13,5 | Aucun transfert des objets hors vue |

Dans les deux cas, le store fusionne les objets reçus dans `PatrimoineIndex` (à ajouter : une
méthode `merge(partial)` qui incrémente `geoVersion`). Côté serveur, prévoir un paramètre
`bbox=ouest,sud,est,nord` en WGS84 et un index spatial (PostGIS `GIST`).

Pour de très gros volumes, servir le patrimoine en **tuiles vectorielles** (PostGIS + Martin ou
pg_tileserv) : la carte remplacerait alors la source GeoJSON par une source `vector`, sans
changement pour les panneaux.

## Sécurité

- Aucun jeton dans le frontend : authentification par cookie de session SSO ou BFF
  (le provider appelle déjà `fetch` avec `credentials: 'include'`).
- Filtrage des droits (ex. par agence) côté serveur.
- CORS : exposer les API sous le même domaine que l'application (reverse-proxy) pour l'éviter.

## Référentiels

Les référentiels publics sont appelés depuis `src/data/referentiels/*`. Pour les remplacer par
des sources du bailleur (ex. QPV ou quartiers maison), modifier l'entrée correspondante dans
`src/config/layers.config.ts` (URL GeoJSON) ou réécrire la fonction de service concernée.

## Implémenté : API de l'entrepôt (Data API Builder)

`src/data/api/DabDataProvider.ts` charge les tables DWH exposées par Data API Builder
(`GET {base}/{Entité}?$first=N[&$filter=…]`, pagination `nextLink`) et les convertit en
« feuilles » passées au **même parser** que l'Excel : mapping, contrôles et rapport identiques.

Paramétrage dans l'administration → *Données patrimoine* → **API de l'entrepôt** :
URL de base (`…/rest`), bouton « Découvrir les entités » (lecture de `{base}/openapi`),
entité et filtre OData par table, taille de page, en-tête d'authentification facultatif,
« Tester le chargement ».

Prérequis côté API :
- **CORS** : l'origine de l'application doit être autorisée dans `dab-config.json`
  (`runtime.host.cors.origins`), sinon le navigateur bloque les appels ;
- noms de colonnes identiques aux tables DWH (sinon ajouter les alias dans `excel.mapping.ts`) ;
- `max-page-size` DAB ≥ taille de page choisie ;
- authentification : privilégier EasyAuth / SSO ; un en-tête saisi dans l'admin est visible par
  tout utilisateur du site.
