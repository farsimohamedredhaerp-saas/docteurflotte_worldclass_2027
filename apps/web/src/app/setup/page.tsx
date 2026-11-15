'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SetupStepper } from '../../components/setup/SetupStepper';
import { PackSelector } from '../../components/setup/PackSelector';
import { AuthClient } from '../../lib/api-auth';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Navbar } from '../../components/navigation/Navbar';
import { ActivityPack } from '@docteurflotte/contracts';
import { IconAlertTriangle, IconArrowUpRight } from '../../components/navigation/TechIcons';

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Votre Organisation');

  // État de la configuration
  const [activityPack, setActivityPack] = useState<ActivityPack>(ActivityPack.TRANSPORT);
  const [measurementSystem, setMeasurementSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [currency, setCurrency] = useState('DZD');
  const [enableDemoData, setEnableDemoData] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (!session.token) {
      router.push('/login');
      return;
    }
    setToken(session.token);
    if (session.tenant?.name) {
      setTenantName(session.tenant.name);
    }
    if (session.tenant?.activityPack) {
      setActivityPack(session.tenant.activityPack);
    }
  }, [router]);

  const handleFinishSetup = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthClient.completeSetup(
        {
          activityPack,
          measurementSystem,
          currency,
          enableDemoData,
        },
        token,
      );

      // Mise à jour de la session locale avec le nouveau statut
      const session = AuthClient.getSession();
      if (session.user && session.tenant) {
        AuthClient.saveSession({
          accessToken: token,
          user: session.user,
          tenant: {
            ...session.tenant,
            status: response.tenant.status,
            activityPack: response.tenant.activityPack,
            dataOrigin: response.tenant.dataOrigin,
            isSetupCompleted: true,
          },
        });
      }

      if (typeof window !== 'undefined') {
        if (!enableDemoData) {
          localStorage.setItem('df_demo_mode_active', 'false');
        } else {
          localStorage.setItem('df_demo_mode_active', 'true');
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('auth:session-changed'));
      }

      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation du setup.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)' }}>
      <Navbar />
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: 'var(--df-bg-base)',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Halo d'ambiance */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: '840px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Badge variant="demo" pulse>Activation-First</Badge>
            <span style={{ fontSize: '13px', color: 'var(--df-text-muted)' }}>Organisation : <strong>{tenantName}</strong></span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--df-text-main)', margin: '4px 0' }}>
            Configuration Initiale du Parc
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Personnalisez votre console décisionnelle en 3 étapes sans écran blanc
          </p>
        </div>

        <SetupStepper currentStep={currentStep} />

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IconAlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div
          className="df-glass"
          style={{
            padding: '36px',
            borderRadius: '16px',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-lg)',
            marginBottom: '24px',
          }}
        >
          {/* Étape 1 : Pack Métier */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '8px' }}>
                Étape 1 : Confirmez votre Pack Métier
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', marginBottom: '20px' }}>
                Le pack configure automatiquement les types d&apos;actifs par défaut, les compteurs critiques (km ou heures) et les règles d&apos;entretien préventif.
              </p>

              <PackSelector selected={activityPack} onSelect={(p) => setActivityPack(p)} />
            </div>
          )}

          {/* Étape 2 : Métrologie & Devise */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '8px' }}>
                Étape 2 : Unités Métrologiques & Devise de Référence
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                Définissez les standards de calcul pour le TCO, les coûts d&apos;inaction et les relevés de capteurs.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '8px' }}>
                    Système de Mesure
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--df-text-main)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="system"
                        checked={measurementSystem === 'METRIC'}
                        onChange={() => setMeasurementSystem('METRIC')}
                      />
                      <span><strong>Métrique (Standard)</strong> : Kilomètres (km), Litres (L)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--df-text-muted)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="system"
                        checked={measurementSystem === 'IMPERIAL'}
                        onChange={() => setMeasurementSystem('IMPERIAL')}
                      />
                      <span><strong>Impérial</strong> : Miles (mi), Gallons (gal)</span>
                    </label>
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                  }}
                >
                  <label htmlFor="currencySelect" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '8px' }}>
                    Devise de Comptabilisation
                  </label>
                  <select
                    id="currencySelect"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--df-bg-surface-3)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="DZD">Dinar Algérien (DZD — د.ج)</option>
                    <option value="EUR">Euro (EUR — €)</option>
                    <option value="USD">Dollar Américain (USD — $)</option>
                  </select>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginTop: '8px' }}>
                    Les montants prévisionnels et réels seront ventilés dans cette devise.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 : Mode d'Activation & Démo */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '8px' }}>
                Étape 3 : Mode de Démarrage & Données Démo
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                Conformément à la règle <em>Activation-First</em>, démarrez immédiatement avec des exemples concrets ou commencez avec vos données.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => setEnableDemoData(true)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: enableDemoData ? 'var(--df-bg-surface-3)' : 'var(--df-bg-surface-2)',
                    border: enableDemoData ? '2px solid var(--df-accent-cyan)' : '1px solid var(--df-border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <input
                    type="radio"
                    name="demoData"
                    checked={enableDemoData}
                    onChange={() => setEnableDemoData(true)}
                    style={{ marginTop: '4px' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--df-text-main)' }}>
                        Activer le Jeu de Données Synthétiques Démo (Recommandé)
                      </strong>
                      <Badge variant="demo">DEMO</Badge>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Instancie 10 actifs représentatifs (avec compteurs km et heures) et 1 scénario d&apos;arbitrage décisionnel (« Aha! moment ») prêt à tester. Balisage strict <code>data_origin = &apos;DEMO&apos;</code> garantissant zéro pollution des calculs réels. Purgeable à tout moment en 1 clic.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setEnableDemoData(false)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: !enableDemoData ? 'var(--df-bg-surface-3)' : 'var(--df-bg-surface-2)',
                    border: !enableDemoData ? '2px solid var(--df-accent-cyan)' : '1px solid var(--df-border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <input
                    type="radio"
                    name="demoData"
                    checked={!enableDemoData}
                    onChange={() => setEnableDemoData(false)}
                    style={{ marginTop: '4px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--df-text-main)', display: 'block', marginBottom: '4px' }}>
                      Démarrer à Blanc avec vos Propres Données
                    </strong>
                    <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Vous accéderez directement à l&apos;assistant d&apos;importation (fichiers CSV / Excel) avec gabarit de diagnostic de parc téléchargeable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Boutons de navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Précédent
              </Button>
            ) : <div />}

            {currentStep < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Suivant →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onClick={handleFinishSetup}
                style={{ backgroundColor: 'var(--df-status-ok)', borderColor: 'var(--df-status-ok)' }}
              >
                {isLoading ? 'Activation en cours...' : 'Finaliser & Accéder au Tableau de Bord'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
