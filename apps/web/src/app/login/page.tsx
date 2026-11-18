'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useLoginForm } from './hooks/useLoginForm';
import { LoginForm } from './components/LoginForm';
import { LoginQuickAdminCard } from './components/LoginQuickAdminCard';

const LegacyLoginPage = dynamic(
  () => import('../_legacy/login/page.legacy').then((mod) => mod.default),
  { ssr: false }
);

export default function LoginPage() {
  // En production, l'ancienne page de login (qui embarque un raccourci admin) n'est jamais servie.
  const isRefactorEnabled =
    process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_FF_REFACTOR_LOGIN !== 'false';
  const form = useLoginForm();

  if (!isRefactorEnabled) {
    return <LegacyLoginPage />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--df-bg-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Halo d'ambiance d'arrière-plan */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="df-glass"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          borderRadius: '16px',
          border: '1px solid var(--df-border-subtle)',
          boxShadow: 'var(--df-shadow-lg)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AuthHeader
          title="Connexion Sécurisée"
          subtitle="Accédez à la console décisionnelle de votre parc (58 Wilayas)"
        />

        <LoginQuickAdminCard
          onQuickFillAdmin={form.handleQuickFillAdmin}
          onEnterDemoMode={form.handleEnterDemoMode}
        />

        <LoginForm form={form} />

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--df-text-muted)',
          }}
        >
          Nouvelle organisation ?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--df-accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
          >
            Créer un compte entreprise
          </Link>
        </div>
      </div>
    </div>
  );
}
