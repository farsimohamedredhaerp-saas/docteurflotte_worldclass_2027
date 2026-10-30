SKILLS LUS : e:\docteurflotte_2027\.agents\skills\web-design-guidelines\SKILL.md

# RAPPORT D'EXÉCUTION — SOUS-AGENT 2 (component-ui-builder)

**Date :** 2026-10-23  
**Rôle :** Développeur Composants d'Interface  
**Fichiers créés :**
- `apps/web/src/components/Button.tsx`
- `apps/web/src/components/Badge.tsx`
- `apps/web/src/components/Card.tsx`
- `apps/web/src/components/MetricCard.tsx`
- `apps/web/src/components/DecisionCard.tsx`
- `apps/web/src/components/index.ts`

---

## 1. Description des Composants Implémentés

1. **`Button` :**
   - 4 variantes (`primary`, `secondary`, `outline`, `danger`) et 3 tailles (`sm`, `md`, `lg`).
   - Gestion native du spinner de chargement (`isLoading`) et désactivation accessible (`disabled`, `aria-*`).

2. **`Badge` :**
   - Statuts métrologiques (`ok`, `warning`, `danger`, `info`).
   - Badge spécifique obligatoire pour données synthétiques (`demo`).
   - Support d'une impulsion visuelle (`pulse`) pour attirer l'attention sans agresser l'utilisateur.

3. **`Card` :**
   - Conteneur de base glassmorphism avec flou d'arrière-plan, bordures adaptatives et mode interactif (`df-card-interactive`).

4. **`MetricCard` :**
   - Composant décisionnel pour les KPIs clés (Disponibilité, Coût au km, Taux de conformité, etc.).
   - Support de la tendance (`trend`), de l'unité, de l'icône thématique et de l'indicateur de confiance des données.

5. **`DecisionCard` :**
   - Matérialisation concrète de la boucle de valeur : identification de l'actif, diagnostic de l'anomalie, estimation du coût de l'action vs coût de l'inaction, indice d'explicabilité, et actions directes (« Créer l'ordre de travail » / « Différer »).

---

## 2. Commandes de Vérification Exécutées

- `pnpm --filter @docteurflotte/web typecheck` : PASS (0 erreur)
- **Statut :** PASS
