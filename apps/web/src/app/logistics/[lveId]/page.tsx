'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconChevronLeft,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconLock,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { LogisticsClient } from '@/lib/api-logistics';
import { AssetClient } from '@/lib/api-assets';
import type {
  ConsignmentNote,
  ProofOfDelivery,
  Asset,
} from '@docteurflotte/contracts';

interface PageProps {
  params: Promise<{ lveId: string }>;
}

export default function LveDetailPage({ params }: PageProps) {
  const { lveId } = use(params);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lve, setLve] = useState<ConsignmentNote | null>(null);
  const [pod, setPod] = useState<ProofOfDelivery | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (session?.token) {
      setToken(session.token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (jwt: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [lveData, podData, assetsList] = await Promise.all([
        LogisticsClient.getLve(lveId, jwt),
        LogisticsClient.getPod(lveId, jwt),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setLve(lveData);
      setPod(podData);
      const foundAsset = assetsList.find((a) => a.id === lveData.assetId) || null;
      setAsset(foundAsset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement de la LVE.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, lveId]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* RETOUR & TITRE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <Link
              href="/logistics"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--df-brand-primary)] hover:underline mb-2"
            >
              <IconChevronLeft size={14} /> Retour aux Expéditions & LVE
            </Link>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconTruck size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  {lve?.lveNumber}
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Lettre de Voiture Électronique Souveraine — Décret Exécutif N° 03-223 (Algérie)
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => token && loadData(token)}
            disabled={loading}
            className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)] self-start sm:self-auto"
            title="Rafraîchir"
          >
            <IconRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ALERTE ERREUR */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CARTE LVE CONFORME */}
        {lve && (
          <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--df-text-muted)]">
                  Véhicule Porteur
                </span>
                <p className="font-bold text-base text-[var(--df-text-main)]">
                  {asset ? `${asset.code} — ${asset.name}` : lve.assetId.slice(0, 8)}
                </p>
                <span className="text-xs text-[var(--df-text-muted)]">Chauffeur : {lve.driverName || 'Non assigné'}</span>
              </div>

              {/* JETON CONTRÔLE ROUTIER */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-right">
                <span className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <IconShieldCheck size={14} /> Jeton Sécurisé HMAC-256
                </span>
                <span className="font-mono text-xs text-[var(--df-text-muted)] mt-1 block break-all max-w-xs">
                  {lve.qrCodeValidationHmac.slice(0, 24)}...
                </span>
              </div>
            </div>

            {/* EXPÉDITEUR & DESTINATAIRE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--df-text-muted)]">
                  Expéditeur (Origine)
                </span>
                <p className="font-bold text-base text-[var(--df-text-main)]">{lve.shipperName}</p>
                <p className="text-xs text-[var(--df-text-muted)]">{lve.shipperAddress}</p>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-zinc-500/10">
                  Wilaya {lve.shipperWilayaCode.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--df-text-muted)]">
                  Destinataire (Livraison)
                </span>
                <p className="font-bold text-base text-[var(--df-text-main)]">{lve.consigneeName}</p>
                <p className="text-xs text-[var(--df-text-muted)]">{lve.consigneeAddress}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-zinc-500/10">
                    Wilaya {lve.consigneeWilayaCode.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-[var(--df-text-muted)] font-mono">{lve.consigneePhoneDz}</span>
                </div>
              </div>
            </div>

            {/* DÉTAILS DE LA MARCHANDISE */}
            <div className="pt-2 border-t border-[var(--df-border-subtle)] grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[var(--df-text-muted)]">Nature de la Marchandise</span>
                <p className="font-bold text-sm text-[var(--df-text-main)] mt-0.5">{lve.cargoNature}</p>
              </div>
              <div>
                <span className="text-[var(--df-text-muted)]">Poids Total</span>
                <p className="font-bold text-sm text-[var(--df-text-main)] mt-0.5">{lve.totalWeightKg} kg</p>
              </div>
              <div>
                <span className="text-[var(--df-text-muted)]">Nombre de Colis</span>
                <p className="font-bold text-sm text-[var(--df-text-main)] mt-0.5">{lve.packagesCount} colis</p>
              </div>
            </div>
          </div>
        )}

        {/* PREUVE DE LIVRAISON (POD) SI EXISTANTE */}
        {pod && (
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-[var(--df-bg-surface-elevated)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-4">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <IconCheck size={18} />
                <span>Preuve de Livraison Émargée & Scellée (POD)</span>
              </div>
              <span className="text-xs text-[var(--df-text-muted)]">
                {new Date(pod.deliveredAt).toLocaleString('fr-DZ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[var(--df-text-muted)]">Réceptionné Par</span>
                <p className="font-bold text-sm text-[var(--df-text-main)] mt-0.5">{pod.recipientName}</p>
              </div>
              <div>
                <span className="text-[var(--df-text-muted)]">Pièce d’Identité</span>
                <p className="font-mono text-sm text-[var(--df-text-main)] mt-0.5">
                  {pod.recipientIdentityDocRef || 'Non renseigné'}
                </p>
              </div>
              <div>
                <span className="text-[var(--df-text-muted)]">Colis Reçus</span>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {pod.packagesDelivered}
                </p>
              </div>
              <div>
                <span className="text-[var(--df-text-muted)]">Avaries / Refus</span>
                <p className={`font-bold text-sm mt-0.5 ${pod.packagesDamaged > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                  {pod.packagesDamaged} / {pod.packagesRefused}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--df-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--df-text-muted)]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <IconLock size={12} /> Scellé SHA-256
              </span>
              <span>{pod.sha256ProofSeal}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

