# DICTIONNAIRE UNIFIÉ DES MÉTRIQUES & INDICATEURS (METRICS DICTIONARY)

**Statut :** DOCUMENT TECHNIQUE DE RÉFÉRENCE  
**Date :** 2026-10-23  
**Référence :** `AGENTS.md` v1.1, `docs/product/mvp-scope-and-activation.md`, `packages/contracts`  

---

## 1. Schéma d'un Indicateur Métier

Chaque indicateur calculé ou affiché sur la plateforme doit être formalisé selon le standard suivant :

```yaml
id: string # Identifiant machine stable (ex: ASSET_DOWNTIME_HOURS)
name: string # Intitulé lisible
version: string # Version de la formule (ex: 1.0)
formula: string # Formule de calcul explicite en pseudo-code ou SQL
unit: string # Unité standardisée (DA, km, h, %, ratio)
source: string # Tables / sources de données d'entrée
periodicity: string # Période de calcul (horaire, journalière, mensuelle, événementielle)
owner: string # Rôle responsable (Maintenance, Finance, Logistique)
confidence_threshold: string # Critère de validité des données d'entrée
```

---

## 2. Exemples d'Indicateurs Référencés pour le MVP

### Exemple 1 : Écart Budgétaire de Maintenance (`MAINT_BUDGET_VARIANCE`)
- **ID :** `MAINT_BUDGET_VARIANCE`
- **Nom :** Écart budgétaire maintenance par actif ou flotte
- **Version :** `1.0`
- **Formule :**  
  $$\text{Écart} = \sum(\text{Coûts Réels Constatés}) - \sum(\text{Budget Alloué})$$
- **Unité :** Dinars Algériens (`DA`) ou devise du tenant
- **Sources :** `CostEntry` (réels clôturés) et `BudgetPlan` (enveloppe prévisionnelle)
- **Périodicité :** Mensuelle ou cumul annuel à date
- **Propriétaire :** Contrôleur de gestion / Responsable financier
- **Qualité requise :** 100% des interventions clôturées avec coût renseigné ; si des ordres de travail sont sans coût, l'indicateur est assorti du flag `DATA_INCOMPLETE`.

---

### Exemple 2 : Taux d'Immobilisation Opérationnelle (`ASSET_DOWNTIME_RATE`)
- **ID :** `ASSET_DOWNTIME_RATE`
- **Nom :** Taux d'indisponibilité technique pour maintenance
- **Version :** `1.0`
- **Formule :**  
  $$\text{Taux} = \frac{\sum(\text{Heures d'immobilisation pour panne/maintenance})}{\text{Heures calendaires ou heures planifiées de travail de la période}} \times 100$$
- **Unité :** Pourcentage (`%`)
- **Sources :** `MaintenanceWorkOrder.downtime_hours` ou écart `ended_at - started_at`
- **Périodicité :** Mensuelle
- **Propriétaire :** Responsable maintenance / Parc
- **Qualité requise :** Statut d'ordre de travail horodaté avec preuve de clôture.

---

### Exemple 3 : Coût Direct au Kilomètre / Heure (`COST_PER_USAGE_UNIT`)
- **ID :** `COST_PER_USAGE_UNIT`
- **Nom :** Coût d'exploitation direct par unité d'usage
- **Version :** `1.0`
- **Formule :**  
  $$\text{Coût Unitaire} = \frac{\sum(\text{Dépenses directes : carburant, maintenance, pneumatiques})}{\Delta\text{Compteur validé sur la période (km ou heures)}}$$
- **Unité :** `DA / km` ou `DA / h`
- **Sources :** `CostEntry` et `MeterReading` (filtrés sur `validation_status = VALID`)
- **Périodicité :** Mensuelle glissante
- **Propriétaire :** Contrôleur de gestion & Gestionnaire de parc
- **Qualité requise :** Interdiction stricte de calculer sur un compteur avec saut négatif ou statut `REJECTED`.

---

### Exemple 4 : Anticipation Préventive des Échéances (`MAINT_DUE_PROXIMITY`)
- **ID :** `MAINT_DUE_PROXIMITY`
- **Nom :** Proximité d'échéance de maintenance préventive
- **Version :** `1.0`
- **Formule :**  
  $$\Delta_{\text{km}} = \text{Seuil}_{\text{plan}} - \text{Dernier Relevé Validé}$$  
  $$\Delta_{\text{jours}} = \text{Date Échéance} - \text{Date Courante}$$
- **Unité :** `km`, `h` ou `jours`
- **Sources :** `MaintenancePlan` et `MeterReading` / `Asset.last_meter_value`
- **Périodicité :** Évalué à chaque réception d'un relevé de compteur valide
- **Propriétaire :** Planificateur de maintenance
- **Qualité requise :** Déclenchement de l'exception proactive si $\Delta_{\text{km}} \le \text{SeuilAlerte}_{\text{plan}}$.
