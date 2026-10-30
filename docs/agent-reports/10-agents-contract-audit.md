# Rapport d'Audit 10 — Audit Rapide du Contrat AGENTS.md v1.0

**Date :** 2026-10-23  
**Branche :** `chore/agents-contract-v1.1`  
**Statut de l'étape :** `PASS`  
**Auteur :** Agent de développement DocteurFlotte  

---

## 1. État Réel du Dépôt

### 1.1 Arborescence Réelle
- **`apps/api/`** : API NestJS modulaire (`@docteurflotte/api`), comprenant `HealthController` (`/health`, `/ready`), tests Jest et e2e Supertest, validation pipes et CORS. Port 3001.
- **`apps/web/`** : Application Next.js 15 App Router (`@docteurflotte/web`), React 19, Tailwind/CSS tokens sombres, composant client `ApiStatusPanel`. Port 3000.
- **`packages/contracts/`** : Paquet TypeScript partagé (`@docteurflotte/contracts`) définissant `HealthResponse`, `ReadinessResponse`, `AssetCategory`, `MeterType`, `DataOrigin`.
- **`infra/compose.yaml`** : PostgreSQL 16 (`docteurflotte_postgres`, port hôte `5434`) et Redis 7 (`docteurflotte_redis`, port hôte `6380`) avec healthchecks et volumes nommés.
- **`.agents/skills/`** : 18 skills opérationnels (9 skills métier spécialisés + 9 skills d'ingénierie et d'infrastructure).
- **`docs/`** :
  - `docs/archive/AGENTS.v1.0.md` : Sauvegarde intégrale immuable de l'AGENTS.md v1.0 d'origine.
  - `docs/agent-reports/` : Rapports factuels d'avancement.

### 1.2 Scripts Disponibles (`package.json`)
- `pnpm dev` : Démarrage simultané en dev via Turborepo.
- `pnpm build` : Compilation complète de `contracts`, `api` et `web`.
- `pnpm lint` : Contrôle de typage/lint.
- `pnpm typecheck` : Vérification TypeScript stricte sur l'ensemble du monorepo.
- `pnpm test` : Exécution des suites de tests unitaires et e2e.

### 1.3 CI et Hooks Existants
- **CI :** Aucune configuration CI (pas de `.github/workflows/` détecté).
- **Git Hooks :** Aucun hook de pre-commit automatisé (uniquement les exemples standard par défaut de Git dans `.git/hooks/`).

---

## 2. Inventaire des Règles de l'AGENTS.md v1.0

Les 20 sections et 835 lignes de l'`AGENTS.md` v1.0 mélangent actuellement plusieurs natures d'instructions. Voici leur classification :

| Type de Règle | Sections Concernées dans v1.0 | Exemples de Règles | Destination Cible (v1.1) |
| :--- | :--- | :--- | :--- |
| **Permanente (Gouvernance & Sécurité)** | Sec. 0.2, 0.3, 1.0, 3.2, 8.3, 12, 18, 19 | Interdiction d'inventer des lois/prix, isolation RLS stricte, ordre de priorité des conflits, format de compte rendu, Definition of Done. | `AGENTS.md` (Cœur racine condensé) |
| **État du Projet (Vivant / Évolutif)** | Sec. 15 (Gates 0 à 7), Sec. 20 (Directive de démarrage) | "La première intervention consiste en un audit...", progression Gate 0 -> Gate 7. | `docs/roadmap.md` & `docs/status.md` |
| **Spécification Produit & Métier** | Sec. 0.1, 2, 4, 5, 6, 7, 8.1-8.4, 9, 10, 11, 13 | Définition des profils de véhicules/engins, scénario "Aha!", packs pays, modèle Traccar vs flespi, parcours PWA mobile. | `docs/product/`, `docs/architecture/`, `docs/regulatory/` |
| **Vérifiable Automatiquement** | Sec. 0.2 (pas de secrets), Sec. 3.2 (RLS), Sec. 8.3 (pas de constantes codées en dur), Sec. 10.1 (pas d'import direct Traccar dans le métier) | Détection de fuites de credentials, vérification RLS en base, lint d'architecture de dépendances. | Scripts CI & Pre-commit (`scripts/`, GitHub Actions) |

---

## 3. Contradictions et Ambiguïtés Internes Détectées

1. **Autonomie d'exécution vs. Obligation d'audit/plan préalable :**
   - *Section 0.2* : « Ne pas interrompre le travail pour demander une confirmation sur une étape non destructive et réversible lorsque les exigences sont suffisamment spécifiées. »
   - *Section 1.0* : « Formuler un plan court, limité à une tranche fonctionnelle verticale et testable » avant toute modification, et « ne pas appliquer une migration destructive, purger des données, supprimer un service sans évaluer les impacts ».
   - *Résolution nécessaire :* Formaliser une frontière claire dans une section « Autonomie » : ce qui est exécutable en autonomie totale (lecture, refactoring local, tests, documentation) vs ce qui exige une validation humaine explicite (migrations DDL, purge, ajout de dépendances prod, modification RLS/auth).
2. **Contrat d'architecture statique vs. État vivant du projet :**
   - Le fichier v1.0 combine des règles immuables de sécurité (RLS, secret leaks) et des directives de démarrage ponctuelles (« Première tâche à exécuter après avoir chargé ce fichier : Audite le dépôt... »). Une fois l'audit initial terminé, cette règle devient obsolète mais continue d'occuper de la place et de troubler l'orchestrateur.
   - *Résolution :* Séparer le contrat racine stable (`AGENTS.md`) de la feuille de route dynamique (`docs/roadmap.md`) et du statut vivant (`docs/status.md`).
3. **Périmètre du MVP vs. Modules Détaillés :**
   - La section 4.2 ordonne de « différer explicitement » la télématique avancée, le hors ligne et l'optimisation de tournées, tandis que les sections 10 et 11 décrivent par anticipation l'architecture Traccar détaillée et la synchronisation mobile offline.
   - *Résolution :* Déplacer ces spécifications dans des documents d'architecture modulaires (`docs/architecture/telematics.md`, `docs/architecture/offline.md`) référencés sans encombrer les consignes de base.
