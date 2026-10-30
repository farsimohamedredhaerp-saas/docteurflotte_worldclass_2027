# Périmètre Produit MVP, Utilisateurs & Activation-First

**Référence :** Issu des Sections 2, 4, 5, 6 et 13 de l'`AGENTS.md` v1.0.  
**Statut :** Spécification Produit Fondamentale.

---

## 1. Identité Produit & Utilisateurs

### 1.1 Positionnement
DocteurFlotte est une plateforme SaaS de **pilotage décisionnel, contrôle de gestion et maintenance des actifs opérationnels**, enrichie de données issues des opérations terrain, documents, capteurs télématiques et sources externes.
La boucle de valeur canonique est :
`Données → Preuves → Contrôles → Exceptions → Analyses → Décisions → Actions → Résultats → Apprentissage`.

L'IA assiste l'analyse opérationnelle sous gouvernance stricte : *l'IA conseille, les politiques gouvernent, les humains autorisent, les systèmes exécutent.*

### 1.2 Utilisateurs Cibles
- Administrateur de la plateforme SaaS
- Administrateur du tenant
- Direction générale / Gérant
- Contrôleur de gestion / Responsable financier
- Gestionnaire de flotte ou de parc d'équipements
- Responsable maintenance / Planificateur d'atelier
- Technicien de maintenance ou intervenant terrain
- Responsable conformité / Auditeur
- Analyste d'exploitation

### 1.3 Domaines Métier Pris en Charge
Le socle multi-métier accueille sans fork applicatif :
- Véhicules légers et utilitaires
- Poids lourds et transport routier de marchandises
- Engins de chantier et engins de travaux publics (BTP)
- Équipements industriels et techniques fixes/mobiles
- Remorques et matériels tractés

---

## 2. Périmètre Fonctionnel du MVP

### 2.1 Capacités Prioritaires
1. **Accès et Gestion SaaS :** Authentification sécurisée, multi-tenant étanche avec RLS, gestion fine des rôles et autorisations, traçabilité des actions sensibles.
2. **Registre d'Actifs Générique :** Modèle d'actif découplé (ne pas restreindre aux véhicules routiers), identifiants internes et externes (VIN, numéro de série, immatriculation), compteurs configurables (km, heures moteur, cycles).
3. **Maintenance Préventive & Proactive :** Plans d'entretien basés sur le temps, la distance ou les heures moteur, modèles d'interventions, bons de travail (Work Orders), suivi des pièces, temps d'immobilisation (*Downtime*), clôture documentée et coûts réels.
4. **Contrôle de Gestion Initial :** Enregistrement des dépenses directes, budget prévisionnel de référence, calcul d'écarts budget/réel, ventilation analytique des coûts (TCO), signalement explicite des données manquantes.
5. **Télématique Canonique :** Adaptateur Traccar auto-hébergé, appairage boîtier-actif, ingestion résiliente, dédoublonnage, tolérance aux retards, journal d'ingestion.
6. **Moteur Décisionnel Déterministe :** Registre de règles versionnées, évaluation explicable, exceptions générées avec criticité, recommandation d'action et suivi du résultat mesuré.
7. **Activation-First :** Pack initial sélectionnable à l'inscription, environnement de démonstration synthétique balisé (`data_origin = 'DEMO'`), cycle complet décision → action → résultat simulé sans écran blanc, assistant d'import CSV/Excel guidé avec détection de doublons.
8. **Terrain & Mobilité Réduite au MVP :** Consultation des actifs/ordres assignés, saisie de compteur, pointage de tâches et justificatifs photos avec synchronisation différée.
9. **Conformité & Traçabilité :** Registre sourcé des règles légales (JORADP), distinction stricte brouillon / approuvé.

### 2.2 Fonctionnalités Explicitement Différées
- Maintenance prédictive par Machine Learning généralisée (réservée à la post-phase MVP après constitution d'un historique validé).
- Moteur de scripts utilisateur arbitraires.
- Intégration flespi (uniquement si un besoin documenté et un ADR l'exigent).
- Comptabilité générale légale complète et télé-déclaration fiscale.
- Optimisation combinatoire lourde de tournées (VRP).
- Microservices distribués ou data warehouse séparé sans besoin mesuré.

---

## 3. Expérience Activation-First & Données Démo

1. **Parcours Sans Page Blanche :**
   - À l'inscription, le nouvel utilisateur choisit un profil d'activité (ex: Transport routier ou BTP/Engins).
   - Le système instancie un espace de démonstration alimenté de données synthétiques représentatives.
   - L'utilisateur teste le scénario « Aha! » : un actif franchit un seuil de maintenance → le système explique le risque économique → l'utilisateur déclenche l'ordre de travail en 1 clic → le tableau de bord affiche le résultat simulé.
2. **Garde-fous des Données Synthétiques :**
   - Toute donnée de démonstration porte impérativement `data_origin = 'DEMO'`.
   - Les données `DEMO` sont exclues de tout calcul de facturation, KPI réel ou export officiel.
   - Les gains affichés dans le scénario sont fictifs et explicitement déclarés comme tels.
   - Une fonction de purge réinitialise l'environnement démo sans jamais impacter les données réelles.
3. **Importation des Données Réelles :**
   - Gabarit téléchargeable (CSV/XLSX), validation syntaxique stricte, détection des doublons, confirmation explicite avant écriture.

---

## 4. Modèle d'Actifs et de Maintenance

1. **Abstraction Générique de l'Actif (`Asset`) :**
   - Ne pas figer une table `vehicles` avec des colonnes imposées. Utiliser `AssetType`, `AssetIdentifier`, `Meter` et `MeterReading`.
2. **Compteurs & Relevés :**
   - Traiter les cas de compteur qui régresse (alerte rollback), saut kilométrique impossible, estimation vs mesure réelle, unité inconnue.
3. **Typologie de Maintenance :**
   - **Préventive :** Déclenchement à échéance calendaire, kilométrique ou horaire.
   - **Proactive :** Anticipation sur dérives et seuils déterministes explicables.
   - **Prédictive :** Réservée aux modèles statistiques étayés sur gros volumes (post-MVP).

---

## 5. UX, Accessibilité & Ergonomie

- Langue de départ : Français, architecture prête pour l'Arabe (support RTL natif) et l'Anglais.
- Formats localisés (DZD, dates, séparateurs) configurables par tenant.
- États explicites visibles : `DEMO`, `SYNC_PENDING`, `UNKNOWN`, `ESTIMATED`, `MAINTENANCE_REQUIRED`.
- Divulgation progressive : actions simples et lisibles en premier, paramétrage avancé en second rideau.
