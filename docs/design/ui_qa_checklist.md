# Checklist Pré-Merge UI & Assurance Qualité Design System (v5.0)

> **Référence :** Plan Directeur v5.0 — Système UI/Design de Classe Mondiale  
> **Champ d'application :** Toute Pull Request ou modification touchant aux composants, pages, styles ou flux visuels du monorepo DocteurFlotte.

---

## 1. Garde-Fous Non Négociables (Checklist Pré-Merge)

Chaque contributeur UI et chaque reviewer doit valider point par point cette checklist avant tout merge :

- [ ] **1. Zéro couleur brute (#hex) :**  
  `git diff` ne contient aucune couleur hexadécimale en dur (`#2563EB`, `#10B981`, `#000`, etc.) hors du fichier source `/tokens/tokens.json`. Tout passe par `var(--df-*)` ou les classes sémantiques Tailwind.
- [ ] **2. Échelle de rayons respectée :**  
  Aucune classe `rounded-2xl` (16px) ou `rounded` arbitraire. Seule l'échelle officielle est tolérée : `xs` (4px), `sm` (6px), `md` (8px), `lg` (10px), `xl` (14px), `full`.
- [ ] **3. Chiffres dynamiques en `tabular-nums` :**  
  Tout odomètre, compteur de véhicules, latence p95, pourcentage et montant en Dinars Algériens (DZD) utilise la police monospace avec `tabular-nums` obligatoire (zéro tressautement d'interface).
- [ ] **4. Traitement financier institutionnel du DZD :**  
  Le symbole `DZD` ou `DA` est affiché en indice textuel plus petit et feutré (`text-xs text-slate-500 font-mono`), jamais en chaîne brute collée au chiffre.
- [ ] **5. Les 4 états systémiques gérés :**  
  Le composant ou l'écran gère explicitement les 4 états : **Empty State** (avec visuel filigrane et CTA d'onboarding), **Loading** (skeleton sans CLS), **Error** (message clair et action de récupération), **Success** (toast discret ou confirmation DZD).
- [ ] **6. Navigation clavier & Focus Ring visible :**  
  L'écran est navigable à 100 % au clavier (Tab / Shift+Tab). Le focus ring cobalt chirurgical (`outline: 2px solid var(--df-brand-primary); outline-offset: 2px;`) est franc et visible. Escape ferme les modales et contextes.
- [ ] **7. Accessibilité & Contrastes WCAG 2.2 AA+ :**  
  Contraste texte $\ge 4.5:1$ sur texte normal, $\ge 3:1$ sur texte large et composants UI. Règle daltonisme respectée : aucun statut n'est encodé par la couleur seule (toujours Couleur + Icône + Libellé).
- [ ] **8. Respect strict de `prefers-reduced-motion` :**  
  Toutes les animations et transitions se réduisent à `0.01ms` lorsque la préférence d'accessibilité est active.
- [ ] **9. Compatibilité RTL Arabe :**  
  L'inversion structurelle via `dir="rtl"` et propriétés logiques CSS (`margin-inline-start`, `inset-inline-start`) ne produit aucun débordement de texte. Les icônes directionnelles (chevrons, flèches) sont inversées via `scaleX(-1)`.
- [ ] **10. Zéro `!important` en production :**  
  Aucune règle `!important` n'est introduite dans le CSS de production (hors surcharges obligatoires de librairies cartographiques tierces).

---

## 2. Commandes de Validation Locale Automatisée

Avant de soumettre la PR, exécuter la chaîne de vérification locale :

```powershell
# 1. Vérification TypeScript stricte
pnpm --filter @docteurflotte/contracts build
pnpm --filter @docteurflotte/web typecheck

# 2. Suites de tests automatisés UI
pnpm --filter @docteurflotte/web test

# 3. Contrôle des garde-fous souveraineté & zéro hardcode
node scripts/guardrails/check-hardcoded-rates.cjs
node scripts/guardrails/lint-zero-hardcode-ui.cjs
node scripts/guardrails/check-anpdp-exports.cjs
```
