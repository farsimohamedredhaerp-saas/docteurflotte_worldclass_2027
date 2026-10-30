# MASTER PLAN CORRIGÉ — Plateforme SaaS décisionnelle et de maintenance multi-métier

**Version : 2.0 — 23 octobre 2026**  
**Marché de départ : Algérie · Extension visée : Afrique**  
**Principe de conception : Activation-First, Decision-First, Evidence-Driven**

---

## 1. Décision stratégique

La proposition initiale doit évoluer sur un point fondamental : **le produit n'est pas un logiciel de transport qui s'étendra ensuite à d'autres métiers**. C'est une plateforme de pilotage décisionnel, de contrôle de gestion et de maintenance des actifs opérationnels. La gestion de flotte, la logistique et les processus propres à chaque métier sont des domaines fonctionnels qui s'appuient sur ce socle commun.

Le produit doit répondre de façon cohérente à cinq questions :

1. Quels actifs et opérations devons-nous piloter ?
2. Quel est leur état, leur coût, leur disponibilité et leur niveau de risque ?
3. Quelles données et preuves soutiennent cette évaluation ?
4. Quelle décision ou action est recommandée, par quelle règle et sous quelle autorité ?
5. Quel résultat réel a été obtenu après l'action ?

Le différenciateur recherché est la boucle traçable :

**Données → Preuves → Contrôles → Exceptions → Analyses → Décisions → Actions → Résultats → Apprentissage.**

La télématique est une source de données parmi d'autres. Traccar est la première intégration envisagée ; flespi reste un connecteur optionnel. La donnée peut également provenir d'un compteur saisi, d'un import, d'un ordre de travail, d'une facture, d'un document ou d'une API.

## 2. Le principe Activation-First : aucune page blanche, aucune fausse promesse

La critique a raison sur un point central : une plateforme de décisionnel et de maintenance est exposée au « cold start ». Sans actifs, historiques, paramètres ou événements, le moteur ne peut pas produire de décisions utiles à partir des données réelles du client.

La réponse est une activation en trois étapes complémentaires :

- **Comprendre immédiatement :** une démonstration interactive avec des données synthétiques et un cycle décision-action-résultat.
- **Démarrer rapidement :** un pack préconfiguré, un questionnaire court et un import guidé des données disponibles.
- **Créer de la valeur réelle :** dès que les données du tenant sont suffisantes, produire une première analyse ou décision explicitement fondée sur ses données.

Il faut distinguer deux mesures :

- **Temps jusqu'à la première valeur de démonstration** : délai nécessaire pour explorer le scénario fictif et comprendre le fonctionnement. Cible de conception proposée : quelques minutes.
- **Temps jusqu'à la première valeur réelle** : délai nécessaire pour importer ou saisir des données réelles, exécuter les contrôles et obtenir un résultat utile. Il dépend de la disponibilité et de la qualité des données du client ; il doit être mesuré pendant les pilotes.

Les statistiques de la critique sur le churn B2B, le TTFV de cinq minutes, les hausses d'activation ou les taux de conversion ne sont pas accompagnées de sources contrôlables. Elles ne doivent pas être reprises comme des références établies, ni devenir des promesses commerciales. Les objectifs chiffrés du produit doivent être fixés comme des hypothèses internes à valider par les essais utilisateurs.

### 2.1 Environnement de démonstration isolé

À la première connexion, le tenant peut ouvrir un environnement de démonstration déjà alimenté : actifs fictifs, compteurs, interventions historiques, dépenses illustratives, exceptions et décisions générées par le même moteur que celui du produit réel.

Exigences obligatoires :

- Toutes les entités de démonstration portent un marqueur explicite, par exemple `data_origin = DEMO`, et appartiennent à un espace de démonstration logiquement isolé.
- Un bandeau permanent signale « Données de démonstration — valeurs fictives ».
- Les données et événements de démonstration ne sont jamais comptés dans les indicateurs opérationnels, réglementaires ou commerciaux du tenant.
- Aucune notification de démonstration ne doit être envoyée à un client, conducteur, prestataire ou destinataire réel.
- L'utilisateur peut réinitialiser ou supprimer l'espace de démonstration sans effacer ses données réelles.
- La migration vers l'exploitation réelle est une opération distincte : ne jamais simplement retirer `isDemo` pour transformer des données synthétiques en données de production.
- Le scénario est calculé et évalué par les composants réels de règles et de décisions ; il ne doit pas être un écran statique affichant une décision prédéterminée sans exécuter le moteur.

