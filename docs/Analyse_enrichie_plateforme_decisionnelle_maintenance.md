# MASTER NOTE — Repositionnement et enrichissement du SaaS décisionnel & maintenance

**Version :** 1.0  
**Date de référence :** 23 octobre 2026  
**Objet :** Analyse critique du document initial et proposition d'un cadrage produit/technique plus fidèle à l'ambition de la plateforme.

---

## 1. Diagnostic exécutif

Le document initial contient des recommandations utiles — priorité à un MVP, Traccar d'abord, couche d'abstraction télématique, règles simples avant l'IA, pilote réel — mais il définit trop fortement le produit par le transport de marchandises et par la conformité de ce métier.

Le produit visé ne doit pas être un logiciel de transport auquel on ajoutera progressivement d'autres métiers. Il doit être une **plateforme de pilotage décisionnel, de contrôle de gestion et de maintenance des actifs opérationnels**, avec des capacités métier activables et configurables.

### Positionnement recommandé

> **Un système décisionnel et de gestion du cycle de vie des actifs opérationnels, connecté ou non, qui aide les organisations à maîtriser leurs coûts, leur disponibilité, leurs risques, leur maintenance et leurs obligations, au moyen de preuves, de règles explicables et d'actions suivies.**

La flotte et les engins sont le premier domaine d'actifs. Le transport, la logistique, le BTP, l'industrie, la distribution, la location et les services terrain sont des contextes métier qui utilisent le socle commun et activent des processus spécifiques.

### Le principe de conception

**Un cœur commun + une couche commune Actifs/Maintenance + des packs métier + des packs pays/réglementaires + des connecteurs.**

Cela ne signifie pas que tous les métiers sont développés dès le MVP. Cela signifie que le socle ne doit pas être conçu comme si le transport de marchandises était l'unique métier possible.

---

## 2. Ce que le document initial réussit et ce qu'il faut corriger

### Points à conserver

- Refuser l'accumulation de fonctionnalités sans priorisation.
- Utiliser Traccar auto-hébergé comme première brique de télématique.
- Prévoir un adaptateur pour brancher d'autres sources, dont éventuellement flespi.
- Utiliser des règles déterministes et explicables avant de chercher une prédiction par IA.
- Prévoir dès le départ l'isolation multi-tenant, l'audit, les rôles et les preuves.
- Valider le produit auprès de vrais utilisateurs et définir des critères de recette mesurables.

### Points à revoir

1. **La conformité ne doit pas être l'identité entière du produit.** Elle est une fonction transverse du cœur décisionnel et un domaine de règles versionnées. Elle ne remplace ni le contrôle de gestion ni la maintenance.
2. **Le transport de marchandises n'est pas la seule structure possible du MVP.** Le premier périmètre doit viser un problème transversal aux entreprises possédant ou utilisant véhicules et engins.
3. **La maintenance prédictive ne doit pas être promise sans données suffisantes.** Le MVP doit livrer une maintenance préventive fiable et une maintenance proactive explicable. La prédiction statistique/ML vient après mesure de la qualité et de la profondeur des données.
4. **Les données télématiques ne doivent pas être une condition d'utilisation du SaaS.** Le produit doit fonctionner avec saisie manuelle, import contrôlé et intégrations. Le GPS enrichit les données; il ne remplace pas la gestion des actifs.
5. **Le MVP ne doit pas devenir un ERP fiscal.** Les paramètres fiscaux et contrôles documentaires peuvent être prévus, mais la facturation fiscale, la comptabilité et la télédéclaration complètes constituent un périmètre distinct qui exige validation spécifique.
6. **« Aucune variable codée en dur » doit être défini rigoureusement.** Les variables métier, formules, seuils, politiques, référentiels et workflows doivent être configurables et versionnés. Les invariants techniques, règles de sécurité et intégrité restent codés et testés. Un moteur universel exécutant du code utilisateur serait excessif et dangereux.
7. **Les affirmations juridiques du document ne doivent pas être copiées directement en exigences logiciel** sans référence exacte au texte, à son article, à son champ d'application, à sa date d'effet et à une validation compétente.

