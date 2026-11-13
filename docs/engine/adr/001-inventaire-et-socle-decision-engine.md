# ADR-001 — Inventaire de l'Existant, Socle du Moteur Décisionnel et Stratégie d'Extension

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel (Architecte, Back-end, QA)  
**Portée :** Monorepo racine, `packages/decision-engine`, `docker-compose.dev.yml`, CI/Guardrails  

---

## 1. Contexte & Problématique

La mission consiste à doter la plateforme d'un **moteur décisionnel universel** de contrôle comptable (Système Comptable Financier - SCF), fiscal (Direction Générale des Impôts - DGI), de gestion et d'audit pour les entreprises algériennes (tous secteurs : négoce, industrie, BTPH, services, professions libérales ; tous régimes : réel normal, réel simplifié, IFU, ANAE).

Ce moteur s'articule autour de deux plans strictement étanches :
1. **Control Plane (Éditeur / SuperAdmin)** : gestion et publication de **packs réglementaires** bi-temporels, versionnés, signés cryptographiquement par Ed25519 (lois de finances, SCF, barèmes, seuils, grilles de pénalités, gabarits).
2. **Data Plane (Clients Multi-Tenant)** : saisie d'événements d'activité purs, compilation dynamique des règles applicables selon les coordonnées bi-temporelles de l'opération, détection de risques et production d'écritures ou d'indices d'audit.

Conformément à la directive de cadrage : **inventorier l'existant et l'étendre, sans reconstruire inutilement**.

---

## 2. Inventaire Détaillé du Dépôt Existant

L'inspection approfondie du monorepo révèle les briques architecturales suivantes :

