# Architecture

## 1. Analyse du besoin

| Contrainte | Conséquence |
|---|---|
| 20–30 k logements, 12 k bâtiments, 8 k résidences, 10 agences | Volumétrie **faible** pour un moteur WebGL : le patrimoine complet tient en mémoire (≈ 5–10 Mo). Pas besoin de serveur de tuiles pour le POC. |
| ≤ 80 utilisateurs simultanés | Le calcul (filtres, agrégats, symbologie) se fait côté navigateur : le serveur ne sert que des fichiers statiques. Montée en charge triviale. |
| Excel aujourd'hui, API demain | Couche d'abstraction `DataProvider` + modèle normalisé ; aucun nom de colonne hors du mapping. |
| Référentiels publics multiples (IGN, INSEE, ANCT, Géorisques…) | Catalogue de couches déclaratif (`layers.config.ts`) avec fiche source/millésime ; chargement paresseux et tolérant aux pannes. |
| UX « SaaS métier », pas SIG | Pas de TOC technique : panneaux par usage (Patrimoine / Couches / Filtres / Analyse), fiche objet à droite, recherche unique. |

## 2. Stack et justification

| Brique | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript strict | Modèle métier typé, refactoring sûr lors du passage aux API. |
| UI | React 19 + Vite | Standard, écosystème, build statique rapide. |
| Carte | **MapLibre GL JS** (WebGL) | Open source, rendu GPU fluide avec des dizaines de milliers de points, expressions de style data-driven (couleur/taille par attribut), support raster WMTS/WMS et GeoJSON découpé en tuiles dans un worker (geojson-vt). Leaflet serait limité à ~10 k marqueurs ; OpenLayers est plus « SIG » et plus verbeux. |
| État | Zustand | Store minimal, sélecteurs fins → rendus ciblés. |
| Excel (import) | Lecteur xlsx dédié (fflate + XML) dans un **Web Worker** | ~10× plus rapide qu'ExcelJS sur 30 k lignes (1,3 s vs 6,4 s mesurés), UI jamais bloquée. |
| Excel (export) | ExcelJS (chargé à la demande) | Feuilles formatées (en-têtes, filtres, volets figés). |
| Projections | proj4 | Lambert-93 (EPSG:2154) → WGS84 dans la couche d'intégration. |
| Géométrie | Turf (`@turf/buffer`) + fonctions dédiées | Tampon 300 m ; point-dans-polygone et distance optimisés (pré-filtre par emprise). |
| Tests | Vitest | Domaine et intégration testés sans navigateur. |

**Backend** : aucun pour le POC (site statique). Pour la cible, un backend-for-frontend léger
(ou directement les API du bailleur) exposera le patrimoine ; le frontend ne change pas.

## 3. Architecture en couches

```
┌──────────────────────── UI (src/ui) ────────────────────────┐
│ Header · Recherche · Panneaux · Légende · Fiche · Import    │
└──────────────┬──────────────────────────────┬───────────────┘
               │ état (store)                 │ actions
┌──────────────▼──────────────┐  ┌────────────▼───────────────┐
│ Store (src/store)           │  │ Cartographie (src/map)     │
│ filtres, symbologie, sélect.│─▶│ MapLibre : fonds, couches  │
│ bootstrap / navigation      │  │ patrimoine, référentiels   │
└──────────────┬──────────────┘  └────────────────────────────┘
               │ modèle normalisé
┌──────────────▼──────────────────────────────────────────────┐
│ Domaine (src/domain) — PatrimoineIndex, symbologie, search  │
│ Services géo (src/geo) — QPV, distances, enrichissement     │
└──────────────┬──────────────────────────────────────────────┘
               │ PatrimoineDataset
┌──────────────▼──────────────────────────────────────────────┐
│ Accès aux données (src/data)                                │
│  DataProvider ─┬─ ExcelDataProvider (worker + mapping)      │
│                └─ ApiDataProvider (futur)                   │
│  Référentiels : geo.api.gouv.fr, BAN, fichiers QPV/zonages  │
└─────────────────────────────────────────────────────────────┘
Configuration (src/config) : utilisée par toutes les couches.
```

