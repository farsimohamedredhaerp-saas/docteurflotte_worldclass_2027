import React, { useState } from 'react';
import { StudioPack, StudioPackItem } from '../../types/studio';
import {
  EvidenceLevel,
  RegPackItemKind,
  VerificationStatus,
} from '@docteurflotte/decision-engine';
import { TableProperties, Search, Filter } from 'lucide-react';

interface ParametersMatrixTabProps {
  packs: StudioPack[];
  activePackId: string;
  onUpdateItem?: (packId: string, item: StudioPackItem) => void;
}

export const ParametersMatrixTab: React.FC<ParametersMatrixTabProps> = ({
  packs,
  activePackId,
}) => {
  const currentPack = packs.find((p) => p.id === activePackId) || packs[0];
  const parameters = currentPack.items.filter((i) => i.kind === RegPackItemKind.PARAMETER);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('ALL');

  const filtered = parameters.filter((param) => {
    const matchesSearch =
      param.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.labelFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      param.legalRef.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || param.verificationStatus === statusFilter;

    const matchesEvidence =
      evidenceFilter === 'ALL' || param.evidenceLevel === evidenceFilter;

    return matchesSearch && matchesStatus && matchesEvidence;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-blue-400" />
            Matrice des Paramètres & Traçabilité des Preuves (RÈGLE 10 & 11)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consultez et filtrez tous les seuils, taux et plafonds par statut de vérification et référence légale opposable.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-mono">
            {filtered.length} / {parameters.length} paramètre(s)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par code, libellé ou article de loi..."
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none flex-1"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Statut de vérification :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value={VerificationStatus.SOURCED_OFFICIAL}>SOURCED_OFFICIAL</option>
            <option value={VerificationStatus.SOURCED_SECONDARY}>SOURCED_SECONDARY</option>
            <option value={VerificationStatus.UNVERIFIED}>UNVERIFIED (Bloquant)</option>
          </select>
        </div>

        {/* Evidence Level Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Niveau de preuve :</span>
          <select
            value={evidenceFilter}
            onChange={(e) => setEvidenceFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">Tous les niveaux</option>
            <option value={EvidenceLevel.LEGAL_TEXT}>LEGAL_TEXT (Texte de loi)</option>
            <option value={EvidenceLevel.ADMIN_DOCTRINE}>ADMIN_DOCTRINE (Circulaire/DGI)</option>
            <option value={EvidenceLevel.AUDIT_PRACTICE}>AUDIT_PRACTICE (Usage d audit)</option>
            <option value={EvidenceLevel.STATISTICAL}>STATISTICAL (Statistique)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code Paramètre</th>
                <th className="py-3 px-4">Libellé Officiel & Arabe</th>
                <th className="py-3 px-4">Valeur Légale</th>
                <th className="py-3 px-4">Référence Légale</th>
                <th className="py-3 px-4">Statut de Vérification</th>
                <th className="py-3 px-4">Niveau de Preuve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((param) => {
                const isOfficial = param.verificationStatus === VerificationStatus.SOURCED_OFFICIAL;
                const isUnverified = param.verificationStatus === VerificationStatus.UNVERIFIED;

                return (
                  <tr
                    key={param.code}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isUnverified ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-blue-400">
                      {param.code}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-200">
                      <div>{param.labelFr}</div>
                      {param.labelAr && (
                        <div className="text-[11px] text-slate-500 font-arabic text-right mt-0.5">
                          {param.labelAr}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {String(param.valueJson)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {param.legalRef}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          isOfficial
                            ? 'badge-official'
                            : isUnverified
                            ? 'badge-unverified'
                            : 'badge-secondary'
                        }`}
                      >
                        {param.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {param.evidenceLevel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