### 2.1 Schéma de Données (`prisma/schema.prisma`)
- **Structure actuelle :** 554 lignes, 13 modèles orientés maintenance prédictive, télémétrie IoT, jumeaux numériques, magasins de pièces détachées et ordres de travail.
- **Entités clés :** `VehicleAsset`, `OemMaintenanceTemplate`, `MaintenanceScheduleRule`, `PartInventoryItem` (avec gestion de stock CUMP `averageUnitCostDzd`), `StockMovement` (journal immuable d'audit), `PurchaseOrder`.
- **Typage & Précision :** Utilisation fréquente de `Float` dans le schéma hérité pour les compteurs et métriques IoT, ce qui confirme la nécessité d'isoler le moteur comptable/fiscal sur `NUMERIC(20,2)`, `NUMERIC(24,6)`, `NUMERIC(12,8)` et `decimal.js`.

### 2.2 Migrations SQL & Modules Fiscaux Hérités
- `database/migrations/03_saas_platform_admin.sql` :
  - `platform_decision_engine_configs` : Table de configuration avec hachage canonique (`canonical_content_hash`), contrainte Maker-Checker (`chk_maker_checker_distinct`) et dates d'effet.
  - `platform_config_publications` : Registre immuable append-only des activations de configuration.
  - `platform_fiscal_fuel_prices`, `platform_fiscal_tax_rules`, `platform_vignette_tarifs` : Tables de barèmes administrables pour éliminer le codage en dur.
  - `platform_audit_logs` : Piste d'audit infalsifiable avec chaînage SHA-256 (`prev_hash`, `entry_hash`) et trigger bloquant tout `UPDATE` ou `DELETE`.

### 2.3 Sécurité Multi-Tenant & Row-Level Security (RLS)
- `database/migrations/01_oem_maintenance_schema.sql` : Politiques RLS PostgreSQL fail-closed s'appuyant sur la variable de session `app.current_tenant_id` et le rôle `df_tenant_role`.
- Garde-fou automatisé `scripts/guardrails/check-rls.cjs` vérifiant l'application de `ROW LEVEL SECURITY` sur chaque table contenant `tenant_id`.

### 2.4 Conventions de Monorepo & Outillage
- Monorepo `pnpm` piloté par `turbo` (2.11.10), Node.js LTS (v24.18.0), TypeScript strict (v5.7.3).
- Architecture scindée en `apps/` (`api` sous NestJS, `web` sous Next.js 15) et `packages/` (`contracts`).
- Garde-fous CI rigoureux (`check-secrets.cjs`, `check-hardcoded-literals.cjs`, `check-world-class-security.cjs`).

---

## 3. Arbitrage Architectural : Réutilisé, Étendu, Remplacé

| Brique | Statut | Justification & Destination |
| :--- | :---: | :--- |
| **Pipeline Turbo & pnpm Workspaces** | **RÉUTILISÉ** | Orchestration ultra-rapide des tâches `build`, `typecheck`, `lint` et `test` sur l'ensemble des paquets. |
| **Isolation Multi-Tenant PostgreSQL RLS** | **RÉUTILISÉ** | Modèle éprouvé de filtrage transactionnel `SET LOCAL app.tenant_id = :tenantId` garantissant l'étanchéité absolue des données financières des entreprises clientes. |
| **Piste d'Audit & Chaînage SHA-256** | **RÉUTILISÉ** | Réutilisation du pattern append-only inviolable (`prev_hash ‖ content_hash`) pour le grand livre et les journaux comptables immuables. |
| **Souveraineté des Données (Loi 18-07 ANPDP)** | **RÉUTILISÉ** | Règle absolue de non-exportation des données et absence de LLM dans les chaînes de calculs déterministes. |
| **Environnement Local Docker Compose** | **ÉTENDU** | Création de `docker-compose.dev.yml` fournissant PostgreSQL 16 (avec extension `btree_gist` pré-chargée pour contraintes d'exclusion temporelles) et MinIO local (stockage d'artefacts S3 compatible). |
| **Garde-fous CI / Anti-Hardcode** | **ÉTENDU** | Ajout de `scripts/guardrails/lint-decision-engine-hardcode.cjs` et script racine `pnpm lint:hardcode` interdisant formellement tout numéro de compte SCF, taux fiscal ou plafond monétaire dans `packages/decision-engine/src`. |
| **Harness de Benchmark** | **ÉTENDU** | Création de `scripts/bench-decision-engine.cjs` mesurant les cadences arithmétiques, temporelles et bi-temporelles (>590k ops/s). |
| **Package Moteur Décisionnel** | **CRÉÉ / ISOLÉ** | Création du package autonome `packages/decision-engine` (`@docteurflotte/decision-engine`), purement fonctionnel, sans dépendance externe, piloté par `decimal.js`, Vitest et `fast-check`. |
| **Modélisation Comptable & Fiscale** | **REMPLACÉ** | Abandon des structures simplifiées au profit d'une ontologie stricte (rôles de comptes, AST, bi-temporalité, statut de vérification légale à 3 niveaux). |

---

## 4. Spécifications du Socle `packages/decision-engine`

### 4.1 Séparation Ontologie (Code) vs Valeurs (Données)
- **L'ontologie est du code :**
  - Rôles de comptes universels : `AccountRole` (`CASH`, `BANK`, `CLIENT`, `SUPPLIER`, `VAT_COLLECTED`, `VAT_DEDUCTIBLE`, `VAT_WAITING`, `STOCK_*`, `COGS_*`, `REVENUE_*`, `EXPENSE_*`, etc.).
  - Types d'événements économiques : `BusinessEventType` (`SALE_INVOICED`, `PURCHASE_PAID`, `STOCK_RECEIPT`, `SITUATION_ISSUED`, etc.).
  - Niveaux de sévérité (`Severity` : `BLOQUANT`, `MAJEUR`, `MINEUR`, `INFO`).
  - Niveaux de preuve (`EvidenceLevel` : `LEGAL_TEXT`, `ADMIN_DOCTRINE`, `AUDIT_PRACTICE`, `STATISTICAL`).
  - Statuts de vérification (`VerificationStatus` : `SOURCED_OFFICIAL`, `SOURCED_SECONDARY`, `UNVERIFIED`).
- **Les valeurs sont des données :**
  - Aucun numéro de compte SCF (`445`, `411`, `530`...), aucun taux (`19%`, `26%`, `5%`...), aucun plafond (`300 000 DA`, `3 000 000 DA`...) ne figure dans le code source de `packages/decision-engine/src`. Le non-respect de cette règle entraîne l'échec immédiat de `pnpm lint:hardcode`.

### 4.2 Arithmétique Exacte & Isolation Décimale
- Utilisation de `Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP })` isolé, sans altération globale.
- Standardisation des échelles :
  - **Montants :** `NUMERIC(20,2)` (Dinars Algériens DZD).
  - **Coûts unitaires & Quantités :** `NUMERIC(24,6)`.
  - **Taux, ratios & coefficients :** `NUMERIC(12,8)`.
- Sécurité arithmétique : toute opération `DIV` exige une politique `onZero` explicite (`ERROR`, `ZERO`, `NULL`).

### 4.3 Fuseau Légal & Calendrier Algérie (`Africa/Algiers` — UTC+1)
- L'Algérie n'applique pas l'heure d'été (décalage fixe UTC+1 toute l'année).
- Interdiction stricte de `toISOString().slice(0,10)` pour dériver un jour comptable.
- Prise en charge exacte de la règle d'antidatage et de bascule minuit : une transaction horodatée à `23:30 UTC le 14/03` correspond à `00:30 le 15/03` en heure locale algérienne et doit obligatoirement être enregistrée au **15/03**.

### 4.4 Bi-temporalité & Portes de Publication
- Deux axes temporels orthogonaux :
  1. `asOf` (Temps légal / d'effet) : `validFrom <= asOf < (validTo ?? ∞)`.
  2. `knownAt` (Temps de connaissance système) : `recordedAt <= knownAt < (supersededAt ?? ∞)`.
- Porte de publication de pack réglementaire :
  - Tout pack contenant au moins un paramètre `UNVERIFIED` est formellement bloqué pour la publication en production.
  - Séparation stricte Maker-Checker : `authorEmail !== publishedByEmail`.
  - Signature Ed25519 obligatoire sur le JSON canonique RFC 8785.

---

## 5. Résultats des Benchmarks du Socle (Mesures Réelles)

Exécution sur poste de travail Windows 11 / Node.js v24.18.0 :

| Scénario de Bench | Itérations | Durée (ms) | Débit (ops/s) | Latence moy (µs) |
| :--- | :---: | :---: | :---: | :---: |
| **Arithmétique Decimal.js (addition + mise à l'échelle montant)** | 1 000 000 | 1 689.29 ms | **591 966 ops/s** | 1.689 µs |
| **Division sécurisée (avec clause onZero=ERROR)** | 500 000 | 1 807.57 ms | **276 614 ops/s** | 3.615 µs |
| **Filtre de visibilité bi-temporelle pure (`isBiTemporallyActive`)** | 500 000 | 24.88 ms | **20 098 402 ops/s** | 0.050 µs |
| **Conversion date locale `Africa/Algiers` (`toLocalDate`)** | 100 000 | 772.18 ms | **129 503 ops/s** | 7.722 µs |

*Impact mémoire heap : +0.29 MB sur 2.1 millions d'opérations combinées.*

---

## 6. Plan Détaillé pour la Phase 1 (Control Plane)

Dès réception de l'instruction « go phase 1 », les travaux suivants seront exécutés :

1. **Modélisation & Schéma SQL Control Plane :**
   - Tables : `reg_pack`, `reg_pack_item`, `reg_pack_item_test`, `reg_pack_approval`, `signing_key`, `tenant_pack_pin`.
   - Activation de l'extension `btree_gist` et création de contraintes d'exclusion temporelles interdisant tout chevauchement de versions actives sur une même portée.
   - Trigger d'immuabilité absolue sur les packs au statut `PUBLISHED` (rejet de tout `UPDATE` ou `DELETE`).
2. **Normalisation & Signature Cryptographique :**
   - Sérialisation JSON canonique (RFC 8785 / JCS).
   - Calcul de condensat SHA-256 et signature asymétrique Ed25519.
   - Vérification de signature et détection d'altération (`TAMPERED`).
3. **Moteur de Résolution Bi-temporelle :**
   - Résolution `resolve({ asOf, knownAt })` avec gestion de priorité de surcharge (LFC > LF).
4. **Outillage CLI Hors-Ligne :**
   - Scripts `pack:import`, `pack:sign`, `pack:verify`.
5. **Fixtures & Seed `DZ_LF_2026_DRAFT` :**
   - Inclusion des paramètres de travail 2026 avec leur statut de vérification (`SOURCED_SECONDARY`, `UNVERIFIED`).
   - Test probatoire prouvant que le pack `DZ_LF_2026_DRAFT` est **rejeté à la publication** en raison de la présence de paramètres `UNVERIFIED`.
6. **Suites de Tests Chiffrées :**
   - Tests de chevauchement temporel (SQLSTATE 23P01).
   - Tests de détection de falsification d'un octet.
   - Tests de séparation Maker-Checker à l'approbation.

