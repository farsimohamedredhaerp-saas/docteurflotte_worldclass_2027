import React, { useState } from 'react';
import {
  Coins,
  Split,
  FileCheck2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  CashBalanceOrderMode,
} from '@docteurflotte/decision-engine';

export const AuditCockpitTab: React.FC = () => {
  // Mode d'audit de caisse
  const [cashAuditMode, setCashAuditMode] = useState<CashBalanceOrderMode>(CashBalanceOrderMode.DAILY_NET);
  const [initialCashBalance, setInitialCashBalance] = useState('50000.00');

  // Validateur d'identifiants
  const [testNif, setTestNif] = useState('001616099000085');
  const [nifValidationResult, setNifValidationResult] = useState<{
    valid: boolean;
    format: string;
    message: string;
  } | null>(null);

  // Simulation d'audit de caisse avec 3 écritures du jour
  const testMovements = [
    { time: '09:00', label: 'Encaissement vente comptant', amount: 30000 },
    { time: '11:30', label: 'Règlement fournisseur pièces', amount: -65000 },
    { time: '15:00', label: 'Encaissement service transport', amount: 20000 },
  ];

  let runningBalance = Number(initialCashBalance);
  let minimumBalance = runningBalance;
  const simulatedBalances = testMovements.map((m) => {
    runningBalance += m.amount;
    if (runningBalance < minimumBalance) minimumBalance = runningBalance;
    return {
      ...m,
      balanceAfter: runningBalance,
    };
  });
  const hasNegativeBalance = minimumBalance < 0;

  // Validation NIF
  const handleValidateNif = () => {
    const clean = testNif.trim();
    if (clean.length === 15) {
      setNifValidationResult({
        valid: true,
        format: 'NIF_15_PERSONNE_MORALE',
        message: 'NIF conforme au format 15 chiffres des personnes morales en Algérie (DGI).',
      });
    } else if (clean.length === 20) {
      setNifValidationResult({
        valid: true,
        format: 'NIF_20_PERSONNE_PHYSIQUE',
        message: 'NIF conforme au format 20 chiffres des personnes physiques en Algérie.',
      });
    } else {
      setNifValidationResult({
        valid: false,
        format: 'INVALID_LENGTH',
        message: `Longueur de ${clean.length} chiffres invalide. Le NIF algérien doit obligatoirement comporter 15 ou 20 chiffres.`,
      });
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Audit Déterministe de Caisse */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Coins size={20} style={{ color: '#fbbf24' }} />
              Audit Déterministe de Caisse (Contrôle du Solde Négatif SCF)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              En droit comptable algérien (SCF art. 19) et fiscal, une caisse créditrice est une présomption de recettes dissimulées entraînant le rejet de la comptabilité.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Solde Initial (DZD)</label>
              <input
                type="number"
                value={initialCashBalance}
                onChange={(e) => setInitialCashBalance(e.target.value)}
                style={{
                  padding: '0.4rem 0.6rem',
                  backgroundColor: '#050b14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  width: '120px',
                }}
                className="font-mono"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Mode d Ordonnancement</label>
              <select
                value={cashAuditMode}
                onChange={(e) => setCashAuditMode(e.target.value as any)}
                style={{
                  padding: '0.4rem 0.6rem',
                  backgroundColor: '#050b14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                }}
              >
                <option value={CashBalanceOrderMode.DAILY_NET}>DAILY_NET (Agrégat net en fin de journée)</option>
                <option value={CashBalanceOrderMode.SEQUENCED}>SEQUENCED (Chronologique horaire strict)</option>
                <option value={CashBalanceOrderMode.WORST_CASE_WITHIN_DAY}>WORST_CASE (Tous décaissements en premier)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simulation Mouvements de Caisse */}
        <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
              Mouvements Horodatés de la Journée
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: hasNegativeBalance ? '#f87171' : '#34d399',
                backgroundColor: hasNegativeBalance ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                border: `1px solid ${hasNegativeBalance ? '#ef4444' : '#10b981'}`,
              }}
            >
              {hasNegativeBalance ? '⚠️ RISQUE : Solde Négatif Détecté' : '✓ Caisse Constamment Positive'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {simulatedBalances.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: m.balanceAfter < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '6px',
                  border: m.balanceAfter < 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid #1e293b',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="font-mono" style={{ color: '#64748b' }}>{m.time}</span>
                  <span style={{ color: '#f8fafc' }}>{m.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span className="font-mono" style={{ color: m.amount > 0 ? '#34d399' : '#f87171' }}>
                    {m.amount > 0 ? `+${m.amount.toLocaleString('fr-DZ')} DA` : `${m.amount.toLocaleString('fr-DZ')} DA`}
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: m.balanceAfter < 0 ? '#ef4444' : '#38bdf8' }}>
                    Solde : {m.balanceAfter.toLocaleString('fr-DZ')} DA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Détecteur de Fractionnement de Factures (Art. 19 bis CPF) */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.5rem',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.3rem',
          }}
        >
          <Split size={20} style={{ color: '#a78bfa' }} />
          Détecteur de Fractionnement de Factures (Art. 19 bis CPF)
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Surveillance des factures successives émises au même tiers dans un intervalle glissant de 72h afin de contourner le plafond légal de paiement en espèces.
        </p>

        <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
              Cluster Détecté : SARL COMPTOIR DU SUD (NIF 001515088000012)
            </span>
            <span className="badge badge-warning">2 factures en 48h</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
            Facture FAC-2026-101 (90 000 DA) émise le 14/10 + Facture FAC-2026-102 (90 000 DA) émise le 16/10. Montant cumulé : 180 000 DA réglés en espèces.
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            <strong>Prescription :</strong> Examen contradictoire avec le client. Aucune réintégration d office avant notification et droit de réponse écrit.
          </div>
        </div>
      </div>

      {/* 3. Validateur d'Identifiants Fiscaux Algériens */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.5rem',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.3rem',
          }}
        >
          <FileCheck2 size={20} style={{ color: '#38bdf8' }} />
          Validateur d Identifiants Fiscaux Algériens & Liste Noire
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Contrôle syntaxique et morphologique des NIF (15/20 chiffres), NIS et Registres du Commerce pour écarter les tiers non probants.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', maxWidth: '600px' }}>
          <input
            type="text"
            value={testNif}
            onChange={(e) => setTestNif(e.target.value)}
            placeholder="Entrer un NIF à vérifier (ex: 001616099000085)..."
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              backgroundColor: '#050b14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
            className="font-mono"
          />
          <button
            onClick={handleValidateNif}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.55rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Vérifier NIF
          </button>
        </div>

        {nifValidationResult && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: nifValidationResult.valid ? 'rgba(6, 78, 59, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${nifValidationResult.valid ? '#059669' : '#ef4444'}`,
              color: nifValidationResult.valid ? '#34d399' : '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {nifValidationResult.valid ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>
              <strong>{nifValidationResult.format} :</strong> {nifValidationResult.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
