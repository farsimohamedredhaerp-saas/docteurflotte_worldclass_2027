# SPÉCIFICATION DU FORMAT DE PACK PAYS & MÉTIER (PACK SCHEMA)

**Statut :** DOCUMENT TECHNIQUE DE RÉFÉRENCE  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/regulatory/algeria-compliance-rules.md`, `packages/contracts`  

---

## 1. Principes de Conception

1. **Aucun paramètre en dur dans le code :** Les taux de TVA, plafonds fiscaux, barèmes de vignettes, intervalles de contrôle technique relèvent exclusivement du pack versionné.
2. **Séparation étanche Réglementaire vs Suggestions :**
   - Une règle **réglementaire** doit obligatoirement avoir une source officielle (ex: JORADP), un dossier de preuve complet et un statut d'approbation formel (`DRAFT`, `IN_REVIEW`, `APPROVED`).
   - Une règle ou un intervalle de **maintenance opérationnelle** est une simple suggestion (recommandation constructeur / bonne pratique) modifiable par le tenant.
3. **Validation automatique en CI :** Tout pack soumis doit être validé syntaxiquement (JSON Schema / Zod) et exécuté contre une suite de tests unitaires dédiés.

---

## 2. Schéma JSON/YAML du Pack (Exemple : `DZ-2026.json`)

```json
{
  "$schema": "https://docteurflotte.io/schemas/country-pack.v1.json",
  "id": "dz-algeria-transport-btp",
  "name": "Pack Algérie — Transport, Logistique et BTP",
  "country_code": "DZ",
  "version": "1.0.0",
  "currency": "DZD",
  "effective_date": "2026-01-01",
  "metadata": {
    "author": "DocteurFlotte Legal & Ops Team",
    "status": "APPROVED",
    "reviewed_by": "Legal Compliance Lead"
  },
  "regulatory_rules": [
    {
      "rule_id": "DZ-TAX-VL-AMORTIZATION-CAP",
      "name": "Plafond de déductibilité fiscale d'amortissement des véhicules de tourisme",
      "version": "1.0",
      "legal_basis": {
        "source": "JORADP",
        "act": "Code des Impôts Directs et Taxes Assimilées (CIDTA), Art. 141",
        "url_or_ref": "Journal Officiel N°..."
      },
      "status": "APPROVED",
      "parameters": {
        "ceiling_amount": 3000000,
        "currency": "DZD",
        "asset_categories": ["PASSENGER_CAR", "VL_TOURISME"]
      }
    }
  ],
  "operational_suggestions": [
    {
      "suggestion_id": "SUGG-MAINT-HEAVY-TRUCK-OIL",
      "name": "Vidange moteur recommandée pour poids lourds (usage routier standard)",
      "asset_category": "HEAVY_TRUCK",
      "suggested_trigger": {
        "type": "METER_DISTANCE",
        "interval_value": 30000,
        "unit": "km",
        "tolerance_alert_before": 2000
      },
      "disclaimer": "Suggestion opérationnelle indicative. Ajuster selon préconisations constructeur et conditions d'exploitation sévères."
    },
    {
      "suggestion_id": "SUGG-MAINT-EXCAVATOR-HYDRAULIC",
      "name": "Contrôle circuit hydraulique engin de chantier",
      "asset_category": "EXCAVATOR",
      "suggested_trigger": {
        "type": "METER_HOURS",
        "interval_value": 500,
        "unit": "hours",
        "tolerance_alert_before": 50
      },
      "disclaimer": "Suggestion opérationnelle indicative pour engins à compteur horaire."
    }
  ]
}
```

---

## 3. Contrôles Automatiques Requis en CI pour les Packs

Chaque modification d'un pack pays déclenche automatiquement :
1. **Validation structurelle :** Validation contre le schéma JSON schema officiel `country-pack.v1.json`.
2. **Contrôle de complétude réglementaire :** Toute règle avec `status: "APPROVED"` doit comporter un bloc `legal_basis` non vide avec texte officiel référencé.
3. **Tests de calculs :** Exécution d'un jeu de tests simulant l'application des plafonds et taux sur des actifs fictifs pour vérifier l'absence d'erreurs d'arrondi ou de régression.
