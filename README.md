# Atlas Patrimoine — POC

Application cartographique métier pour un bailleur social (Bretagne + Loire-Atlantique) :
explorer le patrimoine (agences → ensembles résidentiels → adresses → cages → logements),
le croiser avec les référentiels territoriaux (communes, EPCI, QPV, zonages APL / Pinel,
cadastre, BAN, zones inondables), le filtrer, l'analyser et l'exporter.

> ⚠️ Le jeu de données livré (`public/demo/patrimoine_demo.xlsx`) est **synthétique** :
> il respecte le schéma des tables DWH fournies (Organisation, Patrimoine, Lot, Client) mais
> ne correspond à aucun patrimoine réel. Un bandeau le rappelle en permanence dans l'application.

## Lancement

Prérequis : Node.js ≥ 20.

```bash
npm install
npm run dev              # http://localhost:5173
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run build` | Contrôle de types + build de production (`dist/`, site statique) |
| `npm run preview` | Sert le build de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run demo:generate` | Régénère le jeu de démonstration synthétique |
| `npm run referentiels:fetch` | Télécharge QPV, zonage ABC/Pinel et zonage APL depuis data.gouv.fr vers `public/referentiels/` |

Le build est un **site statique** : il peut être servi par n'importe quel serveur web interne
(nginx, IIS, Apache). Aucun backend n'est nécessaire pour le POC.

### Référentiels à installer

Les couches communes, EPCI, départements, cadastre, fonds de carte, BAN et zones inondables sont
lues **directement** depuis les services publics officiels (voir [docs/SOURCES.md](docs/SOURCES.md)).
Les QPV et les zonages APL / ABC ne sont pas exposés par une API simple : ils sont téléchargés
une fois par `npm run referentiels:fetch` (poste avec accès Internet) puis servis en fichiers
statiques. En leur absence, l'application fonctionne et signale « Non disponible ».

### Charger les données réelles

Bouton **Données** (en haut à droite) → glisser-déposer l'export Excel des tables DWH.
Le fichier est lu **dans le navigateur** (aucun envoi serveur), contrôlé, puis un rapport
d'anomalies est affiché. Format attendu : voir [docs/ARCHITECTURE.md § Mapping Excel](docs/ARCHITECTURE.md#mapping-excel--modèle).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — choix techniques, modèle de données, niveaux de zoom, performance
- [docs/API_MIGRATION.md](docs/API_MIGRATION.md) — remplacer Excel par les API du bailleur
- [docs/SOURCES.md](docs/SOURCES.md) — fiches des couches externes (source, millésime, CRS, fréquence)

## Structure

```
src/
  config/            Paramètres externalisés
    app.config.ts        emprise, seuils de zoom, URLs de services
    layers.config.ts     fonds de carte + couches de référence (fiches sources)
    excel.mapping.ts     mapping colonnes Excel → champs internes
    symbology.config.ts  palette, couleurs d'agences, tailles
  domain/            Modèle métier et services purs (testables)
    model.ts             Agence, Residence, Batiment, Cage, Logement, GeoContext…
    patrimoineIndex.ts   index mémoire, filtres combinés, agrégats commune/EPCI
    symbology.ts         registre de couleurs stable, échelle de taille
    search.ts            recherche multi-objets
  data/              Accès aux données
    DataProvider.ts      contrat commun
    excel/               ExcelDataProvider, worker, lecteur xlsx, parser/mapping
    api/                 ApiDataProvider (squelette pour les futures API)
    referentiels/        geo.api.gouv.fr, géocodage BAN, fichiers QPV/zonages
  geo/               Calculs spatiaux (QPV, distances, enrichissement)
  map/               Moteur cartographique MapLibre (fonds, patrimoine, référentiels)
  store/             État applicatif (Zustand), chargement, navigation
  ui/                Composants d'interface (header, panneaux, fiche, légende…)
  export/            Export Excel et image