Les données de démonstration peuvent montrer un coût d'intervention et une estimation hypothétique de risque. Elles doivent expliquer les hypothèses utilisées et ne doivent jamais faire passer une économie simulée pour une économie réalisée. En production, une économie réalisée ne peut être déclarée qu'après observation et validation d'un résultat réel.

### 2.2 Onboarding à deux parcours

Après inscription, le tenant choisit entre :

**A. « Configurez mon espace avec moi »**

Un parcours guidé pose quelques questions : activité dominante, familles d'actifs, ordre de grandeur du parc, priorité (maintenance, disponibilité, coûts, conformité opérationnelle), source de données disponible et langue de travail. Le système recommande un modèle de départ et explique ce qu'il préconfigure. Toute activation de pack ou règle est visible et réversible.

Un assistant IA peut être ajouté pour aider à mapper des colonnes, interpréter des documents ou proposer des paramètres, mais il ne doit pas inventer les données manquantes, certifier une règle réglementaire ou appliquer silencieusement une modification sensible. Toute action importante est présentée pour confirmation.

**B. « Je configure moi-même »**

Le tenant accède à des formulaires guidés avec valeurs suggérées, descriptions, unités, provenance, possibilité de modification et historique. Il ne rencontre pas un formulaire entièrement vide, mais reste maître de la configuration.

La complexité est progressive : les trois à cinq actions utiles apparaissent en premier ; les options avancées ne sont exposées qu'au moment où elles deviennent nécessaires.

### 2.3 Import des données réelles

L'import guidé est une fonction d'activation de premier rang, pas une tâche administrative facultative. Le périmètre MVP doit couvrir au minimum :

- actifs et identifiants de parc ;
- compteurs courants avec unité, date et provenance ;
- historiques de maintenance si disponibles ;
- interventions et coûts ;
- documents et échéances utiles au périmètre pilote.

Le processus doit comprendre un modèle CSV/XLSX téléchargeable, un aperçu, le mapping des colonnes, la validation des unités et des dates, la détection des doublons, un rapport d'erreurs téléchargeable, une confirmation avant enregistrement et une piste d'audit. L'import ne doit pas créer des actifs en double ou corriger arbitrairement les valeurs sources.

## 3. Architecture de produit : cœur commun et packs composables

Il faut éviter deux extrêmes : une application exclusivement pensée pour le transport, et une plateforme universelle entièrement abstraite qui retarderait le produit. La bonne solution est un socle commun opérationnel enrichi par des modèles versionnés.

### 3.1 Socle commun

1. **Identité, tenants et organisations** : utilisateurs, rôles, sites, équipes, séparation des données et paramètres du tenant.
2. **Registre des actifs** : véhicules, poids lourds, engins, équipements et autres actifs opérationnels. Attributs communs et extensions typées selon la famille d'actifs.
3. **Maintenance** : plans préventifs, compteurs, échéances, demandes et ordres de travail, interventions, pièces, prestataires, garanties, indisponibilité et coûts.
4. **Contrôle de gestion** : budgets, prévisions, réalisés, écarts, causes, allocation des coûts et indicateurs par actif, site, activité ou centre de coût.
5. **Moteur de règles et de politiques** : conditions déterministes, versions, critères d'applicabilité, exceptions, seuils, workflow et actions autorisées.
6. **Gestion des décisions** : cas de décision, preuves, options, justification, estimation, approbation, action, résultat observé et retour d'expérience.
7. **Documents et preuves** : pièces jointes, provenance, dates, versions, statut de validation, accès et historique.
8. **Télématique** : connecteurs sources, normalisation, qualité et fraîcheur des données, reprise et supervision.
9. **Activation** : catalogue de modèles, environnements de démonstration, onboarding, import et mesure des étapes d'activation.
10. **Audit et gouvernance** : journal des changements, séparation des responsabilités, configuration versionnée, supervision et export.

### 3.2 Packs composables, pas des produits séparés

Un pack client résulte de la combinaison de couches réutilisables :

