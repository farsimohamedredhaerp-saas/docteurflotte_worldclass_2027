'use client';

import React from 'react';
import { IconFileText } from '../navigation/TechIcons';

export interface DgiInvoiceItem {
  description: string;
  oemReference?: string;
  quantity: number;
  unitPriceHtDzd: number;
  totalHtDzd: number;
}

export interface DgiInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentMode: 'VIREMENT_BANCAIRE' | 'CHEQUE' | 'ESPECES' | 'CIB_EDAHABIA';
  company: {
    legalName: string;
    tradeName?: string;
    address: string;
    wilayaName: string;
    wilayaCode: number;
    nif: string; // 15 chiffres
    nis: string;
    rcNumber: string;
    aiNumber: string;
    bankAccountRib?: string;
  };
  client: {
    legalName: string;
    address: string;
    wilayaName: string;
    nif: string;
    nis: string;
    rcNumber: string;
    aiNumber: string;
  };
  items: DgiInvoiceItem[];
  vatRatePercent: number; // 19%
  applyStampDuty: boolean; // Si espèces
  discountDzd?: number;
}

interface OfficialDgiInvoiceModalProps {
  data: DgiInvoiceData;
  onClose: () => void;
}

/**
 * Convertit un montant en toutes lettres en Dinars Algériens (DZD)
 */
function numberToFrenchWordsDzd(amount: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  const entier = Math.floor(amount);
  if (entier === 0) return 'zéro dinar algérien';

  const convertChunk = (n: number): string => {
    let res = '';
    if (n >= 100) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      if (c === 1) res += 'cent ';
      else res += units[c] + ' cent ';
      n = r;
    }
    if (n >= 20) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (d === 7 || d === 9) {
        res += tens[d - 1] + '-' + (u === 1 && d === 7 ? 'et-onze' : units[10 + u]) + ' ';
      } else {
        res += tens[d] + (u === 1 ? ' et un' : u > 0 ? '-' + units[u] : '') + ' ';
      }
    } else if (n > 0) {
      res += units[n] + ' ';
    }
    return res.trim();
  };

  let str = '';
  const millions = Math.floor(entier / 1000000);
  const thousands = Math.floor((entier % 1000000) / 1000);
  const remainder = entier % 1000;

  if (millions > 0) {
    str += convertChunk(millions) + (millions > 1 ? ' millions ' : ' million ');
  }
  if (thousands > 0) {
    str += (thousands === 1 ? 'mille ' : convertChunk(thousands) + ' mille ');
  }
  if (remainder > 0) {
    str += convertChunk(remainder);
  }

  return str.trim() + ' dinars algériens';
}