---

## 3. Architecture conceptuelle du produit

### Couche A — Plateforme commune SaaS

- Tenants, organisations, sites, unités et périmètres de responsabilité.
- Comptes, rôles, permissions, authentification et séparation des tâches.
- Configuration versionnée, internationalisation et unités de mesure.
- Journal d'audit, gestion documentaire, notifications et tâches différées.
- Gestion des plans/offres, modules activés et limites commerciales configurables.
- Sécurité multi-tenant et procédures de sauvegarde/restauration.

### Couche B — Cœur décisionnel et de contrôle

Cette couche est la différenciation principale du produit. Elle doit fournir les capacités suivantes, indépendamment du métier :

- **Performance & KPI :** définitions, calculs, objectifs, seuils, périodes et sources.
- **Contrôle de gestion :** budget, prévision, réalisé, écarts et explication des écarts.
- **Coûts & allocation :** coûts directs/indirects, affectation par actif, site, activité, centre de coûts ou client selon les règles du tenant.
- **Registre des règles :** règles métier, maintenance, qualité des données, politiques internes et contrôles réglementaires.
- **Registre des preuves :** données sources, pièces, horodatage, origine, qualité, unité et référence à l'entité concernée.
- **Gestion des exceptions :** événement, gravité, explication, propriétaire, délai et statut.
- **Dossier de décision :** contexte, données utilisées, règle/version exécutée, recommandation, approbation et justification.
- **Gestion des actions :** responsable, échéance, exécution, coût de l'action et pièce de clôture.
- **Résultat et apprentissage :** résultat observé, écart entre attendu et obtenu, mesures et retour d'expérience.

Cycle canonique : **Données → Preuves → Contrôles → Exceptions → Analyse → Décision → Action → Résultat → Apprentissage.**

Un tableau de bord seul ne constitue pas le cœur décisionnel. Chaque indicateur important doit pouvoir conduire à une investigation ou une action, puis permettre d'en mesurer le résultat.

### Couche C — Actifs et maintenance (domaine transversal)

Le modèle doit représenter plusieurs types d'actifs sans créer un schéma entièrement différent pour chaque métier :

- Véhicule léger, véhicule utilitaire, poids lourd, bus, remorque.
- Engin de chantier, matériel mobile, groupe électrogène ou équipement industriel.
- Équipement fixe ou instrumenté, si le périmètre métier l'exige ultérieurement.

Capacités communes :

- Fiche d'actif, identifiants, caractéristiques, statut et historique.
- Hiérarchie actif/composant, site, affectation et responsable.
- Compteurs typés : kilomètres, heures moteur, cycles ou autre unité déclarée.
- Plan de maintenance par date, compteur, combinaison de seuils ou condition observable.
- Demande d'intervention, ordre de travail, diagnostic, opérations, pièces, main-d'œuvre et prestataire.
- Panne, cause, symptôme, criticité, immobilisation et remise en service.
- Garantie, contrat de service, documents et pièces justificatives.
- Coûts de maintenance, coût total de possession et ventilation configurable.

Indicateurs utiles selon la qualité des données : disponibilité, respect du préventif, taux de récurrence des pannes, temps moyen de réparation, temps moyen entre pannes, coût par kilomètre/heure/cycle et coût d'immobilisation. Ces indicateurs ne doivent être publiés qu'avec une définition, une unité et une méthode de calcul explicites.

### Couche D — Intégration télématique et données opérationnelles

Sources possibles : Traccar auto-hébergé, flespi si justifié, API tierces, saisie manuelle, import de fichiers et systèmes clients.

Le système doit disposer d'un modèle canonique indépendant du fournisseur :

- identifiant de source et d'équipement ;
- lien explicite vers l'actif et le tenant ;
- temps de l'événement et temps de réception ;
- type de mesure, valeur, unité et méthode d'obtention ;
- qualité/confiance de la donnée ;
- statut de traitement, déduplication et référence source ;
- journal des erreurs et possibilité de rejouer un message.

