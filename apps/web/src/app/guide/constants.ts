import {
  IconActivity,
  IconTruck,
  IconSliders,
  IconCpu,
  IconZap,
  IconSparkles,
  IconRadio,
  IconBox,
  IconTerminal,
  IconShieldCheck,
  IconTrendingUp,
  IconCompass,
  IconUsers,
  IconHelpCircle,
} from '../../components/navigation/TechIcons';
import { DocSection } from './types';

export const SECTIONS: DocSection[] = [
  { id: 'vision', title: '1. Vision & Modèle : L\'Ère de la Maintenance 5.0', badge: 'MONOPOLE 5.0', Icon: IconActivity },
  { id: 'modes', title: '2. Les 3 Modes d’Exploitation (0 / 1 / 2)', badge: 'HARDWARE-AGNOSTIC', Icon: IconTruck },
  { id: 'decision-engine', title: '3. Le Cœur Décisionnel (SAD → ADS)', badge: 'ARBITRAGE DZD', Icon: IconSliders },
  { id: 'physics-algorithms', title: '4. Les 6 Algorithmes Physiques & VHI', badge: 'DÉTERMINISTE', Icon: IconCpu },
  { id: 'tech-innovations', title: '5. Innovations Technologiques de Rupture (Monopole 0 $ / 0 DA)', badge: 'BREVETABLE', Icon: IconZap },
  { id: 'ai-sovereign', title: '6. IA Souveraine & Les 7 Piliers d\'Observabilité', badge: '7 PILIERS IA', Icon: IconSparkles },
  { id: 'digital-twin', title: '7. Jumeau Numérique & Multi-Climats', badge: 'STRESS 58 WILAYAS', Icon: IconRadio },
  { id: 'field-modules', title: '8. Télémétrie Terrain : Naftal, Froid, Dispatch', badge: 'OPÉRATIONNEL', Icon: IconBox },
  { id: 'tech-architecture', title: '9. Architecture Système & Pipeline', badge: 'FULL-STACK', Icon: IconTerminal },
  { id: 'security-compliance', title: '10. Souveraineté & Loi 18-07 ANPDP', badge: 'JORADP / RLS', Icon: IconShieldCheck },
  { id: 'competitive-matrix', title: '11. Benchmark Mondial vs Samsara / Geotab', badge: 'CONCURRENCE', Icon: IconTrendingUp },
  { id: 'strategic-roadmap', title: '12. Vision Futuriste & Roadmap 2027-2030', badge: 'INNOVATION', Icon: IconCompass },
  { id: 'roles-workflows', title: '13. Guide Opérationnel par Rôle Métier', badge: 'WORKFLOWS', Icon: IconUsers },
  { id: 'faq', title: '14. FAQ & Bonnes Pratiques', badge: 'SUPPORT', Icon: IconHelpCircle },
];

