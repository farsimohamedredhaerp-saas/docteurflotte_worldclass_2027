# ADR-009 — Pilier D1 : Audit Déterministe Approfondi (Caisse Incrémentale, Fractionnement Avancé, Cadrage Déclaratif G50, Validation Identifiants & Espèces Prohibées)

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/audit/deterministic/`, Tests `test/audit-deterministic.spec.ts`, Benchmark `scripts/bench-decision-engine.cjs`  

---

## 1. Contexte & Enjeux Réglementaires et Techniques

L'audit comptable et fiscal automatisé requiert des algorithmes déterministes à haute performance capables d'ingérer des flux volumineux tout en garantissant une traçabilité mathématique et juridique sans faille. Ce pilier D1 approfondit les contrôles d'intégrité selon 5 axes réglementaires algériens majeurs :

1. **AUD-01 — Contrôle d'Intégrité de Caisse (Art. 43 CPF) & Recalcul Incrémental Partiel :**
   - Une caisse physique ne peut pas être négative. Le constat d'un solde créditeur entraîne la remise en cause de la valeur probante de la comptabilité avec risque de rejet partiel ou total (art. 43 CPF).
   - Prise en compte du fuseau horaire légal `Africa/Algiers` (UTC+1 fixe) : une écriture passée à 23:30 UTC le 14/03 relève du 15/03 local.
   - Tri canonique opposable : `(local_date, recorded_at, piece, ligne)`.
   - Continuité des exercices : ouverture d'un jour = clôture du jour précédent.
   - Évaluation simultanée selon les trois modes requis : `DAILY_NET`, `SEQUENCED`, `WORST_CASE_WITHIN_DAY` (détectant la sensibilité à l'ordre intra-journalier).
   - Capacité de recalcul partiel (`buildIndex(entries, initialBalance, existingIndex, fromDate)`) lorsqu'une écriture antidatée est insérée a posteriori.
   - Détection des motifs associés : régularisation tardive et concentration anormale d'apports en fin de mois.
   - Simulation de l'impact fiscal en fourchette (droits simples + pénalités 10% ou 100% art. 193/193 bis CIDTA).

2. **AUD-03 — Fractionnement de Factures & Abus de Droit (Art. 19 bis CPF) :**
   - Algorithme à deux pointeurs glissants détectant les grappes de factures émises pour un même partenaire dans une fenêtre temporelle (ex: 30 jours).
   - Distinction formelle :
     * `INDICE_FORT` : toutes les factures de la grappe se situent dans la « bande haute » immédiatement sous le seuil unitaire (ex: entre 258 000 DA et 300 000 DA TTC).
     * `INDICE_FAIBLE` : factures plus disparates cumulant au-delà du seuil.
   - **Garde-fou non négociable :** `auto_reintegrate = false` systématique. Le fractionnement est un indice d'abus de droit (art. 19 bis CPF) nécessitant obligatoirement un débat contradictoire oral et écrit, jamais une réintégration d'office aveugle.

3. **AUD-04 — Cadrage & Réconciliation Déclarative (G50 vs Grand Livre) :**
   - Rapprochement entre les bases imposables issues de la comptabilité (chiffre d'affaires encaissé ou facturé selon l'impôt) et les montants reportés sur la liasse mensuelle G50 déposée.
   - Tolérances paramétrables (en DZD et en pourcentage) pour absorber les arrondis de centimes sans fausse alerte.
   - Qualification des discordances de bases ou d'impôt avec traçabilité complète.

4. **AUD-05 — Validation Syntaxique des Identifiants & Contrôle Liste Noire :**
   - Respect strict des formats légaux : NIF à 15 chiffres (personnes physiques/morales ordinaires) ou 20 chiffres (format étendu DGI), NIS à 11 chiffres, RC alphanumérique.
   - Rejet formel des NIF non conformes (ex: 14 chiffres).
   - Contrôle d'appartenance à une liste noire locale (sociétés radiées, prête-noms, entreprises fictives répertoriées).
   - Signalement suspensif `humanReviewRequired = true`.

5. **AUD-07 — Interdiction Sectorielle d'Espèces (Art. 207 LF 2025) :**
   - Les interdictions de règlements en espèces (ex: transactions immobilières art. 207 LF 2025, versements sans justificatif bancaire) sont paramétrées sous forme de données et non codées en dur.
   - Détection des infractions avec mention de la référence légale et notification de risque bloquant.

---

## 2. Décisions d'Architecture & Algorithmes

### 2.1 Index de Caisse Incrémental & Tri Canonique
- **Structure :** `IncrementalCashIndex` maintient une `Map<string, CashDayState>` ordonnée par date locale `Africa/Algiers`.
- **Recalcul ciblé :** Lorsque de nouvelles écritures sont injectées avec `fromDate`, seules les dates postérieures ou égales à `fromDate` voient leur solde d'ouverture recalculé en cascade depuis le solde de clôture du jour précédent.
- **Performance :** L'évaluation de 100 000 mouvements de caisse s'exécute en **836 ms** (119 550 mouvements/seconde), garantissant le traitement de 1 000 000 de mouvements en moins de 9 secondes (cible < 30 s largement dépassée).

### 2.2 Fenêtre Glissante à Deux Pointeurs pour le Fractionnement
- Tri préalable par partenaire et date d'émission chronologique.
- Pour chaque facture sous le seuil unitaire, une fenêtre glissante explore les factures subséquentes tant que `daysDiff <= windowDays`.
- Si la somme cumulée dépasse le seuil réglementaire et que le nombre de factures $\ge 2$, une grappe de fractionnement est constituée.
- Qualification en `INDICE_FORT` si chaque facture $a \in [\text{seuil} \times (1 - \text{ratio}), \text{seuil}]$, sinon `INDICE_FAIBLE`.

### 2.3 Respect Absolu de la Règle 6 (Aucune Accusation dans le Code)
- Le linter de garde-fou `scripts/guardrails/lint-decision-engine-hardcode.cjs` valide l'absence de tout terme accusatoire (`fraude`, `rejet certain`).
- Tous les libellés utilisent la terminologie déontologique : « Indice fort d'abus de droit », « Sensibilité à l'ordre intra-journalier », « Écart de cadrage déclaratif », « Risque fiscal estimé ».

---

## 3. Résultats de Validation & Métriques

1. **Tests Unitaires Déterministes (`test/audit-deterministic.spec.ts`) :**
   - 14 tests unitaires couvrant l'intégralité des 5 sous-modules :
     - AUD-01 : Décalage UTC+1 (23:30 UTC -> J+1), sensibilité d'ordre (DAILY_NET > 0 mais WORST_CASE < 0), déficit cumulé, recalcul partiel après insertion antidatée, concentration d'apports fin de mois.
     - AUD-03 : Détection d'indice fort sous 300 000 DA TTC, indice faible, absence d'alerte sur factures espacées de 45 jours.
     - AUD-04 : Cadrage G50 parfait, détection d'écart de base excédant la tolérance.
     - AUD-05 : Rejet syntaxique NIF 14 chiffres, acceptation NIF 15/20 chiffres, blocage sur liste noire.
     - AUD-07 : Détection d'infraction d'espèces sur acquisition immobilière (art. 207 LF 2025).
   - **Résultat :** 14/14 tests passés au vert.

2. **Total `@docteurflotte/decision-engine` :**
   - 12 suites de tests Vitest, **111/111 tests au statut vert**.

3. **Total Monorepo & Non-Régression API :**
   - 33 suites Jest API, **264/264 tests au statut vert**.
   - Typecheck TypeScript : **0 erreur**.
   - Linter anti-hardcode : **0 infraction**.

4. **Benchmark Caisse (AUD-01) :**
   - 100 000 écritures traitées en **836.47 ms** (débit : 119 550 ops/s, latence : 8.36 µs/mouvement).