Les données estimées, calculées, saisies manuellement et mesurées par un capteur doivent rester distinguables.

### Couche E — Packs métier

Les packs métier activent les objets, formulaires, contrôles et workflows nécessaires à une activité. Ils ne doivent pas répliquer tout le cœur technique.

- **Transport/logistique :** missions, ordres de transport, chargement/livraison, conducteurs, heures de conduite si la donnée juridiquement requise et disponible, documents métier.
- **BTP/engins :** chantier, affectation d'engins, heures productives, transferts de sites, coûts par chantier, pannes bloquantes.
- **Industrie/services :** sites, actifs critiques, ordres de travail, interventions terrain et engagements de service.
- **Distribution :** tournées, livraisons et coût par activité.
- **Location :** disponibilité, contrat de location, inspection départ/retour et dommages.

Le MVP ne met pas toutes ces fonctionnalités en production. Il prépare des points d'extension et en active un sous-ensemble limité.

### Couche F — Packs pays et réglementaires

Le pays et le secteur déterminent les règles réellement applicables, mais ne doivent pas dupliquer l'application.

Chaque pack doit contenir des sources, versions, dates de validité, conditions d'applicabilité, contrôles, preuves requises, tests et validation. Un nouveau pays ne doit jamais consister en un fork du code source.

---

## 4. Le cœur décisionnel en pratique

### Contrat minimal d'une règle

Chaque règle doit comporter :

- `rule_id`, version et état de publication ;
- catégorie : gestion, maintenance, qualité des données, politique interne ou réglementation ;
- portée : produit, pays, métier, tenant, organisation/site ou actif autorisé ;
- conditions d'applicabilité ;
- paramètres et unités ;
- données/proofs requises ;
- logique déclarative, testable et sans code arbitraire ;
- source réglementaire si la règle prétend traduire un texte officiel ;
- période de validité ;
- criticité, responsable de validation et historique d'approbation ;
- action attendue et règle d'escalade.

### Hiérarchie de configuration

Ordre suggéré : **valeurs par défaut du produit → pack pays → pack métier → tenant → organisation/site → exception d'actif autorisée**.

La priorité et les droits d'override doivent être définis. Une configuration plus spécifique ne doit pas neutraliser silencieusement une règle obligatoire ou une contrainte de sécurité. Les changements importants demandent une approbation et prennent effet à une date déterminée.

### Variables qui doivent être configurables

- Catégories d'actifs et attributs complémentaires.
- Seuils et périodicités de maintenance.
- Unités, méthodes de calcul et définitions de KPI.
- Seuils de coût, budget, consommation et immobilisation.
- Centres de coûts et règles d'allocation.
- Destinataires, escalades, délais, approbateurs et circuits de validation.
- Politiques de rétention, selon les obligations légales et contractuelles applicables.
- Tarification SaaS, limites d'offres et modules activés.
- Paramètres commerciaux et fiscaux pertinents, une fois la règle validée et son champ d'application correctement modélisé.

### Ce qui ne doit pas être rendu librement modifiable

Les règles d'isolement des tenants, les permissions de base, les contraintes d'intégrité, les protections contre l'exécution de code dangereux et les conditions nécessaires à la sécurité du système restent des invariants techniques. Les utilisateurs configurent des politiques de gestion dans un cadre contrôlé, pas le fonctionnement interne arbitraire de la plateforme.

---

## 5. Périmètre MVP recommandé : un cas d'usage transversal, pas un seul métier complet

L'erreur serait de vouloir construire dès la première version tous les métiers, mais également de choisir un métier dont tous les besoins détermineraient le cœur du produit.

La meilleure unité de cadrage est un **workflow de valeur transversal** que plusieurs métiers peuvent utiliser :

> **Maîtriser le coût et réduire l'immobilisation d'un véhicule ou d'un engin grâce à des données fiables, à un entretien anticipé, à une décision explicable et à une intervention suivie.**

