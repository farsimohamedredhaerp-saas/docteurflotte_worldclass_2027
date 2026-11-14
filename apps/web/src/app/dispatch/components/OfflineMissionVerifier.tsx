'use client';

import React from 'react';
import { OfflineVerificationOutput } from '../types';
import {
  IconShieldCheck,
  IconSearch,
  IconCheck,
  IconAlertOctagon,
  IconRefreshCw,
} from '@/components/navigation/TechIcons';

interface OfflineMissionVerifierProps {
  verifyQrText: string;
  setVerifyQrText: (s: string) => void;
  verifyTokenText: string;
  setVerifyTokenText: (s: string) => void;
  isVerifying: boolean;
  verificationOutput: OfflineVerificationOutput | null;
  onVerify: () => void;
}

export function OfflineMissionVerifier({
  verifyQrText,
  setVerifyQrText,
  verifyTokenText,
  setVerifyTokenText,
  isVerifying,
  verificationOutput,
  onVerify,
}: OfflineMissionVerifierProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center gap-2 mb-2">
        <IconShieldCheck size={16} className="text-blue-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          Vérificateur Hors-Ligne (Contrôle Routier Gendarmerie / DGSN)
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
        Testez la validation cryptographique sans accès Internet (Mode 100% hors-ligne dans le Grand
        Sud) :
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Chaîne lue par scan QR (Format DZOM) :
          </label>
          <input
            type="text"
            value={verifyQrText}
            onChange={(e) => setVerifyQrText(e.target.value)}
            placeholder="DZOM|OM-2026-161234|01492-319-16|198516012345678901|16|30|2026-11-04|FRET"
            className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Jeton de signature numérique Ed25519 :
          </label>
          <input
            type="text"
            value={verifyTokenText}
            onChange={(e) => setVerifyTokenText(e.target.value)}
            placeholder="ED25519-SIG-..."
            className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying || !verifyQrText}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isVerifying ? (
            <IconRefreshCw size={13} className="animate-spin" />
          ) : (
            <IconSearch size={13} />
          )}
          <span>Vérifier l&apos;Authenticité Hors-Ligne</span>
        </button>

        {verificationOutput && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              verificationOutput.isValid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {verificationOutput.isValid ? (
                <>
                  <IconCheck size={14} className="text-emerald-600" />
                  <span>ORDRE DE MISSION AUTHENTIQUE & VALIDE</span>
                </>
              ) : (
                <>
                  <IconAlertOctagon size={14} className="text-rose-600" />
                  <span>INVALIDITÉ : {verificationOutput.reason}</span>
                </>
              )}
            </div>
            {verificationOutput.decodedOrder && (
              <div className="text-[11px] opacity-80 leading-relaxed font-mono">
                Ordre : {verificationOutput.decodedOrder.orderNumber} • Véhicule :{' '}
                {verificationOutput.decodedOrder.registrationPlate} • Validité :{' '}
                {verificationOutput.decodedOrder.validUntil}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

