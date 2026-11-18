'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import {
  RegulatoryStudioClient,
  RegPackSummary,
  RegPackDetail,
  RegPackItem,
  SimulationResultDto,
} from '../../../lib/api-regulatory-studio';
import {
  IconAlertTriangle,
  IconCheck,
  IconFileText,
  IconLayers,
  IconPlay,
  IconRefreshCw,
  IconShieldCheck,
  IconX,
} from '@/components/navigation/TechIcons';

export default function RegulatoryStudioPage() {
  const [packs, setPacks] = useState<RegPackSummary[]>([]);
  const [selectedPackCode, setSelectedPackCode] = useState<string>('DZ_LF_2026_OFFICIAL');
  const [selectedPackDetail, setSelectedPackDetail] = useState<RegPackDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal d'édition de paramètre
  const [editingItem, setEditingItem] = useState<RegPackItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editLegalRef, setEditLegalRef] = useState('');
  const [editJoradp, setEditJoradp] = useState('');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [isUpdatingParam, setIsUpdatingParam] = useState(false);

  // Modal de clonage
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneNewId, setCloneNewId] = useState('');
  const [cloneNewVersion, setCloneNewVersion] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  // Panel de simulation
  const [simCase, setSimCase] = useState<string>('ARTISAN_IFU_5M');
  const [simResult, setSimResult] = useState<SimulationResultDto | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modal de publication
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishExpert, setPublishExpert] = useState('Conseil National de la Fiscalité (DGI / CNC)');
  const [publishApprover, setPublishApprover] = useState('expert.cnc@dzerp.dz');
  const [isPublishing, setIsPublishing] = useState(false);

  const loadPacks = async () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await RegulatoryStudioClient.listPacks(session.token);
      setPacks(data);

      const target = data.find((p) => p.packCode === selectedPackCode) || data[0];
      if (target) {
        setSelectedPackCode(target.packCode);
        const detail = await RegulatoryStudioClient.getPack(target.packCode, session.token);
        setSelectedPackDetail(detail);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des packs réglementaires.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPackDetail = async (code: string) => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setSelectedPackCode(code);
    setIsLoading(true);
    try {
      const detail = await RegulatoryStudioClient.getPack(code, session.token);
      setSelectedPackDetail(detail);
      setSimResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();
  }, []);

  const filteredItems = useMemo(() => {
    if (!selectedPackDetail?.items) return [];

    return selectedPackDetail.items.filter((item) => {
      // Filtrage par recherche
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descriptionFr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.legalRef.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Filtrage par catégorie
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'IFU' && item.code.startsWith('IFU_') || item.code.startsWith('AE_')) return true;
      if (selectedCategory === 'IBS' && item.code.startsWith('IBS_')) return true;
      if (selectedCategory === 'IRG' && (item.code.startsWith('IRG_') || item.code.startsWith('TVA_'))) return true;
      if (selectedCategory === 'CNAS_CASNOS' && (item.code.startsWith('CNAS_') || item.code.startsWith('CASNOS_'))) return true;
      if (selectedCategory === 'SEUILS_TIMBRE' && (item.code.includes('LIMIT') || item.code.includes('TIMBRE') || item.code.includes('PLAFOND'))) return true;
      if (selectedCategory === 'NOUVEAUTES_2026' && (item.code.startsWith('STARTUP_') || item.code.startsWith('TFPC_') || item.code.startsWith('TAPP_') || item.code.includes('RD') || item.code.includes('PRIX_TRANSFERT'))) return true;

      return false;
    });
  }, [selectedPackDetail, selectedCategory, searchTerm]);

  const handleOpenEdit = (item: RegPackItem) => {
    setEditingItem(item);
    setEditValue(item.payload.value);
    setEditLegalRef(item.legalRef);
    setEditJoradp('');
    setEditFrom(item.validFrom);
    setEditTo(item.validTo || '');
  };

  const handleSaveParam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !selectedPackDetail) return;
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsUpdatingParam(true);
    try {
      const updated = await RegulatoryStudioClient.updateParameter(
        selectedPackDetail.packCode,
        editingItem.code,
        {
          value: editValue,
          type: editingItem.payload.type,
          legalReference: editLegalRef,
          joradpCitation: editJoradp,
          applicableFrom: editFrom,
          applicableTo: editTo || null,
          labelFr: editingItem.descriptionFr,
          unit: editingItem.payload.unit,
        },
        session.token
      );

      setSelectedPackDetail(updated);
      setSuccessMsg(`Paramètre « ${editingItem.code} » mis à jour avec traçabilité bitemporelle.`);
      setEditingItem(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdatingParam(false);
    }
  };

  const handleClonePack = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = AuthClient.getSession();
    if (!session.token || !selectedPackDetail) return;

    setIsCloning(true);
    try {
      const cloned = await RegulatoryStudioClient.clonePack(
        {
          sourcePackId: selectedPackDetail.packCode,
          newPackId: cloneNewId,
          newVersion: cloneNewVersion,
          descriptionFr: cloneDesc,
        },
        session.token
      );

      setSuccessMsg(`Pack cloné avec succès : « ${cloned.packCode} ».`);
      setIsCloneModalOpen(false);
      loadPacks();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCloning(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedPackDetail) return;
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsSimulating(true);
    try {
      const res = await RegulatoryStudioClient.simulate(
        selectedPackDetail.packCode,
        simCase,
        session.token
      );
      setSimResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackDetail) return;
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsPublishing(true);
    try {
      const published = await RegulatoryStudioClient.publish(
        selectedPackDetail.packCode,
        {
          publishedByEmail: session.user?.email || 'superadmin@docteurflotte.dz',
          validatedByExpert: publishExpert,
          approverEmail: publishApprover,
        },
        session.token
      );

      setSelectedPackDetail(published);
      setSuccessMsg(`Pack « ${published.packCode} » officiellement signé (Ed25519) et publié !`);
      setIsPublishModalOpen(false);
      loadPacks();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 32px' }}>
      {/* Entête de Titre & Actions Principales */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <IconFileText size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--df-text-main)' }}>
              Regulatory Studio — Packs Réglementaires Bitemporels
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--df-text-muted)' }}>
            Gouvernance souveraine des barèmes DGI, SCF, CASNOS & CNAS. Zéro constante dans le code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (selectedPackDetail) {
                setCloneNewId(`${selectedPackDetail.packCode.replace('_OFFICIAL', '')}_2027_DRAFT`);
                setCloneNewVersion('2027.1.0-draft');
                setCloneDesc(`Pack cloné depuis ${selectedPackDetail.packCode} pour préparation exercice`);
                setIsCloneModalOpen(true);
              }
            }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconLayers size={14} /> Cloner un Nouvel Exercice
          </button>

          {selectedPackDetail?.status === 'DRAFT' && (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <IconShieldCheck size={14} /> Publier & Signer (Ed25519)
            </button>
          )}

          <button
            onClick={loadPacks}
            disabled={isLoading}
            style={{
              padding: '9px',
              borderRadius: '8px',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-muted)',
              cursor: 'pointer',
            }}
            title="Rafraîchir"
          >
            <IconRefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Notifications d'erreur / succès */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><IconX size={14} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCheck size={16} /> {successMsg}
        </div>
      )}

      {/* Barre de Sélection des Packs (Onglets Horizontaux) */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {packs.map((p) => {
          const isSelected = p.packCode === selectedPackCode;
          const isPublished = p.status === 'PUBLISHED';

          return (
            <div
              key={p.packCode}
              onClick={() => loadPackDetail(p.packCode)}
              style={{
                flex: '1 0 240px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--df-bg-surface-1)',
                border: isSelected ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--df-border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isPublished ? '#34d399' : '#fbbf24' }}>
                  {p.status}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>v{p.version}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#818cf8' : 'var(--df-text-main)', marginBottom: '4px' }}>
                {p.packCode}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {p.descriptionFr}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11px', color: 'var(--df-text-muted)' }}>
                <span>{p.itemsCount} paramètres</span>
                {p.hasSignature && <span style={{ color: '#34d399' }}>✓ Signé Ed25519</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Principal : Explorateur de Paramètres (Gauche) & Console Simulation (Droite) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Colonne Gauche : Tableau des Paramètres */}
        <div style={{ background: 'var(--df-bg-surface-1)', borderRadius: '14px', border: '1px solid var(--df-border-subtle)', padding: '20px' }}>
          {/* Filtres & Recherche */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'IFU', label: 'IFU & ANAE' },
                { id: 'IBS', label: 'IBS Sociétés' },
                { id: 'IRG', label: 'IRG & TVA' },
                { id: 'CNAS_CASNOS', label: 'CNAS / CASNOS' },
                { id: 'SEUILS_TIMBRE', label: 'Seuils & Timbre' },
                { id: 'NOUVEAUTES_2026', label: 'LF 2026' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: selectedCategory === c.id ? '#4f46e5' : 'var(--df-bg-surface-2)',
                    color: selectedCategory === c.id ? '#fff' : 'var(--df-text-muted)',
                    border: '1px solid var(--df-border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Rechercher paramètre ou texte de loi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '12px',
                width: '240px',
              }}
            />
          </div>

          {/* Table des Paramètres Bitemporels */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Clé Paramétrique</th>
                  <th style={{ padding: '10px 12px' }}>Libellé Français</th>
                  <th style={{ padding: '10px 12px' }}>Valeur</th>
                  <th style={{ padding: '10px 12px' }}>Validité</th>
                  <th style={{ padding: '10px 12px' }}>Source JORADP</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isDraftPack = selectedPackDetail?.status === 'DRAFT';

                  return (
                    <tr key={item.code} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, fontFamily: 'monospace', color: '#818cf8', fontSize: '12px' }}>
                        {item.code}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--df-text-main)', maxWidth: '240px' }}>
                        {item.descriptionFr || item.payload.labelFr}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--df-text-main)', fontFamily: 'monospace' }}>
                        {item.payload.type === 'TRANCHE' ? (
                          <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Barème progressif ({item.payload.tranches?.length || 6} tranches)</span>
                        ) : item.payload.type === 'TAUX' ? (
                          `${(Number(item.payload.value) * 100).toFixed(1)}%`
                        ) : (
                          `${Number(item.payload.value).toLocaleString('fr-DZ')} ${item.payload.unit || ''}`
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '11px', color: 'var(--df-text-muted)' }}>
                        {item.validFrom} → {item.validTo || 'En vigueur'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '11px', color: 'var(--df-text-muted)', maxWidth: '180px' }}>
                        {item.legalRef}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isDraftPack ? (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'var(--df-bg-surface-2)',
                              border: '1px solid var(--df-border-subtle)',
                              color: 'var(--df-text-main)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Modifier
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Verrouillé</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Droite : Console de Simulation d'Impact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', borderRadius: '14px', border: '1px solid var(--df-border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <IconPlay size={16} />
              </div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Simulation d'Impact Fiscal
              </h2>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--df-text-muted)' }}>
              Évaluez les effets de ce pack sur un cas type d'entreprise avant de le promulguer.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Cas Type Étalon
              </label>
              <select
                value={simCase}
                onChange={(e) => setSimCase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  fontSize: '13px',
                }}
              >
                <option value="ARTISAN_IFU_5M">👨‍🔧 Artisan IFU (CA 5 000 000 DA)</option>
                <option value="SARL_BTPH_50M">🏗️ SARL BTPH & Location (CA 50 000 000 DA)</option>
                <option value="TRANSPORTEUR_GRAND_SUD">🚚 Transporteur Grand Sud (Barèmes Sahariens)</option>
                <option value="STARTUP_INNOVATION">🚀 Startup Innovante (Exonération 4+2 ans & R&D)</option>
              </select>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: '#4f46e5',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSimulating ? 'Calcul en cours...' : 'Exécuter la Simulation'}
            </button>

            {simResult && (
              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: 'var(--df-bg-surface-2)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
                  Résultat : {simResult.caseType} ({simResult.fiscalYear})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-main)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {simResult.summaryFr}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(simResult.metrics).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--df-text-muted)' }}>{key}:</span>
                      <span style={{ fontWeight: 700, color: 'var(--df-text-main)', fontFamily: 'monospace' }}>
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'Édition de Paramètre */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', borderRadius: '16px', border: '1px solid var(--df-border-subtle)', maxWidth: '540px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Modifier le Paramètre Bitemporel
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}><IconX size={16} /></button>
            </div>

            <form onSubmit={handleSaveParam}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Clé Paramétrique</label>
                <input type="text" disabled value={editingItem.code} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: '#818cf8', fontFamily: 'monospace', fontSize: '12px' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Nouvelle Valeur ({editingItem.payload.unit || ''})</label>
                <input type="text" required value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Référence Légale Obligatoire (Art. CIDTA / LF)</label>
                <input type="text" required value={editLegalRef} onChange={(e) => setEditLegalRef(e.target.value)} placeholder="Ex: Art. 282 quater CIDTA, LF 2026" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Date d'Effet (applicableFrom)</label>
                  <input type="date" required value={editFrom} onChange={(e) => setEditFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Date de Fin (applicableTo)</label>
                  <input type="date" value={editTo} onChange={(e) => setEditTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingItem(null)} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isUpdatingParam} style={{ padding: '8px 14px', borderRadius: '6px', background: '#4f46e5', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Clonage de Pack */}
      {isCloneModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', borderRadius: '16px', border: '1px solid var(--df-border-subtle)', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Cloner un Nouvel Exercice Réglementaire
              </h3>
              <button onClick={() => setIsCloneModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}><IconX size={16} /></button>
            </div>

            <form onSubmit={handleClonePack}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Code Unique du Nouveau Pack</label>
                <input type="text" required value={cloneNewId} onChange={(e) => setCloneNewId(e.target.value)} placeholder="Ex: DZ_LF_2027_DRAFT" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Numéro de Version</label>
                <input type="text" required value={cloneNewVersion} onChange={(e) => setCloneNewVersion(e.target.value)} placeholder="Ex: 2027.1.0-draft" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Description du Pack</label>
                <input type="text" required value={cloneDesc} onChange={(e) => setCloneDesc(e.target.value)} placeholder="Ex: Pack de travail pour la Loi de Finances 2027" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsCloneModalOpen(false)} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isCloning} style={{ padding: '8px 14px', borderRadius: '6px', background: '#4f46e5', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Créer le Brouillon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Publication avec Signature Ed25519 */}
      {isPublishModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', borderRadius: '16px', border: '1px solid var(--df-border-subtle)', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Signature Cryptographique Ed25519 & Publication
              </h3>
              <button onClick={() => setIsPublishModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}><IconX size={16} /></button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--df-text-muted)' }}>
              La publication scellera les barèmes avec une empreinte SHA-256 et les rendra immédiatement opposables pour le calcul des impôts et cotisations.
            </p>

            <form onSubmit={handlePublish}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Expert / Organisme Certificateur</label>
                <input type="text" required value={publishExpert} onChange={(e) => setPublishExpert(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Email du Second Approbateur (Maker-Checker)</label>
                <input type="email" required value={publishApprover} onChange={(e) => setPublishApprover(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsPublishModalOpen(false)} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isPublishing} style={{ padding: '8px 16px', borderRadius: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {isPublishing ? 'Signature en cours...' : 'Signer & Rendre Actif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
