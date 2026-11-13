# ADR-006 — Moteur Fiscal DGI : IBS Multi-Activités, TVA & Régularisations Quinquennales, TAP, IFU/ANAE & Simulateur de Contrôle par Impôt

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/dgi/`, Tests `test/dgi-engine.spec.ts`  

---

## 1. Contexte & Enjeux Réglementaires Algériens

La fiscalité algérienne des entreprises (Code des Impôts Directs et Taxes Assimilées - CIDTA, Code des Taxes sur le Chiffre d'Affaires - CTCA, et lois de finances successives LF 2018, LFC 2015, LF 2024, LF 2026) présente des exigences structurelles qui rendent caduque toute approche simpliste ou monolithique :

1. **Pluralité des taux d'IBS et sanction de la comptabilité séparée :**
   - L'IBS applique des taux différenciés selon le secteur d'activité (19% pour les activités de production de biens, 23% pour le BTPH, l'hydraulique, le tourisme et le thermalisme, 26% pour les prestations de services, le négoce et les autres activités).
   - En cas d'exercice d'activités mixtes, l'entreprise est légalement tenue de tenir une **comptabilité séparée** par secteur (art. 140 et suivants du CIDTA, LFC 2015).
   - En l'absence de comptabilité séparée permettant d'isoler les résultats sectoriels, la loi impose une sanction dissuasive automatique : **l'application du taux le plus élevé (26%) sur l'intégralité du bénéfice fiscal imposable de l'entreprise**.
   - Lorsque la comptabilité séparée est tenue, les charges communes non directement affectables sont réparties au prorata du chiffre d'affaires ou du résultat comptable brut, et les réintégrations fiscales spécifiques (ex: amendes et pénalités non déductibles) doivent être réimputées au segment sectoriel qui en est à l'origine, subissant ainsi le taux d'IBS correspondant à cette activité.

2. **TVA des assujettis partiels & Régularisations quinquennales :**
   - Lorsqu'une entreprise réalise à la fois des opérations ouvrant droit à déduction et des opérations situées hors du champ ou exonérées sans droit à déduction, elle doit appliquer un **prorata de déduction annuel de TVA**.
   - Pour les biens amortissables (immobilisations), toute cession ou mise au rebut intervenant avant l'expiration d'un délai de cinq années (année d'acquisition incluse) donne lieu à une **régularisation quinquennale de TVA**, entraînant le reversement d'un cinquième ($1/5$) de la TVA initialement déduite par année ou fraction d'année restant à courir jusqu'à la fin de la période quinquennale (art. 38 CTCA).

3. **Abrogation de la TAP (LF 2024 art. 14) et mémoire des exercices prescrits :**
   - La Taxe sur l'Activité Professionnelle (TAP) a été formellement abrogée au 1er janvier 2024 pour toutes les activités (LF 2024, article 14).
   - Le moteur décisionnel doit donc liquider une TAP strictement égale à **0.00 DA** pour tout exercice fiscal à compter de 2024, tout en conservant intacts les moteurs et barèmes sectoriels historiques (2%, 1%, etc.) pour l'audit et la vérification des exercices antérieurs non encore prescrits (délai de reprise de 4 ans, art. 39 CPF).

4. **Régimes Forfaitaires (IFU & ANAE) :**
   - L'Impôt Forfaitaire Unique (IFU) applique des taux sectoriels différenciés (5% pour les activités de production et de vente de biens, 12% pour les prestations de services) avec minimum d'imposition légal et surveillance rigoureuse du franchissement des seuils d'éligibilité entraînant la bascule d'office au régime du réel.
   - Le statut de l'Auto-entrepreneur (ANAE) bénéficie d'un taux privilégié (0.5%) assorti d'un plancher légal et de plafonds distincts de chiffre d'affaires.

5. **Simulateur de Contrôle & Redressement Fiscal par Impôt :**
   - Contrairement aux pratiques approximatives consistant à multiplier globalement une base redressée par un pourcentage forfaitaire, la doctrine de la DGI et le Code des Procédures Fiscales (CPF) exigent une liquidation **strictement séparée par impôt** (IBS, TVA, TAP).
   - Chaque rappel d'impôt doit décomposer précisément :
     * Les droits simples éludés.
     * Les pénalités d'assiette (selon le degré de qualification : bonne foi art. 193 CIDTA, manquement délibéré, manœuvres délibérées art. 193 bis CIDTA).
     * Les intérêts de retard mensuels (art. 202 CIDTA).
   - Les conclusions doivent être restituées sous forme d'une **fourchette de risque financier** (Basse, Médiane, Haute) exempte de tout vocabulaire accusatoire non contradictoire.

---

## 2. Décisions Architecturales & Implémentation

### 2.1 Moteur IBS Multi-Activités (`IbsEngine`)
- **Modélisation du résultat sectoriel :**
  - Chaque activité fournit son chiffre d'affaires, son résultat comptable brut et ses réintégrations/déductions propres.
  - Si `separateAccounting = true` : le résultat net sectoriel est calculé, les charges communes non affectables sont ventilées au prorata, et chaque assiette est taxée à son taux réglementaire propre ($19\%$, $23\%$, $26\%$).
  - Si `separateAccounting = false` : la sanction légale s'applique, la totalité du bénéfice fiscal global est soumise au taux de repli maximal ($26\%$).
- **Acomptes provisionnels et liquidation :**
  - Calcul des 3 acomptes provisionnels basés sur l'IBS de l'exercice précédent.
  - Calcul du solde de liquidation final déduisant les acomptes versés, avec détection automatique de l'excédent de versement imputable ou restituable.

### 2.2 Moteur TVA & Régularisations Quinquennales (`TvaEngine`)
- **Prorata général de déduction :**
  $$P = \frac{CA_{\text{avec droit}} + \text{Exportations}}{CA_{\text{avec droit}} + \text{Exportations} + CA_{\text{sans droit}}}$$
  $$\text{TVA Déductible} = \text{round}(\text{TVA Brute Déductible} \times P, 2)$$
- **Régularisation quinquennale des immobilisations :**
  - Période de référence = 5 ans (année d'acquisition = année 1).
  - Pour une cession en année $k \le 5$, le nombre d'années restantes est :
    $$N_{\text{restantes}} = 5 - k + 1$$
  - Le montant du reversement légal de TVA exigible est :
    $$\text{Reversement} = \text{round}\left(\text{TVA Initiale Déduite} \times \frac{N_{\text{restantes}}}{5}, 2\right)$$

### 2.3 Moteur TAP (`TapEngine`)
- Vérification de l'année fiscale de l'exercice :
  - Si $\text{année} \ge 2024$ : `isAbolished = true`, impôt liquidé à **0.00 DA**.
  - Si $\text{année} < 2024$ : application du barème historique sectoriel avec réfaction éventuelle.

### 2.4 Régimes Forfaitaires IFU & ANAE (`IfuAnaeEngine`)
- **IFU Mixte :** Application distincte des taux légaux sur le chiffre d'affaires Ventes (5%) et Services (12%), soumission au minimum de perception légal, et émission d'un drapeau d'alerte de basculement au réel en cas de dépassement du seuil légal.
- **ANAE :** Calcul au taux de 0.5% avec application du minimum de perception légal et vérification des plafonds d'éligibilité.

### 2.5 Simulateur de Contrôle Fiscal (`TaxAuditSimulator`)
- Évaluation autonome par impôt :
  - **IBS :** Redressement de base imposable $\times$ taux sectoriel.
  - **TVA :** Rappel de TVA nette exigible non déclarée.
  - **TAP :** Droits simples calculés uniquement sur exercices non prescrits antérieurs à 2024.
- Application de la grille des pénalités selon le degré de qualification :
  - **Basse (Bonne foi) :** Pénalité de 10% (art. 193 CIDTA) + intérêts de retard (1% par mois).
  - **Médiane (Manquement délibéré) :** Pénalité de 25% + intérêts de retard.
  - **Haute (Irrégularités graves / Manœuvres délibérées) :** Pénalité de 100% (art. 193 bis CIDTA) + intérêts de retard.
- Restitution rigoureuse d'une fourchette financière opposable, sans cumul croisé des assiettes.

---

## 3. Résultats des Tests Dorés Validés

| Module | Scénario de Test Chiffré | Résultat Obtenu | Statut |
| :--- | :--- | :--- | :---: |
| **IBS Multi-Activités** | Mixte Production (10M à 19%) + Négoce (5M à 26%) avec compta séparée | **3 200 000.00 DA** (1.9M + 1.3M) | `PASS` |
| **IBS Sanction Sans Compta** | Même résultat global de 15M DA sans comptabilité séparée | **3 900 000.00 DA** (26% sur le tout) | `PASS` |
| **IBS Réintégration Ciblée** | Amende de 50 000 DA affectée au négoce (26%) | IBS majoré exactement de **13 000.00 DA** | `PASS` |
| **IBS Acomptes & Solde** | IBS N-1 = 1M DA (acomptes 3x300k = 900k), IBS N = 1.2M DA | Solde liquidation = **300 000.00 DA** | `PASS` |
| **TVA Prorata Annuel** | CA avec droit 80M, CA sans droit 20M ($P = 80\%$), TVA 100 000 DA | TVA Déductible = **80 000.00 DA** | `PASS` |
| **TVA Régularisation Quinquennale** | Machine acquise en 2024 (TVA déduite 190 000 DA), cédée en 2026 ($k=3$) | Reversement 2/5 = **76 000.00 DA** | `PASS` |
| **TAP Post-2024** | Chiffre d'affaires 50 000 000 DA sur exercice 2025 | Assiette = 0, Taxe = **0.00 DA** (Abrogée) | `PASS` |
| **TAP Historique 2023** | Chiffre d'affaires 50 000 000 DA sur exercice 2023 (Taux 2%) | Taxe = **1 000 000.00 DA** | `PASS` |
| **IFU Mixte & Minimum** | Ventes 4M DA (5%) + Services 1M DA (12%) | Impôt = **320 000.00 DA** | `PASS` |
| **IFU Plafond Dépassement** | Chiffre d'affaires total 9 500 000 DA (Plafond 8M DA) | `exceedsThreshold = true` (Bascule réel) | `PASS` |
| **Auto-entrepreneur (ANAE)** | CA Services 2 000 000 DA à 0.5% | Impôt = **10 000.00 DA** (Minimum légal) | `PASS` |
| **Simulation Redressement** | Base IBS omise 1 000 000 DA (26%), retard 6 mois | Basse: **296 400 DA**, Médiane: **340 600 DA**, Haute: **566 800 DA** | `PASS` |