- **Profil d'actifs** : véhicule léger, poids lourd, engin de chantier, groupe électrogène ou autre équipement.
- **Pack de processus** : maintenance, affectation, mission, location, exploitation de chantier ou interventions de terrain.
- **Pack décisionnel** : coût, disponibilité, maintenance due, écart budgétaire, risque et suivi de décision.
- **Pack réglementaire pays/secteur** : uniquement les règles documentées et validées dans le périmètre indiqué.
- **Pack d'intégration** : Traccar, autre fournisseur télématique, import, API ou saisie manuelle.

Premiers modèles envisageables :

- Flotte routière et logistique ;
- Engins et équipements mobiles de chantier ;
- Maintenance d'équipements sur site ;
- Distribution et services techniques.

Ils ne doivent pas tous être développés intégralement au lancement. Le socle doit cependant permettre de les représenter sans fork du code et sans introduire le BTP ou le transport comme hypothèse globale de données.

Le premier pilote commercial doit porter sur un contexte client précis. Pour vérifier la transversalité, tester également un deuxième profil d'actif — réel dans un autre pilote si possible, sinon à l'aide de scénarios synthétiques isolés et explicitement identifiés. Cela valide la réutilisabilité technique sans promettre quatre métiers complets en version initiale.

### 3.3 Valeurs par défaut : configurables, sourcées et honnêtes

Chaque pack peut offrir des valeurs de départ ; cela ne contredit pas l'absence de variables métier codées en dur si ces valeurs sont fournies par un catalogue versionné et administrable. Chaque valeur pertinente indique :

- identifiant et type ;
- unité ;
- valeur suggérée et portée ;
- provenance et justification ;
- statut (suggestion, validée par le client, approuvée réglementairement, etc.) ;
- date d'effet et historique ;
- rôle autorisé à la modifier.

Une fréquence d'entretien affichée par défaut ne doit pas être présentée comme une prescription constructeur sans source. Elle doit venir du manuel applicable, d'une politique du client ou être signalée explicitement comme valeur illustrative à confirmer.

## 4. Le cœur décisionnel : de l'alerte à la décision justifiable

Le moteur ne doit être ni un tableau de bord passif ni un agent conversationnel qui prendrait la place des procédures. Chaque règle activée doit avoir une portée, des entrées typées, des conditions contrôlées, un résultat explicable et une politique d'exécution.

### 4.1 Contrat minimal d'une règle

- `rule_id`, version et statut ;
- domaine et portée d'application ;
- source ou justification (texte réglementaire, politique interne, recommandation constructeur ou paramètre client) ;
- conditions et paramètres typés ;
- unités, plages et gestion des données manquantes ;
- date d'effet et date de fin, le cas échéant ;
- niveau de sévérité ;
- action autorisée ou recommandée ;
- propriétaire, approbateur et date de revue ;
- tests de validation et historique des résultats.

Il faut distinguer trois familles :

1. **Contrôle réglementaire validé** : règle fondée sur une source primaire et approuvée par une personne compétente.
2. **Politique de gestion du tenant** : règle décidée par l'entreprise, par exemple un seuil de coût ou de criticité.
3. **Recommandation analytique** : résultat d'une méthode ou d'une analyse, avec ses limites et son niveau de confiance.

Une règle `draft`, `source_pending` ou en cours de validation ne doit jamais apparaître comme une obligation juridique confirmée. Elle peut être consultée dans un environnement de prévisualisation, avec son état visible, mais ne doit pas bloquer une opération en production comme si elle était une règle validée.

### 4.2 Contrat minimal d'un cas de décision

Un cas de décision doit conserver au moins :

- faits observés et données sources ;
- qualité et fraîcheur des données ;
- preuves et documents ;
- règle et version évaluées ;
- résultat du contrôle et explication ;
- options possibles et hypothèses ;
- coût estimé, plage ou indication « non calculable » si les données sont insuffisantes ;
- décision prise, auteur, approbateur et justification ;
- action engagée, responsable et échéance ;
- résultat réellement observé après l'action.

La **confiance dans les preuves** et la **confiance dans la décision** doivent rester distinctes. Un GPS ancien ou un compteur incertain doit pouvoir diminuer la fiabilité de l'analyse sans être masqué par une présentation convaincante.

### 4.3 Exemple pédagogique correct

