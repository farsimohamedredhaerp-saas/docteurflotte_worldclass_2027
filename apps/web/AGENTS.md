# Directives Locales — Application Web (`apps/web`)

**Rôle :** Interface utilisateur Next.js 15 (App Router), React 19, responsive et accessible.

## Règles d'Implémentation
1. **App Router & Server/Client Components :**
   - Privilégier les Server Components par défaut pour le chargement des données.
   - Utiliser `'use client'` uniquement pour les composants interactifs nécessitant des hooks d'état ou d'effets (ex: formulaires, panneaux dynamiques).
2. **Tokens de Design & Ergonomie :**
   - Utiliser les variables CSS définies dans `globals.css` (thème sombre soigné, contrastes WCAG conformes).
   - Pas de styles ad-hoc désordonnés ; respecter la hiérarchie visuelle et la clarté opérationnelle.
3. **Zéro Donnée Masquée ou Fictive Fausse :**
   - Tout affichage de données synthétiques doit porter l'étiquette visible `DEMO`.
   - Ne jamais présenter un résultat simulé comme une économie réelle validée.
4. **Gestion des États Réseau :**
   - Gérer systématiquement les 3 états : chargement (`loading`), erreur lisible (`error`), et succès (`content`).
   - Tolérance aux indisponibilités temporaires de l'API avec bouton de réessai explicite.
