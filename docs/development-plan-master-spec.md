# Plan Directeur de Développement — MASTER SPEC v3.0 (World-Class DZ-First)

## Plateforme SaaS Souveraine de Gestion de Flotte, Télémétrie IoT Multi-Métiers, Maintenance Prédictive (OEM-First) & Décision Réglementaire

**Référence :** Aligné sur [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) & [`AGENTS.md`](file:///e:/docteurflotte_2027/AGENTS.md)  
**Date :** 2026-10-28  
**Statut :** Approuvé pour exécution autonome sous Google Antigravity IDE  
**Monorepo :** TypeScript (NestJS, Next.js 15 App Router) & Microservices Python (FastAPI, PostgreSQL 16 / TimescaleDB, PostGIS, Redis 7, Traccar 6.x, MapLibre / PMTiles)

---

## 1. Vue d'Ensemble & Architecture d'Exécution

Ce plan orchestre l'implémentation industrielle de la **MASTER SPEC** en **6 Épopées Architecturales (EPICs)** synchronisées avec les *Quality Gates* de [`docs/roadmap.md`](file:///e:/docteurflotte_2027/docs/roadmap.md). Chaque Épopée est conçue pour garantir une **supériorité fonctionnelle et économique en Algérie** face aux standards mondiaux (Samsara, Geotab, Motive, Fleetio) :

```text
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │            MASTER SPEC v3.0 — ROADMAP D'EXÉCUTION (ALGERIA-FIRST)                │
  └──────────────────────────────────────────────────────────────────────────────────┘
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
   EPIC 1                              EPIC 2                              EPIC 3
   Cœur OEM RMI Algérie &              Ingestion Résiliente Zones          6 Algorithmes Physiques,
   Mode 0 « Zero-Hardware »            Blanches & TimescaleDB              Anti-Fraude & Score VHI
   (Gate 0.5 & Gate 2)                 (Gate 3 & Continous Aggs)           (Gate 4 & Gate 5)
       │                                   │                                   │
       └───────────────────────────────────┼───────────────────────────────────┘
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
   EPIC 4                              EPIC 5                              EPIC 6
   Moteur Décisionnel SAD->ADS,        Cockpit Haute Densité,              Boucle Fermée Atelier (OR),
   ENACTA & Arbitrage ROI (DZD)        PMTiles Souverain & DVIR            FinOps & Chaos Testing
   (Gate 5 & Gate 6)                   (Gate 0.5, 6 & Gate 7)              (Gate 7 & Production)
```

---

## 2. Décomposition Détaillée par Épopée (EPIC)

### EPIC 1 : Cœur Modèles Constructeurs OEM RMI & Mode 0 « Zero-Hardware »
**Objectif :** Permettre l'onboarding et l'exploitation immédiate d'un parc client à J+1, même sur des véhicules 100 % dépourvus de boîtiers télématiques, avec une précision calibrée sur le parc roulant algérien.

- **Tâche 1.1 : Coffre-Fort de Connaissances Constructeurs (OEM RMI Offline-First)**
  - Tables SQL protégées par RLS : `oem_maintenance_templates`, `oem_maintenance_tasks`, `oem_fault_codes_j1939`.
  - Décodage déterministe du VIN (WMI constructeur + VDS motorisation/châssis) et mapping des plans d'entretien constructeurs (intervalles km, heures moteur, mois).
  - Seed initial de 22 profils représentatifs du parc algérien :
    - *Production Nationale & Assemblage Local (Priorité DZ)* : **SNVI** (K66, K120, C260, B400, TB400), **Mercedes-Benz Algérie / SAFMMA** (Actros, Zetros 6x6/4x4, Unimog, Sprinter assemblés à Rouïba et Tiaret).
    - *Poids Lourds Import* : Renault Trucks (T/K/C, DXi 11/13), MAN TGS/TGX, Scania Série R/G, Volvo FH/FMX, Shacman X3000/F3000 (Weichai WP12), Sinotruk Howo A7/T7H, Dongfeng.
    - *Utilitaires & Légers (VUL)* : Renault Master / Kangoo (1.5 dCi), Peugeot Partner / Boxer, Fiat Ducato / Doblo, Toyota Hilux D-4D, Isuzu D-Max, Hyundai H100 / HD35/HD65/HD72, JAC / Foton.
    - *Engins BTP, Mines & Hydrocarbures* : Pelles Caterpillar 320D/330D, Chargeuses Liugong / XCMG / SDLG, Tractopelles JCB 3CX/4CX, Komatsu.
    - *Agricole* : Tracteurs Cirta / PMA (Constantine), Massey Ferguson 385, Claas Arion, Deutz-Fahr.

- **Tâche 1.2 : Moteur d'Estimation Cinématique Mode 0 (Naftal + Valhalla + DVIR)**
  - Estimation kilométrique par réconciliation des pleins/cartes **Naftal Pass** (Gasoil, Sans Plomb, Sirghaz/GPLc) corrigée de la sévérité locale et du facteur de charge :
    $$\Delta \widehat{D}_{\text{carburant}} = \frac{V_{\text{plein}} \times 100}{C_{\text{ref}} \times (2 - \alpha_{\text{dz}})} \times \frac{1}{\gamma_{\text{charge}}}$$
    où $\gamma_{\text{charge}} \in [1.0, 1.35]$ modélise le facteur de charge (à vide vs pleine charge / citerne) issu de la feuille de route.
  - Intégration du routeur **Valhalla auto-hébergé** (graphe routier Algérie OSM) pour calculer la distance topographique réelle et le profil d'élévation ($\Delta h$) entre les points de livraison.
  - Module DVIR mobile Offline-First avec capture photo de l'odomètre / horamètre pour recalage bayésien de la dérive kilométrique.

- **Tâche 1.3 : Matrice Géoclimatique & Sévérité Algérie ($\alpha_{\text{dz}}$ sur 58 Wilayas)**
  - Table `dz_wilaya_severity_matrix` indexant les 58 wilayas par zone climatique, topographie et granulométrie de poussière :
    - *Zone 1 — Tell & Littoral Urbain* (ex: 16-Alger, 31-Oran, 23-Annaba, 09-Blida) : $\alpha_{\text{dz}} = 0.75$ (fort taux d'embouteillage / ralenti urbain).
    - *Zone 2 — Hauts Plateaux & Relief* (ex: 19-Sétif, 05-Batna, 15-Tizi Ouzou, 25-Constantine, 17-Djelfa) : $\alpha_{\text{dz}} = 0.80$ (fortes pentes, amplitudes thermiques hivernales).
    - *Zone 3 — Grand Sud & Bassins Pétroliers/Miniers* (ex: 30-Ouargla/Hassi Messaoud, 01-Adrar, 11-Tamanrasset, 37-Tindouf, 53-In Salah) : $\alpha_{\text{dz\_filtration}} = 0.50$ (sable siliceux fin) et $\alpha_{\text{dz\_huile}} = 0.65$ (stress thermique $> 48\text{ }^\circ\text{C}$ ambiant).

---

### EPIC 2 : Ingestion Télématique Résiliente (« Zones Blanches ») & TimescaleDB
**Objectif :** Absorber 95 % des flux via Traccar auto-hébergé, résister aux rafales de rattrapage (*Store-and-Forward*) après traversée des zones blanches du Sud algérien, et garantir zéro fuite PII (Loi 18-07).

- **Tâche 2.1 : Hypertables TimescaleDB, Compression & Continuous Aggregates**
  - Table `telemetry_events` convertie en Hypertable partitionnée par `device_timestamp` (`chunk_time_interval => INTERVAL '7 days'`) et sous-partitionnée par `tenant_id`.
  - **Règle critique Zones Blanches :** L'horodatage maître est toujours `device_timestamp` (horloge GPS du boîtier) et jamais `server_ingestion_timestamp`.
  - Création de *Continuous Aggregates* matérialisées (`telemetry_hourly_rollup`, `telemetry_daily_asset_summary`) pour servir les tableaux de bord en $< 50\text{ ms}$ sans scanner les chunks bruts.
  - Politique de compression automatique après 14 jours (`timescaledb.compress_segmentby = 'tenant_id, vehicle_id'`, gain stockage $> 90\text{ \%}$).

- **Tâche 2.2 : Ingestion Primaire Traccar 6.x & Absorption de Rafales (*Burst Buffer*)**
  - Écoute dédiée : Teltonika (FMB920, FMC130, FMB640 poids lourds), Ruptela, Queclink, OsmAnd.
  - File d'ingestion asynchrone (Redis Streams / BullMQ) capable d'absorber la décharge soudaine de 50 000 points stockés en mémoire flash par un camion sortant d'une zone sans couverture 2G/4G dans le Grand Sud, avec déduplication idempotente sur `(vehicle_id, device_timestamp)`.
  - Décodage local haute vitesse via `cantools` / `opendbc` des PGN J1939 critiques (heures moteur, taux de carburant par heure, température liquide de refroidissement, pression d'huile, ralentisseur, poids à l'essieu).

- **Tâche 2.3 : Passerelle Failover Flespi Stateless (Conformité Stricte Loi 18-07 ANPDP)**
  - Activation uniquement en cas de trame propriétaire inconnue en local.
  - **Coupe-feu d'anonymisation (PII Stripper) :** Seul le couple `(device_imei, raw_hex_payload)` transite. Aucune plaque d'immatriculation, aucun nom de chauffeur, aucun `tenant_id` explicite ni coordonnée client n'est transmis hors du serveur algérien.

- **Tâche 2.4 : Cache Temps Réel Redis 7 & Détection de Statut Connectivité**
  - Mise à jour atomique du *Last Known State* (`asset:{tenant_id}:{vehicle_id}:state`) uniquement si `incoming.device_timestamp > cached.device_timestamp` (protection contre l'écrasement de l'état présent par une vieille trame de rattrapage).
  - Statuts de connectivité distincts : `ONLINE`, `IDLE`, `OFFLINE_DARK_ZONE` (en mission connue dans une zone blanche répertoriée), `TAMPER_SUSPECTED` (coupure d'alimentation boîtier détectée).

---

### EPIC 3 : Moteur de Maintenance Prédictive Physique & Anti-Fraude (6 Algorithmes)
**Objectif :** Remplacer les alertes calendaires naïves par 6 modèles physiques déterministes adaptés aux contraintes algériennes, produisant une preuve explicable (XAI) et un score VHI.

- **Tâche 3.1 : Dégradation d'Huile Moteur (Loi Cinétique d'Arrhenius)**
  - Calcul du kilométrage équivalent d'usure chimique et mécanique $\Delta D_{\text{eff}}$ :
    $$\Delta D_{\text{eff}} = (\Delta d_{\text{réel}} + v_{\text{équiv}} \cdot \Delta t_{\text{ralenti}}) \cdot \exp\left[\frac{E_a}{R}\left(\frac{1}{T_{\text{réf}}} - \frac{1}{T_{\text{huile}}}\right)\right] \cdot \frac{\phi_{\text{charge}}}{\alpha_{\text{dz\_huile}}}$$
  - Intégration spécifique du ralenti prolongé avec climatisation ou prise de force (PTO bétonnière/grue/frigo) en été saharien.

- **Tâche 3.2 : Santé Batterie & Démarreur (*Cranking Voltage Drop* & SOH)**
  - Capture de la chute de tension au démarrage ($V_{\text{crank\_min}}$) et du temps de lancement moteur, compensés par la température ambiante ($15\text{ mV/}^\circ\text{C}$ en 12V, $30\text{ mV/}^\circ\text{C}$ en 24V poids lourds).
  - Détection croisée de la défaillance d'alternateur en roulage ($V_{\text{charge}} < 27.2\text{ V}$ sur circuit 24V) et régression linéaire sur 15 démarrages pour prédire le RUL avant immobilisation.

- **Tâche 3.3 : Modèle Thermique Résiduel (Entartrage Radiateur & Joint de Culasse)**
  - Estimation de la température attendue $\widehat{T}_{\text{attendu}}(\text{Charge}, v_{\text{air}}, T_{\text{amb}}, \text{Pente})$ et calcul du résidu $r_t = T_{\text{coolant}} - \widehat{T}_{\text{attendu}}$.
  - Lissage EWMA ($\alpha = 0.15$) : alerte précoce d'entartrage radiateur / défaillance visco-coupleur ($r_t \ge +7.5\text{ }^\circ\text{C}$, critique dans les montées de l'Atlas tellien en été) ou thermostat bloqué ouvert ($r_t \le -12\text{ }^\circ\text{C}$, surconsommation à froid).

- **Tâche 3.4 : Capteur Virtuel d'Usure des Freins (Loi d'Archard Topographique)**
  - Calcul de l'énergie mécanique dissipée aux garnitures lors des décélérations ($a < -1.1\text{ m/s}^2$) et des descentes prolongées ($\Delta h < 0$ via profil Valhalla), **déduction faite** de l'activation du ralentisseur hydraulique/électromagnétique ou frein sur échappement (trame J1939 *Retarder*).