Pour tester réellement la réutilisabilité, rechercher deux partenaires de conception de profils différents (par exemple, une flotte transport/logistique et une entreprise utilisant des engins sur sites). Les deux doivent tester le même noyau d'actif-maintenance-coût-décision. Ne développer que les différences métier indispensables au pilote.

### MVP — Obligatoire

1. Administration tenant, utilisateurs, rôles, audit et documents.
2. Référentiel d'actifs configurable avec profils véhicule/engin.
3. Compteurs manuels et connexion Traccar pour les actifs compatibles.
4. Plans de maintenance préventive basés sur dates et compteurs.
5. Demandes d'intervention, ordres de travail, coûts, pièces minimales et clôture.
6. Budget/coûts réalisés/écarts simples et expliqués.
7. Règles de déclenchement, exceptions, actions et approbations.
8. Tableau de bord décisionnel pour coûts, disponibilité, maintenance due, anomalies et actions ouvertes.
9. Gestion des variables par tenant, versionnement et historique.
10. Premier registre de contrôles documentaires/réglementaires validés, limité au périmètre pilote.
11. Exports et rapports essentiels.
12. Tests d'isolation multi-tenant, sauvegarde/restauration et supervision.

### À différer

- Prédiction IA généralisée ou promesse de panne anticipée sans données adaptées.
- ERP complet, comptabilité générale, télédéclaration fiscale ou facturation universelle.
- Optimisation sophistiquée de tournées et système TMS complet.
- Éditeur universel de scripts/règles.
- Connexion de tous les modèles de boîtiers du marché.
- Intégration flespi en production sans lacune concrète identifiée.
- Développement simultané de tous les packs métier et pays.
- Microservices distribués, Kafka ou plateforme de données complexe avant une justification mesurée.

### Définition d'un MVP opérationnel

Un gérant doit pouvoir créer un actif, définir un seuil d'entretien, enregistrer ou recevoir un compteur, voir l'approche de l'échéance, ouvrir un ordre de travail, tracer les coûts et la remise en service, puis comprendre dans le tableau de bord si l'action a réduit l'écart ou l'immobilisation.

Ce parcours doit passer de bout en bout, avec des tests et des preuves de recette, avant que le produit soit déclaré opérationnel.

---

## 6. Télématique : Traccar d'abord, flespi si une lacune est prouvée

### Traccar

La documentation officielle actuelle de Traccar décrit une API REST, une API WebSocket pour les mises à jour en direct et des mécanismes de transfert des positions, événements et données brutes. Le transfert peut prendre plusieurs formes. Les tentatives de reprise sont configurables mais limitées : un message ne doit donc pas être considéré comme garanti simplement parce que le forwarding est activé.

Sources :
- API : https://www.traccar.org/api-reference/
- WebSocket/API : https://www.traccar.org/traccar-api/
- Forwarding : https://www.traccar.org/forward/
- Architecture : https://www.traccar.org/architecture/

### Implémentation recommandée

- Intégration par API/forwarding documenté, sans dépendance au schéma SQL interne de Traccar.
- Adaptateur télématique dans l'architecture modulaire du SaaS ; pas besoin d'en faire immédiatement un microservice autonome.
- Réception persistante, validation, idempotence, déduplication, journal d'ingestion, reprises et file d'échec.
- Contrôle périodique de cohérence entre données reçues et historique disponible afin de repérer les pertes.
- Association et autorisation explicites entre équipement, actif et tenant.
- Connexion des événements aux règles uniquement après normalisation et évaluation de la qualité.

### Limites à reconnaître

La position GPS ne garantit pas la disponibilité du kilométrage réel, des heures moteur, du carburant, du CAN/OBD, des codes de défaut ou de la température. Ces données dépendent du matériel, du protocole, du câblage, des capteurs et du décodage réellement disponibles.

Le SaaS doit fonctionner sans télématique, avec saisie manuelle ou import contrôlé, et afficher l'origine/qualité de chaque valeur.

### flespi

