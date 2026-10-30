# AGENTS.md — MASTER OPERATING CONTRACT

**Produit :** Plateforme SaaS décisionnelle, contrôle de gestion et maintenance proactive/préventive/prédictive des actifs opérationnels  
**Version du contrat :** 1.0  
**Date :** 2026-10-23  
**Cible d'exécution :** Google Antigravity IDE / agents de développement  
**Marché de départ :** Algérie ; architecture extensible à d'autres pays sans fork applicatif  
**Statut :** Référence de travail principale pour les agents. Les éléments réglementaires non vérifiés ne sont pas des règles de production.

---

## 0. INSTRUCTIONS PRIORITAIRES À L'AGENT

Tu interviens sur un dépôt existant ou en cours de construction. Tu dois d'abord comprendre ce qui existe, puis améliorer le produit par incréments vérifiables. Tu n'as pas le droit de considérer qu'un module existe parce qu'un document le décrit, qu'un écran s'affiche, ou qu'un agent précédent affirme l'avoir terminé.

### 0.1 Mission

Construire un **MVP utilisable de bout en bout** dont le cœur de valeur est :

1. le **décisionnel et le contrôle de gestion** : coûts, budgets, écarts, risques, explications, arbitrages, actions et résultats ;
2. la **gestion de maintenance** des actifs opérationnels : préventive d'abord, proactive ensuite, prédictive uniquement lorsque les données le justifient ;
3. un **socle commun multi-tenant et multi-métier** ;
4. une **couche télématique interchangeable**, avec Traccar auto-hébergé en première intégration et flespi uniquement si un besoin vérifié le justifie ;
5. des **packs métier/pays versionnés**, paramétrables et validables ;
6. une expérience **Activation-First** : aucun nouvel utilisateur ne doit tomber sur une page vide ou devoir configurer toute la plateforme avant d'en comprendre la valeur.

Les véhicules, poids lourds, engins, remorques et équipements sont des types d'actifs pris en charge. **Le produit n'est pas exclusivement un TMS, un logiciel de transport, une application GPS ou un SaaS BTP.** Le BTP/engins et le transport/logistique sont des domaines d'application parmi d'autres.

### 0.2 Interdictions absolues

- Ne pas réécrire le dépôt ni remplacer sa stack sans preuve technique et décision documentée.
- Ne pas générer une nouvelle architecture parallèle simplement parce qu'elle est plus familière.
- Ne pas déclarer une tâche terminée sans avoir exécuté les contrôles disponibles et enregistré les résultats.
- Ne pas inventer une loi, un article, une obligation, un taux fiscal, un seuil, un prix, une date d'entrée en vigueur, une capacité fournisseur ou un résultat de test.
- Ne pas présenter une règle juridique en brouillon comme une règle approuvée ou une garantie de conformité.
- Ne pas placer des paramètres métier modifiables dans le code, les migrations, les composants UI ou les constantes partagées lorsqu'ils doivent relever de la configuration tenant/pack/pays.
- Ne pas autoriser du code arbitraire ou des scripts utilisateurs comme moteur de règles.
- Ne pas mélanger les données de démonstration avec les données opérationnelles, les KPI de production ou les calculs de valeur réelle.
- Ne pas exposer de secret, de jeton Traccar/flespi, de mot de passe ou de donnée personnelle dans le frontend, le dépôt ou les logs.
- Ne pas appliquer une migration destructive, purger des données, supprimer un service ou remplacer un fichier existant sans évaluer les impacts et sans préserver les données.
- Ne pas ajouter des microservices, Kafka, un entrepôt de données distribué ou de l'IA/ML avancée sans besoin mesuré et décision d'architecture (ADR).
- Ne pas interrompre le travail pour demander une confirmation sur une étape non destructive et réversible lorsque les exigences sont suffisamment spécifiées. Signaler les ambiguïtés dans le rapport et avancer avec l'option la moins risquée.

### 0.3 Ordre de priorité en cas de conflit

1. Sécurité, confidentialité et intégrité des données.
2. Comportement réellement observé dans le dépôt et tests existants.
3. Ce fichier `AGENTS.md`.
4. Décisions d'architecture acceptées (`docs/decisions/` ou emplacement équivalent).
5. Contrats et exigences produits approuvés.
6. Style et conventions locaux du code.
7. Préférences personnelles de l'agent.

Une règle réglementaire n'est « approuvée » que si son dossier de preuve satisfait les critères de la section 9.

---

## 1. PROTOCOLE DE TRAVAIL OBLIGATOIRE

À chaque nouvelle tâche ou reprise de session :

1. Lire ce fichier et les éventuelles instructions `AGENTS.md`/`GEMINI.md` plus spécifiques dans le sous-répertoire concerné.
2. Examiner `git status`, les scripts `package.json`, les fichiers de configuration, les tests et la structure du dépôt avant toute modification.
3. Identifier les composants déjà présents et réutilisables. Ne jamais supposer qu'un état mentionné dans une ancienne conversation est encore exact.
4. Formuler un plan court, limité à une tranche fonctionnelle verticale et testable.
5. Mettre à jour ou ajouter les tests avant ou en même temps que le comportement, selon le style du dépôt.
6. Implémenter le plus petit parcours qui fonctionne de l'interface à la base de données, y compris autorisation, validation, audit et erreurs.
7. Exécuter les tests, lint, typecheck et build pertinents. Ne pas masquer un échec par une modification de configuration destinée uniquement à rendre la commande verte.
8. Relire les changements (`git diff`), chercher les régressions et vérifier qu'aucune donnée/secrét n'a été introduit.
9. Mettre à jour les documents d'architecture et la checklist de progression.
10. Produire un rapport court avec : réalisé, fichiers touchés, commandes exécutées, résultat exact, risques/restes à faire, gate atteint ou non atteint.

### 1.1 Rapport d'avancement

