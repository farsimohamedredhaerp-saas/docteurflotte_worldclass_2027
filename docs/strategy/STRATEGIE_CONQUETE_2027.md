# STRATÉGIE DE CONQUÊTE 2027 — DOCTEURFLOTTE
## De la Gestion de Flotte à l'ERP Gravitationnel des Métiers Physiques Algériens

**Version :** 1.0 — World-Class Conquête & Exécution Stratégique  
**Date :** Novembre 2026  
**Statut :** Document d'Orientation Stratégique & Feuille de Route d'Ingénierie  
**Référence :** [`MASTER_SPEC.md`](../../MASTER_SPEC.md) & [`AGENTS.md`](../../AGENTS.md)

---

## 1. Diagnostic Concurrentiel : La Réalité du Marché Algérien

Le marché algérien de la gestion de flotte et des systèmes de gestion d'entreprise présente une opportunité historique née d'une triple faille structurelle :

### 1.1 Les Acteurs de Géolocalisation Pure (GPS-Only)
- **GPS City (depuis 2011)** : Leader sur le matériel avec boîtier GPS offert et garantie à vie via sa plateforme Fleetdz. Centré sur le suivi, la vitesse, le coupe-moteur et l'historique de déplacement.
- **VDA Technology (Béjaïa, depuis 2008)** : Spécialiste de télématique embarquée et éco-conduite.
- **Constat** : Forts sur le matériel et le point GPS, mais **aveugles à l'ERP, à la fiscalité et à la rentabilité par actif**. Ils vendent de la localisation passive, pas de la conformité DGI ni des arbitrages financiers en Dinars Algériens (DZD).

### 1.2 Les ERP Locaux d'Entreprise
- **Almawarid** : Alternative algérienne à Odoo, conformité DGI (facturation Décret 05-468, TVA 19/9%, timbre fiscal, paie CNAS/IRG), hébergement local en Algérie.
- **DZ Compta** : Cible les cabinets comptables avec un "3-en-1" (comptabilité, paie, stock).
- **Odoo Localisé / Sage 100** : Présents via des intégrateurs locaux (Artec Int, etc.), nécessitant des mois d'intégration coûteuse.
- **Constat** : Forts sur l'administratif et la comptabilité générale, mais **complètement déconnectés de la physique de l'actif**. Zéro bon de livraison émargé (POD), zéro attachement de chantier, zéro heure moteur J1939, zéro analyse de consommation Naftal odométrique.

### 1.3 Les Géants Internationaux (Samsara, Geotab, Motive)
- Facturation en devises étrangères (27 $ à 50 $/véhicule/mois) avec boîtiers propriétaires obligatoires et engagements annuels.
- Coût prohibitif pour une PME algérienne de 30 véhicules.
- Interfaces anglophones déconnectées du cadre réglementaire algérien (Loi 18-07 / 25-11, SCF, DGI, G50, barèmes ENACTA).

### 1.4 La Fenêtre Réglementaire : Le Vrai Levier de Rupture
1. **Facturation Électronique DGI (2027 Grandes Entreprises / 2028 PME) :** Le modèle de contrôle continu des transactions (CTC) imposera une validation en temps réel avant émission fiscale légale. Les entreprises non préparées risquent des rejets massifs de déductibilité.
2. **Souveraineté des Données (Loi 18-07 renforcée par la Loi 25-11 de 2025) :** Obligation stricte de localisation des bases de données sur le sol algérien.
3. **Taux d'Échec des ERP Traditionnels (jusqu'à 90% dans les PME) :** Résistance au changement, coûts d'intégration démesurés, interfaces rigides.

---

## 2. Thèse Stratégique : « La Fiscalité n'est pas le Cœur, elle est la Sortie »

La comptabilité et la fiscalité DGI sont les **points de sortie obligatoires et infalsifiables** du système, mais **l'entrée opérationnelle doit être l'actif physique et ses opérations quotidiennes**.

```
[ TERRAIN / OPÉRATIONS PHYSIQUES ]
  - Réconciliation Naftal OCR / Scan
  - Inspections mobiles DVIR Offline-First
  - Missions Dispatch QR Code & POD signé
  - Heures machine chantiers & Locations
                    │
                    ▼
[ MOTEUR DÉCISIONNEL & JUMEAU DE COÛT (ADS) ]
  - DZD/km et DZD/h réels par actif
  - Arbitrage économique Réparer vs Remplacer
  - Détection des dérives et surconsommations
                    │
                    ▼
[ CONFORMITÉ SOUVERAINE & SORTIE FISCALE DGI ]
  - Facturation électronique 2027 (CTC-Ready)
  - Grand Livre SCF automatique (Classes 2, 4, 6, 7)
  - Tableau 9 Liasse Fiscale (Réintégrations VP)
  - Export 1-Clic vers PC Compta, Sage, Odoo
```

