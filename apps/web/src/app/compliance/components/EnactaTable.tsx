'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconShieldCheck,
  IconPlus,
  IconEdit,
  IconTrash,
} from '@/components/navigation/TechIcons';
import { EnactaRecord } from '../types';

interface EnactaTableProps {
  records: EnactaRecord[];
  onOpenAddEnacta: () => void;
  onOpenEditEnacta: (rec: EnactaRecord) => void;
  onDeleteEnacta: (id: string, plate: string) => void;
}

export function EnactaTable({
  records,
  onOpenAddEnacta,
  onOpenEditEnacta,
  onDeleteEnacta,
}: EnactaTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Registres de Contrôle Technique ENACTA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Décret exécutif n° 03-223 &amp; Décret 17-255 • Poids Lourds (6m), VUL (&lt;4 ans: 24m /
            ≥4 ans: 12m), VL (24m).
          </p>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          {records.length} certificat(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3.5 px-4">Véhicule / Immatriculation</th>
              <th className="py-3.5 px-4">Catégorie</th>
              <th className="py-3.5 px-4">Dernière Visite</th>
              <th className="py-3.5 px-4">Échéance Légale</th>
              <th className="py-3.5 px-4">Centre ENACTA</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-3">
                    <IconShieldCheck size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Aucun contrôle technique ENACTA enregistré
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Consignez une première visite de conformité ou activez le mode démo pour explorer
                    les alertes d&apos;échéance.
                  </p>
                  <Button variant="primary" size="sm" onClick={onOpenAddEnacta}>
                    <IconPlus size={14} />
                    <span>Ajouter un contrôle ENACTA</span>
                  </Button>
                </td>
              </tr>
            ) : (
              records.map((item) => {
                const isExpired = item.daysRemaining < 0;
                const isUrgent = item.daysRemaining >= 0 && item.daysRemaining <= 30;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {item.registrationNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.makeModel}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {item.lastInspectionDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {item.expiryDate}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                          isExpired
                            ? 'text-rose-600 dark:text-rose-400'
                            : isUrgent
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpired
                          ? `ÉCHU (${Math.abs(item.daysRemaining)}j)`
                          : `${item.daysRemaining}j restants`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200">{item.centerName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {item.wilaya}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'VALID' && (
                        <Badge variant="ok" pulse>
                          CONFORME
                        </Badge>
                      )}
                      {item.status === 'WARNING' && (
                        <Badge variant="warning" pulse>
                          PRÉAVIS
                        </Badge>
                      )}
                      {item.status === 'EXPIRED' && (
                        <Badge variant="danger" pulse>
                          FOURRIÈRE
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenEditEnacta(item)}
                          title="Modifier ce contrôle"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <IconEdit size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteEnacta(item.id, item.registrationNumber)}
                          title="Supprimer ce contrôle"
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
