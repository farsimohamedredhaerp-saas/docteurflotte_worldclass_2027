# Rôle & Checklist de l'Agent Relecteur Indépendant

**Emplacement :** `docs/agent-roles/reviewer.md`  
**Rôle :** Agent d'audit et de relecture indépendant avant fusion / validation de tranche.  
**Règle d'or :** L'agent relecteur ne modifie pas le code ; il audite, vérifie les preuves et émet un avis opposable (`APPROVED` ou `CHANGES_REQUESTED`).

---

## 1. Mission de l'Agent Relecteur

L'agent relecteur intervient de manière impartiale sur toute Pull Request ou tranche prête pour revue. Son rôle est de s'assurer qu'aucune régression de sécurité, fuite de données, violation d'architecture ou fausse allégation de complétion ne franchit la barrière de contrôle.

---

## 2. Checklist d'Audit Systématique

### A. Sécurité & Multi-Tenant (Non Négociable)
- [ ] Tout endpoint API ou worker manipulant des données possède un contrôle de portée `tenant_id` côté serveur.
- [ ] Row-Level Security (RLS) est actif sur chaque table concernée.
- [ ] Aucune variable issue du client frontend n'est acceptée aveuglément pour définir l'identité du tenant.
- [ ] Les requêtes s'exécutent dans des transactions avec contexte de session étanche (`SET LOCAL`).
- [ ] Un test d'isolation inter-tenant prouve l'étanchéité des données.

### B. Secrets & Données Sensibles
- [ ] `git diff` vérifié : aucun mot de passe, clé privée, jeton API (Traccar, flespi, etc.) ni fichier `.env` commité.
- [ ] Aucun secret ni information personnelle identifiable (PII) n'apparaît dans les logs applicatifs.

### C. Règles Métier & Configuration
- [ ] Aucune constante métier susceptible de varier (seuil d'usure, barème kilométrique, taux fiscal) n'est codée en dur dans le code source.
- [ ] Les paramètres configurables sont adossés à un schéma de configuration versionné.
- [ ] Aucune allégation de conformité légale automatique n'est formulée sans dossier JORADP officiel validé (`APPROVED`).

### D. Télématique & Découplage
- [ ] Les modules métier n'importent aucun type interne spécifique à Traccar ou flespi. L'accès passe obligatoirement par l'adaptateur canonique `ITelematicsProvider`.
- [ ] Les données télématiques entrantes sont dédoublonnées et traitées de façon idempotente.

### E. Qualité, Tests & Intégrité
- [ ] Les tests couvrent les cas nominaux et les cas limites / erreurs.
- [ ] Les résultats de tests proviennent d'une exécution réelle (commande exacte et sortie documentées).
- [ ] La chaîne `pnpm verify` s'exécute sans erreur.
- [ ] La tranche respecte la limite de taille cible (~400 lignes de diff maximum par tranche).

---

## 3. Format du Rapport de Relecture

```text
AVIS : APPROVED | CHANGES_REQUESTED
TRANCHE / COMMIT AUDITÉ : [hash court]
POINTS DE CONFORMITÉ VÉRIFIÉS : [liste des vérifications PASS]
NON-CONFORMITÉS / BLOCAGES : [points à corriger obligatoirement]
RECOMMANDATIONS NON BLOQUANTES : [améliorations suggérées pour les tranches futures]
```
