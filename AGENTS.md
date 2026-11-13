# AGENTS.md — Contrat Maître d'Exploitation & Ingénierie (v3.2 - World-Class DZ-First & Maintenance 5.0)

**Produit :** Plateforme Souveraine de Télémétrie, IoT Multi-Métiers, Maintenance 5.0 (OEM-First) & Décision Réglementaire — Leader Marché Algérien  
**Version du contrat :** 3.2 (2026-11-13 — Intégration & Validation des 5 Modules Stratégiques World-Class)  
**Document Directeur :** [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027_world_class/MASTER_SPEC.md) (Master Spec v2.0+)  
**Plan d'Exécution :** [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027_world_class/docs/development-plan-master-spec.md)  
**Cible d'exécution :** Google Antigravity IDE / Agents de développement autonomes  
**Dépôt de référence :** Monorepo TypeScript & Python (Next.js 15, NestJS, PostgreSQL 16 / TimescaleDB, Redis, Traccar 6.x / Flespi, Ollama Qwen 2.5)  
**Archives :** [`docs/archive/AGENTS.v1.1.md`](file:///e:/docteurflotte_2027_world_class/docs/archive/AGENTS.v1.1.md)

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

L'ensemble des développements du monorepo s'appuie sur les 7 innovations de rupture et les 5 modules stratégiques souverains suivants :

### 2.1 Huissier & Greffier Juridique CUSUM Anti-Fraude & Dossier Technique (PDF)
- Algorithme CUSUM (Cumulative Sum Control Chart) à sensibilité dynamique pour détecter les siphonnages de carburant.
- **Compensation topographique Valhalla** : Prise en compte du dévers routier et du déport longitudinal de la jauge ($x_{\text{sonde}}$) pour éliminer les faux positifs lors des montées/descentes (ex: Gorges de la Chiffa, col des Caravanes).
- Génération automatique de **Dossiers d'Expertise Technique & Traçabilité Carburant** (`DET-*`) infalsifiables avec empreinte d'intégrité cryptographique SHA-256, opposables juridiquement et utilisables en commission de discipline.

### 2.2 IA Souveraine Embarquée (Ollama Qwen 2.5 1.5B) & Routeur Dialectal Darja
- Modèle LLM 100% auto-hébergé sous Ollama, exécuté localement sur le CPU du serveur (3 threads dédiés).
- **Routeur vocal/texte Darja local** (`darja-intent-router.service.ts`) : Mappage instantané des requêtes mécaniciens en dialecte algérien (*« choufli zit el moteur »*, *« aatini l'batterie »*, *« serrage culasse shacman »*) vers les fiches constructeurs avec **short-circuit déterministe < 50 ms sans passer par un LLM**.
- **Zéro dépendance cloud externe** : Aucune donnée ne quitte le réseau de l'entreprise vers des serveurs étrangers.

### 2.3 Coffre de Connaissances RAG & Base OEM Structurée Zéro Hallucination
- Indexation multi-constructeurs de **62 manuels de réparation et fiches techniques officielles** (Renault Trucks, MAN TGX, Mercedes Actros, Shacman Weichai, Hino, Isuzu, Caterpillar).
- Table relationnelle structurée `oem_technical_specifications` garantissant des couples de serrage, viscosités et codes défauts DTC déterministes sans risque d'hallucination d'IA.
- Moteur hybride combinant BM25 plein texte (`tsvector`) et trigrammes (`pg_trgm`).

### 2.4 Mode 0 & Réconciliation Naftal avec Contrôle Topographique Valhalla
- Ingestion multi-sources des relevés et cartes carburant Naftal (fichiers CSV/Excel et reçus scannés OCR).
- **Contrôle de cohérence odométrique** : Croisement entre odomètre déclaré et distance minimale calculée par le moteur Valhalla local. Déclenchement automatique de `ODOMETER_DISCREPANCY_ALERT` si l'écart dépasse le seuil configuré.

### 2.5 Machine à États Anti-Echo Storm & Passerelle ERP Universelle (1-Clic)
- Registre persistant (`anomaly_cooldown_ledger`) évitant la saturation cognitive des chefs de parc (cooldown 72h).
- **Export ERP 1-Clic standardisé** (`erp-integration-export.service.ts` & `TechnicalDossierModal.tsx`) compatible avec les formats du marché algérien : **PC Compta (CSV SCF DGI)**, **Sage 100 (CSV)**, **Odoo (JSON REST)** et **SAP PM (REST JSON)**.

### 2.6 Scanner OCR Naftal & Bilans Carburant Dynamiques (Zéro Hardcoding)
- Capture et traitement d'images de reçus carburant Naftal froissés ou dégradés.
- Extraction des litres, type de carburant, station, Wilaya et montant DZD.
- Résolution 100% dynamique des prix du carburant via `SystemConfig` / barèmes nationaux administrables.

### 2.7 Cockpit Haute Densité MapLibre (58 Wilayas) & PWA DVIR Offline-First
- Cartographie vectorielle souveraine MapLibre sans dépendance Google Maps avec affichage des grands corridors logistiques nationaux (RN1 Transsaharienne, A1 Est-Ouest, RN3 Hassi Messaoud, RN6 Béchar/Adrar).
- Filtrage temps réel par palier télématique : **Mode 0 (Déclaratif)**, **Mode 1 (GNSS)**, **Mode 2 (CAN/J1939)**.
- **Application DVIR Mobile PWA Offline-First** persistée sous **IndexedDB** (`offline-dvir-storage.ts`) avec photos WebP et signatures déconnectées, synchronisées automatiquement lors du retour réseau.

---

## 3. Interdictions Absolues (Garde-Fous Non Négociables)

- **Zéro Constante Métier ou Tarif en Dur :** Les prix du carburant (Gasoil, Sirghaz, Sans Plomb), forfaits de dépannage, forfaits de remorquage saharien, taux de TVA (résolus via `ALGERIA_FISCAL_RATES`) et paramètres régionaux doivent obligatoirement provenir des tables de configuration administrables (`SystemConfig`, `country_pack_dz`) et jamais de valeurs codées en dur dans le code source.
- **Zéro Fuite Multi-Tenant (PostgreSQL RLS Fail-Closed) :** Tout accès SQL aux données d'exploitation doit transiter par le contexte tenant validé avec isolation RLS stricte (`df_tenant_role`). Tout contournement par clé superuser dans une route métier est proscrit.
- **Zéro Violation Loi 18-07 (ANPDP) :** Aucune donnée personnelle (nom de chauffeur, numéro de téléphone, NIN, plaque, raison sociale) ne doit sortir vers un tiers (Flespi, cartographie externe, API LLM cloud). Coupe-feu applicatif `Law1807SanitizerMiddleware` actif sur toutes les routes. Seul l'identifiant matériel pseudonymisé (`device_uuid`) est toléré vers les passerelles matérielles.
- **Zéro Donnée Démo en Environnement Réel & Zéro Mock Inline UI :** Séparation étanche des données de simulation (`data_origin = 'DEMO'`) vis-à-vis des données réelles de flotte et de facturation. Tout jeu de données de démonstration doit résider exclusivement dans `@/lib/simulation-sandbox/` sous forme de modules chargés dynamiquement (`await import(...)`), garantissant un bundle de production exempt de tout mock (0 Ko). Les pages UI doivent afficher un *Empty State* explicite lorsque le parc de l'organisation est vierge.
- **Zéro Déclaration Sans Preuve :** Aucun statut `PASS` ne peut être affirmé sans exécution effective des tests automatisés, vérification du code retour et inspection des logs.
- **Préservation de l'Hôte :** Ne jamais stopper ou altérer un conteneur, un port ou un processus hôte extérieur au projet DocteurFlotte.

---

## 4. Ordre de Priorité en Cas de Conflit

1. Sécurité, souveraineté des données (Loi 18-07 ANPDP) et isolation multi-tenant (PostgreSQL RLS).
2. Exactitude physique, financière (DGI) et réglementaire algérienne (JORADP / ENACTA / 58 Wilayas).
3. Le Document de Référence Directeur [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027_world_class/MASTER_SPEC.md).
4. Ce contrat maître [`AGENTS.md`](file:///e:/docteurflotte_2027_world_class/AGENTS.md).
5. Le Plan Directeur d'Exécution [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027_world_class/docs/development-plan-master-spec.md).
6. Décisions d'architecture validées ([`docs/decisions/`](file:///e:/docteurflotte_2027_world_class/docs/decisions/)).
7. Code existant testé et vérifié dans le dépôt.

---

## 5. Rôles et Organisation des Spécialités

### 5.1 Rôles Spécialisés ([`docs/agent-roles/`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/))
- **Architecte Principal ([`architect.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/architect.md)) :** Garant de l'intégrité globale, performance TimescaleDB, isolation multi-tenant RLS, résilience Offline-First et maîtrise des coûts d'infrastructure.
- **Ingénieur Télématique & IoT ([`telematics-engineer.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/telematics-engineer.md)) :** Ingestion Traccar self-hosted, protocoles Teltonika/Ruptela/Queclink, PGNs J1939, gestion des rafales *Store-and-Forward* et failover Flespi zéro-PII.
- **Ingénieur Maintenance Prédictive & Data ([`predictive-maintenance-engineer.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/predictive-maintenance-engineer.md)) :** Physique déterministe (6 organes), jumeau numérique calibré 58 Wilayas, algorithme CUSUM anti-ballottement, calculs RUL/VHI et arbitrage SAD $\rightarrow$ ADS en DZD.
- **Officier Réglementaire, Fiscalité & Conformité DZ ([`compliance-officer.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/compliance-officer.md)) :** Conformité Loi 18-07 ANPDP, règles fiscales DGI algériennes, nomenclature des 58 Wilayas, barèmes ENACTA et Code de la Route algérien.
- **Ingénieur Produit & UX Terrain ([`ux-field-engineer.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/ux-field-engineer.md)) :** Interfaces bilingues (FR / AR avec support CSS logique RTL), cockpit haute densité MapLibre, simplicité des écrans DVIR et assistant vocal d'atelier.
- **Relecteur Indépendant ([`reviewer.md`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/reviewer.md)) :** Contrôle qualité, audit de sécurité RLS, détection de régressions et validation formelle de chaque livraison.

### 5.2 Répertoire des Modules Applicatifs Clés
- `apps/api/src/digital-twin/` : Moteur de simulation physique 6 organes, référentiel 58 Wilayas et arbitrage financier DZD (`physical-predictive-models.service.ts`).
- `apps/api/src/fleet-intelligence/` : Algorithmes CUSUM, modèles physiques déterministes, innovations de rupture, parseur Naftal (`naftal-statement-parser.service.ts`), contrôle topographique (`topographic-consistency.service.ts`), dossiers PDF (`technical-dossier-pdf.service.ts`) et export ERP (`erp-integration-export.service.ts`).
- `apps/api/src/workshop-voice/` : Assistant vocal d'atelier, dictionnaire phonétique Darja/Français et routeur d'intentions déterministe (`darja-intent-router.service.ts`).
- `apps/api/src/security/` : Coupe-feu Loi 18-07 ANPDP (`law1807-sanitizer.middleware.ts`), anonymisation matérielle et pare-feu d'exportation.
- `apps/api/src/sovereign-rag/` : Coffre de connaissances RMI 62 manuels, indexation BM25 + pg_trgm et base relationnelle OEM.
- `apps/api/src/copilot/` : Intégration du LLM local Ollama Qwen 2.5 et orchestration des outils métier.
- `apps/api/src/decisions/` : Moteur actuarial d'arbitrage SAD $\rightarrow$ ADS et daemon anti-echo storm 72h.
- `apps/api/src/admin/` : Administration des paramètres de référence, prix Naftal dynamiques et isolation des tenants.
- `apps/web/src/components/cockpit/` : Cockpit cartographique souverain MapLibre (`MapLibreCorridorsMap.tsx`) avec les 3 paliers télématiques et corridors 58 Wilayas.
- `apps/web/src/components/decisions/` : Preuves de calcul formelles et modale d'export ERP 1-clic (`TechnicalDossierModal.tsx`).
- `apps/web/src/lib/` : Persistance IndexedDB DVIR PWA Offline-First (`offline-dvir-storage.ts`).
- `apps/web/src/lib/simulation-sandbox/` : Isolation hermétique des jeux de données de simulation/démo chargés dynamiquement (0 Ko dans le bundle de production).
- `apps/web/public/sw.js` & `apps/web/src/app/manifest.ts` : PWA installable et Service Worker de cache hors-ligne souverain pour les zones blanches sahariennes.
- `packages/decision-engine/` : Primitives mathématiques exactes (`Decimal.clone()`, `roundDzd`), moteur AST d'évaluation et modèle d'audit immuable SHA-256.
- `apps/web/src/app/` : Cockpits Next.js 15 (`/digital-twin`, `/live-cockpit`, `/map`, `/fuel-scanner`, `/guide`, `/work-orders`, `/dispatch`, `/cold-chain`, `/dvir`, `/preventive`, `/copilot`, `/admin`).
- `infra/` : Déploiement souverain air-gapped on-premise (`docker-compose.onpremise.yml`).

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

# 5. Exécution complète des suites de tests automatisés (40 suites Jest API + 5 suites Vitest Web)
pnpm --filter @docteurflotte/api test
pnpm --filter @docteurflotte/web test

# 6. Vérification TypeScript stricte (Frontend & Contrats)
pnpm --filter @docteurflotte/contracts build
pnpm --filter @docteurflotte/web typecheck
```

---

## 8. Definition of Done (DoD — Standard Classe Mondiale)

Une tâche n'est déclarée `PASS` que si **100 %** des critères suivants sont remplis :
- [ ] **Alignement Fonctionnel :** Conforme à `MASTER_SPEC.md` et au paradigme Maintenance 5.0 sans bouchon ni simulation de façade.
- [ ] **Honnêteté Fonctionnelle par Palier (3 Tiers) :** Respect strict des capacités associées au `telemetry_tier` de l'actif (`MODE_0_DECLARATIVE`, `MODE_1_GNSS`, `MODE_2_CAN_J1939`).
- [ ] **Isolation Multi-Tenant :** Requêtes SQL filtrées par tenant avec contexte RLS PostgreSQL Fail-Closed (`df_tenant_role`).
- [ ] **Souveraineté Loi 18-07 (ANPDP) :** Zéro donnée à caractère personnel (PII) émise vers l'extérieur ; coupe-feu applicatif `Law1807SanitizerMiddleware` actif.
- [ ] **Zéro Hardcode :** Constantes métier (tarifs carburant Naftal, forfaits dépannage, barèmes, taux de TVA ENACTA) injectées dynamiquement depuis `SystemConfig` / `ALGERIA_FISCAL_RATES`.
- [ ] **Isolation Démo / Production :** 100% des pages UI respectent l'isolation stricte Démo/Production validée par `scripts/guardrails/lint-zero-hardcode-ui.cjs` (0 mock inline).
- [ ] **Résilience & Données IoT :** Tolérance aux rafales Store-and-Forward triées par `device_timestamp` ; persistance DVIR PWA Offline-First sous IndexedDB et Service Worker souverain.
- [ ] **Adaptation Algérie :** Monnaie `DZD`, forfaits sahariens (75 000 DZD Sud vs 35 000 DZD Nord), profils des 58 Wilayas et support bilingue FR/AR (RTL).
- [ ] **Qualité Validée :** `pnpm typecheck` à 0 erreur TypeScript et 100% des suites de tests Jest (40 suites, 287 tests) et Vitest (5 suites, 24 tests) au statut vert.

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
| **0** | [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027_world_class/MASTER_SPEC.md) | **Spécification Maîtresse Intégrale v2.0+ (Architecture, Physique, Algorithmes).** |
| **0** | [`docs/development-plan-master-spec.md`](file:///e:/docteurflotte_2027_world_class/docs/development-plan-master-spec.md) | **Plan Directeur d'Ingénierie v3.0 par Épopées (EPIC 1 à 6).** |
| **1** | [`docs/country-packs/dz-algeria.md`](file:///e:/docteurflotte_2027_world_class/docs/country-packs/dz-algeria.md) | **Pack Réglementaire & Métier Algérie (58 Wilayas, ENACTA, Fiscalité DGI, Naftal).** |
| **1** | [`docs/roadmap.md`](file:///e:/docteurflotte_2027_world_class/docs/roadmap.md) | Feuille de route vivante et Quality Gates 0 à 7. |
| **1** | [`docs/architecture/core-architecture.md`](file:///e:/docteurflotte_2027_world_class/docs/architecture/core-architecture.md) | Multi-tenant RLS, Traccar, TimescaleDB, mobile offline, sécurité. |
| **2** | [`docs/agent-roles/`](file:///e:/docteurflotte_2027_world_class/docs/agent-roles/) | Rôles spécialisés : Architecte, Télématique, Prédictif, Réglementaire, UX Terrain, Relecteur. |
| **2** | [`docs/architecture/threat-model.md`](file:///e:/docteurflotte_2027_world_class/docs/architecture/threat-model.md) | Analyse STRIDE par module réel du monorepo. |
| **3** | [`.agents/skills/`](file:///e:/docteurflotte_2027_world_class/.agents/skills/) | Procédures d'ingénierie et compétences spécialisées. |
