# Rapport d'Ingénierie : Séparation Étanche Mode Démo / Sandbox vs Parc Réel Tenant & Accès Public Sans Connexion

**Date :** 2026-10-28  
**Référence :** `AGENTS.md` v3.0 §1, §3 & `MASTER_SPEC.md` v2.0  
**Statut :** PASS  

---

## 1. Contexte & Problématique Résolue

Pour commercialiser la solution SaaS auprès d'entreprises algériennes de référence (Logistique, BTP, Hydrocarbures) et rivaliser avec les standards mondiaux (Samsara, Geotab, Fleetio) :
1. **Zéro pollution des comptes réels** : Tout nouveau tenant inscrit hérite désormais d'un statut `data_origin = 'USER_ENTRY'` (au lieu de `DEMO` auparavant) avec un parc initialement propre (`0 véhicules`). Si un client n'a pas encore saisi d'actif, la plateforme affiche un état d'onboarding haute fidélité explicable, sans mélanger ses données réelles avec les véhicules fictifs de démonstration.
2. **Accès Démo Interactif Public Sans Connexion (Guest Sandbox)** : N'importe quel prospect ou visiteur peut désormais tester l'intégralité du produit (Cockpit télématique live, carte 3-modes Valhalla/GPS/CAN, inspection DVIR bilingue FR/AR RTL, réconciliation tickets Naftal avec preuve CUSUM, et GMAO en boucle fermée) **sans avoir à créer de compte ni à se connecter**.
3. **Commutateur Dynamique Parc Réel vs Mode Démo** : Un client connecté dispose dans la barre supérieure d'un commutateur segmented pill permettant de basculer à tout moment entre ses données de production et la simulation de formation, sans qu'aucune action en mode démo ne vienne écrire dans ses hypertables réelles.

---

## 2. Architecture Technique Déployée

### 2.1 Backend (`apps/api`)
- `apps/api/src/auth/auth.service.ts` :
  - Création du tenant avec `data_origin = DataOrigin.USER_ENTRY` (isolation absolue des organisations de production).
- `apps/api/src/auth/auth.service.spec.ts` :
  - Validation du test de régression unitaire (6/6 tests PASS).

### 2.2 Contexte Global & Switcher UI (`apps/web`)
- `apps/web/src/context/DemoModeContext.tsx` :
  - Fournit `isDemoMode`, `isGuest`, `toggleDemoMode()`, et `session`.
  - Résolution automatique :
    - Si visiteur non authentifié : `isGuest = true`, `isDemoMode = true` (Sandbox actif par défaut).
    - Si client connecté : `isGuest = false`, `isDemoMode = false` par défaut (stocké dans `localStorage.getItem('df_demo_mode_active')`).
- `apps/web/src/components/navigation/DemoModeBanner.tsx` :
  - Bandeau contextuel élégant amber/bleu informant l'utilisateur du mode actif avec CTAs directs (*« Créer mon Espace Réel »*, *« Connexion »*, ou *« Basculer vers mon Parc Réel »*).
- `apps/web/src/components/navigation/DemoModeToggle.tsx` :
  - Commutateur segmented pill intégré dans `Navbar.tsx` et `TopGlobalNavbar.tsx`.

### 2.3 Modules Adaptés
- **Live Cockpit (`apps/web/src/app/live-cockpit/page.tsx` & `useTelemetryStream.ts`)** :
  - En mode démo : cinématique temps réel des 7 unités algériennes (RN1, A1, CAN J1939).
  - En mode réel : chargement des actifs PostgreSQL du tenant via `AssetClient.listAssets(token)`.
  - Si 0 actif en base réelle : affichage d'un panneau d'accueil vide professionnel avec accès 1-clic pour ajouter un actif ou tester la simulation.
  - Suppression de tout crash si `fleet.length === 0`.
- **Catalogue d'Actifs (`apps/web/src/app/assets/page.tsx`)** :
  - Suppression définitive du contournement `AuthClient.login('demo@docteurflotte.dz', 'Demo1234!')`.
  - En mode démo : consultation du catalogue des 7 modèles de référence.
  - En mode réel : gestion exclusive des actifs de l'organisation sous RLS.
- **DVIR Mobile/Terrain (`apps/web/src/app/dvir/page.tsx`)** :
  - En mode réel avec 0 véhicule : invitation propre à enregistrer un véhicule ou à tester en mode démo.
- **Scanner Carburant Naftal (`apps/web/src/app/fuel-scanner/page.tsx`)** :
  - En mode démo/visiteur : 3 reçus Naftal algériens réalistes (Chéraga, Rouiba, Ghardaïa) avec modal de preuve CUSUM immédiate.
- **GMAO & Télématique (`work-orders/page.tsx` & `telematics/page.tsx`)** :
  - Élimination des redirections forcées vers `/login` pour les visiteurs en mode démo.

---

## 3. Preuves de Validation & Quality Gate

- **Sécurité & Secrets :** 0 secret détecté dans le code source.
- **Étanchéité Multi-Tenant RLS :** 12/12 tables contrôlées avec `rowsecurity = true`.
- **Contrôle TypeScript :** 0 erreur sur l'ensemble des 4 packages (`turbo run typecheck`).
- **Tests Automatisés :**
  ```text
  Test Suites: 19 passed, 19 total
  Tests:       148 passed, 148 total
  Snapshots:   0 total
  Time:        39.103 s
  ```
- **Chaîne Complète :** `pnpm verify` : 8/8 contrôles au statut `SUCCÈS`.

