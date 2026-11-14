import React from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { MaintenanceLayoutShell } from './components/MaintenanceLayoutShell';

export default function MaintenanceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />
      <MaintenanceProvider>
        <MaintenanceLayoutShell>{children}</MaintenanceLayoutShell>
      </MaintenanceProvider>
    </div>
  );
}