- **Tâche 3.5 : Colmatage FAP, Dérive Injecteurs & Qualité Gasoil**
  - Surveillance de la dérive du rendement spécifique (débit carburant J1939 vs couple/puissance demandée $> +7\text{ \%}$).
  - Suivi des cycles de régénération FAP avortés en usage urbain et alerte préventive de saturation du filtre séparateur eau/gasoil.

- **Tâche 3.6 : Détection de Fraude Carburant Multi-Modes & Anti-Ballottement**
  - *Filtrage du ballottement (Sloshing Filter) :* Application d'un filtre médian glissant et correction d'inclinaison routière pour éliminer les fausses alertes sur pistes de chantier ou virages serrés.
  - *Siphonnage à l'arrêt :* Chute nette stabilisée $> 4\text{ \%}$ du volume réservoir contact coupé, géolocalisée et horodatée.
  - *Piquage lent en mission (Slow Bleeding) :* Carte de contrôle séquentielle **CUSUM de Page-Hinkley** comparant le débit cumulé des injecteurs (CAN) à la baisse réelle de la jauge réservoir et aux tickets Naftal.

- **Tâche 3.7 : Score VHI (*Vehicle Health Index*) & Vecteur d'Explicabilité**
  - Agrégation non-linéaire pondérée (le maillon critique domine : ex. surchauffe moteur plafonne immédiatement le VHI à $< 45$) sur une échelle $[0, 100]$.
  - Génération obligatoire d'un **JSON d'Explicabilité (XAI)** attaché à chaque score, détaillant en français et en arabe la cause physique racine et la pièce incriminée.

