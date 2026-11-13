# ADR-010 — Pilier D2 : Audit Statistique & Score de Risque (AUD-02 Reconstitution de CA, Benford Multivarié Avancé, Fournisseurs à Examiner, Score de Risque Global Multi-Impôts)

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/audit/statistical/`, Tests `test/audit-statistical.spec.ts`, Benchmark `scripts/bench-decision-engine.cjs`  

---

## 1. Contexte & Enjeux Réglementaires et Techniques

Le pilier D2 du moteur décisionnel introduit l'audit statistique et l'évaluation actuarielle globale des risques fiscaux et comptables pour les entreprises algériennes :

1. **AUD-02 — Reconstitution Déterministe du Chiffre d'Affaires (Art. 43 CPF) :**
   - **Règle déontologique absolue (Règle 6) :** La reconstitution est un simple **indice de cohérence matérielle**, et non un redressement fiscal automatique. Toute discordance exige un examen contradictoire oral et écrit (`humanReviewRequired = true`).
   - **Négoce :**
     $$\text{CAMV} = SI + \text{Achats} + \text{Frais d'approche} - SF - \text{Pertes justifiées}$$
     $$CA_{\text{reconstitué}} = \sum (\text{CAMV}_f \times k_f)$$
     Une perte n'est déduite que si la pièce justificative probante (PV de destruction, constat d'huissier, certificat d'avarie) existe et est validée. Les pertes non justifiées sont présumées vendues au coefficient de marge.
   - **Industrie & Production :**
     $$M_{\text{cons}} = Q_{SI} + Q_{\text{achats}} - Q_{SF} - Q_{\text{pertes\_justifiées}}$$
     $$Q_{\text{produite}} = \frac{M_{\text{cons}} \times (1 - \alpha)}{q_{\text{std}}}$$
     $$CA_{\text{reconstitué}} = Q_{\text{produite}} \times P_{\text{vente\_moyen}}$$
     Contrôle croisé d'intensité énergétique : le ratio $\text{kWh consommés} / Q_{\text{produite}}$ est confronté à la plage $[\mu - k\sigma, \mu + k\sigma]$. Une déviation anormale signale une anomalie matérielle (production dissimulée ou travail non déclaré).
   - **Services :**
     Reconstitution à partir des consommables traceurs unitaires ($N_{\text{actes}} = Q_{\text{consommable}} / q_{\text{unitaire}}$).

2. **AUD-06 — Analyse de Benford Multivariée & Prérequis d'Applicabilité :**
   - Prise en charge des 4 tests d'échelle :
     * `FIRST_DIGIT` (1er chiffre : 1 à 9, $df = 8$)
     * `FIRST_TWO_DIGITS` (2 premiers chiffres : 10 à 99, $df = 89$)
     * `SECOND_DIGIT` (2e chiffre : 0 à 9, $df = 9$)
     * `LAST_TWO_DIGITS` (2 derniers chiffres : 00 à 99, distribution uniforme, $df = 99$)
   - **Contrôle strict des prérequis d'applicabilité avant tout calcul :**
     * Taille minimale par test ($N \ge 100$ pour le 1er chiffre, $N \ge 300$ pour les 2 premiers chiffres, $N \ge 150$ pour le 2e chiffre, $N \ge 300$ pour les 2 derniers). Si $N < \text{seuil}$, retour `NOT_APPLICABLE` avec motif explicite.
     * Étendue des données : au moins 2 ordres de grandeur ($\log_{10}(\max) - \log_{10}(\min) \ge 2$).
     * Absence de numérotation séquentielle continue attribuée (pas constant $\Delta = c$).
   - Statistiques complètes :
     * $Z$-score avec correction de continuité par bin :
       $$Z_i = \max\left(0, \frac{|p_{\text{obs}, i} - p_{\text{exp}, i}| - \frac{1}{2N}}{\sqrt{\frac{p_{\text{exp}, i}(1 - p_{\text{exp}, i})}{N}}}\right)$$
     * Test du Khi-deux ($\chi^2$) confronté aux valeurs critiques théoriques ($p = 0.05$).
     * Écart Moyen Absolu (MAD) étalonné sur les seuils de Drake & Nigrini par test (`CLOSE_CONFORMITY`, `ACCEPTABLE_CONFORMITY`, `MARGINALLY_ACCEPTABLE`, `NON_CONFORMITY_RISK`).

3. **Fournisseurs à Examiner (Scoring Multi-Indicateurs) :**
   - Détection d'anomalies spécifiques aux entreprises fictives ou complaisantes :
     * **Séquence anormale** : factures consécutives ($N$ et $N+1$) émises à plusieurs semaines d'intervalle pour le même client.
     * **Arrondis suspects** : proportion anormalement élevée de montants ronds en milliers de DA sans centimes.
     * **Fractionnement** : multiples factures à moins de 3 jours d'intervalle.
     * **Identifiants** : NIF manquant ou longueur non conforme (hors 15 ou 20 chiffres).
   - Score pondéré de 0 à 100 avec libellé obligatoire : **« Fournisseur à examiner »**.

4. **Score de Risque Global Multi-Impôts (GlobalRiskScorer) :**
   - Agrégation pondérée de l'ensemble des alertes comptables et fiscales.
   - Poids par sévérité et plafonds par famille de règles configurables dans le pack.
   - Note globale normalisée de 0 à 100.
   - **Fourchette financière en DZD par impôt** : décomposition distincte pour l'IBS, la TVA et les Pénalités/Timbre.
   - **Déterminisme absolu :** résultats strictement identiques d'une exécution à l'autre.
   - Architecture prête pour les files de tâches asynchrones d'arrière-plan (`pg-boss`).

---

## 2. Décisions d'Architecture & Algorithmes

### 2.1 Pureté et Indépendance du Moteur Statistique
- Aucune fonction d'horloge impure ou d'accès base dans les évaluateurs.
- La génération de données synthétiques s'appuie sur un générateur congruentiel linéaire (LCG) à graine fixe pour assurer la reproductibilité intégrale des tests dorés.

### 2.2 Respect Intégral du Garde-Fou Anti-Hardcode
- Zéro taux fiscal en dur (le linter `pnpm lint:hardcode` inspecte rigoureusement l'absence de taux `0.19`, `0.26`, `0.15`, `0.05`, etc.).
- Les seuils de tolérance et coefficients multiplicateurs de vente sont fournis en paramètres d'entrée ou injectés par les packs réglementaires.
- Aucun terme accusatoire (« fraude », « rejet certain ») dans le code source ou les commentaires.

---

## 3. Résultats de Validation & Métriques

1. **Suites de Tests Unitaires (`test/audit-statistical.spec.ts`) :**
   - 14 tests unitaires couvrant l'intégralité du pilier D2 :
     - Benford 10 000 montants log-uniformes synthétiques $\rightarrow$ $MAD = 0.0039 < 0.006$ (`CLOSE_CONFORMITY`).
     - Injection de 15% de montants commençant par 8 $\rightarrow$ détection immédiate en `NON_CONFORMITY_RISK` avec suspectBin `[8]`.
     - Échantillon de 50 lignes pour 2 chiffres $\rightarrow$ retour `NOT_APPLICABLE` avec motif d'échantillon insuffisant.
     - Étendue $< 2$ ordres de grandeur $\rightarrow$ `NOT_APPLICABLE`.
     - Suite séquentielle à incrément constant $\rightarrow$ `NOT_APPLICABLE`.
     - Reconstitution de CA négoce : conforme sous la tolérance, alerte majeure au-delà de la tolérance.
     - Déduction des pertes justifiées vs réintégration des pertes non justifiées.
     - Production industrielle avec détection d'anomalie d'intensité énergétique.
     - Services par consommable traceur unitaire.
     - Scoring fournisseur avec détection d'intervalles consécutifs anormaux et montants ronds.
     - Déterminisme strict du score global et fourchettes financières par impôt.
     - Plafonds de points par famille d'alerte.
   - **Résultat :** 14/14 tests au statut vert.

2. **Total `@docteurflotte/decision-engine` :**
   - 13 suites de tests Vitest, **125/125 tests au statut vert**.

3. **Benchmarks de Performance :**
   - Analyse de Benford 1er chiffre (10 000 montants) : **35.2 ms** (284 099 ops/s, latence 3.52 µs).
   - Auditeur de caisse déterministe (100 000 écritures) : **902 ms** (110 799 ops/s).
   - Règle AST compilée 20 nœuds (1 000 000 itérations) : **16.3 s** (61 348 ops/s).

