# ADR-003 — Moteur AST Déterministe : Grammaire Typée, Budgets, Sécurité Anti-Pollution & Compilateur en Closures JS

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Package `packages/decision-engine`, Modules `src/ast/`  

---

## 1. Contexte & Enjeux

Dans l'architecture à deux plans de DocteurFlotte / DzERP, les règles de contrôle comptable, d'arbitrage fiscal (Lois de Finances) et de scoring d'audit ne sont pas codées en dur dans l'application. Elles sont formalisées sous forme d'arbres syntaxiques abstraits (**AST**) portés par les packs réglementaires signés.

Le moteur d'évaluation de cet AST doit concilier des exigences critiques :
1. **Sécurité d'exécution absolue :** Rejet impératif de toute exécution de code dynamique (`eval()`, `new Function()`), protection contre les attaques par pollution de prototype (`__proto__`, `constructor`), et immunité contre les dénis de service (boucles infinies, récursions profondes).
2. **Déterminisme & Précision mathématique :** Tous les calculs de montants, taux et seuils doivent s'opérer via `decimal.js` avec la clause `DIV` sécurisée (`on_zero: ERROR | ZERO | NULL`) et l'arrondi bancaire officiel `ROUND_HALF_UP`.
3. **Double mode d'évaluation (Explicabilité vs Débit) :**
   - Un **Interprète pur** capable de tracer chaque nœud exécuté (entrées, paramètres lus, référence légale) pour l'audit et le contentieux.
   - Un **Compilateur en closures JS natives** capable de traiter des millions d'écritures ou de simulations en quelques secondes.

---

## 2. Décisions Architecturales Majeures

### 2.1 Grammaire Typée et Types de Données
L'AST prend en charge 5 types primitifs et structurés :
- `DEC` : Nombre décimal à précision arbitraire manipulé via `EngineDecimal`.
- `STR` : Chaîne de caractères UTF-8.
- `BOOL` : Booléen (`true` / `false`).
- `DATE` : Date locale algérienne `YYYY-MM-DD` (`Africa/Algiers`).
- `LIST` : Collection d'éléments typés pour les opérations d'agrégation.

### 2.2 Budgets Stricts d'Exécution & Validation Statique
Avant toute exécution, un validateur statique (`AstValidator.validate`) inspecte la structure de l'arbre et applique les plafonds stricts :
- **Profondeur maximale (`MAX_DEPTH`) :** 32 niveaux.
- **Nombre maximal de nœuds (`MAX_NODES`) :** 2 000 nœuds par règle.
- **Budget maximal d'opérations (`MAX_OPERATIONS`) :** 100 000 opérations par évaluation.
- **Clause `DIV` obligatoire :** Tout nœud de division doit spécifier explicitement son comportement sur division par zéro (`on_zero`).

### 2.3 Protection Anti-Pollution de Prototype (`security-path.ts`)
Pour éliminer les risques d'injection ou de pollution de prototype JavaScript lors de la résolution des chemins d'accès (`entry.foo.bar` ou `context.baz`) :
- La résolution utilise exclusivement `Object.hasOwn()`.
- Tout chemin contenant les segments interdits `__proto__`, `constructor` ou `prototype` déclenche immédiatement une exception bloquante `SecurityViolationError`.

### 2.4 Dualité Interprète Récursif & Compilateur en Closures
- **`AstInterpreter` (Interprète de référence) :**
  - Parcours récursif sans effets de bord.
  - Horloge abstraite et compteur d'opérations déterministe.
  - Trois modes de traçabilité : `off` (débit), `summary` (résultat et références), `full` (audit pas-à-pas de chaque nœud).
- **`AstCompiler` (Compilateur JIT sans `eval`) :**
  - Transforme l'AST en une composition d'ordre supérieur de fonctions JavaScript natives (closures pures).
  - Zéro appel à `eval()` ou `new Function()`.
  - Conforme aux politiques CSP (Content Security Policy) les plus strictes.

### 2.5 Validation Croisée & Tests Basés sur les Propriétés (`fast-check`)
- Une suite de tests basée sur les propriétés génère 1 000 arbres syntaxiques aléatoires (`seed: 42`).
- L'interprète et le compilateur sont évalués en parallèle sur chaque arbre : **100% de concordance exacte** est prouvée entre les deux moteurs.

---

## 3. Résultats des Benchmarks & Performances Réelles

Exécution sur l'environnement de référence (Windows 11, Node LTS) :

| Scénario de Benchmark | Itérations | Durée (ms) | Débit (ops/s) | Latence moy (µs) |
| :--- | :---: | :---: | :---: | :---: |
| Arithmétique exacte `Decimal.js` | 1 000 000 | 2 560.59 ms | 390 536 ops/s | 2.561 µs |
| Division sécurisée avec `on_zero` | 500 000 | 1 367.75 ms | 365 563 ops/s | 2.736 µs |
| Filtre bi-temporel pur | 500 000 | 24.70 ms | 20 243 571 ops/s | 0.049 µs |
| Conversion Fuseau Algérie (`Africa/Algiers`) | 100 000 | 625.73 ms | 159 815 ops/s | 6.257 µs |
| **Règle AST compilée (20 nœuds, cible < 60s)** | **1 000 000** | **21 700.96 ms** | **46 081 ops/s** | **21.701 µs** |

> **Constat :** Le compilateur AST traite **1 000 000 d'évaluations en 21.7 secondes**, surpassant très largement l'objectif contractuel (< 60 secondes).

---

## 4. Cas de Test Dorés Validés

La suite `test/ast-engine.spec.ts` valide les règles fondamentales :
1. **Amortissement véhicule de tourisme (Plafond 3 000 000 DA sur 5 ans) :**
   - Coût 4.5M DA, amortissement 900 000 DA (prorata 1.0) $\rightarrow$ Réintégration fiscale = **300 000.00 DA**.
   - Coût 4.5M DA, amortissement 900 000 DA (prorata 0.5) $\rightarrow$ Réintégration fiscale = **600 000.00 DA**.
   - Coût 2.8M DA, amortissement 560 000 DA (prorata 1.0) $\rightarrow$ Réintégration fiscale = **0.00 DA**.
2. **Arrondi bancaire officiel :** `ROUND HALF_UP 2` de `2.675` donne exactement `2.68`.
3. **Précision décimale :** `0.1 * 10 = 1.0` (aucun artefact binaire IEEE-754).
4. **Tentative d'attaque :** `entry.__proto__.polluted` neutralisée par `SecurityViolationError`.