Créer/utiliser `docs/agent-reports/` (ou conserver un répertoire de rapports déjà adopté dans le dépôt). Utiliser des noms stables, par exemple :

- `00-repository-audit.md`
- `01-activation-first.md`
- `02-tenant-isolation.md`
- `03-assets-maintenance.md`
- `04-telematics.md`
- `05-decision-engine.md`
- `06-regulatory-packs.md`
- `07-pilot-readiness.md`

Ne pas créer tous ces rapports à l'avance si cela produit du bruit. Ajouter le rapport correspondant au travail effectivement réalisé.

Chaque affirmation « PASS » doit être étayée par une commande, un résultat de test, une capture, un journal ou une recette reproductible. Sinon utiliser `NOT VERIFIED`, `BLOCKED` ou `PARTIAL`.

### 1.2 Premier passage obligatoire dans un dépôt existant

La toute première intervention consiste en un **audit non destructif**. Elle doit établir :

- structure réelle du monorepo et des applications ;
- gestionnaire de paquets et scripts réellement présents ;
- versions runtime, frameworks, base de données et Redis ;
- état Git, migrations, schéma, tests, lint, typecheck et build ;
- état des environnements Docker et noms des services, sans les recréer automatiquement ;
- fonctionnalités existantes réellement testées ;
- écarts par rapport au présent contrat ;
- tranche fonctionnelle prioritaire et risque bloquant.

Livrable : `docs/agent-reports/00-repository-audit.md`. L'audit ne doit pas exposer de secrets ni copier le contenu des fichiers `.env`.

Ensuite, reprendre depuis la première gate incomplète. Ne pas recommencer de zéro sans preuve que le code actuel doit être supprimé.

---

## 2. IDENTITÉ PRODUIT ET UTILISATEURS

### 2.1 Positionnement

Plateforme SaaS de **pilotage décisionnel, contrôle de gestion et maintenance des actifs opérationnels**, enrichie de données issues des opérations, documents, capteurs et sources externes.

La boucle fonctionnelle canonique est :

**Données → Preuves → Contrôles → Exceptions → Analyses → Décisions → Actions → Résultats → Apprentissage.**

L'IA peut assister l'analyse, mais : **l'IA conseille, les politiques gouvernent, les humains autorisent, les systèmes exécutent dans les limites approuvées.**

### 2.2 Utilisateurs typiques

- Administrateur de la plateforme SaaS.
- Administrateur du tenant.
- Direction / gérant.
- Contrôleur de gestion / responsable financier.
- Responsable de flotte ou de parc d'équipements.
- Responsable maintenance / planificateur.
- Technicien ou intervenant terrain.
- Responsable conformité / auditeur.
- Lecteur ou analyste.

Les rôles et permissions doivent être configurables et testés ; ne pas fonder la sécurité sur le masquage d'un bouton uniquement.

### 2.3 Domaines métier potentiels

Le socle doit pouvoir accueillir, sans faire de ces domaines des produits séparés :

- véhicules légers et utilitaires ;
- poids lourds et transport ;
- engins de chantier ;
- équipements industriels ou techniques ;
- logistique, distribution et services terrain ;
- location ou exploitation d'actifs, selon le pack métier.

Le MVP doit rester restreint : valider un parcours commun et deux profils représentatifs d'actifs (par exemple véhicule routier et engin à heures moteur), sans prétendre livrer l'intégralité de chaque industrie.

---

## 3. PRINCIPES ARCHITECTURAUX NON NÉGOCIABLES

### 3.1 Réutiliser le socle existant

Le contexte de projet connu mentionne un monorepo TypeScript avec Next.js pour le web, NestJS pour l'API, PostgreSQL/RLS, Redis/BullMQ et des tests d'isolation tenant. **Ces éléments sont des indices à vérifier dans le dépôt, pas une autorisation de supposer les versions ou l'état d'implémentation.**

- Inspecter les fichiers réels avant de modifier des dépendances.
- Conserver l'architecture en place lorsqu'elle répond au besoin.
- Privilégier un **monolithe modulaire NestJS** et des workers, sauf preuve de nécessité d'isoler un service.
- Utiliser PostgreSQL pour les données métier cohérentes, Redis/BullMQ pour les traitements asynchrones si déjà présents.
- Ne pas ajouter de technologie par mode ou préférence sans ADR et bénéfice démontré.

### 3.2 Multi-tenant sécurisé dès le départ

Modèle logique courant :

`Tenant → Organization/Site → Domain/Process → Asset/Entity`

- Toute donnée appartenant à un tenant doit avoir une portée tenant explicite ou hériter d'une relation vérifiée.
- Appliquer PostgreSQL Row-Level Security (RLS) comme défense en profondeur.
- Le contexte tenant doit être établi côté serveur, à partir d'une identité autorisée, jamais accepté aveuglément depuis le navigateur.
- Utiliser des transactions et `SET LOCAL`/mécanisme équivalent compatible avec le pool de connexions pour éviter toute fuite de contexte entre requêtes.
- Les workers asynchrones doivent reconstituer et vérifier le contexte tenant de chaque tâche.
- Tester accès inter-tenant en lecture, écriture, export, fichiers, recherche, notifications et jobs.
- Échouer fermé : absence de contexte valide signifie absence d'accès aux données tenant.
- N'introduire une base séparée par tenant qu'après besoin démontré et décision documentée ; elle n'est pas la stratégie par défaut du MVP.

### 3.3 Le code n'est pas le catalogue métier

À conserver dans le code : types, invariants de sécurité, validations structurelles, algorithmes génériques, contraintes d'intégrité et mécanismes techniques.

À conserver dans les données de configuration/versionnées lorsqu'ils peuvent varier :