export function OfficialDgiInvoiceModal({ data, onClose }: OfficialDgiInvoiceModalProps) {
  // Calculs arithmétiques fiscaux déterministes DGI
  const totalHt = data.items.reduce((acc, item) => acc + item.totalHtDzd, 0);
  const discount = data.discountDzd || 0;
  const netHt = Math.max(0, totalHt - discount);
  const vatAmount = Math.round(netHt * (data.vatRatePercent / 100) * 100) / 100;
  const totalTtc = netHt + vatAmount;

  // Droit de timbre fiscal (1% espèces, min 10 DZD, max 10 000 DZD)
  let stampDuty = 0;
  if (data.applyStampDuty || data.paymentMode === 'ESPECES') {
    const rawStamp = Math.round(totalTtc * 0.01);
    stampDuty = Math.max(10, Math.min(10000, rawStamp));
  }

  const netToPay = totalTtc + stampDuty;
  const amountInWords = numberToFrenchWordsDzd(netToPay);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      {/* BARRE D'ACTIONS ÉCRAN (MASQUÉE À L'IMPRESSION) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '850px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconFileText size={18} className="text-emerald-400" />
          <span style={{ fontWeight: 800, fontSize: '15px' }}>
            Facture Fiscale Algérienne DGI #{data.invoiceNumber}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconFileText size={14} />
            <span>Imprimer / PDF Officiel (A4)</span>
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* FEUILLE OFFICIELLE FORMAT A4 */}
      <div
        className="invoice-sheet"
        style={{
          width: '100%',
          maxWidth: '850px',
          background: '#ffffff',
          color: '#0f172a',
          padding: '28px 36px',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          border: '1px solid #cbd5e1',
        }}
      >
        {/* EN-TÊTE ÉTABLISSEMENT & LOGO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {data.company.legalName}
            </div>
            {data.company.tradeName && (
              <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 700 }}>
                Enseigne : {data.company.tradeName}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', maxWidth: '380px', lineHeight: 1.5 }}>
              {data.company.address} — Wilaya de {data.company.wilayaName} ({data.company.wilayaCode})
            </div>
            {/* FISCALITÉ FOURNISSEUR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10.5px', color: '#334155', marginTop: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div>NIF : <strong>{data.company.nif}</strong></div>
              <div>NIS : <strong>{data.company.nis}</strong></div>
              <div>RC : <strong>{data.company.rcNumber}</strong></div>
              <div>AI : <strong>{data.company.aiNumber}</strong></div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', border: '2px solid #0f172a', padding: '6px 16px', background: '#f8fafc', borderRadius: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>FACTURE</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>N° {data.invoiceNumber}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
              Date d&apos;émission : <strong>{new Date(data.issueDate).toLocaleDateString('fr-DZ')}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              Date d&apos;échéance : <strong>{new Date(data.dueDate).toLocaleDateString('fr-DZ')}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
              Mode de règlement : {data.paymentMode}
            </div>
          </div>
        </div>

        {/* IDENTIFICATION DU CLIENT */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 16px', marginBottom: '18px', background: '#f8fafc' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px' }}>
            Client / Débiteur (المشتري)
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
            {data.client.legalName}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
            {data.client.address} — {data.client.wilayaName}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '10.5px', color: '#334155', marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
            <div>NIF : <strong>{data.client.nif}</strong></div>
            <div>NIS : <strong>{data.client.nis}</strong></div>
            <div>RC : <strong>{data.client.rcNumber}</strong></div>
            <div>AI : <strong>{data.client.aiNumber}</strong></div>
          </div>
        </div>

        {/* TABLEAU DES LIGNES DE FACTURE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '16px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 0' }}>Désignation des Prestations & Pièces Détachées</th>
              <th style={{ padding: '8px 10px' }}>Réf. OEM</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qté</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Prix Unit. HT (DZD)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Total HT (DZD)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{item.description}</td>
                <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'monospace' }}>{item.oemReference || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.unitPriceHtDzd.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{item.totalHtDzd.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAUX FISCAUX DGI & TIMBRE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '16px' }}>
          {/* ARRÊTÉ EN TOUTES LETTRES & COORDONNÉES BANCAIRES */}
          <div>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', background: '#f8fafc', marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                Arrêtée la présente facture à la somme de :
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                {amountInWords}
              </div>
            </div>

            {data.company.bankAccountRib && (
              <div style={{ fontSize: '10.5px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '4px' }}>
                Coordonnées Bancaires (RIB) : <code>{data.company.bankAccountRib}</code>
              </div>
            )}
          </div>

          {/* DÉCOMPTE FISCAL */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 14px', background: '#f8fafc', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Total Brut HT :</span>
              <strong style={{ color: '#0f172a' }}>{totalHt.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>
                <span>Remise Commerciale :</span>
                <strong>- {discount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Net HT Imposable :</span>
              <strong style={{ color: '#0f172a' }}>{netHt.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>TVA Algérienne ({data.vatRatePercent}%) :</span>
              <strong style={{ color: '#0f172a' }}>{vatAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#475569' }}>Total TTC :</span>
              <strong style={{ color: '#0f172a' }}>{totalTtc.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
            </div>

            {stampDuty > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0', color: '#d97706' }}>
                <span>Droit de Timbre DGI (Espèces 1%) :</span>
                <strong>+ {stampDuty.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0 0', fontSize: '13.5px', fontWeight: 900, color: '#059669' }}>
              <span>NET À PAYER :</span>
              <span>{netToPay.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD</span>
            </div>
          </div>
        </div>

        {/* VISA & SIGNATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px', borderTop: '2px solid #0f172a', paddingTop: '14px' }}>
          <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
              Visa & Bon pour Accord du Client
            </div>
            <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>Mention manuscrite « Lu et approuvé »</div>
          </div>

          <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
              Cachet & Signature de l&apos;Établissement
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>Fait à Alger, le {new Date(data.issueDate).toLocaleDateString('fr-DZ')}</div>
          </div>
        </div>

        {/* MENTION LÉGALE BAS DE PAGE */}
        <div style={{ textAlign: 'center', fontSize: '8.5px', color: '#94a3b8', marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
          Document certifié conforme aux dispositions du Code des Impôts Directs et Taxes Assimilées (CIDTA) et du Code du Timbre fiscal algérien.
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .invoice-sheet {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 20px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

