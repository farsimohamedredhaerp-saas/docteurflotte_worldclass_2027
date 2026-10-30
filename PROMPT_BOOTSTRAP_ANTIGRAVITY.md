# PROMPT 01 — Initialiser le dépôt vide dans Antigravity

## Contexte

Le dossier de projet est neuf et ne contient que `AGENTS.md`. Il n'y a donc aucune application existante à auditer ou à préserver, hormis ce contrat maître. Lis intégralement `AGENTS.md` et applique-le comme instruction prioritaire du projet.

Le produit est une plateforme SaaS de décisionnel, contrôle de gestion et maintenance proactive/préventive/prédictive des actifs opérationnels. Il ne doit pas être réduit à un logiciel de transport, de GPS ou de BTP. Le premier chemin produit sera : diagnostic de parc à partir de données importées → recommandation explicable → action de maintenance → suivi du résultat.

## Mission de cette session

Initialise uniquement le socle technique minimal, propre, testable et prêt à recevoir le MVP. Ne tente pas de construire tous les modules métier dans cette session.

## Étape A — Vérifier l'environnement

1. Confirme le répertoire courant et la liste des fichiers. Vérifie explicitement que `AGENTS.md` est présent.
2. Détecte les versions et disponibilités réelles de Git, Node.js, pnpm, Docker et Docker Compose. Essaie les variantes de commande disponibles sans supposer que `docker compose` fonctionne.
3. Détecte les ports locaux déjà utilisés avant de définir les ports publiés par le Compose.
4. Ne révèle aucun secret et ne lis aucun `.env` pour en recopier les valeurs.
5. Si le dossier n'est pas un dépôt Git, initialise Git si la commande est disponible, sans supprimer ni remplacer les fichiers présents. Préserve `AGENTS.md` et inscris-le dans le suivi de version ; si la création d'un commit échoue, explique exactement pourquoi.

## Étape B — Construire un monorepo minimal

Utilise une stack TypeScript cohérente avec le contrat maître :

- monorepo `pnpm` et orchestration Turborepo ;
- `apps/web` : application Next.js avec App Router ;
- `apps/api` : API NestJS ;
- `packages/contracts` : contrats/types partagés seulement si cela apporte une vraie valeur dès le départ ;
- `infra/compose.yaml` : PostgreSQL et Redis pour le développement local, avec healthchecks et volumes nommés propres au projet.

Choisis des versions compatibles avec la version de Node détectée et indique les versions choisies dans le rapport. Ne prends pas automatiquement la toute dernière version majeure si elle introduit un risque de compatibilité.

Crée les fichiers racine nécessaires : `package.json`, `pnpm-workspace.yaml`, `turbo.json`, configuration TypeScript commune si appropriée, `.gitignore`, `.env.example`, `README.md` et scripts utiles. Ne crée aucun fichier `.env` réel et n'ajoute jamais de secret au dépôt.

Pour les ports Docker :
- vérifie les conflits avant de choisir les ports hôte ;
- si les ports standard sont déjà utilisés, choisis des ports libres, configure-les par variables d'environnement et documente-les ;
- ne stoppe, ne supprime et ne recrée aucun conteneur qui appartient à un autre projet ;
- ne supprime jamais de volume existant et n'utilise jamais `docker compose down -v`.

## Étape C — Implémenter seulement les points de contrôle techniques

### API
- Ajouter `GET /health` comme contrôle de vie simple.
- Ajouter `GET /ready` uniquement si les vérifications de disponibilité des dépendances sont réellement implémentées.
- Ajouter au moins un test automatisé de l'endpoint de santé.
- Valider les entrées côté serveur pour tout endpoint ajouté.

### Web
- Créer une page d'accueil claire identifiant le produit comme une plateforme décisionnelle et de maintenance multi-métier.
- Ajouter un état explicite « socle technique initialisé — modules métier pas encore livrés » plutôt que de simuler des fonctions inexistantes.
- Afficher un lien ou un petit panneau d'état de l'API seulement si son intégration fonctionne réellement.

### Base et traitements
- Préparer une connexion de développement à PostgreSQL et Redis si les dépendances et contrôles sont correctement configurés.
- Ne crée pas encore le schéma métier complet.
- N'ajoute pas encore une couche ORM ou un outil de migrations sans expliquer le choix et ses conséquences ; si tu en introduis un, documente-le brièvement et prouve son fonctionnement.
- Ne prétends pas que l'isolation RLS est livrée tant qu'un test d'isolation multi-tenant n'a pas réellement été écrit et exécuté.

## Étape D — Contrôles obligatoires

Exécute tous les contrôles configurés et disponibles :

- installation reproductible des dépendances et lockfile cohérent ;
- lint ;
- typecheck ;
- tests API ;
- build web et API ;
- validation du fichier Compose, si la commande existe ;
- démarrage et healthchecks des conteneurs uniquement si Docker est disponible et que les ports sont libres.

Ne modifie pas les tests ou les configurations uniquement pour faire passer artificiellement un contrôle. Si une commande n'est pas disponible, indique `NOT AVAILABLE`. Si un contrôle échoue, rapporte l'erreur réelle et corrige-la si elle est comprise et dans le périmètre.

## Restrictions absolues

- Ne modifie pas le sens du contrat maître `AGENTS.md`.
- Ne développe pas maintenant la totalité du SaaS.
- N'implémente pas encore les packs réglementaires, la facturation fiscale, la maintenance prédictive ML, Traccar ou flespi dans cette session.
- N'invente pas de résultats de tests ni de capacités fournisseurs.
- Ne génère pas des dizaines de modules, entités, écrans ou documents sans fonctionnalité testable.
- Ne touche à aucun autre projet Docker, volume ou base existante.
- Consulte `git diff` avant la fin et vérifie qu'aucun secret n'a été ajouté.

## Rapport attendu

Crée `docs/agent-reports/00-initial-bootstrap.md` contenant :

1. versions de l'environnement effectivement détectées ;
2. architecture et fichiers créés ;
3. choix techniques retenus et raisons ;
4. ports utilisés et état des conteneurs, le cas échéant ;
5. commandes exactes exécutées et résultats exacts ;
6. tests non exécutés et raisons ;
7. problèmes ou risques restants ;
8. statut `PASS`, `PARTIAL`, `BLOCKED` ou `NOT VERIFIED` ;
9. une seule prochaine tranche recommandée.

## Critère d'acceptation de cette session

Le nouveau dépôt contient un monorepo minimal reproductible, l'application web démarre, l'API démarre, `/health` passe son test, les contrôles configurés sont exécutés ou leurs absences sont déclarées, les services locaux peuvent être démarrés sans conflit avec un autre projet, et le rapport fournit des preuves réelles.

## Prochaine mission à proposer après réussite

La prochaine tranche devra implémenter le prototype **Activation-First** en utilisant les contrats de données prévus pour le produit : pack de démonstration, données synthétiques explicitement marquées, liste de risques illustratifs, décision explicable et action de démonstration dont le résultat reste séparé des économies réelles. Après validation de cette tranche, développer l'import CSV/Excel du diagnostic de parc et la première boucle maintenance de bout en bout.
