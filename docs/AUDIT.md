# Audit de l'Atlas Patrimoine — 26/09/2026

Périmètre : code source (`src/`), version statique (`app-statique/`), configuration, dépendances,
services externes. Hors périmètre à la demande : accessibilité RGAA, droits d'accès (traités lors du
passage sur serveur), mode hors ligne, volumes > 30 000 logements.

## Synthèse

| Domaine | État | Commentaire |
|---|---|---|
| Compilation / typage | ✅ | `tsc` sans erreur, TypeScript strict |
| Tests automatisés | 🟡 | 43 tests, tous verts ; cœur des données bien couvert, interface non couverte |
| Sécurité | 🟡 | Aucun secret ; 3 défauts corrigés pendant l'audit ; admin non protégée (prévu) |
| Performances | 🟡 | Chargement ≈ 4,7 s (démo 30 000 lgt) ; fichier QPV national de 9,3 Mo à réduire |
| Dépendances | 🟡 | 2 alertes « modérées » (exceljs → uuid), sans impact pratique |
| Services externes | 🟠 | Plusieurs services gratuits sans garantie de disponibilité |
| Maintenabilité | 🟡 | Code clair et commenté ; 2 fichiers trop gros (admin, fiches) |

## 1. Corrigé pendant l'audit

1. **Liens de tableaux de bord** : une URL `javascript:` ou `data:` saisie dans l'admin pouvait être
   ouverte dans l'iframe. Seuls `http(s)://` et les chemins relatifs sont désormais acceptés (test ajouté).
2. **Liens partagés (`#v=…`)** : le contenu du lien est maintenant vérifié champ par champ
   (types, couleurs, coordonnées) avant d'être appliqué ; un lien forgé ne peut plus casser l'affichage.
3. **Configuration brouillon** : un administrateur qui prévisualisait une configuration voyait ensuite
   un site différent des utilisateurs sans le savoir. Un bandeau l'indique sur la carte, avec un bouton
   « Revenir à la version publiée ».
4. **Admin, aperçu des exports** : conflit de nom de style CSS avec l'aperçu des tableaux de bord
   (hauteur figée à 520 px) — corrigé.

## 2. Sécurité

- ✅ Aucun secret dans le code ni dans la configuration. L'en-tête d'API facultatif est explicitement
  signalé comme visible dans le navigateur.
