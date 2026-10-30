# MODÈLE DE MENACES STRIDE (THREAT MODEL)

**Statut :** DOCUMENT TECHNIQUE DE SÉCURITÉ  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/architecture/core-architecture.md`  
**Périmètre analysé :** Composants actuellement existants dans le monorepo (`apps/api`, `apps/web`, `packages/contracts`, conteneurs PostgreSQL/Redis).

---

## 1. Méthodologie STRIDE

L'analyse de risques couvre les six catégories de menaces STRIDE appliquées aux modules réels du dépôt :
- **S**poofing (Usurpation d'identité)
- **T**ampering (Altération des données)
- **R**epudiation (Répudiation des actions)
- **I**nformation Disclosure (Divulgation d'informations sensibles)
- **D**enial of Service (Déni de service)
- **E**levation of Privilege (Élévation de privilèges)

---

## 2. Analyse par Composant Réel

### 2.1 Passerelle API NestJS (`apps/api`)

| Menace STRIDE | Scénario d'attaque | Mesure de mitigation existante ou requise |
| :--- | :--- | :--- |
| **Spoofing** | Falsification d'un `tenant_id` envoyé dans les en-têtes ou le payload HTTP | Le contexte tenant est extrait exclusivement du jeton JWT authentifié côté serveur via middleware (`SET LOCAL app.current_tenant_id`), jamais depuis le corps de requête. |
| **Tampering** | Modification frauduleuse d'un relevé kilométrique ou d'un statut d'ordre de travail | Validation stricte des DTOs (Zod / class-validator), journalisation d'audit immuable (`AuditEvent`). |
| **Repudiation** | Un gestionnaire affirme ne pas avoir validé un ordre de travail coûteux | Enregistrement de l'auteur (`user_id`), date UTC, IP et empreinte de l'action dans le journal d'audit. |
| **Information Disclosure** | Fuite de données d'un autre client via une requête non filtrée | Row-Level Security (RLS) PostgreSQL obligatoire sur chaque table portant des données tenant. |
| **Denial of Service** | Inondation de requêtes non authentifiées sur `/health` ou endpoints métier | Limitation de débit (Rate Limiting via Redis / Throttler NestJS) à configurer. |
| **Elevation of Privilege** | Un utilisateur au rôle `TECHNICIAN` tente de modifier les paramètres fiscaux du tenant | Contrôle d'accès basé sur les rôles (RBAC) vérifié par Guard au niveau des contrôleurs. |

---

### 2.2 Client Web Next.js (`apps/web`)

| Menace STRIDE | Scénario d'attaque | Mesure de mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Vol de session ou token de session stocké en LocalStorage | Stockage des tokens d'authentification en cookies `HttpOnly; Secure; SameSite=Strict`. |
| **Information Disclosure** | Affichage de données sensibles d'un autre tenant en cache SSR | Ne jamais mettre en cache de données sensibles multi-tenant au niveau du serveur CDN / Next.js Data Cache global. |
| **Tampering (XSS)** | Injection de scripts via le nom d'un actif importé | Échappement automatique React/JSX et politique stricte Content Security Policy (CSP). |

---

### 2.3 Conteneurs & Stockage de Données (`PostgreSQL` & `Redis`)

| Menace STRIDE | Scénario d'attaque | Mesure de mitigation |
| :--- | :--- | :--- |
| **Information Disclosure** | Connexion directe au port PostgreSQL depuis l'extérieur | Les ports Docker `5434` et `6380` sont isolés sur le réseau interne ou restreints à `127.0.0.1` en production. |
| **Tampering** | Exécution d'une migration destructive non auditée | Migration exécutée exclusivement via CI autorisée après revue humaine explicite. |
| **Information Disclosure** | Fuite de variables d'environnement contenant des identifiants | Garde-fou `check-secrets.cjs` bloquant la présence de secrets en dur dans les commits. |
