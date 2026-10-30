# STRATÉGIE DE TEST GLOBALE (TEST STRATEGY & QUALITY GATES)

**Statut :** DOCUMENT TECHNIQUE DE RÉFÉRENCE  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/architecture/core-architecture.md`, `scripts/guardrails/verify-all.cjs`  

---

## 1. Pyramide de Tests DocteurFlotte

```
           / \
          /   \     E2E Parcours Démo & Activation (Playwright / Cypress)
         /-----\
        /       \    Tests d'Intégration & Isolation Multi-Tenant (Supertest + PostgreSQL RLS)
       /---------\
      /           \   Tests de Propriétés (Fast-Check : compteurs, sauts, devises)
     /-------------\
    /               \  Tests Unitaires Purs (Jest / Vitest : domaines, règles, calculs)
   -------------------
```

---

## 2. Paliers et Types de Tests

### 2.1 Tests Unitaires & Règles Métier
- **Cible :** Moteur décisionnel, validation des compteurs, calcul d'écarts budgétaires, transition des statuts d'ordres de travail.
- **Exigence de couverture ciblée :**
  - Moteur de règles déterministes : `PROPOSÉ — Minimum 90% de couverture de branches (À VALIDER PAR LE FONDATEUR)`.
  - Modules d'autorisation / rôles : `PROPOSÉ — 100% de couverture des cas nominaux et d'échec (À VALIDER PAR LE FONDATEUR)`.

### 2.2 Tests de Propriétés (Property-Based Testing)
- **Outil recommandé :** `fast-check`
- **Périmètre critique :**
  - **Compteurs :** Vérifier qu'un relevé inférieur au précédent est systématiquement rejeté ou marqué anomalie, quelles que soient les valeurs aléatoires générées.
  - **Calculs de coûts et TVA :** Vérifier l'invariance des conversions de centimes et arrondis monétaires.
  - **Écarts budgétaires :** Propriété de linéarité : $\text{Écart}(A + B) = \text{Écart}(A) + \text{Écart}(B)$.

### 2.3 Tests d'Isolation Multi-Tenant (RLS & Routes)
- **Génération automatique :** Une suite de tests d'intégration parcourt la liste réelle des contrôleurs et routes enregistrées dans NestJS.
- **Principe d'exécution :**
  1. Créer deux tenants de test étanches : `Tenant_Alpha` et `Tenant_Beta`.
  2. Créer une ressource (actif, ordre de travail) sous `Tenant_Alpha`.
  3. Exécuter chaque route de lecture (`GET /assets/:id`), écriture (`PUT /assets/:id`, `DELETE /assets/:id`) avec le jeton et le contexte de `Tenant_Beta`.
  4. Vérifier que la réponse est obligatoirement `404 Not Found` ou `403 Forbidden` (échec fermé systématique).

### 2.4 Tests d'Intégration sur Vraie Base PostgreSQL
- Les tests d'intégration s'exécutent contre le conteneur PostgreSQL réel (`infra/compose.yaml`, port `5434`), avec les politiques RLS activées et `SET LOCAL app.current_tenant_id`.
- Interdiction d'utiliser des mocks en mémoire (comme sqlite ou h2) pour valider la sécurité RLS.

### 2.5 Tests E2E du Parcours d'Activation Démo
- Scénario nominal de démonstration testé de bout en bout :
  1. Inscription nouvel utilisateur.
  2. Chargement du dashboard avec données `DEMO`.
  3. Consultation d'une décision de maintenance proposée.
  4. Transformation en ordre de travail simulé.
  5. Réinitialisation / purge contrôlée des données `DEMO`.

---

## 3. Déclenchement et Intégration Continue

| Type de Test | Environnement | Déclenchement | Commande |
| :--- | :--- | :--- | :--- |
| **Garde-fous & Lint** | Machine locale & CI | Pré-commit & Pull Request | `pnpm verify` |
| **Unitaires & Types** | Machine locale & CI | Pull Request | `pnpm run test` & `pnpm run typecheck` |
| **Intégration RLS** | Environnement avec Docker PostgreSQL | Merge vers `main` & Staging | `pnpm run test:e2e` (en Gate 1) |
| **E2E Démo** | Environnement Staging | Déploiement Staging | `pnpm run test:demo-e2e` (en Gate 6) |