- seuils économiques, limites et montants ;
- intervalles et conditions de maintenance ;
- unités et règles de conversion spécifiques au domaine ;
- catégories métier, statuts configurables et motifs d'exception ;
- circuits d'approbation et niveaux de sévérité ;
- méthodes analytiques sélectionnées par le tenant ;
- devise, paramètres pays et configurations fiscales ;
- délais d'alerte et destinataires ;
- objectifs/KPI et périmètres de calcul ;
- disponibilité de modules et fonctionnalités par offre.

Ne pas créer un système de configuration tellement générique qu'il devient impossible à comprendre. Préférer des schémas typés, des formulaires guidés, des limites explicites et des versions.

### 3.4 Historique et reproductibilité

Une modification de paramètre ou de règle ne doit pas modifier silencieusement l'explication d'une décision passée. Conserver au minimum : identifiant et version de règle, version de configuration, date de validité, données/observations utilisées, résultat du contrôle et acteur de validation.

Ne pas prétendre fournir une immutabilité cryptographique complète si elle n'a pas été développée et testée. Le journal d'audit applicatif doit être protégé contre les modifications par les rôles ordinaires et documenter ses limites.

---

## 4. PÉRIMÈTRE PRODUIT DU MVP

### 4.1 Capacités à livrer en priorité

#### A. Accès et gestion SaaS
- authentification ;
- tenants, utilisateurs, rôles et autorisations ;
- identité de tenant et paramètres de base ;
- journalisation des actions sensibles ;
- isolation démontrée par tests.

#### B. Registre d'actifs
- création/import d'un actif ;
- catégories et attributs adaptés au type d'actif ;
- identifiant interne et identifiants externes ;
- site, responsable et statut ;
- compteur(s) applicables : kilométrage, heures moteur ou compteur générique ;
- documents, dates et historique ;
- provenance/qualité des données.

#### C. Maintenance
- plans préventifs par date, distance, heures ou autre métrique prise en charge ;
- modèles d'intervention configurables ;
- demandes et ordres de travail ;
- affectation et statuts ;
- pièces, main-d'œuvre et prestataires lorsque dans le périmètre implémenté ;
- durée d'immobilisation ;
- clôture documentée, historique et coûts.

Les seuils par défaut des packs sont des **suggestions opérationnelles**, non des prescriptions universelles du constructeur. Une recommandation doit indiquer sa provenance et être modifiable par un rôle autorisé.

#### D. Contrôle de gestion initial
- enregistrement des dépenses pertinentes ;
- budget de référence configurable ;
- calcul d'écarts budget/réel ;
- ventilation de coûts selon un modèle simple explicable ;
- KPI avec unité, période, formule et source ;
- signalement des données manquantes ou de faible qualité.

#### E. Télématique
- premier adaptateur Traccar ;
- liaison entre équipement télématique et actif métier ;
- positions/événements et compteurs seulement lorsqu'ils sont effectivement disponibles ;
- état de connexion et dernier message reçu ;
- traitement des doublons, données tardives et erreurs ;
- journal d'ingestion et indicateurs de santé.

#### F. Moteur décisionnel initial
- registre des règles ;
- règles déterministes versionnées ;
- évaluation et résultat explicable ;
- exception/dossier de décision ;
- responsable, échéance, niveau de criticité ;
- proposition, approbation et action ;
- suivi du résultat réel.

#### G. Activation-First
- pack de départ proposé à l'inscription ;
- environnement de démonstration alimenté ;
- démonstration du cycle décision → action → résultat ;
- parcours « configurez mon espace pour moi » ;
- parcours « je configure moi-même » ;
- import guidé des données réelles ;
- séparation et suppression contrôlée des données de démonstration.

#### H. Terrain/mobile
Le MVP couvre les actions terrain à plus forte valeur : consulter un actif/ordre de travail, saisir un compteur, enregistrer une intervention et joindre des justificatifs. Le mode hors ligne est limité à ces parcours et livré seulement avec une stratégie de synchronisation testée.

#### I. Conformité et audit
- registre sourcé des règles applicables ;
- distinction brouillon / en revue / approuvé / suspendu / remplacé ;
- preuves et historique ;
- résultats de contrôles compréhensibles ;
- aucune garantie globale et automatique de conformité.

### 4.2 À différer explicitement

- maintenance prédictive par machine learning généralisée ;
- moteur de scripts utilisateur ;
- couverture de tous les secteurs et pays ;
- intégration de tous les modèles de trackers ;
- flespi en dépendance obligatoire ;
- comptabilité générale complète, télédéclaration et ERP fiscal complet ;
- optimisation avancée de tournées ;
- microservices distribués, Kafka ou plateforme analytique séparée sans besoin mesuré.

---

## 5. ACTIVATION-FIRST : PAS DE PAGE BLANCHE

### 5.1 Expérience attendue au premier lancement

À la première connexion, l'utilisateur doit pouvoir comprendre la valeur du produit sans importer immédiatement toute sa flotte et sans modifier des paramètres avancés.

Parcours recommandé :

1. L'utilisateur choisit un pack ou répond à 3–4 questions courtes : type d'activité, familles d'actifs, ordre de grandeur, priorité initiale (coûts, disponibilité, maintenance ou contrôle).
2. Le système active une configuration par défaut versionnée, avec des suggestions clairement identifiées.
3. Un espace de démonstration montre actifs fictifs, historiques synthétiques, coûts fictifs, alertes de démonstration et décisions explicables.
4. L'utilisateur ouvre une décision de démonstration, inspecte les données et la règle, puis exécute le parcours simulé jusqu'au résultat.
5. Il peut choisir un import CSV/XLSX guidé ou la saisie manuelle pour ses vraies données.
6. Le produit affiche la qualité et les manques des données avant d'émettre des décisions opérationnelles.

### 5.2 Packs composables du MVP

Prévoir, au minimum, un socle commun et deux profils de démonstration afin de tester la transversalité :

