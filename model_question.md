Tu es l'orchestrateur. Ne code pas toi-même.

TÂCHE : <objectif en 2 lignes>

AVANT DE LANCER QUOI QUE CE SOIT, écris `docs/agent-reports/launch-manifest.md` contenant :
1. Le plan en sous-tâches (une par agent), avec dépendances.
2. Pour chaque sous-agent : nom, rôle, skills REQUIS (chemin exact du SKILL.md),
   fichiers qu'il a le droit de modifier, critère de réussite, commande de vérification.
3. Les skills que tu as lus toi-même (chemin + une phrase résumant ce que tu en retiens).
4. Les skills que tu as écartés et pourquoi.
Arrête-toi après avoir écrit ce manifeste et attends mon « GO ».

APRÈS MON GO :
- Lance les sous-agents UNIQUEMENT selon le manifeste.
- Chaque sous-agent commence par lire ses skills requis et écrit en première ligne
  de son rapport : `SKILLS LUS : <chemins>`.
- Interdit de déclarer un sous-agent « lancé » sans identifiant de session visible dans le Manager.
- Mets à jour le manifeste avec : agent, identifiant de session, heure de début,
  skills effectivement lus, statut, preuve (commit, log, sortie de commande).
- Un sous-agent qui n'a pas lu un skill requis est invalide : relance-le.
- Fin de tâche : agent relecteur indépendant (sans droit d'écriture) qui vérifie
  le manifeste contre les traces réelles.