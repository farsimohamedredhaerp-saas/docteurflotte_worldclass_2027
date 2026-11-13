import React, { useState } from 'react';
import {
  FileSpreadsheet,
} from 'lucide-react';

export const ScfFinancialStatementsTab: React.FC = () => {
  const [subView, setSubView] = useState<'BALANCE' | 'BILAN' | 'TCR' | 'AMORTISSEMENTS' | 'CUMP'>('BALANCE');

  // Balance Générale Réaliste
  const accountsData = [
    { code: '101000', label: 'Capital social émis', debMouv: '0.00', credMouv: '5000000.00', soldeDeb: '0.00', soldeCred: '5000000.00' },
    { code: '218200', label: 'Matériel de transport (flotte poids lourds)', debMouv: '8500000.00', credMouv: '0.00', soldeDeb: '8500000.00', soldeCred: '0.00' },
    { code: '281820', label: 'Amortissements matériel de transport', debMouv: '0.00', credMouv: '2125000.00', soldeDeb: '0.00', soldeCred: '2125000.00' },
    { code: '380000', label: 'Marchandises stockées', debMouv: '1200000.00', credMouv: '950000.00', soldeDeb: '250000.00', soldeCred: '0.00' },
    { code: '411100', label: 'Clients vente de biens et services', debMouv: '3450000.00', credMouv: '2260000.00', soldeDeb: '1190000.00', soldeCred: '0.00' },
    { code: '401100', label: 'Fournisseurs d exploitation', debMouv: '1800000.00', credMouv: '2395000.00', soldeDeb: '0.00', soldeCred: '595000.00' },
    { code: '445660', label: 'TVA déductible sur biens et services', debMouv: '285000.00', credMouv: '190000.00', soldeDeb: '95000.00', soldeCred: '0.00' },
    { code: '445710', label: 'TVA collectée à 19%', debMouv: '190000.00', credMouv: '380000.00', soldeDeb: '0.00', soldeCred: '190000.00' },
    { code: '512100', label: 'Banque BNA Compte Courant', debMouv: '4250000.00', credMouv: '2130000.00', soldeDeb: '2120000.00', soldeCred: '0.00' },
    { code: '530000', label: 'Caisse centrale Alger', debMouv: '350000.00', credMouv: '95000.00', soldeDeb: '255000.00', soldeCred: '0.00' },
    { code: '607000', label: 'Achats de marchandises vendues', debMouv: '950000.00', credMouv: '0.00', soldeDeb: '950000.00', soldeCred: '0.00' },
    { code: '681120', label: 'Dotations aux amortissements matériel', debMouv: '850000.00', credMouv: '0.00', soldeDeb: '850000.00', soldeCred: '0.00' },
    { code: '706000', label: 'Prestations de transport routier', debMouv: '0.00', credMouv: '6300000.00', soldeDeb: '0.00', soldeCred: '6300000.00' },
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sélecteur de Vue SCF */}
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
          <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Liasses & Clôtures Comptables (Système Comptable Financier SCF)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'BALANCE', label: 'Balance Générale' },
            { id: 'BILAN', label: 'Bilan Actif/Passif' },
            { id: 'TCR', label: 'Compte de Résultat (TCR)' },
            { id: 'AMORTISSEMENTS', label: 'Tableau Amortissements' },
            { id: 'CUMP', label: 'Stocks & CUMP Continu' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSubView(item.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                backgroundColor: subView === item.id ? '#059669' : '#1e293b',
                color: subView === item.id ? '#fff' : '#cbd5e1',
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

      {/* Contenu selon la sous-vue */}
      {subView === 'BALANCE' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
              Balance Générale des Comptes — Exercice 2026
            </span>
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
              ✓ Équilibre Parfait : Total Soldes Débiteurs = Total Soldes Créditeurs
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Compte</th>
                <th>Intitulé du Compte (Nomenclature SCF)</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Mouvements Débit</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Mouvements Crédit</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Solde Débiteur</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Solde Créditeur</th>
              </tr>
            </thead>
            <tbody>
              {accountsData.map((acc) => (
                <tr key={acc.code}>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{acc.code}</td>
                  <td style={{ color: '#f8fafc' }}>{acc.label}</td>
                  <td className="font-mono" style={{ textAlign: 'right', color: '#94a3b8' }}>{Number(acc.debMouv).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                  <td className="font-mono" style={{ textAlign: 'right', color: '#94a3b8' }}>{Number(acc.credMouv).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                  <td className="font-mono" style={{ textAlign: 'right', fontWeight: 600, color: Number(acc.soldeDeb) > 0 ? '#34d399' : '#64748b' }}>
                    {Number(acc.soldeDeb) > 0 ? Number(acc.soldeDeb).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td className="font-mono" style={{ textAlign: 'right', fontWeight: 600, color: Number(acc.soldeCred) > 0 ? '#a78bfa' : '#64748b' }}>
                    {Number(acc.soldeCred) > 0 ? Number(acc.soldeCred).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subView === 'BILAN' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Actif */}
          <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#38bdf8', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              ACTIF (DZD)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Actifs Non Courants (Immobilisations nettes)</span>
                <span className="font-mono font-bold text-slate-100">6 375 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Stocks et en-cours (CUMP)</span>
                <span className="font-mono font-bold text-slate-100">250 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Créances clients et comptes rattachés</span>
                <span className="font-mono font-bold text-slate-100">1 190 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Trésorerie et équivalents (Banque & Caisse)</span>
                <span className="font-mono font-bold text-slate-100">2 375 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #38bdf8', paddingTop: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
                <span style={{ color: '#38bdf8' }}>TOTAL ACTIF :</span>
                <span className="font-mono text-cyan-300">10 190 000.00 DA</span>
              </div>
            </div>
          </div>

          {/* Passif */}
          <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#a78bfa', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              PASSIF & CAPITAUX PROPRES (DZD)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Capital émis et réserves</span>
                <span className="font-mono font-bold text-slate-100">5 000 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Résultat net de l exercice (Bénéfice)</span>
                <span className="font-mono font-bold text-slate-100">4 405 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Dettes fournisseurs d exploitation</span>
                <span className="font-mono font-bold text-slate-100">595 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Dettes fiscales (TVA nette à payer)</span>
                <span className="font-mono font-bold text-slate-100">190 000.00 DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #a78bfa', paddingTop: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
                <span style={{ color: '#a78bfa' }}>TOTAL PASSIF :</span>
                <span className="font-mono text-purple-300">10 190 000.00 DA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {subView === 'AMORTISSEMENTS' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#f8fafc' }}>
            Plan d Amortissement Dégressif avec Bascule Linéaire Optimale
          </h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Actif : Tracteur Routier Shacman X3000 — Valeur d acquisition : 10 000 000 DA — Durée : 5 ans — Coefficient Dégressif fiscal : 2.0
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Année</th>
                <th>Base Amortissable (VNC début)</th>
                <th>Taux Dégressif (40%)</th>
                <th>Taux Linéaire Restant</th>
                <th>Mode Retenu</th>
                <th style={{ textAlign: 'right' }}>Dotation de l Exercice (DA)</th>
                <th style={{ textAlign: 'right' }}>VNC Fin d Exercice (DA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono">An 1 (2026)</td>
                <td className="font-mono">10 000 000.00</td>
                <td className="font-mono">40.0 %</td>
                <td className="font-mono">20.0 %</td>
                <td><span className="badge badge-info">Dégressif</span></td>
                <td className="font-mono text-right text-emerald-400">4 000 000.00</td>
                <td className="font-mono text-right">6 000 000.00</td>
              </tr>
              <tr>
                <td className="font-mono">An 2 (2027)</td>
                <td className="font-mono">6 000 000.00</td>
                <td className="font-mono">40.0 %</td>
                <td className="font-mono">25.0 %</td>
                <td><span className="badge badge-info">Dégressif</span></td>
                <td className="font-mono text-right text-emerald-400">2 400 000.00</td>
                <td className="font-mono text-right">3 600 000.00</td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <td className="font-mono">An 3 (2028)</td>
                <td className="font-mono">3 600 000.00</td>
                <td className="font-mono">40.0 %</td>
                <td className="font-mono text-emerald-400 font-bold">33.33 %</td>
                <td><span className="badge badge-info">Dégressif</span></td>
                <td className="font-mono text-right text-emerald-400">1 440 000.00</td>
                <td className="font-mono text-right">2 160 000.00</td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <td className="font-mono">An 4 (2029)</td>
                <td className="font-mono">2 160 000.00</td>
                <td className="font-mono">40.0 %</td>
                <td className="font-mono text-cyan-300 font-bold">50.0 %</td>
                <td><span className="badge badge-official">Bascule Linéaire</span></td>
                <td className="font-mono text-right text-cyan-300 font-bold">1 080 000.00</td>
                <td className="font-mono text-right">1 080 000.00</td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <td className="font-mono">An 5 (2030)</td>
                <td className="font-mono">1 080 000.00</td>
                <td className="font-mono">40.0 %</td>
                <td className="font-mono text-cyan-300 font-bold">100.0 %</td>
                <td><span className="badge badge-official">Linéaire Solde</span></td>
                <td className="font-mono text-right text-cyan-300 font-bold">1 080 000.00</td>
                <td className="font-mono text-right">0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {subView === 'CUMP' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#f8fafc' }}>
            Valorisation au Coût Unitaire Moyen Pondéré (CUMP) & Frais Tardifs
          </h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Règle de gestion SCF : à quantité nulle (stock vidé), la valeur résiduelle est impérativement de 0.00 DA sans dérive décimale.
          </p>
          <div style={{ backgroundColor: '#050b14', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Quantité restante en magasin :</span>
              <span className="font-mono text-cyan-300 font-bold">50 filtres à huile</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>CUMP Actuel :</span>
              <span className="font-mono text-emerald-400 font-bold">5 000.000000 DA / unité</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Valeur comptable totale du stock :</span>
              <span className="font-mono text-slate-100 font-bold">250 000.00 DA</span>
            </div>
          </div>
        </div>
      )}

      {subView === 'TCR' && (
        <div style={{ backgroundColor: '#0c1631', border: '1px solid #1e293b', borderRadius: '10px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#f8fafc' }}>
            Compte de Résultat (Tableau des Comptes de Résultat — TCR)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Production de l exercice (Prestations transport)</span>
              <span className="font-mono font-bold text-slate-100">6 300 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Consommation de l exercice (Matières, fournitures, CAMV)</span>
              <span className="font-mono font-bold text-slate-100">- 950 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
              <span style={{ color: '#38bdf8' }}>VALEUR AJOUTÉE D EXPLOITATION :</span>
              <span className="font-mono text-cyan-300">5 350 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Charges de personnel (Salaires & CNAS)</span>
              <span className="font-mono font-bold text-slate-100">- 1 200 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
              <span style={{ color: '#38bdf8' }}>EXCÉDENT BRUT D EXPLOITATION (EBE) :</span>
              <span className="font-mono text-cyan-300">4 150 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#cbd5e1' }}>Dotations aux amortissements & provisions</span>
              <span className="font-mono font-bold text-slate-100">- 850 000.00 DA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #10b981', paddingTop: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
              <span style={{ color: '#34d399' }}>RÉSULTAT NET COMPTABLE AVANT IMPÔT :</span>
              <span className="font-mono text-emerald-300">4 250 000.00 DA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
