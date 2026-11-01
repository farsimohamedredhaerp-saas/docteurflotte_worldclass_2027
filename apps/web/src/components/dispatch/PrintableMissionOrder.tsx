'use client';

import React from 'react';
import { RegulatoryMissionOrderData } from '@docteurflotte/contracts';
import { MissionOrderQrCode } from './MissionOrderQrCode';

interface PrintableMissionOrderProps {
  order: RegulatoryMissionOrderData;
  onClose?: () => void;
}

export function PrintableMissionOrder({ order, onClose }: PrintableMissionOrderProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="printable-om-container">
      {/* Barre d'action d'écran (masquée à l'impression) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px 8px 0 0',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📜</span>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>
            Ordre de Mission Officiel #{order.orderNumber} (Code de la Route DZ)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <span>🖨️</span>
            <span>Imprimer / Exporter PDF (Format A4)</span>
          </button>
          {onClose && (
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
          )}
        </div>
      </div>

      {/* FEUILLE OFFICIELLE FORMAT A4 */}
      <div
        className="om-sheet"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '24px 32px',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          maxWidth: '850px',
          margin: '0 auto',
          border: '2px solid #0f172a',
        }}
      >
        {/* EN-TÊTE RÉPUBLIQUE ALGÉRIENNE */}
        <div style={{ textAlign: 'center', borderBottom: '2px double #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>
            الجمهورية الجزائرية الديمقراطية الشعبية
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px' }}>
            RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
            وزارة النقل — MINISTÈRE DES TRANSPORTS | Direction des Transports Terrestres
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
            En application du Décret Exécutif n° 04-415 et de la Loi n° 01-14 relative à l&apos;organisation, la sécurité et la police de la circulation routière.
          </div>

          <div
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 24px',
              border: '2px solid #0f172a',
              background: '#f8fafc',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              أمر بمهمة لنقل البضائع عبر الطرقات
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
              ORDRE DE MISSION DE TRANSPORT ROUTIER
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginTop: '2px' }}>
              N° OFFICIEL : {order.orderNumber}
            </div>
          </div>
        </div>

        {/* SECTION 1: ENTREPRISE & DATES */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '16px', marginBottom: '14px' }}>
          <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '4px', background: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
              1. Identité de l&apos;Entreprise / Transporteur (المؤسسة الناقلة)
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
              {order.companyInfo.legalName}
            </div>
            {order.companyInfo.tradeName && (
              <div style={{ fontSize: '11px', color: '#475569' }}>
                Enseigne : <strong>{order.companyInfo.tradeName}</strong>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10.5px', marginTop: '6px', color: '#334155' }}>
              <div>NIF : <strong>{order.companyInfo.nif}</strong></div>
              <div>NIS : <strong>{order.companyInfo.nis}</strong></div>
              <div>RC : <strong>{order.companyInfo.rcNumber}</strong></div>
              <div>AI : <strong>{order.companyInfo.aiNumber}</strong></div>
            </div>
            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '4px' }}>
              Siège Social : Wilaya de {order.companyInfo.headquartersWilayaName} ({order.companyInfo.headquartersWilayaCode})
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '4px', background: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
              Validité Réglementaire (الصلاحية)
            </div>
            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
              Date d&apos;émission : <strong>{new Date(order.issueDateIso).toLocaleString('fr-DZ')}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, marginBottom: '6px' }}>
              Valide jusqu&apos;au : {new Date(order.validUntilIso).toLocaleString('fr-DZ')}
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic', background: '#e2e8f0', padding: '4px 6px', borderRadius: '3px' }}>
              ⚠️ Durée maximale légale : 72h. Tout dépassement rend le transport non conforme.
            </div>
          </div>
        </div>

        {/* SECTION 2: VÉHICULE & CHAUFFEUR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
          {/* VÉHICULE */}
          <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
              2. Véhicule Affecté (المركبة المخصصة)
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
              <span>Matricule : {order.vehicle.registrationPlate}</span>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '3px' }}>ENACTA OK</span>
            </div>
            <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
              Marque & Modèle : <strong>{order.vehicle.makeModel}</strong>
            </div>
            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
              N° Châssis (VIN) : <code>{order.vehicle.chassisVin}</code>
            </div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>
              Catégorie : <strong>{order.vehicle.category}</strong>
            </div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>
              Contrôle ENACTA valide jusqu&apos;au : <strong>{order.vehicle.enactaExpiryDate}</strong>
            </div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>
              Assurance : <strong>{order.vehicle.insuranceCompany}</strong> (Police #{order.vehicle.insurancePolicyNumber})
            </div>
          </div>

          {/* CHAUFFEUR */}
          <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
              3. Conducteur Autorisé (السائق المرخص)
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              {order.driver.fullName}
            </div>
            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
              NIN (N° d&apos;Identité Nationale) : <strong>{order.driver.nationalIdNumber}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px' }}>
              Permis de Conduire Catégories : <strong>{order.driver.licenseCategory}</strong>
            </div>
            {order.driver.brevetProfessionnelNumber && (
              <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '3px' }}>
                Brevet Professionnel : <strong>{order.driver.brevetProfessionnelNumber}</strong>
              </div>
            )}
            {order.driver.adrHazmatCertificateNumber ? (
              <div style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 700, marginTop: '3px' }}>
                Certificat ADR Matières Dangereuses : #{order.driver.adrHazmatCertificateNumber}
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                Transport standard (Hors matières dangereuses ADR)
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: MISSION & ITINÉRAIRE */}
        <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', background: '#f8fafc' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            4. Itinéraire Autorisé & Nature de la Marchandise (المسار المعتمد و طبيعة البضاعة)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Point de Chargement (Départ) :</span>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
                {order.mission.originName}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                Wilaya N° {order.mission.originWilayaCode}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Point de Déchargement (Arrivée) :</span>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
                {order.mission.destinationName}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                Wilaya N° {order.mission.destinationWilayaCode}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Nature & Tonnage de la Cargaison :</span>
              <div style={{ fontWeight: 800, color: '#b45309', fontSize: '12px' }}>
                {order.mission.cargoNature}
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155' }}>
                Charge utile déclarée : <strong>{order.mission.cargoWeightTons} Tonnes</strong> | Distance : <strong>{order.mission.routeDistanceKm} km</strong>
              </div>
            </div>
          </div>

          {order.mission.transitWilayaCodes && order.mission.transitWilayaCodes.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
              Corridor de transit approuvé (Wilayas) : <strong>{order.mission.transitWilayaCodes.join(', ')}</strong>
            </div>
          )}
        </div>

        {/* SECTION 4: SOUVERAINETÉ CRYPTOGRAPHIQUE & SIGNATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 180px', gap: '16px', alignItems: 'center', borderTop: '2px solid #0f172a', paddingTop: '12px' }}>
          {/* QR CODE HORS-LIGNE */}
          <div style={{ textAlign: 'center' }}>
            <MissionOrderQrCode value={order.qrVerificationPayload} size={130} />
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              SCAN GENDARMERIE / DGSN
            </div>
            <div style={{ fontSize: '8px', color: '#64748b' }}>
              Vérification hors-ligne HMAC-256
            </div>
          </div>

          {/* MENTIONS LÉGALES & EMPREINTE */}
          <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              Souveraineté des Données & Contrôle Routier Numérique (Loi 18-07 ANPDP)
            </div>
            Le présent document électronique est signé de manière infalsifiable via clé cryptographique souveraine. 
            Il tient lieu d&apos;Ordre de Mission légal pour la conduite sur tout le réseau routier national des 58 Wilayas.
            <div style={{ fontFamily: 'monospace', fontSize: '8.5px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '3px', marginTop: '6px', color: '#0f172a', wordBreak: 'break-all' }}>
              JETON HMAC : {order.offlineSignatureToken}
            </div>
            <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#64748b' }}>
              Généré par la plateforme souveraine DocteurFlotte™ — Hébergement Local Algérie
            </div>
          </div>

          {/* CACHET & SIGNATURE */}
          <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              Cachet & Signature de l&apos;Établissement
            </div>
            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ border: '2px dashed #94a3b8', borderRadius: '50%', width: '65px', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#94a3b8', fontWeight: 700, transform: 'rotate(-10deg)' }}>
                VISA VALIDE
              </div>
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>
              Fait à Alger, le {new Date(order.issueDateIso).toLocaleDateString('fr-DZ')}
            </div>
          </div>
        </div>
      </div>

      {/* STYLES SPÉCIFIQUES POUR L'IMPRESSION A4 */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .printable-om-container {
            margin: 0 !important;
            padding: 0 !important;
          }
          .om-sheet {
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            max-width: 100% !important;
            padding: 18px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
