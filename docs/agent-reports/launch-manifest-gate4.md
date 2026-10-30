# Launch Manifest — Gate 4 : Cœur Décisionnel & Contrôle de Gestion

**Date :** 2026-10-24  
**Objectif :** Implémenter le moteur décisionnel d'arbitrage économique de maintenance, le calcul du coût de l'inaction, les budgets prévisionnels vs dépenses réelles, et le kit de déploiement VPS de production.

---

## 1. Références et Contrat Maître

- **Skill appliqué :** `.agents/skills/maintenance-economics-decision/SKILL.md`
- **Règles `AGENTS.md` v1.1 :**
  - Section 0.1 : Décisionnel et contrôle de gestion au cœur de la valeur.
  - Section 1.4 : Zéro constante cachée (tous les barèmes proviennent de `tenant_settings`).
  - Section 1.5 : Zéro risque de fuite multi-tenant (RLS sur les décisions et budgets).
  - Section 5.4 : Explicabilité totale, score de confiance et traçabilité des hypothèses.

---

## 2. Découpage en Sous-Agents Spécialisés

### Sous-Agent 1 : `decision-contracts-and-db`
- `packages/contracts/src/decisions.ts` : Types canoniques décisionnels, DTOs d'approbation et rapports d'écarts.
- `packages/contracts/src/index.ts` : Export des nouveaux contrats.
- `apps/api/src/database/database.service.ts` : Tables `decision_recommendations`, `maintenance_budgets` avec RLS Fail-Closed (`df_tenant_role`).

### Sous-Agent 2 : `decision-engine-and-service`
- `apps/api/src/decisions/decision-rules.engine.ts` : Moteur de règles déterministes versionnées.
- `apps/api/src/decisions/decisions.service.ts` : Évaluation du coût de l'inaction (remorquage + casse + perte d'exploitation journalière), approbation vers WorkOrder, analyse d'écarts.
- `apps/api/src/decisions/decisions.controller.ts` : Endpoints REST `/decisions/*`.
- `apps/api/src/decisions/decisions.module.ts` & enregistrement dans `app.module.ts`.

### Sous-Agent 3 : `decision-tests-verifier`
- `apps/api/src/decisions/decisions.service.spec.ts` : Tests unitaires de rentabilité, confiance et explicabilité.
- `apps/api/test/decisions.e2e-spec.ts` : Tests E2E de la boucle Décision → Action → Résultat sous RLS.

### Sous-Agent 4 : `vps-deployment-kit`
- `apps/api/Dockerfile` : Image Docker de production NestJS multi-stage.
- `apps/web/Dockerfile` : Image Docker de production Next.js standalone multi-stage.
- `infra/compose.prod.yaml` : Stack de production complète (PostgreSQL 16, Redis 7, Traccar 6.15.2, API NestJS, Web Next.js, Caddy SSL automatique).
- `docs/architecture/vps-deployment-guide.md` : Guide d'exploitation VPS pas à pas.

### Sous-Agent 5 : `reviewer-audit-gate4`
- Audit indépendant de conformité selon `docs/agent-roles/reviewer.md`.
