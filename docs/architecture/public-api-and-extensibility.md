# FEUILLE DE ROUTE D'EXTENSIBILITÉ & API PUBLIQUE (EXTENSIBILITY ROADMAP)

**Statut :** FEUILLE DE ROUTE D'ARCHITECTURE (CIBLE NON IMPLÉMENTÉE DANS LE MVP)  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/architecture/core-architecture.md`  

---

## 1. Principes d'Extensibilité Cibles

L'ouverture de DocteurFlotte aux systèmes tiers (ERP comptable, GMAO externe, pompes privées de carburant, TMS clients) est prévue après la consolidation du cœur de valeur MVP.

---

## 2. Piliers d'Architecture Cibles

### 2.1 API Publique Versionnée (`/api/v1/...`)
- **Versionnement dans l'URL :** Préfixe obligatoire `/api/v1/`.
- **Spécification :** Contrat OpenAPI 3.1 / Swagger généré automatiquement depuis les contrats TypeScript (`packages/contracts`).
- **Authentification :** Clés d'API scoping (`df_live_...` et `df_test_...`) générées par les administrateurs de tenant, avec hachage sécurisé (SHA-256) en base de données.
- **Limitation de débit (Rate Limiting) :** Quotas par tenant et par clé (ex : `PROPOSÉ — 100 requêtes/minute par clé (À VALIDER PAR LE FONDATEUR)`).

### 2.2 Webhooks Signés (Notifications Sortantes)
- **Cas d'usage :**
  - Émission d'un ordre de travail urgent.
  - Alerte de dépassement de seuil d'échéance de maintenance.
  - Détection d'anomalie compteur ou surconsommation anormale.
- **Sécurité :**
  - Signature cryptographique HMAC-SHA256 envoyée dans l'en-tête `X-DocteurFlotte-Signature`.
  - Horodatage `X-DocteurFlotte-Timestamp` pour prévenir les attaques par rejeu.
  - Mécanisme de relance exponentielle (exponential backoff) avec disjoncteur (circuit breaker) géré par BullMQ.

### 2.3 Authentification d'Entreprise (SSO & MFA)
- **Phase post-MVP :**
  - Support SAML 2.0 et OpenID Connect (OIDC) pour les grandes flottes (intégration Azure AD / Google Workspace).
  - Authentification multi-facteurs (TOTP / SMS) obligatoire pour les rôles d'administration et d'approbation financière.
