# REFACTOR_KIT_CHANGELOG.md — Certification & Journal des Versions du Kit Transverse

> **Statut :** CERTIFIÉ ET GELÉ (Porte 0 Validée)  
> **Date de certification :** 2026-11-14  
> **Référent Architectural / Propriétaire Unique :** Architecte Principal Front-End DocteurFlotte  
> **Garantie de non-régression :** Toute modification ultérieure de ce kit exige une PR dédiée et l'exécution complète de 100% des tests de toutes les pages déjà migrées.

---

## 📋 Spécifications & Évolutions Majeures Validées

| Module | Version | Évolutions Validées | Tests Associés |
|---|:---:|---|---|
| **`cn.ts`** | `v1.0.0` | Support multi-types sans dépendance externe npm : chaînes, nombres, tableaux imbriqués, objets conditionnels `{ 'bg-red-500': isError }`, et valeurs falsy filtrées. | `src/tests/ui-kit/cn.spec.ts` |
| **`useDebounce.ts`** | `v1.1.0` | Temporisation générique `useDebounce<T>(value, delayMs = 200)`. Support des overrides documentés : `200ms` (recherche locale), `400ms` (OCR Naftal), `300ms` (recherche 58 Wilayas). Nettoyage du timer sur démontage. | `src/tests/ui-kit/useDebounce.spec.ts` |
| **`useDisclosure.ts`** | `v1.0.0` | Gestion d'états d'ouverture/fermeture : `isOpen`, `onOpen`, `onClose`, `onToggle`, `setIsOpen`. Callbacks stabilisés avec `useCallback`. | `src/tests/ui-kit/useDisclosure.spec.ts` |
| **`useNotification.ts`** | `v1.1.0` | Gestion unifiée des notifications d'action : `success`, `warning`, `error`, `info`. Auto-dismiss par timer paramétrable, nettoyage `clearTimeout` garanti sur démontage. | `src/tests/ui-kit/useNotification.spec.ts` |
| **`feedbackStyles.ts`** | `v1.1.0` | Prise en charge des 5 variantes (`success`, `warning`, `error`, `info`, `neutral`). Contraste WCAG AA vérifié sur fond clair (#F8FAFC) et sombre (#090D16). | `src/tests/ui-kit/feedbackStyles.spec.ts` |
| **`Modal.tsx`** | `v1.0.0` | Basé sur la balise native HTML5 `<dialog>`. Focus-trapping natif, gestion automatique de la touche `Escape`, restitution du focus, fermeture sur clic backdrop, scroll-lock, bouton `X` avec `aria-label`. | `src/tests/ui-kit/Modal.spec.tsx` |
| **`Card.tsx`** | `v1.1.0` | Extension modulaire Bento : 6 variantes (`default`, `elevated`, `glass`, `subtle`, `warning`, `danger`), 4 niveaux de padding, et 5 sous-composants intégrés (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). | `src/tests/ui-kit/Card.spec.tsx` |
| **`ConfirmDialog.tsx`** | `v1.0.0` | Dialogue de confirmation d'action critique avec état de chargement `isSubmitting` / `Loader2`, variante `danger` / `warning` / `info`, et annulation sécurisée. | `src/tests/ui-kit/ConfirmDialog.spec.tsx` |
| **`EmptyState.tsx`** | `v1.0.0` | Écran de repli pour listes ou recherches vides, icône personnalisable, description WCAG AA et bouton d'action contextuel. | `src/tests/ui-kit/EmptyState.spec.tsx` |
| **`SearchInput.tsx`** | `v1.1.0` | Champ accessible avec loupe, bouton d'effacement rapide `X`, et écouteur de raccourci clavier global configurable (`shortcutKey="/"`) actif uniquement hors champs de saisie. | `src/tests/ui-kit/SearchInput.spec.tsx` |
| **`NotificationBanner.tsx`** | `v1.1.0` | Bannière accessible avec `role="status"` et `aria-live="polite"`. Mappage dynamique des 4 icônes et bouton de fermeture. | `src/tests/ui-kit/NotificationBanner.spec.tsx` |
| **`index.ts`** | `v1.0.0` | Barrel export unique permettant `@/components/ui`. | Importation validée |

---

## 🔒 Protocole de Gel du Kit

1. **Règle d'Immutabilité :** Aucun développeur ou agent IA ne peut modifier directement les fichiers de `@/components/ui/` ou `@/lib/hooks/` lors d'un lot de refactor applicatif (Lots 1 à 5).
2. **Procédure d'Évolution :** Si un besoin d'extension émerge :
   - Ouvrir une branche isolée `feat/ui-kit-<nom>`.
   - Mettre à jour les tests unitaires associés dans `src/tests/ui-kit/`.
   - Exécuter la suite complète de vérification `node scripts/guardrails/verify-all.cjs`.
   - Enregistrer la version dans ce journal.

