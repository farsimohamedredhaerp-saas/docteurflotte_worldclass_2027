# Directives Locales — API NestJS (`apps/api`)

**Rôle :** Backend API modulaire, moteur physique déterministe (Maintenance 5.0), passerelle IoT/Traccar, IA locale Ollama et orchestration multi-tenant PostgreSQL RLS.

## Périmètre Modulaire Opérationnel
- `src/digital-twin/` : Calcul déterministe des 6 organes physiques, RUL, VHI et intégration bioclimatique des 58 Wilayas algériennes.
- `src/fleet-intelligence/` : Détection CUSUM anti-ballottement, Greffier Juridique (PV infalsifiables opposables) et innovations de rupture.
- `src/fuel-scanner/` : Scanner OCR de reçus Naftal et réconciliateur factures atelier / télématique.
- `src/workshop-voice/` : Assistant vocal d'atelier en Darja phonétique et Français avec short-circuit SQL ultra-rapide (< 50ms).
- `src/sovereign-rag/` : Coffre de connaissances RMI (62 manuels constructeurs) avec recherche hybride BM25 + pg_trgm.
- `src/copilot/` : Intégration souveraine du modèle local Ollama Qwen 2.5 1.5B Instruct (zéro appel externe).
- `src/decisions/` : Arbitrage financier SAD $\rightarrow$ ADS en Dinars Algériens (DZD) et machine à états anti-echo storm 72h.
- `src/admin/` : Administration dynamique des tarifs carburant, barèmes d'assistance et isolation des tenants.
- `src/tenants/` & `src/assets/` & `src/work-orders/` : Gestion du cycle de vie des flottes et ordres d'intervention.

## Règles d'Implémentation & Sécurité
1. **Multi-Tenant RLS Fail-Closed :** Tout accès SQL aux données sensibles de flotte doit être encapsulé avec le rôle `df_tenant_role` et `app.current_tenant_id` injecté côté serveur.
2. **Coupe-Feu Loi 18-07 (ANPDP) :** `ExternalFailoverFirewallService` intercepte et purge tout payload sortant vers Flespi ou services tiers de toute donnée nominative (PII).
3. **Validation Stricte des DTOs :** Tout payload entrant passe par `ValidationPipe` avec `whitelist: true` et `forbidNonWhitelisted: true`.
4. **Zéro Hardcode :** Prix de carburant, forfaits de remorquage désertique et fiscalité sont résolus dynamiquement via `AdminService` ou `CountryPackService`.
5. **Couverture de Tests :** Maintien impératif de 100% de suites de tests vertes (27 suites Jest existantes).
