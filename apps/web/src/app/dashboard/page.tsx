import type { Metadata } from 'next';
import { ExecutiveDashboardClient } from '../../components/dashboard/ExecutiveDashboardClient';

export const metadata: Metadata = {
  title: 'DocteurFlotte — Cockpit Décisionnel & Maintenance des Actifs',
  description:
    'Console souveraine de pilotage opérationnel, contrôle de gestion et maintenance 5.0 prescriptive des flottes.',
};

export default function DashboardPage() {
  return <ExecutiveDashboardClient />;
}