La tarification officielle consultée affiche un forfait commercial de départ à 130 €/mois, avec un quota de base annoncé de 1 000 appareils sur l'offre Start et des limites/coûts additionnels selon les ressources. Le plan gratuit annonce 10 appareils pour les tests. Le prix exact doit être revérifié au moment d'une décision d'achat.

Source : https://flespi.com/pricing

Déclencheurs possibles d'activation : protocole nécessaire réellement absent de Traccar, normalisation d'un équipement spécifique difficile à maintenir, exigences de flux/API satisfaites plus efficacement par flespi ou demande contractuelle d'un client. Documenter coût par actif/mois, résidence des données, sous-traitance et possibilités de sortie avant d'activer le service.

---

## 7. Réglementation : conception prudente, sourcée et limitée à ce qui est validé

Le cœur décisionnel doit faciliter la conformité et la preuve, mais ne doit jamais prétendre garantir universellement la conformité juridique de tous les clients.

### Données personnelles et géolocalisation

La loi algérienne n° 25-11 du 24 juillet 2025 modifie et complète la loi n° 18-07. Le Journal officiel prévoit notamment des mesures de sécurité, un registre des opérations dans les conditions prévues, une étude d'impact lorsqu'un traitement est susceptible de présenter un risque élevé et des obligations de notification des violations. Les articles ajoutés encadrent aussi les transferts internationaux et l'évaluation de la protection offerte par le pays ou l'organisation de destination.

Source officielle : https://www.joradp.dz/FTP/jo-francais/2025/F2025048.pdf

**Correction importante :** la loi consultée ne permet pas à elle seule d'affirmer que toutes les données personnelles doivent dans tous les cas être hébergées localement par défaut. Il faut évaluer les règles de transfert applicables, les éventuelles conditions imposées par l'ANPDP et les exigences particulières du secteur/client. L'hébergement en Algérie peut être un choix fort de souveraineté et de réduction du risque, mais la justification juridique doit être précise.

Le produit doit soutenir : finalité et catégories de données, registre de traitements, droits d'accès, traçabilité des consultations sensibles, paramètres de rétention, gestion des incidents, export/suppression selon les obligations et processus de revue des traitements à risque. La répartition des rôles responsable du traitement/sous-traitant doit être contractualisée.

### Code de la route et conducteurs professionnels

Le Journal officiel n° 36 du 17 mai 2026 publie la loi n° 26-09 du 12 mai 2026 portant Code de la route. Les articles 79 à 81 traitent notamment du brevet professionnel de certaines catégories de conducteurs professionnels, de conditions à respecter et de durées de conduite/repos. L'article 96 prévoit le contrôle technique périodique selon la réglementation applicable.

Source officielle : https://www.joradp.dz/FTP/jo-francais/2026/F2026036.pdf

Le document initial mentionne un CAP exigé dès le 15 juin 2026. Des publications de presse font référence à une instruction ministérielle datée du 29 janvier 2026, mais cette instruction primaire doit être récupérée et conservée dans le registre documentaire avant de créer une règle juridique automatisée. Il ne faut pas automatiquement confondre la désignation « Certificat d'aptitude professionnelle (CAP) » utilisée dans les annonces avec l'expression « brevet professionnel » du nouveau Code sans vérifier la correspondance documentaire et les dispositions transitoires.

Le Code de 2026 précise à son article 188 que les textes d'application antérieurs demeurent applicables jusqu'à la publication des textes d'application correspondants. L'article 187 indique que les modalités d'application de certains chapitres peuvent relever de textes réglementaires. Le registre doit donc stocker le texte, la date de publication, l'article, les textes d'application et l'avis du valideur, pas simplement une date isolée.

### DED et opérations d'export

Les articles de presse consultés décrivent une exigence de référence DED à partir du 4 octobre 2026 liée à l'export maritime et au système ALCES, avec mention dans les instructions d'expédition/connaissements, selon une note attribuée à Maersk Algérie. Cela ne suffit pas à convertir l'affirmation en règle générique pour toute activité de transport ou tous modes d'exportation.