Dans le scénario synthétique, le système peut expliquer : « Le compteur DEMO indique que le seuil d'entretien de démonstration est dépassé. Selon les hypothèses illustratives de ce scénario, l'intervention estimée coûte X et le scénario de risque indique Y. Examiner et planifier l'intervention. »

Le clic d'approbation modifie l'état du cas de démonstration et crée un ordre de travail de démonstration. Il ne doit pas annoncer une économie réalisée. Dans un tenant de production, l'estimation repose sur les données réelles et les hypothèses explicites ; le résultat économique ne peut être confirmé qu'après intervention et comparaison documentée.

Le MVP peut utiliser des règles déterministes : échéance de maintenance atteinte, compteur dépassé, document manquant, coût supérieur à un seuil tenant, hausse d'immobilisation ou écart budgétaire. La prédiction statistique et le machine learning viennent après la collecte d'un historique fiable.

## 5. Configuration sans constantes métier enfouies dans le code

L'exigence doit être appliquée à toutes les valeurs susceptibles de changer selon le tenant, le métier, le pays, le contrat ou le temps : seuils, périodicités, catégories, unités, états métier, formules autorisées, workflows, destinataires, paramètres commerciaux et règles applicables.

### 5.1 Registre de configuration

Mettre en place un registre de paramètres typés avec :

- identifiant stable ;
- type et validation ;
- portée (plateforme, pack pays, pack métier, tenant, site, actif) ;
- valeur par défaut, valeur héritée et surcharge explicite ;
- unité et format ;
- dates d'effet ;
- version, auteur et justification ;
- permissions et approbations ;
- audit de chaque changement.

Ordre d'héritage proposé : défaut de plateforme → pack pays validé → pack métier → tenant → site ou actif, selon le type de paramètre. Les conflits doivent être résolus par une règle d'héritage explicite et testée, pas par une priorité implicite cachée dans plusieurs fichiers.

### 5.2 Ce qui reste dans le code

« Aucune variable métier en dur » ne signifie pas que toute logique doit être modifiable par l'utilisateur. Le code reste responsable des invariants de sécurité, des types, des transactions, du modèle de permissions, des validations structurelles, du moteur d'évaluation et de la protection contre l'exécution arbitraire. Les valeurs de gestion et règles variables sont déclaratives, versionnées et contrôlées.

Pas d'éditeur de script utilisateur dans le MVP. Les conditions initiales sont assemblées à partir d'opérateurs sûrs, de paramètres typés et de champs autorisés.

## 6. Maintenance multi-actifs et données télématiques

### 6.1 Parcours maintenance minimal

Le premier cycle opérationnel doit fonctionner de bout en bout :

1. créer ou importer un actif ;
2. définir les compteurs et leur provenance ;
3. associer un plan d'entretien approprié ;
4. recevoir ou saisir un relevé ;
5. évaluer la règle ;
6. créer une exception et une demande ou un ordre de travail ;
7. affecter un responsable et une échéance ;
8. saisir pièces, main-d'œuvre, photos et coût ;
9. clôturer l'intervention ;
10. mettre à jour l'état de l'actif, l'historique et les indicateurs ;
11. comparer la situation avant/après.

Préventif signifie une action basée sur un échéancier ou un compteur. Proactif signifie anticiper à partir d'un signal explicable ou d'une tendance. Prédictif signifie estimer un événement futur avec une méthode évaluée et des données appropriées ; cette promesse ne doit pas être simulée par de simples alertes à seuil.

### 6.2 Traccar en première intégration

Traccar est utilisé derrière un adaptateur télématique interne. Son API REST et son interface WebSocket peuvent servir à récupérer les entités et mises à jour autorisées. Documentation officielle : https://www.traccar.org/traccar-api/ et https://www.traccar.org/api-reference/.

Le SaaS ne doit pas dépendre du schéma interne de la base Traccar. Les messages sont normalisés vers un modèle canonique comportant notamment l'identité de la source, l'identité du dispositif, l'actif et le tenant associés, le temps de la source et de réception, les unités, la qualité, le statut de traitement et l'ID de déduplication.

Fonctions d'ingestion à prévoir dès le MVP : authentification, contrôle d'association tenant/équipement, déduplication, messages désordonnés ou retardés, journal d'ingestion, reprises, file d'erreurs, mesures de santé, surveillance de fraîcheur et import historique borné.

