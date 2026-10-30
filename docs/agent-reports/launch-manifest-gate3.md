# Launch Manifest — Gate 3 : Télématique Traccar & Ingestion Idempotente

**Date :** 2026-10-24  
**Objectif :** Implémenter la Gate 3 de la feuille de route : Couche télématique découplée avec adaptateur Traccar auto-hébergé, ingestion idempotente (dédoublonnage), appairage d'actifs (`AssetDeviceBinding`), mise à jour automatique des compteurs et console télématique de pointe.

---

## 1. Références et Contrat Maître

- **Skill appliqué :** `.agents/skills/traccar-integration/SKILL.md`
- **Règles `AGENTS.md` v1.1 :**
  - Section 0.1 : Couche télématique découplée via adaptateur canonique `ITelematicsProvider`.
  - Section 1.5 : Zéro Fuite Multi-Tenant (RLS sur les tables télématiques).
  - Section 1.6 : Zéro Secret Exposé (aucun token Traccar ou mot de passe dans les logs ou le frontend).
  - Section 8.3 : Dédoublonnage strict et traitement idempotent des messages.

---

## 2. Découpage en Sous-Agents Spécialisés

### Sous-Agent 1 : `telematics-contracts-and-db`
- `packages/contracts/src/telematics.ts` : Types canoniques, DTOs d'ingestion et d'appairage.
- `packages/contracts/src/index.ts` : Export des nouveaux contrats.
- `apps/api/src/database/database.service.ts` : Tables `telematics_devices`, `asset_device_bindings`, `telematics_positions` avec contraintes uniques d'idempotence et politiques RLS Fail-Closed (`df_tenant_role`).

### Sous-Agent 2 : `telematics-service-and-api`
- `apps/api/src/telematics/telematics.interface.ts` : Contrat d'abstraction `ITelematicsProvider`.
- `apps/api/src/telematics/traccar-adapter.service.ts` : Adaptateur Traccar avec gestion des erreurs réseau, retry et tolérance aux pannes.
- `apps/api/src/telematics/telematics.service.ts` : Gestion des boîtiers, appairage d'actifs, ingestion idempotente avec mise à jour automatique des compteurs et alertes d'entretien.
- `apps/api/src/telematics/telematics.controller.ts` : Endpoints REST sécurisés par JWT et RLS.
- `apps/api/src/telematics/telematics.module.ts` & enregistrement dans `apps/api/src/app.module.ts`.

### Sous-Agent 3 : `telematics-tests-verifier`
- `apps/api/src/telematics/telematics.service.spec.ts` : Tests unitaires d'idempotence, dédoublonnage, panne Traccar et appairage.
- `apps/api/test/telematics.e2e-spec.ts` : Tests E2E validant l'ingestion de trames, la non-régression et l'étanchéité inter-tenant sous RLS.

### Sous-Agent 4 : `telematics-ui-console`
- `apps/web/src/lib/api-telematics.ts` : Client API pour les flux télématiques.
- `apps/web/src/app/telematics/page.tsx` : Console de supervision télématique en direct (style Samsara Fleet Live x Flespi) avec statuts des boîtiers, vitesses, contacts ACC, compteurs synchronisés et modale d'appairage.
- Mise à jour du lien télématique dans la barre de navigation.

### Sous-Agent 5 : `reviewer-audit-gate3`
- Audit indépendant de conformité selon `docs/agent-roles/reviewer.md`.
