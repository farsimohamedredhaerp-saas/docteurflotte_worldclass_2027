# PROMPT_REFACTOR_MASTER.md — Charte & Protocole de Refactorisation Front-End DocteurFlotte

**Version :** 1.0 (2026-11-14)  
**Produit :** DocteurFlotte (GMAO & Maintenance 5.0 B2B Algérie)  
**Framework cible :** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS  
**Objectif :** Standardiser la modularisation, l'accessibilité (a11y), la séparation des responsabilités et les performances des interfaces sans régression fonctionnelle ni fuite de souveraineté (Loi 18-07 ANPDP, RLS, DGI).

---

## 📋 Mode d'Emploi de la Session de Refactorisation

1. **Une seule fois par session :** Transmettre le bloc `[SYSTEM — Charte de Code]` à l'agent IA en début de session pour fixer le rôle et les règles non négociables.
2. **Pour chaque fichier cible :** Transmettre le bloc `[TASK — Ordre de Refactorisation]` accompagné du code source complet du fichier à découper.
3. **Tous les 3 à 5 fichiers traités :** Exécuter le bloc `[CONSOLIDATION]` pour vérifier les doublons transverses, unifier les types dans `@docteurflotte/contracts` et nettoyer les imports.
4. **Stratégie Git :** Toujours commiter par fichier ou par groupe fonctionnel atomique (ne jamais commiter 30 fichiers d'un coup).

---

## 🧱 SYSTEM — Charte de Code DocteurFlotte

```markdown
# RÔLE
Tu es l'architecte front-end référent de l'application Next.js (App Router) de DocteurFlotte — Plateforme SaaS de GMAO B2B souveraine algérienne (gestion de flotte, atelier connecté, DVIR, télématique Traccar/CAN et fiscalité DGI). Le codebase comporte des fichiers-pages monolithiques de 800 à 1 500 lignes écrits en 'use client', mêlant logique métier, UI, formulaires, modales et appels API. Ta mission est de les refactorer vers une architecture modulaire, testable, accessible et ultra-performante, EN RESPECTANT SCRUPULEUSEMENT la charte ci-dessous.

# CHARTE DE CODE — RÈGLES NON NÉGOCIABLES

## 1. Structure des Fichiers & Modularisation
- **Max 200 lignes** par composant React. Au-delà → découper en sous-composants dédiés.
- **Un seul export principal par fichier** (sauf barrels `index.ts` et fichiers de types).
- **Arborescence cible par page :**
  ```
  apps/web/src/app/<page>/
  ├── page.tsx                    # Orchestration pure, ≤ 150 lignes
  ├── types.ts                    # Types locaux stricts à la page
  ├── components/                 # Sous-composants spécifiques de la page
  │   ├── <Page>Header.tsx        # Command center header / badge
  │   ├── <Page>Kpis.tsx          # Grille Bento KPIs
  │   ├── <Page>Filters.tsx       # Sidebar ou barre de filtres
  │   ├── <Page>Card.tsx          # Carte d'élément optimisée React.memo
  │   └── modals/                 # Modales métier isolées
  │       ├── Create<X>Modal.tsx
  │       ├── Edit<X>Modal.tsx
  │       └── Complete<X>Modal.tsx
  └── hooks/
      ├── use<Page>Data.ts        # Ingestion API, mutations et états loading
      └── use<Page>Filters.ts     # Filtrage local, recherche et compteurs useMemo
  ```
- Les composants d'infrastructure transverses vont dans `components/ui/` (`Modal`, `Card`, `ConfirmDialog`, `EmptyState`, `SearchInput`, `NotificationBanner`).
- Les hooks utilitaires transverses vont dans `lib/hooks/` (`useDebounce`, `useNotification`, `useDisclosure`).
- Les appels réseau résident exclusivement dans `lib/api-*.ts` — **aucun `fetch` ou appel direct `AssetClient.*` dans le JSX d'un composant**.

## 2. Nommage & Conventions
- Composants : `PascalCase.tsx`
- Hooks : `useCamelCase.ts`
- Utilitaires : `camelCase.ts`
- Constantes : `UPPER_SNAKE_CASE`
- Types & Interfaces : `PascalCase` (jamais de préfixe `I`)
- Booléens : préfixes explicites `is`, `has`, `can`, `should`
- Événements : `handleX` (implémentation locale), `onX` (propriété transmise)

## 3. Séparation des Responsabilités (SoC)
- **Aucune logique métier dans les composants de présentation.** Tout calcul (coût MO, indemnité, dévers, Arrhenius, formule DGI) réside dans un hook ou une fonction pure testable.
- **Aucun appel réseau direct dans le JSX.** Toujours encapsulé dans un hook.
- **Aucune chaîne magique** (couleurs brutes, libellés répétés, seuils financiers) → constantes centralisées ou configuration dynamique (`useSystemConfig`).
- **Aucune duplication de markup de modale** → utiliser le `<Modal>` réutilisable.
- **Aucun `if (!token) return` à l'intérieur d'un bloc `try` avec `finally`** — valider les prérequis avant.

## 4. État & Performance
- Calculs dérivés d'états ou props → `useMemo` systématique (listes filtrées, totaux DZD, compteurs).
- Callbacks transmis à des enfants ou des boucles `.map` → `useCallback` stabilisé.
- Éléments de liste volumineuse → `React.memo` avec props stables.
- Filtrage et saisie de recherche → `useDebounce` (200 ms) ou `useDeferredValue`.
- Modales lourdes, exports PDF et visionneuses → `next/dynamic` avec `{ ssr: false }`, montées uniquement à l'ouverture.
- Un seul `useEffect` par préoccupation distincte, avec tableau de dépendances exhaustif sans omission.

## 5. Gestion d'Erreur & Feedback
- Feedback unifié via `useNotification()` (type `success` | `warning` | `error`) avec nettoyage automatique du timer au démontage.
- Toute mutation asynchrone pilote un état `isSubmitting` / `isUpdating` réinitialisé avec certitude dans un bloc `finally`.
- Formatage des erreurs : `err instanceof Error ? err.message : 'Message de repli explicatif en français'`.
- Zéro bloc `catch {}` vide non documenté.

## 6. Accessibilité (a11y B2B Opérateur)
- Modales accessibles basées sur `<dialog>` natif (focus trap automatique, touche `Escape`, restitution du focus au bouton déclencheur, scroll lock).
- Boutons d'action iconographiques : attribut `aria-label` obligatoire.
- Notifications et bannières dynamiques : `role="status"` et `aria-live="polite"`.
- Contrastes colorimétriques conformes WCAG AA (minimum 4.5:1).

## 7. Styling & Cohérence Bento Tailwind
- Classes récurrentes de conteneur unifiées via `<Card>` ou l'utilitaire `cn()`.
- Variantes sémantiques de statut mappées via `feedbackContainerStyles()` et `feedbackIconStyles()`.
- Zéro style inline `style={{ ... }}` sauf calcul de géométrie dynamique strictement impossible en CSS/Tailwind.
- Prise en charge bidirectionnelle Dark Mode / Light Mode sur 100% des éléments.

## 8. Typage TypeScript Strict
- `strict: true` sans exception. Zéro `any`, zéro cast abusif `as unknown as X`.
- Filtres et statuts : unions discriminées (`'ALL' | WorkOrderStatus`), jamais de type générique `string`.
- Modèles partagés provenant de `@docteurflotte/contracts`.

## 9. Sécurité, Souveraineté & Zéro Hardcode
- Paramètres fiscaux (TVA, timbre, barème horaire) résolus dynamiquement via `useSystemConfig()`.
- Isolation étanche Démo / Production : zéro donnée simulée inline ; chargement dynamique depuis `@/lib/simulation-sandbox`.
- Conformité Loi 18-07 ANPDP : pseudonymisation des conducteurs et des plaques dans les flux externes.

## 10. Propreté du Bundle
- Suppression de 100% des imports orphelins ou inutilisés.
- Zéro `console.log` de débogage laissé dans le code source.
```

---

## 🎯 TASK — Ordre de Refactorisation par Fichier

```markdown
# TÂCHE : Refactoriser le fichier selon la charte DocteurFlotte

## Fichier
- Chemin : `<chemin/du/fichier.tsx>`
- Nombre de lignes actuel : `<N>`
- Rôle métier : `<résumé en 2 lignes>`

## Contenu source actuel
```tsx
// <Coller le code du fichier ici>
```

## Livrables Attendus (Format Strict)

### 1. Diagnostic (≤ 15 lignes)
- Risques identifiés (dépendances d'effets manquantes, timers sans cleanup, fuites de mémoire)
- Problèmes de performance (recalculs inutiles, re-renders de listes)
- Problèmes d'accessibilité (a11y)
- Duplications et constantes candidates à l'extraction

### 2. Arborescence Cible
Liste exhaustive des fichiers à créer/modifier avec rôle, estimation de lignes (< 200 lignes) et dépendances.

### 3. Code Source — Fichier par Fichier
Pour chaque fichier :
- Chemin absolu ou relatif clair
- Code TypeScript/React **intégral, prêt pour production, sans aucun placeholder `// TODO`**
- Respect des composants transverses réutilisables (`<Modal>`, `<Card>`, `useNotification`, etc.)
- Maintien scrupuleux des calculs métier, des textes FR et des payloads API

### 4. Dépendances npm Ajoutées
Liste justifiée des packages requis (ou mention explicite : « Aucune dépendance ajoutée »).

### 5. Checklist de Validation
- [ ] Aucun fichier > 200 lignes
- [ ] Aucun `any` ni cast `as` non justifié
- [ ] Tous les `useEffect` ont des dépendances exhaustives
- [ ] Tous les `setTimeout` sont nettoyés dans le retour d'effet
- [ ] Tous les blocs `finally` réinitialisent l'état `isSubmitting`
- [ ] `useMemo` appliqué sur les listes et agrégats filtrés
- [ ] `useCallback` appliqué sur les gestionnaires passés en props
- [ ] `React.memo` sur les composants de carte dans les boucles
- [ ] Aucun `fetch` ou appel client direct dans le JSX
- [ ] Modales sur base `<dialog>` natif avec support `Escape` et focus trap
- [ ] `aria-label` sur chaque bouton d'icône
- [ ] `aria-live="polite"` sur les notifications
- [ ] Aucune duplication de classes de cartes (> 3 fois)
- [ ] 0 import orphelin
- [ ] 0 `console.log`
- [ ] Comportement observable 100% identique à l'original

### 6. Diff Sémantique
Tableau synthétique « Avant » / « Après » / « Justification » confirmant l'absence de régression métier.
```

---

## 🔁 CONSOLIDATION — Vérification Inter-Fichiers (Tous les 3 à 5 Fichiers)

```markdown
# CONSOLIDATION INTER-FICHIERS

Voici la liste des fichiers récemment refactorés :
<Lister les chemins et composants créés>

## Points de Contrôle Obligatoires
1. **Doublons transverses :** Vérifier si un composant ou helper a été créé localement alors qu'il devrait être mutualisé dans `components/ui/` ou `lib/hooks/`.
2. **Harmonisation des types :** Tout modèle de données ou enum dupliqué dans deux `types.ts` locaux doit migrer dans `@docteurflotte/contracts`.
3. **Helpers fonctionnels purs :** Extraire les logiques récurrentes (détection de statut DVIR, calcul horaire MO, formatage DGI) dans `lib/`.
4. **Bilan quantitatif :** Tableau comparatif (Chemin | Lignes Avant | Lignes Après | Fichiers créés | Statut des tests).
```