- **Socle Actifs & Maintenance** : actif, compteurs, plans, ordres de travail, coûts, disponibilité et décisionnel.
- **Profil Véhicules & Transport** : kilométrage, conducteur si pertinent, missions/documentation si présentes dans le périmètre.
- **Profil Engins & Équipements** : heures moteur, compteur d'utilisation, site, disponibilité et maintenance.

Les packs sont des définitions de configuration versionnées et des jeux de données ; ils ne doivent pas créer des forks de code. Les règles réglementaires doivent rester séparées des suggestions opérationnelles.

### 5.3 Données de démonstration

- Utiliser des valeurs synthétiques clairement identifiées comme fictives.
- Ajouter une provenance explicite telle que `data_origin = DEMO | IMPORT | USER_ENTRY | TELEMATICS | INTEGRATION` ou un modèle équivalent existant.
- Si le dépôt a déjà un modèle mieux adapté, le réutiliser et documenter la correspondance.
- Isoler logiquement les démonstrations afin qu'elles ne contaminent ni rapports réels, ni métriques de facturation, ni audits de production.
- Ne pas utiliser de véritables noms, identifiants de personnes, plaques d'immatriculation ou dossiers client dans les seeds.
- Ne jamais présenter un coût fictif évité comme une économie réellement réalisée.
- Prévoir une action de réinitialisation/suppression contrôlée des données DEMO. Cette action ne doit jamais supprimer des données réelles.
- L'état DEMO doit être visible dans les écrans et les exports.

### 5.4 Démonstration « Aha! »

Scénario minimal : un actif synthétique dépasse un seuil de maintenance configuré ; le moteur utilise une règle de démonstration identifiée ; une exception est créée ; l'utilisateur examine la recommandation ; une action simulée crée un ordre de travail de démonstration ; le tableau de bord affiche le nouveau statut. Tous les écrans portent le statut DEMO. Les coûts et résultats sont déclarés fictifs.

Ne pas affirmer un gain de 180 000 DA ou autre montant sans dossier réel. Les valeurs du scénario doivent être marquées fictives et choisies pour démontrer la logique, pas pour simuler un résultat garanti.

### 5.5 Import réel

Le flux d'import doit :

- fournir un modèle téléchargeable ;
- valider les colonnes et types avant écriture ;
- afficher aperçu, erreurs et avertissements ;
- détecter les doublons possibles sans écraser silencieusement ;
- demander une confirmation avant la création réelle ;
- conserver la provenance et la date de l'import ;
- permettre d'annuler ou corriger selon des règles de transaction et de traçabilité.

---

## 6. MODÈLE D'ACTIFS ET DE MAINTENANCE

### 6.1 Ne pas imposer une classe véhicule unique

Le modèle doit représenter des actifs opérationnels génériques avec des types et caractéristiques configurables. Éviter une table `vehicles` contenant toutes les notions au détriment des autres actifs. Si le code existant dispose déjà d'un modèle vehicle, l'étendre de façon compatible ou introduire une abstraction à travers une migration maîtrisée ; ne pas dupliquer les entités.

Concepts à examiner avant conception du schéma :

- `Asset` / actif ;
- `AssetType` / type de l'actif ;
- `AssetIdentifier` / identifiant externe ;
- `Meter` et `MeterReading` / compteur et relevé ;
- `MaintenancePlan` ;
- `MaintenanceWorkOrder` ;
- `MaintenanceTask` / intervention ou opération ;
- `PartUsage` / pièce utilisée, si dans le périmètre ;
- `AssetDowntime` / immobilisation ;
- `CostEntry` / écriture de coût ;
- `Attachment` / pièce jointe ;
- `Evidence` / preuve ;
- `AuditEvent` / événement d'audit.

Ce sont des concepts cibles, pas l'obligation de créer des tables portant exactement ces noms. Inspecter d'abord le schéma actuel et éviter les doublons de modèle.

### 6.2 Compteurs

Chaque relevé doit au minimum rendre possible l'identification de l'actif, du type de compteur, de la valeur, de l'unité, de l'heure d'observation, de la source, de l'auteur/système et de l'état de validation.

Gérer : compteur qui recule, remise à zéro, estimation, relevé dupliqué, message tardif, unité inconnue et source non fiable. Ne pas déclencher silencieusement une maintenance sur une valeur rejetée ou ambiguë.

### 6.3 Maintenance préventive/proactive/prédictive

- **Préventive** : déclenchement par dates, kilométrage, heures moteur ou périodicité configurable.
- **Proactive** : anticipation sur seuils, tendances simples ou anomalies explicables.
- **Prédictive** : modèle statistique/ML avec qualité et volume de données démontrés, validation et métriques de performance explicites.

Ne pas étiqueter une règle de seuil comme « IA prédictive ». Dans le MVP, livrer la préventive robuste et quelques alertes proactives déterministes.

---

## 7. COEUR DÉCISIONNEL : CONTRAT FONCTIONNEL

### 7.1 Cycle

`Observation → Preuve → Contrôle → Exception → Analyse → Décision → Approbation → Action → Résultat`.

Les objets et étapes déjà présents dans le dépôt doivent être réutilisés lorsque possible.

### 7.2 Types de règles

- règles opérationnelles (maintenance, disponibilité, compteurs) ;
- règles analytiques (écarts, coûts, seuils de performance) ;
- règles de politique interne (approbations, délégations, séparation des tâches) ;
- contrôles documentaires ;
- règles réglementaires sourcées ;
- règles de qualité et confiance des données.

Chaque règle de production doit avoir un identifiant stable, une version, une portée (plateforme, pays, métier, tenant, site ou actif selon le modèle), un état, une période de validité, des paramètres typés, des tests et un propriétaire de validation.

### 7.3 Résultat d'évaluation

Une évaluation doit au minimum permettre de connaître :

