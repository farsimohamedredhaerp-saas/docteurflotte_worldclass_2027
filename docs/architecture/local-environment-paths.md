# Référentiel des Chemins et Environnements Locaux

**Date de mise à jour :** 2026-10-24  
**Objectif :** Éviter toute recherche itérative sur le disque lors des sessions d'agents ou de développement.

---

## 1. Fichiers de Configuration Automatique

- **Fichier JSON structuré :** [`scripts/env-paths.json`](file:///e:/docteurflotte_2027/scripts/env-paths.json)
- **Script de chargement immédiat (PowerShell) :** [`scripts/load-env.ps1`](file:///e:/docteurflotte_2027/scripts/load-env.ps1)

Pour charger l'environnement dans un terminal PowerShell :
```powershell
. .\scripts\load-env.ps1
```

---

## 2. Chemins des Runtimes Détectés (Hôte Windows)

| Binaire / Outil | Chemin Absolu sur l'Hôte | Version |
| :--- | :--- | :--- |
| **Node.js (binaire)** | `C:\Users\MAGICSOFTDZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` | `v24.22.1` |
| **Node.js (dossier bin)** | `C:\Users\MAGICSOFTDZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin` | - |
| **pnpm (script CLI)** | `C:\Users\MAGICSOFTDZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs` | `v10.4.1` |
| **pnpm (script global)** | `C:\Users\MAGICSOFTDZ\AppData\Roaming\npm\pnpm.ps1` | - |

---

## 3. Ports et Services Locaux Actifs (Docker Compose)

| Service | Port Hôte Local | Utilisateur / Accès | Rôle |
| :--- | :---: | :--- | :--- |
| **PostgreSQL 16** | **`5434`** | `docteurflotte_dev` | Base multi-tenant isolée avec RLS (`df_tenant_role`) |
| **Redis 7** | **`6380`** | Sans mot de passe (local) | Cache de session et files BullMQ |
| **Traccar 6.15.2 Web** | **`8085`** | `admin` / `admin` | Passerelle télématique GPS self-hosted |
| **Traccar Port OsmAnd** | **`5055`** | TCP/HTTP | Réception positions GPS applications mobiles |
| **Traccar Port Teltonika** | **`5023`** | TCP / UDP | Réception trames boîtiers télématiques (FMB920, etc.) |
| **NestJS API** | **`3001`** | Bearer JWT | Backend décisionnel, télématique et maintenance |
| **Next.js Web** | **`3000`** | HTTP | Frontend Cockpit Flotte & Contrôle de gestion |

---

## 4. Arborescence du Monorepo

- **Racine du Workspace :** `e:\docteurflotte_2027`
- **Application Backend :** `e:\docteurflotte_2027\apps\api`
- **Application Frontend :** `e:\docteurflotte_2027\apps\web`
- **Package Contrats :** `e:\docteurflotte_2027\packages\contracts`
- **Infrastructure Compose :** `e:\docteurflotte_2027\infra`