Avant implémentation : obtenir la note source de l'armateur ou une instruction officielle douanière, déterminer les opérations et documents concernés, identifier le rôle du tenant (exportateur, déclarant, transporteur ou prestataire) et encadrer la règle sur cette portée précise.

### TVA et fiscalité

La DGI indique un taux normal de TVA de 19 % et un taux réduit de 9 %, le taux réduit s'appliquant aux opérations énumérées par les textes fiscaux. Cela ne justifie pas de laisser un tenant choisir librement 9 % ou 19 % sur n'importe quelle facture.

Source officielle : https://www.mfdgi.gov.dz/fr/professionnels/services-pro/regime-reel/la-taxe-sur-la-valeur-ajoutee

Si la fiscalité est intégrée : la catégorie d'opération, le régime fiscal déclaré, la période, la base légale, le taux applicable et les exemptions doivent être liés à des règles validées. Une facture du MVP peut être différée ou rester un document opérationnel sans prétention de comptabilité/fiscalité complète.

### Statut des règles réglementaires

Utiliser au minimum les états : `draft`, `source_pending`, `legal_review`, `approved`, `effective`, `superseded`, `suspended`.

Une règle non sourcée ou dont la date d'effet n'est pas confirmée ne doit pas déclencher un message catégorique « non conforme ». Elle peut produire une alerte de vérification avec mention claire de l'incertitude.

---

## 8. Indicateurs du cœur décisionnel

Le MVP doit proposer peu d'indicateurs, mais des indicateurs explicables :

- coût de maintenance par actif sur une période ;
- dépenses prévues versus réalisées ;
- immobilisation et durée de réparation, si les horaires de début/fin sont disponibles ;
- respect des échéances préventives ;
- heures/km/cycles valides et couverture de données ;
- récurrence de pannes par famille, si la classification est assez fiable ;
- coûts par site, centre de coûts ou activité, selon les règles d'allocation configurées ;
- exceptions ouvertes, actions en retard et résultats mesurés.

Chaque métrique doit avoir une définition, une unité, un périmètre, une méthode de calcul, une provenance et des règles de qualité. Les ratios ne doivent pas être calculés avec un dénominateur nul, estimé sans transparence ou incomplet sans avertissement.

### Valeur économique

Le retour sur décision (RDV) peut être défini comme : pertes évitées + gains réalisés − coûts des actions, avec méthode de mesure et période fixées. Il faut éviter de compter deux fois une même économie et distinguer gain estimé, gain validé et gain effectivement constaté.

---

## 9. Architecture technique de réalisation

Compte tenu du socle déjà amorcé dans le projet, garder le stack actuel à moins qu'un audit concret ne révèle une raison de le changer : Next.js, NestJS modulaire, PostgreSQL, Redis/BullMQ, tests automatisés et déploiement Docker.

### Découpage NestJS proposé

- `tenant-iam` : tenants, organisations, utilisateurs, rôles, permissions.
- `configuration` : paramètres, définitions, versions et règles de portée.
- `assets` : actifs, composants, compteurs et affectations.
- `maintenance` : plans, demandes, ordres de travail, pannes, interventions.
- `cost-control` : coûts, budgets, allocations, KPI et écarts.
- `decision` : règles, exécutions, exceptions, dossiers de décision, actions et résultats.
- `compliance` : sources, versions, champs d'application, preuves et revue des règles.
- `telematics` : connecteurs, ingestion, canonical events, qualité et reprise.
- `documents` : fichiers, métadonnées, accès, rétention et liens d'audit.
- `notifications` : emails/SMS éventuels, préférences et escalades.

C'est un découpage logique en modules, pas une obligation de déployer un microservice par module.

### Protection multi-tenant

- Toutes les entités métier appartenant à un client doivent avoir une portée tenant explicite.
- PostgreSQL RLS et transactions/contextes tenant correctement établis.
- Tests d'isolation sur API, workers, imports, exports, stockage de documents et connecteurs.
- Aucun secret d'un connecteur tiers dans un champ métier exposé.
- Audit des changements de paramètres, des règles et des décisions sensibles.

