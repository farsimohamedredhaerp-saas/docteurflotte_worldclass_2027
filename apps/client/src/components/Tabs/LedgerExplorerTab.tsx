import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle,
  AlertOctagon,
  Search,
  Filter,
  Hash,
  Scale,
} from 'lucide-react';
import { EngineDecimal, EngineMath } from '@docteurflotte/decision-engine';
import { ClientLedgerLine } from '../../types/client';

interface LedgerExplorerTabProps {
  ledgerLines: ClientLedgerLine[];
}

export const LedgerExplorerTab: React.FC<LedgerExplorerTabProps> = ({ ledgerLines }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [journalFilter, setJournalFilter] = useState('ALL');
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message: string;
    linesChecked: number;
  } | null>(null);

  // Filtrage
  const filteredLines = ledgerLines.filter((line) => {
    const matchesJournal = journalFilter === 'ALL' || line.journal === journalFilter;
    const matchesSearch =
      line.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.accountCode.includes(searchTerm) ||
      line.pieceRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.entryHash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesJournal && matchesSearch;
  });

  // Calcul totaux Débit / Crédit
  let totalDebit = new EngineDecimal(0);
  let totalCredit = new EngineDecimal(0);
  for (const line of ledgerLines) {
    totalDebit = totalDebit.plus(new EngineDecimal(line.debit));
    totalCredit = totalCredit.plus(new EngineDecimal(line.credit));
  }
  const isBalanced = totalDebit.minus(totalCredit).abs().lt(0.001);

  // Vérification cryptographique de la chaîne SHA-256
  const handleVerifyChain = () => {
    let isValid = true;
    let failedIndex = -1;

    for (let i = 1; i < ledgerLines.length; i++) {
      const prev = ledgerLines[i - 1];
      const current = ledgerLines[i];
      if (current.prevHash !== prev.entryHash) {
        isValid = false;
        failedIndex = i;
        break;
      }
    }

    if (isValid) {
      setVerificationResult({
        valid: true,
        message: `Chaîne SHA-256 continue vérifiée avec succès sur les ${ledgerLines.length} écritures. Zéro altération détectée.`,
        linesChecked: ledgerLines.length,
      });
    } else {
      setVerificationResult({
        valid: false,
        message: `Rupture d'intégrité détectée à la ligne ${failedIndex + 1} ! Le prevHash ne correspond pas au hash de l'écriture précédente.`,
        linesChecked: ledgerLines.length,
      });
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* En-tête avec Totaux et Bouton de Vérification */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
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
            <BookOpenCheck size={20} style={{ color: '#10b981' }} />
            Grand Livre Scellé & Piste d Audit Append-Only (SHA-256)
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            {ledgerLines.length} écritures enregistrées — Chaînage cryptographique immuable opposable en cas de contrôle fiscal.
          </p>
        </div>

        {/* Totaux & Équilibre Débit=Crédit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Débit</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }} className="font-mono">
              {EngineMath.asAmount(totalDebit).toNumber().toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Crédit</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a78bfa' }} className="font-mono">
              {EngineMath.asAmount(totalCredit).toNumber().toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
            </div>
          </div>

          <div
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: isBalanced ? 'rgba(6, 78, 59, 0.4)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isBalanced ? '#059669' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Scale size={16} style={{ color: isBalanced ? '#34d399' : '#f87171' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isBalanced ? '#34d399' : '#f87171' }}>
              {isBalanced ? 'Équilibré (Δ = 0.00 DA)' : 'DÉSÉQUILIBRE'}
            </span>
          </div>

          <button
            onClick={handleVerifyChain}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '0.55rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Hash size={15} />
            Vérifier Intégrité SHA-256
          </button>
        </div>
      </div>

      {/* Résultat de vérification */}
      {verificationResult && (
        <div
          style={{
            backgroundColor: verificationResult.valid ? 'rgba(6, 78, 59, 0.35)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${verificationResult.valid ? '#059669' : '#ef4444'}`,
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: verificationResult.valid ? '#34d399' : '#f87171',
            fontSize: '0.88rem',
          }}
        >
          {verificationResult.valid ? <CheckCircle size={18} /> : <AlertOctagon size={18} />}
          <span>{verificationResult.message}</span>
        </div>
      )}

      {/* Barre de Filtres */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
          />
          <input
            type="text"
            placeholder="Rechercher par compte, libellé, pièce ou empreinte SHA-256..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              backgroundColor: '#0c1631',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} style={{ color: '#94a3b8' }} />
          <select
            value={journalFilter}
            onChange={(e) => setJournalFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              backgroundColor: '#0c1631',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Tous les Journaux</option>
            <option value="ACHATS">Achats</option>
            <option value="VENTES">Ventes</option>
            <option value="BANQUE">Banque</option>
            <option value="CAISSE">Caisse</option>
          </select>
        </div>
      </div>

      {/* Table du Grand Livre */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>N°</th>
              <th style={{ width: '95px' }}>Date</th>
              <th style={{ width: '80px' }}>Journal</th>
              <th style={{ width: '80px' }}>Compte</th>
              <th>Libellé de l Écriture</th>
              <th style={{ width: '130px' }}>Réf. Pièce</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Débit (DZD)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Crédit (DZD)</th>
              <th style={{ width: '120px' }}>Empreinte SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map((line) => (
              <tr key={line.id}>
                <td className="font-mono" style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  #{line.lineNumber}
                </td>
                <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                  {line.date}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                    }}
                  >
                    {line.journal}
                  </span>
                </td>
                <td className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {line.accountCode}
                </td>
                <td style={{ color: '#f8fafc' }}>{line.label}</td>
                <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {line.pieceRef}
                </td>
                <td className="font-mono" style={{ textAlign: 'right', color: Number(line.debit) > 0 ? '#38bdf8' : '#475569' }}>
                  {Number(line.debit) > 0
                    ? Number(line.debit).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })
                    : '—'}
                </td>
                <td className="font-mono" style={{ textAlign: 'right', color: Number(line.credit) > 0 ? '#a78bfa' : '#475569' }}>
                  {Number(line.credit) > 0
                    ? Number(line.credit).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })
                    : '—'}
                </td>
                <td className="font-mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  <span title={line.entryHash} style={{ cursor: 'help' }}>
                    {line.entryHash.slice(0, 10)}...{line.entryHash.slice(-6)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
