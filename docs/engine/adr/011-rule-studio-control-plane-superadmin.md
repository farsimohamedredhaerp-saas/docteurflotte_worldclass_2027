# ADR-011 — Rule Studio : Control Plane SuperAdmin pour l'Édition, la Validation & la Signature des Packs Réglementaires

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Application `apps/rule-studio` (Vite + React 19 + TypeScript), Intégration `@docteurflotte/decision-engine`, Tests `apps/rule-studio/test/rule-studio.spec.ts`  

---

## 1. Contexte & Enjeux

Le moteur décisionnel universel algérien repose sur une séparation stricte entre le **Control Plane** (conception, vérification, publication et scellement cryptographique des packs réglementaires) et le **Data Plane** (consommation en production par les entreprises clientes pour la tenue du grand livre et le contrôle fiscal/comptable).

Pour permettre aux juristes fiscalistes, experts-comptables et ingénieurs de concevoir et certifier les packs réglementaires (LF 2025, LF 2026, PLF 2027) sans toucher au code source applicatif, une interface SuperAdmin de classe mondiale est requise.

### Exigences Critiques :
1. **Zéro Hardcode & Ontologie Stricte (Règle 1) :** Les règles et paramètres sont gérés comme des entités de données structurées et typées, conformément aux schémas AST et ontologiques de `@docteurflotte/decision-engine`.
2. **Gouvernance Suspensive des Paramètres Non Vérifiés (Règle 10) :** Tout paramètre ou règle dont la valeur n'est pas étayée par un texte officiel (JORADP, circulaire ministérielle) est marqué `UNVERIFIED`. **Aucun pack contenant un élément `UNVERIFIED` ne peut être approuvé ni publié.**
3. **Workflow à 4 Yeux (Maker-Checker) :** L'auteur d'une règle ou d'un pack ne peut en aucun cas approuver ou publier son propre travail.
4. **Signature Cryptographique Ed25519 :** La publication d'un pack scelle son empreinte canonique (RFC 8785) via une clé Ed25519 opposable.
5. **Ergonomie Clavier & Haute Densité :** Navigation ultra-rapide par palette de commandes `⌘K` / `Ctrl+K`, bac à sable de simulation en temps réel et journal d'audit immuable.

---

## 2. Architecture de l'Application `apps/rule-studio`

L'application est structurée en 7 cockpits d'exploitation spécialisés, pilotés par un état applicatif réactif et typé :

```
apps/rule-studio/
├── src/
│   ├── types/
│   │   └── studio.ts               # Modèles Studio (rôles RBAC, onglets, état global)
│   ├── data/
│   │   └── initial-packs.ts        # Référentiel initial (LF 2025, LF 2026, PLF 2027 DRAFT)
│   ├── components/
│   │   ├── Navbar.tsx              # En-tête avec sélecteur de rôle et badge UNVERIFIED
│   │   ├── CommandStrip.tsx        # Barre d'onglets haute densité pour les 7 cockpits
│   │   ├── CommandPalette.tsx      # Palette de commandes modale (⌘K / Ctrl+K)
│   │   └── Tabs/
│   │       ├── PacksDiffTab.tsx          # 1. Catalogue et comparateur bi-temporel "Ce qui change"
│   │       ├── RuleEditorTab.tsx         # 2. Éditeur AST JSON & arbre visuel avec validation
│   │       ├── SandboxTab.tsx            # 3. Bac à sable d'évaluation sur entrées personnalisées
│   │       ├── ParametersMatrixTab.tsx   # 4. Matrice globale des paramètres et preuves
│   │       ├── UnverifiedGateTab.tsx     # 5. Porte suspensive de levée des verrous UNVERIFIED
│   │       ├── ApprovalWorkflowTab.tsx   # 6. Workflow Maker-Checker à 4 yeux & signature Ed25519
│   │       └── AuditTrailTab.tsx         # 7. Journal d'audit immuable des actions
│   ├── App.tsx                     # Orchestrateur réactif principal
│   ├── main.tsx                    # Point d'entrée React 19
│   └── index.css                   # Styles haute densité (palette sombre/ardoise pro)
└── test/
    └── rule-studio.spec.ts         # Suite Vitest (4 tests de certification de gouvernance)
```

---

## 3. Décisions Clés de Conception

### 3.1 Rôles RBAC Spécialisés
Quatre rôles opérationnels étanches gouvernent le cycle de vie des packs :
- `AUTEUR` : Rédaction de règles AST, saisie de paramètres, simulations dans le bac à sable. Ne peut ni approuver ni lever les verrous de publication.
- `RELECTEUR` : Revue contradictoire des règles, inspection des différences bi-temporelles, levée des verrous sur documentation probante.
- `EXPERT_VALIDATEUR` : Autorité réglementaire habilitée à certifier les références JORADP et valider formellement la conformité fiscale/comptable.
- `PUBLIEUR` : Signature cryptographique Ed25519 et passage officiel du pack en statut `PUBLISHED`.

### 3.2 La Porte Suspensive `UNVERIFIED_GATE` (Règle 10)
Un pack en statut `DRAFT` (tel que le PLF 2027) peut contenir des hypothèses de travail étiquetées `UNVERIFIED`.
- Le système calcule en temps réel le nombre d'éléments non vérifiés.
- Si le compteur est supérieur à zéro, le bouton de transition vers `APPROVED` ou `PUBLISHED` est **invalide et désactivé**, avec un message d'erreur d'intégrité explicite.
- Seul un `EXPERT_VALIDATEUR` ou un `RELECTEUR` peut lever le verrou d'un élément, en fournissant obligatoirement :
  * Le numéro officiel du JORADP ou de la circulaire ministérielle.
  * La date de parution au journal officiel.
  * L'extrait textuel de l'article de loi.
- Dès la levée de tous les verrous, le pack devient éligible à la revue finale.

### 3.3 Bac à Sable d'Évaluation & Validation AST
Le bac à sable (`SandboxTab`) instancie l'interpréteur AST déterministe (`evaluateAst`) et le validateur de sécurité (`AstStaticValidator`) :
- Vérification statique de la conformité du schéma (JSON Schema Draft-07, profondeur maximale $\le 10$, opérations $\le 100$).
- Évaluation isolée sans effets de bord.
- Restitution d'une trace d'exécution exhaustive : chemin des variables lues, résultat typé, durée d'évaluation en microsecondes.

### 3.4 Résolution ESM & Alias Monorepo Vite
Pour assurer une réactivité instantanée en développement sans friction CommonJS/ESM :
- Configuration d'un alias Vite (`resolve.alias`) ciblant directement les sources TypeScript `packages/decision-engine/src`.
- Compilation de production Rollup optimisée sans dégradation de performance.

---

## 4. Résultats & Validation

1. **Compilation de Production :** `pnpm --filter @docteurflotte/rule-studio build` génère le bundle complet en 15.00s avec 0 erreur.
2. **Tests Automatisés :** `test/rule-studio.spec.ts` valide avec succès :
   - Le blocage suspensif immédiat en présence d'items non vérifiés.
   - La levée de verrou conforme avec attribution d'une preuve JORADP.
   - L'interdiction stricte d'auto-approbation (Maker-Checker).
   - L'exécution fidèle du bac à sable AST.
3. **Contrôle Global du Monorepo :**
   - `pnpm lint:hardcode` : 0 violation.
   - `pnpm -w typecheck` : 7/7 tâches réussies sur l'ensemble des 5 packages.
   - `@docteurflotte/decision-engine` : 125/125 tests unitaires verts.

