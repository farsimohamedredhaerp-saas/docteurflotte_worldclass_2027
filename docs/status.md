# État Courant du Système — DocteurFlotte

**Date :** 2026-10-24  
**Branche Git :** `chore/agents-contract-v1.1`  
**Dernier Commit :** En cours (Gate 3 — Télématique Traccar & Fleet Live)  
**Gates Complétées :** Gate 00 (`PASS`), Gate 0.5 (`PASS`), Gate 1 (`PASS`), Gate 2 (`PASS`), Gate 3 (`PASS`)  
**Prochaine Gate Cible :** Gate 4 (Cœur Décisionnel & Contrôle de Gestion)  

---

## 1. Services Locaux & Ports en Écoute

| Composant | Service Docker / Process | Port Interne | Port Hôte Retenu | Statut Observé |
| :--- | :--- | :---: | :---: | :--- |
| **PostgreSQL 16** | `docteurflotte_postgres` | `5432` | `5434` | **Up (healthy)** |
| **Redis 7** | `docteurflotte_redis` | `6379` | `6380` | **Up (healthy)** |
| **API NestJS** | Node.js process (`apps/api`) | `3001` | `3001` | **Actif & Testé** (31 unit / 35 E2E pass) |
| **Web Next.js 15** | Node.js process (`apps/web`) | `3000` | `3000` | **Actif & Testé** (HTTP 200 OK sur toutes les routes) |

---

## 2. Couche Télématique Découplée & Fleet Live (Gate 3 Complétée)

- **Adaptateur Traccar Canonique :** `ITelematicsProvider` implémenté avec résilience réseau, retry et tolérance aux coupures.
- **Dédoublonnage & Idempotence Stricte :** Contrainte unique `(tenant_id, traccar_position_id)` empêchant toute duplication de position en cas de renvoi réseau.
- **Appairage Horodaté :** Table `asset_device_bindings` avec traçabilité complète de l'historique d'affectation boîtier-véhicule.
- **Automatisation Décisionnelle :** Tout relevé GPS franchissant le seuil kilométrique ou horaire bascule l'actif en révision requise et génère automatiquement un ordre de travail préventif.
- **Console Fleet Live :** Interface de supervision `/telematics` connectée en temps réel avec coordonnées GPS, allumage contact ACC, vitesse en mouvement et statut de santé Traccar.

---

## 3. État des Tests et Intégrité

- **Typecheck Turborepo :** `tsc --noEmit` validé sur `@docteurflotte/contracts` et `@docteurflotte/web`.
- **Tests Unitaires API :** 31/31 tests réussis (`pnpm --filter @docteurflotte/api test`).
- **Tests E2E API & Isolation RLS :** 35/35 tests réussis (`pnpm --filter @docteurflotte/api test:e2e`).
- **Validation HTTP Live :** `/` (200), `/assets` (200), `/work-orders` (200), `/settings` (200), `/telematics` (200).

---

## 4. Prochaine Action Recommandée

Enchaîner sur la **Gate 4 (Cœur Décisionnel & Contrôle de Gestion)** pour le moteur de calcul du coût de l'inaction et la boucle décisionnelle explicable.