---

### EPIC 4 : Moteur Décisionnel Réglementaire, Arbitrage Financier (DZD) & Substitution
**Objectif :** Transformer chaque risque technique ou légal en décision financière chiffrée en Dinars Algériens (SAD $\rightarrow$ ADS) et automatiser la continuité opérationnelle.

- **Tâche 4.1 : Matrice Réglementaire Algérienne Opposable (`country_pack_dz`)**
  - *Contrôle Technique ENACTA :* Périodicité automatique selon catégorie (6 mois pour Poids Lourds, Transport Public, Citernes/MD ; 12 mois pour VUL commerciaux).
  - *Assurances & Taxes :* Suivi RC, Tous Risques, CatNat (Ordonnance 03-12) et Vignette automobile annuelle DGI.
  - *Conformité Chauffeur :* Permis (B, C1, C2, D, E), Brevet Professionnel (BPC) et Habilitation Transport de Matières Dangereuses (HAZMAT / ADR Algérie).
  - *Restrictions de Circulation par Wilaya :* Encodage des arrêtés de wilaya (interdictions de tonnage aux heures de pointe dans le Grand Alger/Oran, restrictions estivales et horaires de convois exceptionnels).

- **Tâche 4.2 : Moteur d'Arbitrage Économique en Dinars (Coût d'Action vs Risque d'Inaction)**
  - Pour toute anomalie prédictive (VHI $< 75$), calcul automatique de l'espérance mathématique de perte en **DZD** :
    $$\text{Risque}_{\text{Inaction}}(\text{DZD}) = P_{\text{panne}}(d_{\text{mission}}) \times (C_{\text{casse\_organe}} + C_{\text{remorquage\_zone}} + C_{\text{immobilisation/jour}} \times J_{\text{arrêt}} + C_{\text{pénalité\_client}})$$
  - Arbitrage explicite affiché au décideur : *« Immobiliser 3h à l'atelier d'Alger pour remplacer la pompe à eau (Coût : 18 500 DZD) vs Risque à 68 % de casse joint de culasse sur le trajet Alger-Ouargla (Coût estimé : 420 000 DZD) »*.

