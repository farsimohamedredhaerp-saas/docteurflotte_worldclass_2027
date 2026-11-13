# ADR-005 — Moteur Comptable & Clôtures SCF : Valorisation CUMP, Amortissements, Pertes à Terminaison BTPH & Liasses Bilancielles

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/scf/`, Tests `test/scf-engine.spec.ts`  

---

## 1. Contexte & Enjeux

Dans le cadre du Système Comptable Financier algérien (SCF — Loi 07-11), les opérations de clôture annuelle et d'inventaire exigent un niveau d'exactitude mathématique et réglementaire intransigeant :
1. **Élimination de la dérive de centimes sur stocks :** Les calculs naïfs de CUMP appliqués aux quantités résiduelles provoquent des écarts de centimes qui empêchent un compte de stock de revenir exactement à 0.00 DA lors d'un vidage physique.
2. **Traitement des frais d'approche tardifs :** Une facture de transport ou douane reçue sur un lot de marchandises déjà totalement épuisé ne doit jamais réinjecter une valeur artificielle dans un stock nul.
3. **Prorata temporis exact d'amortissement :** L'annuité de première année doit être calculée au jour exact près (base 365 ou 366 jours selon l'année bissextile), et le mode dégressif doit basculer automatiquement en linéaire.
4. **Contrats à long terme BTPH & Pertes à terminaison :** Dès lors qu'un marché devient déficitaire ($CTET > \text{Marché}$), la totalité de la perte globale $L$ doit impacter le résultat de l'exercice via la combinaison de la perte d'exploitation et de la provision pour perte à terminaison $L \times (1 - \alpha)$.
5. **Équilibre bilanciel strict de la Liasse SCF :** Le Bilan Actif/Passif doit être parfaitement équilibré au centime près, avec une réconciliation absolue du Résultat Net entre le Compte de Résultat et les Capitaux Propres.

---

## 2. Décisions Architecturales Majeures

### 2.1 Moteur de Valorisation des Stocks CUMP (`StockCumpEngine`)
- **Valorisation par la valeur :**
  $$V_{\text{final}} = V_{\text{initial}} + V_{\text{entrées}} - V_{\text{sorties}}$$
- Lors d'une sortie partielle : $V_{\text{sortie}} = \text{round}(Q_s \times CUMP, 2)$ et la valeur restante est déduite par soustraction directe.
- Lors d'un vidage total ($Q_s = Q_{\text{stock}}$) : la sortie emporte l'intégralité de la valeur restante $V_{\text{stock}}$, garantissant que le stock revient rigoureusement à **0.00 DA** sans dérive d'arrondi.
- **Frais d'approche tardifs sur stock nul :** Si $Q_{\text{stock}} = 0$, les frais sont immédiatement orientés vers `expenseValue` (charges d'exploitation), maintenant la valeur du stock à 0.00 DA.
- **Idempotence :** Tout mouvement rejoué avec un `id` déjà présent dans `appliedMovementIds` renvoie l'état inchangé avec `movementApplied = false`.

### 2.2 Moteur d'Amortissements Linéaires & Dégressifs (`DepreciationEngine`)
- **Prorata temporis exact en jours :**
  Calcul du nombre de jours réels d'activité entre la date de mise en service et le 31 décembre (inclusif), rapporté au nombre exact de jours de l'année (365 ou 366 jours via `isLeapYear`).
- **Bascule automatique Dégressif $\rightarrow$ Linéaire :**
  À chaque exercice, le moteur compare le taux dégressif au taux linéaire résiduel $t_{\text{lin}} = 1 / (\text{années restantes})$. Dès que $t_{\text{lin}} \ge t_{\text{dég}}$, la bascule en linéaire s'opère automatiquement pour solder la VNC.
- **Sortie d'actif / Mise au rebut (`retireAsset`) :**
  Calcul de l'annuité complémentaire au prorata temporis jusqu'à la date de mise au rebut, cumul des amortissements et détermination de la Valeur Nette Comptable (VNC) de sortie.

### 2.3 Contrats à Long Terme BTPH & Pertes à Terminaison (`LongTermContractEngine`)
- Avancement coût à coût : $\alpha = C_{\text{réel}} / CTET$.
- Chiffre d'affaires à l'avancement : $CA = \text{Marché} \times \alpha$.
- Perte globale prévisible : $L = \max(0, CTET - \text{Marché})$.
- Marge brute d'exploitation : $CA - C_{\text{réel}} = -L \times \alpha$ (perte déjà constatée).
- **Provision pour perte à terminaison complémentaire (compte 151) :**
  $$\text{Provision} = \max(0, L - \text{perte déjà constatée}) = L \times (1 - \alpha)$$
- L'impact cumulé sur le résultat de l'exercice (perte d'exploitation + dotation provision) est exactement égal à **$L$** (100% de la perte anticipée dès l'exercice d'apparition du déficit prévisible).

### 2.4 Balance Générale & Liasses SCF (`GeneralBalanceEngine` & `FinancialStatementsEngine`)
- Agrégation des écritures en Balance Générale (avant et après inventaire) avec égalité stricte :
  $$\sum \text{Mouvements Débits} = \sum \text{Mouvements Crédits}$$
  $$\sum \text{Soldes Débiteurs} = \sum \text{Soldes Créditeurs}$$
- Génération complète des états financiers normalisés SCF :
  - **Bilan Actif :** Immobilisations corporelles nettes, stocks, créances clients, disponibilités.
  - **Bilan Passif :** Capitaux propres (capital + résultat net), provisions pour charges (perte BTPH 151), dettes fournisseurs, dettes fiscales et sociales.
  - **Compte de Résultat :** Cascades de marges (Production, VAE, EBE, Résultat Opérationnel, Résultat Financier, ROAI, IBS, Résultat Net).
  - **TFT & TVCP :** Réconciliation des flux de trésorerie et variation des capitaux propres.
- **Garantie d'équilibre bilanciel certifiée :** Total Actif == Total Passif au centime près, et Résultat Net Bilan == Résultat Net Compte de Résultat.

---

## 3. Résultats des Tests Dorés Validés

| Domaine | Scénario de Test Chiffré | Résultat Obtenu | Statut |
| :--- | :--- | :--- | :---: |
| **Stock CUMP** | 10 à 100 DA + 10 à 110 DA $\rightarrow$ CUMP | **105.00 DA** (Valeur 2 100 DA) | `PASS` |
| **Stock CUMP** | Sortie 15 à 105 DA $\rightarrow$ Valeur résiduelle | **525.00 DA** (Sortie 1 575 DA) | `PASS` |
| **Stock CUMP** | Frais tardifs 200 DA sur stock nul | Imputés en charge (**200 DA**), Stock = **0.00 DA** | `PASS` |
| **Amortissement** | Machine 1M DA, 5 ans, mise en service 15/04/2026 (261 jours) | Dotation 2026 = **143 013.70 DA** | `PASS` |
| **Amortissement** | Dégressif 1M DA, 5 ans, coeff 2.0 | Bascule linéaire en année 4 (**108 000 DA**) | `PASS` |
| **BTPH** | Marché 10M, CTET révisé 11M, engagé 4M ($\alpha = 4/11$) | Perte $L$ = **1 000 000 DA**, Provision = **636 363.64 DA** | `PASS` |
| **Liasse SCF** | Bilan Actif (1 280 000 DA) vs Passif (1 280 000 DA) | Écart = **0.00 DA** (Équilibre parfait) | `PASS` |
| **Liasse SCF** | Résultat Net Bilan vs Résultat Compte de Résultat | **100 000.00 DA** (Réconciliation 100%) | `PASS` |

