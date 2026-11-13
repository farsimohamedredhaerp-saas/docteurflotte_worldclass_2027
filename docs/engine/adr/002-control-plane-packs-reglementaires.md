# ADR-002 — Control Plane : Spécification des Packs Réglementaires, Cryptographie Ed25519 & Résolution Bi-temporelle

**Date :** 2026-11-11  
**Statut :** ACCEPTÉ  
**Auteurs :** Équipe d'Ingénierie Moteur Décisionnel  
**Portée :** Control Plane, `packages/decision-engine`, Migration SQL `08_reg_packs_control_plane.sql`, CLI `pack-cli`  

---

## 1. Contexte & Enjeux

Dans l'écosystème fiscal et comptable algérien, la réglementation évolue à travers les Lois de Finances annuelles (LF), les Lois de Finances Complémentaires ou Rectificatives (LFC), les décrets exécutifs et les arrêtés ministériels. 

Pour garantir une opposabilité juridique totale et une reproductibilité des calculs dans le temps, le **Control Plane** doit :
1. Publier des **packs réglementaires immuables**, intègres et signés numériquement.
2. Assurer une **résolution bi-temporelle exacte** (`asOf` : temps d'effet juridique vs `knownAt` : temps de connaissance système).
3. Arbitrer de manière déterministe les conflits de hiérarchie des normes (une LFC surclassant une LF).
4. Interdire la mise en production de tout barème non officiellement confirmé (statut `UNVERIFIED`).

---

## 2. Décisions Architecturales Majeures

### 2.1 Sérialisation Canonique RFC 8785 (JCS) & Hachage SHA-256
- Les objets JSON sont sérialisés selon la norme **RFC 8785 (JSON Canonicalization Scheme)** :
  - Tri lexicographique strict des clés par unités de code UTF-16.
  - Normalisation des nombres (-0 devient 0, suppression des zéros non significatifs).
  - Élimination des espaces superflus.
- Le condensat d'intégrité `content_hash` est calculé par `SHA-256` sur ce flux canonique.

### 2.2 Signature Asymétrique Ed25519 & Détection `TAMPERED`
- Tout pack réglementaire est signé par clé asymétrique **Ed25519** (RFC 8032).
- Lors du chargement ou de la vérification, si le condensat recalculé ou la signature ne correspondent pas au contenu canonique, le pack est classé `TAMPERED` et son exécution est immédiatement rejetée.
- Les clés privées de signature de l'éditeur ne sont jamais stockées dans le dépôt Git ni en base de données client.

### 2.3 Contraintes d'Exclusion Temporelle PostgreSQL (`btree_gist`)
- La table `reg_pack_item` intègre une contrainte d'exclusion GiST :
  ```sql
  CONSTRAINT uq_no_overlap_active_item EXCLUDE USING gist (
      item_code WITH =,
      source_hierarchy WITH =,
      daterange(valid_from, COALESCE(valid_to, '9999-12-31'::date), '[]') WITH &&
  ) WHERE (superseded_at IS NULL);
  ```
- Tout chevauchement temporel non résolu entre items de même code et même rang hiérarchique provoque une violation d'exclusion immédiate avec code d'erreur standard PostgreSQL **SQLSTATE 23P01**.

### 2.4 Trigger d'Immuabilité des Packs Publiés
- Un trigger PostgreSQL `trg_reg_pack_immutable` verrouille la table `reg_pack` dès qu'un enregistrement passe au statut `PUBLISHED`.
- Toute tentative d'instruction `UPDATE` ou `DELETE` est interceptée et rejetée avec **SQLSTATE 55000**, sauf procédure formelle de révocation (`status = 'REVOKED'`).

### 2.5 Hiérarchie des Normes & Résolution `LFC > LF`
- Poids de préséance juridique : `LFC (50) > LF (40) > DECRET (30) > ARRETE (20) > DOCTRINE (10)`.
- En cas de concurrence sur une date d'effet `asOf`, la norme de rang supérieur l'emporte de façon déterministe.
- À rang égal, la version enregistrée le plus récemment dans le système prévaut.

### 2.6 Portes de Publication Strictes (Publication Gates)
Avant de pouvoir passer au statut `PUBLISHED`, un pack doit franchir avec succès 7 portes suspensives :
1. **Zéro UNVERIFIED :** Aucun paramètre ne doit être au statut `UNVERIFIED`.
2. **Jeu doré obligatoire :** Toute règle de calcul (`RULE`) doit posséder au moins un jeu doré de test.
3. **Absence de chevauchement :** Les plages temporelles doivent être étanches.
4. **Cohérence référentielle :** Tous les paramètres requis par les règles doivent être présents dans le pack.
5. **Approbation à 4 yeux :** Deux approbateurs distincts obligatoires.
6. **Maker-Checker strict :** L'auteur ne peut ni approuver ni publier son propre pack.
7. **Validation certifiée :** Attestation obligatoire d'un expert-comptable ou fiscaliste habilité (`validatedByExpert`).

---

## 3. Conformité & Validation du Seed `DZ_LF_2026_DRAFT`

Le pack de référence 2026 a été instancié dans `packages/decision-engine/fixtures/packs/DZ_LF_2026_DRAFT.json`. Il contient :
- Les barèmes consolidés (IBS 19%/23%/26%, TVA 19%/9%, seuil espèces 300 000 DA TTC).
- Les éléments en attente de confirmation officielle au JORADP marqués explicitement `UNVERIFIED` (plafond IFU 8 M DA, amortissement véhicules de tourisme 3 M DA).

Le test unitaire probatoire démontre que le pack `DZ_LF_2026_DRAFT` est **systématiquement rejeté à la publication** (Code: `GATE-01-ZERO-UNVERIFIED`), prévenant ainsi toute application non homologuée en production.

---

## 4. Résultats des Tests de la Phase 1

- `pnpm --filter @docteurflotte/decision-engine test` : 5 suites, 24 tests unitaires et basés sur les propriétés exécutés avec 100% de succès.
- Vérification CLI : `pnpm pack:sign` et `pnpm pack:verify` opérationnels en mode hors-ligne.

