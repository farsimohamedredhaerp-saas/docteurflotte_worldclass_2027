# ADR-013 — Intégration Globale, Benchmarks Finaux & Clôture de Livraison du Moteur Décisionnel Universel Algérien

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ & LIVRÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Monorepo Intégral (`packages/decision-engine`, `apps/rule-studio`, `apps/client`, `apps/api`, `apps/web`), Harness de Benchmark `scripts/bench-decision-engine.cjs`, Garde-fous CI  

---

## 1. Contexte & Bilan des 12 Phases Réalisées

Le projet de conception et d'implémentation du **Moteur Décisionnel Universel Algérien** (SCF, DGI, Gestion & Audit) franchit son ultime Quality Gate. L'ensemble des 12 phases planifiées ont été exécutées avec un niveau de rigueur d'ingénierie sans compromis :

- **Phase 0 (Socle & Ontologie — ADR-001) :** Primitives `EngineDecimal`, `bitemporal`, calendrier `Africa/Algiers`, garde-fou anti-hardcode `scripts/guardrails/lint-decision-engine-hardcode.cjs`.
- **Phase 1 (Control Plane & Packs — ADR-002) :** Crypto canonique RFC 8785, signature asymétrique Ed25519, résolveur bi-temporel (`LFC > LF`), 7 portes suspensives, migration SQL 08.
- **Phase 2 (Moteur AST Déterministe — ADR-003) :** Interpréteur et compilateur AST sécurisé (closures JS, budgets depth/nodes/operations, anti-pollution prototype), 100% de tests `fast-check` validés, cadence 62 219 ops/s.
- **Phase 3 (Data Plane Grand Livre — ADR-004) :** Table `ledger_entry` append-only, chaînage continu SHA-256 (`prev_hash ‖ canonical_payload`), équilibre débit=crédit garanti en base par trigger différé, 15 schémas de posting JSON, migration SQL 09.
- **Phase 4 (Moteur Comptable & Clôtures SCF — ADR-005) :** CUMP valorisé par la valeur (vidage total à 0.00 DA sans dérive), frais tardifs sur stock nul imputés en charge, amortissements prorata temporis exact en jours et bascule dégressif $\rightarrow$ linéaire, contrats BTPH à l'avancement avec provision pour perte à terminaison $L \times (1 - \alpha)$, Balance Générale et Liasses bilancielles équilibrées.
- **Phase 5 (Moteur Fiscal DGI — ADR-006) :** IBS multi-activités avec comptabilité séparée et sanction à 26% sans compta (LFC 2015), réintégrations sectorielles ciblées, prorata annuel TVA et régularisation quinquennale, liquidation TAP à 0.00 DA post-2024 (art. 14 LF 2024), régimes IFU/ANAE, simulateur de redressement fiscal par impôt distinct en fourchette.
- **Phase 6 (Moteur d'Audit & Fraude Légale — ADR-007) :** Loi de Benford 4 tests, fractionnement de factures (art. 19 bis CPF, sans réintégration d'office), audit de caisse 3 modes (`DAILY_NET`, `SEQUENCED`, `WORST_CASE`), plafonds espèces IBS (300k DA) et TVA (100k DA), syntaxe NIF/NIS/RC, ratios.
- **Phase 7 (Contrôle Budgétaire & Gestion — ADR-008) :** `AnalyticalAxesEngine`, `BudgetControlEngine`, `StandardCostVarianceEngine` (écarts directs $E_{\text{total}} = E_P + E_Q$, écarts indirects 3 axes Budget/Activité/Rendement), `BreakEvenEngine`, `NormativeWcrEngine`, `ManagementDashboardEngine`.
- **Phase 8 (Pilier D1 : Audit Déterministe — ADR-009) :** `CashAuditLedger` (index incrémental partiel, tri canonique local, 100k lignes en 860 ms), `AdvancedInvoiceSplittingDetector` (2 pointeurs glissants), `DeclarationReconciler` (G50 vs compta), `IdentifierBlacklistValidator`, `ProhibitedCashOperationsAuditor` (immobilier art. 207 LF 2025).
- **Phase 9 (Pilier D2 : Audit Statistique & Risque — ADR-010) :** `RevenueReconstructionEngine` (AUD-02 : négoce CAMV avec pertes justifiées/non justifiées, industrie intrants/énergie, services traceurs), `BenfordAdvancedAnalyzer` (Z-score continuité, Khi-deux, MAD Drake & Nigrini, 10k montants en 26.4 ms), `SupplierRiskScorer` (qualification neutre « Fournisseur à examiner »), `GlobalRiskScorer` (score global 0-100 déterministe en fourchette DZD).
- **Phase 10 (Rule Studio SuperAdmin — ADR-011) :** Application `apps/rule-studio` (React 19 + TypeScript + Vite) avec 7 cockpits pour l'édition AST, la simulation bac à sable, la gouvernance suspensive des paramètres non vérifiés (Règle 10), le workflow Maker-Checker à 4 yeux et la signature cryptographique Ed25519.
- **Phase 11 (Application Client Data Plane — ADR-012) :** Application `apps/client` (React 19 + TypeScript + Vite) avec 7 cockpits pour la saisie d'activité économique pré-validée, le grand livre append-only scellé SHA-256, le cockpit d'audit légal, les statistiques AUD-02/Benford, les clôtures SCF et l'assistant déclaratif G50/IBS.
- **Phase 12 (Intégration Globale & Benchmarks) :** Certification transverse, benchmarks consolidés, documentation d'exploitation et scellement du projet.

