'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '../../../components/auth/AuthHeader';
import { PasswordStrengthIndicator } from '../../../components/auth/PasswordStrengthIndicator';
import { AuthClient } from '../../../lib/api-auth';
import { Button } from '../../../components/Button';
import { IconAlertTriangle } from '../../../components/navigation/TechIcons';
import { ActivityPack } from '@docteurflotte/contracts';

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [activityPack, setActivityPack] = useState<ActivityPack>(ActivityPack.TRANSPORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await AuthClient.registerTenant({
        companyName,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPassword,
        activityPack,
      });

      AuthClient.saveSession(response);

      // Redirection immédiate vers l'onboarding guidé
      router.push('/setup');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la création du compte.';
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
          maxWidth: '520px',
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
          subtitle="Démarrez avec votre espace sécurisé dédié (RLS Fail-Closed)"
        />

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="companyName"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
            >
              Raison Sociale / Nom de l’Organisation
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ex: Transports & Logistique El Djazair"
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
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label
                htmlFor="adminFirstName"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
              >
                Prénom
              </label>
              <input
                id="adminFirstName"
                type="text"
                required
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                placeholder="Amine"
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
                }}
              />
            </div>

            <div>
              <label
                htmlFor="adminLastName"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
              >
                Nom
              </label>
              <input
                id="adminLastName"
                type="text"
                required
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                placeholder="Benali"
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
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="adminEmail"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
            >
              Email de l’Administrateur
            </label>
            <input
              id="adminEmail"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="amine.benali@votre-flotte.dz"
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
              }}
            />
          </div>

          <div>
            <label
              htmlFor="adminPassword"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
            >
              Mot de Passe Sécurisé
            </label>
            <input
              id="adminPassword"
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Minimum 8 caractères, lettres et chiffres"
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
              }}
            />
            <PasswordStrengthIndicator password={adminPassword} />
          </div>

          <div>
            <label
              htmlFor="activityPack"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}
            >
              Profil Métier Principal
            </label>
            <select
              id="activityPack"
              value={activityPack}
              onChange={(e) => setActivityPack(e.target.value as ActivityPack)}
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
              }}
            >
              <option value={ActivityPack.TRANSPORT}>Transport Routier & Poids Lourds (TCO / km)</option>
              <option value={ActivityPack.CONSTRUCTION}>BTP & Engins de Chantier (Heures Moteur)</option>
              <option value={ActivityPack.LIGHT_VEHICLES}>Véhicules Légers & Utilitaires</option>
              <option value={ActivityPack.CUSTOM}>Mixte & Équipements Industriels</option>
            </select>
          </div>

          <div style={{ marginTop: '10px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Création de l’organisation...' : 'Créer l’Organisation & Continuer →'}
            </Button>
          </div>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--df-text-muted)',
          }}
        >
          Déjà un compte ?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--df-accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
