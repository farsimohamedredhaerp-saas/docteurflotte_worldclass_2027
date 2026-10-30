'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/navigation/Navbar';

interface DeviceItem {
  id: string;
  name: string;
  manufacturer: string;
  category: 'heavy' | 'light' | 'cold-chain' | 'autonomous' | 'obd' | 'video';
  categoryLabel: string;
  traccarProtocol: string;
  traccarPort: number;
  flespiDeviceType: string;
  flespiSupported: boolean;
  connectivity: string;
  canSupport: string;
  supportedSensors: string[];
  recommendedAlgorithms: string[];
  description: string;
  defaultConfigSample: string;
  algeriaReadiness: 'EXCELLENT' | 'RECOMMENDED' | 'STANDARD';
  specs: {
    voltage: string;
    battery: string;
    ipRating: string;
    inputs: string;
  };
}

const DEVICES_CATALOG: DeviceItem[] = [
  {
    id: 'teltonika-fmc130',
    name: 'Teltonika FMC130',
    manufacturer: 'Teltonika Telematics',
    category: 'light',
    categoryLabel: 'Véhicules Légers & Utilitaires',
    traccarProtocol: 'teltonika',
    traccarPort: 5027,
    flespiDeviceType: 'teltonika-fmc130',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 avec repli 2G, Bluetooth 4.0 LE, GNSS',
    canSupport: 'CAN étendu via adaptateur LV-CAN200 / ALL-CAN300 (lecture sans contact)',
    supportedSensors: ['BLE EYE Sensor (Temp/Humidité)', 'Bouton SOS', 'Relais coupure', 'Sonde carburant analogique/RS232', 'iButton 1-Wire'],
    recommendedAlgorithms: ['Arrhenius (Huile)', 'Cranking CVHI (Batterie)', 'Thermique Culasse', 'CUSUM Anti-Siphon'],
    description: 'Le boîtier 4G le plus polyvalent et fiable du marché algérien. Idéal pour les camionnettes de livraison, flottes commerciales et pick-ups pétroliers.',
    defaultConfigSample: '  setparam 2001:<SERVER_IP>;2002:5027;2003:0;2004:0;2005:<APN>;',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: '10 - 30 V DC avec protection surtension',
      battery: 'Interne Li-Ion 170 mAh',
      ipRating: 'IP41 (Usage cabine)',
      inputs: '3 Digitales, 2 Analogiques, 1-Wire, Bluetooth 4.0',
    },
  },
  {
    id: 'teltonika-fmc640',
    name: 'Teltonika FMC640 (Heavy Duty Leader)',
    manufacturer: 'Teltonika Telematics',
    category: 'heavy',
    categoryLabel: 'Poids Lourds, BTP & Mines',
    traccarProtocol: 'teltonika',
    traccarPort: 5027,
    flespiDeviceType: 'teltonika-fmc640',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 + 2G, Double SIM (Mobilis + Djezzy), GNSS haute sensibilité',
    canSupport: 'Double canal J1939 + J1708 + FMS Standard + K-Line Tachygraphe',
    supportedSensors: ['Jusqu’à 4 sondes carburant RS485', 'Capteurs de charge sur essieux', 'Pression différentielle FAP', 'BLE Température Frigo'],
    recommendedAlgorithms: ['Loi d’Arrhenius (Huile Moteur)', 'Modèle Thermique Culasse', 'Colmatage FAP', 'Loi d’Archard (Freins)', 'CUSUM Carburant'],
    description: 'Le standard absolu pour les tracteurs routiers (MAN, Volvo, Renault Trucks), engins Caterpillar et convois sahariens. Lecture native des trames calculateurs moteur.',
    defaultConfigSample: '  setparam 2001:<SERVER_IP>;2002:5027;2003:0;2005:<APN>;',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: '10 - 30 V DC (Protection 12V/24V lourde)',
      battery: 'Interne Ni-Mh 550 mAh 8.4V',
      ipRating: 'IP41 (Boîtier renforcé pour châssis lourd)',
      inputs: '4 Digitales, 4 Analogiques, 4x RS232/RS485, 2x CAN',
    },
  },
  {
    id: 'teltonika-fmb920',
    name: 'Teltonika FMB920',
    manufacturer: 'Teltonika Telematics',
    category: 'light',
    categoryLabel: 'Véhicules Légers & Utilitaires',
    traccarProtocol: 'teltonika',
    traccarPort: 5027,
    flespiDeviceType: 'teltonika-fmb920',
    flespiSupported: true,
    connectivity: '2G Quad-Band, Bluetooth 4.0 LE, Antennes intégrées',
    canSupport: 'Non (Lecture via odomètre GPS et tension d’alimentation)',
    supportedSensors: ['Détection allumage contact ACC', 'Relais antidémarrage', 'Balise BLE Chauffeur'],
    recommendedAlgorithms: ['Cranking CVHI (Tension Batterie)', 'Éco-Conduite Naftal (Ralenti)', 'Géorepérage'],
    description: 'Boîtier miniature ultra-économique pour les berlines, flottes de leasing et véhicules de service. Montage discret en moins de 15 minutes.',
    defaultConfigSample: '  setparam 2001:<SERVER_IP>;2002:5027;2003:0;2005:<APN>;',
    algeriaReadiness: 'RECOMMENDED',
    specs: {
      voltage: '6 - 30 V DC',
      battery: 'Li-Ion 170 mAh',
      ipRating: 'IP54',
      inputs: '1 Digitale, 1 Analogique, 1 Sortie relais',
    },
  },
  {
    id: 'ruptela-hcv5',
    name: 'Ruptela HCV5',
    manufacturer: 'Ruptela',
    category: 'heavy',
    categoryLabel: 'Poids Lourds, BTP & Mines',
    traccarProtocol: 'ruptela',
    traccarPort: 5046,
    flespiDeviceType: 'ruptela-hcv5',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 + 2G, GNSS multi-constellations',
    canSupport: 'Double bus CAN (J1939, FMS 3.0), K-Line pour téléchargement tachygraphe',
    supportedSensors: ['Sondes capacitives carburant Omnicomm / Escort via RS485', 'Lecteur RFID Chauffeur', 'Sondes thermo 1-Wire'],
    recommendedAlgorithms: ['Arrhenius (Huile)', 'Archard (Freins)', 'CUSUM Précision 0.5L', 'Colmatage FAP'],
    description: 'Boîtier télématique haut de gamme réputé pour sa précision chirurgicale sur les citernes hydrocarbures Naftal et les camions malaxeurs BTP.',
    defaultConfigSample: 'CFG:IP=<SERVER_IP>,PORT=5046,APN=<APN>;',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: '9 - 32 V DC résistant aux pics de 150V',
      battery: 'Li-Po 850 mAh haute endurance',
      ipRating: 'IP54',
      inputs: '4 Digitales, 2 Analogiques, 2x RS485, 2x CAN',
    },
  },
  {
    id: 'meitrack-t399l',
    name: 'Meitrack T399L (Chaîne du Froid & Dangereux)',
    manufacturer: 'Meitrack',
    category: 'cold-chain',
    categoryLabel: 'Chaîne du Froid & Groupes Frigo',
    traccarProtocol: 'meitrack',
    traccarPort: 5020,
    flespiDeviceType: 'meitrack-t399l',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 / 3G / 2G, Bluetooth 4.2',
    canSupport: 'OBD-II / J1939 via adaptateur externe',
    supportedSensors: ['Jusqu’à 8 capteurs de température PT100/BLE (-40°C à +80°C)', 'Capteur ouverture de porte remorque frigo', 'Sonde de niveau cuve'],
    recommendedAlgorithms: ['Télémétrie Chaîne du Froid', 'CUSUM Carburant Groupe Thermo King / Carrier', 'Batterie Frigo'],
    description: 'Spécifiquement conçu pour le transport sous température dirigée (produits laitiers Giplait, vaccins Institut Pasteur, viandes surgelées) sous 45°C saharien.',
    defaultConfigSample: '0000,A21,1,<SERVER_IP>,5020,<APN>,,,',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: '11 - 36 V DC',
      battery: 'Interne 400 mAh IP67 étanche à l’eau et au sable',
      ipRating: 'IP67 (Résistant aux lavages haute pression)',
      inputs: '3 Digitales, 2 Analogiques, 1-Wire, RS232, BLE',
    },
  },
  {
    id: 'coban-gps403',
    name: 'Coban GPS403 4G (Économique Antivol)',
    manufacturer: 'Shenzhen Coban',
    category: 'light',
    categoryLabel: 'Véhicules Légers & Utilitaires',
    traccarProtocol: 'gps103',
    traccarPort: 5001,
    flespiDeviceType: 'coban-gps403',
    flespiSupported: true,
    connectivity: '4G LTE avec repli 2G, Antenne GPS/GSM intégrée',
    canSupport: 'Non',
    supportedSensors: ['Coupure pompe à carburant 12V/24V', 'Détection contact ACC', 'Bouton SOS panique', 'Micro écoute espion'],
    recommendedAlgorithms: ['Cranking Basique (Chute de tension)', 'Éco-Conduite (Ralenti excessif)', 'Détection Remorquage'],
    description: 'Le boîtier le plus répandu chez les installateurs indépendants en Algérie. Configuration simple par SMS, idéal pour les agences de location de voitures.',
    defaultConfigSample: 'adminip123456 <SERVER_IP> 5001\napn123456 <APN>\nfix030s***n123456',
    algeriaReadiness: 'STANDARD',
    specs: {
      voltage: '9 - 36 V DC',
      battery: 'Li-Ion 350 mAh 3.7V',
      ipRating: 'IP40',
      inputs: '1 Contact ACC, 1 SOS, 1 Sortie Relais',
    },
  },
  {
    id: 'concox-vl03',
    name: 'Jimi IoT / Concox VL03',
    manufacturer: 'Jimi IoT / Concox',
    category: 'light',
    categoryLabel: 'Véhicules Légers & Utilitaires',
    traccarProtocol: 'gt06',
    traccarPort: 5023,
    flespiDeviceType: 'concox-vl03',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1, Bluetooth 5.0, Accéléromètre 6 axes',
    canSupport: 'Optionnel via dongle OBD Bluetooth',
    supportedSensors: ['Sondes thermiques BLE', 'Bouton SOS', 'Relais d’immobilisation', 'Détection remorquage & tonneaux'],
    recommendedAlgorithms: ['Cranking CVHI', 'Éco-Conduite (Accélérations/Freinages brusques)', 'CUSUM'],
    description: 'Traceur 4G compact moderne intégrant un accéléromètre haute précision pour l’analyse du style de conduite et la détection d’accidents instantanée.',
    defaultConfigSample: 'SERVER,1,<SERVER_IP>,5023,0#\nAPN,<APN>#\nTIMER,30#',
    algeriaReadiness: 'RECOMMENDED',
    specs: {
      voltage: '9 - 90 V DC (Compatible trottinettes, chariots élévateurs 48V/80V)',
      battery: 'Li-Po 270 mAh industrielle',
      ipRating: 'IP65 résistant aux éclaboussures',
      inputs: '1 Entrée positive ACC, 1 Entrée configurable, 1 Sortie',
    },
  },
  {
    id: 'queclink-gv58ce',
    name: 'Queclink GV58CE (OBD-II CAN)',
    manufacturer: 'Queclink Wireless',
    category: 'obd',
    categoryLabel: 'OBD-II Plug & Play',
    traccarProtocol: 'gl200',
    traccarPort: 5004,
    flespiDeviceType: 'queclink-gv58ce',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 + 2G, Bluetooth BLE, Connecteur OBD-II direct',
    canSupport: 'Lecture native OBD-II (ISO 15765, CAN 11/29 bit, KWP2000)',
    supportedSensors: ['Régime RPM', 'Vitesse véhicule', 'Température liquide de refroidissement', 'Codes défauts DTC constructeur'],
    recommendedAlgorithms: ['Thermique Culasse', 'Loi d’Arrhenius', 'Cranking CVHI', 'Archard (Freins)'],
    description: 'S’enfiche directement sur la prise diagnostic OBD-II du véhicule sans couper un seul fil. Zéro risque pour la garantie constructeur.',
    defaultConfigSample: 'AT+GTSRI=gv58ce,4,,1,<SERVER_IP>,5004,,0,0,,,FFFF$',
    algeriaReadiness: 'RECOMMENDED',
    specs: {
      voltage: '8 - 32 V DC direct prise OBD',
      battery: 'Interne de sauvegarde 180 mAh',
      ipRating: 'Usage intérieur sous tableau de bord',
      inputs: 'Port OBD-II standard 16 broches',
    },
  },
  {
    id: 'topflytech-tlw2-12b',
    name: 'Topflytech SolarGuardX (Autonome Solaire)',
    manufacturer: 'Topflytech',
    category: 'autonomous',
    categoryLabel: 'Traceurs Autonomes & Remorques',
    traccarProtocol: 'topflytech',
    traccarPort: 5110,
    flespiDeviceType: 'topflytech-tlw2-12b',
    flespiSupported: true,
    connectivity: '4G LTE Cat M1 / NB-IoT / 2G, Panneau solaire photovoltaïque étanche',
    canSupport: 'Non',
    supportedSensors: ['Capteur de charge solaire', 'Aimant anti-décrochage', 'Accéléromètre antivol'],
    recommendedAlgorithms: ['Suivi Remorques Isolées', 'Disponibilité Actifs Non Motorisés'],
    description: 'Traceur solaire complètement autonome ne nécessitant aucun raccordement électrique. Se recharge en continu avec le soleil algérien (autonomie virtuellement infinie).',
    defaultConfigSample: '202020,IP:<SERVER_IP>,PORT:5110,APN:<APN>#',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: 'Recharge solaire intégrée + batterie 9600 mAh',
      battery: 'Li-Ion rechargeable 9600 mAh 3.7V',
      ipRating: 'IP67 étanche sable et pluie torrentielle',
      inputs: 'Zéro câblage, fixation magnétique ou vis antivol',
    },
  },
  {
    id: 'teltonika-tat100',
    name: 'Teltonika TAT100 (Asset Tracker 3 Ans)',
    manufacturer: 'Teltonika Telematics',
    category: 'autonomous',
    categoryLabel: 'Traceurs Autonomes & Remorques',
    traccarProtocol: 'teltonika',
    traccarPort: 5027,
    flespiDeviceType: 'teltonika-tat100',
    flespiSupported: true,
    connectivity: '2G Quad-Band, Bluetooth 4.0 LE, Antenne GNSS céramique',
    canSupport: 'Non',
    supportedSensors: ['Détection d’ouverture boîtier tamper', 'Balises BLE environnantes'],
    recommendedAlgorithms: ['Suivi Matériel BTP Loué', 'Prévention Vol Engins Isolés'],
    description: 'Fonctionne jusqu’à 3 ans sur sa pile interne (1 point par jour). Se réveille périodiquement pour transmettre sa position puis retourne en veille profonde indétectable.',
    defaultConfigSample: '  setparam 2001:<SERVER_IP>;2002:5027;2003:0;2005:<APN>;',
    algeriaReadiness: 'RECOMMENDED',
    specs: {
      voltage: 'Piles primaires internes Li-SOCl2 interchangeables',
      battery: '2200 mAh 7.2V (jusqu’à 1000 transmissions)',
      ipRating: 'IP68 étanche submersion',
      inputs: 'Autonome 100%',
    },
  },
  {
    id: 'jimi-jc400',
    name: 'Jimi IoT JC400 (Dashcam Vidéo IA + Télémétrie)',
    manufacturer: 'Jimi IoT',
    category: 'video',
    categoryLabel: 'Dashcams & Vidéo ADAS / DMS',
    traccarProtocol: 'gt06',
    traccarPort: 5023,
    flespiDeviceType: 'jimi-jc400',
    flespiSupported: true,
    connectivity: '4G LTE Cat 4, Wi-Fi Hotspot cabine, GNSS, Double caméra 1080p',
    canSupport: 'Optionnel via câble OBD',
    supportedSensors: ['Caméra route ADAS (Franchissement de ligne, distance de sécurité)', 'Caméra cabine DMS (Somnolence, tabac, téléphone)', 'Bouton panique SOS'],
    recommendedAlgorithms: ['Éco-Conduite Avancée', 'Score de Risque Chauffeur', 'Analyse Vidéo d’Accident'],
    description: 'Combine la télématique GPS Traccar avec l’enregistrement vidéo continu et l’intelligence artificielle en cabine pour éliminer les accidents mortels sur la RN1.',
    defaultConfigSample: 'SERVER,1,<SERVER_IP>,5023,0#\nAPN,<APN>#',
    algeriaReadiness: 'RECOMMENDED',
    specs: {
      voltage: '9 - 30 V DC',
      battery: 'Supercondensateur haute température (anti-explosion solaire)',
      ipRating: 'Usage pare-brise cabine',
      inputs: '2x MicroSD jusqu’à 256 Go, SOS, Entrée ACC',
    },
  },
  {
    id: 'traccar-client-mobile',
    name: 'Application Mobile Traccar Client (Mode 0 / Gratuit)',
    manufacturer: 'Traccar Ltd (Open-Source)',
    category: 'light',
    categoryLabel: 'Véhicules Légers & Utilitaires',
    traccarProtocol: 'osmand',
    traccarPort: 5055,
    flespiDeviceType: 'traccar-client',
    flespiSupported: false,
    connectivity: '4G / Wi-Fi Smartphone (Android & iOS)',
    canSupport: 'Non',
    supportedSensors: ['Accéléromètre smartphone', 'GPS terminal', 'Statut de charge batterie'],
    recommendedAlgorithms: ['Mode 0 Zero-Hardware', 'Éco-Conduite Chauffeur', 'Inspection DVIR Synchronisée'],
    description: 'Transforme gratuitement n’importe quel smartphone de chauffeur en balise télématique. Idéal pour tester DocteurFlotte sans dépenser 1 Dinar en matériel.',
    defaultConfigSample: 'URL du serveur : http://<SERVER_IP>:5055\nFréquence : 30 secondes',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: 'Batterie smartphone',
      battery: 'Alimentation USB chauffeur',
      ipRating: 'Selon terminal',
      inputs: 'Application logicielle native',
    },
  },
  {
    id: 'sinocastel-idd-213',
    name: 'Sinocastel IDD-213G / IDD-218G (OBD-II & CAN)',
    manufacturer: 'Sinocastel Co., Ltd. (Castel)',
    category: 'obd',
    categoryLabel: 'OBD-II Plug & Play',
    traccarProtocol: 'castel',
    traccarPort: 5086,
    flespiDeviceType: 'castel-idd-213',
    flespiSupported: true,
    connectivity: '4G LTE Cat 1 + 2G, Bluetooth BLE, Connecteur OBD-II standard 16 broches',
    canSupport: 'OBD-II standard (ISO 15765) + CAN J1939 sur modèle lourd IDD-218G',
    supportedSensors: ['Régime moteur RPM', 'Vitesse réelle', 'Température liquide de refroidissement', 'Codes défauts DTC', 'Alerte débranchement tamper'],
    recommendedAlgorithms: ['Thermique Culasse', 'Loi d’Arrhenius', 'Cranking CVHI', 'Éco-Conduite (Ralenti)'],
    description: 'Boîtier diagnostic OBD-II plug-and-play de référence mondial. Se branche en 5 secondes sur la prise diagnostic du véhicule, lit les codes défauts constructeur et les températures réelles sans altérer le faisceau électrique.',
    defaultConfigSample: 'SERVER#<SERVER_IP>#5086#\nAPN#<APN>#\nTIMER#30#',
    algeriaReadiness: 'EXCELLENT',
    specs: {
      voltage: '9 - 36 V DC direct prise diagnostic OBD',
      battery: 'Batterie de secours interne 140 mAh (alerte arrachement)',
      ipRating: 'Usage habitacle sous tableau de bord',
      inputs: 'Prise OBD-II 16 broches standard',
    },
  },
];

