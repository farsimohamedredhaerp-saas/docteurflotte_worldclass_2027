'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useRegisterForm } from './hooks/useRegisterForm';
import { RegisterForm } from './components/RegisterForm';
import { RegisterPlanSummary } from './components/RegisterPlanSummary';

const LegacyRegisterPage = dynamic(
  () => import('../_legacy/register/page.legacy').then((mod) => mod.default),
  { ssr: false }
);

export default function RegisterPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_REGISTER !== 'false';
  const form = useRegisterForm();

  if (!isRefactorEnabled) {
    return <LegacyRegisterPage />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        backgroundColor: 'var(--df-bg-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="df-glass"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '36px',
          borderRadius: '16px',
          border: '1px solid var(--df-border-subtle)',
          boxShadow: 'var(--df-shadow-lg)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AuthHeader
          title="Créer une Organisation"
          subtitle="Démarrez avec votre espace sécurisé dédié (Isolation RLS Fail-Closed)"
        />

        <RegisterPlanSummary />

        <RegisterForm form={form} />

        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--df-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div>
            Déjà un compte ?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--df-accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
            >
              Se connecter
            </Link>
          </div>
          <div>
            <Link
              href="/landing"
              style={{ color: 'var(--df-text-muted)', textDecoration: 'none', fontSize: '11px' }}
            >
              ← Découvrir la présentation de la plateforme
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
