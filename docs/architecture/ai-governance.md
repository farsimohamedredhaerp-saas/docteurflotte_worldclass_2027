# GOUVERNANCE DE L'INTELLIGENCE ARTIFICIELLE & DES MODÈLES DÉCISIONNELS

**Statut :** DOCUMENT TECHNIQUE DE GOUVERNANCE  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/product/mvp-scope-and-activation.md`, Skill `predictive-maintenance-governance`  

---

## 1. Principe Directeur : Souveraineté Humaine

> **« L'IA conseille, les politiques gouvernent, les humains autorisent, les systèmes exécutent dans les limites approuvées. »**

Dans DocteurFlotte :
- Tout arbitrage décisionnel (déclenchement d'un remplacement de pièce coûteux, immobilisation d'un actif) doit pouvoir être inspecté, expliqué et validé par un utilisateur humain autorisé.
- Aucun modèle probabiliste ne peut exécuter de dépense ou de commande de manière autonome sans seuil d'approbation préalablement consigné dans les politiques du tenant.

---

## 2. Jeu de Référence & Évaluation Continue (Golden Benchmark)

Pour tout composant analytique ou algorithmique d'anticipation de panne :
1. **Constitution d'un dataset de test étanche :**
   - Jeu de données historique validé et horodaté (interdictions de fuite temporelle / data leakage).
   - Validation croisée sur des parcs d'actifs réels représentatifs (véhicules légers, poids lourds, engins BTP).
2. **Métriques d'évaluation obligatoires :**
   - Précision ($P$) et Rappel ($R$) pour la détection des anomalies.
   - Contrôle du taux de faux positifs : `PROPOSÉ — Faux positifs < 5% (À VALIDER PAR LE FONDATEUR)` pour éviter la lassitude des alertes (« alarm fatigue »).

---

## 3. Confidentialité & Journalisation sans Données Personnelles

1. **Minimisation des données (Privacy-by-Design) :**
   - Les prompts, entrées et sorties des modèles d'analyse ne doivent jamais contenir de données nominatives de conducteurs (nom, prénom, numéro de permis, téléphone).
   - Seuls les identifiants techniques pseudonymisés (`asset_id`, `work_order_id`, codes d'anomalie OBD/CAN, compteurs) sont transmis aux modules de raisonnement.
2. **Journal d'Inférence et d'Explicabilité :**
   - Chaque recommandation est consignée avec : version du modèle, données d'entrée précises, règle ou seuil activé, niveau de confiance et justification textuelle lisible.

---

## 4. Taux d'Acceptation et Boucle d'Apprentissage

- **Suivi du taux d'acceptation :**
  - Mesure continue du ratio : $\frac{\text{Recommandations approuvées par un humain}}{\text{Recommandations totales émises}}$.
  - Si le taux d'acceptation d'un type de règle descend sous `PROPOSÉ — 40% (À VALIDER PAR LE FONDATEUR)`, la règle est automatiquement rétrogradée en statut d'avertissement pour révision par les experts métier.
- **Enregistrement des motifs de rejet :** Tout rejet d'une recommandation par un gestionnaire de flotte oblige à sélectionner un motif (donnée erronée, intervention déjà faite, arbitrage budgétaire contraire, etc.) pour nourrir l'amélioration continue du moteur de règles.