- la règle et la version exécutées ;
- le sujet/actif concerné ;
- la date et les données d'entrée référencées ;
- les conditions évaluées ;
- le résultat (satisfait, non satisfait, inconnu/non évaluable) ;
- les preuves et données manquantes ;
- la raison lisible ;
- le niveau de sévérité ;
- la prochaine action suggérée et l'autorité requise.

Ne pas assimiler « pas d'alerte » à « conforme » lorsque les données nécessaires sont absentes. Prévoir l'état `UNKNOWN`/`NOT_EVALUABLE` selon la convention du dépôt.

### 7.4 Confiance de la preuve et confiance de décision

La qualité/confiance de la source de données est différente du niveau de confiance d'une recommandation. Les séparer dans le modèle et dans l'interface si des scores sont utilisés. Tout score doit documenter sa signification ; ne pas fabriquer un pourcentage pseudo-scientifique.

### 7.5 Contrôle humain et séparation des tâches

Les opérations sensibles doivent supporter les rôles demandeur, approbateur et exécutant, avec une politique configurable mais des invariants de sécurité non contournables. La même personne ne doit pas contourner une séparation obligatoire en passant par l'API, un import ou un worker.

### 7.6 Résultats financiers

Distinguer :

- coût observé ;
- coût estimé ;
- économie potentielle ;
- économie approuvée selon une méthode documentée ;
- gain effectivement réalisé et rapproché à des données réelles.

Ne jamais comptabiliser une économie hypothétique comme un gain réalisé.

---

## 8. SYSTÈME DE CONFIGURATION — ÉVITER LE HARDCODE MÉTIER

### 8.1 Modèle de paramètres

Tout paramètre modifiable doit définir, selon pertinence :

- identifiant stable ;
- type (`boolean`, `integer`, `decimal`, `string`, `enum`, `duration`, `money`, `ratio`, `unit`, `formula` limitée, etc.) ;
- portée et priorité d'héritage ;
- valeur par défaut et valeurs autorisées ;
- unité et devise si applicables ;
- date de début/fin de validité ;
- version, auteur et horodatage ;
- description et origine de la valeur ;
- besoin éventuel d'approbation ;
- historique des changements.

### 8.2 Priorité de résolution

Adopter une stratégie unique et documentée, par exemple :

`valeur spécifique de l'actif → site/organisation → tenant → pack métier → pack pays → défaut système approuvé`.

Cette priorité doit être validée avec les modèles existants. Elle ne doit pas devenir implicite ni différer entre API, workers et frontend. Expliquer la valeur finalement appliquée et d'où elle vient.

### 8.3 Pas de constantes métier cachées

Avant de créer un littéral numérique ou textuel dans le code, l'agent doit se demander s'il représente :

- un invariant technique (peut rester codé et testé) ; ou
- une règle/valeur de gestion (doit probablement être configurée et versionnée).

Les taux d'impôt, seuils de maintenance, délais d'alerte, plafonds commerciaux, seuils de coût, niveaux de service et valeurs pays ne doivent pas être présumés universels.

Ne pas surabstraire les éléments techniques : les longueurs d'identifiants, invariants de sécurité, structures d'API et règles de validation ne deviennent pas des options tenant sauf exigence explicite.

### 8.4 Paramètres dangereux

- Pas de SQL, JavaScript, Python ni expression arbitraire exécutée depuis une configuration tenant.
- Les formules doivent utiliser un langage d'expression limité, typé, sans accès réseau/fichiers et avec validation statique, ou rester dans le code générique jusqu'à ce qu'un moteur sûr soit nécessaire.
- Les changements de paramètres affectant des décisions doivent être versionnés et audités.

---

## 9. PACKS RÉGLEMENTAIRES ET CONFORMITÉ ALGÉRIENNE

### 9.1 Position de principe

Le produit aide à repérer, documenter et suivre des obligations applicables ; il ne garantit pas automatiquement la conformité juridique globale d'une entreprise.

Les règles ne doivent pas être créées à partir d'un souvenir de modèle ou d'une synthèse de presse seule. Utiliser des sources primaires : Journal officiel, ministère/direction générale compétente, texte officiel ou document administratif applicable. Quand la source primaire ou la portée d'application n'est pas confirmée, conserver l'élément en `SOURCE_PENDING`/`DRAFT` et empêcher son affichage comme obligation validée.

### 9.2 Enregistrement réglementaire minimal

Prévoir les champs équivalents à :

- `rule_id`, `version`, `title`, `domain`, `jurisdiction` ;
- référence précise du texte, article/section lorsque disponible, URL de source ;
- date de publication, date d'entrée en vigueur et fin d'effet si connue ;
- conditions d'applicabilité et exclusions connues ;
- preuves/données requises ;
- description du contrôle et tests ;
- statut documentaire : `SOURCE_PENDING`, `DRAFT`, `IN_REVIEW`, `APPROVED`, `SUSPENDED`, `SUPERSEDED` ;
- réviseur/approbateur, date de revue et commentaire de validation.

Les noms de statuts peuvent s'adapter aux conventions du dépôt, mais la différence entre brouillon, validé et remplacé est obligatoire.

### 9.3 Thèmes initiaux à analyser, pas à activer aveuglément

- échéances documentaires liées aux actifs ;
- exigences spécifiques selon le type de transport/activité ;
- contrôles de maintenance documentaire ;
- protection des données personnelles et géolocalisation ;
- règles fiscales/commerciales pertinentes si le périmètre de facturation est réellement livré ;
- obligations propres aux contrats et procédures internes du tenant.

Ne pas coder un taux de TVA par défaut universel. Ne pas supposer qu'un CAP, permis, contrôle technique, document d'export ou règle de conservation s'applique à tous les tenants de façon identique.

### 9.4 Publication d'une règle

Avant de passer une règle à `APPROVED` :

