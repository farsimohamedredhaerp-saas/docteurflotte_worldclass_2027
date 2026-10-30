# ALGERIA_REGULATORY_REGISTER.md — Registre Réglementaire & Fiscal Officiel (v2.0)

**Produit :** Plateforme Souveraine DocteurFlotte (Marché Algérien)  
**Niveau :** Référentiel Légal, Fiscal & Réglementaire National (Preuves JORADP)  
**Alignement :** [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) (Section 5), [`algeria-regulatory-evidence`](file:///e:/docteurflotte_2027/.agents/skills/algeria-regulatory-evidence/SKILL.md)  
**Date de révision :** 2026-10-26  
**Statut :** ACCEPTÉ & CONTRACTUEL (Révisé Suite à Audit Expert)  

---

## 1. Clause de Non-Certification Juridique Automatique

> [!IMPORTANT]
> **Avertissement Légal Conforme à AGENTS.md :**  
> La plateforme DocteurFlotte est un progiciel d'aide à la décision, d'anticipation documentaire et de maintenance prédictive. **Elle ne se substitue pas aux organismes régulateurs d'État (ENACTA, Direction Générale des Impôts, Ministère des Transports, ANPDP) et ne constitue pas une homologation juridique d'office.**  
> Tout barème fiscal ou périodicité réglementaire est configuré sous la responsabilité d'un réviseur habilité (`RULE_APPROVER`), dispose d'un statut de vérification (`VERIFIED_ACTIVE`, `HISTORICAL_SUPERSEDED`, `PENDING_REVIEW`) et doit être vérifié avec le Journal Officiel de la République Algérienne Démocratique et Populaire (JORADP).

---

## 2. Registre des Textes Officiels & Barèmes Intégrés

### 2.1 Prix des Carburants Routiers (Réseau Naftal)

#### A. Tarifs en Vigueur à Compter du 1er Janvier 2026 (Statut : `VERIFIED_ACTIVE`)
- **Identifiant Règle :** `REG-FUL-2026-01`
- **Texte / Source Officielle :** Communiqué du Ministère des Hydrocarbures et des Mines portant ajustement des prix des carburants à compter du 1er janvier 2026 (diffusé via l'Agence de Presse Officielle et la Radio Algérienne le 2 janvier 2026).
- **Date d'Effet :** 1er janvier 2026.
- **Tarifs Officiels Homologués :**
  - Gazole routier : **31,00 DA / litre** (TVA 19 % incluse).
  - Essence sans plomb (95 RON) : **47,00 DA / litre**.
  - Sirghaz (GPL/C) : **12,00 DA / litre**.
- **Impact Économique :** Actualisation des coûts kilométriques de transport et des arbitrages de rentabilité des pleins Naftal.
- **Règles Fiscales Associées :** Déductibilité intégrale de la TVA sur le gazole pour les véhicules utilitaires et de transport de marchandises (Art. 30 du Code des Taxes sur le Chiffre d'Affaires).

#### B. Tarifs Historiques 2020–2025 (Statut : `HISTORICAL_SUPERSEDED`)
- **Identifiant Règle :** `REG-FUL-2020-01`
- **Texte Officiel :** Décret exécutif n° 20-141 du 2 juin 2020 (JORADP n° 33 du 3 juin 2020).
- **Période d'Effet :** Du 3 juin 2020 au 31 décembre 2025.
- **Tarifs Historiques :** Gazole : 29,01 DA/L ; Essence sans plomb : 45,62 DA/L ; GPL/C : 9,00 DA/L.
- **Usage Système :** Conservé en lecture seule pour le calcul rétroactif et l'audit des exercices fiscaux clos antérieurs à 2026.

---

### 2.2 Contrôle Technique Automobile (ENACTA)
- **Identifiant Règle :** `REG-ENACTA-2003-01` (Statut : `VERIFIED_ACTIVE`)
- **Texte Officiel :** Décret exécutif n° 03-223 du 10 juin 2003 relatif à l'organisation du contrôle technique des véhicules automobiles (modifié par le Décret exécutif n° 06-231, JORADP n° 37 du 11 juin 2003).
- **Périodicités Légales Obligatoires :**
  1. *Poids Lourds (PTAC > 3,5 t) et Tracteurs Routiers :* Contrôle périodique **tous les six (6) mois** dès la première mise en circulation.
  2. *Transports de Voyageurs et Taxis :* Contrôle périodique **tous les six (6) mois**.
  3. *Véhicules de Transport de Matières Dangereuses (HAZMAT) :* Contrôle périodique **tous les six (6) mois** assorti de la visite d'épreuve de la citerne.
  4. *Véhicules Utilitaires Légers (Fourgons, Pick-ups $\le$ 3,5 t) :* Premier contrôle après **deux (2) ans**, puis contrôle périodique **annuel (tous les 12 mois)**.
  5. *Véhicules Particuliers (VP) :* Premier contrôle après **deux (2) ans**, puis annuel.
- **Décision Système à Échéance :** Pré-alerte à J-30, J-15, J-7. À J-0 à 00h01, passage automatique en statut d'avertissement réglementaire avec émission du dossier d'inspection pré-ENACTA.

---

### 2.3 Vignette Automobile (Loi de Finances pour 2025 — Article 55)
- **Identifiant Règle :** `REG-VIG-2025-01` (Statut : `VERIFIED_ACTIVE`)
- **Texte Officiel :** Ordonnance n° 76-103 portant Code du Timbre (Articles 300 à 303) modifiée par l'Article 55 de la Loi de Finances pour 2025 (Loi n° 24-07).
- **Source Officielle :** Direction Générale des Impôts (MFDGI) — Barème actualisé de la vignette automobile sur véhicules automobiles.
- **Période d'Acquisition Légale :** Annuelle (du 1er mars au 31 mars).
- **Tranches Officielles des Véhicules Utilitaires & Professionnels :**
  - *Utilitaires de charge utile $\le 2{,}5\text{ tonnes}$ :* Barème selon l'âge du véhicule (neuf à 2 ans, 3 à 6 ans, 7 ans et plus).
  - *Véhicules de charge utile entre $2{,}5\text{ tonnes}$ et $5{,}5\text{ tonnes}$ :* Barème intermédiaire adapté aux fourgons lourds et camions de distribution.
  - *Poids Lourds $> 5{,}5\text{ tonnes}$ et Tracteurs Routiers :* Barème supérieur par tranches d'âge.
  - *Véhicules de Transport en Commun de Voyageurs :* Barème spécifique selon le nombre de places et l'âge.
- **Exonérations Légales Spécifiques (Art. 302 CIDTA) :** Exonération totale pour les véhicules équipés d'un kit Sirghaz / GPL et les tracteurs agricoles.

---

### 2.4 Plafonnement Fiscal de l'Amortissement des Véhicules de Tourisme
- **Identifiant Règle :** `REG-TAX-AMORT-01` (Statut : `VERIFIED_ACTIVE`)
- **Texte Officiel :** Article 141-2 du Code des Impôts Directs et Taxes Assimilées (CIDTA).
- **Règle Fiscale :** La base d'amortissement déductible de l'Impôt sur les Bénéfices des Sociétés (IBS) pour les véhicules de tourisme est plafonnée à **3 000 000 DA** par véhicule. L'amortissement excédant ce plafond fait l'objet d'une réintégration fiscale extra-comptable obligatoire.
- **Exclusion du Plafonnement :** Les véhicules constituant l'outil principal de l'activité (taxis, ambulances, auto-écoles, véhicules de transport public de personnes) sont amortissables à 100 % de leur valeur d'acquisition réelle.

---

### 2.5 Protection des Données Personnelles (Loi n° 18-07 Modifiée par la Loi n° 25-11 / ANPDP)
- **Identifiant Règle :** `REG-ANPDP-2025-01` (Statut : `VERIFIED_ACTIVE`)
- **Textes Officiels de Référence :**
  - Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel (JORADP n° 38 du 10 juin 2018).
  - **Loi n° 25-11 du 24 juillet 2025 modifiant et complétant la loi n° 18-07** (Journal Officiel de la République Algérienne n° 48 du 24 juillet 2025).
- **Dispositions Techniques & Analyses Juridiques Appliquées :**
  1. *Hébergement Souverain Local :* L'hébergement des bases de données de production sur le territoire national algérien constitue un impératif architectural de DocteurFlotte. Il garantit la stricte conformité avec le régime d'autorisation préalable exigé par l'ANPDP pour tout flux transfrontalier de données (Art. 44 de la Loi 18-07 modifiée).
  2. *Risque de Réidentification des Flux Télématiques :* L'absence de nom de conducteur ne confère pas un anonymat absolu aux données GPS : un IMEI matériel, des coordonnées géographiques récurrentes (dépôts, trajets réguliers) et des horaires constituent des données pseudonymisées présentant un risque de réidentification. Tout routage vers une passerelle externe (ex: failover Flespi) exige une tokenisation technique stricte, un masquage des identifiants métier et une convention de sous-traitance conforme.
  3. *Politique de Rétention des Positions GPS :* La conservation des positions géographiques brutes est fixée à **12 mois glissants** au titre d'une politique interne stricte de minimisation des données (Privacy-by-Design), les besoins historiques au-delà de 12 mois étant assurés par agrégation statistique anonymisée (kilométrage mensuel, heures d'utilisation, consommations).

