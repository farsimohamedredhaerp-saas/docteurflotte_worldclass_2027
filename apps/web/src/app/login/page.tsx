'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { AuthClient } from '../../lib/api-auth';
import { Button } from '../../components/Button';
import { IconShieldCheck, IconAlertTriangle } from '../../components/navigation/TechIcons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickFillAdmin = () => {
    setEmail('admin@farsi.dz');
    setPassword('Admin@2027!');
    setTenantSlug('entreprise-bth');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await AuthClient.login({
        email,
        password,
        tenantSlug: tenantSlug.trim() || undefined,
      });

      AuthClient.saveSession(response);

      if (!response.tenant.isSetupCompleted) {
        router.push('/setup');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      let msg = 'Identifiants invalides.';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          msg = 'Impossible de contacter le serveur d’API (http://localhost:3001). Vérifiez que l’API NestJS est démarrée.';
        } else {
          msg = err.message;
        }
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
          maxWidth: '440px',
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
          subtitle="Accédez à la console décisionnelle de votre parc"
        />

        {/* Identifiants SuperAdmin Rapides */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconShieldCheck size={12} className="text-amber-400" />
              COMPTE SUPERADMIN PLATEFORME
            </div>
            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
              admin@farsi.dz
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Pré-remplir
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IconAlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
            >
              Adresse Email Professionnelle
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: direction@votre-flotte.dz"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                htmlFor="password"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)' }}
              >
                Mot de Passe
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="tenantSlug"
              style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--df-text-muted)', marginBottom: '6px' }}
            >
              Identifiant Organisation / Slug <span style={{ fontSize: '11px' }}>(Optionnel)</span>
            </label>
            <input
              id="tenantSlug"
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="ex: transports-el-djazair"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Connexion en cours...' : 'Se Connecter'}
            </Button>
          </div>
        </form>

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
