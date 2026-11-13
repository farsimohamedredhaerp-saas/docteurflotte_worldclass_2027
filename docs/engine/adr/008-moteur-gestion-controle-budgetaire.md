# ADR-008 — Moteur de Gestion & Contrôle Budgétaire : Comptabilité Analytique Multi-Axes, Suivi Budgétaire, Écarts sur Coûts Préétablis, Seuil de Rentabilité & BFR Normatif

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/management/`, Tests `test/management-engine.spec.ts`  

---

## 1. Contexte & Enjeux de Pilotage Économique

Au-delà de la conformité comptable (SCF) et fiscale (DGI), la pérennité des entreprises algériennes (logistique, transport lourd, chantiers BTPH, négoce, ateliers mécaniques) exige un système de pilotage de gestion déterministe et prédictif :

1. **Comptabilité analytique d'exploitation et déversements secondaires :**
   - Nécessité de ventiler les charges directes et indirectes selon des axes multiples (Centres de Coûts, Centres de Profits, Projets / Chantiers BTPH, Lignes de Produits).
   - Traitement des déversements secondaires en cascade : les centres auxiliaires (ex: Atelier d'Entretien, Logistique interne) doivent déverser l'intégralité de leurs coûts primaires vers les centres principaux d'exploitation (Flotte Fret, Flotte BTPH), revenant rigoureusement à **0.00 DA** de solde résiduel.
   - **Garantie d'absence de dérive d'arrondi :** Les calculs de répartition proportionnelle par clés ou pourcentages appliquent un ajustement automatique au centime près sur la quote-part prépondérante, garantissant $\sum \text{Allocations} \equiv \text{Montant Initial}$.

2. **Contrôle et Suivi Budgétaire avec Engagements :**
   - Comparaison systématique des prévisions budgétaires aux dépenses et recettes réelles, enrichie du suivi des engagements (commandes engagées non encore liquidées).
   - Gestion des plafonds durs infranchissables (`isHardCeiling: true`) générant des alertes suspensives immédiates (`Severity.BLOQUANT`), et détection des sous-performances commerciales sur les objectifs de chiffre d'affaires.

3. **Standard Costing & Analyse des Écarts Industriels :**
   - Décomposition rigoureuse des écarts de coûts d'exploitation (carburant gasoil, lubrifiants, pièces d'usure, main-d'œuvre atelier) en sous-écarts explicatifs :
     * **Écart sur Coût / Prix ($E_P$) :** Mesure de l'impact des fluctuations tarifaires et de la performance d'achat fournisseur :
       $$E_P = (P_{\text{réel}} - P_{\text{standard}}) \times Q_{\text{réelle}}$$
     * **Écart sur Quantité / Consommation ($E_Q$) :** Mesure de la productivité physique, du rendement technique ou de la surconsommation kilométrique :
       $$E_Q = (Q_{\text{réelle}} - Q_{\text{standard}}) \times P_{\text{standard}}$$
     * **Preuve d'additivité vérifiée :** Le moteur certifie que $E_P + E_Q \equiv E_{\text{total}}$ au centime près.
   - Modèle avancé à 3 sous-écarts pour les centres de structure (Budget, Activité / coût de sous-activité ou suractivité, Rendement).

4. **Seuil de Rentabilité & Date Calendaire du Point Mort :**
   - Découpage analytique entre charges fixes ($CF$) et charges variables ($CV$).
   - Détermination du Taux de Marge sur Coûts Variables ($TMCV = MCV / CA$), du Seuil de Rentabilité en Dinars ($SR = CF / TMCV$) et du Point Mort en jours d'activité ($PM_{\text{jours}} = (SR / CA) \times 365$).
   - **Projection calendaire exacte :** Détermination de la date exacte dans l'exercice à partir de laquelle l'entreprise commence à dégager un bénéfice net (ex: 7 août 2026), avec calcul de la Marge de Sécurité ($MS = CA - SR$), de l'Indice de Sécurité ($IS$) et du Levier Opérationnel ($LO$).

5. **BFR Normatif (Méthode des Experts-Comptables) :**
   - Évaluation du Besoin en Fonds de Roulement structurel exprimé en jours de chiffre d'affaires annuel HT :
     $$\text{BFR}_{\text{composante (jours)}} = \text{Temps d'Écoulement (TE en jours)} \times \text{Coefficient de Structure (CS)}$$
   - Calcul de la Trésorerie Nette Prévisionnelle confrontant le Fonds de Roulement Net Global ($FRNG$) au $BFR$ normatif pour anticiper les tensions de liquidité et calibrer les lignes de découvert bancaire.

---

## 2. Architecture & Modules Déployés

### 2.1 Moteur d'Axes Analytiques (`AnalyticalAxesEngine`)
- Répartition primaire par quotes-parts / poids sans perte de centime.
- Déversement secondaire en cascade avec remise à zéro absolue du centre auxiliaire source.

### 2.2 Moteur de Contrôle Budgétaire (`BudgetControlEngine`)
- Confrontation des réalisations et engagements aux budgets par période et centre.
- Différenciation des impacts charges (surconsommation défavorable) vs produits (manque à gagner défavorable).

### 2.3 Moteur d'Écarts sur Coûts Standards (`StandardCostVarianceEngine`)
- Décomposition bivariée ($E_P$ et $E_Q$) sur coûts directs avec vérification formelle d'additivité.
- Décomposition trivariée (Budget, Activité, Rendement) pour charges indirectes d'atelier.

### 2.4 Moteur de Seuil de Rentabilité (`BreakEvenEngine`)
- Calcul de la profitabilité opérationnelle, détection d'activités structurellement déficitaires (marge variable négative bloquante) et projection calendaire du point mort.

### 2.5 Moteur de BFR Normatif (`NormativeWcrEngine`)
- Calcul analytique des temps d'écoulement et coefficients de structure, détermination du BFR en jours de CA et en valeur DZD, et calcul de la trésorerie nette prévisionnelle.

### 2.6 Cockpit de Gestion Consolidé (`ManagementDashboardEngine`)
- Consolidation des indicateurs de gestion, évaluation de la santé opérationnelle (`EXCELLENT`, `BON`, `SOUS_TENSION`, `CRITIQUE`) et formulation de recommandations stratégiques.

---

## 3. Résultats des Tests Dorés Validés

| Domaine de Gestion | Scénario de Test Chiffré | Résultat Obtenu | Statut |
| :--- | :--- | :--- | :---: |
| **Ventilation 3 Centres** | Charge 100k DA ventilée (40%, 35%, 25%) | 40 000 DA, 35 000 DA, 25 000 DA (Somme = 100k) | `PASS` |
| **Ajustement Centime** | 1 000 DA partagé en 3 parts égales ($1/3$) | 333.34 DA, 333.33 DA, 333.33 DA (Somme = 1 000.00 DA) | `PASS` |
| **Déversement Secondaire** | Atelier (120k DA) déversé 60% Fret / 40% BTPH | Atelier = **0.00 DA**, Fret = +72k DA, BTPH = +48k DA | `PASS` |
| **Budget Conforme** | Budget 500k DA, Réalisé 420k DA, Engagé 30k DA | Consommé = **90.00%** (`WITHIN_BUDGET`, favorable) | `PASS` |
| **Plafond Infranchissable** | Budget 200k DA, Réalisé 235k DA (+17.5%) | Alerte **BLOQUANT** (`OVER_BUDGET`), Plafond dépassé | `PASS` |
| **Sous-performance CA** | Budget 5M DA, Réalisé 4M DA (-20%) | Écart défavorable **MAJEUR** (Manque à gagner 1M DA) | `PASS` |
| **Écarts Gasoil Directs** | Standard: 10k L @ 29 DA, Réel: 11k L @ 30.50 DA | $E_P = +16\,500\text{ DA}$, $E_Q = +29\,000\text{ DA}$, Total = $+45\,500\text{ DA}$ | `PASS` |
| **Écarts Indirects 3 axes** | Atelier : $A_n = 1000\text{h}, A_r = 900\text{h}, Q_p = 850\text{h}$ | Budget: +10k, Activité: +20k, Rendement: +25k (Total +55k) | `PASS` |
| **Seuil Rentabilité** | CA 50M, CV 30M, CF 12M ($TMCV = 40\%$) | $SR = \mathbf{30\,000\,000.00\text{ DA}}$, Point mort = **219 jours** (07/08/2026) | `PASS` |
| **Marge Variable Négative**| CA 10M, Coûts variables 11M ($MCV = -1\text{M}$) | Seuil inatteignable (`BLOQUANT`), Déficit structurel | `PASS` |
| **BFR Normatif Sain** | CA 36.5M DA (100k/j), BFR = 59.90j, FRNG = 7M | BFR = **5 990 000.00 DA**, Trésorerie nette = **+1 010 000.00 DA** | `PASS` |
| **Tension de Trésorerie** | Même BFR de 5.99M DA avec FRNG insuffisant de 4M | Trésorerie = **-1 990 000.00 DA** (`MAJEUR`, `isDeficitRisk: true`) | `PASS` |
| **Cockpit Consolidé** | Dashboard unifié sur entreprise avec SR et BFR | Statut = **EXCELLENT**, Recommandations d'optimisation | `PASS` |

