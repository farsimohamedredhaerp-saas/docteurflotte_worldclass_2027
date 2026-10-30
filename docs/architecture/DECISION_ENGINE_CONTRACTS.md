# DECISION_ENGINE_CONTRACTS.md — Spécifications Scientifiques des 6 Algorithmes Déterministes (v2.0)

**Produit :** Plateforme Souveraine DocteurFlotte (Marché Algérien)  
**Niveau :** Document Directeur Scientifique & Mathématique — Algorithmes Physiques & Limites de Validité  
**Alignement :** [`MASTER_SPEC.md`](file:///e:/docteurflotte_2027/MASTER_SPEC.md) (Section 4), [`CONTROL_PLANE_ARCHITECTURE.md`](file:///e:/docteurflotte_2027/docs/architecture/CONTROL_PLANE_ARCHITECTURE.md)  
**Date de révision :** 2026-10-26  
**Statut :** ACCEPTÉ & CONTRACTUEL (Révisé Suite à Audit Expert)  

---

## 1. Principes Communs aux Contrats Algorithmiques

Pour bannir toute sur-interprétation ou faux positif en exploitation, tout modèle exécuté par le moteur décisionnel respecte obligatoirement ces invariants :
1. **Zéro Décision sur Données Insuffisantes :** Si la qualité minimale des données d'entrée ($C_{\text{data}}$) est inférieure au seuil admissible ($< 0.70$), l'algorithme ne produit pas de valeur extrapolée : il retourne un état formel `DECISION_UNAVAILABLE` avec la cause exacte (`INSUFFICIENT_TELEMETRY_QUALITY`).
2. **Double Score de Confiance :**
   - **Confiance dans les Données ($C_{\text{data}} \in [0, 1]$) :** Évalue la fraîcheur, l'absence de bruit et l'intégrité de la série temporelle.
   - **Confiance dans le Modèle ($C_{\text{model}} \in [0, 1]$) :** Évalue si le véhicule se trouve dans le domaine nominal de validité des équations physiques et dispose de coefficients calibrés.
3. **Statut Expérimental vs Validé :** Tout algorithme dont les paramètres empiriques n'ont pas fait l'objet d'un calibrage sur banc ou sur flotte pilote est marqué `EXPERIMENTAL`. Il fonctionne en mode d'observation passive et ne peut pas déclencher d'ordre de travail bloquant automatique.

---

## 2. Contrat 1 : Vieillissement Thermochimique de l'Huile Moteur (Arrhenius)

- **Identifiant :** `ALG-ENG-01-ARRHENIUS` (Version 2.0-REVISED)
- **Objectif Métier :** Quantifier l'oxydation thermique accélérée et la déplétion d'additifs de l'huile moteur soumise aux fortes chaleurs estivales d'Algérie ($> 40^\circ\text{C}$ ambiant) et aux longs régimes de ralenti (climatisation cabine stationnaire).
- **Principe Physique :** Modélisation de la cinétique chimique d'oxydation de l'huile de base par la loi d'Arrhenius, traduite en kilomètres d'usure équivalents.
- **Entrées Typées & Unités :**
  - $T_{\text{oil}}$ : Température d'huile moteur [$^\circ\text{C}$] issue du bus CAN (J1939 SPN 175). Si indisponible, fallback temporaire sur $T_{\text{coolant}} + 10^\circ\text{C}$ avec décote de confiance $C_{\text{model}} \le 0.70$.
  - $\Delta t$ : Intervalle d'intégration [secondes] ($1 \le \Delta t \le 60$).
  - $v(t)$ : Vitesse véhicule [km/h].
  - $RPM$ : Régime de rotation [tr/min].
  - $\text{EngineLoad}$ : Charge moteur [%].
- **Formule Mathématique d'Accélération Thermique :**
  $$k_{\text{Arrhenius}}(T_{\text{oil}}) = \exp\left( \frac{E_a}{R} \cdot \left[ \frac{1}{T_{\text{ref}} + 273.15} - \frac{1}{T_{\text{oil}} + 273.15} \right] \right)$$
  - Paramètres de référence : $E_a / R = 6\,500\text{ K}$ (énergie d'activation typique d'oxydation des huiles minérales/semi-synthétiques API CI-4 / ACEA E7), $T_{\text{ref}} = 90^\circ\text{C}$ (363.15 K).
- **Cumul d'Usure Kilométrique Équivalente :**
  $$\Delta \text{km}_{\text{eq}} = \int \left[ k_{\text{Arrhenius}}(T_{\text{oil}}(t)) \cdot \frac{v(t)}{3600} + k_{\text{idle}} \cdot \mathbf{1}_{\text{idle}}(t) \cdot \frac{v_{\text{idle\_eq}}}{3600} \right] dt$$
  - Condition de ralenti prolongé : $\mathbf{1}_{\text{idle}}(t) = 1$ si $RPM < 800$, $\text{EngineLoad} < 25\%$ et $v < 3\text{ km/h}$.
  - Vitesse équivalente au ralenti avec climatisation : $v_{\text{idle\_eq}} = 25\text{ km/h}$ virtuel par heure de ralenti, pondéré par $k_{\text{idle}} = 1.80$.
- **Validation Mathématique du Cas de Référence :**
  Pour $T_{\text{ref}} = 90^\circ\text{C}$ et $T_{\text{oil}} = 110^\circ\text{C}$ (383.15 K) :
  $$k(110^\circ\text{C}) = \exp\left(6500 \times \left[\frac{1}{363.15} - \frac{1}{383.15}\right]\right) = \exp(6500 \times 0.00014374) \approx \exp(0.9343) \approx 2.545$$
  - **Cas de Test de Référence Homologué :** Pour 100 km réels parcourus en continu à $T_{\text{oil}} = 110^\circ\text{C}$ sans ralenti, l'usure équivalente calculée est de **$254.5 \pm 2.0\text{ km}$** (et non 185 km).

---

## 3. Contrat 2 : Indicateur de Santé au Démarrage Batterie (CVHI)

- **Identifiant :** `ALG-BAT-02-CRANKING-CVHI` (Version 2.0-REVISED)
- **Objectif Métier :** Détecter la dégradation de capacité de décharge et le risque de non-démarrage batterie avant immobilisation d'un véhicule.
- **Précision Méthodologique :** Le résultat est qualifié de `Cranking Voltage Health Indicator` (CVHI) et non de SOH absolu de laboratoire, la chute de tension dépendant également du courant de démarrage, de la résistance de contact du câblage et de l'état de charge (SOC).
- **Entrées Typées & Unités :**
  - $V_{\text{min}}$ : Tension minimale d'appel au démarreur [mV], échantillonnée par le boîtier télématique à $\ge 10\text{ Hz}$.
  - $T_{\text{amb}}$ : Température ambiante [$^\circ\text{C}$].
  - $\text{SystemVoltage}$ : 12V ou 24V.
- **Formule Mathématique & Compensation Thermique :**
  $$V_{\text{corrected}} = V_{\text{min}} + \left(15 \cdot \text{scale} \cdot (25 - T_{\text{amb}})\right) \quad (\text{scale} = 2.0 \text{ pour 24V, } 1.0 \text{ pour 12V})$$
  $$\text{CVHI}_{\text{pct}} = \text{clip}\left( \frac{V_{\text{corrected}} - V_{\text{crit}}}{V_{\text{new}} - V_{\text{crit}}} \times 100, \, 0, \, 100 \right)$$
  - Seuils 24V : $V_{\text{new}} = 22\,400\text{ mV}$, $V_{\text{crit}} = 19\,200\text{ mV}$.
  - Seuils 12V : $V_{\text{new}} = 11\,200\text{ mV}$, $V_{\text{crit}} = 9\,600\text{ mV}$.
- **Règle de Prédiction `days_to_failure` :**
  - Exige au minimum 15 démarrages enregistrés sur au moins 5 jours calendaires distincts.
  - La régression linéaire sur $V_{\text{corrected}}$ doit présenter un coefficient de détermination $R^2 \ge 0.75$.
  - Si le nombre de démarrages est $< 15$ ou si $R^2 < 0.75$, le champ `days_to_failure` retourne strictement `null` avec statut `PREDICTION_UNAVAILABLE`.
- **Cas de Test de Référence :** Sur un camion 24V à $45^\circ\text{C}$ avec $V_{\text{min}} = 18\,600\text{ mV}$ :
  $V_{\text{corrected}} = 18\,600 + (15 \times 2 \times [25 - 45]) = 18\,000\text{ mV} \implies \text{CVHI} = 0\%$.

---

## 4. Contrat 3 : Détecteur d'Anomalie Thermique Résiduelle Culasse / Radiateur

- **Identifiant :** `ALG-THM-03-COOLING-RESIDUAL` (Version 2.0-REVISED)
- **Objectif Métier :** Détecter le colmatage progressif du radiateur par le sable/chott et la perte de charge de la pompe à eau avant surchauffe destructrice du joint de culasse.
- **Spécificité Calibrée :** Le paramètre $T_{\text{thermostat}}$ est une variable obligatoire injectée selon la motorisation du véhicule (ex: 83 °C pour Renault Kangoo 1.5 dCi, 87 °C pour Mercedes OM457, 82 °C pour Cummins ISLe), jamais codée en dur.
- **Modèle EWMA Résiduel :**
  $$T_{\text{expected}} = T_{\text{thermostat}} + \left(14 \cdot \frac{\text{Load}}{100}\right) + \left(0.35 \cdot \max(0, T_{\text{amb}} - 25)\right) - \left(0.85 \cdot \sqrt{\max(0, v)}\right)$$
  $$\text{Residual}_t = T_{\text{coolant}} - T_{\text{expected}}$$
  $$\text{EWMA}_t = (0.15 \cdot \text{Residual}_t) + (0.85 \cdot \text{EWMA}_{t-1})$$
- **Classification Diagnostique :**
  - $\text{EWMA} \ge +11.0^\circ\text{C}$ ou $T_{\text{coolant}} \ge T_{\text{oem\_critical}}$ $\rightarrow$ `CRITICAL_OVERHEAT_RISK` (Seuil OEM prioritaire sur la valeur générique).
  - $+7.5^\circ\text{C} \le \text{EWMA} < +11.0^\circ\text{C}$ pendant $> 15\text{ min}$ $\rightarrow$ `RADIATOR_CLOGGING_OR_PUMP_WEAR`.
  - $\text{EWMA} \le -12.0^\circ\text{C}$ (à $v > 50\text{ km/h}$) $\rightarrow$ `THERMOSTAT_STUCK_OPEN_OVERCONSUMPTION`.
- **Phase d'Apprentissage :** Mode observation passive pendant les 14 premiers jours d'exploitation d'un véhicule avant génération d'alertes opérationnelles.

---

## 5. Contrat 4 : Modèle d'Énergie Dissipée et Usure des Freins (Archard)

- **Identifiant :** `ALG-BRK-04-ARCHARD-WEAR` (Version 2.0-REVISED)
- **Objectif Métier :** Estimation de premier niveau de l'énergie thermique absorbée par les garnitures de freins sur parcours accidentés (descente des Gorges de Kherrata, Chréa, Constantine).
- **Formule Énergétique Complète (Unités Cohérentes) :**
  Les vitesses en km/h sont impérativement converties en m/s ($v / 3.6$) et le dénivelé gravitationnel est intégré :
  $$E_{\text{kin}} = \frac{1}{2} M \left[ \left(\frac{v_{\text{start}}}{3.6}\right)^2 - \left(\frac{v_{\text{end}}}{3.6}\right)^2 \right]$$
  $$\Delta E_{\text{pot}} = M \cdot g \cdot \max(0, \, h_{\text{start}} - h_{\text{end}})$$
  $$E_{\text{brake}} = \max\left(0, \, E_{\text{kin}} + \Delta E_{\text{pot}} - W_{\text{aero}} - W_{\text{roll}} - W_{\text{retarder}} - W_{\text{engine\_brake}}\right)$$
- **Usure Estimée & Limites :**
  - Taux nominal de référence : $25.0\text{ MJ/mm}$ pour garniture poids lourds (valeur de premier ordre indicative, soumise à étalonnage par type de garniture).
  - L'épaisseur résiduelle affichée est une estimation probabiliste et ne dispense pas du contrôle physique lors des inspections ENACTA.

---

## 6. Contrat 5 : Détection d'Encrassement et Assistance FAP (DPF)

- **Identifiant :** `ALG-DPF-05-SOOT-ACCUMULATION` (Version 2.0-REVISED)
- **Objectif Métier :** Détecter le colmatage critique du filtre à particules sur véhicules Euro 5 / Euro 6 pour prévenir la perte de puissance et les avaries de turbo.
- **Protocole Opérationnel en 3 Paliers (Interdiction de Déclenchement Automatique Brutal) :**
  1. **Palier 1 — Détection d'Anomalie :** Émission d'une alerte préventive si la masse de suie estimée ECU dépasse 35 g ou si la contre-pression différentielle $\Delta P$ excède le profil charge/régime normal.
  2. **Palier 2 — Recommandation Diagnostique :** Si suie $\ge 45\text{ g}$ ou $\Delta P \ge 300\text{ mbar}$, émission d'une consigne d'inspection atelier selon la procédure officielle du constructeur.
  3. **Palier 3 — Autorisation Humaine d'Exécution :** Aucune régénération forcée n'est commandée automatiquement par l'application. Elle exige l'intervention d'un technicien habilité vérifiant les préconditions impératives (niveau d'huile conforme, température moteur $\ge 70^\circ\text{C}$, réservoir $\ge 25\%$, aucun défaut injecteur actif).

