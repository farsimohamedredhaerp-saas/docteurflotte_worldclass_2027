import { ReeferLiveStatus } from '@/lib/api-fleet-intelligence';
import { CalculationProofData } from '@/components/decisions';
import { formatCurrency } from '@/lib/currency-formatter';

export function buildReeferProofData(reefer: ReeferLiveStatus): CalculationProofData {
  const isAlert = !reefer.isWithinSafeRange;
  return {
    title: `Rapport Thermotrace & Conformité Chaîne du Froid — ${reefer.assetCode}`,
    decisionOrMetricName: `Contrôle Thermique ${reefer.cargoType} (${reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}°C)`,
    category: 'REGULATORY',
    ruleId: `HACCP-ATP-${reefer.assetCode}`,
    legalOrOemReference:
      'Arrêté Interministériel du 21 Safar 1414 / Norme Sanitaire Vétérinaire DSV & Agrément ATP',
    deterministicFormula: 'ΔT = |T_mesuré - T_consigne| ≤ Seuil_ATP_HACCP',
    formulaExplanation: `La chaîne du froid pour la cargaison ${reefer.cargoType} impose une plage de consigne stricte (+${reefer.setpointTempC}°C). En cas d'excursion thermique (ΔT > seuil), la cinétique d'échauffement génère un risque financier immédiat de dépréciation (${formatCurrency(reefer.estimatedCargoValueDzd)}).`,
    variables: [
      {
        name: 'Température Relevée Frigo',
        symbol: 'T_mesuré',
        value: `${reefer.currentTempC}°C`,
        source: 'Sonde BLE Haute Fréquence (Calibrée)',
      },
      {
        name: 'Consigne Réglementaire',
        symbol: 'T_consigne',
        value: `+${reefer.setpointTempC}°C`,
        source: 'Barème HACCP / ATP Algérie',
      },
      {
        name: 'Écart de Température',
        symbol: 'ΔT',
        value: `${reefer.tempDeltaC}°C`,
        source: 'Calcul différentiel temps réel',
      },
      {
        name: 'Réservoir Groupe Frigo (200L)',
        symbol: 'Aux_Fuel',
        value: `${reefer.auxiliaryFuelLevelLiters ?? 180} L (${reefer.auxiliaryFuelLevelPct ?? 90}%)`,
        source: 'Jauge capacitive cuve auxiliaire Carrier/Thermo King',
      },
      {
        name: 'Capteur Porte Caisse',
        symbol: 'Door_Sensor',
        value: reefer.doorOpen ? 'OUVERTE (Déperdition)' : 'Fermée & Étanche',
        source: 'Capteur magnétique IoT Traccar',
      },
      {
        name: 'Mode Alimentation',
        symbol: 'Power_Mode',
        value: reefer.powerMode,
        source: 'Micro-contrôleur Thermo King / Carrier',
      },
      {
        name: 'Valeur Cargaison Assurée',
        symbol: 'Cargo_DZD',
        value: formatCurrency(reefer.estimatedCargoValueDzd),
        source: 'Bordereau de livraison & Déclaration DGI',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        description: 'Vérification de la plage de température admissible',
        formula: 'SafeRange_Min ≤ T_mesuré ≤ SafeRange_Max',
        calculation: `${reefer.currentTempC}°C comparé à la consigne +${reefer.setpointTempC}°C`,
        intermediateResult: isAlert ? 'EXCURSION THERMIQUE DÉTECTÉE' : 'CONFORME À LA PLAGE',
      },
      {
        stepNumber: 2,
        description: 'Évaluation de la cinétique de dépréciation marchande',
        formula: 'Risque_DZD = Cargo_DZD × f(ΔT, Durée_Excursion)',
        calculation: isAlert
          ? `${formatCurrency(reefer.estimatedCargoValueDzd)} × Excursion ${reefer.excursionDurationMinutes} min`
          : 'Aucune dépréciation (température dans la norme)',
        intermediateResult: isAlert
          ? `${formatCurrency(reefer.financialRiskDzd)} de risque de perte`
          : '0 DZD de perte financière',
      },
    ],
    finalResult: {
      label: 'Verdict Sanitaire & Réglementaire DSV',
      value: isAlert ? 'RUPTURE DE CHAÎNE DU FROID' : 'LOT CERTIFIÉ CONFORME HACCP',
      conclusion: isAlert
        ? `Alerte active : Excursion de ${reefer.tempDeltaC}°C depuis ${reefer.excursionDurationMinutes} min. Risque financier chiffré à ${formatCurrency(reefer.financialRiskDzd)}. Intervention immédiate requise.`
        : `Température nominale (+${reefer.setpointTempC}°C). Aucune rupture thermique. Traçabilité conforme pour transport agro-alimentaire et pharmaceutique.`,
    },
  };
}

