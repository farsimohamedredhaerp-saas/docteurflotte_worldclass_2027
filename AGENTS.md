# AGENTS.md — Contrat Maître d'Exploitation & Ingénierie (v3.1 - World-Class DZ-First & Maintenance 5.0)

**Produit :** Plateforme Souveraine de Télémétrie, IoT Multi-Métiers, Maintenance 5.0 (OEM-First) & Décision Réglementaire — Leader Marché Algérien  
**Version du contrat :** 3.1 (2026-11-01 — Synchronisation Fonctionnelle Intégrale)  
**Document Directeur :** [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) (Master Spec v2.0+)  
**Plan d'Exécution :** [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md)  
**Cible d'exécution :** Google Antigravity IDE / Agents de développement autonomes  
**Dépôt de référence :** Monorepo TypeScript & Python (Next.js 15, NestJS, PostgreSQL 16 / TimescaleDB, Redis, Traccar 6.x / Flespi, Ollama Qwen 2.5)  
**Archives :** [`docs/archive/AGENTS.v1.1.md`](file:///e:/docteurflotte_2027/docs/archive/AGENTS.v1.1.md)

---

## 1. Mission, Avantage Compétitif & Paradigme « Maintenance 5.0 »

1. **Domination Locale & Standard Mondial :** Construire la plateforme SaaS multi-tenant souveraine de référence en Algérie (Logistique, BTP/Mines, Hydrocarbures, Agriculture, Ateliers), surpassant Samsara et Geotab par une adaptation native aux contraintes réelles du terrain algérien.
2. **Le Paradigme de la « Maintenance 5.0 » (Prescriptive & Déterministe) :**
   - *Rupture avec le pistage passif 4.0* : Contrairement aux solutions traditionnelles qui se contentent de géolocaliser des véhicules ("points sur une carte") ou d'émettre des alertes kilométriques boîte noire, DocteurFlotte transforme chaque signal en **arbitrage économique prescriptif en Dinars Algériens (DZD)**.
   - *Matrice des 5 Générations* :
     * **1.0 Réactive** : Casse sur route, dépannage d'urgence, immobilisation lourde.
     * **2.0 Préventive aveugle** : Intervalles calendaires fixes (vidange tous les 10 000 km jetant des lubrifiants encore viables).
     * **3.0 Conditionnelle** : Voyants tableau de bord (alerte tardive à >95°C où l'usure mécanique est déjà amorcée).
     * **4.0 Prédictive statistique** : Modèles ML probabilistes boîte noire, faux positifs fréquents, sans chiffrage de rentabilité.
     * **5.0 Prescriptive souveraine (DocteurFlotte)** : Physique déterministe à 0 DA (zéro capteur externe requis), arbitrage financier autonome SAD $\rightarrow$ ADS, et assistant d'atelier en langage naturel (Français / Darja phonétique).
3. **Architecture « OEM-First & Hardware-Agnostic » à 3 Modes :**
   - *Mode 0 (Zéro Boîtier)* : Exploitation instantanée dès le Jour 1. Réconciliation des tickets/cartes Naftal, routage topographique Valhalla, inspections DVIR mobiles PWA Offline-First.
   - *Mode 1 (GPS Standard)* : Ingestion haute fréquence Traccar, éco-conduite, détection des dévers et corridors des 58 Wilayas.
   - *Mode 2 (Full CAN / J1939 / IoT)* : Télémétrie moteur profonde (couple J1939, régime, températures d'huile et d'eau, contre-pression FAP, micro-glissement boîte/pont, sondes de chaîne du froid).
4. **Physique Déterministe du Jumeau Numérique (6 Organes & 58 Wilayas) :**
   - Modélisation physique explicable (XAI) sans boîte noire des 6 organes d'usure :
     1. `ENGINE_OIL` : Cinétique d'oxydation d'Arrhenius ($E_a/R = 6\,500\text{ K}$, sévérité thermique et viscosité cSt).
     2. `BATTERY_CRANKING` : SOH dynamique CVHI par chute de tension minimale de démarrage ($V_{\text{min}} > 9.60\text{ V}$) et impédance interne.
     3. `BRAKE_PADS` : Loi tribologique d'Archard basée sur l'énergie dissipée cumulée ($W = \frac{1}{2}m\Delta v^2$) et le dévers routier.
     4. `COOLING_SYSTEM` : Modèle différentiel thermique EWMA ($\Delta T = |T_{\text{huile}} - T_{\text{eau}}|$) pour prévenir le voilage culasse.
     5. `DPF_FILTER` : Bilan massique d'accumulation de suie et contre-pression d'échappement (mbar).
     6. `TRANSMISSION_DRIVETRAIN` : Micro-glissement sous couple J1939 (SPN 524 / SPN 191) et cisaillement du fluide de pont $80\text{W}90$.
   - **Calibrage bioclimatique sur les 58 Wilayas d'Algérie** (`ALGERIA_58_WILAYAS_PROFILES`) : Tell côtier (humidité, ralenti urbain), Steppes et Hauts-Plateaux (cols montagneux, amplitude thermique $-5^\circ\text{C}$ à $40^\circ\text{C}$), Sahara profond (canicule jusqu'à $49^\circ\text{C}$, vents de sable, silice abrasive, pistes isolées).
5. **Moteur Décisionnel Financier (SAD $\rightarrow$ ADS en Dinars Algériens DZD) :**
   - Arbitrage systématique : Coût d'Action Préventive Immédiate vs Risque Financier d'Inaction (casse mécanique, pénalités contractuelles de retard, immobilisation).
   - Majoration réaliste de l'assistance routière : Forfait de remorquage désertique de **$75\,000\text{ DZD}$** (Ouargla, Tamanrasset, In Salah, Adrar, etc.) vs **$35\,000\text{ DZD}$** dans le Nord/Tell.
   - Coût d'immobilisation journalière d'exploitation : **$25\,000\text{ DZD/jour}$**.
   - Calcul opposable de l'Économie Nette (DZD) et du ratio de ROI, avec suggestion d'actifs de substitution de la flotte.
6. **Souveraineté Absolue & Conformité Algérienne (Loi 18-07 ANPDP) :**
   - Hébergement local des bases de données sur le territoire national.
   - Anonymisation matérielle stricte : Zéro PII sortante vers des tiers (Flespi, cartographie externe, LLMs cloud).
   - Conformité fiscale DGI (NIF, NIS, RC, AI, Timbre fiscal) et barèmes ENACTA.

---

## 2. Piliers d'Ingénierie & Innovations de Rupture Déployées

L'ensemble des développements du monorepo s'appuie sur les 7 innovations de rupture suivantes :

### 2.1 Huissier & Greffier Juridique CUSUM Anti-Fraude
- Algorithme CUSUM (Cumulative Sum Control Chart) à sensibilité dynamique pour détecter les siphonnages de carburant.
- **Compensation topographique Valhalla** : Prise en compte du dévers routier et du déport longitudinal de la jauge ($x_{\text{sonde}}$) pour éliminer les faux positifs lors des montées/descentes (ex: Gorges de la Chiffa, col des Caravanes).
- Génération automatique de procès-verbaux d'infraction infalsifiables (`PV-CUSUM-*`), opposables juridiquement et utilisables en commission de discipline.

### 2.2 IA Souveraine Embarquée (Ollama Qwen 2.5 1.5B Instruct)
- Modèle LLM 100% auto-hébergé sous Ollama, exécuté localement sur le CPU du serveur (3 threads dédiés).
- **Zéro dépendance cloud externe** : Aucune donnée ne quitte le réseau de l'entreprise vers des serveurs étrangers.
- Orchestration cognitive multi-rôles : audit légal, diagnostic physique d'atelier, extraction d'entités télématiques et propositions d'arbitrage.

### 2.3 Coffre de Connaissances RAG Hybride Atelier & RMI
- Indexation multi-constructeurs de **62 manuels de réparation et fiches techniques officielles** (Renault Trucks, MAN TGX, Mercedes Actros, Shacman, Hino, Isuzu, Caterpillar).
- Moteur de recherche hybride sans hallucination combinant :
  * Recherche lexicale plein texte PostgreSQL (`tsvector` / BM25).
  * Similarité trigrammes (`pg_trgm`) sur les désignations de pièces et codes défauts DTC / J1939.
  * Ingestion documentaire souveraine (parseur PDF local et extracteur structuré).

### 2.4 Assistant Vocal d'Atelier en Darja Phonétique & Français
- Interface audio conçue pour les mécaniciens et chefs d'atelier en combinaison de travail :
  * Commandes vocales en arabe dialectal algérien (Darja phonétique : *« choufli zit el moteur »*, *« aatini l'batterie »*) et français technique.
  * Short-circuit SQL déterministe sous les **$50\text{ ms}$** pour interroger instantanément la santé d'un véhicule sans passer par un LLM.

### 2.5 Machine à États Anti-Echo Storm (Cooldown 72h)
- Registre persistant (`anomaly_cooldown_ledger`) évitant la saturation cognitive des chefs de parc.
- Interdiction stricte de ré-émettre une alerte ou une notification redondante si un Ordre de Travail (OT) est déjà ouvert ou si l'organe fait l'objet d'un suivi actif dans sa fenêtre de stabilisation.

### 2.6 Scanner OCR Naftal & Réconciliation Télématique
- Capture et traitement d'images de reçus carburant Naftal froissés ou dégradés.
- Extraction des litres, du type de carburant, de la station, de la Wilaya et du montant DZD.
- Réconciliation croisée immédiate avec les données de flotte pour certifier les notes de frais et détecter les anomalies de litrage.

### 2.7 Cockpit Haute Densité MapLibre & DVIR Mobile PWA Offline-First
- Cartographie vectorielle souveraine MapLibre sans dépendance Google Maps.
- Visualisation temps réel des actifs avec télémétrie par Wilaya et corridors logistiques.
- Fiches d'inspection pré/post-trajet DVIR utilisables hors-ligne dans les zones blanches du Sud, avec synchronisation horodatée dès retour du réseau.

---

## 3. Interdictions Absolues (Garde-Fous Non Négociables)

- **Zéro Constante Métier ou Tarif en Dur :** Les prix du carburant (Gasoil, Sirghaz, Sans Plomb), forfaits de dépannage, forfaits de remorquage saharien, taux de TVA et paramètres régionaux doivent obligatoirement provenir des tables de configuration administrables (`SystemConfig`, `country_pack_dz`) et jamais de valeurs codées en dur dans le code source.
- **Zéro Fuite Multi-Tenant (PostgreSQL RLS Fail-Closed) :** Tout accès SQL aux données d'exploitation doit transiter par le contexte tenant validé avec isolation RLS stricte (`df_tenant_role`). Tout contournement par clé superuser dans une route métier est proscrit.
- **Zéro Violation Loi 18-07 (ANPDP) :** Aucune donnée personnelle (nom de chauffeur, numéro de téléphone, NIN, plaque, raison sociale) ne doit sortir vers un tiers (Flespi, cartographie externe, API LLM cloud). Seul l'identifiant matériel pseudonymisé (`device_uuid`) est toléré vers les passerelles matérielles.
- **Zéro Donnée Démo en Environnement Réel :** Séparation étanche des données de simulation (`data_origin = 'DEMO'`) vis-à-vis des données réelles de flotte et de facturation.
- **Zéro Déclaration Sans Preuve :** Aucun statut `PASS` ne peut être affirmé sans exécution effective des tests automatisés, vérification du code retour et inspection des logs.
- **Préservation de l'Hôte :** Ne jamais stopper ou altérer un conteneur, un port ou un processus hôte extérieur au projet DocteurFlotte.

---

## 4. Ordre de Priorité en Cas de Conflit

1. Sécurité, souveraineté des données (Loi 18-07 ANPDP) et isolation multi-tenant (PostgreSQL RLS).
2. Exactitude physique, financière (DGI) et réglementaire algérienne (JORADP / ENACTA / 58 Wilayas).
3. Le Document de Référence Directeur [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md).
4. Ce contrat maître [`AGENTS.md`](file:///e:/docteurflotte_2027/AGENTS.md).
5. Le Plan Directeur d'Exécution [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027/docs/development-plan-master-spec.md).
6. Décisions d'architecture validées ([`docs/decisions/`](file:///e:/docteurflotte_2027/docs/decisions/)).
7. Code existant testé et vérifié dans le dépôt.

---

## 5. Rôles et Organisation des Spécialités

### 5.1 Rôles Spécialisés ([`docs/agent-roles/`](file:///e:/docteurflotte_2027/docs/agent-roles/))
- **Architecte Principal ([`architect.md`](file:///e:/docteurflotte_2027/docs/agent-roles/architect.md)) :** Garant de l'intégrité globale, performance TimescaleDB, isolation multi-tenant RLS, résilience Offline-First et maîtrise des coûts d'infrastructure.
- **Ingénieur Télématique & IoT ([`telematics-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/telematics-engineer.md)) :** Ingestion Traccar self-hosted, protocoles Teltonika/Ruptela/Queclink, PGNs J1939, gestion des rafales *Store-and-Forward* et failover Flespi zéro-PII.
- **Ingénieur Maintenance Prédictive & Data ([`predictive-maintenance-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/predictive-maintenance-engineer.md)) :** Physique déterministe (6 organes), jumeau numérique calibré 58 Wilayas, algorithme CUSUM anti-ballottement, calculs RUL/VHI et arbitrage SAD $\rightarrow$ ADS en DZD.
- **Officier Réglementaire, Fiscalité & Conformité DZ ([`compliance-officer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/compliance-officer.md)) :** Conformité Loi 18-07 ANPDP, règles fiscales DGI algériennes, nomenclature des 58 Wilayas, barèmes ENACTA et Code de la Route algérien.
- **Ingénieur Produit & UX Terrain ([`ux-field-engineer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/ux-field-engineer.md)) :** Interfaces bilingues (FR / AR avec support CSS logique RTL), cockpit haute densité MapLibre, simplicité des écrans DVIR et assistant vocal d'atelier.
- **Relecteur Indépendant ([`reviewer.md`](file:///e:/docteurflotte_2027/docs/agent-roles/reviewer.md)) :** Contrôle qualité, audit de sécurité RLS, détection de régressions et validation formelle de chaque livraison.

### 5.2 Répertoire des Modules Applicatifs Clés
- `apps/api/src/digital-twin/` : Moteur de simulation physique 6 organes, référentiel 58 Wilayas et arbitrage financier DZD.
- `apps/api/src/fleet-intelligence/` : Algorithmes CUSUM, modèles physiques déterministes, innovations de rupture et PV d'infraction.
- `apps/api/src/fuel-scanner/` : Scanner OCR Naftal et réconciliation des factures atelier / carburant.
- `apps/api/src/workshop-voice/` : Assistant vocal d'atelier, dictionnaire phonétique Darja/Français et short-circuit SQL.
- `apps/api/src/sovereign-rag/` : Coffre de connaissances RMI 62 manuels, indexation BM25 + pg_trgm.
- `apps/api/src/copilot/` : Intégration du LLM local Ollama Qwen 2.5 et orchestration des outils métier.
- `apps/api/src/decisions/` : Moteur actuarial d'arbitrage SAD $\rightarrow$ ADS et daemon anti-echo storm 72h.
- `apps/api/src/admin/` : Administration des paramètres de référence, prix Naftal dynamiques et isolation des tenants.
- `apps/web/src/app/` : Cockpits Next.js 15 (`/digital-twin`, `/live-cockpit`, `/fuel-scanner`, `/guide`, `/work-orders`, `/dispatch`, `/cold-chain`, `/dvir`, `/preventive`, `/copilot`, `/admin`).

---

## 6. Protocole d'Exécution & Cycle en 7 Étapes

1. **Reconnaissance Initiale :** Vérifier l'état Git (`git status`) et charger les variables d'environnement via `. .\scripts\load-env.ps1`.
2. **Cadrage Métier & Algérie-First :** Relier la tâche aux spécifications de `MASTER_SPEC.md` et vérifier les impacts réglementaires (Loi 18-07, monnaie DZD, FR/AR RTL, mode hors-ligne).
3. **Activation des Compétences :** Consulter les guides et compétences applicables avant toute implémentation.
4. **Développement TDD :** Écrire et exécuter les tests automatisés (incluant les cas d'erreur réseau, données décalées et tentatives cross-tenant).
5. **Chaîne de Validation Locale :**
   * Compilation des contrats : `pnpm --filter @docteurflotte/contracts build`
   * Typecheck web : `pnpm --filter @docteurflotte/web typecheck`
   * Tests unitaires et d'intégration API : `pnpm --filter @docteurflotte/api test` (maintien impératif de 100% de suites vertes).
6. **Contrôle Souveraineté & Zero Hardcode :** Vérifier l'absence de chaînes en dur, d'IPs externes non autorisées et de données nominatives dans les flux.
7. **Compte Rendu & Traçabilité :** Rédiger le rapport factuel selon le format strict du §9.

---

## 7. Commandes d'Environnement Local

Sous **Windows / PowerShell** avec **Docker Compose** :

```powershell
# 1. Chargement instantané des variables et détection des runtimes locaux
. .\scripts\load-env.ps1

# 2. Démarrage de l'infrastructure locale isolée (Postgres 5434, Redis 6380, Traccar 8085)
docker compose -f infra/compose.yaml up -d

# 3. Lancement du serveur NestJS API (Port 3001)
cd apps/api; node --max-old-space-size=2048 dist/main.js

# 4. Lancement du serveur Next.js Frontend (Port 3000)
cd apps/web; pnpm dev

# 5. Exécution complète des suites de tests automatisés (27 suites)
pnpm --filter @docteurflotte/api test

# 6. Vérification TypeScript stricte du frontend
pnpm --filter @docteurflotte/web typecheck
```

---

## 8. Definition of Done (DoD — Standard Classe Mondiale)

Une tâche n'est déclarée `PASS` que si **100 %** des critères suivants sont remplis :
- [ ] **Alignement Fonctionnel :** Conforme à `MASTER_SPEC.md` et au paradigme Maintenance 5.0 sans bouchon ni simulation de façade.
- [ ] **Isolation Multi-Tenant :** Requêtes SQL filtrées par tenant avec contexte RLS PostgreSQL Fail-Closed.
- [ ] **Souveraineté Loi 18-07 (ANPDP) :** Zéro donnée à caractère personnel (PII) émise vers l'extérieur ; coupe-feu actif.
- [ ] **Zéro Hardcode :** Constantes métier (tarifs carburant, forfaits dépannage, barèmes) injectées depuis les tables de configuration.
- [ ] **Résilience & Données IoT :** Tolérance aux rafales Store-and-Forward triées par `device_timestamp` ; gestion du hors-ligne.
- [ ] **Adaptation Algérie :** Monnaie `DZD`, forfaits sahariens, profils des 58 Wilayas et support bilingue FR/AR (RTL).
- [ ] **Qualité Validée :** `pnpm typecheck` à 0 erreur TypeScript et 100% des suites de tests Jest API au statut vert.

---

## 9. Format de Compte Rendu Final Obligatoire

À l'issue de chaque session de travail ou livraison, produire ce bloc exact :

```text
STATUT : PASS | PARTIAL | BLOCKED | NOT VERIFIED
GATE / EPIC : [Numéro et nom de l'EPIC dans docs/development-plan-master-spec.md]
OBJECTIF : [Description concise de la valeur livrée]
CHANGEMENTS : [Fichiers majeurs créés ou modifiés]
COMMIT : [Hash court du commit Git ou mention "Non commité"]
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

## 10. Référentiel Documentaire du Projet

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
