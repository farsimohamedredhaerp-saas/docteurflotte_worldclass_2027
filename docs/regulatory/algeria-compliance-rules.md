# Packs Réglementaires et Conformité Algérienne

**Référence :** Issu de la Section 9 complète de l'`AGENTS.md` v1.0.  
**Statut :** Spécification Réglementaire & Gouvernance Juridique.

---

## 1. Position de Principe

- Le SaaS n'est pas un conseiller juridique et ne fournit aucune garantie automatique ou globale de conformité.
- **Interdiction Formelle d'Invention Juridique :** L'agent ne doit jamais inventer une loi, un article de décret, un barème fiscal, une pénalité, un seuil ou une date d'entrée en vigueur.
- Une règle réglementaire n'a de valeur dans le système que si elle est adossée à un **dossier de preuve complet** pointant vers une source primaire officielle vérifiable (JORADP, ministères, DGI).

---

## 2. Structure Minimale d'un Dossier de Preuve Réglementaire

Chaque règle réglementaire enregistrée dans un pack doit comporter :
- `rule_id` : Identifiant stable (ex: `DZ-ROAD-SAFETY-TECH-INSPECT-2004`).
- `official_reference` : Numéro, date et intitulé du texte légal (ex: *Loi n° 01-14 du 19 Joumada El Oula 1422 relative à la sécurité routière*).
- `url_or_locator` : Lien vers le Journal Officiel officiel (https://www.joradp.dz) ou référence d'archive officielle.
- `articles` : Articles précis du texte législatif.
- `effective_date` : Date exacte d'application légale.
- `scope` : Types d'actifs assujettis, exemptions légales et conditions d'application.
- `validation_status` : Statut du cycle de vie du dossier.
- `validated_by` : Identifiant de l'administrateur juridique ayant approuvé la règle.
- `last_reviewed_at` : Horodatage de la dernière revue de validité.

---

## 3. Thèmes Réglementaires Initiaux (Analyse Prioritaire)

Ces thèmes constituent les domaines d'application à instruire sans présomption d'obligations non vérifiées :
1. **Contrôle Technique Périodique Automobile & Poids Lourds :** Périodicité selon l'âge et le tonnage du véhicule, centres agréés.
2. **Conformité des Engins de Chantier & Appareils de Levage :** Visites de sécurité périodiques, certificats d'épreuve et de conformité des câbles/crochets.
3. **Transport Routier Réglementé :** Matières dangereuses (ADR/contexte algérien), chronotachygraphe, temps de conduite et de repos des chauffeurs.
4. **Taxes & Vignettes :** Vignette automobile annuelle, barèmes fiscaux de circulation selon la puissance fiscale (DGI).
5. **Protection des Données Personnelles (Loi n° 18-07) :** Encadrement des traces GPS géolocalisées, consentement des conducteurs, conservation bornée et déclaration auprès de l'ANPDP.

---

## 4. Cycle de Vie et Publication d'une Règle

```text
[Texte JORADP Identifié]
            │
            ▼
   [Dossier DRAFT] ───────────> Saisie des critères, non opposable en production
            │
            ▼
 [Revue UNDER_REVIEW] ────────> Vérification juridique & validation du périmètre
            │
            ▼
  [Statut APPROVED] ──────────> Règle opposable dans le pack pays / tenant
            │
            ├─────────────────> [SUSPENDED] (moratoire officiel)
            │
            ▼
  [Statut SUPERSEDED] ────────> Règle abrogée ou remplacée par un texte plus récent
```

- **Règle Stricte en Production :** Une règle à l'état `DRAFT` ou `UNDER_REVIEW` ne doit jamais déclencher d'alerte bloquante de « non-conformité légale ».
- **Immutabilité Historique :** La modification d'un décret ne réécrit jamais le diagnostic passé d'un contrôle clos sous l'ancienne réglementation.