- **Tâche 4.3 : Verrouillage du Dispatch & Génération d'Ordre de Mission (OM) Réglementaire**
  - Machine à états stricte : `AVAILABLE`, `IN_MISSION`, `MAINTENANCE_WARN`, `BLOCKED_SAFETY` (VHI $< 50$), `BLOCKED_REGULATORY` (ENACTA/Assurance expirant avant la fin prévue de la mission).
  - Génération PDF instantanée de l'**Ordre de Mission (OM)** bilingue (FR/AR) conforme aux contrôles routiers algériens (Gendarmerie Nationale / DGSN), intégrant un QR Code de vérification hors-ligne.

- **Tâche 4.4 : Algorithme Multicritère (TOPSIS / Score Pondéré) de Substitution de Véhicule**
  - En cas de verrouillage d'un véhicule assigné à une mission $M$, sélection instantanée du meilleur remplaçant disponible dans le dépôt :
    $$\text{Score}(v, M) = \mathbb{I}_{\text{Légal}}(v, M) \cdot \mathbb{I}_{\text{Capacité}}(v, M) \cdot \mathbb{I}_{\text{RUL}}(v) > 1.5 \cdot d_M \cdot [w_1 \cdot \text{VHI}_v - w_2 \cdot \text{TCO}_{\text{km}}(v) - w_3 \cdot D_{\text{approche}}(v) + w_4 \cdot \text{Équilibrage\_Parc}(v)]$$

