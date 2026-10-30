# STRATÉGIE DES DONNÉES & SÉRIES TEMPORELLES (DATA STRATEGY)

**Statut :** DOCUMENT TECHNIQUE DE CADRAGE — AUCUN CHANGEMENT DE SCHÉMA DANS CETTE MISSION  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/architecture/core-architecture.md`, `docs/decisions/ADR-003-timeseries-data-strategy.md`  

---

## 1. Séparation Transactionnel (OLTP) vs Analytique (OLAP)

Pour préserver la simplicité opérationnelle et l'étanchéité multi-tenant du MVP :

1. **Socle Transactionnel Unique (PostgreSQL) :**
   - L'ensemble des entités métier (`tenants`, `users`, `assets`, `maintenance_plans`, `work_orders`, `cost_entries`, `audit_events`) réside dans l'instance PostgreSQL transactionnelle principale.
   - Les requêtes transactionnelles s'exécutent avec le contexte RLS actif (`SET LOCAL app.current_tenant_id`).

2. **Analytique & Décisionnel :**
   - Dans le périmètre MVP, les calculs de ratios, d'écarts budgétaires et de conformité sont calculés directement via des requêtes SQL optimisées ou des vues matérialisées indexées.
   - **Interdiction formelle pour le MVP :** Ne pas déployer d'entrepôt de données séparé (Snowflake, BigQuery, ClickHouse) ou de moteur de streaming complexe (Kafka) tant que la volumétrie ne dépasse pas les capacités d'une instance PostgreSQL dimensionnée.

---

## 2. Données Télématiques & Séries Temporelles

Les flux télématiques (positions GPS, relevés périodiques de vitesse, compteurs, alarmes boîtiers) constituent des données de séries temporelles (`Time-Series`) volumineuses.

### Stratégie de Partitionnement (ADR-003)
- **Table :** `telematics_raw_positions`
- **Mécanisme :** Partitionnement natif PostgreSQL par intervalle de temps (`PARTITION BY RANGE (recorded_at)`) avec des partitions mensuelles ou trimestrielles.
- **Bénéfices :**
  - Élagage efficace des partitions (`partition pruning`) lors des requêtes d'historique.
  - Suppression instantanée des données anciennes via `DROP TABLE` de partition sans fragmentation ni blocage (`vacuum`).

---

## 3. Politiques de Rétention & Agrégation

| Type de Données | Niveau de Détail | Durée de Rétention Active proposée | Stratégie d'Archivage / Purge |
| :--- | :--- | :--- | :--- |
| **Positions GPS brutes** | 1 point toutes les 10-60 secondes | `PROPOSÉ — 90 jours glissants (À VALIDER PAR LE FONDATEUR)` | Purge automatique des partitions de plus de 90 jours |
| **Trajets & Arrêts agrégés** | Synthèse par voyage (départ, arrivée, km parcourus, durée) | `PROPOSÉ — 3 ans (À VALIDER PAR LE FONDATEUR)` | Conservé en base relationnelle |
| **Relevés de compteurs (`MeterReading`)** | Valeur officielle horodatée et validée | `PROPOSÉ — Rétention permanente (vie de l'actif)` | Historique immuable pour la maintenance |
| **Ordres de travail & Coûts** | Justificatifs, pièces, factures, décisions | `PROPOSÉ — 10 ans (Obligation comptable/légale)` | Archivage sécurisé dans le respect des règles fiscales |

---

## 4. Données de Démonstration (`DEMO`)

- **Marquage :** Chaque ligne créée lors du parcours d'activation porte explicitement `data_origin = 'DEMO'`.
- **Exclusion :** Les vues d'analyse globale et les rapports de production excluent systématiquement `data_origin = 'DEMO'`.
- **Purge maîtrisée :** L'action utilisateur « Réinitialiser les données de démonstration » supprime exclusivement les lignes `data_origin = 'DEMO'` du tenant, sans jamais impacter les données réelles saisies ou importées.
