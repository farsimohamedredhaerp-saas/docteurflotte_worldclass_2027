# AGENTS.md — Contrat Maître d'Exploitation & Ingénierie (v3.0 - World-Class DZ-First)

**Produit :** Plateforme Souveraine de Télémétrie, IoT Multi-Métiers, Maintenance Prédictive (OEM-First) & Décision Réglementaire — Leader Marché Algérien  
**Version du contrat :** 3.0 (2026-10-28)  
**Document Directeur :** [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) (Master Spec v2.0+)  
**Plan d'Exécution :** [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md)  
**Cible d'exécution :** Google Antigravity IDE / Agents de développement autonomes  
**Dépôt de référence :** Monorepo TypeScript & Python (Next.js 15, NestJS / FastAPI, PostgreSQL 16 / TimescaleDB, Redis, Traccar 6.x / Flespi)  
**Archives :** [`docs/archive/AGENTS.v1.1.md`](file:///e:/docteurflotte_2027/docs/archive/AGENTS.v1.1.md)

---

## 1. Mission & Avantage Compétitif (« Algeria-First, World-Class »)

1. **Domination Locale & Standard Mondial :** Construire la plateforme SaaS multi-tenant souveraine de référence en Algérie (Logistique, BTP/Mines, Hydrocarbures, Agriculture, Ateliers), surpassant Samsara/Geotab par une adaptation native aux réalités algériennes.
2. **Modèle « OEM-First & Hardware-Agnostic » à 3 Modes :**
   - *Mode 0 (Zéro Boîtier)* : Réconciliation tickets/cartes Naftal, routage Valhalla, inspections DVIR mobiles Offline-First.
   - *Mode 1 (GPS Standard)* : Ingestion haute fréquence Traccar, géo-clôtures par Wilaya, éco-conduite.
   - *Mode 2 (Full CAN / J1939 / IoT)* : Télémétrie moteur profonde, prise de force (PTO), chaînes du froid et engins lourds.
3. **Moteur Décisionnel Financier (SAD $\rightarrow$ ADS) :** Transformer chaque donnée brute en arbitrage financier en **Dinars Algériens (DZD)** : Coût d'Action Préventive vs Risque d'Inaction (immobilisation, casse moteur, pénalités contractuelles), avec suggestion automatique de véhicule de substitution.
4. **Physique Prédictive Déterministe & Explicable :** Exécuter 6 modèles physiques (Arrhenius huile, Cranking SOH batterie, thermique radiateur/culasse, Archard freins, colmatage FAP, CUSUM anti-fraude carburant) couplés au score VHI (0-100) avec **preuve explicable** pour le chef de parc.
5. **Souveraineté Absolue & Conformité Algérienne :** Conformité intégrale à la **Loi 18-07 (ANPDP)** (hébergement local DZ, anonymisation matérielle stricte), au barème **ENACTA**, au Code de la Route algérien (58 Wilayas) et aux règles de facturation **DGI**.

---

## 2. Piliers d'Ingénierie « World-Class » (Exigences Non-Fonctionnelles)

Tout code produit par un agent doit respecter ces 4 standards de compétitivité :

- **Résilience « Zones Blanches & Grand Sud » (Offline-First) :**
  - Côté Mobile/Web (DVIR, Ateliers) : Tolérance native aux coupures réseau (synchronisation différée avec résolution de conflits horodatée).
  - Côté IoT/Télématique : Capacité d'absorber sans perte ni faux positif des rafales de rattrapage (*Store-and-Forward* Teltonika/Traccar après traversée de zone sans réseau 2G/4G) en triant systématiquement par `device_timestamp` et non par `server_ingestion_timestamp`.
- **Bilinguisme Natif & Ergonomie Terrain (FR / AR - RTL) :**
  - Zéro chaîne de texte codée en dur dans l'UI. Tout texte passe par les dictionnaires i18n (`fr-DZ`, `ar-DZ`) avec support CSS Logique (compatible **RTL** pour l'arabe).
  - Les interfaces destinées aux chauffeurs et mécaniciens privilégient le visuel, les codes couleurs universels et les flux rapides (3 clics maximum).
