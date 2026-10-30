# Directives Locales — Contrats & Types Partagés (`packages/contracts`)

**Rôle :** Définitions TypeScript canoniques, DTOs partagés, interfaces et énumérations communes.

## Règles d'Implémentation
1. **Zéro Effet de Bord Runtime :** Ce package ne doit contenir que des types, interfaces, énumérations et schémas purs. Aucune dépendance lourde d'infrastructure ou de framework (Nest/Next) n'est autorisée.
2. **Immutabilité des Contrats Publics :** Les structures de données publiées sont versionnées. Ne pas renommer ou supprimer un champ sans prévoir de rétro-compatibilité.
3. **Compilation Stricte :** Le package compile via `tsc` dans `dist/`. La vérification `pnpm typecheck` doit toujours valider ce package en premier.
4. **Cohérence du Domaine :** Les énumérations métier (`AssetCategory`, `MeterType`, `DataOrigin`) reflètent strictement les définitions du contrat maître.