---

## 7. Contrat 6 : Détection d'Anomalie de Consommation & Fuite Carburant (CUSUM)

- **Identifiant :** `ALG-FUL-06-CUSUM-FRAUD` (Version 2.0-REVISED)
- **Objectif Métier :** Détecter les écarts anormaux entre le niveau de carburant mesuré dans le réservoir et le volume réellement injecté par le moteur (ECU).
- **Qualification Juridique Prudente :** Toute alerte générée est qualifiée de `SUSPECTED_FUEL_ANOMALY` ou `SUSPECTED_FUEL_LOSS`. Elle ne constitue pas une preuve irréfutable de vol et requiert une vérification contradictoire (étalonnage de jauge, contrôle de fuite durite, conditions de pente).
- **Algorithme Déterministe en Deux Voies :**
  1. *Voie 1 — Décroissance Brutale à l'Arrêt ($v = 0$, contact coupé) :*
     Baisse de jauge $\ge 15.0\text{ L}$ en moins de 10 minutes $\rightarrow$ Événement `SUDDEN_LEVEL_DROP_STOPPED`.
  2. *Voie 2 — Dérive Continue en Roulant (Page-Hinkley CUSUM avec Convention de Signe Explicite) :*
     Soit $\Delta V_{\text{tank}} = V_t - V_{t-1}$ la variation signée du volume réservoir ($\Delta V_{\text{tank}} \le 0$ en roulage).
     Soit $C_{\text{ECU}} \ge 0$ la consommation positive intégrée par le calculateur moteur sur la même fenêtre $\Delta t$.
     L'écart d'anomalie de consommation est défini par :
     $$e_t = -\Delta V_{\text{tank}} - C_{\text{ECU}}$$
     - En régime normal : $-\Delta V_{\text{tank}} \approx C_{\text{ECU}} \implies e_t \approx 0$.
     - En cas de fuite ou soutirage en ligne : $-\Delta V_{\text{tank}} > C_{\text{ECU}} \implies e_t > 0$.
     $$\text{CUSUM}_t = \max\left(0, \, \text{CUSUM}_{t-1} + e_t - \nu\right)$$
     où $\nu$ représente la tolérance au ballottement et bruit de capteur par fenêtre temporelle ($0.60\text{ L}$ par tranche de 10 km).
     - Si $\text{CUSUM}_t \ge \max(12.0\text{ L}, \, \text{Capacity} \times 0.05)$ $\rightarrow$ Déclenchement de l'alerte `SUSPECTED_FUEL_LOSS`.

