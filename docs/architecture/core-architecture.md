# Architecture Système, Sécurité & Cœur Décisionnel

**Référence :** Issu des Sections 3, 7, 8, 10, 11, 12 et 14 de l'`AGENTS.md` v1.0.  
**Statut :** Spécification Technique Fondamentale.

---

## 1. Principes Architecturaux Non Négociables

### 1.1 Stack et Modularité
- **Monorepo TypeScript :** Orchestré avec `pnpm` et Turborepo.
- **Frontend (`apps/web`) :** Application Next.js avec App Router, React 19, CSS moderne, aucun composant jetable non testé.
- **Backend API (`apps/api`) :** Monolithe modulaire NestJS, découpé en domaines métiers cohérents.
- **Contrats Partagés (`packages/contracts`) :** Schémas et types partagés sans effets de bord runtime.
- **Données & Queues (`infra/`) :** PostgreSQL 16 avec Row-Level Security (RLS) et Redis 7 / BullMQ pour les tâches asynchrones.
- **Pas de Microservices Prématurés :** Pas de distribution complexe ou de Kafka sans ADR justifié par une charge mesurée.

### 1.2 Multi-Tenant Sécurisé dès le Départ
- Modèle logique : `Tenant → Organization/Site → Domain/Process → Asset/Entity`.
- **Row-Level Security (RLS) :** Activé sur toute table stockant des données de tenant.
- **Contexte Transactionnel Côté Serveur :** Le tenant courant est établi à partir de l'identité authentifiée et injecté dans la session de base via `SET LOCAL app.current_tenant_id = '<uuid>';`.
- **Échouer Fermé :** Aucune requête n'accède aux données sans contexte tenant valide.
- **Workers Asynchrones :** Reconstitution et vérification obligatoire du contexte tenant avant l'exécution de tout job en arrière-plan.

### 1.3 Le Code n'est Pas le Catalogue Métier
- **À garder dans le code :** Types invariants, validations structurelles, sécurité, contraintes d'intégrité relationnelle.
- **À garder en configuration/base de données versionnée :**
  - Seuils économiques, montants, barèmes kilométriques ou horaires.
  - Fréquences et conditions d'interventions préventives.
  - Devises, taxes, taux et réglementations par pays.
  - Circuits d'approbation et niveaux de sévérité.
- **Priorité de résolution des paramètres :**
  `Défaut système/pack → Configuration Pays → Configuration Tenant → Configuration Site → Configuration Actif`.

---

## 2. Cœur Décisionnel & Contrôle de Gestion

### 2.1 Cycle Décisionnel
`Données → Preuves → Contrôles → Exceptions → Analyses → Décisions → Actions → Résultats → Apprentissage`.

### 2.2 Typologie des Règles
- **Règles opérationnelles :** Échéances d'entretien, compteurs, alertes mécaniques.
- **Règles analytiques :** Écarts de budget, dérives de consommation, coût d'inaction.
- **Règles de politique interne :** Seuils d'approbation financière, séparation des tâches.
- **Contrôles documentaires :** Validité des pièces légales et certificats.
- **Règles de confiance :** Qualité, fraîcheur et complétude des relevés.

### 2.3 Explicabilité & Traçabilité
Toute décision émise doit comporter : identifiant et version de la règle, actif cible, date et données d'entrée référencées, conditions évaluées, motif lisible, niveau de sévérité, indice de confiance (0-100%) et action suivante recommandée.

---

## 3. Télématique : Traccar par Défaut & Flespi Conditionnel

1. **Adaptateur Canonique :**
   - L'application interagit avec la télématique via une interface abstraite `ITelematicsProvider`.
2. **Traccar Auto-Hébergé :**
   - Utilisation exclusive des API REST et flux WebSocket officiellement documentés.
   - Ne pas coupler le schéma métier aux tables internes de Traccar.
   - Les identifiants matériels (IMEI) sont appairés aux actifs via une table d'association horodatée.
   - Dédoublonnage strict par clé de message et tolérance aux paquets tardifs.
3. **Condition d'Activation Flespi :**
   - Ne jamais introduire flespi par défaut. Un ADR et des tests comparatifs doivent démontrer un protocole non supporté ou un volume hors de portée de Traccar.
   - Les clés secrètes demeurent strictement côté serveur.

---

## 4. Mobilité & Mode Hors Ligne (PWA)

1. **Périmètre Restreint au MVP :**
   - Consulter les actifs/ordres assignés récemment synchronisés.
   - Saisie manuelle de compteurs et fiches de pointage.
   - Prise de photos compressées localement.
2. **Garde-fous de Synchronisation :**
   - Identifiant unique idempotent généré côté client (UUIDv4).
   - Les actions en attente portent le statut explicite `SYNC_PENDING`.
   - Résolution déterministe des conflits avec traçabilité d'audit.

---

## 5. Sécurité, Données & Audit

- **Validation Stricte des Entrées :** Validation Pipes côté serveur sur chaque endpoint.
- **Secret Management :** Aucun jeton, mot de passe ou secret dans le code, les logs ou le frontend.
- **Protection des Données Personnelles :** Respect des principes de minimisation et de la législation en vigueur (Loi 18-07 relative à la protection des données en Algérie).
- **Audit Immuable :** Consignation de toute action sensible (approbation financière, modification de seuil, purge démo) avec acteur, horodatage et état antérieur/postérieur.
- **Sauvegarde & Restauration :** Procédure de reprise testée avant déploiement client.

---

## 6. Observabilité & Santé Technique

Surveillance minimale requise pour le MVP :
- Santé de l'API (`/health`, `/ready`), état des connexions PostgreSQL et Redis.
- Délais et échecs des jobs de la file BullMQ.
- Métriques télématiques : messages reçus, doublons écartés, anomalies GPS, dernier signal par boîtier.
- Erreurs d'évaluation de règles et conflits de synchronisation terrain.
