# Directives Locales — Contrats & Types Partagés (`packages/contracts`)

**Rôle :** Définitions TypeScript canoniques, DTOs partagés, interfaces physiques et énumérations communes (Maintenance 5.0, Télémétrie, Fiscalité DZ).

## Périmètre Canonique Couvert
1. **Jumeau Numérique 6 Organes & RUL (`digital-twin.ts`) :**
   - Types d'organes physiques : `ENGINE_OIL`, `BATTERY_CRANKING`, `BRAKE_PADS`, `COOLING_SYSTEM`, `DPF_FILTER`, `TRANSMISSION_DRIVETRAIN`.
   - Modélisation de l'arbitrage financier SAD $\rightarrow$ ADS en Dinars Algériens (`DigitalTwinFinancialArbitrage`).
   - Nomenclature et profil bioclimatique des **58 Wilayas algériennes** (`ALGERIA_58_WILAYAS_PROFILES`, `AlgeriaWilayaProfile`).
2. **Innovations de Rupture (`physics-engine.ts`) :**
   - Énumération et interfaces des 5 innovations majeures (`BreakthroughInnovationType`, `BreakthroughInnovationDetail`).
   - Algorithmes CUSUM, Dévers topographique Valhalla, CSIS spectro-cranking, UEB SCR.
3. **Scanner OCR Carburant & Factures (`fuel-scanner.ts`) :**
   - DTOs de téléversement et résultat de reconnaissance (`ScanFuelReceiptDto`, `FuelReceiptScanResult`).
   - Réconciliation carburant vs télématique et devises administrables.
4. **Copilot & IA Souveraine (`copilot.ts`) :**
   - Dialogue structuré, propositions d'arbitrage et journal d'audit local.
5. **Réglementation & Fiscalité Algérienne (`algeria-regulatory.ts`) :**
   - Types de facturation DGI (NIF, NIS, RC, AI, Timbre fiscal) et barèmes ENACTA.

## Règles d'Implémentation
1. **Zéro Effet de Bord Runtime :** Ce package ne contient que des types, interfaces, constantes de référence géographiques et schémas purs. Aucune dépendance de framework (NestJS, Next.js).
2. **Immutabilité des Contrats Publics :** Les structures de données publiées sont versionnées. Ne pas renommer ou supprimer un champ sans prévoir de rétro-compatibilité.
3. **Compilation Stricte :** Le package compile via `tsc` dans `dist/`. La vérification `pnpm --filter @docteurflotte/contracts build` doit systématiquement passer avec 0 erreur.
4. **Cohérence du Domaine :** Les énumérations métier reflètent strictement les définitions du contrat maître `AGENTS.md` et de `MASTER_SPEC.md`.