### Données de preuve

Une décision importante doit permettre de retrouver : la règle et sa version, le snapshot des entrées, la provenance des observations, l'état de qualité des données, le résultat de l'évaluation, l'approbateur, l'action déclenchée et son issue. Le système doit distinguer la confiance dans les données de la confiance dans une recommandation.

---

## 10. Feuille de route réaliste par portes de validation

Les durées ci-dessous sont des estimations, à recalibrer après audit du code et disponibilité des personnes métier.

### Gate 0 — Recentrage produit (1–2 semaines)

- Faire l'inventaire des fonctions réellement exécutées et testées.
- Choisir le workflow transversal du MVP.
- Recruter deux partenaires de conception aux profils métiers différents si possible.
- Définir glossaire, modèle d'actif, coût, compteur, règle, preuve, exception, décision et action.
- Constituer le registre initial des affirmations réglementaires, sources et points en attente.

**Exit criteria :** backlog accepté, aucune exigence légale non sourcée traitée comme règle certaine, workflow démontrable défini.

### Gate 1 — Fondations (2–4 semaines)

- Tenants, IAM, organisation/sites, rôles, audit, configuration versionnée.
- Modèle d'actifs et documents.
- Tests RLS et tâches d'arrière-plan.

**Exit criteria :** isolation vérifiée ; paramètres autorisés modifiables sans modifier le code.

### Gate 2 — Maintenance opérationnelle (3–4 semaines)

- Compteurs, plans préventifs, alertes d'échéance.
- Ordres de travail, coûts et clôture.
- Rapports simples d'immobilisation et de maintenance.

**Exit criteria :** scénario complet de maintenance exécuté et testé.

### Gate 3 — Connecteur télématique (2–4 semaines, en parallèle si possible)

- Traccar, association équipement/actif, normalisation, ingestion persistante et reprise.
- Simulation puis test avec au moins un équipement réel représentatif ; ajouter un second type selon le marché pilote.

**Exit criteria :** trace complète d'une mesure reçue jusqu'à une règle/échéance, et tests des erreurs/doublons/coupures.

### Gate 4 — Décision et contrôle de gestion (3–4 semaines)

- Indicateurs coûts/budget/réel/écarts.
- Règles déclaratives, cas d'exception, approbation, action et résultat.
- Premier lot de règles internes et de contrôles réglementaires sourcés.

**Exit criteria :** une exception produit une décision explicable et une action suivie.

### Gate 5 — Stabilisation (2–3 semaines)

- Sécurité, tests fonctionnels, observabilité, restauration testée, documentation, exports et correction des blocages.

**Exit criteria :** aucun défaut bloquant connu ; restauration démontrée ; procédures de support et d'incident prêtes.

### Gate 6 — Pilote (4–6 semaines d'usage réel)

- Utilisation quotidienne par les partenaires pilotes.
- Mesure d'usage, disponibilité, qualité des données, maintenance à temps, coûts et valeur obtenue.
- Arbitrage du prochain pack métier à partir des besoins observés.

**Exit criteria :** utilisateurs capables de réaliser les parcours sans aide permanente, valeur documentée, conditions de facturation et coût de service connus.

---

## 11. Mesures de réussite du pilote

Ne pas définir la réussite par le nombre d'écrans ou de modules créés. Mesurer plutôt :

1. Part des actifs du pilote avec une fiche exploitable et un responsable identifié.
2. Part des plans de maintenance avec échéance/compteur de référence valide.
3. Entretiens dus, réalisés à temps et en retard.
4. Temps entre détection, décision, intervention et remise en service.
5. Part des coûts affectés à un actif et reliés à une pièce justificative ou à une source déclarée.
6. Complétude et qualité des données télématiques/manualisées.
7. Délai de traitement des exceptions et taux de clôture des actions.
8. Nombre de configurations réalisées par l'utilisateur sans assistance développeur.
9. Incidents de sécurité ou de séparation de tenants : cible zéro.
10. Coût de mise en service et de support par tenant, et volonté de payer observée.