---

### EPIC 5 : Cockpit Opérateur Haute Densité, Cartographie Souveraine & Mobile DVIR
**Objectif :** Offrir une interface d'exploitation chirurgicale, ultra-rapide et 100 % fonctionnelle sans dépendance aux API cartographiques étrangères.

- **Tâche 5.1 : Carte Temps Réel Souveraine (MapLibre GL JS + PMTiles Algérie & Fallback OSM)**
  - Rendu vectoriel 60 FPS via **MapLibre GL JS** alimenté par une archive locale **PMTiles** de l'Algérie (auto-hébergée, zéro coût par requête, fonctionnelle même en réseau isolé).
  - Calques métiers superposables : frontières des 58 wilayas, stations Naftal (avec disponibilité Sirghaz/Gasoil), zones de restriction poids lourds, zones blanches réseau connues et ateliers agréés.
  - Différenciation visuelle immédiate des véhicules en Mode 0 (icône trajectoire estimée Valhalla), Mode 1 (GPS temps réel) et Mode 2 (télémétrie CAN active).
  - Bascule fluide 1-clic vers OpenStreetMap (connecté) ou Moteur Vectoriel Local (100% Hors-Ligne).

- **Tâche 5.2 : Cockpit Télématique Haute Densité & Design System Industriel**
  - Architecture UI Next.js 15 basée sur une palette sombre industrielle (`slate-950`, bordures `1px`, typographie tabulaire monospace `font-mono tabular-nums` pour les compteurs DZD, km, litres et tensions).
  - Vue synthétique par actif : Jauge VHI, courbes de dégradation RUL, preuves XAI et arbitrage financier en Dinars en un seul coup d'œil (zéro navigation profonde inutile).

- **Tâche 5.3 : Console de Réconciliation Carburant Naftal & Preuves CUSUM**
  - Import automatisé (CSV/Excel/API) des relevés **Naftal Pass** et rapprochement tripartite : *Volume Facturé Naftal* vs *Delta Jauge Réservoir* vs *Cumul Injecteurs CAN*.
  - Dossier de preuve visuel exportable en cas de siphonnage (carte du lieu d'arrêt, courbe de chute de jauge, horodatage et statut contact).

- **Tâche 5.4 : Application PWA Mobile DVIR & Terrain (Offline-First, Bilingue FR / AR RTL)**
  - Interface de prise et fin de poste pour chauffeurs et chefs de parc, utilisable hors-ligne (IndexedDB / Service Workers) avec synchronisation automatique dès le retour du réseau.
  - Support natif du Français (`fr-DZ`) et de l'Arabe (`ar-DZ` en mise en page **RTL** complète) avec ergonomie visuelle simplifiée (pictogrammes universels, saisie vocale/photo d'anomalie en 3 clics).

---

### EPIC 6 : Boucle Fermée Atelier (GMAO / OR), Fiscalité DGI & Industrialisation
**Objectif :** Fermer la boucle entre la prédiction mathématique et l'action mécanique réelle à l'atelier, tout en verrouillant la conformité fiscale algérienne et la tenue en charge.