---

## 2. Métriques Officielles du Benchmark Global (Poste Windows 11 / Node LTS v24)

| Scénario de Benchmark | Itérations | Durée (ms) | Débit Réel (ops/s) | Latence Moyenne (µs) |
| :--- | :---: | :---: | :---: | :---: |
| **Arithmétique Exacte Decimal.js (addition + mise à l'échelle)** | 1 000 000 | 1 415.41 ms | **706 507 ops/s** | 1.415 µs |
| **Division Sécurisée (avec clause onZero=ERROR)** | 500 000 | 1 088.98 ms | **459 146 ops/s** | 2.178 µs |
| **Filtre de Visibilité Bi-temporelle Pure (`isBiTemporallyActive`)** | 500 000 | 25.84 ms | **19 349 096 ops/s** | 0.052 µs |
| **Fuseau Horaire Algérie (`Africa/Algiers` toLocalDate)** | 100 000 | 559.89 ms | **178 608 ops/s** | 5.599 µs |
| **Évaluation Règle AST Compilée (20 nœuds, 1M itérations)** | 1 000 000 | 16 072.39 ms | **62 219 ops/s** | 16.072 µs |
| **Chaînage Cryptographique SHA-256 Grand Livre (RFC 8785)** | 100 000 | 2 105.64 ms | **47 492 ops/s** | 21.056 µs |
| **AUD-01 Audit de Caisse Déterministe (100k lignes)** | 100 000 | 931.70 ms | **107 331 ops/s** | 9.317 µs |
| **AUD-06 Analyse de Benford 1er Chiffre (10k montants)** | 10 000 | 26.43 ms | **378 341 ops/s** | 2.643 µs |

*Impact Mémoire Heap : +41.63 MB sur plus de 3.2 millions d'opérations combinées. Zéro fuite mémoire.*

---

## 3. Matrice de Certification des Garde-Fous

1. **Règle 1 — Zéro Hardcode Fiscal ou Comptable :**
   - Script `pnpm lint:hardcode` (`scripts/guardrails/lint-decision-engine-hardcode.cjs`) : **0 violation**. L'ontologie est purement codée par rôles abstraits (`AccountRole`, `BusinessEventType`). Les valeurs sont injectées depuis les packs réglementaires.
2. **Règle 6 — Déontologie d'Audit & Présomption de Bonne Foi :**
   - Vocabulaire neutre validé : aucun terme accusatoire (« fraude », « fraudeur », « redressement certain »).
   - Tout indice d'anomalie exige une revue contradictoire obligatoire (`humanReviewRequired = true`).
3. **Règle 10 — Verrouillage Suspensif des Éléments Non Vérifiés :**
   - Interdiction technique formelle de publication pour tout pack contenant des items `UNVERIFIED`.
   - Exigence d'une référence probante au Journal Officiel (JORADP) pour toute levée de verrou.
4. **Loi 18-07 (ANPDP) & Souveraineté :**
   - Hébergement local strict sur le territoire national. Zéro appel externe vers des services cloud tiers ou LLMs distants pour les calculs déterministes.
   - Isolation multi-tenant fail-closed PostgreSQL (`df_tenant_role` + RLS).

---

## 4. Bilan Global des Tests

- **`@docteurflotte/decision-engine` :** 13 suites Vitest, **125 tests validés à 100%**.
- **`apps/rule-studio` :** 1 suite Vitest, **4 tests validés à 100%**.
- **`apps/client` :** 1 suite Vitest, **6 tests validés à 100%**.
- **`apps/api` :** 33 suites Jest, **264 tests validés à 100%**.
- **TypeScript Typecheck (`pnpm -w typecheck`) :** **8/8 tâches réussies sur 6 packages sans la moindre erreur**.