- **Performance & FinOps (Optimisation Coût/Véhicule) :**
  - Requêtes TimescaleDB bornées obligatoirement par `tenant_id` ET `time_bucket` (interdiction des `SELECT *` sans filtre temporel sur les hypertables).
  - Temps de réponse API P95 < 200ms sur les tableaux de bord grâce aux *Continuous Aggregates* TimescaleDB et au cache Redis.
- **Explicabilité Algorithmique (XAI) :**
  - Une alerte prédictive ou de fraude carburant (CUSUM) ne renvoie jamais un simple booléen : elle retourne le vecteur de preuve (ex: delta litre, localisation GPS, pente topographique Valhalla, régime moteur) pour éviter tout conflit social injustifié avec les chauffeurs.

---

## 3. Interdictions Absolues (Garde-Fous)

- **Zéro Réécriture Brutale :** Ne jamais réécrire le dépôt, changer la stack ou modifier l'architecture sans ADR formel validé.
- **Zéro Invention Réglementaire ou Physique :** Ne jamais inventer une loi, un décret JORADP, un barème ENACTA, un taux de TVA/timbre fiscal algérien, un PGN J1939 ou un prix de carburant Naftal.
- **Zéro Secret Exposé :** Aucun mot de passe, clé API, jeton Traccar/Flespi ou certificat dans le code, Git ou les logs.
- **Zéro Constante Métier ou Texte en Dur :** Tarifs (Sirghaz, Gasoil, Sans Plomb), seuils thermiques (climat saharien vs côtier), fiscalité (NIF, NIS, RC, AI) et textes UI doivent provenir des tables de configuration (`country_pack_dz`) ou des fichiers i18n.
- **Zéro Fuite Multi-Tenant :** Tout accès SQL doit être protégé par PostgreSQL RLS en mode Fail-Closed (`df_tenant_role`). Aucun contournement par clé service dans les routes publiques/métier.
- **Zéro Violation Loi 18-07 (ANPDP) :** Aucune donnée à caractère personnel (nom du chauffeur, NIN, téléphone, plaque d'immatriculation, raison sociale client) ne doit sortir vers un service tiers (Flespi, tuiles cartographiques externes, LLM externe). Seul l'identifiant matériel pseudonymisé (`IMEI` / `device_uuid`) est autorisé.
- **Zéro Donnée Démo en Production :** Séparation stricte des données synthétiques (`data_origin = 'DEMO'`) vis-à-vis des données réelles et de la facturation.
- **Zéro Déclaration Sans Preuve :** Aucun statut `PASS` sans exécution réelle des tests et inspection des logs.
- **Préservation de l'Hôte :** Ne jamais altérer ou stopper un conteneur, port ou volume extérieur au projet.

---

## 4. Ordre de Priorité en Cas de Conflit

1. Sécurité, souveraineté des données (Loi 18-07 ANPDP) et isolation multi-tenant (PostgreSQL RLS).
2. Exactitude physique, financière (DGI) et réglementaire algérienne (JORADP / ENACTA).
3. Le Document de Référence Directeur [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md).
4. Ce contrat maître [`AGENTS.md`](file:///e:/docteurflotte_2027/AGENTS.md).
5. Le Plan Directeur d'Exécution [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md).
6. Décisions d'architecture acceptées ([`docs/decisions/`](file:///e:/docteurflotte_2027/docs/decisions/)).
7. Comportement observé dans le dépôt et tests automatisés existants.

---

## 5. Périmètre d'Autonomie & Rôles des Agents

### 5.1 Rôles Spécialisés ([`docs/agent-roles/`](file:///e:/docteurflotte_2027/docs/agent-roles/))
- **Architecte Principal ([`architect.md`](file:///e:/docteurflotte_2027/docs/agent-roles/architect.md)) :** Garant de `MASTER_SPEC`, performance TimescaleDB, isolation RLS, résilience Offline-First et maîtrise des coûts d'infrastructure.
- **Ingénieur Télématique & IoT ([`telematics-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/telematics-engineer.md)) :** Responsable Traccar self-hosted, protocoles Teltonika/Ruptela/Queclink, décodage CAN/J1939, gestion des rafales *Store-and-Forward* et failover Flespi zéro-PII.
- **Ingénieur Maintenance Prédictive & Data ([`predictive-maintenance-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/predictive-maintenance-engineer.md)) :** Implémentation des 6 algorithmes physiques (calibrés pour les contraintes climatiques algériennes : stress thermique saharien, poussière), RUL, VHI, anti-fraude CUSUM et arbitrage financier SAD $\rightarrow$ ADS.
- **Officier Réglementaire, Fiscalité & Conformité DZ ([`compliance-officer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/compliance-officer.md)) :** Encodage des textes JORADP (ENACTA, assurances, restrictions de tonnage/horaires par Wilaya), conformité facturation algérienne (NIF, NIS, RC, AI, Timbre, CIB/Edahabia) et audit Loi 18-07.
- **Ingénieur Produit & UX Terrain ([`ux-field-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/ux-field-engineer.md)) :** Garant de l'expérience bilingue (FR/AR RTL), de la simplicité des écrans DVIR/Atelier, et de la lisibilité des rapports exécutifs.
- **Relecteur Indépendant ([`reviewer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/reviewer.md)) :** Audit critique, sécurité, performance et validation avant clôture de chaque tranche.

### 5.2 Actions Réalisables en Autonomie Complète
- Exploration du code, profilage de requêtes SQL/TimescaleDB et audits non destructifs.
- Développement TDD des fonctionnalités, algorithmes physiques, règles métier et traductions FR/AR.
- Exécution des suites de tests automatisés, linters et scanners de sécurité.
- Rédaction de la documentation technique, des ADR proposés et des rapports d'exécution.

### 5.3 Actions Exigeant une Validation Humaine Explicite
- Migrations DDL destructives ou altérant des hypertables/tables de production existantes.
- Modification des politiques de sécurité PostgreSQL RLS ou du schéma d'anonymisation Loi 18-07.
- Ajout de dépendances externes lourdes ou payantes.
- Suppression de fichiers sources majeurs, volumes Docker ou jeux de données de référence.

---

## 6. Protocole de Travail Obligatoire (Cycle en 7 Étapes)

1. **Reconnaissance Rapide :** Inspecter `git status`, `package.json` et l'état des services via `. .\scripts\load-env.ps1`.
2. **Activation des Skills :** Charger les compétences pertinentes dans `.agents/skills/` avant toute implémentation.
3. **Cadrage Métier & Algérie-First :** Lier la tâche à une Épopée du [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md) et vérifier ses impacts réglementaires/locaux (Loi 18-07, DZD, FR/AR, hors-ligne).
4. **Développement TDD & Robuste :** Écrire les tests (incluant les cas limites : perte GPS, données hors-séquence, tentatives d'accès cross-tenant) avant ou pendant le code.
5. **Chaîne de Vérification Locale :** Exécuter systématiquement `pnpm verify` (Typecheck, Lint, Tests unitaires/intégration, Scan RLS, Scan Secrets & PII).
6. **Audit Indépendant :** Passer la revue stricte de [`docs/agent-roles/reviewer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/reviewer.md).
7. **Traçabilité & Commit Atomique :** Générer le rapport factuel dans `docs/agent-reports/` avec le hash du commit Git.

---

## 7. Commandes et Environnement

Exécution locale sous **Windows / PowerShell** avec **Docker Compose** :

```powershell
# 1. Chargement instantané des variables et détection des ports
. .\scripts\load-env.ps1

# 2. Démarrage de l'infrastructure locale isolée (Postgres/Timescale 5434, Redis 6380, Traccar 8085)
docker compose -f infra/compose.yaml up -d

# 3. Chaîne de validation complète obligatoire (Quality Gate)
pnpm verify

# 4. Lancement du serveur de développement
pnpm dev
```

Déploiement souverain en production (VPS / Cloud Local Algérie sous Linux) :
```bash
docker compose -f infra/compose.prod.yaml up -d --build
```

---

## 8. Definition of Done (DoD — Standard Classe Mondiale)

Une tâche n'est déclarée `PASS` que si **100 %** des critères suivants sont validés :
- [ ] **Alignement Spec :** Exigence traçable dans `MASTER_SPEC.md` sans simulation ni mock de façade en production.
- [ ] **Sécurité Multi-Tenant :** Contexte tenant validé côté serveur et test d'isolation RLS (tentative d'accès croisé échouant comme prévu) exécuté.
- [ ] **Souveraineté Loi 18-07 :** Zéro PII dans les payloads réseau sortants, les logs applicatifs ou les télémétries tierces.
- [ ] **Résilience & Performance :** Gestion des données hors-séquence IoT vérifiée ; requêtes TimescaleDB indexées et bornées temporellement.
- [ ] **Adaptation Algérie :** Unités, devises (`DZD`), règles fiscales/réglementaires chargées dynamiquement et clés de traduction `fr-DZ` / `ar-DZ` (RTL) présentes si l'UI est touchée.
- [ ] **Qualité & Preuve :** `pnpm verify` passe à 100 % (0 erreur TypeScript, 0 erreur Lint, tests verts) avec sortie exacte consignée dans `docs/agent-reports/`.

---

## 9. Format de Compte Rendu Final

À l'issue de chaque session ou tranche livrée, produire ce bloc exact :

```text
STATUT : PASS | PARTIAL | BLOCKED | NOT VERIFIED
GATE / EPIC : [Numéro et nom de l'EPIC dans docs/development-plan-master-spec.md]
OBJECTIF : [Description concise de la valeur livrée]
CHANGEMENTS : [Fichiers majeurs créés ou modifiés]
COMMIT : [Hash court du commit Git]
DURÉE : [Durée constatée]
TESTS EXÉCUTÉS : [Commande exacte + résumé chiffré des résultats]
TESTS NON EXÉCUTÉS : [Justification factuelle ou "Aucun"]
SÉCURITÉ & LOI 18-07 : [Preuve de validation RLS + absence de fuite PII]
SPÉCIFICITÉS ALGÉRIE & PERFORMANCE : [Conformité DZD/ENACTA/Naftal, i18n FR/AR, impact TimescaleDB]
DONNÉES / MIGRATIONS : [Migrations appliquées ou "Aucune"]
DÉCISIONS EN ATTENTE DU FONDATEUR : [Points bloquants ou mentions PROPOSÉ]
DETTE TECHNIQUE CRÉÉE : [Dette identifiée ou "Aucune"]
RESTANT À FAIRE : [Prochaine étape logique du plan directeur]
PROCHAINE ACTION : [Une seule action immédiate et concrète]
```

---

## 10. Référentiel Documentaire & Architecture

| Niveau | Document Clé | Description |
| :---: | :--- | :--- |
| **0** | [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) | **Spécification Maîtresse Intégrale v2.0+ (Architecture, Physique, Algorithmes).** |
| **0** | [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md) | **Plan Directeur d'Ingénierie v3.0 par Épopées (EPIC 1 à 6).** |
| **1** | [`docs/country-packs/dz-algeria.md`](file:///e:/docteurflotte_2027/docs/country-packs/dz-algeria.md) | **Pack Réglementaire & Métier Algérie (58 Wilayas, ENACTA, Fiscalité DGI, Naftal).** |
| **1** | [`docs/roadmap.md`](file:///e:/docteurflotte_2027/docs/roadmap.md) | Feuille de route vivante et Quality Gates 0 à 7. |
| **1** | [`docs/architecture/core-architecture.md`](file:///e:/docteurflotte_2027/docs/architecture/core-architecture.md) | Multi-tenant RLS, Traccar, TimescaleDB, mobile offline, sécurité. |
| **2** | [`docs/agent-roles/`](file:///e:/docteurflotte_2027/docs/agent-roles/) | Rôles spécialisés : Architecte, Télématique, Prédictif, Réglementaire, UX Terrain, Relecteur. |
| **2** | [`docs/architecture/threat-model.md`](file:///e:/docteurflotte_2027/docs/architecture/threat-model.md) | Analyse STRIDE par module réel du monorepo. |
| **3** | [`.agents/skills/`](file:///e:/docteurflotte_2027/.agents/skills/) | Procédures d'ingénierie et compétences spécialisées. |
