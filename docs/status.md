# État Courant du Système — DocteurFlotte 2027 World-Class

**Date :** 2026-11-18  
**Version :** v3.2 (World-Class DZ-First & Maintenance 5.0 — Sovereign Telematics & Actuarial Decision)  
**Branche Git :** `main`  
**Quality Gates Complétées :** Gate 00 (`PASS`), Gate 0.5 (`PASS`), Gate 1 (`PASS`), Gate 2 (`PASS`), Gate 3 (`PASS`), Gate 4 (`PASS`), Gate 5 (`PASS`), Gate 6 (`PASS`)  
**Statut Global :** Production-Ready / Souverain / Air-Gapped Validé  

---

## 1. Services Locaux & Ports d'Exploitation

| Composant | Service Docker / Process | Port Interne | Port Hôte | Statut Observé |
| :--- | :--- | :---: | :---: | :--- |
| **PostgreSQL 16 + TimescaleDB** | `df_sovereign_postgres` | `5432` | `5434` | **Up (healthy)** — 100% RLS actif sur 69 tables |
| **Redis 7** | `df_sovereign_redis` | `6379` | `6380` | **Up (healthy)** — Cache bitemporel & rate limiting |
| **Traccar 6.x** | `df_sovereign_traccar` | `8082` | `8085` | **Up (healthy)** — Protocoles Teltonika/Ruptela |
| **API NestJS** | Node.js process (`apps/api`) | `3001` | `3001` | **Actif & Validé** (59 suites / 432 tests pass) |
| **Web Next.js 15 (Turbopack)** | Node.js process (`apps/web`) | `3000` | `3000` | **Actif & Validé** (24 suites / 135 tests pass) |
| **Moteur Décisionnel Bitemporel** | `@docteurflotte/decision-engine` | - | - | **Actif & Validé** (15 suites / 139 tests pass) |

---

## 2. Capacités & Modules Stratégiques Validés

1. **Maintenance 5.0 & Jumeau Numérique Déterministe :**
   - Modélisation physique explicable des 6 organes d'usure (`ENGINE_OIL`, `BATTERY_CRANKING`, `BRAKE_PADS`, `COOLING_SYSTEM`, `DPF_FILTER`, `TRANSMISSION_DRIVETRAIN`).
   - Calibrage bioclimatique sur les 58 Wilayas (Tell, Hauts-Plateaux, Sahara).
2. **Huissier Juridique CUSUM & Dossiers Techniques Opposables :**
   - Détection des siphonnages avec compensation topographique Valhalla.
   - Génération de PV cryptographiques SHA-256 (`DET-*`).
3. **Moteur Décisionnel Bitemporel Universel & Packs Réglementaires :**
   - Packs officiels administrables : `DZ_LF_2025_OFFICIAL` (minimum IFU 30 000 DA, CNAS 34,5%), `DZ_LF_2026_OFFICIAL`, `DZ_LF_2027_DRAFT` et `DZ_BUSINESS_DEFAULTS_PACK`.
   - Zéro constante en dur dans le code : 100% de lookup bitemporel avec cache compilé LRU.
4. **Regulatory Studio SuperAdmin :**
   - Console d'administration pour cloner, modifier avec référence légale obligatoire, simuler des cas réels (Artisan IFU, SARL BTPH, Transporteur Sud) et publier avec signature Ed25519.
5. **Simulateur d'Arbitrage de Régime Fiscal à l'Onboarding :**
   - Évaluation comparative immédiate des 4 options : Auto-Entrepreneur (ANAE), IFU Forfaitaire, Réel Simplifié (IRG Art. 104) et Personne Morale (SARL/EURL IBS 19%/23%/26%).
   - Intégration dans le wizard d'onboarding organisationnel (`/setup`) en 4 étapes fluides sans écran blanc.
6. **5 Pôles Métiers Verticaux Activables :**
   - Chantiers & Engins BTPH (heures moteur, ratio déplacement/travail, maintenance au godet).
   - Chaîne du Froid & Agrément Sanitaire HACCP (alertes thermo-enregistreur, certificats d'intégrité).
   - Mines & Carrières (indice TKPH pour pneumatiques OTR, coût par tonne transportée).
   - Agriculture Saharienne (pivots d'irrigation, consommation L/h, campagnes à la tâche).
   - TMD / ADR Citernes Hydrocarbures (visites citernes, protocoles de sécurité, corridors obligatoires).
7. **Vitrine Souveraine & Landing Page Mondiale (Lot Marketing & Acquisition) :**
   - Landing page de niveau mondial (`/` et `/landing`), bilingue FR/AR (RTL natif), zéro citation d'entreprise tierce (auditée par test regex automatisé).
   - Simulateur actuarial interactif de rentabilité nette et ROI en Dinars Algériens (DZD).
   - Sélecteur interactif des 3 paliers d'exploitation (Mode 0 Zéro-Boîtier, Mode 1 GNSS, Mode 2 Bus CAN) et des 6 organes physiques XAI.
   - Démonstration interactive du terminal d'atelier vocal/dialectal local sans cloud (< 50 ms).

---

## 3. Métrologie de Qualité & Conformité (Preuves Factuelles)

- **Suites de Tests Automatisés :** **721 tests au vert (100% PASS)**
  - `@docteurflotte/decision-engine` : 15 suites, 139 tests
  - `@docteurflotte/api` : 59 suites, 432 tests
  - `@docteurflotte/web` : 25 suites, 140 tests
  - `@docteurflotte/client` : 1 suite, 6 tests
  - `@docteurflotte/rule-studio` : 1 suite, 4 tests
- **Étanchéité Multi-Tenant (RLS) :** **100%** des tables avec `tenant_id` (69/69) ont `rowsecurity = true` et fail-closed sous le rôle `df_tenant_role`.
- **Zéro Mock Inline UI :** 100% des pages respectent l'isolation stricte Démo/Production validée par `scripts/guardrails/lint-zero-hardcode-ui.cjs`.
- **Sécurité des Webhooks & Secrets :** Fail-Closed en production (rejet 401 si secret manquant), arrêt d'urgence si `JWT_SECRET` modèle.
- **En-têtes de Sécurité HTTP :** En-têtes OWASP configurés en middleware natif (`nosniff`, `DENY`, `strict-origin`, CSP, COOP, CORP, HSTS).
- **Rate Limiting Hybride :** Protection anti-brute force distribuée Redis (multi-instances) avec repli automatique en mémoire vive.
- **Migrations SQL Ordonnées :** 28 fichiers de migrations sans doublons d'ordonnancement (01 à 27, avec 11_oem et 11b_enable_rls).

---

## 4. Prochaine Action Recommandée

Préparer la recette utilisateur et la démonstration commerciale du Regulatory Studio et de l'Onboarding avec simulation fiscale en direct.