Les objectifs numériques doivent être fixés après le relevé initial. Sinon, les pourcentages et seuils deviennent arbitraires et ne reflètent pas l'état réel du parc.

---

## 12. Avantage concurrentiel crédible

La différenciation ne doit pas être « nous avons du GPS » ou « nous sommes conformes à toute la réglementation ». Les acteurs existants revendiquent déjà différents services de tracking et de gestion de flotte, et certains produits de location gèrent également contrats, factures et alertes d'entretien.

L'avantage à construire est l'intégration cohérente de :

- actifs connectés ou non ;
- maintenance préventive/proactive ;
- coût total et allocation ;
- explication des écarts et causes ;
- règles configurables et contrôles sourcés ;
- preuve et piste d'audit ;
- décision, approbation et action mesurée ;
- déploiement et support adaptés au marché algérien ;
- extension métier/pays sans forks.

Il faudra le démontrer avec des résultats mesurés chez les pilotes. Ne pas affirmer que les concurrents locaux ne peuvent pas offrir une capacité sans étude comparative précise et datée.

---

## 13. Priorités de décision immédiate

1. **Renommer le projet produit autour du décisionnel et de la maintenance des actifs**, plutôt que du transport de marchandises.
2. Valider le workflow transversal : actif → donnée/compteur → contrôle → décision → maintenance/action → coût/résultat.
3. Choisir deux partenaires de conception de profils différents si possible, mais garder un seul noyau fonctionnel commun.
4. Figer une première version du modèle `Asset`, `MeterReading`, `MaintenancePlan`, `WorkOrder`, `CostEntry`, `Evidence`, `Rule`, `Exception`, `DecisionCase`, `Action`, `Outcome`.
5. Intégrer Traccar en premier avec une architecture de connecteur remplaçable ; ne pas engager flespi tant qu'une lacune n'est pas prouvée.
6. Limiter les contrôles réglementaires à un registre de règles sourcées et validées. Traiter le CAP/brevet professionnel, la DED et la TVA comme des dossiers de validation documentaire, pas comme de simples valeurs de configuration.
7. Ne pas construire un ERP fiscal ou un TMS complet dans le MVP.
8. Exiger pour toute tâche d'agent IA : fichiers modifiés, migration éventuelle, tests exécutés, résultat, limites connues et procédure de vérification.
9. Refuser tout statut « terminé » sans preuve de fonctionnement sur le scénario utilisateur de bout en bout.

---

## 14. Sources et réserves de vérification

- **Traccar API Reference** : https://www.traccar.org/api-reference/
- **Traccar API et WebSocket** : https://www.traccar.org/traccar-api/
- **Traccar Forwarding** : https://www.traccar.org/forward/
- **Traccar Architecture** : https://www.traccar.org/architecture/
- **flespi Pricing** : https://flespi.com/pricing
- **Journal officiel algérien n° 48 du 24 juillet 2025, loi n° 25-11** : https://www.joradp.dz/FTP/jo-francais/2025/F2025048.pdf
- **Journal officiel algérien n° 36 du 17 mai 2026, loi n° 26-09 portant Code de la route** : https://www.joradp.dz/FTP/jo-francais/2026/F2026036.pdf
- **Direction générale des impôts, TVA** : https://www.mfdgi.gov.dz/fr/professionnels/services-pro/regime-reel/la-taxe-sur-la-valeur-ajoutee
- **Geoflotte, description publique des services** : https://www.geoflotte.com/fr/faq
- **RafRaf Car, offres publiques** : https://rafrafcar.com/

Les sources commerciales décrivent les offres telles que leurs éditeurs les présentent, pas une évaluation indépendante. Les sources de presse relatives au CAP et à la DED doivent être complétées par les instructions primaires correspondantes avant de devenir des règles de conformité automatisées. La présente note constitue un cadrage produit/technique et non un avis juridique ou fiscal.
