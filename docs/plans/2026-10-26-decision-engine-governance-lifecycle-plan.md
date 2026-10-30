# Plan d'Implémentation : Cycle de Vie & Gouvernance Active du Moteur Décisionnel (6 Physiques)

> **Contrat d'exécution :** AGENTS.md v2.0 & MASTER_SPEC.md v2.0  
> **Cible :** Console d'Administration SaaS DocteurFlotte (`/admin/decision-engine`)  
> **Objectif :** Permettre la création de nouvelles versions (Draft), l'édition paramétrique des 6 modèles physiques, la simulation d'impact, l'approbation Maker-Checker et l'activation transactionnelle immuable en production.

---

## 1. Architecture & Principes Directeurs

1. **Zéro Hardcode & Immuabilité :** Une configuration approuvée (`APPROVED`) ou publiée (`ACTIVE`) est strictement immuable en base de données. Toute modification exige la création ou l'édition d'une version de travail (`status = 'DRAFT'`).
2. **Calcul d'Empreinte Canonique SHA-256 :** Chaque configuration possède un `canonical_content_hash` calculé sur la sérialisation JSON triée et déterministe de tous ses paramètres physiques.
3. **Maker-Checker Obligatoire :** Respect de la contrainte PostgreSQL `chk_maker_checker_distinct` : l'approbateur doit être distinct de l'auteur pour passer au statut `APPROVED`.
4. **Activation Transactionnelle :** Passage en production via la procédure stockée `fn_activate_platform_config` (verrou `pg_advisory_xact_lock`, clôture de l'ancienne publication, journal append-only et outbox Redis).
5. **Simulation & Banc d'Essai Intégré :** Visualisation immédiate des répercussions physiques et économiques sur 3 profils de véhicules types avant publication.

---

## 2. Décomposition des Tâches

### Tranche 1 : Contrats TypeScript & DTOs de Validation
- [x] Définir les types TypeScript complets dans `packages/contracts/src/platform-admin.ts` :
  - `CreateDecisionConfigDto`
  - `UpdateDecisionConfigDto`
  - `DecisionEngineSimulationParams`
  - `DecisionEngineSimulationResult`
- [x] Créer les DTOs NestJS avec `class-validator` dans `apps/api/src/admin/dto/decision-config.dto.ts`.
- [x] Exécuter le build de `@docteurflotte/contracts`.

### Tranche 2 : Services Backend NestJS & Contrôleur
- [x] Implémenter dans `apps/api/src/admin/services/admin-decision-engine.service.ts` :
  - `computeCanonicalHash(params)` (SHA-256 trié déterministe)
  - `createDraftConfig(dto, authorEmail)`
  - `updateDraftConfig(id, dto, authorEmail)` (avec verrou d'immuabilité)
  - `approveConfig(id, approverEmail)` (avec Maker-Checker)
  - `simulateConfig(params)` (banc d'essai physique sur 3 profils de véhicules)
- [x] Exposer les routes dans `apps/api/src/admin/admin.controller.ts` :
  - `POST /admin/decision-engine/drafts`
  - `PUT /admin/decision-engine/drafts/:id`
  - `POST /admin/decision-engine/drafts/:id/approve`
  - `POST /admin/decision-engine/simulate`
- [x] Ajouter les tests unitaires dans `apps/api/src/admin/admin.service.spec.ts`.

### Tranche 3 : Client SDK Frontend
- [x] Mettre à jour `apps/web/src/lib/api-platform-admin.ts` avec les méthodes du cycle de vie.

### Tranche 4 : Interface Utilisateur Haute-Fidélité (`/admin/decision-engine`)
- [x] Modifier `apps/web/src/app/admin/decision-engine/page.tsx` pour intégrer :
  - Modal / Tiroir d'édition complète des 6 algorithmes physiques découpé en onglets clairs.
  - Boutons « ➕ Nouvelle Version (Draft) » et « 📋 Dupliquer ».
  - Panneau de simulation interactive en direct.
  - Diff visuel entre la version courante et la version active en production.
  - Workflow d'approbation Maker-Checker et bouton d'activation sécurisé.

### Tranche 5 : Validation & Garde-fous
- [x] Exécuter `pnpm --filter=@docteurflotte/api typecheck` et `pnpm --filter=@docteurflotte/web typecheck`.
- [x] Exécuter la suite de tests automatisés NestJS (`jest`).
- [x] Valider l'ensemble de la chaîne `verify-all.cjs`.
