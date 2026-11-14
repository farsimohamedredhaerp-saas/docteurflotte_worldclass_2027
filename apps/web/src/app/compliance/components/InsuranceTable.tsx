'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconFileText,
  IconPlus,
  IconEdit,
  IconTrash,
} from '@/components/navigation/TechIcons';
import { InsuranceRecord } from '../types';

interface InsuranceTableProps {
  records: InsuranceRecord[];
  onOpenAddInsurance: () => void;
  onOpenEditInsurance: (ins: InsuranceRecord) => void;
  onDeleteInsurance: (id: string, plate: string) => void;
}

export function InsuranceTable({
  records,
  onOpenAddInsurance,
  onOpenEditInsurance,
  onDeleteInsurance,
}: InsuranceTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Polices d&apos;Assurance Flotte &amp; RC Automobile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ordonnance n° 03-12 • Assurance obligatoire CatNat, Tous Risques &amp; Tiers Transport.
          </p>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          {records.length} police(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3.5 px-4">Immatriculation</th>
              <th className="py-3.5 px-4">Compagnie</th>
              <th className="py-3.5 px-4">N° de Police</th>
              <th className="py-3.5 px-4">Formule</th>
              <th className="py-3.5 px-4">Échéance</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-3">
                    <IconFileText size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Aucune police d&apos;assurance enregistrée
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Enregistrez vos polices CAAT, SAA, CASH ou Alliance pour verrouiller les départs
                    en mission.
                  </p>
                  <Button variant="primary" size="sm" onClick={onOpenAddInsurance}>
                    <IconPlus size={14} />
                    <span>Ajouter une police d&apos;assurance</span>
                  </Button>
                </td>
              </tr>
            ) : (
              records.map((ins) => (
                <tr
                  key={ins.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {ins.registrationNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {ins.makeModel}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {ins.insurer}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {ins.policyNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="neutral">
                      {ins.coverageType.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {ins.expiryDate}
                  </td>
                  <td className="py-3.5 px-4">
                    {ins.status === 'VALID' ? (
                      <Badge variant="ok" pulse>
                        EN COURS
                      </Badge>
                    ) : (
                      <Badge variant="warning" pulse>
                        RENOUVELLEMENT
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenEditInsurance(ins)}
                        title="Modifier"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <IconEdit size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteInsurance(ins.id, ins.registrationNumber)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
