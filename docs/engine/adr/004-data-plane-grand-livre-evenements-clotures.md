# ADR-004 — Data Plane : Grand Livre Immuable (Append-Only), Chaînage Cryptographique SHA-256 & Idempotence des Événements Métier

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/ledger/`, Fixtures `fixtures/packs/`, Migration SQL `09_data_plane_ledger_events.sql`  

---

## 1. Contexte & Enjeux

Dans l'architecture à deux plans de DocteurFlotte / DzERP, le **Data Plane** est l'espace multi-tenant où les clients enregistrent leurs opérations d'activité quotidiennes (ventes, encaissements, achats, règlements, salaires, réceptions de stocks, situations BTPH).

Pour satisfaire aux exigences du Système Comptable Financier (SCF — Loi 07-11), de la Direction Générale des Impôts (DGI) et des normes d'audit :
1. **L'activité est pure de toute comptabilité :** Le client soumet un événement d'activité (`BusinessEvent`) ; il ne saisit jamais de comptes comptables ni de débits/crédits.
2. **Idempotence absolue :** Le renvoi réseau d'un même événement ne doit jamais créer d'écritures en double.
3. **Équilibre strict Débit = Crédit :** Une pièce déséquilibrée ne peut exister ni en mémoire ni en base de données.
4. **Immuabilité légale (Loi 07-11 art. 7) :** Interdiction absolue de modification (`UPDATE`) ou de suppression physique (`DELETE`) d'écritures comptables validées.
5. **Chaînage cryptographique SHA-256 & Ancrage Merkle :** Chaque écriture est liée à la précédente par son empreinte cryptographique. Toute falsification en base est immédiatement détectable.
6. **Étanchéité multi-tenant RLS :** Isolation stricte des données entre locataires garantie au niveau du moteur de base de données.

---

## 2. Décisions Architecturales Majeures

### 2.1 Traduction Événement $\rightarrow$ Écritures par Schéma (`POSTING_SCHEMA`)
- Le moteur de comptabilisation (`PostingEngine`) compile les schémas de posting issus des packs réglementaires.
- Les montants de chaque ligne sont évalués dynamiquement par le moteur AST déterministe (sans `eval()`).
- Les rôles comptables (`AccountRole`) sont résolus dynamiquement via le plan de comptes (`ChartOfAccounts`) du pack actif.
- **Porte de publication stricte :** Si un rôle de compte requis par un schéma de posting n'est pas mappé dans le plan de comptes du pack, la publication est immédiatement rejetée (`UnmappedAccountRoleError`).

### 2.2 Idempotence des Événements Métier
- Chaque événement porte un identifiant client immuable `event_id` et un condensat SHA-256 de son payload JSON canonique (`source_event_hash`).
- Si un événement déjà traité est rejoué, le moteur renvoie immédiatement la référence de la pièce existante sans créer aucune écriture supplémentaire (`status: 'IGNORED_DUPLICATE'`, 0 écritures créées).

### 2.3 Équilibre Comptable Débit = Crédit & Trigger Différé PostgreSQL
- L'égalité $\sum \text{Débits} = \sum \text{Crédits}$ est vérifiée en mémoire avec `EngineDecimal` avant toute émission.
- En base de données, la contrainte est garantie par un trigger différé :
  ```sql
  CREATE CONSTRAINT TRIGGER trg_piece_balance_deferred
  AFTER INSERT OR UPDATE ON ledger_entry
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_check_piece_balance();
  ```
- Toute tentative d'enregistrer une pièce déséquilibrée (même d'un seul centime de 0.01 DA) est avortée au `COMMIT` avec le code d'erreur standard **SQLSTATE 23514** (`check_violation`).

### 2.4 Immuabilité Absolue & Procédure de Contre-Passation
- Le Grand Livre est strictement en ajout seul (**Append-Only**).
- Le trigger PostgreSQL `trg_ledger_entry_immutable` bloque catégoriquement toute tentative d'instruction `UPDATE` ou `DELETE` avec **SQLSTATE 55000**.
- La correction d'erreurs s'effectue exclusivement par contre-passation (`reversePiece`) :
  - L'écriture originale est marquée `REVERSED` (sans modification d'aucun montant ni compte).
  - Une nouvelle pièce `REV-...` est générée, inversant strictement les débits et crédits, et intégrée dans la chaîne SHA-256.

### 2.5 Refus d'Écriture en Période Clôturée (`CLOSED`)
- Le statut d'une période comptable (`accounting_period`) est irréversible une fois passé à `CLOSED`.
- Le trigger `trg_ledger_entry_check_period` et le moteur applicatif rejettent instantanément toute écriture ciblant une période close avec **SQLSTATE 55000** (`ClosedPeriodError`).

### 2.6 Chaînage SHA-256 et Scellement d'Arbre de Merkle
- Chaque ligne d'écriture calcule son condensat SHA-256 en intégrant le `prevHash` de la ligne précédente.
- La première écriture de la chaîne pointe vers `GENESIS_HASH` (64 zéros).
- L'algorithme `verifyChain` recalcule séquentiellement l'intégrité de la chaîne et identifie la pièce et la ligne exactes en cas d'altération.
- La fonction `sealDailyAnchor` calcule la racine d'arbre de Merkle (`merkle_root`) sur l'ensemble des écritures de chaque journée pour scellement opposable.

### 2.7 Gestion Spécifique de la TVA BTPH & Prestations de Services
- Dans le secteur du BTPH et des prestations de services, la TVA n'est pas exigible à l'émission de la situation de travaux, mais à l'encaissement effectif.
- L'événement `SITUATION_ISSUED` comptabilise la TVA sur le rôle `VAT_WAITING` (compte transitoire 4458).
- L'événement `SITUATION_COLLECTED` transfère la TVA du compte d'attente vers la TVA collectée (`VAT_COLLECTED` — compte 4457) au prorata strict des encaissements perçus.

### 2.8 Isolation Multi-Tenant RLS Fail-Closed
- L'ensemble des tables du Data Plane (`entity_profile`, `accounting_period`, `piece_sequence`, `business_event`, `ledger_entry`, `ledger_anchor`) sont soumises à PostgreSQL RLS (`ENABLE & FORCE ROW LEVEL SECURITY`).
- Les politiques filtrent sur le rôle applicatif non-privilégié `df_tenant_role` via la variable de session transactionnelle `app.tenant_id`.
- Prouvé en SQL direct : un locataire B ne peut voir aucune ligne du locataire A (`SELECT COUNT(*) = 0`).

---

## 3. Matrice de Couverture des 15 Événements du Catalogue MVP

| # | Code Événement | Journal | Rôles Débités | Rôles Crédités | Spécificités & Équilibre |
|---|---|:---:|---|---|---|
| 1 | `SALE_INVOICED` | `VT` | `CLIENT` | `REVENUE_SALES`, `VAT_COLLECTED` | TVA collectée immédiate (Biens) ou `VAT_WAITING` (BTPH/Services) |
| 2 | `SALE_COLLECTED` | `BQ` / `CA` | `BANK` / `CASH` | `CLIENT` | Régularisation conditionnelle TVA en attente $\rightarrow$ collectée |
| 3 | `PURCHASE_INVOICED` | `AC` | `COGS_MERCHANDISE`, `VAT_DEDUCTIBLE` | `SUPPLIER` | Séparation HT et TVA déductible |
| 4 | `PURCHASE_PAID` | `BQ` / `CA` | `SUPPLIER` | `BANK` / `CASH` | Apurement de la dette fournisseur |
| 5 | `CASH_EXPENSE` | `CA` | `EXPENSE_MAINTENANCE` | `CASH` | Dépenses de caisse avec contrôle solde |
| 6 | `CASH_DEPOSIT_TO_BANK`| `CA` | `INTERNAL_TRANSFER` | `CASH` | Virement interne de fonds (compte 58) |
| 7 | `OWNER_CURRENT_ACCOUNT_CONTRIBUTION` | `BQ` | `BANK` / `CASH` | `CURRENT_ACCOUNT_PARTNERS` | Apport en compte courant d'associé / exploitant |
| 8 | `PAYROLL_RUN` | `PA` | `EXPENSE_PAYROLL`, `EXPENSE_SOCIAL_CHARGES` | `SOCIAL_CHARGES_PAYABLE`, `TAX_WITHHELD_PAYABLE`, `NET_SALARIES_PAYABLE` | Paie complète brute, charges patronales, CNAS, IRG et net |
| 9 | `ASSET_ACQUIRED` | `OD` | `FIXED_ASSETS`, `VAT_DEDUCTIBLE` | `SUPPLIER_FIXED_ASSETS` | Immobilisation corporelle et dette d'investissement |
| 10| `DEPRECIATION_BOOKED` | `OD` | `DEPRECIATION_EXPENSE` | `DEPRECIATION_ACCUMULATED` | Dotation annuelle aux amortissements |
| 11| `FX_REVALUATION` | `OD` | `BANK` ou `FX_LOSS` | `FX_GAIN` ou `BANK` | Gain ou perte de change latent/réalisé |
| 12| `STOCK_RECEIPT` | `ST` | `STOCK_MERCHANDISE` | `COGS_MERCHANDISE` | Entrée en stock valorisée au coût d'acquisition |
| 13| `STOCK_ISSUE` | `ST` | `COGS_MERCHANDISE` | `STOCK_MERCHANDISE` | Consommation ou sortie de stock valorisée au CUMP |
| 14| `SITUATION_ISSUED` | `VT` | `CLIENT` | `REVENUE_SERVICES`, `VAT_WAITING` | Situation travaux BTPH avec TVA en attente d'encaissement |
| 15| `SITUATION_COLLECTED`| `BQ` | `BANK`, `VAT_WAITING` | `CLIENT`, `VAT_COLLECTED` | Encaissement situation et exigibilité TVA au prorata |

---

## 4. Résultats des Tests de la Phase 3

- **Tests Unitaires & Intégration Data Plane (`test/data-plane-ledger.spec.ts`) :**
  - 12 scénarios dorés exécutés avec 100% de succès.
  - Vente standard 100k HT TVA 19% validée (Débit Client 119k, Crédit Vente 100k, Crédit TVA 19k).
  - Vente BTPH avec TVA en attente validée.
  - Idempotence validée (0 écriture créée au rejeu).
  - Rejet pièce déséquilibrée 0.01 DA validé.
  - Horodatage 23h30 UTC classé au 15/03 en Algérie validé.
  - Détection immédiate d'altération par `verifyChain` validée.
  - Isolation multi-tenant et invariants Débit = Crédit validés.
- **Tests Directs PostgreSQL 16 (`database/tests/test_09_ledger_sql.ps1`) :**
  - Rejet pièce déséquilibrée par trigger différé : `PASS` (check_violation 23514).
  - Rejet UPDATE par trigger d'immuabilité : `PASS` (SQLSTATE 55000).
  - Rejet DELETE par trigger d'immuabilité : `PASS` (SQLSTATE 55000).
  - Isolation RLS sous `df_tenant_role` : `PASS` (Tenant B = 0, Tenant A = 3).
  - Rejet écriture en période close : `PASS` (SQLSTATE 55000).
- **Garde-fou Anti-Hardcode (`pnpm lint:hardcode`) :** 0 infraction constatée.