Les données de kilométrage, d'heures moteur, de carburant, de température ou de codes défauts ne sont disponibles que si le boîtier, les capteurs, le véhicule et le protocole les exposent effectivement. Le système différencie données observées, calculées, estimées et saisies manuellement.

### 6.3 flespi en option, après vérification

flespi ne doit être activé en production qu'après une analyse documentée prouvant que Traccar ne répond pas à un besoin précis : protocole important non couvert, décodage nécessaire, normalisation, exigences de flux ou autre contrainte mesurée. La couche d'adaptation doit permettre d'ajouter ce connecteur sans changer les modules métier.

Avant décision, mesurer les coûts, les flux sortants, le lieu et les conditions de traitement des données, la sécurité des secrets, la dépendance fournisseur, les exigences contractuelles et l'impact sur le modèle d'hébergement. Aucun abonnement ne doit être engagé sur la seule hypothèse que plus de connecteurs seraient utiles un jour.

## 7. Mobile et mode hors ligne : périmètre utile et réaliste

Le terrain a besoin d'une interface utilisable avec une connexion intermittente. C'est une exigence fonctionnelle importante, mais elle doit être limitée au départ aux opérations qui bénéficient clairement de l'offline.

### 7.1 MVP mobile recommandé

Commencer par une interface web responsive/PWA si les essais sur les téléphones ciblés le permettent, en conservant l'application Next.js existante. Le premier périmètre hors ligne comprend :

- consultation de la liste d'actifs et des ordres de travail préalablement synchronisés ;
- saisie locale d'un relevé de kilométrage ou d'heures moteur ;
- brouillon de compte rendu et clôture provisoire d'une intervention ;
- prise en charge de photos/pièces jointes dans une file d'envoi, si les limites de l'appareil le permettent ;
- lecture de QR code pour ouvrir une fiche d'actif et créer une demande d'intervention, après test de la compatibilité caméra.

Ne pas tenter de rendre l'ensemble du SaaS disponible hors ligne. Les fonctions d'administration sensible, les approbations réglementaires critiques et les calculs qui exigent des données serveur fraîches peuvent rester en ligne au lancement.

### 7.2 Contrat de synchronisation obligatoire

La synchronisation ne doit pas être « magique ». Elle doit avoir une file locale persistante avec identifiant unique d'opération, état explicite, nombre de tentatives, date, erreur éventuelle et possibilité de reprise.

- Utiliser des opérations idempotentes pour éviter la duplication lors d'une nouvelle tentative.
- Définir les règles de conflit par type de donnée ; éviter une stratégie générale « dernière écriture gagnante » pour les compteurs, coûts et décisions sensibles.
- Montrer clairement les états « enregistré localement », « en attente de synchronisation », « synchronisé » et « conflit à résoudre ».
- Contrôler les permissions et le tenant au serveur lors de la synchronisation ; une action créée hors ligne n'est pas automatiquement autorisée à sa réception.
- Protéger les données locales et effacer celles d'une session conformément aux règles de sécurité de l'appareil.
- Tester fermeture forcée, batterie faible, reprise réseau, doublon, modification concurrente, pièce jointe volumineuse et session expirée.

Les PWA peuvent mettre en cache des ressources et permettre certaines opérations hors ligne, mais les traitements d'arrière-plan dépendent du navigateur et ne sont pas garantis en permanence. La synchronisation doit donc être reprise à l'ouverture, au retour de la connectivité et par une action manuelle, sans dépendre uniquement d'un événement d'arrière-plan. Référence technique : https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation.

### 7.3 Quand choisir une application native

React Native ou un client natif est une décision à prendre après un prototype PWA et des essais terrain. Il peut devenir pertinent si les tests démontrent un besoin de fonctionnement prolongé en arrière-plan, d'intégration matérielle avancée, de périphériques professionnels spécifiques ou de contraintes d'exploitation que la PWA ne satisfait pas. Le jour 1 exige le parcours mobile prioritaire, pas obligatoirement une seconde application complète.

## 8. Réglementation et conformité : des packs contrôlés, pas une garantie universelle

Le produit doit aider les clients à suivre les exigences qui les concernent, mais il ne peut pas promettre que chaque tenant est automatiquement conforme à toute réglementation algérienne.

