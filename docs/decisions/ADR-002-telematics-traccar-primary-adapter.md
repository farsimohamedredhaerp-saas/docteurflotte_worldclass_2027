# ADR-002 : Intégration Télématique Initiale via Traccar Auto-hébergé

**Statut :** PROPOSÉ — À VALIDER PAR LE FONDATEUR  
**Date :** 2026-10-23  
**Décideurs :** Agent Orchestrateur, Équipe Technique, Fondateur  

---

## 1. Contexte

DocteurFlotte doit être capable de recevoir des données GPS, compteurs et événements de roulage depuis une grande variété de terminaux matériels (boîtiers OBD, trackers GPS filaires, compteurs d'engins). Deux solutions d'ingestion télématique majeures sont envisageables :
1. **Traccar :** Serveur GPS open-source supportant plus de 200 protocoles matériels, installable en local / on-premise sans coût de licence par terminal.
2. **flespi :** Plateforme cloud télématique commerciale avec tarification à l'usage par équipement connecté.

---

## 2. Options Considérées

- **Option A :** Dépendance directe et exclusive sur flespi Cloud.
- **Option B (Recommandée) :** Adaptateur principal pour Traccar auto-hébergé (Open-source), avec architecture « Ports & Adapters » permettant d'ajouter flespi ultérieurement si un besoin technique vérifié le justifie.
- **Option C :** Développement d'un parseur de protocoles télématiques propriétaire en interne.

---

## 3. Décision Proposée

Retenir l'**Option B** :
- Le MVP intègre en priorité un connecteur Traccar (API REST + Webhooks / WebSocket).
- Les terminaux GPS pointent vers le serveur Traccar auto-hébergé. DocteurFlotte reçoit les positions et statuts via webhook et met à jour les compteurs actifs.
- L'architecture isole les données brutes derrière l'interface générique `TelematicsAdapter` (Garde-fou C).
- flespi n'est pas utilisé pour le MVP afin d'éviter tout coût récurrent inutile et de conserver la souveraineté complète des données d'exploitation sur le territoire cible (Algérie).

---

## 4. Conséquences

### Positives
- Coût marginal d'ingestion nul par terminal ajouté (logiciel open-source auto-hébergé).
- Souveraineté totale et conformité avec les réglementations locales sur la localisation des données.
- Large catalogue de boîtiers GPS immédiatement compatibles sans développement de protocoles bas niveau.

### Négatives / Risques
- Nécessité de superviser et maintenir le serveur Traccar (mises à jour, disponibilité).
- Latence d'ingestion dépendante de la configuration du pipeline Webhook Traccar → NestJS.

---

## 5. Stratégie de Retour Arrière (Rollback)

L'utilisation du contrat d'interface `TelematicsAdapter` garantit qu'un remplacement ou un basculement vers flespi (ou un autre concentrateur) se fera par simple ajout d'une classe d'implémentation sans modifier la logique métier.
