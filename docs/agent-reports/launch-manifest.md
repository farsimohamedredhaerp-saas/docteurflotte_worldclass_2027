# Launch Manifest — Refonte Esthétique Télématique de Rang Mondial (Samsara x Flespi)

**Date :** 2026-10-24  
**Objectif :** Implémenter une identité visuelle et un design system de télématique de classe mondiale inspiré des plateformes de référence (**Samsara Connected Operations Cloud** et **Flespi Telematics Cloud**), offrant un rendu d'exception tant en **Mode Sombre** qu'en **Mode Clair**, tout en préservant l'étanchéité multi-tenant RLS et la dynamique temps réel.

---

## 1. Référence & Principes de Design

- **Référence Mondiale Télématique :**
  - **Samsara Connected Operations :** Ergonomie industrielle haute lisibilité, hiérarchie visuelle sans encombrement, cartes d'opérations denses mais aérées, contrastes nets de niveau aérospatial.
  - **Flespi Telematics Console :** Précision métrologique, chiffres tabulaires monospace (`JetBrains Mono`), indicateurs d'état pulsants (Ignition, GPS fix, télémétrie active), jauges d'usure et compteurs sans ambiguïté.
- **Bi-Thématisme Parfait :**
  - **Dark Mode ("Mission Control") :** Noir graphite profond (`#090D16`), cartes vitrées `rgba(17, 26, 46, 0.75)`, accents néon cyan `#06B6D4` et cobalt `#1D64EC`, bordures techniques fines `rgba(255, 255, 255, 0.08)`.
  - **Light Mode ("Daylight Dispatch") :** Fond ardoise alpine ultra-propre (`#F8FAFC`), cartes blanc pur (`#FFFFFF`) avec ombrages multicouches subtils, typographie ardoise dense (`#0F172A`) sans éblouissement, contrastes WCAG AAA.
  - **Micro-grille télématique :** Trame discrète de repérage GPS en arrière-plan.

---

## 2. Découpage en Sous-Agents Spécialisés

### Agent 1 : `telemetry-tokens-architect`
- **Fichiers cibles :** `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`.
- **Livrables :**
  - Import Google Fonts (`Inter` + `JetBrains Mono`).
  - Système complet de variables CSS (couleurs, ombres, jauges, badges, gradients, trame télématique).
  - Classes utilitaires pour les jauges de maintenance, badges de pulsation télématique (Ignition ON, GPS Lock, En Mouvement, À l'arrêt, Hors-ligne).

### Agent 2 : `telemetry-dashboard-redesigner`
- **Fichiers cibles :**
  - `apps/web/src/components/navigation/Navbar.tsx` (barre d'opérations télématique avec statut Traccar live).
  - `apps/web/src/components/MetricCard.tsx` (carte métrologique avec jauge et typographie tabulaire).
  - `apps/web/src/components/DecisionCard.tsx` (carte d'arbitrage décisionnel avec indicateurs de risque et télémétrie).
  - `apps/web/src/app/page.tsx` (dashboard d'opérations connectées avec barre de flux live, grille de métriques, arbitrages décisionnels interactifs).
  - `apps/web/src/app/assets/page.tsx` (inventaire d'actifs avec statut télématique, jauges d'entretien préventif).

### Agent 3 : `telemetry-ui-verifier`
- **Livrables :**
  - Contrôle TypeScript strict (`pnpm --filter @docteurflotte/web typecheck`).
  - Vérification des requêtes HTTP (200 OK sur `/`, `/assets`, `/work-orders`, `/settings`).
  - Vérification visuelle et contrastes Dark / Light.

### Agent 4 : `reviewer-audit-design`
- **Livrables :**
  - Audit indépendant selon `docs/agent-roles/reviewer.md` et `web-design-guidelines`.

---

## 3. Critères de Validation & Preuves Exigées
- [ ] Aucun composant ni valeur codée en dur (les métriques respectent la devise et le pack du tenant).
- [ ] `pnpm --filter @docteurflotte/web typecheck` réussit sans aucune erreur.
- [ ] Le switch mode sombre / mode clair bascule instantanément sans flash ni perte de contraste.
- [ ] Rapport final certifié produit dans `docs/agent-reports/`.
