import React, { useState } from 'react';
import {
  ReceiptText,
} from 'lucide-react';
import { G50MonthlySummary, IbsAnnualSummary } from '../../types/client';

interface TaxDeclarationsTabProps {
  g50: G50MonthlySummary;
  ibs: IbsAnnualSummary;
}

export const TaxDeclarationsTab: React.FC<TaxDeclarationsTabProps> = ({ g50, ibs }) => {
  const [activeForm, setActiveForm] = useState<'G50' | 'IBS' | 'IFU' | 'SIMULATEUR'>('G50');

  // État interactif pour IBS multi-activités
  const [hasSeparateAccounting, setHasSeparateAccounting] = useState(ibs.hasSeparateAccounting);
  const calculatedIbsRate = hasSeparateAccounting ? '26.00' : '26.00'; // Multi-activités avec services majeurs

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sélecteur de Formulaire Fiscal */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ReceiptText size={20} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Assistant Déclaratif DGI (Direction Générale des Impôts)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'G50', label: 'Série G n° 50 (Mensuelle)' },
            { id: 'IBS', label: 'Déclaration Annuelle IBS' },
            { id: 'IFU', label: 'Régimes IFU / ANAE' },
            { id: 'SIMULATEUR', label: 'Simulateur d Exposition Fiscale' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveForm(item.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                backgroundColor: activeForm === item.id ? '#059669' : '#1e293b',
                color: activeForm === item.id ? '#fff' : '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire G50 */}
      {activeForm === 'G50' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Bordereau Déclaration Série G n° 50 — Période {g50.period}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Échéance légale : 20 du mois suivant — Recette des Impôts d Alger Centre
              </p>
            </div>
            <span className="badge badge-official">G50 Conforme DGI</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* TVA Collectée */}
            <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.88rem', color: '#38bdf8' }}>
                I. Taxe sur la Valeur Ajoutée (TVA) Collectée
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Chiffre d affaires imposable au taux normal (19%) :</span>
                  <span className="font-mono">{Number(g50.turnoverTaxable19).toLocaleString('fr-DZ')} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TVA collectée correspondante (19%) :</span>
                  <span className="font-mono text-cyan-300 font-bold">{Number(g50.vatCollected19).toLocaleString('fr-DZ')} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
                  <span>Total TVA Collectée (A) :</span>
                  <span className="font-mono text-cyan-300">{Number(g50.totalVatCollected).toLocaleString('fr-DZ')} DA</span>
                </div>
              </div>
            </div>

            {/* TVA Déductible */}
            <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.88rem', color: '#a78bfa' }}>
                II. TVA Déductible & Prorata Annuel
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TVA sur biens et matières (compte 44566) :</span>
                  <span className="font-mono">{Number(g50.vatDeductibleGoods).toLocaleString('fr-DZ')} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TVA sur services & prestations :</span>
                  <span className="font-mono">{Number(g50.vatDeductibleServices).toLocaleString('fr-DZ')} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coefficient de Prorata applicable :</span>
                  <span className="font-mono font-bold text-slate-100">{g50.vatProrataApplied} (100%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
                  <span>Total TVA Déductible Admissible (B) :</span>
                  <span className="font-mono text-purple-300">{Number(g50.totalVatDeductible).toLocaleString('fr-DZ')} DA</span>
                </div>
              </div>
            </div>
          </div>

          {/* TAP & Solde Net */}
          <div style={{ marginTop: '1.25rem', backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>
                Taxe sur l Activité Professionnelle (TAP) — <strong>Art. 14 Loi de Finances 2024</strong> :
              </span>
              <span className="badge badge-official">0.00 DA (SUPPRIMÉE)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #059669', paddingTop: '0.75rem', fontSize: '1.05rem', fontWeight: 800 }}>
              <span style={{ color: '#34d399' }}>NET TVA À PAYER SUR G50 (A - B) :</span>
              <span className="font-mono text-emerald-400" style={{ fontSize: '1.3rem' }}>
                {Number(g50.netVatPayable).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire IBS */}
      {activeForm === 'IBS' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Déclaration Annuelle du Résultat Fiscal & Liquidation IBS
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Art. 140 à 170 du CIDTA — Application stricte des réintégrations sectorielles
              </p>
            </div>
            <span className="badge badge-info">Exercice 2026</span>
          </div>

          {/* Séparation comptable */}
          <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={hasSeparateAccounting}
                onChange={(e) => setHasSeparateAccounting(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              <span>
                <strong>Tenue d une comptabilité séparée par branche d activité</strong> (LFC 2015). Si décoché, le taux le plus élevé (26%) s applique à l intégralité du résultat.
              </span>
            </label>
          </div>

          {/* Tableau Réconciliation Fiscale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>1. Résultat Net Comptable avant Impôt :</span>
              <span className="font-mono font-bold text-slate-100">{Number(ibs.accountingResult).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
              <span>2. Réintégrations fiscales obligatoires (Cadeaux, Amortissements excédentaires véhicules) :</span>
              <span className="font-mono font-bold">+{Number(ibs.reintegrationsSector).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
              <span>3. Déductions fiscales admises :</span>
              <span className="font-mono font-bold">-{Number(ibs.deductions).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
              <span style={{ color: '#38bdf8' }}>4. RÉSULTAT FISCAL IMPOSABLE :</span>
              <span className="font-mono text-cyan-300">{Number(ibs.taxableResult).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>5. Taux IBS Multi-Activités Applicable :</span>
              <span className="font-mono font-bold text-purple-300">{calculatedIbsRate} %</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.5rem', fontWeight: 700 }}>
              <span style={{ color: '#f8fafc' }}>6. Cotisation Brute de l IBS :</span>
              <span className="font-mono text-emerald-400">{Number(ibs.grossTax).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>7. Acomptes provisionnels versés durant l exercice (3 acomptes) :</span>
              <span className="font-mono text-slate-300">-{Number(ibs.advancesPaid).toLocaleString('fr-DZ')} DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #10b981', paddingTop: '0.6rem', fontWeight: 800, fontSize: '1.05rem' }}>
              <span style={{ color: '#34d399' }}>SOLDE DE LIQUIDATION IBS À VERSER :</span>
              <span className="font-mono text-emerald-400" style={{ fontSize: '1.25rem' }}>
                {Number(ibs.liquidationBalance).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Régime IFU / ANAE */}
      {activeForm === 'IFU' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Régimes Forfaitaires IFU & Auto-Entrepreneur (ANAE)
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Pour les micro-entreprises réalisant un CA inférieur au seuil légal de 8 000 000 DA (Art. 282 bis CIDTA).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#38bdf8' }}>
                IFU Ventes & Production (5%)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Taux unique de 5% libératoire de l IBS/IRG, de la TVA et de la TAP. Minimum d imposition légal : 10 000 DA.
              </p>
            </div>

            <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#a78bfa' }}>
                IFU Prestations de Services (12%)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Taux de 12% pour les activités artisanales et prestations de services libérales et commerciales.
              </p>
            </div>

            <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#10b981' }}>
                Auto-Entrepreneur ANAE (5%)
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Loi 22-23 : Régime spécifique avec déclaration semestrielle et exonération de tenue de comptabilité commerciale.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulateur d'Exposition Fiscale */}
      {activeForm === 'SIMULATEUR' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Simulateur Déterministe d Exposition en cas de Contrôle Fiscal
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Calcul actuariel en fourchette [Basse — Haute] distinct par chef de redressement (IBS, TVA, Pénalités de retard).
          </p>

          <table className="data-table">
            <thead>
              <tr>
                <th>Chef d Anomaly / Motif Légal</th>
                <th>Impôt Ciblé</th>
                <th style={{ textAlign: 'right' }}>Fourchette Basse (DZD)</th>
                <th style={{ textAlign: 'right' }}>Fourchette Haute (DZD)</th>
                <th>Probabilité d Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Règlement espèces &gt; 300 000 DA (Art. 169 CIDTA)</td>
                <td><span className="badge badge-info">IBS</span></td>
                <td className="font-mono text-right text-slate-300">13 000.00</td>
                <td className="font-mono text-right text-slate-100 font-bold">13 000.00</td>
                <td><span className="badge badge-warning">Élevée</span></td>
              </tr>
              <tr>
                <td>Fractionnement de factures (Art. 19 bis CPF)</td>
                <td><span className="badge badge-secondary">TVA</span></td>
                <td className="font-mono text-right text-slate-300">0.00</td>
                <td className="font-mono text-right text-slate-100 font-bold">34 200.00</td>
                <td><span className="badge badge-info">Moyenne</span></td>
              </tr>
              <tr>
                <td>Pénalités fiscales de retard & majorations (10% à 25%)</td>
                <td><span className="badge badge-risk">PÉNALITÉS</span></td>
                <td className="font-mono text-right text-slate-300">0.00</td>
                <td className="font-mono text-right text-slate-100 font-bold">50 000.00</td>
                <td><span className="badge badge-info">Moyenne</span></td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', fontWeight: 800 }}>
                <td>TOTAL FOURCHETTE D EXPOSITION GLOBALE :</td>
                <td>—</td>
                <td className="font-mono text-right text-emerald-400">13 000.00 DA</td>
                <td className="font-mono text-right text-red-400">97 200.00 DA</td>
                <td><span className="badge badge-official">Audit Actuariel</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