- ✅ Noms des locataires (table Client) jamais importés.
- ✅ Liens « Fiche IKOS » issus du fichier Excel limités à `http(s)://`.
- ✅ Infobulles de la carte : textes échappés (pas d'injection HTML).
- ✅ Iframes avec `referrerPolicy` strict ; liens externes en `noopener noreferrer`.
- 🟠 **Page d'administration accessible à tous** (`#/admin`). Elle ne peut modifier que le navigateur
  de la personne (brouillon local) : la publication exige de remplacer `config/site.json` sur le
  serveur. Risque faible en statique, **à protéger lors du passage sur serveur** (Entra ID).
- 🟡 Données patrimoine servies en clair à quiconque connaît l'adresse du site (fichier Excel ou API).
  Normal en statique ; à couvrir par l'authentification du serveur / de l'API (DAB).

## 3. Performances (mesurées, jeu de démonstration 29 859 logements)

| Mesure | Valeur |
|---|---|
| Ouverture → données affichées | ≈ 4,7 s (lecture Excel de 6,7 Mo dans un worker) |
| Mémoire JavaScript | ≈ 200 Mo |
| Activation couche QPV (fichier local) | ≈ 0,6 s |
| Code JavaScript principal | 1,7 Mo (MapLibre, reprojection, calculs) |

Recommandations :
1. **Réduire `referentiels/qpv.geojson`** (9,3 Mo, 1 362 QPV de France) aux départements du territoire
   et voisins (22, 29, 35, 44, 56 + 49, 50, 53, 85) avec coordonnées arrondies au mètre : environ
   **0,5 Mo**, soit un chargement 15 à 20 fois plus rapide sur réseau d'entreprise. Opération à faire
   sur le fichier source (non réalisée automatiquement pour ne pas écraser le fichier fourni).
2. **Source API plutôt qu'Excel** en production : évite de télécharger 6,7 Mo à chaque ouverture.
3. Pas d'action nécessaire sur le volume : 30 000 logements restent fluides.

## 4. Services externes (disponibilité)

| Service | Usage | Garantie | Recommandation |
|---|---|---|---|
| Géoplateforme IGN (`data.geopf.fr`) | Plan IGN, cadastre, adresses | Service public | ✅ Conserver |
| API Découpage (`geo.api.gouv.fr`) | Communes, EPCI, contours | Service public | ✅ Conserver |
| OpenFreeMap | Fonds Positron, Bright, Dark, Fiord | Gratuit, sans SLA | 🟠 Valider ou auto-héberger |
| Esri World Light Gray | Fond « Neutre » | Conditions Esri | 🟠 Vérifier la licence ; sinon Positron / Plan IGN N&B |
| `fonts.openmaptiles.org` | Polices des libellés | Gratuit, sans SLA | 🟠 Copier les polices dans `app-statique/` |
| Géorisques | Zones inondables | Service public, CORS bloquant | Désactivé |

En cas de proxy d'entreprise, ces domaines doivent être autorisés. Si l'un est coupé, l'application
continue de fonctionner (fond uni de repli, couche signalée « indisponible »).

## 5. Dépendances

- 9 dépendances d'exécution, toutes maintenues (React 19, MapLibre 6, Zustand, anime.js, exceljs,
  fflate, proj4, turf/buffer).
- `npm audit` : 2 alertes **modérées** via `exceljs → uuid` (fonction jamais appelée par l'application).
  Correctif possible seulement en rétrogradant exceljs : **ne rien faire**, surveiller une mise à jour.
- Aucune dépendance chargée depuis un CDN : tout est inclus dans `app-statique/`.

## 6. Qualité du code

- ✅ Architecture en couches : sources (DataProvider Excel / API) → modèle métier → index → carte / UI.
  Brancher l'API ne touche pas l'interface.
- ✅ Configuration centralisée (`config/site.json`), éditable par l'admin.
- 🟡 `AdminPage.tsx` (1 400 lignes) et `DetailPanel.tsx` (670 lignes) : à découper par section / type de
  fiche avant d'autres évolutions.
- 🟡 Pas de linter configuré (ESLint 9 sans fichier de configuration) : à ajouter pour homogénéiser.
- 🟡 Tests : parseurs Excel/API, index, filtres, OGC, PDF, qualité des données, configuration couverts ;
  **interface et exports non couverts** — ajouter quelques tests navigateur (Playwright) sur les
  parcours clés : ouverture, filtre, fiche, export.

## 7. Fonctionnel — points de vigilance

- Les **vues enregistrées** restent dans le navigateur de chaque personne (le lien sert au partage).
- Les **quartiers** fournis couvrent uniquement Rennes : fournir les autres communes si besoin.
- Le **score qualité** vaut 100 sur la démo (données propres par construction) ; à relancer sur le
  vrai fichier dès le premier import.
- **Mobile** : utilisable (volets bas, barre d'onglets) ; l'administration reste pensée pour l'ordinateur.

## 8. Plan d'action proposé

| Priorité | Action | Effort |
|---|---|---|
| 1 | Réduire le fichier QPV au territoire | 15 min |
| 2 | Choisir le fond par défaut (Positron / Plan IGN N&B) et trancher la licence Esri | Décision |
| 3 | Héberger les polices des libellés dans le site | 1 h |
| 4 | Brancher la source API (DAB) en production | Selon API |
| 5 | Découper `AdminPage` / `DetailPanel`, ajouter ESLint | ½ journée |
| 6 | Tests navigateur des parcours clés | ½ journée |
| 7 | Au passage serveur : authentification (site + admin + API) | À planifier |
