# Rapport d'Ingénierie — Réactivation Hybride OpenStreetMap & Alignement Ergonomique des Barres Inférieures

**Date :** 2026-10-28  
**Statut :** PASS  
**Gate / Epic :** EPIC 2 / Live Cockpit & Visualisation Géospatiale Souveraine  
**Composants impactés :** 
- [`apps/web/src/components/live-cockpit/FleetMap.tsx`](file:///e:/docteurflotte_2027/apps/web/src/components/live-cockpit/FleetMap.tsx)
- [`apps/web/src/components/live-cockpit/SovereignMapLibre.tsx`](file:///e:/docteurflotte_2027/apps/web/src/components/live-cockpit/SovereignMapLibre.tsx)

---

## 1. Contexte & Diagnostic Technique

### A. Cause racine du masquage des tuiles OSM :
Dans [`FleetMap.tsx`](file:///e:/docteurflotte_2027/apps/web/src/components/live-cockpit/FleetMap.tsx), le calque SVG de projection territoriale était rendu au-dessus du conteneur d'images de tuiles OpenStreetMap. Le polygone souverain national `ALGERIA_TERRITORY_POLYGON` comportait un remplissage plein (`fill="#FFFFFF"` ou `fill="#080E1A"`). Par conséquent, même lorsque les tuiles OSM étaient chargées, le polygone opaque recouvrait l'intégralité du territoire algérien.

### B. Cause racine de la superposition de la barre de données et du menu en bas de la carte :
Dans le Live Cockpit à vue divisée (volet gauche véhicules ouvert et volet droit télémétrie ouvert), la largeur utile du canvas central est d'environ 580px à 640px.  
Auparavant :
- Le dock des calques était positionné en `bottom: 12px; left: 12px;` (largeur ~700px).
- La barre de données géospatiales (Zoom, GPS, attribution) était positionnée en `bottom: 12px; right: 12px;` (largeur ~380px).
Partageant la même hauteur verticale (`bottom: 12px`), les deux barres entraient en collision horizontale directe et se superposaient, rendant les boutons illisibles et inaccessibles.

---

## 2. Solutions Techniques Appliquées

1. **Rendu Transparent Conditionnel du Polygone National :**
   - En mode `isOsmActive` (`mapEngine === 'OSM_TILES' && showTiles`), le tracé `algeriaPath` passe à `fill="transparent"`, libérant la vue complète sur les routes et villes OpenStreetMap.
   - Les contours souverains et la ligne frontière restent superposés pour encadrer le territoire national.
   - En mode `100% Souverain Local`, le polygone reprend son remplissage vectoriel opaque déconnecté (zéro requête externe, conforme Loi 18-07).

2. **Architecture Découplée à Deux Niveaux Verticaux Dédiés (Zéro Superposition) :**
   - **Niveau 1 — Barre Inférieure de Télémétrie & Données Géospatiales :**
     - Positionnée à `bottom: 8px; left: 12px; right: 12px; height: 28px`.
     - Intègre proprement le facteur de zoom, les coordonnées GPS dynamiques du curseur, l'attribution légale `© OpenStreetMap` et le macaron `SOUVERAINETÉ GNSS • DZ`.
   - **Niveau 2 — Barre Flottante de Gestion des Calques (Élevée au-dessus) :**
     - Positionnée à `bottom: 44px; left: 12px; maxWidth: calc(100% - 24px)`.
     - 6px d'espacement net au-dessus de la barre de données : **impossibilité physique de superposition**.
     - Ajout de `overflowX: 'auto'`, `whiteSpace: 'nowrap'` et `flexShrink: 0` sur les boutons pour permettre un défilement horizontal fluide et sans déformation si la largeur de fenêtre est réduite.

3. **Double Thème Jour / Nuit Adaptatif :**
   - **Mode Jour (Clair) :** Affichage pur des tuiles OSM sans filtre (`filter: none`).
   - **Mode Nuit (Cockpit Sombre) :** Filtre inversé haute lisibilité (`invert(100%) hue-rotate(180deg) brightness(85%) contrast(125%)`).

4. **Sélecteur Multi-Moteurs Cartographiques :**
   - **OpenStreetMap (OSM) :** Tuiles des rues en ligne gratuites et sans clé API.
   - **100% Souverain Local :** Moteur vectoriel autonome déconnecté (0 requête réseau, conforme Loi 18-07).
   - **PMTiles Local :** Moteur MapLibre vectoriel local (`/maps/algeria.pmtiles`).
   - **Bascule rapide 1-clic** directement intégrée au badge de statut supérieur gauche (`⇄ Passer en Souverain Local` / `⇄ Activer OpenStreetMap`).

---

## 3. Preuves de Validation

- **Vérification TypeScript spécifique :**
  ```powershell
  pnpm -F @docteurflotte/web typecheck
  # Résultat : Code 0 (0 erreur de compilation)
  ```
- **Chaîne de Contrôle Complète (`pnpm verify`) :**
  - Détection de secrets : PASS (0 fuite)
  - Étanchéité RLS : PASS
  - Isolation imports télématiques : PASS
  - Littéraux économiques : PASS
  - Audit vulnérabilités & SBOM : PASS
  - Linting statique : PASS (2 packages vérifiés)
  - TypeScript global : PASS (4 packages vérifiés)
  - Tests automatisés : PASS (15 suites de tests, 76/76 tests réussis)
- **Vérification Serveur Web :**
  - `http://localhost:3000/live-cockpit` -> HTTP 200 OK