1. la source primaire est retrouvée et identifiée ;
2. la version et les dates d'effet sont vérifiées ;
3. les catégories de tenants et conditions d'application sont documentées ;
4. le contrôle est relu par une personne compétente ;
5. les cas positifs, négatifs, limites et données manquantes sont testés ;
6. un mécanisme de retrait/remplacement existe.

Les agents IA peuvent préparer les analyses et tests, mais ne s'auto-attribuent pas une validation juridique.

---

## 10. TÉLÉMATIQUE : TRACCAR D'ABORD, FLESPI CONDITIONNEL

### 10.1 Architecture d'adaptateur

Les modules métier ne doivent jamais dépendre directement des structures spécifiques à Traccar ou flespi. Introduire ou réutiliser une interface d'ingestion canonique, par exemple :

- création/liaison d'une source ou connexion ;
- synchronisation des appareils ;
- réception ou récupération de positions ;
- réception des événements ;
- récupération de compteurs disponibles ;
- santé de connexion et reprise ;
- état/erreurs de l'adaptateur.

Ce sont des capacités souhaitées, pas nécessairement des méthodes à nom fixe. S'inspirer des conventions du dépôt.

### 10.2 Traccar

- Utiliser l'API REST et les mécanismes officiellement documentés.
- Pour le temps réel, vérifier le mécanisme d'authentification et les contraintes WebSocket de la version installée avant de le choisir.
- Ne pas s'appuyer sur les tables internes Traccar comme contrat d'intégration.
- Ne pas créer une identité Traccar égale à un tenant sans modèle d'autorisation contrôlé.
- Les identifiants de dispositifs externes ne constituent pas à eux seuls une preuve d'appartenance à un tenant.
- Ne promettre que les mesures réellement présentes dans les messages et décodeurs du matériel.
- Conserver heure source, heure de réception, identifiant externe, source/adaptateur, unité et état de qualité.
- Prévoir déduplication/idempotence, données tardives, désordre temporel, reprise sur coupure, backfill borné, erreur permanente et observabilité.

Documentation officielle à vérifier à chaque changement significatif :

- https://www.traccar.org/traccar-api/
- https://www.traccar.org/api-reference/

### 10.3 Quand activer flespi

Ne pas l'ajouter par défaut. Un ADR et des tests comparatifs doivent démontrer au moins un besoin réel : protocole requis non supporté, données décodées indispensables absentes, volume/latence/normalisation ou capacité d'intégration insuffisante.

- Placer l'adaptateur derrière la même interface canonique.
- Garder les credentials côté serveur dans le gestionnaire de secrets/environnement sécurisé.
- Contrôler les coûts, volumes et limites avant production.
- Vérifier localisation, sous-traitance, transferts de données et contrats avant d'envoyer des données personnelles à un fournisseur externe.
- Prévoir désactivation et retour à Traccar/autre source sans migration destructive des données historiques.

Documentation fournisseur à vérifier avant intégration : https://flespi.com/docs

### 10.4 Ingestion résiliente

Traiter le flux en étapes observables : réception → validation → normalisation → déduplication → rattachement à l'actif/tenant → persistance → événements métier. Une panne aval ne doit pas faire perdre silencieusement un message accepté.

Utiliser les mécanismes déjà présents (BullMQ ou équivalent) avant d'introduire un autre broker. Définir une politique de reprise et une file d'erreurs ; les relectures ne doivent pas créer plusieurs ordres de travail pour un même événement logique.

---

## 11. MOBILE ET MODE HORS LIGNE

### 11.1 Approche MVP

Commencer par une PWA si les essais sur les appareils ciblés le permettent. Une application native séparée nécessite une décision documentée basée sur les capacités requises, les contraintes du matériel, l'accès à la caméra/QR et les besoins de synchronisation.

### 11.2 Parcours hors ligne prioritaires

- voir une liste récemment synchronisée des actifs/ordres affectés ;
- saisir un compteur ;
- démarrer/compléter une checklist ou une intervention ;
- prendre des notes et joindre des photos lorsque la capacité locale le permet ;
- marquer les changements comme en attente de synchronisation ;
- synchroniser lorsque la connexion revient ;
- afficher clairement l'état et les conflits.

### 11.3 Règles de synchronisation

- Les opérations locales ont un identifiant idempotent généré côté client.
- Chaque mutation conserve l'utilisateur, l'actif, l'heure locale, l'heure de création côté serveur et l'état de sync.
- Les opérations en attente ne doivent pas être présentées comme validées par le serveur.
- Les conflits de modification doivent être visibles et résolus selon une politique déterministe ; ne pas utiliser le « dernier écrivain gagne » silencieusement pour des champs critiques.
- L'upload de fichier doit être reprenable si le stack le permet ; ne jamais prétendre que la photo est synchronisée avant confirmation.
- Tester fermeture/réouverture de l'appareil, absence prolongée de réseau, double envoi, jeton expiré et changement de session.
- Ne pas promettre un traitement d'arrière-plan universel sur tous les navigateurs et systèmes mobiles.

---

## 12. SÉCURITÉ, DONNÉES ET AUDIT

- Valider toutes les entrées au serveur ; le frontend n'est jamais une frontière de confiance.
- Appliquer authentification, autorisation et tenant scope à chaque endpoint et tâche asynchrone.
- Contrôler les pièces jointes : taille, type réel, droits d'accès, noms sûrs, stockage privé et liens temporaires lorsque nécessaire.
- Ne pas stocker de tokens de fournisseurs télématiques dans le navigateur.
- Ne pas logger les mots de passe, tokens, secrets ou contenus personnels non nécessaires.
- Séparer les environnements et secrets ; garder les `.env` locaux hors Git.
- Mettre en place sauvegardes et test de restauration avant la sortie du pilote.
- Documenter les durées de conservation selon les finalités et les obligations vérifiées ; éviter une durée universelle codée en dur.
- Prévoir une procédure d'incident et des journaux suffisants pour investiguer sans exposer inutilement les données.
- Tout export doit respecter les mêmes contrôles d'accès que l'application.

