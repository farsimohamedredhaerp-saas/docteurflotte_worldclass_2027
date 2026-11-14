'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/Badge';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconFileText,
} from '@/components/navigation/TechIcons';
import { DVIRInspectionReport } from '../types';

export interface DvirReportsFeedProps {
  reports: DVIRInspectionReport[];
  selectedAssetId?: string;
}

export const DvirReportsFeed: React.FC<DvirReportsFeedProps> = ({
  reports,
  selectedAssetId,
}) => {
  const [filterBySelectedAsset, setFilterBySelectedAsset] = useState(false);

  const displayedReports = filterBySelectedAsset && selectedAssetId
    ? reports.filter((r) => r.assetId === selectedAssetId)
    : reports.slice(0, 5);

  return (
    <Card variant="default" padding="md" className="bg-white dark:bg-[#111827]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconShieldCheck size={18} className="text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Dernières Inspections Certifiées
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {selectedAssetId && (
            <button
              type="button"
              onClick={() => setFilterBySelectedAsset(!filterBySelectedAsset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterBySelectedAsset
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {filterBySelectedAsset ? 'Filtré : Cet Actif' : 'Tous les Actifs'}
            </button>
          )}

          <Link
            href="/dvir/history"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Voir Registre ({reports.length}) →</span>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {displayedReports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aucun rapport DVIR enregistré récemment.
          </div>
        ) : (
          displayedReports.map((report) => (
            <div
              key={report.id}
              className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                report.hasCriticalFailures
                  ? 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {report.assetName}
                </span>
                <Badge variant={report.isCompliant ? 'ok' : 'danger'}>
                  {report.isCompliant ? 'CONFORME (PASS)' : 'DÉFAUT CRITIQUE'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Chauffeur : <strong className="text-slate-700 dark:text-slate-300">{report.driverName}</strong></span>
                <span className="font-mono text-[11px]">
                  {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-slate-500 text-[11px]">
                Relevé odomètre :{' '}
                <strong className="font-mono text-slate-700 dark:text-slate-300">
                  {report.odometerKm?.toLocaleString('fr-DZ')} km
                </strong>
              </div>

              {/* THUMBNAIL SIGNATURE */}
              {report.signatureDataUrl && (
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500">Signature :</span>
                  <img
                    src={report.signatureDataUrl}
                    alt="Signature"
                    className="h-5 max-w-[80px] object-contain"
                  />
                </div>
              )}

              {/* WORK ORDER SI CRITIQUE */}
              {report.hasCriticalFailures && (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                  <IconAlertTriangle size={13} />
                  <span>
                    Immobilisé • OT : {report.generatedWorkOrderId || 'En cours de consignation'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