Chaque contrôle réglementaire en production doit comprendre une source primaire identifiable, un article ou une référence précise, une date de publication, une date d'effet, une portée d'application, des critères d'applicabilité, des preuves attendues, une version, des tests et un responsable de validation compétent. Les règles non sourcées ou pas encore validées restent visibles comme brouillons, sans se présenter comme des obligations confirmées.

Pour le MVP, limiter le pack réglementaire aux obligations clairement pertinentes pour le profil pilote et vérifiées à partir des textes ou instructions officiels. Le reste est un backlog de recherche/validation, pas une fonctionnalité déclarée conforme.

Les contrôles opérationnels, les politiques internes et les règles commerciales ou fiscales doivent être distingués. Un taux fiscal ou une obligation ne doit pas être librement modifiable comme un simple seuil de maintenance ; la configuration fiscale doit respecter les options juridiquement applicables, la période et les justificatifs nécessaires.

Les questions de données personnelles, de géolocalisation, de conservation, d'hébergement et de transfert international nécessitent une analyse juridique du traitement précis et du contexte de déploiement. Ne pas déduire une obligation générale de localisation de données uniquement à partir du souhait d'hébergement souverain. Le self-hosting en Algérie peut rester une option stratégique, mais la conformité doit être évaluée sur le périmètre réel.

## 9. Architecture technique proposée

Conserver le socle déjà en place, sauf audit démontrant une raison de le modifier :

- Next.js pour l'application web responsive ;
- NestJS en monolithe modulaire pour l'API et les domaines métier ;
- PostgreSQL pour les données transactionnelles, avec séparation multi-tenant et RLS ;
- Redis/BullMQ pour les traitements asynchrones et tâches de fond ;
- Traccar comme service télématique séparé ;
- adaptateurs pour les sources et fournisseurs ;
- PWA pour les opérations terrain ciblées ;
- stockage de documents avec autorisations, métadonnées et politiques de conservation explicites.

Éviter les microservices multiples, Kafka et les infrastructures distribuées avant une nécessité démontrée. La priorité est la fiabilité transactionnelle, l'isolation des tenants, l'observabilité, les migrations, la sauvegarde et la restauration.

Les tâches asynchrones doivent respecter la même isolation tenant que l'API. Le contexte tenant doit être vérifié côté serveur ; ne jamais faire confiance uniquement à un `tenant_id` fourni par le client. Les preuves d'audit sensibles doivent être append-only ou protégées contre la modification non autorisée. Les changements de configuration doivent être versionnés, et les anciennes décisions doivent garder la référence exacte de la configuration et de la règle utilisées.

## 10. Périmètre MVP : obligatoire, conditionnel, différé

### Obligatoire

- tenants, utilisateurs, rôles et isolation multi-tenant ;
- registre d'actifs configurables, avec au moins des profils véhicule et engin ;
- compteurs manuels et provenance des données ;
- plans d'entretien et ordres de travail ;
- interventions, coûts, pièces/documentation de base ;
- tableaux de bord de maintenance et de contrôle de gestion de premier niveau ;
- catalogue de variables de gestion versionnées ;
- règles déterministes configurables pour le périmètre défini ;
- cas de décision, justification, approbation, action et résultat ;
- intégration Traccar avec gestion d'erreurs et contrôle de fraîcheur ;
- jeu de démonstration isolé qui exécute le vrai workflow ;
- onboarding assisté et manuel ;
- import guidé des données de base ;
- parcours mobile terrain prioritaire et gestion hors ligne limitée ;
- journal d'audit, sauvegarde et restauration testées ;
- premier pack de contrôles réglementaires, restreint et validé.

### Conditionnel après preuve de besoin

- connecteur flespi ;
- application mobile native ;
- SMS payants et canaux de notification additionnels ;
- intégrations comptables/fiscales spécifiques ;
- connecteurs de données constructeur ou IoT supplémentaires.

### Différé

- éditeur universel de scripts et règles créées sans limites par les utilisateurs ;
- prédiction machine learning généralisée ;
- ERP fiscal ou comptable complet ;
- couverture réglementaire exhaustive de tous les métiers et pays ;
- optimisation avancée de tournées ;
- microservices et architecture distribuée sans justification mesurée.

## 11. Plan d'exécution revu

