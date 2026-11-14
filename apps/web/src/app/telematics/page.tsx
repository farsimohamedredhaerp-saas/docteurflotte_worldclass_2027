'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import { TelematicsClient } from '../../lib/api-telematics';
import { Navbar } from '../../components/navigation/Navbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  Asset,
  AssetDeviceBinding,
  DeviceStatus,
  FleetLiveAsset,
  TelematicsDevice,
  TraccarGatewayHealth,
} from '@docteurflotte/contracts';
import { useDemoMode } from '../../context/DemoModeContext';
import {
  IconRadio,
  IconCpu,
  IconLink,
  IconUnlink,
  IconTruck,
  IconX,
  IconAlertTriangle,
  IconPlus,
} from '../../components/navigation/TechIcons';

export default function TelematicsPage() {
  const router = useRouter();
  const { isDemoMode, isGuest } = useDemoMode();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FLEET' | 'DEVICES'>('FLEET');

  const [fleetLive, setFleetLive] = useState<FleetLiveAsset[]>([]);
  const [devices, setDevices] = useState<TelematicsDevice[]>([]);
  const [bindings, setBindings] = useState<AssetDeviceBinding[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [gatewayHealth, setGatewayHealth] = useState<TraccarGatewayHealth | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Modale Enregistrement Boîtier
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    uniqueId: '',
    name: '',
    model: 'Teltonika FMB920',
  });
  const [isSubmittingDevice, setIsSubmittingDevice] = useState(false);

  // Modale Appairage Actif <-> Boîtier
  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [bindForm, setBindForm] = useState({
    assetId: '',
    deviceId: '',
  });
  const [isSubmittingBind, setIsSubmittingBind] = useState(false);

  const loadData = async (authToken: string) => {
    setIsLoading(true);
    try {
      const [fleetRes, devRes, bindRes, assetRes, healthRes] = await Promise.all([
        TelematicsClient.getFleetLive(authToken),
        TelematicsClient.listDevices(authToken),
        TelematicsClient.listBindings(authToken),
        AssetClient.listAssets(authToken),
        TelematicsClient.getHealth(authToken).catch(() => null),
      ]);

      setFleetLive(fleetRes);
      setDevices(devRes);
      setBindings(bindRes);
      setAssets(assetRes);
      setGatewayHealth(healthRes);

      if (assetRes.length > 0 && !bindForm.assetId) {
        setBindForm((prev) => ({ ...prev, assetId: assetRes[0].id }));
      }
      if (devRes.length > 0 && !bindForm.deviceId) {
        setBindForm((prev) => ({ ...prev, deviceId: devRes[0].id }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des flux télématiques.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const session = AuthClient.getSession();
    setToken(session.token);

    if (isDemoMode) {
      import('@/lib/simulation-sandbox')
        .then((sandbox) => {
          setGatewayHealth(sandbox.MOCK_SANDBOX_GATEWAY_HEALTH);
          setDevices(sandbox.MOCK_SANDBOX_TELEMATICS_DEVICES);
          setFleetLive(sandbox.MOCK_SANDBOX_FLEET_LIVE);
        })
        .finally(() => setIsLoading(false));
    } else if (session.token) {
      loadData(session.token);
    } else {
      setDevices([]);
      setFleetLive([]);
      setBindings([]);
      setAssets([]);
      setGatewayHealth(null);
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingDevice(true);
    setFeedback(null);

    try {
      await TelematicsClient.registerDevice(newDevice, token);
      setFeedback({ type: 'success', message: `Boîtier GPS « ${newDevice.name} » (${newDevice.uniqueId}) enregistré avec succès.` });
      setIsAddDeviceModalOpen(false);
      setNewDevice({ uniqueId: '', name: '', model: 'Teltonika FMB920' });
      loadData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l’enregistrement du boîtier.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingDevice(false);
    }
  };

  const handleBindDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingBind(true);
    setFeedback(null);

    try {
      await TelematicsClient.bindDevice(bindForm, token);
      setFeedback({ type: 'success', message: `Appairage horodaté activé avec succès. Télémétrie Traccar synchronisée.` });
      setIsBindModalOpen(false);
      loadData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l’appairage.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingBind(false);
    }
  };

  const handleUnbind = async (bindingId: string) => {
    if (!token) return;
    try {
      await TelematicsClient.unbindDevice(bindingId, token);
      setFeedback({ type: 'success', message: 'Boîtier dissocié de l’actif avec succès.' });
      loadData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la dissociation.';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const movingCount = fleetLive.filter((a) => a.speed > 0).length;
  const boundDevicesCount = bindings.filter((b) => b.isActive).length;
  const maintenanceDueCount = fleetLive.filter((a) => a.maintenanceDue).length;

  return (
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }}>
        {/* EN-TÊTE DE CONSOLE TÉLÉMATIQUE */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em' }}>
                Console Télématique & Fleet Live
              </h1>
              <Badge variant="ok">Gate 3 Traccar Active</Badge>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--df-text-muted)', marginTop: '0.2rem' }}>
              Ingestion résiliente, dédoublonnage strict, appairage d&apos;actifs et flux de positions temps réel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/telematics/hardware"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--df-radius-sm)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <IconRadio size={14} />
              <span>Matériels IoT Compatibles</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setIsBindModalOpen(true)}>
              <IconLink size={14} className="inline mr-1" />
              Nouvel Appairage
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddDeviceModalOpen(true)}>
              <IconPlus size={14} className="inline mr-1" />
              Enregistrer Boîtier GPS
            </Button>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATION */}
        {feedback && (
          <div
            role="status"
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? 'var(--df-status-ok-bg)' : 'var(--df-status-danger-bg)',
              color: feedback.type === 'success' ? 'var(--df-status-ok)' : 'var(--df-status-danger)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--df-status-ok-border)' : 'var(--df-status-danger-border)'}`,
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              aria-label="Fermer"
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        {/* CARTOUCHES DE SUPERVISION TÉLÉMATIQUE */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="df-glass" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Passerelle Traccar</span>
              <span className="df-pulse-live" />
            </div>
            <div className="df-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--df-status-ok)', marginTop: '0.35rem' }}>
              En Ligne
            </div>
            <span className="df-mono" style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>Port 5055 • Taux erreur : 0%</span>
          </div>

          <div className="df-glass" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Boîtiers GPS Actifs</span>
              <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-faint)' }}>{devices.length} enregistrés</span>
            </div>
            <div className="df-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.35rem' }}>
              {boundDevicesCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>Appairés aux actifs</span>
          </div>

          <div className="df-glass" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>En Déplacement</span>
              <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-accent-cyan)' }}>Vitesse &gt; 0</span>
            </div>
            <div className="df-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--df-accent-cyan)', marginTop: '0.35rem' }}>
              {movingCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>Sur les routes en mission</span>
          </div>

          <div className="df-glass" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-status-danger)', fontWeight: 600, textTransform: 'uppercase' }}>Seuil Révision Atteint</span>
              <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-status-danger)' }}>Compteur alerté</span>
            </div>
            <div className="df-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--df-status-danger)', marginTop: '0.35rem' }}>
              {maintenanceDueCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>OT préventif auto généré</span>
          </div>
        </section>

        {/* ONGLETS DE NAVIGATION DE CONSOLE */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--df-bg-surface-2)', padding: '0.35rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('FLEET')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'FLEET' ? 'var(--df-accent-blue)' : 'transparent',
              color: activeTab === 'FLEET' ? '#ffffff' : 'var(--df-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--df-transition-fast)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRadio size={14} />
            <span>Fleet Live — Supervision de Flotte</span>
          </button>
          <button
            onClick={() => setActiveTab('DEVICES')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'DEVICES' ? 'var(--df-accent-blue)' : 'transparent',
              color: activeTab === 'DEVICES' ? '#ffffff' : 'var(--df-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--df-transition-fast)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconCpu size={14} />
            <span>Boîtiers GPS & Appairages ({devices.length})</span>
          </button>
        </div>

        {/* CONTENU ONGLET 1 : FLEET LIVE CONSOLE */}
        {activeTab === 'FLEET' && (
          <div>
            {isLoading ? (
              <div className="df-glass" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                Acquisition du flux télématique Fleet Live...
              </div>
            ) : fleetLive.length === 0 ? (
              <div className="df-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '1rem' }}>
                  <IconRadio size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
                  Aucun actif opérationnel détecté
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Créez des actifs et appairez des boîtiers GPS Traccar pour visualiser les vitesses, contacts et compteurs en direct.
                </p>
                <Link href="/assets" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    <IconTruck size={14} className="inline mr-1" />
                    Voir les Actifs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="df-glass" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '1rem' }}>Code Parc</th>
                      <th style={{ padding: '1rem' }}>Désignation Actif</th>
                      <th style={{ padding: '1rem' }}>Statut Liaison GPS</th>
                      <th style={{ padding: '1rem' }}>Vitesse Live</th>
                      <th style={{ padding: '1rem' }}>Contact ACC</th>
                      <th style={{ padding: '1rem' }}>Dernière Position</th>
                      <th style={{ padding: '1rem' }}>Compteur Certifié</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Maintenance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetLive.map((asset) => {
                      const isMoving = asset.speed > 0;
                      const hasGps = asset.latitude && asset.longitude;

                      return (
                        <tr
                          key={asset.assetId}
                          style={{
                            borderBottom: '1px solid var(--df-border-subtle)',
                            transition: 'background var(--df-transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--df-bg-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '1rem' }}>
                            <span
                              className="df-mono"
                              style={{
                                fontWeight: 800,
                                color: 'var(--df-text-main)',
                                padding: '0.2rem 0.5rem',
                                background: 'var(--df-bg-surface-2)',
                                borderRadius: 'var(--df-radius-xs)',
                                border: '1px solid var(--df-border-subtle)',
                              }}
                            >
                              {asset.assetCode}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{asset.assetName}</div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>{asset.assetCategory}</span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {asset.deviceUniqueId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span className="df-pulse-live" />
                                <div>
                                  <span style={{ fontWeight: 600, color: 'var(--df-status-ok)', fontSize: '0.78rem' }}>Connecté</span>
                                  <div className="df-mono" style={{ fontSize: '0.7rem', color: 'var(--df-text-faint)' }}>{asset.deviceUniqueId}</div>
                                </div>
                              </div>
                            ) : (
                              <Badge variant="demo">Non Appairé</Badge>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              className="df-mono"
                              style={{
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: isMoving ? 'var(--df-accent-cyan)' : 'var(--df-text-muted)',
                              }}
                            >
                              {asset.speed} km/h
                            </span>
                            {isMoving && <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', color: 'var(--df-status-ok)' }}>• En route</span>}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <Badge variant={asset.ignition ? 'ok' : 'info'}>
                              {asset.ignition ? 'Contact ON' : 'Contact OFF'}
                            </Badge>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {hasGps ? (
                              <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>
                                {asset.latitude?.toFixed(4)}° N, {asset.longitude?.toFixed(4)}° E
                              </div>
                            ) : (
                              <span style={{ color: 'var(--df-text-faint)', fontSize: '0.75rem' }}>En attente fix GPS</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span className="df-mono" style={{ fontWeight: 800, color: 'var(--df-text-main)' }}>
                              {asset.currentMeterValue.toLocaleString()} km
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {asset.maintenanceDue ? (
                              <Badge variant="danger" pulse>Révision Requise</Badge>
                            ) : (
                              <Badge variant="ok">Nominal</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 2 : BOÎTIERS & APPAIRAGES GPS */}
        {activeTab === 'DEVICES' && (
          <div>
            {isLoading ? (
              <div className="df-glass" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                Chargement des terminaux GPS...
              </div>
            ) : devices.length === 0 ? (
              <div className="df-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '1rem' }}>
                  <IconCpu size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
                  Aucun terminal GPS enregistré
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Enregistrez vos boîtiers télématiques (Teltonika, Coban, Meitrack) en renseignant leur numéro IMEI unique.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsAddDeviceModalOpen(true)}>
                  <IconPlus size={14} className="inline mr-1" />
                  Enregistrer le Premier Boîtier
                </Button>
              </div>
            ) : (
              <div className="df-glass" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '1rem' }}>Numéro IMEI / UniqueID</th>
                      <th style={{ padding: '1rem' }}>Désignation du Boîtier</th>
                      <th style={{ padding: '1rem' }}>Modèle Matériel</th>
                      <th style={{ padding: '1rem' }}>Statut Réseau</th>
                      <th style={{ padding: '1rem' }}>Actif Actuellement Lié</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => {
                      const activeBinding = bindings.find((b) => b.deviceId === device.id && b.isActive);

                      return (
                        <tr
                          key={device.id}
                          style={{
                            borderBottom: '1px solid var(--df-border-subtle)',
                            transition: 'background var(--df-transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--df-bg-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '1rem' }}>
                            <span
                              className="df-mono"
                              style={{
                                fontWeight: 800,
                                color: 'var(--df-accent-cyan)',
                                padding: '0.15rem 0.45rem',
                                background: 'var(--df-bg-surface-2)',
                                borderRadius: 'var(--df-radius-xs)',
                                border: '1px solid var(--df-border-subtle)',
                              }}
                            >
                              {device.uniqueId}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                            {device.name}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--df-text-secondary)', fontSize: '0.8rem' }}>
                            {device.model || 'Standard Traccar'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="df-pulse-live" />
                              <span style={{ fontWeight: 600, color: 'var(--df-status-ok)' }}>En Ligne</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {activeBinding ? (
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{activeBinding.assetName}</span>
                                <span className="df-mono" style={{ marginLeft: '0.35rem', color: 'var(--df-text-faint)', fontSize: '0.72rem' }}>
                                  ({activeBinding.assetCode})
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--df-text-faint)', fontStyle: 'italic' }}>Non affecté</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {activeBinding ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbind(activeBinding.id)}
                              >
                                <IconUnlink size={13} className="inline mr-1 text-rose-400" />
                                Dissocier
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setBindForm((prev) => ({ ...prev, deviceId: device.id }));
                                  setIsBindModalOpen(true);
                                }}
                              >
                                <IconLink size={13} className="inline mr-1" />
                                Lier à un Actif
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODALE ENREGISTREMENT TERMINAL GPS */}
        {isAddDeviceModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              className="df-glass"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '2rem',
                background: 'var(--df-bg-glass-elevated)',
                borderRadius: 'var(--df-radius-lg)',
                boxShadow: 'var(--df-shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.35rem' }}>
                Enregistrer un Boîtier GPS Traccar
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1.5rem' }}>
                Intégration Traccar Gateway : configurez l&apos;IMEI pointant vers le port 5055.
              </p>

              <form onSubmit={handleRegisterDevice}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Numéro IMEI / Identifiant Unique *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 864200051234567"
                    value={newDevice.uniqueId}
                    onChange={(e) => setNewDevice({ ...newDevice, uniqueId: e.target.value })}
                    className="df-mono"
                    style={modalInputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Nom / Libellé du Terminal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: GPS Scania R450 01"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    style={modalInputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Modèle du Boîtier</label>
                  <input
                    type="text"
                    placeholder="Ex: Teltonika FMB920"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    style={modalInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button type="button" variant="outline" size="md" onClick={() => setIsAddDeviceModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="md" isLoading={isSubmittingDevice}>
                    Enregistrer le Boîtier
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE APPAIRAGE HORODATÉ */}
        {isBindModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              className="df-glass"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '2rem',
                background: 'var(--df-bg-glass-elevated)',
                borderRadius: 'var(--df-radius-lg)',
                boxShadow: 'var(--df-shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.35rem' }}>
                Appairer un Boîtier GPS à un Actif
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1.5rem' }}>
                Les flux de positions et compteurs seront immédiatement reliés à l&apos;actif sélectionné.
              </p>

              <form onSubmit={handleBindDevice}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Actif Opérationnel *</label>
                  <select
                    value={bindForm.assetId}
                    onChange={(e) => setBindForm({ ...bindForm, assetId: e.target.value })}
                    style={modalInputStyle}
                    required
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name} ({a.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Boîtier GPS Disponible *</label>
                  <select
                    value={bindForm.deviceId}
                    onChange={(e) => setBindForm({ ...bindForm, deviceId: e.target.value })}
                    style={modalInputStyle}
                    required
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.uniqueId} — {d.name} ({d.model || 'Traccar'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button type="button" variant="outline" size="md" onClick={() => setIsBindModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="md" isLoading={isSubmittingBind}>
                    Valider l&apos;Appairage
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--df-text-secondary)',
  marginBottom: '0.35rem',
};

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  background: 'var(--df-bg-surface-2)',
  border: '1px solid var(--df-border-subtle)',
  borderRadius: 'var(--df-radius-sm)',
  color: 'var(--df-text-main)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};
