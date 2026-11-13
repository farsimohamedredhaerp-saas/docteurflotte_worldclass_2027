# ADR-012 — Application Client Data Plane (Saisie d'Activité, Grand Livre Scellé SHA-256, Cockpit d'Audit, Liasses SCF & Assistant G50/IBS)

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Application `apps/client` (React 19 + TypeScript + Vite), Intégration `@docteurflotte/decision-engine`, Tests `apps/client/test/client.spec.ts`  

---

## 1. Contexte & Enjeux

Dans l'architecture à deux plans du moteur décisionnel universel algérien, le **Data Plane** est l'interface opérationnelle mise à disposition de chaque entreprise cliente (tenant) pour :
1. Enregistrer son activité économique au jour le jour (ventes, achats, encaissements, règlements, réceptions de stock, situations de travaux BTPH).
2. Garantir la conformité probante et l'inviolabilité de ses écritures au moyen d'un **Grand Livre append-only scellé par chaînage continu SHA-256**.
3. Détecter en temps réel tout indice d'anomalie comptable ou fiscale avant clôture ou transmission à l'administration fiscale (DGI).
4. Piloter les clôtures d'exercice selon le Système Comptable Financier (SCF) algérien (CUMP continu, plans d'amortissement avec bascule linéaire optimale, balance générale équilibrée, bilan et compte de résultat).
5. Préparer et télé-déclarer les liasses fiscales obligatoires : **Série G n° 50** mensuelle (TVA collectée, TVA déductible, prorata annuel, TAP à 0.00 DA post-2024 selon art. 14 LF 2024) et **IBS annuel** (réconciliation fiscale et réintégrations sectorielles).

---

## 2. Architecture & Modules de `apps/client`

L'application `apps/client` (@docteurflotte/client) est structurée en 7 cockpits d'exploitation haute densité :

```
apps/client/
├── src/
│   ├── types/
│   │   └── client.ts                 # Modèles de données (TenantProfile, LedgerLine, Alert, G50, IBS)
│   ├── data/
│   │   └── mock-client-data.ts       # Données initiales tenant réalistes scellées SHA-256
│   ├── components/
│   │   ├── Header.tsx                # En-tête tenant, Wilaya, fuseau Africa/Algiers, pack actif et santé
│   │   ├── NavigationStrip.tsx       # Barre de navigation pour les 7 cockpits
│   │   └── Tabs/
│   │       ├── ExecutiveDashboardTab.tsx   # 1. Synthèse exécutive, santé (0-100), alertes, ratios
│   │       ├── ActivityEntryTab.tsx        # 2. Saisie d'activité avec pré-validation plafonds espèces
│   │       ├── LedgerExplorerTab.tsx       # 3. Grand Livre scellé SHA-256, vérification de chaîne, équilibre
│   │       ├── AuditCockpitTab.tsx         # 4. Audit de caisse 3 modes, fractionnement 19 bis, NIF
│   │       ├── StatisticalAuditTab.tsx     # 5. AUD-02 CAMV & énergie Sonelgaz, Benford 4 tests, scoring tiers
│   │       ├── ScfFinancialStatementsTab.tsx# 6. CUMP continu, amortissement dégressif->linéaire, Balance, Bilan/TCR
│   │       └── TaxDeclarationsTab.tsx      # 7. G50 mensuelle (TAP 0.00 DA), IBS multi-activités, IFU/ANAE
│   ├── App.tsx                       # Orchestrateur central réactif
│   ├── main.tsx                      # Point d'entrée React 19
│   └── index.css                     # Feuille de style financière haute densité
└── test/
    └── client.spec.ts                # Suite Vitest (6 tests de certification Data Plane)
```

---

## 3. Innovations & Décisions Clés

### 3.1 Scellement Cryptographique SHA-256 Inviolable
Chaque écriture générée dans le Data Plane hérite du hachage de l'écriture précédente :
$$\text{entry\_hash} = \text{SHA-256}(\text{prev\_hash} \mathbin{\Vert} \text{canonical\_payload})$$
- L'outil de vérification intégré (`handleVerifyChain`) parcourt instantanément l'intégralité du grand livre et certifie l'absence de toute insertion, altération ou suppression frauduleuse d'écriture.
- L'équilibre Débit = Crédit est recalculé et attesté en arithmétique décimale pure (`EngineDecimal`).

### 3.2 Contrôles Préventifs en Temps Réel à la Saisie
Dès la saisie d'un événement économique dans `ActivityEntryTab` :
- Si le mode de règlement est en espèces (`CASH`) et que le montant TTC dépasse **300 000 DA**, une alerte bloquante rappelle l'article 169 du CIDTA (non-déductibilité fiscale de la fraction excédentaire).
- Si le règlement dépasse **100 000 DA** en espèces pour un achat, le risque de rejet de déduction de TVA (Art. 30 du CTCA) est notifié immédiatement.
- La validation produit automatiquement les lignes d'écritures équilibrées respectant les rôles ontologiques (`AccountRole.CLIENT`, `AccountRole.REVENUE_SERVICES`, `AccountRole.VAT_COLLECTED`).

### 3.3 Déontologie d'Audit & Vocabulaire Neutre (Règle 6)
- Aucun terme accusatoire (« fraude », « fraudeur », « redressement certain ») n'est employé.
- Tout indice d'anomalie détecté est qualifié neutrement (« Indice d'anomalie », « Fournisseur à examiner »).
- Chaque alerte impose obligatoirement une revue contradictoire préalable (`humanReviewRequired = true`) avec droit d'explication.

### 3.4 Spécificités Algériennes Intégrées
- **Fuseau légal :** `Africa/Algiers` (UTC+1 fixe sans DST).
- **Taxe sur l'Activité Professionnelle (TAP) :** Liquidée explicitement à **0.00 DA** conformément à sa suppression légale par l'Article 14 de la Loi de Finances 2024.
- **IBS Multi-Activités :** Application du taux de 26% en cas d'absence de comptabilité séparée (LFC 2015).
- **Validation syntaxique des NIF :** Distinction stricte entre les personnes morales (15 chiffres) et les personnes physiques (20 chiffres).

---

## 4. Métriques de Validation

1. **Compilation de Production :** `pnpm --filter @docteurflotte/client build` -> Bundle Vite généré en 14.31s (371 kB, 107 kB gzippé).
2. **Tests Automatisés :** `test/client.spec.ts` valide 6/6 tests à 100% :
   - Équilibre absolu Débit = Crédit sur le Grand Livre initial.
   - Intégrité cryptographique SHA-256 sans rupture sur toutes les écritures.
   - Détection exacte du plafond espèces IBS (300 000 DA).
   - Validation conforme des NIF algériens 15 et 20 chiffres.
   - Respect strict du vocabulaire neutre et de la revue contradictoire (Règle 6).
   - Conformité des métadonnées souveraines (Wilaya 16 Alger, fuseau horaire).
3. **Certification Globale Workspace :**
   - `pnpm -w typecheck` : 8/8 tâches réussies sur 6 packages.
   - `pnpm lint:hardcode` : 0 violation.