---

## 3. Les 7 Innovations Rationnelles pour Conquérir le Marché

1. **Le « Pack Préparation e-Facturation 2027 » comme Produit d'Appel :**
   - Audit flash d'éligibilité DGI (syntaxe NIF 15/20 chiffres, RC, Article d'Imposition, contrôle Art. 64 CPF).
   - Contrôle du plafond des paiements en espèces (1 000 000 DZD TTC, Règle 5).
   - Détection des faits générateurs hybrides (Débit vs Encaissement, Règle 7).
   - Outil autonome vendable immédiatement aux PME 18 mois avant l'échéance.

2. **Le Mode 0 Freemium (Adoption Instantanée à 0 DA de Boîtier) :**
   - Aucun matériel requis au Jour 1.
   - Exploitation basée sur l'ingestion des relevés Naftal (OCR / CSV), le routage topographique Valhalla, et les fiches DVIR.
   - Brise le mur des 90% d'échec ERP dans les PME.

3. **L'API Ouverte comme Arme d'Alliance (Infrastructure de Confiance) :**
   - Ne pas chercher à remplacer immédiatement PC Compta, Sage ou Almawarid.
   - Fournir des connecteurs d'export certifiés 1-clic pour alimenter la comptabilité de l'expert-comptable sans double saisie.

4. **Partenariat Stratégique avec les Cabinets d'Expertise Comptable (B2B2B) :**
   - L'expert-comptable algérien est le prescripteur numéro 1.
   - DocteurFlotte lui épargne la chasse aux tickets Naftal froissés et garantit la conformité fiscale de ses clients.

5. **Le « Jumeau de Coût » (TCO DZD/km & DZD/h) avant le Jumeau Physique :**
   - Calcul immédiat de rentabilité pour 100% de la flotte en Mode 0 et Mode 1.
   - Réservant le jumeau physique multi-organes haute fidélité (Arrhenius/Archard) au palier premium Mode 2 (CAN/J1939).

6. **La Souveraineté Juridique comme Argument de Vente Majeur :**
   - Garantie totale de conformité Loi 18-07 et Loi 25-11 de 2025.
   - Hébergement On-Premise / Cloud souverain algérien certifié, zéro fuite PII à l'étranger.

7. **Tarification Juste par Actif Roulant (« 0 DA au Garage ») :**
   - Facturation indexée sur les actifs en exploitation réelle, rassurant les chefs d'entreprise face aux creux d'activité saisonniers.

---

## 4. Feuille de Route d'Exécution en 3 Vagues

### Vague 1 (Mois 0 à 9) : Preuve & Acquisition Rapide
- Mode 0 enrichi (OCR Naftal, DVIR PWA Offline-First, Dispatch QR, ENACTA).
- **Pack Préparation e-Facturation 2027** : Audit DGI automatisé et checklist d'anomalies bloquantes.
- **Jumeau de Coût (TCO Mode 0/1)** : Rentabilité DZD/km et DZD/h sans capteur additionnel.
- **Exports Partenaires 1-Clic** : Format PC Compta DGI et JSON universel.
- *Objectif* : 10 à 15 PME pilotes, taux d'activation > 60%.

### Vague 2 (Mois 9 à 18) : Monétisation & Conformité Continue
- Mode 1 Télématique GNSS (vitesse, arrêts, éco-conduite, corridors 58 Wilayas).
- Connecteur e-Facturation DGI direct (validation continue des transactions CTC).
- Réseau d'experts-comptables prescripteurs et tableau de bord fiduciaire.
- *Objectif* : 50 à 100 entreprises abonnées, rentabilité opérationnelle.

### Vague 3 (Mois 18 à 30) : Profondeur Technique & Écosystème Métier
- Mode 2 Full CAN / J1939 & Jumeau Numérique Physique 6 Organes.
- Grand Livre SCF complet automatisé et liasse fiscale intégrale.
- Verticale d'excellence approfondie : BTPH / Matériaux ou Fret Inter-Wilayas.
- *Objectif* : Standard de référence national incontournable en Algérie.