scripts/             Génération du jeu de démo, téléchargement des référentiels
tests/               Tests unitaires
```

## Parcours couverts (critères d'acceptation)

| # | Fonction | Où |
|---|---|---|
| 1–2 | Ouverture cadrée sur Bretagne + Loire-Atlantique | `app.config.ts → initialBounds` |
| 3–6 | Patrimoine par niveaux : communes → résidences → bâtiments → logements | Automatique selon le zoom, ou forcé (panneau Patrimoine) |
| 7 | Fonds : neutre, plan N&B, plan couleur, satellite | Panneau Couches |
| 8–10 | Afficher/masquer, opacité, couleur, épaisseur, taille, libellés, ordre | Panneau Couches → ⚙ |
| 11–14 | Couleur par agence ou par métier, taille = nb de logements, légende automatique | Panneau Patrimoine |
| 15–16 | Clic légende = filtre ; œil = masquer | Légende flottante ou panneau |
| 17–21 | Recherche adresse (BAN), résidence, logement (code/RPLS), commune, EPCI, agence | Barre de recherche (`/` ou Ctrl+K) |
| 22–24 | Fiche contextualisée + navigation vers les objets liés | Panneau de droite |
| 25–28 | QPV, tampon 300 m, zonages APL, Pinel | Panneau Couches → Limites / Zonages |
| 29–30 | Communes / EPCI avec patrimoine, colorés par agence (hachures si plusieurs) | Couches → Communes / EPCI → ⚙ |
| 31 | Filtres combinés (agence, commune, EPCI, résidence, QPV, APL, Pinel, rôles) | Panneau Filtres + bandeau des filtres actifs |
| 32–33 | Export Excel (périmètre filtré) et image (carte + légende + titre) | Bouton Exporter |

## Limitations actuelles du POC

- **Données** : jeu synthétique ; les rôles *conseiller commercial*, *gérant immobilier* et
  *travailleur social* n'existent pas dans les tables DWH fournies → feuille optionnelle
  `Affectations` (hypothèse à valider). Le *conseiller social* provient de
  `DWH.Client.Nom_prenom_CSR_referent`.
- **Positions des logements** : un logement n'a pas de coordonnées propres ; il hérite de celles de
  sa cage (ou de son adresse) et est affiché en spirale autour (position schématique, signalée).
- **Référentiels non vérifiés depuis l'environnement de développement** (réseau sortant restreint) :
  les URLs des services publics sont issues de leur documentation. En particulier, la couche WMS
  « zones inondables » (nom de couche Géorisques) et la recherche automatique des jeux QPV / APL / ABC
  sur data.gouv.fr doivent être confirmées au premier lancement (voir docs/SOURCES.md).
- **Tout le patrimoine est chargé en mémoire** (≈ 30 000 logements, quelques Mo) : optimal à cette
  volumétrie, pas au-delà de ~200 000 objets (voir stratégie de chargement par emprise dans
  docs/API_MIGRATION.md).
- Les communes multi-agences sont représentées par un camembert (agrégats) ou par la couleur de
  l'agence majoritaire + hachures + libellé « n agences » (polygones) ; pas de camemberts sur polygones.
- Pas d'authentification ni de gestion de droits (hors périmètre) ; pas de sauvegarde de cartes ;
  pas de sélection spatiale avancée ; pas de PDF.
- Recherche d'adresses BAN : dépend de la disponibilité du service public ; en cas d'échec,
  la recherche se limite au patrimoine (message affiché).
- Accessibilité : navigation clavier sur les panneaux, la recherche et la légende ; la carte
  elle-même reste une interaction souris.

## Prochaines étapes recommandées

1. Charger un **extrait réel** du DWH et valider le mapping (notamment le rattachement Lot → cage).
2. Confirmer la source des rôles métier (commercial, gérant, travailleur social) et adapter
   `excel.mapping.ts` ou l'`ApiDataProvider`.
3. Exposer les données via une **API interne** (ou un BFF) et brancher `ApiDataProvider`
   (voir docs/API_MIGRATION.md), avec authentification SSO de l'intranet.
4. Héberger en interne les référentiels (QPV, zonages, contours) avec un job de mise à jour
   annuel ; éventuellement servir le patrimoine en **tuiles vectorielles** (PostGIS + Martin /
   pg_tileserv) si la volumétrie ou le nombre d'utilisateurs augmente fortement.
5. Remplacer les polices de libellés (`app.config.ts → glyphs`) et le fond « neutre » CARTO par
   des ressources auto-hébergées ou IGN pour ne dépendre que de services souverains.
6. Ajouter tests end-to-end (Playwright) sur les parcours clés et une CI.
7. Ultérieurement : sélection spatiale, cartes sauvegardées/partagées, export PDF.

## Lancer sans Node.js (VS Code + Live Server)

Le dossier `app-statique/` contient l'application déjà construite. Dans VS Code, installez
l'extension **Live Server** (Ritwick Dey), puis clic droit sur `app-statique/index.html` →
**Open with Live Server**. Ne pas ouvrir le fichier par double-clic (`file://` est bloqué par le navigateur).

## Administration (experts)

Page `#/admin` (icône de réglages en haut à droite) : source de données Excel, fonds de carte,
couches (activation, source fichier/API, style par défaut, réglages laissés aux utilisateurs,
affichage au démarrage), onglets, filtres, critères de couleur, exports, URLs des services.

Le site étant statique, la configuration est un fichier **`config/site.json`** :
« Prévisualiser » l'enregistre en brouillon dans le navigateur de l'administrateur ;
« Télécharger site.json » puis dépôt dans `public/config/` (ou `app-statique/config/`) la publie
pour tous. Sans fichier, les valeurs par défaut du code s'appliquent. L'accès à `#/admin` doit être
restreint par le serveur web / SSO au déploiement.

### Exports types

Modèles définis en administration (section « Exports types ») : types de zone proposés
(résidence, commune, EPCI, département, agence), fond, couches, symbologie, représentation,
taille des éléments, libellés, format (A4, 16:9…), résolution, marge et zoom maximal.
Côté utilisateur, bouton « Exports types » : modèle → zone → carte dynamique cadrée, image PNG
(rendue hors écran à la taille du modèle, indépendamment de l'écran), ou les deux.