Règles :
- l'UI et la carte ne consomment que `domain/model.ts` ; seul `data/excel/excelParser.ts` lit `excel.mapping.ts` ;
- le choix du provider est fait en un seul endroit (`App.tsx`) ;
- toute erreur de source est convertie en message utilisateur (`DataSourceError`, `ServiceError`) ;
  le détail technique ne va qu'en console.

## 4. Modèle de données

```
Agence (Organisation niv. 1)
  └─ Residence  (Patrimoine niv. 1 — ensemble résidentiel)
       └─ Batiment (Patrimoine niv. 2 — adresse)
            └─ Cage   (Patrimoine niv. 3 — cage d'escalier)
                 └─ Logement (Lot [+ Client])
```

| Entité | Champs clés | Remarques |
|---|---|---|
| `Agence` | id (= Code_niveau_organisation_1), nom | Reconstituée depuis Patrimoine si la feuille Organisation manque. |
| `Residence` | id, code, nom, agenceId, position, communeInsee, batimentIds, nbLogements, responsables | Position = source, sinon barycentre des bâtiments. |
| `Batiment` | id, code, residenceId, adresse, position, cageIds, logementIds, nbLogements | Position = source, sinon barycentre des cages, sinon résidence. |
| `Cage` | id, batimentId, position, logementIds | Position héritée du bâtiment si absente. |
| `Logement` | id (ID_lot), code, rpls, cage/bâtiment/résidence, agenceId, typologie, surface, état, occupe, responsables | Aucune donnée nominative locataire importée. |
| `Responsables` | conseillerCommercial, gerantImmobilier, conseillerSocial, travailleurSocial | Hérités résidence → bâtiment → logement ; CSR = valeur dominante des logements pour la résidence. |
| `Commune`, `Epci` | issus de geo.api.gouv.fr | EPCI rattaché via la commune. |
| `GeoContext` | epci, qpv (inclusion), distance au QPV, zone APL, zone Pinel | Calculé pour chaque résidence et bâtiment ; le logement prend celui de son bâtiment. |

`positionSource` (`source` / `derivee` / `absente`) est conservé pour signaler les positions approximatives.

## 5. Mapping Excel → modèle

Défini dans `src/config/excel.mapping.ts` (alias de colonnes, champs obligatoires, feuilles facultatives).

| Feuille | Utilisation | Colonnes clés |
|---|---|---|
| `DWH.Organisation` (facultative) | Agences = lignes de niveau 1 valides | ID_organisation, Niveau_organisation, Code_niveau_organisation_1, Libelle_organisation |
| `DWH.Patrimoine` (obligatoire) | Niveau 1/2/3 → Résidence / Bâtiment / Cage ; lignes annulées ou hors validité exclues | ID_patrimoine, Niveau_patrimoine, Code_niveau_patrimoine_1..3, Libelle_patrimoine, ID_organisation, Adresse(_complete), Code_INSEE_commune, Latitude, Longitude |
| `DWH.Lot` (facultative) | Logements ; rattachement par ID_patrimoine (cage/adresse/ensemble) sinon par les codes N1/N2/N3 ; lots en fin de gestion exclus | ID_lot, ID_client_lot, ID_patrimoine, ID_RPLS, Code_lot, typologie, surface… |
| `DWH.Client` (facultative) | Occupation + **conseiller social référent** (Nom_prenom_CSR_referent) | ID_client_lot, Indicateur_statut_presence, Date_fin_occupation |
| `Affectations` (facultative, hypothèse POC) | Conseiller commercial, gérant immobilier, travailleur social par code patrimoine | Code_patrimoine, Conseiller_commercial, Gerant_immobilier, Travailleur_social |

