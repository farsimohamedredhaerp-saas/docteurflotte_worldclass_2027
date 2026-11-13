import React from 'react';
import { StudioAuditAction } from '../../types/studio';
import { History, Shield, Calendar } from 'lucide-react';

interface AuditTrailTabProps {
  logs: StudioAuditAction[];
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ logs }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Journal d Audit des Actions Control Plane (RÈGLE 7)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historique infalsifiable de toutes les créations, approbations, validations formelles et publications de packs réglementaires.
          </p>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {logs.length} événement(s) consigné(s)
        </span>
      </div>

      {/* Audit list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/80">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">
                    {log.actionType}
                  </span>
                  <span className="font-mono font-bold text-slate-300">
                    {log.targetPackId}
                  </span>
                  {log.targetItemCode && (
                    <span className="text-slate-500 font-mono">
                      [{log.targetItemCode}]
                    </span>
                  )}
                </div>
                <p className="text-slate-200 text-xs">{log.detailsFr}</p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>{log.userName}</span>
                  <span className="text-[10px] text-slate-500">({log.userRole})</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
