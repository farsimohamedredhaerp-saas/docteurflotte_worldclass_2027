# ADR-007 — Moteur d'Audit, Détection d'Anomalies & Fraude Légale : Loi de Benford, Fractionnement de Factures, Caisse Créditrice & Sensibilité d'Ordre, Seuils d'Espèces, Identifiants & Ratios

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/audit/`, Tests `test/audit-engine.spec.ts`  

---

## 1. Contexte & Enjeux Réglementaires et Déontologiques

Dans le cadre des contrôles comptables (SCF), fiscaux (CPF / CIDTA / CTCA) et d'audit légal en Algérie, la détection d'irrégularités doit concilier une rigueur mathématique absolue et une conformité déontologique stricte :

1. **Règle 6 — Indicateurs et signaux de risque, AUCUNE accusation péremptoire :**
   - Le moteur décisionnel qualifie les constats en « indices », « écarts statistiques », « risques » ou « anomalies », sans jamais employer de termes d'accusation (« fraude », « rejet certain ») dans son code source.
   - Toute anomalie majeure ou indice d'abus de droit exige une revue contradictoire humaine avant tout effet juridique ou fiscal (`humanReviewRequired = true`).

2. **Loi de Benford & Détection d'Anomalies Numériques :**
   - Les distributions statistiques des chiffres significatifs (1er chiffre, 2 premiers chiffres, 2e chiffre, 2 derniers chiffres) permettent de mettre en évidence des anomalies de manipulation numérique ou d'émissions de factures artificielles.
   - Nécessité d'un contrôle strict des prérequis d'applicabilité ($N \ge \text{minSampleSize}$, absence de numérotation séquentielle continue) pour éliminer les faux positifs statistiques.
   - Calcul de l'Écart Moyen Absolu (MAD - Mean Absolute Deviation) confronté aux seuils de Drake & Nigrini par test.

3. **Fractionnement de Factures & Abus de Droit (Art. 19 bis CPF) :**
   - Détection des grappes de factures émises pour un même tiers sur une fenêtre temporelle restreinte (ex: 30 jours), dont les montants individuels se situent juste sous un seuil réglementaire (ex: seuil espèces de déductibilité fiscale), et dont le cumul excède le seuil unitaire.
   - **Correction impérative du cahier des charges :** Le fractionnement constitue un indice d'**abus de droit (art. 19 bis du Code des Procédures Fiscales)**. Il ne doit **JAMAIS** déclencher de réintégration d'office automatique par le moteur sans examen contradictoire préalable.

4. **Contrôle d'Intégrité de Caisse (Art. 43 CPF) & Ordre Intra-Journalier :**
   - Une caisse physique ne peut en aucun cas présenter un solde négatif (on ne peut pas décaisser de l'argent physique inexistant). Un solde créditeur de caisse constitue un motif légal de remise en cause de la valeur probante de la comptabilité (art. 43 CPF).
   - Prise en compte impérative de **trois modes d'évaluation intra-journée** :
     * `DAILY_NET` : solde net en fin de journée calendaire.
     * `SEQUENCED` : chronologie fine horodatée point par point, détectant les découverts intra-journaliers même si la journée se termine en solde positif.
     * `WORST_CASE_WITHIN_DAY` : simulation du scénario défavorable (toutes les sorties avant les entrées) pour consigner la **sensibilité à l'ordre de saisie intra-journalier**.

5. **Paiements en Espèces & Plafonds Légaux :**
   - Seuil de déductibilité fiscale IBS : 300 000 DA TTC par facture (art. 169 CIDTA, LF 2018).
   - Seuil de perte du droit à déduction de la TVA pour les règlements en espèces : 100 000 DA TTC (paramètre distinct sous statut `UNVERIFIED`).
   - Interdiction absolue des paiements en espèces pour le secteur immobilier (art. 207 LF 2025).

6. **Validation Syntaxique des Identifiants (NIF, NIS, RC, AI) :**
   - Vérification de la structure syntaxique (longueur, composition numérique ou alphanumérique, structure Wilaya) sans inventer d'algorithme de clé de contrôle (Luhn ou autre) non officialisé par la DGI (statut `UNVERIFIED`).

7. **Incohérences de Ratios de Gestion :**
   - Détection des marges brutes commerciales négatives (anomalie bloquante de vente à perte ou minoration de recettes) ou sous-calibrées par rapport aux profils sectoriels.
   - Détection de la sous-rotation des stocks (immobilisation anormale de trésorerie ou provision pour dépréciation omise).
   - Détection de DSO excessif (Days Sales Outstanding) signalant des risques d'impayés ou de créances douteuses.

---

## 2. Architecture & Modules Déployés

### 2.1 Analyseur de Benford (`BenfordAnalyzer`)
- Modélisation mathématique rigoureuse :
  - 1er chiffre ($d \in 1..9$) : $P(d) = \log_{10}(1 + 1/d)$
  - 2 premiers chiffres ($d \in 10..99$) : $P(d) = \log_{10}(1 + 1/d)$
  - 2e chiffre ($d \in 0..9$) : $P(d) = \sum_{k=1}^9 \log_{10}(1 + 1/(10k + d))$
  - 2 derniers chiffres ($d \in 00..99$) : distribution uniforme $P(d) = 1/100$
- Calcul de l'écart moyen absolu (MAD) :
  $$\text{MAD} = \frac{1}{K} \sum_{i=1}^K |O_i - E_i|$$
- Qualification par les seuils de Nigrini (`CLOSE`, `ACCEPTABLE`, `MARGINAL`, `NON_CONFORMITY_RISK`).

### 2.2 Détecteur de Fractionnement (`InvoiceSplittingDetector`)
- Algorithme de clustering glissant par tiers : regroupe les factures comprises dans la bande suspecte $[\text{seuil} \times (1 - \text{marge}), \text{seuil}]$ sur une fenêtre temporelle paramétrable.
- Qualification formelle : indice d'abus de droit (art. 19 bis CPF) avec mention suspensive d'examen contradictoire obligatoire.

### 2.3 Auditeur de Caisse (`CashRegisterAuditor`)
- Implémentation complète des 3 modes d'évaluation :
  - `DAILY_NET` : détection des soldes créditeurs de fin de journée (`Severity.BLOQUANT`).
  - `SEQUENCED` : calcul du solde chronologique horodaté avec capture du montant exact du découvert et de la pièce défaillante (`Severity.BLOQUANT`).
  - `WORST_CASE_WITHIN_DAY` : calcul de sensibilité à l'ordre de saisie sans blocage indu (`Severity.MAJEUR`).

### 2.4 Contrôleur de Seuils d'Espèces (`CashThresholdChecker`)
- Traitement distinct du seuil de déductibilité IBS (300 000 DA TTC) et du seuil de déduction TVA (100 000 DA TTC).
- Répression des transactions immobilières en cash (art. 207 LF 2025).

### 2.5 Validateur d'Identifiants (`IdentifierSyntaxValidator`)
- Contrôle de la syntaxe NIF (15 ou 20 chiffres), NIS (11 chiffres), AI (11 chiffres), RC (format Wilaya alphanumérique), avec consigne claire du statut `UNVERIFIED` pour les clés mathématiques non publiées.

### 2.6 Détecteur d'Incohérences de Ratios (`RatioAnomalyDetector`)
- Calcul pur `EngineDecimal` de la marge brute, de la rotation des stocks, du délai d'écoulement et du DSO, comparés aux profils sectoriels injectés.

### 2.7 Générateur de Rapport Consolidé (`AuditReportGenerator`)
- Consolidation de l'ensemble des constatations par sévérité (`BLOQUANT`, `MAJEUR`, `MINEUR`, `INFO`), chiffrage de l'exposition financière totale en DZD, et détermination du niveau de risque global (`CRITIQUE`, `ELEVE`, `MOYEN`, `FAIBLE`).

---

## 3. Résultats des Tests Dorés Validés

| Domaine d'Audit | Scénario de Test Chiffré | Résultat Obtenu | Statut |
| :--- | :--- | :--- | :---: |
| **Benford Échantillon** | Échantillon de 4 montants ($N < 50$) | `isApplicable = false`, MAD = `0.000000` | `PASS` |
| **Benford Conformité** | Série synthétique 500 montants respectant Benford | Conformité confirmée, MAD < 0.012 | `PASS` |
| **Benford Détection** | Série manipulée avec 75% de 7 et 8 | `NON_CONFORMITY_RISK`, suspect: [7, 8] | `PASS` |
| **Fractionnement CPF** | 3 factures ATLAS (290k, 285k, 295k) en 12j sous 300k DA | 1 grappe détectée (870 000 DA), Art. 19 bis CPF | `PASS` |
| **Caisse DAILY_NET** | Solde début 5k, recettes 20k, sorties 35k | Solde fin = **-10 000 DA** (`BLOQUANT`, art. 43) | `PASS` |
| **Caisse SEQUENCED** | Sortie 15k à 09h00 (solde début 2k) puis entrée 30k à 16h00 | Découvert intra-journalier détecté (**-13 000 DA**) | `PASS` |
| **Caisse WORST_CASE** | Solde début 10k, entrée 50k, sortie 40k non horodatée | `hasOrderSensitivity = true` (`MAJEUR`) | `PASS` |
| **Seuil Espèces IBS** | Facture cash 350k HT + 66.5k TVA = 416.5k TTC | Réintégration IBS = **350 000 DA**, Perte TVA = **66 500 DA** | `PASS` |
| **Cash Immobilier** | Transaction immobilière de 500 000 DA en espèces | Rejet immédiat (`BLOQUANT`, art. 207 LF 2025) | `PASS` |
| **Identifiants** | NIF 15 chiffres `160012345678901` (Wilaya 16) | `isValid = true`, `hasOfficialChecksum = false` | `PASS` |
| **Ratio Marge Négative** | CA HT 10M DA, Achats consommés 11M DA | Marge = **-1 000 000 DA** (`NEGATIVE_MARGIN`, `BLOQUANT`) | `PASS` |
| **Ratio DSO Excessif** | CA TTC 36.5M DA, Encours clients 15M DA | DSO = **150 jours** (vs seuil 90j, `EXCESSIVE_DSO`) | `PASS` |
| **Rapport Consolidé** | Dossier avec caisse négative et fractionnement 585k DA | Risque global = **CRITIQUE**, 1 bloquant, 1 majeur | `PASS` |