Les obligations algériennes relatives aux données personnelles et aux transferts doivent être vérifiées sur les textes et recommandations officiels en vigueur. Ne pas réduire l'analyse à l'affirmation non vérifiée « toutes les données doivent toujours être hébergées en Algérie ».

---

## 13. UX, ACCESSIBILITÉ ET LANGUES

- Langue de départ : français, en conservant une architecture traduisible vers l'arabe et l'anglais.
- L'interface doit pouvoir prendre en charge RTL pour l'arabe sans dupliquer le produit.
- Les formats de date, de nombre, d'unité et de devise sont configurables/localisés ; ne pas supposer qu'une valeur formatée en DZD est universelle.
- Chaque tableau de bord doit répondre à une question opérationnelle et exposer la provenance/la période des indicateurs.
- Les états `DEMO`, `SYNC_PENDING`, `UNKNOWN`, `STALE_DATA`, `ESTIMATED` ou leur équivalent doivent être visibles lorsque pertinents.
- Chaque recommandation doit proposer une action suivante ou expliquer pourquoi aucune action automatique n'est possible.
- Les couleurs ne doivent pas être l'unique porteur d'information.
- Préférer une divulgation progressive : actions essentielles d'abord, configuration avancée ensuite.
- Ne pas construire des écrans seulement pour compléter une navigation ; le parcours principal doit fonctionner de bout en bout.

---

## 14. OBSERVABILITÉ ET QUALITÉ

Le MVP doit au minimum rendre visibles :

- état API, base de données et Redis ;
- échecs et délais des jobs ;
- messages télématiques reçus, rejetés, dupliqués et en attente ;
- dernière communication par appareil ;
- erreurs d'évaluation de règles ;
- échecs de synchronisation mobile ;
- opérations critiques échouées ;
- résultats de sauvegarde/restauration.

Les logs doivent contenir des identifiants de corrélation et de tenant lorsqu'autorisés, mais pas de secrets. Toute métrique technique doit avoir une définition explicite.

---

## 15. GATES DE DÉVELOPPEMENT ET CRITÈRES DE SORTIE

Ne pas avancer en déclarant un gate PASS si ses critères ne sont pas remplis. Des phases peuvent se chevaucher, mais aucun blocage critique ne doit être masqué.

### GATE 0 — Audit du dépôt

**Livrable :** rapport d'audit reposant sur les fichiers et commandes réellement examinés.

Critères : versions détectées ; état Git établi ; tests actuels exécutés ou échecs documentés ; schéma, migrations, apps et services identifiés ; risques prioritaires classés ; aucun changement destructif.

### GATE 0.5 — Prototype Activation-First

Critères :
- pack sélectionnable ou assigné ;
- données de démo synthétiques visibles et clairement marquées ;
- décision de démonstration ouvrable et explicable ;
- action de démo qui modifie l'état du scénario ;
- résultat visible dans le tableau de bord ;
- aucune donnée démo comptée comme résultat réel ;
- parcours assisté et manuel spécifiés, avec l'implémentation la plus simple livrée d'abord.

La gate peut commencer avec un prototype intégré à l'app existante, mais les données/écrans doivent partager les contrats prévus pour le produit final et ne pas constituer un prototype jetable séparé.

### GATE 1 — Fondations sécurisées

Critères : authentification et autorisation testées ; RLS activée et vérifiée ; contexte tenant safe pour API et jobs ; migrations reproductibles ; validation d'entrée ; logs sans secrets.

### GATE 2 — Actifs et maintenance de bout en bout

Critères : créer/importer un actif, enregistrer un compteur, détecter une échéance préventive, créer puis clôturer un ordre de travail et constater l'historique/coûts.

### GATE 3 — Télématique Traccar

Critères : environnement Traccar fonctionnel ; au moins un profil matériel ou simulateur contrôlé ; ingestion de données ; traçabilité source/temps ; déduplication ; reprise après coupure ; association tenant/actif testée. Ne pas revendiquer une compatibilité matérielle non testée.

### GATE 4 — Cœur décisionnel

Critères : règle versionnée évaluée ; preuve et données utilisées consultables ; exception générée ; approbation autorisée ; action suivie ; résultat distingué entre estimé et réalisé.

### GATE 5 — Pack réglementaire initial

Critères : règles déclarées explicitement dans leur état ; au moins une règle approuvée de bout en bout avec source primaire, conditions d'application, test et approbation compétente ; absence de règle brouillon affichée comme obligation confirmée.

Si aucune règle ne peut être validée pendant le développement, livrer le modèle et les contrôles en mode draft/source-pending et bloquer l'affirmation de conformité.

### GATE 6 — Parcours terrain et synchronisation

Critères : le parcours choisi fonctionne en ligne et hors ligne selon le périmètre déclaré ; les mutations en attente sont visibles ; la synchronisation, les doublons et conflits sont testés ; aucun écran ne fait croire qu'une action non synchronisée est confirmée côté serveur.

### GATE 7 — Prêt pour pilote

Critères : scénarios de bout en bout réussis ; absence de défaut critique non accepté ; backup/restore démontrés ; autorisations/export testés ; monitoring et procédure d'incident en place ; documentation d'installation et d'exploitation ; 2 à 3 utilisateurs/tenants pilotes peuvent terminer leurs scénarios sans intervention permanente du développeur.

---

## 16. COMMANDES ET ENVIRONNEMENT WINDOWS

Le projet est utilisé sous Windows/PowerShell et Docker Desktop/WSL2. Les chemins et versions ont pu évoluer : les détecter au lieu de les présumer.

