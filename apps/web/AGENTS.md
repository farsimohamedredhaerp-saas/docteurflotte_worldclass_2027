# Directives Locales — Application Web Next.js 15 (`apps/web`)

**Rôle :** Cockpits d'exploitation haute densité, interfaces de maintenance 5.0, cartographie souveraine MapLibre et applications mobiles PWA Offline-First.

## Périmètre des Écrans Opérationnels
- `/digital-twin` : Jumeau Numérique 6 organes, sélecteur des 58 Wilayas algériennes, blueprint SVG interactif et console d'arbitrage financier SAD $\rightarrow$ ADS (DZD).
- `/live-cockpit` : Cartographie vectorielle souveraine MapLibre sans Google Maps, suivi temps réel des corridors algériens et clustering par Wilaya.
- `/fuel-scanner` : Scanner OCR de reçus Naftal avec upload d'images et réconciliation télématique automatique.
- `/work-orders` : Gestion des ordres d'intervention atelier avec réservation de pièces OEM et génération de factures conformes DGI.
- `/preventive` : Démonstrateur interactif des 5 innovations de rupture physique déterministe.
- `/copilot` : Assistant d'aide à la décision propulsé par l'IA souveraine locale Ollama Qwen 2.5.
- `/dispatch` : Ordres de mission officiels algériens avec QR Code cryptographique vérifiable hors-ligne.
- `/cold-chain` : Surveillance thermique bi-zone pour transport frigorifique et agroalimentaire.
- `/dvir` : Fiches d'inspection pré/post-tournée mobiles PWA avec tolérance totale aux coupures réseau (Offline-First).
- `/guide` : Manuel de référence technique et fonctionnel interactif du SaaS DocteurFlotte.

## Règles d'Implémentation UI
1. **Bilinguisme Natif FR / AR (RTL) :** Support du français et de l'arabe avec typographie adaptée et propriétés CSS logiques (`margin-inline-start`, `text-align: start`).
2. **Tokens de Design DocteurFlotte :** Utilisation stricte des variables CSS du thème de bordure et de surface (`var(--df-bg-base)`, `var(--df-border-subtle)`).
3. **Explicabilité Immédiate (XAI) :** Tout indicateur ou arbitrage financier dispose d'un bouton de preuve de calcul (`CalculationProofButton`) ouvrant le détail de la formule déterministe.
4. **Zéro Hardcode :** Les devises (`DZD`), unités et constantes proviennent du contexte de configuration ou de l'API.