- **Tâche 6.1 : Boucle Fermée de Maintenance (Ordres de Réparation — OR)**
  - Conversion en 1 clic d'une alerte prédictive (ex: RUL Huile $< 500\text{ km}$ ou Résidu Thermique $> +7.5\text{ }^\circ\text{C}$) en **Ordre de Réparation (OR)** interne ou externe.
  - **Réinitialisation Mathématique Certifiée :** La clôture d'un OR par le chef d'atelier (avec saisie des pièces remplacées, référence OEM, coût main-d'œuvre/pièces en DZD et kilométrage) remet automatiquement à zéro le compteur d'usure de l'algorithme correspondant ($\Delta D_{\text{eff}} \leftarrow 0$, recalibrage de la ligne de base CUSUM ou thermique) et recalcule immédiatement le VHI.

- **Tâche 6.2 : Facturation, TCO & Conformité Fiscale Algérienne (DGI)**
  - Calcul du **TCO (Coût Total de Possession) au kilomètre en DZD** par véhicule et par mission (Carburant Naftal + Pièces & Atelier + Pneumatiques + Assurances/ENACTA + Amortissement).
  - Conformité stricte des éditions financières et bons de commande atelier aux exigences fiscales algériennes : **NIF, NIS, RC, Article d'Imposition (AI)**, TVA (19 % / 9 %) et barème progressif du droit de timbre en espèces.

- **Tâche 6.3 : Banc de Simulation & Chaos Testing (« Sahara Burst & Fraud Simulator »)**
  - Script de test de charge et de validation physique (`scripts/simulate-dz-fleet.ts`) injectant des scénarios réalistes :
    - Convoi Alger $\rightarrow$ Hassi Messaoud avec coupure réseau de 4h puis rafale de 15 000 trames hors-séquence.
    - Surchauffe progressive dans la montée de Bouira en plein mois d'août ($T_{\text{amb}} = 44\text{ }^\circ\text{C}$).
    - Siphonnage de 35 L à l'arrêt sur une aire de repos et piquage lent de 3 % sur 2 000 km.

---

## 3. Matrice de Traçabilité : MASTER SPEC $\leftrightarrow$ Roadmap Gates

| Section MASTER SPEC | Épopée (EPIC) | Gate Associée | Livrable Majeur & Avantage Compétitif DZ |
| :--- | :---: | :---: | :--- |
| **Sections 1 & 3** (OEM-First & Mode 0) | **EPIC 1** | **Gate 0.5 & Gate 2** | Catalogue 22 profils (SNVI, SAFMMA, Shacman, etc.), Mode 0 Naftal/Valhalla, Matrice 58 Wilayas. |
| **Sections 2 & 3.3** (Ingestion & Timescale) | **EPIC 2** | **Gate 3** | Hypertables TimescaleDB, Continuous Aggregates, Buffer Zones Blanches, Failover Flespi Zéro-PII. |
| **Section 4** (Physique Prédictive & VHI) | **EPIC 3** | **Gate 4 & Gate 5** | 6 Algorithmes déterministes (Arrhenius, Cranking, Thermique, Archard avec Retarder, FAP, CUSUM filtré) + XAI. |
| **Section 5** (SAD $\rightarrow$ ADS & Conformité) | **EPIC 4** | **Gate 5 & Gate 6** | Pack ENACTA/Wilayas, Arbitrage ROI en DZD, Verrouillage Dispatch, Ordre de Mission QR, Substitution. |
| **Sections 6 & 7** (Cockpit & Mobile Terrain) | **EPIC 5** | **Gate 0.5 & Gate 7** | Carte souveraine MapLibre/PMTiles, UI `slate-950` haute densité, Réconciliation Naftal, PWA DVIR FR/AR. |
| **Section 8** (Atelier, TCO & Résilience) | **EPIC 6** | **Gate 7 & Prod** | Boucle fermée Atelier (OR $\rightarrow$ Reset RUL), TCO & Fiscalité DGI (NIF/NIS/RC), Simulateur Sahara Burst. |

---

## 4. Protocole de Validation & Garde-fous d'Ingénierie (`pnpm verify`)

Aucune tranche de ce plan directeur ne peut être clôturée sans valider ces 6 critères bloquants :
1. **Intégrité Globale :** `pnpm verify` (Typecheck, Lint, Tests unitaires & intégration) doit retourner un statut **PASS** à 100 %.
2. **Étanchéité Multi-Tenant :** PostgreSQL RLS actif en mode **Fail-Closed** sur chaque table/hypertable, prouvé par un test automatisé de tentative d'accès cross-tenant sous rôle `df_tenant_role`.
3. **Souveraineté Loi 18-07 (ANPDP) :** Test automatisé inspectant les DTOs sortants pour garantir que zéro donnée nominative (nom, NIN, téléphone, plaque, client) ne quitte le serveur algérien.
4. **Résilience Temporelle IoT :** Tout test d'algorithme (EPIC 3) doit réussir même lorsque les trames télématiques sont injectées dans le désordre ou après une coupure réseau simulée.
5. **Preuve Mathématique & XAI :** Chaque algorithme prédictif est couvert par des tests unitaires vérifiant les cas limites physiques (froid extrême Hauts Plateaux, canicule Sahara, descente en charge, ballottement réservoir).
6. **Conformité Locale :** Devises en **DZD**, formatage numérique tabulaire et clés i18n (`fr-DZ` / `ar-DZ` RTL) obligatoires sur tout composant UI livré.
