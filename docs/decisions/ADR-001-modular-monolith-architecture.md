# ADR-001 : Architecture Monolithe Modulaire (Modular Monolith) pour le SaaS MVP

**Statut :** PROPOSÉ — À VALIDER PAR LE FONDATEUR  
**Date :** 2026-10-23  
**Décideurs :** Agent Orchestrateur, Équipe Technique, Fondateur  

---

## 1. Contexte

DocteurFlotte doit gérer le décisionnel, le contrôle de gestion, les actifs et la maintenance avec une forte étanchéité multi-tenant. La tentation fréquente sur ce type de projet est de découper prématurément le système en microservices distribués (service d'actifs séparé, service de maintenance, service télématique, service d'authentification).

Or, pour un MVP en phase de validation du product-market fit, les microservices introduisent une complexité opérationnelle disproportionnée : transactions distribuées (Saga), latence réseau inter-services, fragmentation des politiques RLS PostgreSQL, déploiements coordonnés complexes.

---

## 2. Options Considérées

- **Option A :** Microservices distribués avec bus d'événements Kafka/RabbitMQ dès le départ.
- **Option B (Recommandée) :** Monolithe modulaire NestJS avec workers asynchrones BullMQ / Redis et typage partagé (`packages/contracts`).
- **Option C :** Monolithe monolithique sans frontières modulaires (spaghetti code).

---

## 3. Décision Proposée

Adopter l'**Option B** : un **Monolithe Modulaire NestJS** dans un monorepo TypeScript géré par pnpm et Turborepo.
- Les frontières de domaines (Auth, Tenants, Assets, Maintenance, Costs, Decisions, Telematics) sont définies par des modules NestJS découplés avec interfaces explicites (ports & adapters).
- La persistance transactionnelle est centralisée dans PostgreSQL avec Row-Level Security (RLS) unifié.
- Les tâches lourdes et l'ingestion télématique sont confiées à des workers BullMQ adossés à Redis.

---

## 4. Conséquences

### Positives
- Cohérence transactionnelle ACID garantie sans complexité de transactions distribuées.
- Garantie d'étanchéité multi-tenant RLS simplifiée et testable sur une seule base.
- Vélocité maximale pour l'itération produit du MVP.
- Déploiement et observabilité grandement simplifiés.

### Négatives / Risques
- Discipline rigoureuse requise pour empêcher les couplages directs entre modules sans passer par les contrats.
- Surveillance de la charge CPU/mémoire du processus API principal lors des pics d'ingestion télématique.

---

## 5. Stratégie de Retour Arrière (Rollback)

Si un domaine particulier (ex: ingestion télématique à très haute fréquence) exige un passage à l'échelle indépendant, l'architecture par ports et adaptateurs et l'isolation des files BullMQ permettent d'extraire ce module spécifique en microservice indépendant sans réécrire le domaine métier.
