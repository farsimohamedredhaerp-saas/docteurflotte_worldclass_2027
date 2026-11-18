'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  IconAlertTriangle,
  IconEye,
  IconZap,
} from '@/components/navigation/TechIcons';
import { UseLoginFormReturn } from '../types';

interface LoginFormProps {
  form: UseLoginFormReturn;
}

export function LoginForm({ form }: LoginFormProps) {
  const {
    formData,
    setField,
    showPassword,
    toggleShowPassword,
    isLoading,
    error,
    isOfflineError,
    handleSubmit,
    handleEnterDemoMode,
  } = form;

  const demoEnabled =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isOfflineError ? '8px' : '0' }}>
            <IconAlertTriangle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>

          {isOfflineError && demoEnabled && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <button
                type="button"
                onClick={handleEnterDemoMode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <IconZap size={14} />
                <span>Continuer en Mode Démo Autonome →</span>
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--df-text-main)',
              marginBottom: '6px',
            }}
          >
            Adresse Email Professionnelle
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            value={formData.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="ex: direction@votre-flotte.dz"
            style={{
              width: '100%',
              padding: '11px 14px',
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
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '11px 42px 11px 14px',
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
            <button
              type="button"
              onClick={toggleShowPassword}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--df-text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconEye size={18} className={showPassword ? 'text-cyan-400' : 'text-slate-400'} />
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="tenantSlug"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--df-text-muted)',
              marginBottom: '6px',
            }}
          >
            Identifiant Organisation / Espace <span style={{ fontSize: '11px' }}>(Optionnel)</span>
          </label>
          <input
            id="tenantSlug"
            name="tenantSlug"
            type="text"
            autoComplete="organization"
            value={formData.tenantSlug}
            onChange={(e) => setField('tenantSlug', e.target.value)}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setField('rememberMe', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', cursor: 'pointer' }}>
            Conserver ma session active sur ce terminal sécurisé
          </label>
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
    </div>
  );
}