Durée indicative : **18 à 24 semaines avec une petite équipe dédiée**, sous réserve d'un dépôt réutilisable, de décisions produit rapides, de disponibilité des testeurs et de périmètre stable. Pour un développeur seul à temps partiel, la durée peut être nettement plus longue. Ce chiffre est une estimation de planification, pas une garantie.

### Gate 0 — Décisions produit et audit du dépôt

- Inventorier ce qui existe, ce qui passe les tests et les défauts ouverts.
- Choisir le premier profil client et le problème prioritaire.
- Écrire le parcours opérationnel de référence : actif → compteur → règle → décision → ordre de travail → résultat.
- Distinguer valeurs configurables, paramètres réglementaires, invariants de sécurité et fonctions reportées.

**Sortie exigée :** périmètre approuvé, backlog et registre des risques traçables.

### Gate 0.5 — Prototype du premier lancement

- Concevoir l'onboarding à deux parcours.
- Définir le pack composé du socle, d'un profil d'actifs et du processus initial.
- Construire les données synthétiques et la démonstration interactive.
- Prototyper l'import CSV/XLSX et ses erreurs.
- Prototyper le parcours terrain mobile/offline et vérifier les appareils cibles.

**Sortie exigée :** un utilisateur interne peut ouvrir la démo, examiner une décision, approuver l'action fictive et voir le résultat simulé, puis comprendre comment ajouter ses propres données sans confondre les deux environnements.

### Gate 1 — Fondations et configuration

- Authentification, tenant, rôles et RLS ;
- catalogue de paramètres versionnés et héritage ;
- registre d'actifs et modèles de profils ;
- audit et stockage de documents.

**Sortie exigée :** tests d'isolation prouvés, y compris API et workers ; une modification de seuil autorisée ne demande pas de patch applicatif.

### Gate 2 — Maintenance et coûts

- compteurs et plans ;
- demandes et ordres de travail ;
- interventions, pièces et coûts ;
- indicateurs de coût, disponibilité et échéances.

**Sortie exigée :** scénario d'entretien complet reproductible avec historique et données vérifiables.

### Gate 3 — Règles et décision

- évaluation des règles typées ;
- exceptions et cas de décision ;
- justification, approbation et responsabilités ;
- action suivie et résultat constaté ;
- scénario démo et scénario production séparés.

**Sortie exigée :** chaque décision est reliée aux données, à la version de règle et à l'action qui suit.

### Gate 4 — Télématique et parcours terrain

- connecter Traccar ;
- normaliser, dédupliquer et gérer les reprises ;
- tester avec les équipements réellement visés ;
- livrer la PWA terrain et le mécanisme de synchronisation limité.

**Sortie exigée :** preuve de bout en bout de la réception d'une donnée ou d'un relevé local, de son association à un actif, de la mise à jour du compteur et de l'évaluation de la règle.

### Gate 5 — Premier pack de contrôles réglementaires et stabilisation

- sélectionner les textes officiels pertinents ;
- valider les règles avec un expert compétent ;
- exécuter tests positifs/négatifs et vérifier leur applicabilité ;
- démontrer sauvegarde/restauration, permissions et observabilité.

**Sortie exigée :** aucune règle non validée ne se présente comme une obligation confirmée ; la restauration est documentée et exécutée.

### Gate 6 — Pilote réel

- lancer avec un nombre limité de tenants ;
- observer les usages réels, erreurs, données manquantes et temps d'activation ;
- mesurer les résultats opérationnels ;
- corriger le produit avant l'élargissement des métiers.

**Sortie exigée :** les utilisateurs réalisent le cycle de maintenance sans assistance permanente du développeur et les gains sont mesurés avec des méthodes déclarées.

## 12. Mesures de succès à instrumenter

Il ne faut pas confondre cible de conception et benchmark de marché. Les premières cibles sont des hypothèses de produit à mesurer pendant les tests.

### Activation

- temps pour voir et comprendre le scénario de démonstration ;
- taux d'utilisateurs qui ouvrent une décision et terminent le scénario ;
- taux de tenants qui importent/créent leur premier actif réel ;
- délai entre l'inscription et la première analyse basée sur des données réelles ;
- nombre d'erreurs d'import et de configurations nécessitant l'aide de l'équipe.

### Maintenance et décision

