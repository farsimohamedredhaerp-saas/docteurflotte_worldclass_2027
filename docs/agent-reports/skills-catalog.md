# Catalogue des Agent Skills — DocteurFlotte

**Date :** 2026-10-23  
**Cible d'exécution :** Google Antigravity IDE  
**Emplacement :** `.agents/skills/`  
**Référence Maître :** [`AGENTS.md`](file:///e:/docteurflotte_2027/AGENTS.md)

---

## 1. Principes de Gouvernance des Skills

1. **Compétences Métier Locales & Ciblées :** Les compétences reflétant l'architecture, le modèle décisionnel et les contraintes réglementaires du marché algérien sont développées directement dans le dépôt afin d'éviter toute dépendance envers des dépôts communautaires non audités ou inadaptés géographiquement.
2. **Priorisation par Gates (P0, P1, P2) :** Les skills sont structurés pour borner les tranches de travail :
   - **P0 :** Cœur du MVP (modèle d'actifs, décision économique de maintenance, qualité des données de diagnostic).
   - **P1 :** Intégrations et domaines d'exploitation (télématique Traccar, PostGIS/géospatial, logistique, preuves réglementaires algériennes).
   - **P2 :** Capacités avancées ultérieures (gouvernance prédictive, opérations mobiles déconnectées).
3. **Séparation Stricte :** Séparation formelle entre faits observés, estimations, hypothèses et prédictions. Respect de l'isolation multi-tenant (RLS) et interdiction de coder en dur des variables métier ou des règles juridiques.

---

## 2. Inventaire des Skills Métier DocteurFlotte

| Priorité | Identifiant du Skill | Objectif & Mission | Dépendances & Stack | Sources & Références | Statut d'Implémentation | Tests Exigés |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | [`asset-maintenance-core`](file:///e:/docteurflotte_2027/.agents/skills/asset-maintenance-core/SKILL.md) | Modèle d'actifs multi-métier, compteurs (km, heures), plans préventifs, ordres de travail, pièces et disponibilité. | NestJS, PostgreSQL/RLS, `@docteurflotte/contracts` | `AGENTS.md` (Sec. 4.1.B/C, 6), ISO 14224, DIN 31051 | **Prêt pour Gate 01** | Test isolation RLS, détection recul compteur, déclenchement préventif seuil, calcul downtime. |
| **P0** | [`maintenance-economics-decision`](file:///e:/docteurflotte_2027/.agents/skills/maintenance-economics-decision/SKILL.md) | Chiffrage intervention vs coût d'inaction, budgets, écarts réels vs prévus, arbitrages explicables et score de confiance. | NestJS, PostgreSQL/RLS, `@docteurflotte/contracts` | `AGENTS.md` (Sec. 4.1.D, 5.4, 7), Méthode ABC, TCO | **Prêt pour Gate 01** | Immutabilité des décisions passées, calcul variance budgétaire, pénalité de confiance sur données manquantes. |
| **P0** | [`diagnostic-parc-data-quality`](file:///e:/docteurflotte_2027/.agents/skills/diagnostic-parc-data-quality/SKILL.md) | Import CSV/XLSX, mapping de colonnes, détection de doublons/incohérences, prévisualisation dry-run et score de qualité. | NestJS, CSV Parser, ExcelJS, PostgreSQL | `AGENTS.md` (Sec. 4.1.G, 5.1, 5.5), RFC 4180, ISO 8000 | **Prêt pour Gate 01** | Rejet doublons (VIN/Série), gestion lignes mal formées sans crash, transactions rollback, étanchéité tenant. |
| **P1** | [`traccar-integration`](file:///e:/docteurflotte_2027/.agents/skills/traccar-integration/SKILL.md) | Adaptateur REST/WebSocket Traccar auto-hébergé, appairage boîtiers-actifs, ingestion résiliente, dédoublonnage. | NestJS, Redis/BullMQ, Traccar API | `AGENTS.md` (Sec. 4.1.E, 8), Traccar Documentation Officielle | Spécifié (Actif lors tranche télématique) | Test idempotence sur trame dupliquée, reprise sur déconnexion, isolation flux multi-tenant. |
| **P1** | [`telematics-data-quality-geospatial`](file:///e:/docteurflotte_2027/.agents/skills/telematics-data-quality-geospatial/SKILL.md) | Filtrage du bruit GPS, détection trajets/arrêts, ralenti excessif, géorepérage (geofencing) et fiabilisation compteurs. | PostGIS, SQL Spatial, NestJS | `AGENTS.md` (Sec. 4.1.E, 8), WGS 84, Haversine, PostGIS Docs | Spécifié (Actif lors tranche télématique) | Filtrage bruit d'étoile à l'arrêt, rejet téléportation GPS (>500 km/10s), événement franchissement geofence. |
| **P1** | [`logistics-domain`](file:///e:/docteurflotte_2027/.agents/skills/logistics-domain/SKILL.md) | Missions de transport et affectations sur chantier BTP, planning conducteurs/opérateurs, incidents et coût unitaire. | NestJS, PostgreSQL/RLS, BullMQ | `AGENTS.md` (Sec. 0.1, 2.3, 4.1.B) | Spécifié (Actif lors tranche logistique) | Détection conflit chevauchement créneaux, blocage affectation actif DOWN, contrôle chronologie compteurs. |
| **P1** | [`algeria-regulatory-evidence`](file:///e:/docteurflotte_2027/.agents/skills/algeria-regulatory-evidence/SKILL.md) | Dossiers de preuve réglementaire (JORADP), versionnement, dates d'effet, statut DRAFT vs APPROVED, assistance documentaire. | PostgreSQL, Schéma JSONB versionné | `AGENTS.md` (Sec. 0.2, 4.1.I, 9), JORADP officiel | Spécifié (Actif lors packs réglementaires) | Non-blocage par règles DRAFT, audit versionnement législatif, gestion valeur inconnue (`REGULATORY_CHECK_UNKNOWN`). |
| **P2** | [`predictive-maintenance-governance`](file:///e:/docteurflotte_2027/.agents/skills/predictive-maintenance-governance/SKILL.md) | Gouvernance des modèles ML, préparation sans fuite temporelle, évaluation F1/faux positifs, qualification économique. | Python/Node, Séquences temporelles | `AGENTS.md` (Sec. 4.2, 6.3), ISO 13374, MLOps | Spécifié (Réservé étape post-MVP) | Validation sur jeu de test futur (split temporel), rejet prédiction si capteur absent, calcul coût faux positif. |
| **P2** | [`offline-field-operations`](file:///e:/docteurflotte_2027/.agents/skills/offline-field-operations/SKILL.md) | Mode hors ligne mobile (PWA), saisie interventions/compteurs, IndexedDB, synchronisation bidirectionnelle, résolution conflits. | PWA Next.js, Service Worker, IndexedDB | `AGENTS.md` (Sec. 4.1.H), W3C IndexedDB | Spécifié (Réservé étape mobile) | Dédoublonnage reconnexion 5 actions offline, réconciliation divergence compteur local vs télématique. |

---

## 3. Skills Socle & Ingénierie Conservés

En complément des 9 skills métier ci-dessus, les skills méthodologiques éprouvés sont actifs dans `.agents/skills/` :
- [`mvp-orchestrator`](file:///e:/docteurflotte_2027/.agents/skills/mvp-orchestrator/SKILL.md) : Orchestration des gates MVP, critères d'acceptation stricts, interdiction d'invention d'états.
- [`tenant-isolation-rls`](file:///e:/docteurflotte_2027/.agents/skills/tenant-isolation-rls/SKILL.md) : Isolation multi-tenant transactionnelle (`SET LOCAL`) et RLS PostgreSQL.
- [`supabase-postgres-best-practices`](file:///e:/docteurflotte_2027/.agents/skills/supabase-postgres-best-practices/SKILL.md) : Bonnes pratiques PostgreSQL (schéma, RLS, index, pooling, transactions).
- **Redis (`redis-core`, `redis-connections`, `redis-security`, `redis-observability`)** : Bonnes pratiques files d'attente BullMQ et cache.
- **Ingénierie logicielle (`writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`)** : Rigueur de livraison et TDD.
- [`web-design-guidelines`](file:///e:/docteurflotte_2027/.agents/skills/web-design-guidelines/SKILL.md) : Revue d'accessibilité et qualité UI/UX.

---

## 4. Prochaine Étape Opérationnelle

Mettre en œuvre la **Gate 01 — Activation-First & Diagnostic de Parc** en s'appuyant directement sur le triplet de compétences P0 :
1. [`diagnostic-parc-data-quality`](file:///e:/docteurflotte_2027/.agents/skills/diagnostic-parc-data-quality/SKILL.md) pour le parser et le contrôle d'intégrité de l'import CSV/Excel.
2. [`asset-maintenance-core`](file:///e:/docteurflotte_2027/.agents/skills/asset-maintenance-core/SKILL.md) pour instancier les actifs et évaluer les plans d'entretien initiaux.
3. [`maintenance-economics-decision`](file:///e:/docteurflotte_2027/.agents/skills/maintenance-economics-decision/SKILL.md) pour produire le diagnostic économique et les ordres de travail recommandés.