Contrôles : feuille/colonne obligatoire absente (erreur bloquante explicite), colonnes facultatives
absentes (info), identifiants manquants, niveaux inconnus, parents introuvables, coordonnées
invalides/hors France (position ignorée), INSEE invalide, logements orphelins. Les anomalies sont
**regroupées** (message + nombre d'occurrences + exemple de ligne) dans le rapport d'import.

Coordonnées : WGS84 ou Lambert-93 détectés par plage de valeurs ; virgule décimale et inversion
lat/lon tolérées ; le fichier est aussi validé (extension, taille max, signature ZIP).

## 6. Niveaux de représentation

| Zoom | Représentation | Justification |
|---|---|---|
| < 9 | **Agrégats par commune** : camembert (répartition selon le critère de couleur), taille ∝ logements, libellé « n lgt · k agences » | Lecture territoriale ; une commune multi-agences n'est jamais réduite à une couleur. |
| 9 – 13,5 | **Ensembles résidentiels** (niveau principal) | ~8 000 points : fluide en WebGL, lisibles grâce à la taille atténuée aux petites échelles. |
| 13,5 – 16,5 | **Bâtiments / adresses** | Données injectées seulement à l'approche de ce niveau. |
| ≥ 16,5 | **Logements** (spirale autour de la cage) | Données injectées seulement à l'approche de ce niveau. |

Seuils dans `app.config.ts → zoom`. L'utilisateur peut **forcer** un niveau (panneau Patrimoine) ;
un message prévient si les logements sont forcés à une échelle où ils se superposent.
Choix : agrégation communale plutôt que clustering automatique, car un cluster anonyme n'a pas
de sens métier (et mélangerait les couleurs d'agences) alors qu'une commune en a un.

## 7. Symbologie

- Couleur : critère au choix (agence, 4 rôles métier, situation QPV, zone APL, zone Pinel).
  Registre `ColorRegistry` : couleurs attribuées dans l'ordre alphabétique de **toutes** les valeurs
  au chargement, puis **figées pour la session** (un filtre ne change jamais une couleur). Valeurs
  absentes → catégorie « Non renseigné » grise. Couleurs d'agences imposables par configuration.
- Taille : fixe ou `r = min + (max − min) · √(min(n, p95) / p95)`. Racine carrée ⇒ surface
  proportionnelle ; plafond au 95ᵉ percentile ⇒ quelques très grosses résidences ne rendent pas
  les autres invisibles. Atténuation supplémentaire aux petits zooms. Curseur d'échelle utilisateur.
- Légende générée depuis les données (valeurs, couleurs, nombre de logements du périmètre) ;
  clic = filtre, œil = masquer.

## 8. Performance

| Mesure | Valeur (jeu démo, 29 859 logements) |
|---|---|
| Lecture + normalisation Excel (worker) | ≈ 2,3 s en Node ; ≈ 2–4 s navigateur, UI non bloquée |
| Recalcul d'un filtre (30 k logements) + rendu | ≈ 150 ms |
| Poids du fichier démo | 7,8 Mo (xlsx) |

Mécanismes : worker pour l'import ; vue filtrée mémoïsée (`useFilteredView`) ; niveaux fins injectés
à la demande ; mise à jour de style par expressions MapLibre (pas de recréation de couches) ;
référentiels chargés paresseusement à la première activation et mis en cache ; filtres
« avec patrimoine » et coloration par agence appliqués par **expressions** (pas de ré-envoi des
géométries communales).

Au-delà (≥ 200 k objets ou besoin de sécurité par agence) : chargement par emprise
(`DataProvider.loadInBounds`) ou tuiles vectorielles servies par PostGIS — voir API_MIGRATION.md.

## 9. Gestion des états et erreurs

Chaque couche a un statut (`loading`, `ready`, `unavailable` = référentiel absent,
`error` = service injoignable) affiché en badge avec message clair. Une couche en échec n'est
retentée qu'après désactivation/réactivation (pas de boucle réseau). Recherche : message
« aucun résultat » ou « service BAN indisponible, recherche limitée au patrimoine ». Import : un
fichier invalide ne remplace pas les données déjà chargées. Fiche d'un objet disparu : message dédié.

## 10. Sécurité

Aucun secret dans le frontend (services publics sans clé) ; fichiers importés lus localement,
validés (extension, taille, signature) et jamais envoyés ; données nominatives des locataires
non importées ; liens externes (fiches IKOS) ouverts en `noopener` et limités à http(s) ;
échappement du HTML des infobulles. L'authentification sera portée par l'intranet / le BFF.
