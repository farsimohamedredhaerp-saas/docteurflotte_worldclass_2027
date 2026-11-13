'use client';

import React, { useState } from 'react';
import { ErpExportFormat, ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';

export interface TechnicalDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  vatRate?: number;
  dossier: {
    dossierReference: string;
    vehiclePlate: string;
    vehicleBrandModel: string;
    driverPseudonym: string;
    incidentTimestamp: string;
    wilayaName: string;
    wilayaCode: number;
    roadGradePercent: number;
    apparentSlopeDropLiters: number;
    netSiphonedVolumeLiters: number;
    fuelUnitPriceDzd: number;
    financialPrejudiceDzd: number;
    integritySha256: string;
    htmlContent: string;
  };
}

export function TechnicalDossierModal({ isOpen, onClose, dossier, vatRate }: TechnicalDossierModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ErpExportFormat>(ErpExportFormat.PC_COMPTA_CSV);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveVatRate = vatRate ?? ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE;
  const vatAmount = dossier.financialPrejudiceDzd * effectiveVatRate;
  const totalAmountWithVat = dossier.financialPrejudiceDzd + vatAmount;
  const vatPercentLabel = Math.round(effectiveVatRate * 100);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(dossier.htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleExportErp = (format: ErpExportFormat) => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    const dateStr = dossier.incidentTimestamp.substring(0, 10).replace(/-/g, '');

    switch (format) {
      case ErpExportFormat.PC_COMPTA_CSV: {
        filename = `PC_COMPTA_${dossier.dossierReference}_${dateStr}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        const headers = ['Date', 'Journal', 'Compte', 'Libelle', 'Debit_DZD', 'Credit_DZD', 'Piece_Ref', 'Matricule_Vehicule'];
        const rows = [
          [dateStr, 'ACH', '615200', `Carburant Manquant ${dossier.vehiclePlate}`, dossier.financialPrejudiceDzd.toFixed(2), '0.00', dossier.dossierReference, dossier.vehiclePlate].join(';'),
          [dateStr, 'ACH', '445660', `TVA ${vatPercentLabel}% ${dossier.dossierReference}`, vatAmount.toFixed(2), '0.00', dossier.dossierReference, dossier.vehiclePlate].join(';'),
          [dateStr, 'ACH', '401100', `Constat Litrage ${dossier.dossierReference}`, '0.00', totalAmountWithVat.toFixed(2), dossier.dossierReference, dossier.vehiclePlate].join(';'),
        ];
        content = `${headers.join(';')}\r\n${rows.join('\r\n')}`;
        break;
      }
      case ErpExportFormat.SAGE_CSV: {
        filename = `SAGE_${dossier.dossierReference}_${dateStr}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        const rows = [
          ['HA', dateStr, '615000', dossier.dossierReference, `PERTE CARB ${dossier.vehiclePlate}`, dossier.financialPrejudiceDzd.toFixed(2), '0.00'].join(';'),
          ['HA', dateStr, '401000', dossier.dossierReference, `DOSSIER TECHNIQUE ${dossier.dossierReference}`, '0.00', dossier.financialPrejudiceDzd.toFixed(2)].join(';'),
        ];
        content = rows.join('\r\n');
        break;
      }
      case ErpExportFormat.ODOO_JSON: {
        filename = `ODOO_${dossier.dossierReference}_${dateStr}.json`;
        mimeType = 'application/json';
        content = JSON.stringify(
          {
            model: 'fleet.vehicle.log.services',
            values: {
              vehicle_license_plate: dossier.vehiclePlate,
              date: dossier.incidentTimestamp.substring(0, 10),
              description: `Dossier Technique Carburant: ${dossier.dossierReference}`,
              amount: dossier.financialPrejudiceDzd,
              total_amount_dzd: Math.round(totalAmountWithVat * 100) / 100,
              notes: `Empreinte SHA-256: ${dossier.integritySha256}`,
            },
          },
          null,
          2,
        );
        break;
      }
      case ErpExportFormat.SAP_REST_JSON:
      default: {
        filename = `SAP_PM_${dossier.dossierReference}_${dateStr}.json`;
        mimeType = 'application/json';
        content = JSON.stringify(
          {
            d: {
              MaintenanceOrder: dossier.dossierReference,
              TechnicalObject: dossier.vehiclePlate,
              TotalEstimatedCostDZD: dossier.financialPrejudiceDzd,
              Currency: 'DZD',
              SecurityHash: dossier.integritySha256,
            },
          },
          null,
          2,
        );
        break;
      }
    }

    // Déclenchement du téléchargement navigateur
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Export ${format} téléchargé avec succès (${filename})`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A', fontWeight: 600 }}>
              Dossier d'Expertise Technique & Traçabilité Carburant
            </h3>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Réf : {dossier.dossierReference} · Immatriculation : {dossier.vehiclePlate}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        {/* Corps du dossier */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Synthèse Métier & Préjudice */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>PERTE NETTE CONFIRMÉE</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#B91C1C' }}>
                {dossier.netSiphonedVolumeLiters} Litres
              </div>
              <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '2px' }}>
                (Dévers compensé: {dossier.apparentSlopeDropLiters} L)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>PRÉJUDICE FINANCIER EN DINARS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#B91C1C' }}>
                {dossier.financialPrejudiceDzd.toLocaleString('fr-DZ')} DZD
              </div>
              <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '2px' }}>
                Barème officiel: {dossier.fuelUnitPriceDzd.toFixed(2)} DZD/L
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>LOCALISATION & PENTE</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                {dossier.wilayaName} ({dossier.wilayaCode})
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>Pente Valhalla: {dossier.roadGradePercent}%</div>
            </div>
          </div>

          {/* Empreinte SHA-256 */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              fontFamily: 'monospace',
              fontSize: '11px',
              wordBreak: 'break-all',
            }}
          >
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              EMPREINTE D'INTÉGRITÉ NUMÉRIQUE DU DOSSIER (SHA-256) :
            </div>
            <div style={{ color: '#0369A1' }}>{dossier.integritySha256}</div>
          </div>

          {/* Message de confirmation de téléchargement */}
          {downloadSuccess && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {downloadSuccess}
            </div>
          )}

          {/* Passerelle d export ERP 1-Clic */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0F172A' }}>
              Export Direct vers ERP & Comptabilité Algérienne :
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => handleExportErp(ErpExportFormat.PC_COMPTA_CSV)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exporter PC Compta (CSV SCF)
              </button>

              <button
                onClick={() => handleExportErp(ErpExportFormat.SAGE_CSV)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exporter Sage 100 (CSV)
              </button>

              <button
                onClick={() => handleExportErp(ErpExportFormat.ODOO_JSON)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exporter Odoo Fleet (JSON)
              </button>

              <button
                onClick={() => handleExportErp(ErpExportFormat.SAP_REST_JSON)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#475569',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exporter SAP PM (JSON)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F8FAFC',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Conforme Loi 18-07 ANPDP & Barème Naftal DGI
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Imprimer le Dossier (PDF)
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
