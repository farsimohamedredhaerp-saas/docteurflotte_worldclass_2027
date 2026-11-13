import React, { useState } from 'react';
import {
  FilePlus2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  BusinessEventType,
  AccountRole,
  EngineDecimal,
  EngineMath,
} from '@docteurflotte/decision-engine';
import { EconomicActivityDraft, ClientLedgerLine } from '../../types/client';

interface ActivityEntryTabProps {
  onAddEventToLedger: (event: EconomicActivityDraft) => void;
  lastLedgerLine?: ClientLedgerLine;
}

export const ActivityEntryTab: React.FC<ActivityEntryTabProps> = ({
  onAddEventToLedger,
}) => {
  const [eventType, setEventType] = useState<BusinessEventType>(BusinessEventType.SALE_INVOICED);
  const [date, setDate] = useState('2026-10-25');
  const [documentRef, setDocumentRef] = useState('FAC-VTE-2026-0089');
  const [thirdPartyName, setThirdPartyName] = useState('SARL LOGISTIQUE CENTRE BLIDA');
  const [thirdPartyNif, setThirdPartyNif] = useState('000909012345678');
  const [amountHt, setAmountHt] = useState('450000.00');
  const [vatRatePercent, setVatRatePercent] = useState('19');
  const [paymentChannel, setPaymentChannel] = useState<'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'TERM'>('BANK_TRANSFER');
  const [sector, setSector] = useState<'NEGOCE' | 'INDUSTRIE' | 'SERVICES' | 'BTPH'>('SERVICES');
  const [description, setDescription] = useState('Transport routier de fret Alger - Oran');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Calculs temps réel
  const parsedAmountHt = EngineMath.asAmount(amountHt || '0');
  const rateRatio = new EngineDecimal(vatRatePercent || '0').div(100);
  const vatAmount = EngineMath.asAmount(parsedAmountHt.times(rateRatio));
  const amountTtc = EngineMath.asAmount(parsedAmountHt.plus(vatAmount));

  // Contrôles préventifs immédiats
  const isCash = paymentChannel === 'CASH';
  const cashCeilingIbs = 300000;
  const cashCeilingVat = 100000;
  const exceedsIbsCash = isCash && amountTtc.toNumber() > cashCeilingIbs;
  const exceedsVatCash = isCash && amountTtc.toNumber() > cashCeilingVat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const draft: EconomicActivityDraft = {
      eventType,
      date,
      documentRef,
      thirdPartyName,
      thirdPartyNif: thirdPartyNif || undefined,
      amountHt,
      vatRatePercent,
      paymentChannel,
      sector,
      description,
    };
    onAddEventToLedger(draft);
    setSubmittedMessage(`Événement ${documentRef} comptabilisé et scellé au Grand Livre avec succès !`);
    setTimeout(() => setSubmittedMessage(null), 4000);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
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
            <FilePlus2 size={20} style={{ color: '#10b981' }} />
            Saisie d Activité & Événements Économiques (Data Plane)
          </h3>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Chaque opération est pré-validée par le pack réglementaire actif avant génération des écritures équilibrées Débit = Crédit et scellement SHA-256.
          </p>
        </div>

        {submittedMessage && (
          <div
            style={{
              backgroundColor: 'rgba(6, 78, 59, 0.4)',
              border: '1px solid #059669',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={16} />
            {submittedMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Type d'événement */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Type d Événement Économique
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as BusinessEventType)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <option value={BusinessEventType.SALE_INVOICED}>Facture de Vente Client</option>
                <option value={BusinessEventType.PURCHASE_INVOICED}>Facture d Achat Fournisseur</option>
                <option value={BusinessEventType.SALE_COLLECTED}>Encaissement Client (Règlement)</option>
                <option value={BusinessEventType.PURCHASE_PAID}>Décaissement Fournisseur (Paiement)</option>
                <option value={BusinessEventType.STOCK_RECEIPT}>Réception de Stock (CUMP)</option>
                <option value={BusinessEventType.ASSET_ACQUIRED}>Acquisition d Immobilisation</option>
                <option value={BusinessEventType.SITUATION_ISSUED}>Situation de Travaux BTPH</option>
              </select>
            </div>

            {/* Date comptable */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Date de la Pièce (Fuseau Africa/Algiers)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Référence document */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                N° de Pièce Justificative (Réf. Facture / Quittance)
              </label>
              <input
                type="text"
                value={documentRef}
                onChange={(e) => setDocumentRef(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
                required
              />
            </div>

            {/* Secteur d'activité */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Branche / Secteur d Activité
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="SERVICES">Services / Transport</option>
                <option value="NEGOCE">Négoce / Distribution</option>
                <option value="INDUSTRIE">Production & Industrie</option>
                <option value="BTPH">BTPH / Travaux Publics</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Tiers */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Raison Sociale du Tiers (Client ou Fournisseur)
              </label>
              <input
                type="text"
                value={thirdPartyName}
                onChange={(e) => setThirdPartyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
                required
              />
            </div>

            {/* NIF du tiers */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                NIF du Tiers (15 ou 20 chiffres)
              </label>
              <input
                type="text"
                value={thirdPartyNif}
                onChange={(e) => setThirdPartyNif(e.target.value)}
                placeholder="000909012345678"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Canal de règlement */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Mode / Canal de Paiement
              </label>
              <select
                value={paymentChannel}
                onChange={(e) => setPaymentChannel(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="BANK_TRANSFER">Virement Bancaire (Compte BNA/BEA)</option>
                <option value="CHECK">Chèque Bancaire</option>
                <option value="CASH">Espèces (Caisse)</option>
                <option value="TERM">À Terme (Crédit d exploitation)</option>
              </select>
            </div>

            {/* Taux de TVA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Taux de TVA Applicable
              </label>
              <select
                value={vatRatePercent}
                onChange={(e) => setVatRatePercent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="19">19.00 % (Taux normal)</option>
                <option value="9">9.00 % (Taux réduit)</option>
                <option value="0">0.00 % (Exonéré / Hors champ)</option>
              </select>
            </div>
          </div>

          {/* Montant HT & Calculs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Montant Hors Taxes (HT) en DZD
              </label>
              <input
                type="number"
                step="0.01"
                value={amountHt}
                onChange={(e) => setAmountHt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: '#050b14',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
                className="font-mono"
                required
              />
            </div>

            <div
              style={{
                backgroundColor: '#050b14',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Montant TVA Calculé ({vatRatePercent}%)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }} className="font-mono">
                {vatAmount.toFixed(2)} DZD
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#050b14',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Montant Total TTC en DZD</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }} className="font-mono">
                {amountTtc.toFixed(2)} DZD
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              Libellé de l Écriture Comptable
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem',
                backgroundColor: '#050b14',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
              required
            />
          </div>

          {/* Alertes de pré-validation en temps réel */}
          {exceedsIbsCash && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.82rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>
                <strong>Alerte Plafond Espèces (Art. 169 CIDTA) :</strong> Le règlement en espèces dépasse 300 000 DA (TTC : {amountTtc.toFixed(2)} DA). La fraction excédentaire ne sera pas déductible fiscalement de l IBS.
              </span>
            </div>
          )}

          {exceedsVatCash && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.82rem',
                color: '#fcd34d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>
                <strong>Alerte Plafond Déductibilité TVA (Art. 30 CTCA) :</strong> Les règlements d achats en espèces supérieurs à 100 000 DA ouvrent un risque de rejet de déduction de la TVA.
              </span>
            </div>
          )}

          {/* Schéma de posting généré en prévisualisation */}
          <div
            style={{
              backgroundColor: '#050b14',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              Prévisualisation des Écritures Équilibrées (Débit = Crédit)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>Débit :</strong> {paymentChannel === 'CASH' ? 'Caisse (530)' : paymentChannel === 'BANK_TRANSFER' ? 'Banque (512)' : 'Client (411)'} [{AccountRole.CLIENT}]
                </span>
                <span className="font-mono">{amountTtc.toFixed(2)} DZD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>Crédit :</strong> Prestations de services transport (706) [{AccountRole.REVENUE_SERVICES}]
                </span>
                <span className="font-mono">{parsedAmountHt.toFixed(2)} DZD</span>
              </div>
              {vatAmount.gt(0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <strong>Crédit :</strong> TVA collectée à {vatRatePercent}% (4457) [{AccountRole.VAT_COLLECTED}]
                  </span>
                  <span className="font-mono">{vatAmount.toFixed(2)} DZD</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              style={{
                backgroundColor: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Comptabiliser & Sceller dans le Grand Livre SHA-256</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
