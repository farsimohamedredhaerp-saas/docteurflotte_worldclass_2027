'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { TenantSettings } from '@docteurflotte/contracts';
import { Navbar } from '../../components/navigation/Navbar';
import {
  IconCreditCard,
  IconCheck,
  IconAlertTriangle,
  IconShieldCheck,
} from '../../components/navigation/TechIcons';

type SettingsTab = 'regional' | 'operational' | 'economic' | 'data';

export default function SettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Mon Organisation');
  const [activeTab, setActiveTab] = useState<SettingsTab>('operational');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Valeurs dynamiques éditables (aucune constante en dur)
  const [currency, setCurrency] = useState('DZD');
  const [measurementSystem, setMeasurementSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');

  // Branding & Régionalisation
  const [timezone, setTimezone] = useState('Africa/Algiers');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Seuils Opérationnels
  const [warningKm, setWarningKm] = useState(1000);
  const [warningHours, setWarningHours] = useState(50);
  const [noticeDays, setNoticeDays] = useState(15);
  const [rollbackToleranceKm, setRollbackToleranceKm] = useState(0);
  const [dailyKmExcessThreshold, setDailyKmExcessThreshold] = useState(800);

  // Barèmes Économiques
  const [hourlyLaborRate, setHourlyLaborRate] = useState(1500);
  const [approvalExpenseThreshold, setApprovalExpenseThreshold] = useState(100000);
  const [inactionRiskMultiplier, setInactionRiskMultiplier] = useState(3.5);
  const [referenceFuelPricePerLiter, setReferenceFuelPricePerLiter] = useState(29.0);

  // Données & Démo
  const [dataOrigin, setDataOrigin] = useState<string>('DEMO');
  const [isPurging, setIsPurging] = useState(false);

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

    // Chargement des paramètres du tenant depuis PostgreSQL RLS
    AuthClient.getSettings(session.token)
      .then((settings: TenantSettings) => {
        setCurrency(settings.currency || 'DZD');
        setMeasurementSystem(settings.measurementSystem || 'METRIC');

        if (settings.branding) {
          setTimezone(settings.branding.timezone || 'Africa/Algiers');
          setDateFormat(settings.branding.dateFormat || 'DD/MM/YYYY');
        }

        if (settings.alertThresholds) {
          setWarningKm(settings.alertThresholds.maintenanceWarningKm ?? 1000);
          setWarningHours(settings.alertThresholds.maintenanceWarningHours ?? 50);
          setNoticeDays(settings.alertThresholds.inspectionDaysNotice ?? 15);
          setRollbackToleranceKm(settings.alertThresholds.odometerRollbackToleranceKm ?? 0);
          setDailyKmExcessThreshold(settings.alertThresholds.dailyKmExcessThreshold ?? 800);
        }

        if (settings.economicRates) {
          setHourlyLaborRate(settings.economicRates.hourlyLaborRate ?? 1500);
          setApprovalExpenseThreshold(settings.economicRates.approvalExpenseThreshold ?? 100000);
          setInactionRiskMultiplier(settings.economicRates.inactionRiskMultiplier ?? 3.5);
          setReferenceFuelPricePerLiter(settings.economicRates.referenceFuelPricePerLiter ?? 29.0);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Impossible de charger les paramètres.';
        setFeedback({ type: 'error', message: msg });
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      await AuthClient.updateSettings(
        {
          currency,
          measurementSystem,
          branding: { timezone, dateFormat },
          alertThresholds: {
            maintenanceWarningKm: Number(warningKm),
            maintenanceWarningHours: Number(warningHours),
            inspectionDaysNotice: Number(noticeDays),
            odometerRollbackToleranceKm: Number(rollbackToleranceKm),
            dailyKmExcessThreshold: Number(dailyKmExcessThreshold),
          },
          economicRates: {
            hourlyLaborRate: Number(hourlyLaborRate),
            approvalExpenseThreshold: Number(approvalExpenseThreshold),
            inactionRiskMultiplier: Number(inactionRiskMultiplier),
            referenceFuelPricePerLiter: Number(referenceFuelPricePerLiter),
          },
        },
        token,
      );

      setFeedback({ type: 'success', message: 'Paramètres personnalisés enregistrés avec succès sous PostgreSQL RLS.' });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la sauvegarde des paramètres.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeDemo = async () => {
    if (!token) return;
    if (!confirm('Attention : Cette action va marquer votre espace comme données réelles (USER_ENTRY). Confirmer la purge ?')) {
      return;
    }

    setIsPurging(true);
    setFeedback(null);

    try {
      const res = await AuthClient.purgeDemo(token);
      setDataOrigin(res.dataOrigin);
      setFeedback({ type: 'success', message: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la purge démo.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--df-text-muted)' }}>
        Chargement des paramètres de votre organisation...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: '1020px', margin: '0 auto' }}>
        
        {/* Navigation Supérieure */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm">
              ← Retour au Tableau de Bord
            </Button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/settings/subscription" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)' }}>
                <IconCreditCard size={14} className="inline mr-1" />
                Mon Abonnement & Factures DGI
              </Button>
            </Link>
            <Badge variant="ok">RLS Isolation Active</Badge>
            <span style={{ fontSize: '13px', color: 'var(--df-text-muted)' }}>
              Tenant : <strong>{tenantName}</strong>
            </span>
          </div>
        </div>

        {/* Titre et Explication du Principe */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Configuration & Personnalisation de l&apos;Organisation
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', margin: 0 }}>
            Conformément à la règle d&apos;or <em>« Zéro Constante en Dur »</em>, l&apos;ensemble des seuils, fréquences, barèmes et règles financières sont personnalisables par votre organisation.
          </p>
        </div>

        {/* Message de Feedback */}
        {feedback && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Onglets de Configuration */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--df-border-subtle)', marginBottom: '24px' }}>
          {[
            { id: 'operational', label: '1. Métrologie & Intégrité' },
            { id: 'economic', label: '2. Barèmes Financiers' },
            { id: 'regional', label: '3. Régionalisation & Marque' },
            { id: 'data', label: '4. Données & Démo' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                style={{
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--df-accent-cyan)' : 'var(--df-text-muted)',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--df-accent-cyan)' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Formulaire Principal */}
        <form onSubmit={handleSave}>
          <div
            className="df-glass"
            style={{
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
              marginBottom: '28px',
            }}
          >
            {/* Onglet 1 : Métrologie & Intégrité */}
            {activeTab === 'operational' && (
              <div>
                {/* Bannière d'architecture OEM-First */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 210, 255, 0.06)',
                    border: '1px solid rgba(0, 210, 255, 0.25)',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <IconShieldCheck size={22} className="text-cyan-400 mt-0.5" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-cyan)', marginBottom: '4px' }}>
                      Périodicités & Tolérances d&apos;Entretien : Modèle OEM-First par Actif
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                      Conformément aux règles de l&apos;art mécanique et à la doctrine DocteurFlotte, les intervalles de révision (vidange moteur, courroies, filtres, cycles d&apos;heures) et leurs marges de déclenchement ne sont <strong>pas uniformes pour toute l&apos;entreprise</strong>. Ils sont gouvernés au niveau de chaque véhicule selon sa <strong>Marque, son Modèle, sa Motorisation et son Année</strong> dans le carnet constructeur OEM.
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <Link
                        href="/assets"
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--df-accent-cyan)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Gérer et personnaliser les plans d&apos;entretien constructeur dans le Parc d&apos;Actifs</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                  Contrôle Métrologique & Intégrité des Données de Compteurs
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                  Configurez les tolérances globales de détection d&apos;anomalies de saisie ou de télémétrie (recul de compteur, dépassement journalier suspect) et les préavis des contrôles réglementaires d&apos;État.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div>
                    <label htmlFor="noticeDaysInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Préavis Contrôles Réglementaires Légaux (Jours)
                    </label>
                    <input
                      id="noticeDaysInput"
                      type="number"
                      min={1}
                      value={noticeDays}
                      onChange={(e) => setNoticeDays(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Anticipation obligatoire : visite technique ENACTA, épreuves citernes, extincteurs.</span>
                  </div>

                  <div>
                    <label htmlFor="rollbackInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Tolérance Recul Compteur ({measurementSystem === 'METRIC' ? 'km' : 'mi'})
                    </label>
                    <input
                      id="rollbackInput"
                      type="number"
                      min={0}
                      value={rollbackToleranceKm}
                      onChange={(e) => setRollbackToleranceKm(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>0 = Alerte anti-fraude et mise en quarantaine immédiate dès qu&apos;un compteur régresse.</span>
                  </div>

                  <div>
                    <label htmlFor="dailyKmInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Plafond Journalier Anormal ({measurementSystem === 'METRIC' ? 'km/j' : 'mi/j'})
                    </label>
                    <input
                      id="dailyKmInput"
                      type="number"
                      min={100}
                      value={dailyKmExcessThreshold}
                      onChange={(e) => setDailyKmExcessThreshold(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Alerte sur anomalie de saisie manuelle ou parcours télématique aberrant.</span>
                  </div>
                </div>
              </div>
            )}


            {/* Onglet 2 : Barèmes Financiers */}
            {activeTab === 'economic' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                  Barèmes Financiers & Moteur de Contrôle de Gestion
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                  Définissez vos coûts unitaires réels pour alimenter le calcul du TCO et du coût de l&apos;inaction.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div>
                    <label htmlFor="hourlyRateInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Taux Horaire Main-d&apos;œuvre Atelier ({currency} / heure)
                    </label>
                    <input
                      id="hourlyRateInput"
                      type="number"
                      min={0}
                      step={50}
                      value={hourlyLaborRate}
                      onChange={(e) => setHourlyLaborRate(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Coût horaire standard imputé aux ordres de travail internes.</span>
                  </div>

                  <div>
                    <label htmlFor="approvalThresholdInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Seuil d&apos;Approbation Direction ({currency})
                    </label>
                    <input
                      id="approvalThresholdInput"
                      type="number"
                      min={1000}
                      step={1000}
                      value={approvalExpenseThreshold}
                      onChange={(e) => setApprovalExpenseThreshold(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Toute dépense supérieure requiert validation managériale.</span>
                  </div>

                  <div>
                    <label htmlFor="inactionMultiplierInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Multiplicateur Risque Coût Inaction (Ratio)
                    </label>
                    <input
                      id="inactionMultiplierInput"
                      type="number"
                      min={1.0}
                      max={10.0}
                      step={0.1}
                      value={inactionRiskMultiplier}
                      onChange={(e) => setInactionRiskMultiplier(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Ex: 3.5 = Réparer plus tard coûte en moyenne 3.5x plus cher.</span>
                  </div>

                  <div>
                    <label htmlFor="fuelPriceInput" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Prix de Référence Carburant ({currency} / Litre)
                    </label>
                    <input
                      id="fuelPriceInput"
                      type="number"
                      min={1}
                      step={0.5}
                      value={referenceFuelPricePerLiter}
                      onChange={(e) => setReferenceFuelPricePerLiter(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <span style={helperStyle}>Base de calcul pour les surconsommations et budgets prévisionnels.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet 3 : Régionalisation & Marque */}
            {activeTab === 'regional' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                  Identité, Devise & Formats Locaux
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                  Paramétrez les conventions d&apos;affichage adaptées à votre implantation géographique.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div>
                    <label htmlFor="currencySelect" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Devise Principale de Comptabilité
                    </label>
                    <select
                      id="currencySelect"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="DZD">Dinar Algérien (DZD — د.ج)</option>
                      <option value="EUR">Euro (EUR — €)</option>
                      <option value="USD">Dollar Américain (USD — $)</option>
                      <option value="TND">Dinar Tunisien (TND)</option>
                      <option value="MAD">Dirham Marocain (MAD)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="systemSelect" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Système de Mesure des Actifs
                    </label>
                    <select
                      id="systemSelect"
                      value={measurementSystem}
                      onChange={(e) => setMeasurementSystem(e.target.value as 'METRIC' | 'IMPERIAL')}
                      style={inputStyle}
                    >
                      <option value="METRIC">Métrique (km, Litres, tonnes)</option>
                      <option value="IMPERIAL">Impérial (miles, gallons, US tons)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tzSelect" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Fuseau Horaire de l&apos;Organisation
                    </label>
                    <select
                      id="tzSelect"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Africa/Algiers">Afrique / Alger (UTC+1)</option>
                      <option value="Europe/Paris">Europe / Paris (UTC+1 / UTC+2)</option>
                      <option value="UTC">UTC (Temps Universel)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dateFormatSelect" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                      Format d&apos;Affichage des Dates
                    </label>
                    <select
                      id="dateFormatSelect"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="DD/MM/YYYY">JJ/MM/AAAA (ex: 24/10/2026)</option>
                      <option value="YYYY-MM-DD">AAAA-MM-JJ (Norme ISO)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet 4 : Données & Démo */}
            {activeTab === 'data' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
                  Gestion des Données & Séparation Démo
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', marginBottom: '24px' }}>
                  Conformément aux interdictions absolues de l&apos;AGENTS.md, les données de démonstration ne sont jamais mélangées avec vos métriques de production.
                </p>

                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                      Origine des Données Actuelles :
                    </span>
                    <Badge variant={dataOrigin === 'DEMO' ? 'demo' : 'ok'}>
                      {dataOrigin === 'DEMO' ? 'DONNÉES SYNTHÉTIQUES DÉMO' : 'DONNÉES RÉELLES UTILISATEUR'}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', margin: 0 }}>
                    {dataOrigin === 'DEMO'
                      ? 'Votre organisation exploite actuellement un jeu d’actifs de démonstration pour tester les scénarios décisionnels. Vous pouvez purger ces données pour amorcer l’import de votre flotte réelle.'
                      : 'Votre organisation est configurée en mode réel. Aucune donnée synthétique n’est injectée.'}
                  </p>
                </div>

                {dataOrigin === 'DEMO' && (
                  <div>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      isLoading={isPurging}
                      onClick={handlePurgeDemo}
                    >
                      {isPurging ? 'Purge en cours...' : 'Purger les Données Démo & Basculer en Mode Réel'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton de Sauvegarde Général */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button type="button" variant="outline" size="lg">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              style={{ minWidth: '180px', justifyContent: 'center' }}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les Paramètres'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </>
);
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  backgroundColor: 'var(--df-bg-surface-2)',
  border: '1px solid var(--df-border-subtle)',
  color: 'var(--df-text-main)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const helperStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--df-text-muted)',
  marginTop: '5px',
};