- plans d'entretien arrivant à échéance ;
- interventions ouvertes, planifiées et clôturées ;
- part des ordres de travail avec coûts et preuves complets ;
- qualité/fraîcheur des compteurs ;
- délai entre exception, décision et action ;
- différence entre coût estimé et coût réellement observé ;
- économies estimées séparées des économies réalisées et validées.

### Résilience et qualité

- messages perdus ou en attente après reprise ;
- doublons métier évités ;
- conflits de synchronisation non résolus ;
- échecs et durée de restauration ;
- incidents d'isolation multi-tenant ;
- règles en production sans source ou sans validation — cible : zéro.

La valeur de chaque indicateur doit préciser sa formule, les champs requis, les exclusions et les limites d'interprétation. Le tableau de bord ne doit pas afficher une précision supérieure à celle des données disponibles.

## 13. Critères d'acceptation du MVP

Le MVP n'est pas accepté parce que les pages existent. Il est accepté si les tests démontrent les parcours suivants :

1. Un tenant ouvre une démonstration isolée ; aucun faux actif, faux coût ou résultat simulé n'apparaît dans ses rapports réels.
2. L'utilisateur choisit un modèle de démarrage ou suit le parcours manuel.
3. Il importe un petit jeu réel et voit les erreurs avant validation.
4. Il crée ou confirme un actif, un compteur et un plan de maintenance.
5. Le moteur évalue une règle, produit une explication et crée un cas de décision.
6. Un responsable autorisé planifie une intervention ; l'action est auditée.
7. Un technicien enregistre une intervention, éventuellement hors ligne, et synchronise sans duplication.
8. Les coûts et indicateurs sont mis à jour et séparés des estimations.
9. Le parcours télématique suit une donnée de Traccar jusqu'à l'actif et à la règle, avec provenance et fraîcheur.
10. Une règle réglementaire affiche sa source, sa validité, sa portée et son statut d'approbation.
11. Les tests tentant l'accès croisé entre tenants échouent comme prévu.
12. La restauration d'une sauvegarde est réellement testée.

## 14. Décisions immédiates à verrouiller

1. Le produit est un **système décisionnel et de maintenance des actifs opérationnels**, pas un TMS ou un GPS tracker.
2. Le MVP porte sur un cycle opérationnel de bout en bout, un client pilote concret et un socle de données capable de représenter plusieurs profils d'actifs.
3. Le premier lancement est Activation-First : démo isolée, packs versionnés, onboarding à deux parcours, import et première décision guidée.
4. Les données fictives démontrent le produit ; seules les données et preuves réelles alimentent les indicateurs de production et les économies réalisées.
5. Traccar est le premier fournisseur télématique ; flespi ne devient une dépendance qu'après un test technique et économique démontrant sa nécessité.
6. Le mobile hors ligne fait partie du parcours terrain prioritaire, mais commence par une PWA limitée et éprouvée avant d'envisager une application native complète.
7. Les règles configurables sont versionnées ; les contrôles réglementaires passent en production après validation ; les invariants de sécurité ne sont pas négociables.
8. Les agents IA exécutent des tâches bornées et rendent compte de leurs preuves, mais ne déclarent pas seuls un gate terminé.
9. Les phases et fonctionnalités ne passent au statut « opérationnel » qu'après les critères d'acceptation et les preuves de tests.

## 15. Références techniques utilisées

- Traccar, API officielle : https://www.traccar.org/traccar-api/
- Traccar, référence API : https://www.traccar.org/api-reference/
- MDN, fonctionnement hors ligne et opérations d'arrière-plan des PWA : https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation

Ces références soutiennent les possibilités techniques générales de Traccar et des PWA. Elles ne valident pas, à elles seules, les protocoles du matériel de chaque client, l'adéquation d'une PWA à tous les appareils du marché, ni une interprétation juridique algérienne. Ces points doivent être vérifiés avec les équipements, les textes officiels et les professionnels concernés.

---

**Décision finale recommandée :** intégrer Activation-First dès le MVP, mais l'appliquer à votre vrai produit — le cœur décisionnel et maintenance multi-métier. La démo prouve le fonctionnement ; l'import rend le client opérationnel ; les règles validées protègent la crédibilité ; les données réelles permettent de mesurer la valeur. C'est cette combinaison, et non l'accumulation de modules, qui doit guider le développement.
