# EXIGENCES NON FONCTIONNELLES & OBJECTIFS DE NIVEAU DE SERVICE (NFR / SLO)

**Statut :** DOCUMENT TECHNIQUE DE RÉFÉRENCE — VALEURS PROPOSÉES À VALIDER PAR LE FONDATEUR  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/architecture/core-architecture.md`  

---

## 1. Objectifs de Niveau de Service (SLO)

Toutes les métriques ci-dessous sont des cibles d'ingénierie initiales pour le MVP et le premier pilote en production.

| Indicateur (SLO) | Description | Cible proposée | Fenêtre de mesure | Méthode de mesure |
| :--- | :--- | :--- | :--- | :--- |
| **Disponibilité API (`api_uptime`)** | Pourcentage de requêtes API renvoyant un code HTTP < 500 hors fenêtres de maintenance planifiée | `PROPOSÉ — 99.5% (À VALIDER PAR LE FONDATEUR)` | Mensuelle glissante | Traçage `/health` + monitoring passerelle HTTP (Prometheus/Grafana ou CloudWatch) |
| **Latence requêtes web (`p95_latency_web`)** | Temps de réponse au 95e percentile pour les requêtes de lecture courante (dashboard, liste actifs) | `PROPOSÉ — < 300 ms (À VALIDER PAR LE FONDATEUR)` | Hebdomadaire | Métriques APM / NestJS Interceptor + OpenTelemetry |
| **Latence requêtes écriture (`p95_latency_write`)** | Temps de réponse au 95e percentile pour création d'intervention, ordre de travail, saisie compteur | `PROPOSÉ — < 600 ms (À VALIDER PAR LE FONDATEUR)` | Hebdomadaire | APM / OpenTelemetry spans sur les routes POST/PUT |
| **Délai d'ingestion télématique (`telematics_ingestion_delay`)** | Délai entre l'arrivée du webhook/message Traccar et la mise à disposition de l'événement/compteur normalisé | `PROPOSÉ — < 5 000 ms (À VALIDER PAR LE FONDATEUR)` | Temps réel / 99e percentile | Delta entre `timestamp_received` et `timestamp_processed` enregistré dans Redis/BullMQ |
| **Délai de traitement asynchrone (`queue_latency`)** | Temps d'attente d'un job dans la file BullMQ avant prise en charge par un worker | `PROPOSÉ — < 2 000 ms (À VALIDER PAR LE FONDATEUR)` | Horaire | Métriques BullMQ (`job.processedOn - job.timestamp`) |

---

## 2. Résilience et Continuité d'Activité (RPO / RTO)

| Paramètre | Description | Cible proposée | Méthode de vérification |
| :--- | :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | Perte maximale de données admissible en cas de sinistre majeur sur la base principale | `PROPOSÉ — < 1 heure (À VALIDER PAR LE FONDATEUR)` | Sauvegardes WAL PostgreSQL continues (pgBackRest / WAL-G) + snapshot horaire |
| **RTO (Recovery Time Objective)** | Temps maximal d'interruption admissible pour restaurer un service opérationnel dégradé | `PROPOSÉ — < 4 heures (À VALIDER PAR LE FONDATEUR)` | Exercice annuel de restauration à blanc en environnement de staging |

---

## 3. Capacité et Dimensionnement Initial (MVP)

| Axe de dimensionnement | Cible de capacité MVP proposée | Remarques |
| :--- | :--- | :--- |
| **Tenants simultanés** | `PROPOSÉ — 10 à 50 entreprises (À VALIDER PAR LE FONDATEUR)` | Architecture multi-tenant logique (PostgreSQL RLS) |
| **Actifs suivis au total** | `PROPOSÉ — 500 à 2 500 actifs (À VALIDER PAR LE FONDATEUR)` | Véhicules routiers, engins de travaux et équipements |
| **Volume de messages télématiques / sec** | `PROPOSÉ — 50 messages/sec crête (À VALIDER PAR LE FONDATEUR)` | Absorbé via file d'attente Redis / BullMQ |
| **Taille de rétention télématique brute** | `PROPOSÉ — 90 jours glissants (À VALIDER PAR LE FONDATEUR)` | Purge ou archivage agrégé au-delà (voir ADR-003) |
