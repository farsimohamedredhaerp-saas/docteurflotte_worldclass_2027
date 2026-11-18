// apps/web/src/components/landing/LandingPageClient.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';
import { AuthClient } from '../../lib/api-auth';
import {
  IconActivity,
  IconShieldCheck,
  IconCpu,
  IconFuel,
  IconWrench,
  IconTruck,
  IconLayers,
  IconCompass,
  IconBarChart3,
  IconNavigation,
  IconAlertTriangle,
  IconCheck,
  IconZap,
  IconMountain,
  IconGlobe,
  IconTerminal,
  IconArrowUpRight,
} from '../navigation/TechIcons';

import {
  SAMPLE_PROMPTS,
  SECTORS,
  CLIENT_LOGOS,
  type Lang,
  type FleetSector,
  type OrganId,
  type TierId,
  type SamplePrompt,
} from './constants';
import { usePersistedLang, useInView } from './hooks';
import { computeRoi } from './calculations';
import { MobileMenu } from './components/MobileMenu';
import { HowItWorksSection } from './components/HowItWorksSection';
import { IntegrationsSection } from './components/IntegrationsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { JsonLd } from './components/JsonLd';

// =============================================================================
// Sous-composant : Bandeau KPI métrique
// =============================================================================
function KpiStrip({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  const items = [
    {
      value: '58 Wilayas',
      label: isAr ? 'تغطية بيومناخية شاملة' : 'Couverture Bioclimatique',
      color: 'text-blue-600 dark:text-sky-400',
    },
    {
      value: '0 DA',
      label: isAr ? 'أجهزة إضافية في النمط 0' : 'Boîtier Requis (Mode 0)',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: '-32 %',
      label: isAr ? 'تقليص أوقات التوقف والتعطل' : 'Coûts d\'Immobilisation',
      color: 'text-blue-600 dark:text-cyan-400',
    },
    {
      value: '6 Organes',
      label: isAr ? 'نمذجة فيزيائية حتمية' : 'Jumeau Numérique XAI',
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      value: '100 %',
      label: isAr ? 'سيادة وطنية ومطابقة القانون 18-07' : 'Souveraineté & Loi 18-07',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div
      className="w-full grid grid-cols-2 md:grid-cols-5 gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-sm"
      style={{
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 24, 39, 0.75)',
        borderColor: isLight ? '#E2E8F0' : '#1E293B',
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className={`p-3 text-center border-r last:border-none border-slate-200 dark:border-slate-800 ${
            i === 4 ? 'col-span-2 md:col-span-1' : ''
          }`}
        >
          <div className={`text-xl md:text-2xl font-extrabold font-mono ${it.color}`}>{it.value}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Sous-composant : Terminal interactif d'atelier
// =============================================================================
function TerminalSimulator({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<SamplePrompt | null>(null);

  const handleRunPrompt = useCallback((item: SamplePrompt) => {
    setTerminalInput(item.query);
    setTerminalOutput(item);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-3">
          <IconTerminal size={12} />
          <span>{isAr ? 'مساعد الورشة الذكي بالدارجة والفصحى والفرنسية' : 'ASSISTANT D\'ATELIER MULTILINGUE & DIALECTAL'}</span>
        </div>
        <h3
          className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
          style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
        >
          {isAr
            ? 'توجيه فوري للميكانيكيين بلغتها الحقيقية في الميدان'
            : 'Assistant Vocal d\'Atelier en Langage Naturel & Dialectal'}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 mb-6">
          {isAr
            ? 'يعمل محلياً 100% داخل خوادمكم دون إرسال أي معلومة إلى الخارج. يفهم مصطلحات الميكانيكيين باللهجة اليومية، ويرد فوراً في أقل من 50 ميلي ثانية بمواصفات المصنع الدقيقة (عزوم الربط، درجات اللزوجة، ومعايير الضغط).'
            : 'Exécuté localement sur le CPU du serveur sans aucune fuite vers le cloud. Il comprend le dialecte d\'atelier des mécaniciens et renvoie instantanément (< 50 ms) les spécifications officielles des constructeurs industriels.'}
        </p>

        {/* Suggestions cliquables */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            {isAr ? 'جرّب استعلاماً واقعياً :' : 'Testez une requête réelle d\'atelier :'}
          </span>
          {SAMPLE_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRunPrompt(item)}
              className="w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-colors hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#E2E8F0' : '#1E293B',
                color: isLight ? '#0F172A' : '#F8FAFC',
              }}
            >
              <div>
                <span className="font-bold font-sans">{isAr ? item.labelAr : item.labelFr}</span>
                <span className="block font-mono text-[11px] text-blue-500 mt-0.5">
                  « {item.query} »
                </span>
              </div>
              <IconArrowUpRight size={14} className="text-slate-400" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* Écran Terminal Simulation */}
      <div
        className="p-5 rounded-xl border font-mono text-xs shadow-2xl flex flex-col h-[340px] justify-between"
        style={{
          backgroundColor: '#090D16',
          borderColor: '#1E293B',
          color: '#F8FAFC',
        }}
        role="log"
        aria-live="polite"
      >
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-bold text-slate-300">TERMINAL ATELIER SOUVERAIN (CPU 100% LOCAL)</span>
            </div>
            <span className="text-emerald-400 font-bold">&lt; 50 ms</span>
          </div>

          <div className="pt-4 space-y-3">
            <div className="text-slate-400">
              &gt; Requête mécanicien :{' '}
              <span className="text-sky-300 font-bold">
                {terminalInput || SAMPLE_PROMPTS[0].query}
              </span>
            </div>

            {terminalOutput ? (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-emerald-400 text-[10px]">
                  <span>INTENTION : {terminalOutput.action}</span>
                  <span>LATENCE : {terminalOutput.latencyMs} ms</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">{terminalOutput.details}</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  {terminalOutput.rule}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-emerald-400 text-[10px]">
                  <span>INTENTION : ANALYSE_VISCOSITÉ_HUILE</span>
                  <span>LATENCE : 18 ms</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">
                  Viscosité cinématique nominale : 14.2 cSt. RUL estimée : 3 400 km selon la cinétique d&apos;Arrhenius. Aucune vidange immédiate requise.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  Loi thermique d&apos;Arrhenius Ea/R=6500K
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between">
          <span>Moteur Déterministe d&apos;Intention Dialectale</span>
          <span className="text-emerald-400 font-bold">ZÉRO CLOUD EXTERNE</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPOSANT PRINCIPAL : LANDING PAGE CLIENT MONDIALE SOUVERAINE
// =============================================================================
export function LandingPageClient() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Persistance de la langue via localStorage
  const [lang, setLang] = usePersistedLang();
  const isAr = lang === 'AR';

  // Navigation mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Détection de session active pour personnalisation de l'accueil
  const [activeSession, setActiveSession] = useState<{
    token: string | null;
    tenantName?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const sess = AuthClient.getSession();
      if (sess.token) {
        setActiveSession({
          token: sess.token,
          tenantName: sess.tenant?.name || sess.user?.email || undefined,
        });
      }
    } catch {
      // Ignorer si non disponible en SSR
    }
  }, []);

  // 1. État du sélecteur de mode télématique (Mode 0 / Mode 1 / Mode 2)
  const [activeTier, setActiveTier] = useState<TierId>(2);

  // 2. État du sélecteur d'organe Jumeau Numérique
  const [activeOrgan, setActiveOrgan] = useState<OrganId>('OIL');

  // 3. État du simulateur de rentabilité financière (DZD) jusqu'à 1 000 actifs
  const [fleetSize, setFleetSize] = useState<number>(45);
  const [monthlyKm, setMonthlyKm] = useState<number>(8500);
  const [fleetSector, setFleetSector] = useState<FleetSector>('FREIGHT');

  // Calcul actuariel déterministe via le module dédié
  const calculatedSavings = useMemo(() => {
    return computeRoi(fleetSize, monthlyKm, fleetSector);
  }, [fleetSize, monthlyKm, fleetSector]);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      lang={isAr ? 'ar' : 'fr'}
      className={`min-h-screen w-full flex flex-col transition-colors duration-200 ${
        isAr ? 'font-arabic' : 'font-sans'
      }`}
      style={{
        fontFamily: isAr ? 'var(--df-font-arabic)' : 'var(--df-font-sans)',
        backgroundColor: isLight ? '#F8FAFC' : '#070A10',
        color: isLight ? '#0F172A' : '#F1F5F9',
        overflowX: 'hidden',
      }}
    >
      <JsonLd />

      {/* Skip Link pour accessibilité WCAG */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded focus:bg-blue-600 focus:text-white focus:text-xs focus:font-bold"
      >
        {isAr ? 'تخطي إلى المحتوى الرئيسي' : 'Aller au contenu principal'}
      </a>

      {/* Menu mobile drawer */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAr={isAr}
        isLight={isLight}
      />

      {/* =========================================================================
          1. HEADER & BARRE DE NAVIGATION FLOTTANTE HAUTE PRÉCISION
          ========================================================================= */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-md transition-colors"
        style={{
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(7, 10, 16, 0.88)',
          borderBottom: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(30, 41, 59, 0.8)'}`,
          boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Emblème Souverain */}
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none group" aria-label="DocteurFlotte Accueil">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <IconTruck size={20} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-none text-blue-600 dark:text-sky-400">
                DOCTEUR<span style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>FLOTTE</span>
              </span>
              <span className="text-[9px] font-mono tracking-wider font-semibold text-slate-500 uppercase">
                {isAr ? 'المنصة السيادية • الصيانة 5.0' : 'SOUVERAINETÉ & MAINTENANCE 5.0'}
              </span>
            </div>
          </Link>

          {/* Navigation Liens Rapides (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold" aria-label="Navigation principale">
            <a
              href="#paliers"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'الهندسة المعمارية (3 أنماط)' : '3 Paliers OEM'}
            </a>
            <a
              href="#organes"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'التوأم الرقمي (6 أعضاء)' : 'Jumeau Numérique'}
            </a>
            <a
              href="#carburant"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'كشف السحب (CUSUM)' : 'Anti-Fraude CUSUM'}
            </a>
            <a
              href="#wilayas"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'معايرة 58 ولاية' : '58 Wilayas'}
            </a>
            <a
              href="#etapes"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'كيف تعمل' : 'Déploiement'}
            </a>
            <a
              href="#simulateur"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'حاسبة الأرباح (دج)' : 'Simulateur ROI (DZD)'}
            </a>
            <a
              href="#temoignages"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'شهادات' : 'Avis'}
            </a>
            <a
              href="#faq"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              FAQ
            </a>
          </nav>

          {/* Actions & Sélecteurs */}
          <div className="flex items-center gap-3">
            {/* Bascule Langue FR / AR avec persistance */}
            <button
              type="button"
              onClick={() => setLang(isAr ? 'FR' : 'AR')}
              className="px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
              style={{
                backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                borderColor: isLight ? '#CBD5E1' : '#334155',
                color: isLight ? '#0F172A' : '#F8FAFC',
              }}
              title={isAr ? 'Passer en Français' : 'التحويل إلى اللغة العربية'}
              aria-label={isAr ? 'Passer en Français' : 'التحويل إلى العربية'}
            >
              {isAr ? 'FR' : 'العربية'}
            </button>

            {/* Bascule Thème Sombre / Clair */}
            <ThemeToggle />

            {/* Lien Connexion ou Espace Client */}
            {activeSession?.token ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 text-decoration-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{activeSession.tenantName ? activeSession.tenantName : (isAr ? 'حسابي' : 'Mon Espace')}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3 py-1.5 rounded text-xs font-semibold transition-colors text-decoration-none"
                style={{
                  color: isLight ? '#334155' : '#CBD5E1',
                }}
              >
                {isAr ? 'تسجيل الدخول' : 'Connexion'}
              </Link>
            )}

            {/* CTA Cockpit Direct */}
            <Link
              href="/live-cockpit"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded text-xs font-bold text-white items-center gap-1.5 shadow-sm transition-transform hover:scale-102 cursor-pointer text-decoration-none"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)',
              }}
            >
              <IconActivity size={13} strokeWidth={2.5} />
              <span>{isAr ? 'قمرة القيادة' : 'Cockpit'}</span>
            </Link>

            {/* Bouton Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              aria-label={isAr ? 'فتح القائمة' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* =========================================================================
            2. HERO SECTION : EN-TÊTE MONDIAL IMMERSIF & PROMESSE DE RUPTURE
            ========================================================================= */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Grille d'arrière-plan radar subtile */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `radial-gradient(${isLight ? '#CBD5E1' : '#1E293B'} 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          {/* Halo ambiant bleuté */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[120px] pointer-events-none"
            style={{
              background: isLight
                ? 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(2,132,199,0.18) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            {/* Badge de positionnement souverain */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase mb-6 shadow-sm border"
              style={{
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(2, 132, 199, 0.12)',
                borderColor: isLight ? '#BFDBFE' : 'rgba(2, 132, 199, 0.35)',
                color: isLight ? '#1D4ED8' : '#38BDF8',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isAr
                  ? 'السيادة الوطنية الكاملة • الصيانة التوجيهية 5.0 • مطابقة القانون 18-07'
                  : 'SOUVERAINETÉ NATIONALE • MAINTENANCE 5.0 • CONFORMITÉ LOI 18-07'}
              </span>
            </div>

            {/* Titre Principal de Rupture */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-[1.15] mb-6"
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              {isAr ? (
                <>
                  منصة التيليماتيكس السيادية و
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">
                    الصيانة التوجيهية الحتمية
                  </span>{' '}
                  للأساطيل الصناعية
                </>
              ) : (
                <>
                  La Plateforme Souveraine de Télémétrie &amp;{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400">
                    Maintenance Prescriptive 5.0
                  </span>{' '}
                  des Flottes &amp; Engins
                </>
              )}
            </h1>

            {/* Sous-titre Explicatif */}
            <p
              className="text-base sm:text-lg md:text-xl max-w-3xl leading-relaxed mb-10"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr
                ? 'قطيعة جذرية مع التتبع السلبي. تحويل كل إشارة فيزيائية إلى قرار مالي ملزم مقوّم بالدينار الجزائري (دج). استقلالية تامة عن أي تبعية سحابية خارجية، نمذجة حتمية لـ 6 أعضاء ميكانيكية، ومعايرة مناخية دقيقة عبر 58 ولاية.'
                : 'Rupture radicale avec le simple pistage GPS passif. DocteurFlotte transforme chaque signal physique en arbitrage économique opposable en Dinars Algériens (DZD). Zéro dépendance externe, modélisation déterministe des 6 organes vitaux et calibrage bioclimatique sur les 58 Wilayas.'}
            </p>

            {/* Double CTA Primaire */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto justify-center mb-16">
              <Link
                href="/live-cockpit"
                className="px-6 py-3.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer text-decoration-none"
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)',
                }}
              >
                <IconActivity size={16} strokeWidth={2.5} />
                <span>{isAr ? 'استكشاف قمرة القيادة المباشرة' : 'Explorer le Cockpit Décisionnel'}</span>
                <IconArrowUpRight size={15} />
              </Link>

              <a
                href="#simulateur"
                className="px-6 py-3.5 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#111827',
                  borderColor: isLight ? '#CBD5E1' : '#334155',
                  color: isLight ? '#0F172A' : '#F8FAFC',
                }}
              >
                <IconBarChart3 size={16} strokeWidth={2.2} />
                <span>{isAr ? 'محاكاة العائد المالي الصافي (دج)' : 'Simuler mon Économie Nette (DZD)'}</span>
              </a>
            </div>

            {/* Bandeau de Preuves Métriques (KPI Strip) */}
            <KpiStrip isAr={isAr} isLight={isLight} />
          </div>
        </section>

        {/* =========================================================================
            BARRE DE PREUVE SOCIALE & SECTEURS CLIENTS DÉPLOYÉS
            ========================================================================= */}
        <section className="py-8 border-t border-b border-slate-200 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-4 font-semibold">
              {isAr ? 'أساطيل صناعية منشورة وموثوقة عبر التراب الوطني' : 'Déjà déployé sur les corridors & parcs industriels majeurs'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              {CLIENT_LOGOS.map((n) => (
                <div
                  key={n.label}
                  className="py-3 px-2 rounded-lg border font-mono text-[10px] font-bold tracking-wider flex flex-col justify-center"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                    borderColor: isLight ? '#E2E8F0' : '#1E293B',
                    color: isLight ? '#475569' : '#94A3B8',
                  }}
                >
                  <span className="truncate">{n.label}</span>
                  <span className="text-[9px] text-blue-500 font-sans mt-0.5">{n.sector}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. MATRICE COMPARATIVE DES 5 GÉNÉRATIONS DE MAINTENANCE
            ========================================================================= */}
        <section className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
                {isAr ? 'القفزة النوعية التكنولوجية' : 'L\'ÉVOLUTION DU PARADIGME INDUSTRIEL'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'مصفوفة الأجيال الخمسة لإدارة الأساطيل' : 'La Matrice des 5 Générations de Maintenance'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'لماذا تفشل أنظمة التتبع التقليدية في توفير عائد مالي حقيقي، وكيف تنفرد الصيانة 5.0 بالتوجيه الاقتصادي الحتمي.'
                  : 'Pourquoi les solutions traditionnelles de géolocalisation passive restent limitées et comment la Maintenance 5.0 transforme chaque signal en décision financière.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* 1.0 */}
              <div
                className="p-4 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">1.0</span>
                  <h4 className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'العلاجية / التفاعلية' : 'Réactive'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'إصلاح بعد الكسر على الطريق. تكاليف جر شاقة وتوقف مكلف للإنتاج.'
                      : 'Attendre la casse sur route. Dépannage d\'urgence, remorquage lourd et arrêt brutal de mission.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-red-500 font-bold">
                  {isAr ? 'خسائر مالية قصوى' : 'Pertes d\'exploitation max'}
                </div>
              </div>

              {/* 2.0 */}
              <div
                className="p-4 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">2.0</span>
                  <h4 className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'الوقائية العمياء' : 'Préventive Aveugle'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'جدول زمني أو كيلومتري ثابت. تبديل زيوت وقطع ما زالت قابلة للاستعمال.'
                      : 'Intervalles fixes (tous les 10 000 km). Fluides et plaquettes jetés prématurément.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-amber-500 font-bold">
                  {isAr ? 'هدر قطع وزيوت صالحة' : 'Gaspillage de consommables'}
                </div>
              </div>

              {/* 3.0 */}
              <div
                className="p-4 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">3.0</span>
                  <h4 className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'المشروطة بالحساسات' : 'Conditionnelle'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'أضواء لوحة القيادة. التنبيه يأتي متأخراً بعد أن يكون التلف قد بدأ بالفعل.'
                      : 'Voyants tableau de bord. Alerte tardive (>95°C) alors que l\'usure mécanique est amorcée.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-amber-500 font-bold">
                  {isAr ? 'تدخل متأخر بعد الإجهاد' : 'Alerte post-dégradation'}
                </div>
              </div>

              {/* 4.0 */}
              <div
                className="p-4 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">4.0</span>
                  <h4 className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'التنبؤية الإحصائية' : 'Prédictive ML'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'نماذج إحصائية احتمالية (صندوق أسود). إنذارات كاذبة وبدون تسعير مالي.'
                      : 'Modèles statistiques boîte noire. Faux positifs fréquents et zéro chiffrage en DZD.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-blue-500 font-bold">
                  {isAr ? 'احتمالات بدون قرار مالي' : 'Probabiliste sans ROI'}
                </div>
              </div>

              {/* 5.0 SOUVERAINE DOCTEURFLOTTE */}
              <div
                className="p-4 rounded-lg border-2 flex flex-col justify-between shadow-md relative overflow-hidden"
                style={{
                  backgroundColor: isLight ? '#EFF6FF' : '#0B1528',
                  borderColor: isLight ? '#2563EB' : '#38BDF8',
                }}
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-[9px] font-mono text-white px-2 py-0.5 rounded-bl font-bold">
                  DOCTEURFLOTTE
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-sky-400">5.0</span>
                  <h4 className="text-sm font-extrabold mt-1 text-blue-600 dark:text-sky-300">
                    {isAr ? 'التوجيهية السيادية' : 'Prescriptive 5.0'}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                    {isAr
                      ? 'فيزياء حتمية بتكلفة 0 دج. موازنة مالية تلقائية (تكلفة التدخل مقابل خطر التوقف)، ومساعد ورشة محلي.'
                      : 'Physique déterministe à 0 DA. Arbitrage financier SAD → ADS (Action immédiate vs Risque d\'inaction en DZD).'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-blue-200 dark:border-blue-900 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {isAr ? 'قرار مالي واقتصادي حتمي' : 'Décision opposable en DZD'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. ARCHITECTURE « OEM-FIRST & HARDWARE-AGNOSTIC » À 3 MODES
            ========================================================================= */}
        <section id="paliers" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
                {isAr ? 'مرونة تشغيلية تامة' : 'AGNOSTIQUE MATÉRIEL & IMMÉDIATETÉ'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'هندسة تشغيلية ثلاثية الأنماط (من اليوم الأول)' : 'Architecture à 3 Paliers d\'Exploitation'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'استغلال فوري من اليوم الأول دون انتظار تركيب أجهزة، مع قابلية الترقية التلقائية عند ربط التليماتيكس المتقدمة.'
                  : 'Déploiement instantané dès le Jour 1 sans attendre l\'installation de boîtiers, avec transition fluide vers la télémétrie profonde.'}
              </p>
            </div>

            {/* Onglets des 3 Modes */}
            <div className="flex justify-center mb-8">
              <div
                className="p-1 rounded-lg border inline-flex gap-1"
                style={{
                  backgroundColor: isLight ? '#EDF2F7' : '#111827',
                  borderColor: isLight ? '#CBD5E1' : '#1E293B',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTier(0)}
                  className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: activeTier === 0 ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                    color: activeTier === 0 ? (isLight ? '#1D4ED8' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8'),
                    boxShadow: activeTier === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {isAr ? 'النمط 0 : صفر جهاز (تصريحي)' : 'Mode 0 : Zéro Boîtier'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTier(1)}
                  className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: activeTier === 1 ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                    color: activeTier === 1 ? (isLight ? '#1D4ED8' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8'),
                    boxShadow: activeTier === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {isAr ? 'النمط 1 : تموضع وتتبع (GPS)' : 'Mode 1 : GPS Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTier(2)}
                  className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: activeTier === 2 ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                    color: activeTier === 2 ? (isLight ? '#1D4ED8' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8'),
                    boxShadow: activeTier === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {isAr ? 'النمط 2 : ناقل المحرك (CAN / J1939)' : 'Mode 2 : Full CAN / IoT'}
                </button>
              </div>
            </div>

            {/* Fiche Détail du Palier Actif */}
            <div
              className="p-6 md:p-8 rounded-xl border backdrop-blur-md transition-all"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#CBD5E1' : '#1E293B',
              }}
            >
              {activeTier === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold">
                      {isAr ? 'استغلال فوري' : 'DÉMARRAGE IMMÉDIAT J+1'}
                    </span>
                    <h4 className="text-lg font-bold mt-1">{isAr ? 'تتبع ذكي بصفر أجهزة مركبة' : 'Exploitation sans Aucun Matériel'}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {isAr
                        ? 'إدراج وصولات الوقود (مسح OCR)، مطابقة المسافات عبر التوجيه الطبوغرافي، وفحوصات السلامة الميدانية DVIR بدون إنترنت.'
                        : 'Réconciliation des tickets et cartes carburant, contrôle odométrique via routage topographique local, et formulaires d\'inspection DVIR mobiles PWA.'}
                    </p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>{isAr ? 'استيراد ومسح وصولات الوقود' : 'Scanner OCR & Rapprochement Carburant'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>{isAr ? 'توجيه طبوغرافي وحساب المسافات' : 'Routage topographique Valhalla auto-hébergé'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>{isAr ? 'تطبيق DVIR بدون إنترنت بهواتف السائقين' : 'PWA Mobile d\'inspection DVIR Offline-First'}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      {isAr ? 'العائد على الاستثمار الفوري :' : 'Bénéfice Immédiat :'}
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {isAr
                        ? 'كشف الفوارق الكيلومترية ومطابقة كميات الوقود المصرحة دون شراء أي جهاز.'
                        : 'Détection des anomalies de facturation carburant et dérive odométrique dès le premier jour, sans investissement matériel.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTier === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-500 font-bold">
                      {isAr ? 'المستوى الكلاسيكي المتقدم' : 'INGESTION TRACCAR AUTO-HÉBERGÉE'}
                    </span>
                    <h4 className="text-lg font-bold mt-1">{isAr ? 'تتبع جغرافي وسلوكي دقيق' : 'Géolocalisation & Éco-Conduite'}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {isAr
                        ? 'استقبال إحداثيات GPS، سرعة الحركة، التباطؤ والتسارع الحاد، مع مراقبة مسارات الممرات الحيوية عبر 58 ولاية.'
                        : 'Ingestion haute fréquence, surveillance des vitesses, accélérations/freinages violents et respect des corridors routiers des 58 Wilayas.'}
                    </p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-blue-500 shrink-0" />
                      <span>{isAr ? 'خادم تتبع محلي سيادي' : 'Traccar 6.x souverain sans dépendance étrangère'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-blue-500 shrink-0" />
                      <span>{isAr ? 'مراقبة الممرات الكبرى (طريق الوحدة الأفريقية، شرق-غرب)' : 'Corridors RN1 Transsaharienne & Autoroute A1'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-blue-500 shrink-0" />
                      <span>{isAr ? 'تخزين وإعادة إرسال عند الخروج من المناطق البيضاء' : 'Résilience Store-and-Forward dans les zones blanches'}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      {isAr ? 'ميزة المنصة :' : 'Spécificité DocteurFlotte :'}
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {isAr
                        ? 'معالجة الدفعات المتأخرة دون اختلال الترتيب الزمني بفضل تقنية TimescaleDB.'
                        : 'Absorption fluide des rafales télématiques lors du retour de couverture 4G après les traversées sahariennes.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTier === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-500 font-bold">
                      {isAr ? 'الصيانة 5.0 الكاملة' : 'TÉLÉMÉTRIE MOTEUR PROFONDE'}
                    </span>
                    <h4 className="text-lg font-bold mt-1">{isAr ? 'ربط مباشر بحاسوب المحرك (CAN / J1939)' : 'Bus CAN & J1939 Poids Lourds'}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {isAr
                        ? 'قراءة عزم المحرك، درجات حرارة الزيت والماء، انخفاض جهد الإقلاع، انسداد فلتر الجسيمات، وانزلاق علبة السرعات.'
                        : 'Acquisition des PGNs critiques : couple moteur, températures d\'huile et de liquide de refroidissement, chute de tension démarreur, contre-pression FAP.'}
                    </p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-purple-500 shrink-0" />
                      <span>{isAr ? 'تغذية التوأم الرقمي للأعضاء الستة' : 'Alimentation directe du Jumeau Numérique 6 Organes'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-purple-500 shrink-0" />
                      <span>{isAr ? 'كشف سحب الوقود عبر خوارزمية CUSUM' : 'Détection micro-fuite carburant & CUSUM Page-Hinkley'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IconCheck size={14} className="text-purple-500 shrink-0" />
                      <span>{isAr ? 'تشخيص أكواد الأعطال (DTC) مع كتيبات الصانع' : 'Décodage DTC instantané & fiches techniques OEM'}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      {isAr ? 'الأثر المالي المباشر :' : 'Impact Économique :'}
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {isAr
                        ? 'تجنب كسر المحركات في الطرق الصحراوية بتوفير يتجاوز 400 000 دج لكل عطب يتم تداركه.'
                        : 'Élimination des casses moteur sur route et remplacement ciblé à l\'atelier avant immobilisation lourde.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. JUMEAU NUMÉRIQUE & PHYSIQUE DÉTERMINISTE (6 ORGANES VITAUX)
            ========================================================================= */}
        <section id="organes" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
                {isAr ? 'الذكاء الاصطناعي الشفاف (XAI)' : 'PHYSIQUE EXPLICABLE SANS BOÎTE NOIRE'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'التوأم الرقمي للأعضاء الستة الحيوية' : 'Le Jumeau Numérique des 6 Organes d\'Usure'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'نمذجة فيزيائية دقيقة ومفسرة لكل عضو ميكانيكي. لا نعتمد على التخمين، بل على قوانين الفيزياء الحرارية، الكيميائية، والميكانيكية.'
                  : 'Chaque organe dispose de sa loi physique explicable et de son modèle d\'usure calibré sur les contraintes routières et climatiques nationales.'}
              </p>
            </div>

            {/* Grille des 6 Organes */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
              {[
                { id: 'OIL', labelFr: 'Huile Moteur', labelAr: 'زيت المحرك', icon: IconFuel },
                { id: 'BATTERY', labelFr: 'Batterie & Démarrage', labelAr: 'البطارية والإقلاع', icon: IconZap },
                { id: 'BRAKES', labelFr: 'Garnitures Freins', labelAr: 'فرامل التوقف', icon: IconCompass },
                { id: 'COOLING', labelFr: 'Circuit Culasse/Eau', labelAr: 'التبريد ورأس الأسطوانة', icon: IconActivity },
                { id: 'DPF', labelFr: 'Filtre FAP & Suie', labelAr: 'فلتر الجسيمات FAP', icon: IconLayers },
                { id: 'TRANSMISSION', labelFr: 'Boîte & Pont', labelAr: 'علبة السرعات والجسور', icon: IconWrench },
              ].map((org) => {
                const IconComponent = org.icon;
                const isSelected = activeOrgan === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setActiveOrgan(org.id as any)}
                    className="p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                    style={{
                      backgroundColor: isSelected
                        ? (isLight ? '#EFF6FF' : '#1E293B')
                        : (isLight ? '#FFFFFF' : '#0B111E'),
                      borderColor: isSelected
                        ? (isLight ? '#2563EB' : '#38BDF8')
                        : (isLight ? '#E2E8F0' : '#1E293B'),
                      color: isSelected
                        ? (isLight ? '#1D4ED8' : '#38BDF8')
                        : (isLight ? '#64748B' : '#94A3B8'),
                    }}
                  >
                    <IconComponent size={20} strokeWidth={2.2} />
                    <span className="text-[11px] font-bold font-sans">{isAr ? org.labelAr : org.labelFr}</span>
                  </button>
                );
              })}
            </div>

            {/* Détail Technique de l'Organe Sélectionné */}
            <div
              className="p-6 md:p-8 rounded-xl border backdrop-blur-md"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#CBD5E1' : '#1E293B',
              }}
            >
              {activeOrgan === 'OIL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-500 uppercase">
                      {"LOI THERMIQUE D'ARRHENIUS (Ea/R = 6 500 K)"}
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'أكسدة وتدهور زيت المحرك' : 'Cinétique d\'Oxydation de l\'Huile Moteur'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'حساب التدهور الكيميائي الحقيقي بناءً على الحرارة اللحظية للزيت، وفترات دوران المحرك في حالة سكون مع تشغيل المكيف في حرارة الصحراء.'
                        : 'Calcul du vieillissement thermique réel. La vitesse d\'oxydation double tous les 10°C au-delà de 90°C. Ajustement strict selon la sévérité bioclimatique saharienne.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Paramètre critique : Viscosité cinématique résiduelle (cSt)</div>
                      <div>• Seuil d&apos;alerte : Dégradation &gt; 80 % ou suie &gt; 3.5 %</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Véhicule : Tracteur Routier 4x2 (Mission Alger-Ouargla)</div>
                    <div className="text-amber-400">RUL Huile estimée : 1 200 km (Arrhenius Ea/R=6500K)</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action préventive : Vidange atelier (Coût : 28 500 DZD) vs Risque inaction : Casse embiellage (Coût estimé : 650 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 621 500 DZD</div>
                  </div>
                </div>
              )}

              {activeOrgan === 'BATTERY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-500 uppercase">
                      MODÈLE CVHI (CRANKING VOLTAGE HEALTH INDEX)
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'جهد بدء التشغيل ومقاومة البطارية' : 'Santé Dynamique de la Batterie au Démarrage'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'قياس انخفاض الجهد الأدنى أثناء تشغيل المحرك (Vmin). الإنذار التلقائي إذا نزل الجهد عن 9.60 فولت قبل أن يتعطل الشاحن في منطقة نائية.'
                        : 'Capture haute fréquence de la chute de tension sous démarreur (Vmin). Détection de la hausse d\'impédance interne avant la panne brutale au premier démarrage matinal.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Seuil critique : Vmin &lt; 9.60 V (Circuit 12V) / 19.20 V (Circuit 24V)</div>
                      <div>• Détection alternateur : Tension de charge &lt; 27.2 V en roulage</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Actif : Semi-remorque Citerne Hydrocarbures</div>
                    <div className="text-amber-400">Vmin mesuré : 9.15 V à 05:30 (SOH Critique : 38 %)</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action préventive : Remplacement batterie au dépôt (Coût : 32 000 DZD) vs Risque : Dépannage autoroutier A1 + retard citerne (Coût estimé : 125 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 93 000 DZD</div>
                  </div>
                </div>
              )}

              {activeOrgan === 'BRAKES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-red-500 uppercase">
                      {"LOIS TRIBOLOGIQUES D'ARCHARD & DÉVERS ROUTIER"}
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'تآكل بطانات وأقراص الفرامل' : 'Usure Tribologique des Garnitures de Frein'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'حساب الطاقة الحركية المبددة على أقراص الفرامل مع خصم تفعيل المبدئ الهيدروليكي (Retarder) وتأثير المنحدرات الحادة في الطرق الجبلية.'
                        : 'Intégration de l\'énergie dissipée cumulée (1/2 m Δv²) compensée par les descentes topographiques et déduction faite du freinage par ralentisseur hydraulique J1939.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Paramètre : Énergie dissipée par essieu (MJ)</div>
                      <div>• Compensation : Ralentisseur hydraulique / sur échappement</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Actif : Camion Porteur 8x4 Carrière (Col des Caravanes)</div>
                    <div className="text-amber-400">Épaisseur restante estimée : 3.8 mm (Seuil mini : 3.0 mm)</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action préventive : Remplacement plaquettes planifié (Coût : 45 000 DZD) vs Risque : Usure disques métal sur métal (Coût estimé : 240 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 195 000 DZD</div>
                  </div>
                </div>
              )}

              {activeOrgan === 'COOLING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-500 uppercase">
                      MODÈLE THERMIQUE EWMA (DIFFÉRENTIEL HUILE/EAU)
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'نظام التبريد ووقاية رأس الأسطوانة' : 'Différentiel Thermique & Prévention Culasse'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'مراقبة الفارق الحراري بين زيت المحرك وسائل التبريد لمنع اعوجاج رأس الأسطوانة، خاصة في المرتفعات الجبلية وحرارة الصيف.'
                        : 'Modélisation différentielle ΔT = |Thuile - Teau|. Détection précoce du colmatage radiateur et de la défaillance thermostat avant rupture du joint de culasse.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Alerte précoce : Résidu thermique &gt; +7.5°C sur 15 min</div>
                      <div>• Protection absolue : Arrêt prescriptif avant voilage culasse</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Actif : Autocar Interwilayas 55 Places</div>
                    <div className="text-amber-400">Résidu EWMA : +8.2°C dans la montée de Bouira</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action préventive : Nettoyage faisceau radiateur (Coût : 15 000 DZD) vs Risque : Voilage culasse moteur (Coût estimé : 480 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 465 000 DZD</div>
                  </div>
                </div>
              )}

              {activeOrgan === 'DPF' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-500 uppercase">
                      BILAN MASSIQUE DE SUIE (DARCY-FORCHHEIMER)
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'تراكم السخام وانسداد فلتر FAP' : 'Contre-Pression & Accumulation de Suie FAP'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'قياس انخفاض الضغط عبر فلتر الجسيمات لمنع انسداده التام، مع توجيه السائقين لدورات التجديد على الطرق السريعة.'
                        : 'Calcul de la perméabilité du filtre d\'échappement. Déclenchement de régénérations passives programmées évitant le remplacement coûteux du filtre colmaté.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Seuil de colmatage : ΔP &gt; 45 mbar à régime stabilisé</div>
                      <div>• Algorithme : Recommandation d&apos;itinéraire de décalaminage</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Actif : Fourgonnette Livraison Urbaine Grand Alger</div>
                    <div className="text-amber-400">Masse suie : 38 g (Seuil régénération forcée : 40 g)</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action : Régénération active sur voie rapide (Coût : 4 500 DZD) vs Risque : FAP colmaté irréversible (Coût estimé : 280 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 275 500 DZD</div>
                  </div>
                </div>
              )}

              {activeOrgan === 'TRANSMISSION' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-500 uppercase">
                      MICRO-GLISSEMENT SOUS COUPLE J1939 (SPN 524 / 191)
                    </span>
                    <h4 className="text-xl font-bold mt-1">
                      {isAr ? 'انزلاق علبة السرعات وزيت الجسور' : 'Micro-Glissement Transmission & Huile de Pont'}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-500 mt-3">
                      {isAr
                        ? 'مقارنة نسبة دوران المحرك وسرعة عمود نقل الحركة تحت الحمل الثقيل لكشف تآكل أسطوانة القابض قبل انقطاع الدوران.'
                        : 'Détection du patinage de l\'embrayage sous couple maximal et surveillance du cisaillement thermique des huiles de pont lourd 80W90.'}
                    </p>
                    <div className="mt-4 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>• Rapport dynamique : Vitesse arbre entrée vs sortie boîte</div>
                      <div>• Seuil d&apos;usure embrayage : Glissement &gt; 3.2 % sous couple max</div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                    <div className="text-emerald-400 font-bold text-[10px]">SIMULATION ARBITRAGE SAD ➔ ADS :</div>
                    <div className="text-slate-300">Actif : Benne Céréalière 40 Tonnes (Hauts-Plateaux)</div>
                    <div className="text-amber-400">Micro-glissement détecté : 4.1 % en montée 6ème</div>
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      Action : Remplacement kit embrayage programmé (Coût : 85 000 DZD) vs Risque : Rupture sur RN5 + remorquage (Coût estimé : 380 000 DZD).
                    </div>
                    <div className="text-emerald-400 font-bold">ÉCONOMIE NETTE PRÉSERVÉE : 295 000 DZD</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. HUISSIER CUSUM ANTI-FRAUDE & DOSSIER TECHNIQUE PDF (SHA-256)
            ========================================================================= */}
        <section id="carburant" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-3">
                  <IconShieldCheck size={12} />
                  <span>{isAr ? 'الإثبات القانوني ومكافحة السرقة' : 'HUISSIER JURIDIQUE & TRAÇABILITÉ CARBURANT'}</span>
                </div>
                <h3
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                  style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
                >
                  {isAr
                    ? 'كشف سحب الوقود عبر خوارزمية CUSUM والتعويض الطبوغرافي'
                    : 'Détection Infaillible des Siphonnages par CUSUM & Dossier PDF Opposable'}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 mb-6">
                  {isAr
                    ? 'القضاء التام على الإنذارات الكاذبة الناتجة عن ميلان الشاحنات في المنحدرات والمنعرجات بفضل ربط نموذج الارتفاع الطبوغرافي بموضع مقياس الخزان. وعند التأكد من السرقة، تصدر المنصة تلقائياً ملف إثبات تقني موقع ببصمة SHA-256 صالح للإجراءات التأديبية والقانونية.'
                    : 'Fini les fausses alertes provoquées par le ballottement en virage ou le dévers routier dans les Gorges de la Chiffa. Notre algorithme CUSUM intègre la topographie réelle de la route. En cas de vol avéré, un Dossier d\'Expertise Technique (DET) infalsifiable avec empreinte SHA-256 est généré en 1 clic.'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <IconCheck size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold">{isAr ? 'تعويض ميلان الطريق والمنحدرات' : 'Compensation Topographique Valhalla'}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAr ? 'حساب زاوية ميلان الخزان وموضع الحساس لإلغاء التغيرات الوهمية في المنسوب.' : 'Élimine 100 % des faux positifs lors des montées et descentes de cols.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <IconCheck size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold">{isAr ? 'ملف إثبات تقني موقع إلكترونياً (SHA-256)' : 'Dossier d\'Expertise Technique Opposable'}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAr ? 'تقرير رسمي فوري يتضمن منحنى السحب، الإحداثيات، والتوقيت لتقديمه للإدارة.' : 'Rapport PDF infalsifiable recevable en commission de discipline et aux contentieux.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aperçu Visuel du Dossier Technique */}
              <div
                className="p-6 rounded-xl border font-mono text-xs shadow-xl"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#CBD5E1' : '#1E293B',
                }}
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-red-600 dark:text-red-400">DOSSIER TECHNIQUE : DET-2026-0841</span>
                  </div>
                  <span className="text-[10px] text-slate-400">SHA-256 : 9e4b...d12a</span>
                </div>

                <div className="py-4 space-y-2.5 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Véhicule concerné :</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Tracteur Routier SNVI TB400 (Flotte Fret)</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Localisation précise :</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">RN1 PK 214 (Wilaya de Ghardaïa)</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Chute nette réservoir :</span>
                    <span className="font-bold text-red-500">-78 Litres en 14 minutes</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Statut moteur :</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Arrêté / Contact coupé à 02:43</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Validation topographique :</span>
                    <span className="font-bold text-emerald-500">Pente route 0.2 % (Faux positif exclu)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Préjudice chiffré : 2 262 DZD</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold border border-red-500/20">
                    SIPHONNAGE CONFIRMÉ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. MATRICE BIOCLIMATIQUE & SÉVÉRITÉ DES 58 WILAYAS D'ALGÉRIE
            ========================================================================= */}
        <section id="wilayas" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                {isAr ? 'الواقع الجزائري أولاً' : 'CALIBRAGE BIOCLIMATIQUE NATIONAL'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'معايرة دقيقة لظروف التشغيل عبر 58 ولاية' : 'Calibrage Physique sur les 58 Wilayas d\'Algérie'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'الشاحنة التي تشتغل في رطوبة وازدحام العاصمة ليست كالشاحنة التي تعبر صقيع الهضاب العليا أو تواجه رمال وحرارة حاسي مسعود بـ 49 درجة مئوية.'
                  : 'Les moteurs subissent des contraintes radicalement différentes selon la zone géographique. Nos modèles appliquent les coefficients de sévérité exacts de chaque Wilaya.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="p-5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-500">ZONE 1</span>
                  <h4 className="text-base font-bold mt-1">{isAr ? 'الساحل والشريط التلي' : 'Littoral & Tell'}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'رطوبة بحرية عالية، تآكل كهروكيميائي، وازدحام مروري حضري يسبب فترات سكون طويلة بمحرك شغال.'
                      : 'Humidité saline, corrosion châssis et trafic urbain dense générant du ralenti prolongé.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  Alger • Oran • Annaba
                </div>
              </div>

              <div
                className="p-5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-sky-500">ZONE 2</span>
                  <h4 className="text-base font-bold mt-1">{isAr ? 'الهضاب العليا والسهوب' : 'Hauts-Plateaux'}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'فوارق حرارية شاسعة (-5 درجات شتاء إلى 40 صيفاً)، مما يجهد خلايا البطارية وبدء التشغيل الصباحي.'
                      : 'Amplitudes thermiques violentes (-5°C l\'hiver à 40°C l\'été), stress maximal au démarrage.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  Sétif • Djelfa • Batna
                </div>
              </div>

              <div
                className="p-5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-500">ZONE 3</span>
                  <h4 className="text-base font-bold mt-1">{isAr ? 'سلسلة جبال الأطلس' : 'Gorges & Relief Atlas'}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'منحدرات حادة مستمرة تتطلب كبحاً متواصلاً، وتسارع في تآكل بطانات الفرامل وحرارة سائل التبريد.'
                      : 'Fortes déclivités continues, surchauffe du système de freinage et stress thermique culasse.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  Médéa • Bouira • Kherrata
                </div>
              </div>

              <div
                className="p-5 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-500">ZONE 4</span>
                  <h4 className="text-base font-bold mt-1">{isAr ? 'الصحراء الكبرى وحقول الطاقة' : 'Sahara Profond'}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {isAr
                      ? 'حرارة قصوى حتى 49 مئوية، غبار وسيليكا تسد الفلاتر، وتكلفة نجدة وجر مضاعفة في المسالك المعزولة (75 000 دج).'
                      : 'Canicule jusqu\'à 49°C, silice abrasive et forfait de dépannage calibré à 75 000 DZD au Sud.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  Ouargla • In Salah • Tamanrasset
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. ASSISTANT D'ATELIER EN LANGAGE NATUREL & DIALECTAL (TERMINAL INTERACTIF)
            ========================================================================= */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <TerminalSimulator isAr={isAr} isLight={isLight} />
          </div>
        </section>

        {/* =========================================================================
            SECTION COMMENT ÇA MARCHE EN 4 ÉTAPES
            ========================================================================= */}
        <HowItWorksSection isAr={isAr} isLight={isLight} />

        {/* =========================================================================
            SECTION INTÉGRATIONS & ÉCOSYSTÈME OUVERT
            ========================================================================= */}
        <IntegrationsSection isAr={isAr} isLight={isLight} />

        {/* =========================================================================
            9. CALCULATEUR INTERACTIF DE RENTABILITÉ & ROI EN DINARS (5 À 1 000 ACTIFS)
            ========================================================================= */}
        <section id="simulateur" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                {isAr ? 'الجدوى الاقتصادية والأرباح الصافية' : 'ACTUARIAT & ÉCONOMIE NETTE'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'حاسبة العائد المالي السنوي بالدينار الجزائري' : 'Simulateur d\'Économie Réelle sur Flotte'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'حدد حجم أسطولك (من 5 إلى 1 000 مركبة) والمسافة الشهرية لمشاهدة حجم التوفير الحقيقي في فاتورة المحروقات، وحماية المحركات من الكسر، وتقليص أيام العطل.'
                  : 'Ajustez la taille de votre parc (de 5 à 1 000 actifs) et vos kilomètres mensuels pour calculer immédiatement votre rentabilité nette annuelle en Dinars Algériens (DZD).'}
              </p>
            </div>

            <div
              className="p-6 md:p-10 rounded-2xl border backdrop-blur-md shadow-xl"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#CBD5E1' : '#1E293B',
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Colonne Paramètres Réglables */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Sélecteur d'Activité */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                      {isAr ? 'قطاع النشاط التشغيلي :' : 'Secteur d\'Activité Opérationnel :'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      {SECTORS.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setFleetSector(sec.id)}
                          className="py-2 px-3 rounded-md border text-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                          style={{
                            backgroundColor:
                              fleetSector === sec.id
                                ? (isLight ? '#EFF6FF' : '#1E3A8A')
                                : (isLight ? '#F8FAFC' : '#111827'),
                            borderColor:
                              fleetSector === sec.id
                                ? (isLight ? '#2563EB' : '#3B82F6')
                                : (isLight ? '#E2E8F0' : '#1E293B'),
                            color:
                              fleetSector === sec.id
                                ? (isLight ? '#1D4ED8' : '#FFFFFF')
                                : (isLight ? '#64748B' : '#94A3B8'),
                          }}
                        >
                          {isAr ? sec.labelAr : sec.labelFr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sélecteur Rapide & Slider 1 : Taille de Flotte (5 à 1 000 Actifs) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                      <span>{isAr ? 'حجم الأسطول (من 5 إلى 1 000 مركبة) :' : 'Taille de la Flotte (5 à 1 000 Actifs Roulants) :'}</span>
                      <span className="font-mono text-sm text-blue-600 dark:text-sky-400 font-extrabold">
                        {fleetSize.toLocaleString()} {isAr ? 'مركبة' : 'véhicules'}
                      </span>
                    </div>

                    {/* Boutons d'accès rapide aux échelles de flotte */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {[10, 30, 50, 100, 250, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFleetSize(preset)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                          style={{
                            backgroundColor:
                              fleetSize === preset
                                ? (isLight ? '#2563EB' : '#3B82F6')
                                : (isLight ? '#F1F5F9' : '#1E293B'),
                            color: fleetSize === preset ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8'),
                            border: `1px solid ${
                              fleetSize === preset
                                ? (isLight ? '#1D4ED8' : '#60A5FA')
                                : (isLight ? '#E2E8F0' : '#334155')
                            }`,
                          }}
                        >
                          {preset === 1000 ? '1 000' : preset} {isAr ? 'مركبة' : 'act.'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min={5}
                      max={1000}
                      step={5}
                      value={fleetSize}
                      onChange={(e) => setFleetSize(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                      aria-label={isAr ? 'حجم الأسطول' : 'Taille de la flotte'}
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>5</span>
                      <span>100</span>
                      <span>250</span>
                      <span>500</span>
                      <span>750</span>
                      <span>1 000</span>
                    </div>
                  </div>

                  {/* Slider 2 : Kilométrage Mensuel */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                      <span>{isAr ? 'المسافة المقطوعة شهرياً للمركبة :' : 'Kilométrage Mensuel Moyen par Actif :'}</span>
                      <span className="font-mono text-sm text-blue-600 dark:text-sky-400">
                        {monthlyKm.toLocaleString()} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={18000}
                      step={500}
                      value={monthlyKm}
                      onChange={(e) => setMonthlyKm(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                      aria-label={isAr ? 'المسافة الشهرية' : 'Kilométrage mensuel'}
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>2 000 km</span>
                      <span>8 000 km</span>
                      <span>14 000 km</span>
                      <span>18 000 km</span>
                    </div>
                  </div>
                </div>

                {/* Colonne Résultats Financiers en DZD avec Explication Minimale */}
                <div
                  className="lg:col-span-6 p-6 rounded-xl border flex flex-col justify-between"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : '#070A10',
                    borderColor: isLight ? '#CBD5E1' : '#1E293B',
                  }}
                >
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                        {isAr ? 'التقدير المالي المبرهن للأرباح السنوية' : 'Bilan Financier & Justification Actuarielle'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ROI {calculatedSavings.netRoiRatio}x
                      </span>
                    </div>

                    <div className="py-4 space-y-4 font-mono text-xs">
                      {/* Poste 1 : Économie Carburant */}
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-700 dark:text-slate-300">
                            <span>{isAr ? 'توفير استهلاك وسحب الوقود :' : 'Économie Carburant & Siphonnage :'}</span>
                            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-normal">
                              ~{calculatedSavings.annualLitersSaved.toLocaleString()} L/an
                            </span>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {calculatedSavings.fuelSavingsDzd.toLocaleString()} DZD
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-slate-500 leading-tight">
                          {isAr ? calculatedSavings.fuelExplanationAr : calculatedSavings.fuelExplanationFr}
                        </p>
                      </div>

                      {/* Poste 2 : Casses Moteur Évitées */}
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-700 dark:text-slate-300">
                            <span>{isAr ? 'كوارث ميكانيكية متفادية :' : 'Casses Moteur & Organes Évitées :'}</span>
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-normal">
                              {calculatedSavings.criticalBreakdownsAvoidedPerYear} {isAr ? 'عطب جسيم' : 'avaries'}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {calculatedSavings.breakdownSavingsDzd.toLocaleString()} DZD
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-slate-500 leading-tight">
                          {isAr ? calculatedSavings.breakdownExplanationAr : calculatedSavings.breakdownExplanationFr}
                        </p>
                      </div>

                      {/* Poste 3 : Jours d'Immobilisation Sauvegardés */}
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-700 dark:text-slate-300">
                            <span>{isAr ? 'أيام توقف مسترجعة :' : 'Jours d\'Immobilisation Sauvegardés :'}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-normal">
                              {calculatedSavings.daysDowntimeSaved} {isAr ? 'يوم' : 'jours'}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {calculatedSavings.downtimeSavingsDzd.toLocaleString()} DZD
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-slate-500 leading-tight">
                          {isAr ? calculatedSavings.downtimeExplanationAr : calculatedSavings.downtimeExplanationFr}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-800">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {isAr ? 'صافي الربح السنوي المتوقع (دينار جزائري) :' : 'ÉCONOMIE NETTE TOTALE ANNUELLE :'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isAr ? 'بعد خصم تكاليف المنصة' : 'Net de redevance'}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {calculatedSavings.totalSavingsDzd.toLocaleString()} DZD
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-sans leading-relaxed">
                      {isAr
                        ? 'محسوبة وفق الأسعار المقننة للوقود، وتكلفة الإخفاق الميكانيكي، وتكلفة التوقف اليومية المقدرة بـ 25 000 دج/يوم، مع احتساب اشتراك المنصة المخفض للأساطيل الكبرى.'
                        : 'Calcul actuariel déterministe fondé sur les tarifs administrés nationaux, les coûts de réfection moteur constatés et l\'indemnité journalière d\'arrêt (25 000 DZD/j), tarif grand compte dégressif inclus.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            10. SOUVERAINETÉ ABSOLUE & CONFORMITÉ LÉGALE (LOI 18-07 ANPDP)
            ========================================================================= */}
        <section id="souverainete" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs font-mono font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase mb-2">
                {isAr ? 'الأمان والسيادة الرقمية التامة' : 'CONFORMITÉ RÉGLEMENTAIRE & SÉCURITÉ'}
              </h2>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr ? 'مطابقة صارمة للقانون 18-07 لحماية المعطيات' : 'Souveraineté Absolue & Conformité Loi 18-07'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAr
                  ? 'بيانات أسطولكم لا تغادر التراب الوطني إطلاقاً. حماية البيانات الشخصية للسائقين عبر التجريد المادي، وعزل تام لقواعد البيانات بين المؤسسات.'
                  : 'Aucune donnée sensible ne franchit les frontières nationales. Hébergement souverain local, anonymisation matérielle des chauffeurs et isolation stricte PostgreSQL Fail-Closed.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="p-6 rounded-xl border"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                  <IconShieldCheck size={20} strokeWidth={2.2} />
                </div>
                <h4 className="text-base font-bold mb-2">{isAr ? 'استضافة محلية 100% على التراب الوطني' : 'Hébergement Local Souverain'}</h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  {isAr
                    ? 'قواعد البيانات ومحركات الذكاء الاصطناعي تعمل على بنية تحتية محلية دون أي اتصال بخوادم أجنبية.'
                    : 'Bases de données hébergées sur le territoire national, garantissant l\'indépendance géopolitique totale.'}
                </p>
              </div>

              <div
                className="p-6 rounded-xl border"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  <IconCpu size={20} strokeWidth={2.2} />
                </div>
                <h4 className="text-base font-bold mb-2">{isAr ? 'عزل تام للبيانات (Fail-Closed RLS)' : 'Isolation Multi-Tenant Étanche'}</h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  {isAr
                    ? 'فصل مشفر ومحكم لكل مؤسسة. يستحيل الوصول إلى سجلات أي زبون من حساب آخر بفضل سياسات الصفوف الأمنية.'
                    : 'Sécurité RLS (Row Level Security) native dans PostgreSQL. Cloisonnement étanche et infranchissable par organisation.'}
                </p>
              </div>

              <div
                className="p-6 rounded-xl border"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
                  <IconNavigation size={20} strokeWidth={2.2} />
                </div>
                <h4 className="text-base font-bold mb-2">{isAr ? 'تطبيق ميداني يعمل في المناطق المعزولة' : 'PWA Mobile 100% Déconnectée'}</h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  {isAr
                    ? 'عمل متواصل في الصحراء بدون شبكة إنترنت. تخزين محلي مشفر ومزامنة تلقائية بمجرد عودة التغطية.'
                    : 'Application mobile d\'inspection DVIR Offline-First. Persistance locale sécurisée et synchronisation automatique au retour réseau.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION TÉMOIGNAGES CLIENTS
            ========================================================================= */}
        <TestimonialsSection isAr={isAr} isLight={isLight} />

        {/* =========================================================================
            SECTION FAQ INTERACTIVE
            ========================================================================= */}
        <FaqSection isAr={isAr} isLight={isLight} />

        {/* =========================================================================
            11. BANNIÈRE D'APPEL À L'ACTION (CTA FINAL)
            ========================================================================= */}
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 p-10 md:p-14 rounded-3xl text-center relative overflow-hidden shadow-2xl border"
            style={{
              background: isLight
                ? 'linear-gradient(135deg, #1E3A8A 0%, #0369A1 100%)'
                : 'linear-gradient(135deg, #0B1736 0%, #0C284A 100%)',
              borderColor: isLight ? '#3B82F6' : '#1E3A8A',
              color: '#FFFFFF',
            }}
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-300 uppercase block mb-3">
                {isAr ? 'جاهزية تشغيلية فورية' : 'TRANSITION VERS LA MAINTENANCE 5.0'}
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                {isAr
                  ? 'ابدأ في حماية أسطولك وتحقيق وفورات حقيقية اليوم'
                  : 'Passez de la Télémétrie Passive à la Décision Économique 5.0'}
              </h3>
              <p className="text-sm text-sky-100 leading-relaxed mb-8">
                {isAr
                  ? 'انضم إلى المؤسسات الصناعية الرائدة التي اختارت السيادة التكنولوجية والأرباح الصافية المضمونة.'
                  : 'Activez votre organisation en Mode 0 dès aujourd\'hui, sans aucun investissement matériel préalable, ou intégrez votre flotte existante.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold bg-white text-blue-900 shadow-md hover:bg-slate-100 transition-all cursor-pointer text-decoration-none"
                >
                  {isAr ? 'إنشاء حساب مؤسسة جديد' : 'Créer un Compte Entreprise'}
                </Link>
                <Link
                  href="/live-cockpit"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition-all cursor-pointer text-decoration-none"
                >
                  {isAr ? 'معاينة قمرة القيادة المباشرة' : 'Démonstration Live Cockpit'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          12. FOOTER SOUVERAIN DE HAUTE PRÉCISION
          ========================================================================= */}
      <footer
        className="w-full py-12 border-t text-xs transition-colors"
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#05070B',
          borderColor: isLight ? '#E2E8F0' : '#1E293B',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Colonne 1 : Identité */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-xs"
                  style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)' }}
                >
                  <IconTruck size={14} />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-blue-600 dark:text-sky-400">
                  DOCTEUR<span style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>FLOTTE</span>
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px] mb-3">
                {isAr
                  ? 'المنصة الوطنية الرائدة في تليماتيكس الأساطيل والصيانة التوجيهية الحتمية 5.0. مطابقة كاملة للتشريعات القانونية والجبائية الوطنية.'
                  : 'Plateforme souveraine de télémétrie, IoT multi-métiers et Maintenance 5.0 prescriptive. Conçue pour résister aux contraintes extrêmes du terrain national.'}
              </p>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ CONFORME LOI 18-07 (ANPDP) • HÉBERGEMENT NATIONAL
              </div>
            </div>

            {/* Colonne 2 : Cockpits & Modules */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-3 uppercase tracking-wider text-[11px]">
                {isAr ? 'وحدات التحكم' : 'Cockpits & Modules'}
              </span>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/live-cockpit" className="hover:text-blue-500 transition-colors">Cockpit Temps Réel</Link></li>
                <li><Link href="/digital-twin" className="hover:text-blue-500 transition-colors">Jumeau Numérique 6 Organes</Link></li>
                <li><Link href="/decisions" className="hover:text-blue-500 transition-colors">Moteur d&apos;Arbitrage SAD → ADS</Link></li>
                <li><Link href="/assets" className="hover:text-blue-500 transition-colors">Inventaire des Actifs</Link></li>
                <li><Link href="/dvir" className="hover:text-blue-500 transition-colors">Inspections DVIR PWA</Link></li>
              </ul>
            </div>

            {/* Colonne 3 : Spécificités & Lois */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-3 uppercase tracking-wider text-[11px]">
                {isAr ? 'الفيزياء والمعايير' : 'Physique & Normes'}
              </span>
              <ul className="space-y-2 text-slate-500">
                <li><span>Cinétique d&apos;Arrhenius Huile</span></li>
                <li><span>Santé Dynamique CVHI Batterie</span></li>
                <li><span>Usure Tribologique Archard</span></li>
                <li><span>Résidu Thermique Culasse EWMA</span></li>
                <li><span>Détection CUSUM &amp; Topographie</span></li>
              </ul>
            </div>

            {/* Colonne 4 : Conformité & Accès */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-3 uppercase tracking-wider text-[11px]">
                {isAr ? 'الحساب والأمان' : 'Espace & Accès'}
              </span>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/login" className="hover:text-blue-500 transition-colors">Connexion Organisation</Link></li>
                <li><Link href="/register" className="hover:text-blue-500 transition-colors">Créer un Compte</Link></li>
                <li><Link href="/guide" className="hover:text-blue-500 transition-colors">Documentation Technique</Link></li>
                <li><Link href="/admin" className="hover:text-blue-500 transition-colors">Console Administrateur</Link></li>
              </ul>
            </div>
          </div>

          {/* Mentions Bas de Page */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              © 2026-2027 DOCTEURFLOTTE • Tous droits réservés. Plateforme de Télémétrie Souveraine.
            </div>
            <div className="flex gap-4 font-mono">
              <span>EPSG:3857 WEB MERCATOR</span>
              <span>SHA-256 INTEGRITY AUDITED</span>
              <span>100% ZERO CLOUD EXTERNE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
