# RAPPORT DE VÉRIFICATION 11 — GARDE-FOUS AUTOMATIQUES

**Date :** 2026-10-23  
**Branche :** `chore/agents-contract-v1.1`  
**Statut Global :** PASS (avec constats et avertissements documentés)  

---

## 1. Objectif de l'étape 3

Transformer les règles critiques de `AGENTS.md` (autrefois purement déclaratives) en garde-fous automatisés et exécutables en local et en CI via `pnpm verify`.

---

## 2. Inventaire et résultats des contrôles exécutés

### Contrôle A — Détection de secrets et fuites d'identifiants
- **Script :** `scripts/guardrails/check-secrets.cjs`
- **Méthode :** Vérification présence de `gitleaks`. Si absent de l'environnement hôte, repli automatique sur un analyseur statique intégré scannant l'ensemble de l'arborescence (clés privées, tokens Traccar/flespi, credentials dans les URLs, chaînes d'entropie élevée), à l'exclusion des fichiers ignorés et mocks documentés.
- **Commande exécutée :** `node scripts/guardrails/check-secrets.cjs`
- **Résultat réel :**
  ```
  [GUARDRAIL] Vérification de détection de secrets...
  ℹ gitleaks non installé sur la machine hôte. Utilisation de l'analyseur statique intégré...
  ✓ Détection de secrets : Zéro secret exposé dans le code source.
  ```
- **Statut :** `PASS`

---

### Contrôle B — Étanchéité PostgreSQL Row-Level Security (RLS)
- **Script :** `scripts/guardrails/check-rls.cjs`
- **Méthode :** Analyse des fichiers de migrations SQL et vérification de la présence systématique de `ENABLE ROW LEVEL SECURITY` pour toute table hébergeant des données tenant.
- **Commande exécutée :** `node scripts/guardrails/check-rls.cjs`
- **Résultat réel :**
  ```
  [GUARDRAIL] Vérification de l'étanchéité RLS (Row-Level Security)...
  ℹ État du schéma : Aucun fichier de migration SQL physique détecté dans le dépôt.
  ℹ Les migrations métier et le schéma PostgreSQL RLS sont prévus pour la Gate 1 (Multi-tenant & Auth).
  ℹ Requête de vérification SQL préparée pour la CI :
  --------------------------------------------------
  SELECT 
      schemaname,
      tablename,
      rowsecurity
  FROM pg_tables 
  JOIN pg_class ON pg_class.relname = pg_tables.tablename
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND tablename NOT IN ('_migrations', 'typeorm_metadata', 'schema_migrations');
  --------------------------------------------------
  ⚠ STATUT RLS : NOT VERIFIED (En attente des premières migrations de tables tenant en Gate 1).
  ```
- **Statut :** `NOT VERIFIED (SCHEMA_PENDING)` — Garde-fou prêt et armé pour rejeter toute table sans RLS dès la création des migrations en Gate 1.

---

### Contrôle C — Étanchéité architecturale télématique (Traccar / flespi)
- **Script :** `scripts/guardrails/check-telematics-imports.cjs`
- **Méthode :** Analyse statique interdisant aux modules métier (`apps/api/src`, `apps/web/src`, `packages/*`) d'importer directement des types propriétaires ou SDK Traccar / flespi en dehors des adaptateurs autorisés (`telematics/adapters/*`).
- **Commande exécutée :** `node scripts/guardrails/check-telematics-imports.cjs`
- **Résultat réel :**
  ```
  [GUARDRAIL] Vérification de l'étanchéité architecturale télématique (Traccar / flespi)...
  ✓ Étanchéité télématique validée : Aucun import propriétaire Traccar/flespi dans le domaine métier.
  ```
- **Statut :** `PASS`

---

### Contrôle D — Détection des littéraux métier suspects en dur
- **Script :** `scripts/guardrails/check-hardcoded-literals.cjs`
- **Méthode :** Détection de constantes économiques, fiscales (TVA 19%/9%), seuils suspects (180 000 DA, 3 000 000 DA) hardcodés dans le code applicatif au lieu des configurations tenant/pack. Mode initial en avertissement (`WARNING`) pour ne pas bloquer les développements légitimes en cours.
- **Commande exécutée :** `node scripts/guardrails/check-hardcoded-literals.cjs`
- **Résultat réel :**
  ```
  [GUARDRAIL] Détection des littéraux métier et économiques en dur...
  ✓ Contrôle des littéraux : Aucun seuil économique hardcodé suspect dans le code métier.
  ```
- **Statut :** `PASS` (0 violation détectée à ce stade)

---

### Contrôle E — Audit de sécurité des dépendances & Génération SBOM
- **Script :** `scripts/guardrails/audit-sbom.cjs`
- **Méthode :** Génération d'un inventaire normalisé des composants logiciels au format CycloneDX-lite (`docs/sbom.json`), suivie d'un audit des dépendances via `pnpm audit --json`.
- **Commande exécutée :** `node scripts/guardrails/audit-sbom.cjs`
- **Résultat réel :**
  - Fichier généré : `docs/sbom.json`
  - Vulnérabilités détectées par `pnpm audit` :
    - `critical` : 0
    - `high` : 12 (liées aux dépendances transitives @nestjs/cli -> webpack -> postcss et @nestjs/platform-express -> multer)
    - `moderate` : 13 (qs, postcss)
    - `low` : 5 (multer)
  - **Constat :** Conformément à la règle 3 de la mission interdisant toute modification de dépendances de production sans arbitrage, ces vulnérabilités transitives sont signalées en avertissement sans interrompre la CI.
  - **Plan de résorption proposé au fondateur :** Configurer `pnpm.overrides` dans `package.json` pour forcer `qs >= 6.16.0`, `multer >= 2.3.0` et `postcss >= 8.5.23` lors d'un ticket dédié d'infrastructure.
- **Statut :** `PASS (WITH WARNINGS)`

---

### Contrôle F — Suite complète orchestrée (`pnpm verify`)
- **Script :** `scripts/guardrails/verify-all.cjs` et pipeline GitHub Actions `.github/workflows/ci.yml`.
- **Enchaînement :** Secrets → RLS → Télématique → Littéraux → Audit & SBOM → Turbo Lint → Turbo Typecheck → Turbo Test.
- **Commande exécutée :** `pnpm verify`
- **Résultat global :**
  - Tous les 8 modules exécutés avec succès (code de retour `0`).
  - Tests unitaires API : 3/3 passed.
  - Typecheck TS : 4/4 packages passed.
  - Lint : 2/2 packages passed.
- **Statut :** `PASS`
