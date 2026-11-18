import type { Metadata } from 'next';
import { LandingPageClient } from '../../components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'DocteurFlotte — Plateforme Souveraine de Télémétrie & Maintenance 5.0',
  description:
    'Solution souveraine de télémétrie, IoT multi-métiers et maintenance prescriptive déterministe. Calibrée pour les 58 Wilayas et conforme Loi 18-07.',
};

export default function LandingPage() {
  return <LandingPageClient />;
}
