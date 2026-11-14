'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconFileText, IconAlertTriangle } from '@/components/navigation/TechIcons';
import { DVIRInspectionReport } from '../types';
import { useDemoMode } from '@/context/DemoModeContext';
import { AuthClient } from '@/lib/api-auth';
import { FleetIntelligenceClient } from '@/lib/api-fleet-intelligence';

export default function DvirHistoryPage() {
  const { isDemoMode } = useDemoMode();
  const [reports, setReports] = useState<DVIRInspectionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'CRITICAL'>('ALL');

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    if (isDemoMode) {
      import('@/lib/simulation-sandbox')
        .then((sandbox) => sandbox.getSimulationDvirData())
        .then((data) => {
          if (!isCancelled) setReports(data.reports);
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    } else {
      const session = AuthClient.getSession();
      if (session.token) {
        FleetIntelligenceClient.getDvirReports(session.token, false)
          .then((data: DVIRInspectionReport[]) => {
            if (!isCancelled) setReports(data);
          })
          .catch(() => {
            if (!isCancelled) setReports([]);
          })
          .finally(() => {
            if (!isCancelled) setIsLoading(false);
          });
      } else {
        setReports([]);
        setIsLoading(false);
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter === 'PASS' && !r.isCompliant) return false;
      if (statusFilter === 'CRITICAL' && !r.hasCriticalFailures) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.assetName.toLowerCase().includes(q) ||
          r.driverName.toLowerCase().includes(q) ||
          (r.generatedWorkOrderId && r.generatedWorkOrderId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        {/* HEADER */}
        <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/dvir"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                <span>← Retour au Cockpit d’Inspection DVIR</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Registre Immuable des Inspections DVIR
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Traçabilité des fiches certifiées, signatures horodatées et dossiers de consignation atelier.
              </p>
            </div>

            <Badge variant="neutral">
              {reports.length} Rapport{reports.length > 1 ? 's' : ''} Archivé{reports.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </section>

        {/* FILTRES & RECHERCHE */}
        <div className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par véhicule, chauffeur, OT..."
              shortcutKey="/"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Toutes les Fiches' },
              { id: 'PASS', label: 'Conformes' },
              { id: 'CRITICAL', label: 'Défauts Critiques' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES RAPPORTS */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-xs font-medium text-slate-500">Chargement du registre...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={IconFileText}
            title="Aucune inspection trouvée"
            description="Aucun rapport d'inspection ne correspond à vos filtres actuels."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((r) => (
              <Card
                key={r.id}
                variant="default"
                padding="md"
                className={`flex flex-col justify-between ${
                  r.hasCriticalFailures ? 'border-rose-500/60 bg-rose-500/5 dark:bg-rose-950/20' : 'bg-white dark:bg-[#111827]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{r.assetName}</h3>
                      <div className="text-[11px] text-slate-500">Chauffeur : <strong className="text-slate-700 dark:text-slate-300">{r.driverName}</strong></div>
                    </div>
                    <Badge variant={r.isCompliant ? 'ok' : 'danger'}>{r.isCompliant ? 'CONFORME' : 'CRITIQUE'}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-3">
                    Odomètre : {r.odometerKm?.toLocaleString('fr-DZ')} km • {new Date(r.submittedAt).toLocaleDateString('fr-DZ')}
                  </div>
                  {r.hasCriticalFailures && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs mb-3">
                      <div className="flex items-center gap-1 font-bold"><IconAlertTriangle size={13} /><span>Immobilisation Requise</span></div>
                      {r.generatedWorkOrderId && <div className="mt-1 font-mono text-[11px]">Ordre Atelier : {r.generatedWorkOrderId}</div>}
                    </div>
                  )}
                  {r.signatureDataUrl && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Signature certifiée</span>
                      <img src={r.signatureDataUrl} alt="Signature" className="h-6 max-w-[100px] object-contain" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
