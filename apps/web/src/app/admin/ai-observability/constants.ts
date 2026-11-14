import { PlaygroundPreset } from './types';

export const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    name: '1. Diagnostic Physique Arrhenius & CUSUM',
    description: 'Analyse thermique d’huile moteur sous 48°C et alerte vol carburant',
    prompt: `Analyser l'état du camion SHACMAN matricule 01492-319-16 conduit par Karim (tel +213 550 12 34 56) :
- Température huile continue : 108.4°C sur RN1 corridor Hassi Messaoud
- Perte jauge de réservoir : -38.5 Litres en 140s moteur coupé à Berrouaghia
- Recommandation urgente et impact financier en DZD.`,
    systemPrompt: `Tu es l'ingénieur IA souverain de DocteurFlotte. Analyse les signaux physiques Arrhenius et CUSUM. Fournis une estimation claire des coûts en Dinars Algériens (DZD). Pas de jargon inutile.`,
    jsonFormat: false,
    temperature: 0.2,
    maxTokens: 350,
  },
  {
    name: '2. OCR Ticket Naftal Bruité (JSON)',
    description: 'Extraction structurée JSON d’un reçu carburant Naftal avec bruit',
    prompt: `SOCIETE NATIONALE DE COMMERCIALISATION NAFTAL
STATION-SERVICE 16-ROUIBA NORD AUTOROUTE
DATE: 2026-10-30 14:22  DISTRIBUTEUR #03
POMPE GASOIL NORMAL
VOLUME : 65.40 LITRES
P.U.   : 29.01 DA/L
MONTANT TOTAL : 1897.25 DZD
PAIEMENT : CARTE NAFTAL EDDAHABIA
VEHICULE : 00884-322-16 CHAUFFEUR BRAHIM`,
    systemPrompt: `Extrais les informations de ce ticket au format JSON strict : { "liters": number, "fuelType": "Gasoil"|"Sans Plomb"|"Super"|"GPL", "stationName": string, "stationWilaya": string, "totalAmountDzd": number }`,
    jsonFormat: true,
    temperature: 0.1,
    maxTokens: 200,
  },
  {
    name: '3. Résolution Floue Désignation OEM',
    description: 'Correction de fautes de frappe et identification de modèle lourd',
    prompt: `Identifier le profil constructeur pour ce véhicule saisi par le chef d'atelier : "ranult trak T480 high dxi13 annee 2022 semi remork"`,
    systemPrompt: `Tu es le décodeur de parc DocteurFlotte. Identifie précisément la marque, le modèle canonique, la catégorie d'actif (TRACTOR_TRAILER, RIGID, VAN) et les intervalles d'entretien recommandés en Algérie.`,
    jsonFormat: false,
    temperature: 0.1,
    maxTokens: 250,
  },
];

export const MODULE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tous les modules' },
  { value: 'COPILOT_QUERY', label: 'Copilot Query' },
  { value: 'FUEL_SCANNER', label: 'Fuel Scanner Naftal' },
  { value: 'PLAYGROUND', label: 'Playground Test' },
  { value: 'DTC_INTERPRETER', label: 'Diagnostic DTC' },
];