Avant de lancer une commande, examiner `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `compose.yaml`/`docker-compose.yml` et la documentation existante.

Commandes de diagnostic possibles (adapter au dépôt) :

```powershell
git status --short
git branch --show-current
node --version
pnpm --version
npm --version
docker --version
docker-compose version
```

Certaines installations peuvent ne pas prendre en charge `docker compose` sous cette forme. Déterminer le chemin Compose réellement disponible (`docker-compose`, binaire Compose distinct ou commande configurée dans l'environnement) et documenter la commande vérifiée. Ne jamais supprimer ou recréer automatiquement les volumes de données.

Pour le monorepo, lancer d'abord les scripts définis dans `package.json`; ne pas inventer les noms de commandes. Exemple après vérification seulement :

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Une commande indisponible doit être déclarée `NOT AVAILABLE` ou remplacée par le script réel du dépôt, et non annoncée comme exécutée.

---

## 17. PERSISTANCE DES DÉCISIONS ET DOCUMENTATION

Utiliser les dossiers existants si leur fonction est équivalente. Sinon, créer progressivement :

- `docs/product/` : périmètre, parcours, personas, critères d'acceptation ;
- `docs/architecture/` : contexte, modules, données, intégrations, sécurité ;
- `docs/decisions/` : ADR (Architecture Decision Records) ;
- `docs/regulatory/` : registre des sources et règles, états de validation ;
- `docs/runbooks/` : lancement, sauvegarde, restauration, incident ;
- `docs/agent-reports/` : rapports de vérification factuels.

Chaque ADR doit préciser : contexte, options, décision, conséquences, risques, méthode de retour arrière et date/statut.

Ne pas produire une multitude de documents contradictoires. Mettre à jour la référence existante lorsque possible, et conserver une source de vérité unique par sujet.

---

## 18. DEFINITION OF DONE POUR CHAQUE TÂCHE

Une tâche n'est terminée que si tous les points applicables sont satisfaits :

- [ ] exigence et critères d'acceptation identifiables ;
- [ ] comportement implémenté dans le code réel, pas seulement dans une maquette ;
- [ ] validation serveur et autorisations en place ;
- [ ] tenant scope/RLS appliqués et vérifiés ;
- [ ] migrations réversibles ou procédure de retour documentée ;
- [ ] cas limites et erreurs traités ;
- [ ] tests ajoutés ou mis à jour ;
- [ ] lint/typecheck/build/tests pertinents exécutés ;
- [ ] logs et secrets contrôlés ;
- [ ] documentation et rapport d'agent mis à jour ;
- [ ] `git diff` relu ;
- [ ] limites restantes nommées sans ambiguïté.

Une tâche incomplète doit être déclarée `PARTIAL` ou `BLOCKED`, avec ce qui manque. Ne pas changer les tests pour simplement forcer le résultat attendu.

---

## 19. PROTOCOLE DE COMPTE RENDU FINAL DE L'AGENT

À la fin de chaque session de développement, produire ce format :

```text
STATUT : PASS | PARTIAL | BLOCKED | NOT VERIFIED
GATE : [nom et numéro]
OBJECTIF : [objectif de la tranche]
CHANGEMENTS : [comportement livré, fichiers majeurs]
TESTS EXÉCUTÉS : [commande exacte + résultat exact]
TESTS NON EXÉCUTÉS : [raison]
SÉCURITÉ / MULTI-TENANT : [contrôles faits]
DONNÉES / MIGRATIONS : [effets et risques]
RESTANT À FAIRE : [liste limitée et priorisée]
PROCHAINE ACTION : [une seule tranche recommandée]
```

Ne pas annoncer `PASS` si un test critique échoue ou n'a pas été exécuté. Ne jamais affirmer avoir vérifié l'environnement de production lorsque seuls des tests locaux ont été faits.

---

## 20. DIRECTIVE DE DÉMARRAGE POUR ANTIGRAVITY

**Première tâche à exécuter après avoir chargé ce fichier :**

> Audite le dépôt actuel sans changement destructif. Lis `AGENTS.md` et les instructions locales, inspecte l'arborescence, l'état Git, les scripts, les dépendances, le schéma/migrations, les tests et l'infrastructure. Exécute les contrôles disponibles sans exposer de secrets. Compare l'état observé aux gates 0 à 7 de ce contrat. Écris `docs/agent-reports/00-repository-audit.md` avec preuves et commandes exactes, fonctionnalités réellement prouvées, écarts, risques et première tranche verticale recommandée. Ne recrée pas les applications ni les services déjà présents. Ne commence pas par générer de nombreux fichiers ou par refactoriser globalement. Après le rapport d'audit, implémente la première gate incomplète en respectant le périmètre et la Definition of Done ; si plusieurs options existent, choisis la plus petite tranche utile, réversible et testable.

**Critère de réussite de la première session :** rapport d'audit vérifiable, dépôt non dégradé, première tâche clairement priorisée et, si le contexte permet de continuer sans risque, une tranche verticale réellement testée. Le nombre de fichiers générés n'est pas un indicateur de succès.

---

## Références techniques à consulter avant modification sensible

- Documentation des règles Antigravity : https://antigravity.google/docs/rules/
- Codelab Google sur les agents, instructions et workflows Antigravity : https://codelabs.developers.google.com/autonomous-ai-developer-pipelines-antigravity
- Documentation officielle Traccar API : https://www.traccar.org/traccar-api/
- Référence officielle Traccar API : https://www.traccar.org/api-reference/
- Documentation officielle flespi : https://flespi.com/docs
- Journal officiel algérien : https://www.joradp.dz/
- Direction générale des impôts : https://www.mfdgi.gov.dz/

Les références externes doivent être reconsultées au moment où elles deviennent une dépendance technique, commerciale ou réglementaire. Une URL présente ici n'est pas, à elle seule, la preuve que telle règle est applicable au produit ou à un tenant.
