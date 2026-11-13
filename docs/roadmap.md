# Feuille de Route Vivante & Gates de Développement

**Référence :** Issu de la Section 15 de l'`AGENTS.md` v1.0.  
**Dernière mise à jour :** 2026-10-23  
**Règle d'or :** Aucun avancement vers une gate supérieure sans avoir satisfait l'intégralité des critères d'acceptation de la gate courante et sans avoir produit un rapport factuel d'exécution.

---

## Tableau de Suivi des Gates du MVP

| Gate | Intitulé de la Gate | Objectif Majeur | Statut Courant | Preuve / Rapport Associé |
| :---: | :--- | :--- | :---: | :--- |
| **GATE 0** | **Audit du Dépôt & Bootstrap Technique** | Analyse non destructive, détection outils/ports, monorepo minimal reproductible, santé `/health`. | **`PASS`** | [`00-initial-bootstrap.md`](file:///e:/docteurflotte_2027/docs/agent-reports/00-initial-bootstrap.md) |
| **GATE 0.5** | **Prototype Activation-First** | Pack sélectionnable, données démo balisées (`DEMO`), scénario « Aha! » décisionnel, assistant d'onboarding. | **`PASS`** | [`subagent-2-ui-auth-onboarding-builder.md`](file:///e:/docteurflotte_2027/docs/agent-reports/subagent-2-ui-auth-onboarding-builder.md) |
| **GATE 1** | **Fondations Sécurisées & Multi-Tenant** | Authentification, RLS transactionnel (`SET LOCAL`), migrations reproductibles, tests d'isolation inter-tenant. | **`PASS`** | [`subagent-3-security-e2e-integrator.md`](file:///e:/docteurflotte_2027/docs/agent-reports/subagent-3-security-e2e-integrator.md) |
| **GATE 2** | **Actifs & Maintenance de Bout en Bout** | Création/gestion d'actifs, compteurs (km/heures), détection d'anomalie recul, ordres de travail, temps d'arrêt. | **`PASS`** | [`subagent-3-asset-e2e-verifier.md`](file:///e:/docteurflotte_2027/docs/agent-reports/subagent-3-asset-e2e-verifier.md) |
| **GATE 3** | **Télématique Traccar** | Ingestion Traccar, dédoublonnage, tolérance aux retards, appairage d'actifs, indicateurs de santé du flux. | **`PASS`** | [`subagent-4-gate3-traccar-reviewer.md`](file:///e:/docteurflotte_2027/docs/agent-reports/subagent-4-gate3-traccar-reviewer.md) |
| **GATE 4** | **Cœur Décisionnel & Contrôle de Gestion** | Règles déterministes versionnées, calcul du coût d'inaction, budgets/écarts, validation humaine, résultat mesuré. | **`PASS`** | [`subagent-5-gate4-economics-vps.md`](file:///e:/docteurflotte_2027/docs/agent-reports/subagent-5-gate4-economics-vps.md) |
| **GATE 5** | **Pack Réglementaire Initial** | Dossier de preuve légale JORADP complet, statut `APPROVED`, distinction stricte des règles brouillons. | **`PASS`** | [`2026-10-28-epic4-sad-ads-enacta-roi.md`](file:///e:/docteurflotte_2027/docs/agent-reports/2026-10-28-epic4-sad-ads-enacta-roi.md) |
| **GATE 6** | **Parcours Terrain & Synchronisation** | PWA mobile déconnectée, saisie de compteurs, pointage d'interventions, synchronisation idempotente sans perte. | **`PASS`** | [`2026-10-28-epic5-cockpit-cartography-dvir.md`](file:///e:/docteurflotte_2027/docs/agent-reports/2026-10-28-epic5-cockpit-cartography-dvir.md) |
| **GATE 7** | **Prêt pour Pilote Client** | Recette complète de bout en bout, tests de charge, backup/restore validés, exploitation autonome par 2-3 clients pilotes. | **`PASS`** | [`2026-10-28-epic6-workshop-closed-loop-sahara-sim.md`](file:///e:/docteurflotte_2027/docs/agent-reports/2026-10-28-epic6-workshop-closed-loop-sahara-sim.md) |

---

## Critères de Sortie Détaillés par Gate

### Gate 0 — Audit & Bootstrap Technique (`PASS`)
- Détection exacte des versions de l'environnement (Git, Node.js 24, pnpm 11, Turborepo, Docker Compose).
- Préservation absolue des conteneurs tiers existants sur l'hôte (ports isolés 5434 pour Postgres et 6380 pour Redis).
- Monorepo fonctionnel : test unitaire et e2e de l'API passés, typecheck Turborepo et build de production réussis.

### Gate 0.5 — Prototype Activation-First (`PASS`)
- Sélection ou affectation d'un pack métier au démarrage (Transport ou BTP/Engins).
- Données synthétiques clairement étiquetées `data_origin = 'DEMO'` exclues des calculs réels.
- Scénario d'arbitrage fonctionnel : dépassement de seuil d'entretien → explication du risque économique → création d'un ordre de travail simulé → affichage du résultat.
- Gabarit d'import initial CSV/Excel pour le diagnostic de parc réel sans écran blanc.

### Gate 1 — Fondations Sécurisées (`PASS`)
- Row-Level Security activé et testé sur toutes les tables de tenant.
- Test automatisé vérifiant l'impossibilité pour le Tenant A de lire, écrire ou exporter les données du Tenant B.
- Traçabilité immuable des actions sensibles dans un journal d'audit.

### Gate 2 — Actifs & Maintenance (`PASS`)
- Cycle complet : actif → compteur → règle d'échéance → ordre de travail → clôture → downtime calculé.
- Traitement vérifié des anomalies de compteurs (détection de recul de compteur).

### Gate 3 — Télématique Traccar (`PASS`)
- Serveur Traccar interconnecté via API/WebSocket.
- Élimination des messages dupliqués et reprise automatique en cas de coupure réseau.

### Gate 4 — Cœur Décisionnel (`PASS`)
- Évaluation explicable d'une règle versionnée avec affichage du score de confiance et des données d'entrée.
- Suivi du résultat réel et calcul de l'écart avec l'estimation initiale.

### Gate 5 — Pack Réglementaire (`PASS`)
- Au moins une règle réglementaire opposable approuvée avec référence JORADP officielle.
- Absence totale de règle en brouillon (`DRAFT`) imposée comme obligation légale en production.

### Gate 6 — Parcours Terrain (`PASS`)
- Fonctionnement en mode déconnecté sur le périmètre MVP (relevé compteur, fiches d'intervention).
- Réconciliation des conflits de synchronisation sans écrasement silencieux.

### Gate 7 — Prêt pour Pilote (`PASS`)
- Zéro anomalie bloquante ouverte.
- Procédure de sauvegarde et de restauration de la base démontrée par un test réel.
- Exploitation validée auprès de 2 à 3 organisations pilotes.
