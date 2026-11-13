import React, { useState } from 'react';
import { StudioPack, StudioPackItem, UserStudioRole } from '../../types/studio';
import {
  EvidenceLevel,
  VerificationStatus,
} from '@docteurflotte/decision-engine';
import { AlertOctagon, CheckCircle2, ShieldAlert, ArrowUpRight, Lock } from 'lucide-react';

interface UnverifiedGateTabProps {
  packs: StudioPack[];
  currentRole: UserStudioRole;
  onVerifyParameter: (
    packId: string,
    itemCode: string,
    newStatus: VerificationStatus,
    newEvidence: EvidenceLevel,
    legalRef: string
  ) => void;
}

export const UnverifiedGateTab: React.FC<UnverifiedGateTabProps> = ({
  packs,
  currentRole,
  onVerifyParameter,
}) => {
  // Collect all UNVERIFIED items across all packs
  const unverifiedEntries: Array<{ pack: StudioPack; item: StudioPackItem }> = [];
  packs.forEach((pack) => {
    pack.items.forEach((item) => {
      if (item.verificationStatus === VerificationStatus.UNVERIFIED) {
        unverifiedEntries.push({ pack, item });
      }
    });
  });

  const [selectedEntry, setSelectedEntry] = useState<{
    packId: string;
    itemCode: string;
  } | null>(null);

  const [officialRefInput, setOfficialRefInput] = useState('');
  const [evidenceInput, setEvidenceInput] = useState<EvidenceLevel>(EvidenceLevel.LEGAL_TEXT);

  const canVerify = currentRole === 'EXPERT_VALIDATEUR' || currentRole === 'RELECTEUR';

  const handleConfirmVerification = () => {
    if (!selectedEntry || !officialRefInput.trim()) return;
    onVerifyParameter(
      selectedEntry.packId,
      selectedEntry.itemCode,
      VerificationStatus.SOURCED_OFFICIAL,
      evidenceInput,
      officialRefInput.trim()
    );
    setSelectedEntry(null);
    setOfficialRefInput('');
    alert(`Paramètre ${selectedEntry.itemCode} certifié avec succès.`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Warning Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/30 to-slate-900 border border-red-800/80 shadow-2xl flex items-start gap-4">
        <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              GARDE-FOU QUALITÉ : PORTE DE PUBLICATION SUSPENSIVE (RÈGLE 10)
            </h2>
            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded uppercase">
              Blocage Production Actif
            </span>
          </div>
          <p className="text-xs text-red-200 leading-relaxed">
            Conformément aux normes souveraines de la plateforme, **aucun pack contenant au moins un paramètre au statut UNVERIFIED ne peut être publié en production**.
            Seul un **Relecteur DGI** ou un **Expert-Comptable Validateur** est habilité à lever ce verrou après citation de la source officielle (JORADP).
          </p>
        </div>
      </div>

      {/* Unverified Items List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            Paramètres en Attente de Certification Légale ({unverifiedEntries.length})
          </h3>
          <span className="text-xs text-slate-400">
            Rôle requis pour lever le blocage : <strong className="text-blue-400">EXPERT_VALIDATEUR</strong> ou <strong className="text-blue-400">RELECTEUR</strong>
          </span>
        </div>

        {unverifiedEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-semibold text-emerald-300 text-sm">
              Aucun paramètre non vérifié dans les packs actifs !
            </p>
            <p className="text-slate-500">
              Tous les éléments respectent la porte de publication N°1 (100% sourcés officiellement).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {unverifiedEntries.map(({ pack, item }) => {
              const isSelected =
                selectedEntry?.packId === pack.id && selectedEntry?.itemCode === item.code;

              return (
                <div
                  key={`${pack.id}-${item.code}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-red-950/40 border-red-600'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-red-400">
                          {item.code}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                          {pack.version}
                        </span>
                        <span className="badge badge-unverified">UNVERIFIED</span>
                      </div>
                      <p className="text-xs text-slate-200">{item.labelFr}</p>
                      <p className="text-[11px] text-slate-500">
                        Valeur de travail actuelle : <strong className="text-emerald-400 font-mono">{String(item.valueJson)}</strong> | Réf actuelle : {item.legalRef}
                      </p>
                    </div>

                    <div>
                      {canVerify ? (
                        <button
                          onClick={() => {
                            setSelectedEntry({ packId: pack.id, itemCode: item.code });
                            setOfficialRefInput(item.legalRef || '');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-colors"
                        >
                          <span>Certifier & Lever le Verrou</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Basculer en Relecteur ou Expert pour débloquer</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Form if Selected */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-red-900/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-medium">
                          Niveau de Preuve :
                        </label>
                        <select
                          value={evidenceInput}
                          onChange={(e) => setEvidenceInput(e.target.value as EvidenceLevel)}
                          className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          <option value={EvidenceLevel.LEGAL_TEXT}>
                            LEGAL_TEXT (Loi votée JORADP)
                          </option>
                          <option value={EvidenceLevel.ADMIN_DOCTRINE}>
                            ADMIN_DOCTRINE (Circulaire/Note DGI)
                          </option>
                          <option value={EvidenceLevel.AUDIT_PRACTICE}>
                            AUDIT_PRACTICE (Usage comptable)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-slate-400 block font-medium">
                          Citation Officielle (Article de loi, N° JO, Date) :
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={officialRefInput}
                            onChange={(e) => setOfficialRefInput(e.target.value)}
                            placeholder="Ex: Art. 18 de la Loi 25-17 du 14/12/2025, JO n° 88..."
                            className="flex-1 bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                          <button
                            onClick={handleConfirmVerification}
                            disabled={!officialRefInput.trim()}
                            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
