import React, { useState } from 'react';
import {
  BarChart2,
  Calculator,
  UserCheck,
  Zap,
} from 'lucide-react';

export const StatisticalAuditTab: React.FC = () => {
  const [benfordScale, setBenfordScale] = useState<'FIRST_DIGIT' | 'FIRST_TWO_DIGITS' | 'SECOND_DIGIT'>('FIRST_DIGIT');

  // Distribution théorique de Benford pour le 1er chiffre (1 à 9)
  const theoreticalBenford1 = [
    { digit: '1', prob: 0.301, obs: 0.312 },
    { digit: '2', prob: 0.176, obs: 0.181 },
    { digit: '3', prob: 0.125, obs: 0.119 },
    { digit: '4', prob: 0.097, obs: 0.092 },
    { digit: '5', prob: 0.079, obs: 0.084 },
    { digit: '6', prob: 0.067, obs: 0.061 },
    { digit: '7', prob: 0.058, obs: 0.062 },
    { digit: '8', prob: 0.051, obs: 0.048 },
    { digit: '9', prob: 0.046, obs: 0.041 },
  ];

  // AUD-02 Reconstitution CAMV Négoce
  const stockInitial = 1200000;
  const achatsExercice = 4500000;
  const stockFinal = 1500000;
  const pertesJustifiees = 80000; // PV Huissier
  const pertesNonJustifiees = 150000;
  const coefMarge = 1.35;

  const camvAdmis = stockInitial + achatsExercice - stockFinal - pertesJustifiees;
  const caReconstitue = (camvAdmis + pertesNonJustifiees) * coefMarge;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Analyse de Benford Multivariée (AUD-06) */}
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
              <BarChart2 size={20} style={{ color: '#38bdf8' }} />
              Analyse Statistique de Benford Multivariée (AUD-06)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Test de conformité des distributions des montants de factures (N = 842 transactions, étendue sur 3.4 ordres de grandeur).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setBenfordScale('FIRST_DIGIT')}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: benfordScale === 'FIRST_DIGIT' ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              1er Chiffre (1-9)
            </button>
            <button
              onClick={() => setBenfordScale('SECOND_DIGIT')}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: benfordScale === 'SECOND_DIGIT' ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              2e Chiffre (0-9)
            </button>
          </div>
        </div>

        {/* Graphique Histogramme Benford */}
        <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#cbd5e1' }}>
              <strong>Indicateur MAD (Drake & Nigrini) :</strong> 0.0054 — <span style={{ color: '#34d399', fontWeight: 700 }}>CONFORMITÉ ÉTROITE</span>
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />
                Théorique (Benford)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
                Observé (Écritures)
              </span>
            </div>
          </div>

          {/* Barres */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '160px', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #334155' }}>
            {theoreticalBenford1.map((b) => (
              <div key={b.digit} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', height: '100%' }}>
                  {/* Barre Théorique */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      height: `${(b.prob / 0.35) * 100}%`,
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`Théorique: ${(b.prob * 100).toFixed(1)}%`}
                  />
                  {/* Barre Observée */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#10b981',
                      height: `${(b.obs / 0.35) * 100}%`,
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`Observé: ${(b.obs * 100).toFixed(1)}%`}
                  />
                </div>
                <span className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  {b.digit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Reconstitution de Chiffre d'Affaires (AUD-02) */}
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
          <Calculator size={20} style={{ color: '#a78bfa' }} />
          Reconstitution Déterministe de Chiffre d Affaires (Art. 43 CPF)
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Indice de cohérence matérielle entre les flux d intrants réels (achats, pertes justifiées) et le chiffre d affaires déclaré.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Négoce CAMV */}
          <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Négoce — Bilan Matière & CAMV Admis
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stock Initial :</span>
                <span className="font-mono text-slate-200">{stockInitial.toLocaleString('fr-DZ')} DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Achats nets d exercice :</span>
                <span className="font-mono text-slate-200">{achatsExercice.toLocaleString('fr-DZ')} DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pertes Justifiées (PV Huissier déduit) :</span>
                <span className="font-mono text-emerald-400">-{pertesJustifiees.toLocaleString('fr-DZ')} DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pertes Non Justifiées (réintégrées) :</span>
                <span className="font-mono text-amber-400">+{pertesNonJustifiees.toLocaleString('fr-DZ')} DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
                <span style={{ color: '#f8fafc' }}>CA Reconstitué (Marge 1.35) :</span>
                <span className="font-mono" style={{ color: '#38bdf8' }}>{caReconstitue.toLocaleString('fr-DZ')} DA</span>
              </div>
            </div>
          </div>

          {/* Industrie & Ratio Énergétique */}
          <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} style={{ color: '#fbbf24' }} />
              Industrie — Contrôle Croisé Énergie (kWh)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Consommation Électrique Sonelgaz :</span>
                <span className="font-mono text-slate-200">142 500 kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ratio Standard par Unité Produite :</span>
                <span className="font-mono text-slate-200">18.5 kWh / unité</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Production Théorique Déduite :</span>
                <span className="font-mono text-slate-200">7 702 unités</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '0.4rem', fontWeight: 700 }}>
                <span style={{ color: '#f8fafc' }}>Cohérence avec Déclarations :</span>
                <span style={{ color: '#34d399' }}>✓ Écart &lt; 2.5% (Zone Normale)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scoring Fournisseur "À Examiner" (Règle 6) */}
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
          <UserCheck size={20} style={{ color: '#10b981' }} />
          Audit Fournisseurs : Qualification Neutre (Libellé « Fournisseur à examiner »)
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          Pondération objective de 4 facteurs de risque sans accusation automatique.
        </p>

        <div style={{ backgroundColor: '#050b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                ETS DÉPANNAGE RAPIDE SAHARA (NIF 001818044000078)
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Wilaya d Adrar — Prestations de remorquage désertique</div>
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fbbf24',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
              }}
            >
              Score : 42/100 — Fournisseur à examiner
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#0c1631', borderRadius: '6px' }}>
              <div style={{ color: '#94a3b8' }}>Factures consécutives N/N+1 espacées</div>
              <div style={{ fontWeight: 700, color: '#f87171' }}>1 occurrence détectée (3 sem. d écart)</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#0c1631', borderRadius: '6px' }}>
              <div style={{ color: '#94a3b8' }}>Part de montants ronds en milliers de DA</div>
              <div style={{ fontWeight: 700, color: '#fbbf24' }}>60 % des pièces émises</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#0c1631', borderRadius: '6px' }}>
              <div style={{ color: '#94a3b8' }}>Validité NIF / Registre de Commerce</div>
              <div style={{ fontWeight: 700, color: '#34d399' }}>NIF 15 chiffres conforme</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
