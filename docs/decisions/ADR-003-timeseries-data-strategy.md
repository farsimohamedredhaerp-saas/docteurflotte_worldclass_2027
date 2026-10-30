# ADR-003 : Stratégie de Stockage et Partitionnement des Séries Temporelles Télématiques

**Statut :** PROPOSÉ — À VALIDER PAR LE FONDATEUR  
**Date :** 2026-10-23  
**Décideurs :** Agent Orchestrateur, Équipe Technique, Fondateur  

---

## 1. Contexte

Les positions GPS et messages télématiques génèrent des millions de lignes par mois même pour un parc modeste de quelques centaines de véhicules. L'accumulation de ces données dans une table PostgreSQL standard non partitionnée engendre une dégradation progressive des index et ralentit les requêtes analytiques et transactionnelles.

---

## 2. Options Considérées

- **Option A :** Table plate unique sans partitionnement avec purge nocturne par script `DELETE WHERE recorded_at < ...` (provoque des locks et de la fragmentation d'espace disque).
- **Option B (Recommandée pour le MVP) :** Partitionnement natif PostgreSQL par intervalle de dates (`PARTITION BY RANGE (recorded_at)`), avec découpage mensuel.
- **Option C :** Introduction immédiate d'une extension TimescaleDB ou d'un moteur Time-Series séparé (ClickHouse / InfluxDB).

---

## 3. Décision Proposée

Retenir l'**Option B** :
- Utiliser le partitionnement déclaratif natif de PostgreSQL 16+ sans dépendance logicielle supplémentaire.
- Les positions brutes sont stockées dans `telematics_positions` partitionnée par mois.
- La purge des données au-delà de la durée de rétention approuvée (ex: 90 jours) s'effectue par un simple `DROP TABLE telematics_positions_YYYY_MM` instantané et sans verrouillage bloquant.
- L'adoption d'un moteur dédié comme TimescaleDB ou ClickHouse est explicitement différée après la validation commerciale du MVP.

---

## 4. Conséquences

### Positives
- Zéro dépendance technique externe ; supporté nativement par notre PostgreSQL actuel.
- Performances optimales en lecture grâce au `partition pruning`.
- Purge des anciennes données sans impact de contention sur la base de production.

### Négatives / Risques
- Nécessité d'automatiser la création anticipée des futures partitions mensuelles via un cron ou job BullMQ.

---

## 5. Stratégie de Retour Arrière (Rollback)

Si les volumes de télémétrie dépassent les prévisions (> 10 000 actifs haute fréquence), la migration vers TimescaleDB ou ClickHouse se fera de manière transparente via l'adaptateur d'ingestion sans impacter le schéma métier des actifs.