export default function TelematicsHardwarePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGateway, setSelectedGateway] = useState<'all' | 'traccar' | 'flespi'>('all');
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);

  // Configuration Command Generator State
  const [serverHost, setServerHost] = useState('telematics.docteurflotte.dz');
  const [selectedOperator, setSelectedOperator] = useState<'mobilis' | 'ooredoo' | 'djezzy'>('mobilis');

  const operatorApns = {
    mobilis: 'internet',
    ooredoo: 'internet',
    djezzy: 'djezzy.internet',
  };

  const filteredDevices = useMemo(() => {
    return DEVICES_CATALOG.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.traccarProtocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.traccarPort.toString().includes(searchQuery);

      const matchesCategory = selectedCategory === 'all' || device.category === selectedCategory;

      const matchesGateway =
        selectedGateway === 'all' ||
        (selectedGateway === 'traccar' && device.traccarPort > 0) ||
        (selectedGateway === 'flespi' && device.flespiSupported);

      return matchesSearch && matchesCategory && matchesGateway;
    });
  }, [searchQuery, selectedCategory, selectedGateway]);

  const generateConfigCommand = (device: DeviceItem) => {
    const apn = operatorApns[selectedOperator];
    return device.defaultConfigSample
      .replace(/<SERVER_IP>/g, serverHost)
      .replace(/<APN>/g, apn);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      {/* HERO BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '44px 24px 36px',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              Référentiel Matériel IoT & Protocoles Télématiques
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Cluster Traccar Local (Port 8085) + Flespi Failover (Zéro PII)
            </span>
            <a
              href="https://www.traccar.org/devices/"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#7dd3fc',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>🔗</span>
              <span>Source Officielle Traccar (2 175 Appareils • 266 Protocoles)</span>
            </a>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '14px',
              color: '#fff',
            }}
          >
            Matériels IoT & Boîtiers Compatibles Traccar & Flespi
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: '#94a3b8',
              maxWidth: '880px',
              marginBottom: '24px',
            }}
          >
            Guide d’appairage et catalogue certifié des traceurs GPS, sondes de carburant, balises BLE frigo et caméras vidéo IA. 
            DocteurFlotte prend en charge nativement <strong>les 2 175 modèles et 266 protocoles officiels de Traccar</strong> ainsi que le pont unifié <strong>Flespi</strong> sous conformité Loi 18-07.
          </p>

          {/* Verification Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              maxWidth: '840px',
              marginBottom: '24px',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Appareils Traccar</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>2 175</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Protocoles Pris en Charge</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#a5b4fc' }}>266</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Modèles Teltonika</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>92+</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Modèles Queclink</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>101</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/gateways"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>📡</span>
              <span>Supervision Passerelles Traccar/Flespi</span>
            </Link>

            <Link
              href="/telematics"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span>🗺️</span>
              <span>Console Flotte en Temps Réel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SOUVERAINETÉ & ARCHITECTURE DUAL-GATEWAY EXPLANATION */}
      <div style={{ maxWidth: '1360px', margin: '24px auto 0', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🇩🇿</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                1. Traccar Auto-Hébergé : Passerelle Souveraine Principale (Défaut)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Exécuté en conteneur Docker local sur le port <strong>8085</strong> (ports matériels dédiés : Teltonika 5027, Coban 5001, Concox 5023). 
              Toutes les trames télématiques sont ingérées <strong>directement sur le sol algérien</strong>, sans intermédiaire étranger, garantissant la conformité totale à la Loi 18-07.
            </p>
          </div>

          <div style={{ borderLeft: '1px solid var(--df-border-subtle)', paddingLeft: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                2. Flespi Cloud Failover : Passerelle de Secours à Zéro PII
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              En cas de coupure réseau ou d’indisponibilité du serveur local, le flux bascule automatiquement vers Flespi. 
              <strong>Règle ANPDP absolue :</strong> Flespi ne reçoit que l’IMEI matériel et les coordonnées GPS brutes. Zéro nom de chauffeur, zéro immatriculation, zéro donnée client.
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ maxWidth: '1360px', margin: '24px auto 0', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <input
              type="text"
              placeholder="Rechercher par modèle, fabricant ou port (ex: FMB920, 5027, Coban)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--df-border-medium)',
                background: 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '14px', color: '#64748b' }}>
              🔍
            </span>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tous les Matériels' },
              { id: 'heavy', label: '🚛 Poids Lourds / BTP' },
              { id: 'light', label: '🚗 Véhicules Légers' },
              { id: 'cold-chain', label: '❄️ Chaîne du Froid' },
              { id: 'autonomous', label: '🔋 Autonomes / Solaire' },
              { id: 'obd', label: '🔌 OBD-II Direct' },
              { id: 'video', label: '📹 Caméras IA' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: selectedCategory === cat.id ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                  background: selectedCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-2)',
                  color: selectedCategory === cat.id ? '#fff' : 'var(--df-text-muted)',
                  fontSize: '12.5px',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gateway Filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedGateway('all')}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                background: selectedGateway === 'all' ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedGateway('traccar')}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                background: selectedGateway === 'traccar' ? '#059669' : 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Traccar (Port Local)
            </button>
            <button
              onClick={() => setSelectedGateway('flespi')}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                background: selectedGateway === 'flespi' ? '#0284c7' : 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Flespi Cloud
            </button>
          </div>
        </div>
      </div>

      {/* CATALOG GRID */}
      <div style={{ maxWidth: '1360px', margin: '24px auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--df-shadow-sm)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {device.manufacturer}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
                      {device.name}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background:
                        device.algeriaReadiness === 'EXCELLENT'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)',
                      color: device.algeriaReadiness === 'EXCELLENT' ? '#34d399' : '#38bdf8',
                      border: `1px solid ${
                        device.algeriaReadiness === 'EXCELLENT' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'
                      }`,
                    }}
                  >
                    {device.algeriaReadiness === 'EXCELLENT' ? '⭐ Recommandé Algérie' : '✓ Compatible'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.5 }}>
                  {device.description}
                </div>

                {/* Ports & Protocol Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#a5b4fc',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    Traccar : Port <strong>{device.traccarPort}</strong> ({device.traccarProtocol})
                  </div>

                  {device.flespiSupported && (
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: '#7dd3fc',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      Flespi : <strong>{device.flespiDeviceType}</strong>
                    </div>
                  )}
                </div>

                {/* Specs Highlights */}
                <div
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Alimentation :</span>
                    <strong style={{ color: 'var(--df-text-main)' }}>{device.specs.voltage}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Bus CAN :</span>
                    <strong style={{ color: '#38bdf8' }}>{device.canSupport.includes('J1939') ? 'Full J1939 / FMS' : 'OBD / Adaptateur'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Indice de protection :</span>
                    <strong style={{ color: 'var(--df-text-main)' }}>{device.specs.ipRating}</strong>
                  </div>
                </div>

                {/* Recommended Algorithms Tags */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Algorithmes DocteurFlotte Débloqués :
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {device.recommendedAlgorithms.map((algo, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10.5px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#cbd5e1',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {algo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedDevice(device)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>⚙️</span>
                <span>Générer Configuration SMS / GPRS</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PROTOCOL CHEAT SHEET & QUICK REFERENCE TABLE */}
      <div style={{ maxWidth: '1360px', margin: '48px auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
                📋 Tableau de Référence des Ports & Protocoles Télématiques
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', margin: 0 }}>
                Ports d’écoute configurés dans le conteneur Docker Traccar souverain et correspondance Flespi.
              </p>
            </div>
            <span style={{ fontSize: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
              200+ Protocoles Inclus
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Port Traccar</th>
                  <th style={{ padding: '10px 14px' }}>Protocole Traccar</th>
                  <th style={{ padding: '10px 14px' }}>Fabricants Principaux</th>
                  <th style={{ padding: '10px 14px' }}>Type d’Appareil Flespi</th>
                  <th style={{ padding: '10px 14px' }}>Transport</th>
                  <th style={{ padding: '10px 14px' }}>Décodage CAN</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { port: 5027, proto: 'teltonika', mfr: 'Teltonika Telematics (92+ modèles)', flespi: 'teltonika-*', trans: 'TCP / UDP', can: 'J1939 / FMS / OBD' },
                  { port: 5023, proto: 'gt06', mfr: 'Jimi IoT / Concox (104 modèles)', flespi: 'concox-*', trans: 'TCP', can: 'Partiel (Dongle OBD)' },
                  { port: 5004, proto: 'gl200', mfr: 'Queclink Wireless (101 modèles)', flespi: 'queclink-*', trans: 'TCP / UDP', can: 'OBD-II Direct' },
                  { port: 5001, proto: 'gps103 / coban', mfr: 'Coban Electronics (26 modèles)', flespi: 'coban-*', trans: 'TCP', can: 'Non' },
                  { port: 5002, proto: 'tk103', mfr: 'Clones Génériques TK103 / Kingneed (25 modèles)', flespi: 'tk103-*', trans: 'TCP', can: 'Non' },
                  { port: 5046, proto: 'ruptela', mfr: 'Ruptela (19 modèles FMS)', flespi: 'ruptela-*', trans: 'TCP', can: 'Double CAN FMS 3.0' },
                  { port: 5013, proto: 'h02', mfr: 'Tianqing / Haoyuan (80 modèles)', flespi: 'h02-*', trans: 'TCP', can: 'Non' },
                  { port: 5009, proto: 'meiligao', mfr: 'Meiligao / Meitrack (65 modèles)', flespi: 'meiligao-*', trans: 'TCP', can: 'FMS Adaptateur' },
                  { port: 5047, proto: 'jt808', mfr: 'Protocole National Camions Lourds (43 modèles)', flespi: 'jt808-*', trans: 'TCP', can: 'J1939 Standard' },
                  { port: 5082, proto: 'calamp', mfr: 'CalAmp (42 modèles)', flespi: 'calamp-*', trans: 'UDP', can: 'OBD LMU-3030' },
                  { port: 5044, proto: 'eelink', mfr: 'Eelink (36 modèles)', flespi: 'eelink-*', trans: 'TCP', can: 'Non' },
                  { port: 5010, proto: 'atrack', mfr: 'ATrack (35 modèles)', flespi: 'atrack-*', trans: 'TCP / UDP', can: 'CAN Bus AK/AX' },
                  { port: 5032, proto: 'xirgo', mfr: 'Xirgo Technologies (34 modèles)', flespi: 'xirgo-*', trans: 'TCP', can: 'OBD / J1939' },
                  { port: 5011, proto: 'suntech', mfr: 'Suntech International (32 modèles)', flespi: 'suntech-*', trans: 'TCP / UDP', can: 'Sur modèles ST4xxx' },
                  { port: 5020, proto: 'meitrack', mfr: 'Meitrack (30 modèles)', flespi: 'meitrack-*', trans: 'TCP / UDP', can: 'FMS Adaptateur' },
                  { port: 5086, proto: 'castel', mfr: 'Sinocastel / Castel (30 modèles OBD & J1939)', flespi: 'castel-*', trans: 'TCP', can: 'OBD-II & CAN J1939' },
                  { port: 5110, proto: 'topflytech', mfr: 'Topflytech Solaire (17 modèles)', flespi: 'topflytech-*', trans: 'TCP', can: 'Non (Solaire)' },
                  { port: 5170, proto: 'freematics', mfr: 'Freematics Traccar Edition Recommandée', flespi: 'freematics', trans: 'TCP', can: 'OBD-II + BLE' },
                  { port: 5055, proto: 'osmand', mfr: 'Traccar Client Mobile (Android / iOS)', flespi: 'traccar-client', trans: 'HTTP POST', can: 'Non (Mode 0)' },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--df-border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--df-bg-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                      {row.port}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#a5b4fc' }}>
                      {row.proto}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                      {row.mfr}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#7dd3fc' }}>
                      {row.flespi}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--df-text-muted)' }}>
                      {row.trans}
                    </td>
                    <td style={{ padding: '12px 14px', color: row.can.includes('J1939') ? '#34d399' : 'var(--df-text-secondary)', fontWeight: 600 }}>
                      {row.can}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIGURATION MODAL */}
      {selectedDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Générateur de Paramètres
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
                  {selectedDevice.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '22px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Inputs Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                  Opérateur Télécom (Carte SIM) :
                </label>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--df-border-medium)',
                    background: 'var(--df-bg-surface-2)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  <option value="mobilis">Mobilis (APN : internet)</option>
                  <option value="ooredoo">Ooredoo (APN : internet)</option>
                  <option value="djezzy">Djezzy (APN : djezzy.internet)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                  Hôte ou IP du Serveur DocteurFlotte :
                </label>
                <input
                  type="text"
                  value={serverHost}
                  onChange={(e) => setServerHost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--df-border-medium)',
                    background: 'var(--df-bg-surface-2)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Generated Command Box */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  Commande SMS / GPRS Prête à Envoyer :
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateConfigCommand(selectedDevice));
                    alert('Commande copiée dans le presse-papier !');
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#7dd3fc',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📋 Copier la Commande
                </button>
              </div>
              <pre
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-medium)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: '#6ee7b7',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                }}
              >
                {generateConfigCommand(selectedDevice)}
              </pre>
            </div>

            {/* Instruction Steps */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px', fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              <strong>Procédure d’Activation :</strong>
              <ol style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                <li>Insérez la carte SIM dans le boîtier (désactivez préalablement le code PIN).</li>
                <li>Envoyez la commande ci-dessus par SMS au numéro de la carte SIM depuis votre smartphone.</li>
                <li>Dès réception de la réponse <em>OK / Success</em>, rendez-vous sur <Link href="/telematics" style={{ color: '#818cf8' }}>la Console Télématique</Link> pour appairer le numéro IMEI au véhicule correspondant.</li>
              </ol>
            </div>

            <button
              onClick={() => setSelectedDevice(null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-medium)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
