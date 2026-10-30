# Plan d'Exécution — Intelligence Décisionnelle SaaS DocteurFlotte (v2.0)

**Date :** 2026-10-26  
**Réf. Master Spec :** `MASTER_SPEC.md` v2.0 (Sections 4 & 5 — 6 Algorithmes Physiques, SAD $\rightarrow$ ADS, Contrôle Budgétaire)  
**Réf. Contrat Maître :** [`AGENTS.md`](file:///e:/docteurflotte_2027/AGENTS.md)  
**Objectif :** Transformer DocteurFlotte en un système SaaS d'intelligence décisionnelle autonome de classe mondiale, combinant copilote d'exploitation conversationnel, vision par ordinateur (OCR Naftal & DVIR), jumeau numérique dynamique (Digital Twin / RUL) et agents ADS autonomes (stock, substitution).

---

## 1. Architecture Générale des Modules d'Intelligence

```
                               ┌────────────────────────────────────────────────────────┐
                               │       PLATEFORME DÉCISIONNELLE DOCTEURFLOTTE v2.0      │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
        ┌───────────────────────────┬──────────────────────┴──────────────────────┬───────────────────────────┐
        ▼                           ▼                                             ▼                           ▼
┌──────────────────┐     ┌──────────────────────┐                     ┌──────────────────────┐     ┌──────────────────────┐
│  1. COPILOTE IA  │     │ 2. VISION MULTIMODALE│                     │ 3. JUMEAU NUMÉRIQUE  │     │  4. AGENTS ADS       │
│  Ask Docteur-    │     │ OCR Reçus Naftal &   │                     │ Digital Twin & RUL   │     │ Auto-Ordres Travail, │
│  Flotte (SAD/ADS)│     │ Diagnostic Photos    │                     │ Prédiction 30/60/90j │     │ Stock Pièces & Subst.│
└──────────────────┘     └──────────────────────┘                     └──────────────────────┘     └──────────────────────┘
```

---

## 2. Découpage en Tranches d'Implémentation

### Tranche 1 — Contrats & DTOs d'Intelligence Décisionnelle
- Extension de `@docteurflotte/contracts` :
  - `CopilotQueryDto`, `CopilotResponseDto`, `CopilotActionSuggestion`
  - `FuelReceiptScanResultDto`, `FuelAnomalyAnalysisDto`
  - `DigitalTwinAssetDto`, `AssetRemainingUsefulLifeDto`
- Validation stricte des types et compilation de `@docteurflotte/contracts`.

### Tranche 2 — Backend : Copilote Décisionnel & Analyse Télématique Déterministe
- Module `apps/api/src/copilot/` :
  - `CopilotService` : Moteur d'inférence décisionnelle multi-critères. Interroge l'état réel des actifs du tenant via PostgreSQL RLS Fail-Closed, calcule les risques d'inaction cumulés, diagnostique les anomalies Arrhenius/Cranking/CUSUM en cours, et formule des recommandations d'action étayées par des preuves physiques.
  - `CopilotController` : Endpoints sécurisés `POST /copilot/query`, `GET /copilot/insights`, `POST /copilot/actions/execute`.

### Tranche 3 — Backend : Scanner Intelligent de Reçus Naftal & Réconciliation Télématique
- Module `apps/api/src/fleet-intelligence/services/receipt-ocr.service.ts` :
  - Extraction structurée des données d'un bon de carburant Naftal (Litres, Montant DZD, Station, Date/Heure, Type carburant).
  - Moteur de réconciliation croisée avec la jauge télématique Traccar :
    - Vérification géodésique de présence à la station-service à l'heure du reçu.
    - Vérification de la hausse de niveau de réservoir ($\Delta V$).
    - Détection de fraude / surévaluation du volume de carburant.

### Tranche 4 — Frontend : Interface du Copilote d'Exploitation (« Ask DocteurFlotte »)
- Page dédiée `/copilot` + Bouton d'accès rapide dans la navigation.
- Design ultra-premium (glassmorphism sombre, micro-animations, suggestions intelligentes en un clic, affichage interactif des preuves physiques et des ROI calculés en DZD).

### Tranche 5 — Frontend : Scanner Naftal & Réconciliation en Direct
- Page / Modal `/fuel-scanner` permettant de téléverser un reçu, visualiser l'extraction instantanée et voir le graphe de réconciliation avec le niveau du réservoir.

### Tranche 6 — Vérification des Garde-fous & Livrables
- Exécution de la suite complète `verify-all.cjs` (RLS, Secrets, Loi 18-07, SBOM, Lint, Typecheck, Tests Jest).
- Rapport d'exécution formel dans `docs/agent-reports/`.
