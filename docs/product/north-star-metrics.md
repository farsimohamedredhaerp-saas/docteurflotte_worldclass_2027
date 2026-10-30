# NORTH STAR & PRODUCT METRICS FRAMEWORK — DOCTEURFLOTTE

**Statut :** DOCUMENT DE CADRAGE — VALEURS PROPOSÉES À VALIDER PAR LE FONDATEUR  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/product/mvp-scope-and-activation.md`  

---

## 1. Métrique North Star (Métrique Clé du Produit)

### Métrique proposée
> **Volume hebdomadaire de décisions opérationnelles ou de maintenance exécutées avec résultat mesuré (Weekly Closed-Loop Decisions).**

### Justification
DocteurFlotte n'est pas un simple visualiseur GPS passif ni un répertoire documentaire statique. La valeur réelle perçue par le client réside dans la complétion de la boucle canonique :  
`Données → Preuves → Contrôles → Exceptions → Analyses → Décisions → Actions → Résultats → Apprentissage`.  
Une décision exécutée dont l'impact économique ou opérationnel est constaté (coût évité, panne prévenue, disponibilité préservée) prouve la rentabilité directe de l'abonnement SaaS.

---

## 2. Indicateurs d'Activation (Activation-First)

| Indicateur | Définition | Cible proposée | Méthode de mesure |
| :--- | :--- | :--- | :--- |
| **Time-to-First-Value (TTFV)** | Temps écoulé entre la validation de l'inscription et la première consultation d'un diagnostic/décision de démonstration explicable | `PROPOSÉ — Moins de 3 minutes (À VALIDER PAR LE FONDATEUR)` | Timestamp `user_registered` → Timestamp premier événement télémétrie `decision_inspected` |
| **Taux d'activation démo** | Pourcentage de nouveaux inscrits simulant le cycle décision → ordre de travail de démonstration | `PROPOSÉ — 70% des inscrits (À VALIDER PAR LE FONDATEUR)` | Ratio `sessions_with_demo_action / total_registrations` |
| **Time-to-First-Import** | Délai avant le premier import réel (CSV / XLSX) réussi sans erreur bloquante | `PROPOSÉ — Moins de 48 heures (À VALIDER PAR LE FONDATEUR)` | Timestamp `user_registered` → Premier batch `import_status = SUCCESS` |

---

## 3. Qualité et Intégrité des Données (Data Confidence)

| Indicateur | Définition | Cible proposée | Méthode de mesure |
| :--- | :--- | :--- | :--- |
| **Score de confiance des données parc** | Pourcentage d'actifs disposant de compteurs cohérents, sans recul ni doublons critiques | `PROPOSÉ — > 95% des actifs suivis (À VALIDER PAR LE FONDATEUR)` | Algorithme de diagnostic de parc (Skill `diagnostic-parc-data-quality`) |
| **Taux de rejets compteurs** | Proportion de relevés kilométriques ou horaires rejetés pour incohérence physique | `PROPOSÉ — < 2% du flux entrant (À VALIDER PAR LE FONDATEUR)` | Log d'ingestion télématique & validation saisies manuelles |

---

## 4. Engagement & Rétention

| Indicateur | Définition | Cible proposée | Méthode de mesure |
| :--- | :--- | :--- | :--- |
| **Taux d'adhésion aux recommandations** | Pourcentage d'arbitrages de maintenance recommandés acceptés ou convertis en ordres de travail réels | `PROPOSÉ — > 60% (À VALIDER PAR LE FONDATEUR)` | Ratio `decisions_approved / decisions_emitted` sur données réelles |
| **Rétention hebdomadaire (WAU / MAU)** | Fréquence de connexion des gestionnaires et contrôleurs de gestion | `PROPOSÉ — Ratio WAU/MAU > 50% (À VALIDER PAR LE FONDATEUR)` | Événements d'accès authentifiés par tenant |
