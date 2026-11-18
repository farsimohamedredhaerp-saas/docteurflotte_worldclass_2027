'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';
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

export function LandingPageClient() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Sélecteur de langue bilingue (Français / Arabe avec support RTL)
  const [lang, setLang] = useState<'FR' | 'AR'>('FR');
  const isAr = lang === 'AR';

  // 1. État du sélecteur de mode télématique (Mode 0 / Mode 1 / Mode 2)
  const [activeTier, setActiveTier] = useState<0 | 1 | 2>(2);

  // 2. État du sélecteur d'organe Jumeau Numérique
  const [activeOrgan, setActiveOrgan] = useState<
    'OIL' | 'BATTERY' | 'BRAKES' | 'COOLING' | 'DPF' | 'TRANSMISSION'
  >('OIL');

  // 3. État du simulateur d'assistant d'atelier
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<{
    query: string;
    action: string;
    details: string;
    rule: string;
    latencyMs: number;
  } | null>(null);

  // 4. État du simulateur de rentabilité financière (DZD)
  const [fleetSize, setFleetSize] = useState<number>(45);
  const [monthlyKm, setMonthlyKm] = useState<number>(8500);
  const [fleetSector, setFleetSector] = useState<'FREIGHT' | 'CONSTRUCTION' | 'DISTRIBUTION' | 'SAHARA'>('FREIGHT');

  // Calcul actuarial en temps réel du ROI
  const calculatedSavings = useMemo(() => {
    // Économie carburant estimée (détection surconsommation et siphonnage CUSUM : 7% à 12%)
    const fuelRatePer100Km = fleetSector === 'CONSTRUCTION' ? 38 : fleetSector === 'SAHARA' ? 36 : 31;
    const nationalFuelCostDzd = 29.0; // Barème national administré Gasoil
    const annualLiters = (fleetSize * monthlyKm * 12 * fuelRatePer100Km) / 100;
    const fuelSavingsDzd = Math.round(annualLiters * 0.085 * nationalFuelCostDzd);

    // Économie sur casses mécaniques et voilages culasse évités (modèle déterministe)
    const criticalBreakdownsAvoidedPerYear = Math.max(1, Math.round(fleetSize * 0.14));
    const avgEngineRepairDzd = 480000; // Coût moyen d'une casse moteur / culasse
    const breakdownSavingsDzd = criticalBreakdownsAvoidedPerYear * avgEngineRepairDzd;

    // Économie sur immobilisations (25 000 DZD / jour)
    const daysDowntimeSaved = criticalBreakdownsAvoidedPerYear * 4.5;
    const downtimeSavingsDzd = Math.round(daysDowntimeSaved * 25000);

    // Économie totale annuelle nette
    const totalSavingsDzd = fuelSavingsDzd + breakdownSavingsDzd + downtimeSavingsDzd;

    // Coût estimé de l'abonnement souverain
    const platformAnnualCostDzd = fleetSize * 1500 * 12;
    const netRoiRatio = +(totalSavingsDzd / platformAnnualCostDzd).toFixed(1);

    return {
      fuelSavingsDzd,
      breakdownSavingsDzd,
      downtimeSavingsDzd,
      totalSavingsDzd,
      daysDowntimeSaved: Math.round(daysDowntimeSaved),
      criticalBreakdownsAvoidedPerYear,
      netRoiRatio,
    };
  }, [fleetSize, monthlyKm, fleetSector]);

  // Exemples de requêtes d'atelier pour le terminal interactif
  const sampleVoicePrompts = [
    {
      labelFr: 'Contrôler viscosité huile et délai vidange',
      labelAr: 'فحص لزوجة الزيت وموعد التغيير',
      query: 'choufli zit el moteur w chhal mazalelha',
      action: 'ANALYSE_VISCOSITÉ_HUILE',
      details: 'Viscosité cinématique nominale : 14.2 cSt. RUL estimée : 3 400 km selon la cinétique d\'Arrhenius.',
      rule: 'Norme thermique Arrhenius Ea/R=6500K',
      latencyMs: 18,
    },
    {
      labelFr: 'Couple de serrage culasse constructeur',
      labelAr: 'عزم ربط براغي رأس الأسطوانة',
      query: 'serrage culasse couple constructeur',
      action: 'FICHE_TECHNIQUE_OEM_SERRAGE',
      details: 'Passe 1 : 60 Nm • Passe 2 : 120 Nm • Passe 3 : Serrage angulaire 90° • Ordre hélicoïdal centre vers extérieur.',
      rule: 'Spécification technique structurée sans hallucination',
      latencyMs: 24,
    },
    {
      labelFr: 'Test de tension batterie avant départ Adrar',
      labelAr: 'اختبار جهد البطارية قبل الانطلاق إلى أدرار',
      query: 'aatini l batterie w demarrage avant depart saharien',
      action: 'SOH_DYNAMIC_CRANKING',
      details: 'Tension résiduelle : 24.4 V. Chute sous démarreur Vmin : 10.2 V (> 9.60 V). Autorisation de mission validée.',
      rule: 'Modèle CVHI impédance interne de démarrage',
      latencyMs: 15,
    },
  ];

  const handleRunPrompt = (item: (typeof sampleVoicePrompts)[0]) => {
    setTerminalInput(item.query);
    setTerminalOutput(item);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: isLight ? '#F8FAFC' : '#070A10',
        color: isLight ? '#0F172A' : '#F1F5F9',
        overflowX: 'hidden',
      }}
    >
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
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none group">
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
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            <a
              href="#paliers"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'الهندسة المعمارية (3 أنماط)' : '3 Paliers OEM'}
            </a>
            <a
              href="#organes"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'الفيزياء الحتمية (6 أعضاء)' : 'Jumeau 6 Organes'}
            </a>
            <a
              href="#carburant"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'مكافحة سرقة الوقود CUSUM' : 'Anti-Fraude CUSUM'}
            </a>
            <a
              href="#wilayas"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? '58 ولاية والمناخ' : 'Résilience 58 Wilayas'}
            </a>
            <a
              href="#simulateur"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'حاسبة العائد المالي (دج)' : 'Simulateur ROI (DZD)'}
            </a>
            <a
              href="#souverainete"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              style={{ color: isLight ? '#475569' : '#94A3B8' }}
            >
              {isAr ? 'السيادة والقانون 18-07' : 'Loi 18-07'}
            </a>
          </nav>

          {/* Outils & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Bascule Langue FR / AR */}
            <button
              onClick={() => setLang(isAr ? 'FR' : 'AR')}
              className="px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer"
              style={{
                backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                borderColor: isLight ? '#CBD5E1' : '#334155',
                color: isLight ? '#0F172A' : '#F8FAFC',
              }}
              title={isAr ? 'Passer en Français' : 'التحويل إلى اللغة العربية'}
            >
              {isAr ? 'FR' : 'العربية'}
            </button>

            {/* Bascule Thème Sombre / Clair */}
            <ThemeToggle />

            {/* Lien Connexion */}
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                color: isLight ? '#334155' : '#CBD5E1',
                textDecoration: 'none',
              }}
            >
              {isAr ? 'تسجيل الدخول' : 'Connexion'}
            </Link>

            {/* CTA Cockpit Direct */}
            <Link
              href="/live-cockpit"
              className="px-3.5 py-1.5 rounded text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md cursor-pointer text-decoration-none"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)',
              }}
            >
              <IconActivity size={13} strokeWidth={2.5} />
              <span>{isAr ? 'فتح قمرة القيادة' : 'Ouvrir le Cockpit'}</span>
            </Link>
          </div>
        </div>
      </header>

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
          <div
            className="w-full grid grid-cols-2 md:grid-cols-5 gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-sm"
            style={{
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 24, 39, 0.75)',
              borderColor: isLight ? '#E2E8F0' : '#1E293B',
            }}
          >
            <div className="p-3 text-center border-r last:border-none border-slate-200 dark:border-slate-800">
              <div className="text-xl md:text-2xl font-extrabold text-blue-600 dark:text-sky-400 font-mono">
                58 Wilayas
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {isAr ? 'تغطية بيومناخية شاملة' : 'Couverture Bioclimatique'}
              </div>
            </div>

            <div className="p-3 text-center border-r last:border-none border-slate-200 dark:border-slate-800">
              <div className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                0 DA
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {isAr ? 'أجهزة إضافية في النمط 0' : 'Boîtier Requis (Mode 0)'}
              </div>
            </div>

            <div className="p-3 text-center border-r last:border-none border-slate-200 dark:border-slate-800">
              <div className="text-xl md:text-2xl font-extrabold text-blue-600 dark:text-cyan-400 font-mono">
                -32 %
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {isAr ? 'تقليص أوقات التوقف والتعطل' : 'Coûts d\'Immobilisation'}
              </div>
            </div>

            <div className="p-3 text-center border-r last:border-none border-slate-200 dark:border-slate-800">
              <div className="text-xl md:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                6 Organes
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {isAr ? 'نمذجة فيزيائية حتمية' : 'Jumeau Numérique XAI'}
              </div>
            </div>

            <div className="p-3 text-center col-span-2 md:col-span-1 border-slate-200 dark:border-slate-800">
              <div className="text-xl md:text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                100 %
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {isAr ? 'سيادة وطنية ومطابقة القانون 18-07' : 'Souveraineté & Loi 18-07'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MATRICE COMPARATIVE DES 5 GÉNÉRATIONS DE MAINTENANCE
          ========================================================================= */}
      <section className="py-16 md:py-24 border-t border-b border-slate-200 dark:border-slate-800/80">
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
                onClick={() => setActiveTier(1)}
                className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTier === 1 ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                  color: activeTier === 1 ? (isLight ? '#1D4ED8' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8'),
                  boxShadow: activeTier === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {isAr ? 'النمط 1 : موقع وسرعة GNSS' : 'Mode 1 : GNSS Standard'}
              </button>

              <button
                onClick={() => setActiveTier(2)}
                className="px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTier === 2 ? (isLight ? '#FFFFFF' : '#1E293B') : 'transparent',
                  color: activeTier === 2 ? (isLight ? '#1D4ED8' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8'),
                  boxShadow: activeTier === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {isAr ? 'النمط 2 : بيانات المحرك العميقة (CAN)' : 'Mode 2 : Bus CAN & IoT Profond'}
              </button>
            </div>
          </div>

          {/* Fiche Détaillée du Palier Sélectionné */}
          <div
            className="p-6 md:p-8 rounded-xl border backdrop-blur-md transition-all shadow-sm"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
              borderColor: isLight ? '#E2E8F0' : '#1E293B',
            }}
          >
            {activeTier === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    JOUR 1 • IMMÉDIAT
                  </span>
                  <h4 className="text-xl font-extrabold mt-3 mb-3">
                    {isAr ? 'النمط 0 : تشغيل فوري بدون أي جهاز إضافي' : 'Mode 0 : Exploitation Instantanée sans Boîtier'}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-500 mb-6">
                    {isAr
                      ? 'لا داعي لانتظار أسابيع لشراء وتركيب أجهزة التتبع. يبدأ النظام بمطابقة وصولات الوقود الممسوحة ضوئياً، وفحص العدادات عبر مسارات طبوغرافية حتمية، وتدوين فحوصات السائقين عبر تطبيق الهاتف بدون إنترنت.'
                      : 'Activez votre flotte sans immobiliser un seul camion. Rapprochement des tickets de carburant via scanner OCR, contrôle odométrique croisé avec le moteur topographique national, et inspections de départ DVIR sur application mobile hors-ligne.'}
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'مطابقة بيانات وصولات الوقود وحساب الاستهلاك الفعلي' : 'Ingestion des bordereaux et cartes de carburant avec contrôle de cohérence'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'كشف التلاعب بالعداد عبر المسافة الطبوغرافية المحسوبة' : 'Détection d\'anomalie odométrique par croisement topographique local'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'فحوصات ما قبل الانطلاق DVIR تعمل 100% بدون إنترنت' : 'Inspections quotidiennes DVIR PWA Offline-First certifiées'}</span>
                    </li>
                  </ul>
                </div>
                <div
                  className="p-5 rounded-lg border font-mono text-xs"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : '#070A10',
                    borderColor: isLight ? '#CBD5E1' : '#1E293B',
                  }}
                >
                  <div className="text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex justify-between">
                    <span>AUDIT ODOMÉTRIQUE (MODE 0)</span>
                    <span className="text-emerald-500 font-bold">ACTIF</span>
                  </div>
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trajet déclaré :</span>
                      <span>Alger Centre ➔ Ghardaïa (RN1)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance topo min :</span>
                      <span className="font-bold">602.4 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Écart odomètre :</span>
                      <span className="text-emerald-500 font-bold">+1.8 % (Tolérance OK)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Statut DVIR :</span>
                      <span className="text-emerald-500">CONFORME (PWA Offline)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTier === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    GÉOLOCALISATION HAUTE FRÉQUENCE
                  </span>
                  <h4 className="text-xl font-extrabold mt-3 mb-3">
                    {isAr ? 'النمط 1 : مسار ديناميكي ومراقبة الممرات الوطنية' : 'Mode 1 : GNSS & Dynamique de Route'}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-500 mb-6">
                    {isAr
                      ? 'مراقبة فورية لموقع الشاحنات والمركبات، سرعة الحركة، السكون بمحرك شغال، وتتبع الممرات اللوجستية الإستراتيجية كالممر السيار شرق-غرب وعابر الصحراء.'
                      : 'Ingestion télématique haute cadence. Analyse du style de conduite, détection des dévers et déclivités, temps de ralenti excessif et cartographie vectorielle souveraine des grands corridors.'}
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'مراقبة الممرات اللوجستية الكبرى ومناطق النشاط الإستراتيجي' : 'Corridors A1, RN1, RN3 et zones industrielles géorepérées'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'تحليل قيادة احترافي وتنبيهات السرعة المفرطة' : 'Score d\'éco-conduite et freinages brusques contextualisés'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'تسامح كامل مع انقطاع الشبكة في المناطق الصحراوية' : 'Résilience Store-and-Forward lors des passages en zone blanche'}</span>
                    </li>
                  </ul>
                </div>
                <div
                  className="p-5 rounded-lg border font-mono text-xs"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : '#070A10',
                    borderColor: isLight ? '#CBD5E1' : '#1E293B',
                  }}
                >
                  <div className="text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex justify-between">
                    <span>TÉLÉMÉTRIE GNSS SOUVERAINE</span>
                    <span className="text-sky-400 font-bold">100% LOCAL</span>
                  </div>
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corridor actif :</span>
                      <span>RN1 Trans-Saharienne (PK 320)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Altitude / Pente :</span>
                      <span className="font-bold">482 m • +3.2% (Dévers)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vitesse sol :</span>
                      <span className="font-bold">76 km/h</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Conformité carto :</span>
                      <span className="text-emerald-500">Zéro requête hors-territoire</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTier === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    TÉLÉMÉTRIE PROFONDE • MAINTENANCE 5.0
                  </span>
                  <h4 className="text-xl font-extrabold mt-3 mb-3">
                    {isAr ? 'النمط 2 : ربط مباشر بحاسوب المحرك وناقل الحركة' : 'Mode 2 : Full CAN & Bus Industriel Profond'}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-500 mb-6">
                    {isAr
                      ? 'قراءة مباشرة لأعماق المحرك: عزم الدوران، حرارة سائل التبريد والزيت، ضغط الغازات العادمة، واستهلاك الوقود اللحظي دون الاعتماد على مجسات تجارية خارجية.'
                      : 'Connexion aux calculateurs constructeurs. Télémétrie brute en temps réel (couple, régime, températures différentielles, accumulation suie FAP, et micro-glissements de chaîne cinématique).'}
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'كشف مبكر لسخونة المحرك وتفادي تلف حشية رأس الأسطوانة' : 'Prévention du voilage de culasse par résidu thermique EWMA'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'تشخيص دقيق لضغط الهواء ونظام الكبح والتوقف الاضطراري' : 'Surveillance continue des circuits de freinage pneumatique et APS'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={14} className="text-emerald-500" />
                      <span>{isAr ? 'مراقبة درجات حرارة الحاويات المبردة والأغذية الحساسة' : 'Télémétrie certifiée chaîne du froid et transport pharmaceutique'}</span>
                    </li>
                  </ul>
                </div>
                <div
                  className="p-5 rounded-lg border font-mono text-xs"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : '#070A10',
                    borderColor: isLight ? '#CBD5E1' : '#1E293B',
                  }}
                >
                  <div className="text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex justify-between">
                    <span>BUS CALCULATEUR MOTEUR</span>
                    <span className="text-emerald-400 font-bold">DIRECT ECU</span>
                  </div>
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Régime / Charge :</span>
                      <span className="font-bold">1 380 tr/min • 64 %</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Liquide refroidissement :</span>
                      <span className="font-bold text-emerald-400">92.5 °C (Nominal)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pression huile :</span>
                      <span className="font-bold">3.8 bar</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Contre-pression FAP :</span>
                      <span className="text-emerald-400">42 mbar (Suie nominale)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. LE JUMEAU NUMÉRIQUE DES 6 ORGANES (PHYSIQUE DÉTERMINISTE À 0 DA)
          ========================================================================= */}
      <section id="organes" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
              {isAr ? 'الذكاء الصناعي الشفاف والفيزيائي' : 'XAI • ZÉRO BOÎTE NOIRE'}
            </h2>
            <h3
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              {isAr ? 'الجumeau Numérique للأعضاء الستة الحيوية' : 'Physique Déterministe des 6 Organes Vitaux'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500">
              {isAr
                ? 'لا نعتمد على تخمينات احتمالية غير واضحة. كل تنبيه يستند إلى قانون فيزيائي مثبت يحمي المكونات الميكانيكية ويوفر ملايين الدنانير.'
                : 'Zéro capteur externe payant. DocteurFlotte modélise l\'usure mécanique par des équations physiques explicables, évitant les casses sans fausse alerte.'}
            </p>
          </div>

          {/* Grille des 6 Organes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
            {[
              { id: 'OIL', labelFr: 'Huile Moteur', labelAr: 'زيت المحرك', icon: IconFuel },
              { id: 'BATTERY', labelFr: 'Batterie & Démarreur', labelAr: 'البطارية والتشغيل', icon: IconZap },
              { id: 'BRAKES', labelFr: 'Freinage & Friction', labelAr: 'المكابح والفرامل', icon: IconAlertTriangle },
              { id: 'COOLING', labelFr: 'Culasse & Thermique', labelAr: 'رأس الأسطوانة والتبريد', icon: IconActivity },
              { id: 'DPF', labelFr: 'Filtre Échappement', labelAr: 'فلتر الجسيمات', icon: IconLayers },
              { id: 'TRANSMISSION', labelFr: 'Boîte & Pont', labelAr: 'ناقل الحركة والقابض', icon: IconCpu },
            ].map((organ) => {
              const isSelected = activeOrgan === organ.id;
              const IconComp = organ.icon;
              return (
                <button
                  key={organ.id}
                  onClick={() => setActiveOrgan(organ.id as any)}
                  className="p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-2"
                  style={{
                    backgroundColor: isSelected
                      ? (isLight ? '#EFF6FF' : '#0F1E36')
                      : (isLight ? '#FFFFFF' : '#0B0F19'),
                    borderColor: isSelected
                      ? (isLight ? '#2563EB' : '#38BDF8')
                      : (isLight ? '#E2E8F0' : '#1E293B'),
                    boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? (isLight ? '#DBEAFE' : 'rgba(56,189,248,0.2)')
                        : (isLight ? '#F1F5F9' : '#1E293B'),
                      color: isSelected
                        ? (isLight ? '#1D4ED8' : '#38BDF8')
                        : (isLight ? '#64748B' : '#94A3B8'),
                    }}
                  >
                    <IconComp size={16} />
                  </div>
                  <span
                    className="text-xs font-bold leading-tight"
                    style={{
                      color: isSelected
                        ? (isLight ? '#1D4ED8' : '#F8FAFC')
                        : (isLight ? '#475569' : '#94A3B8'),
                    }}
                  >
                    {isAr ? organ.labelAr : organ.labelFr}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fiche Détaillée de l'Organe */}
          <div
            className="p-6 md:p-8 rounded-xl border backdrop-blur-md"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
              borderColor: isLight ? '#E2E8F0' : '#1E293B',
            }}
          >
            {activeOrgan === 'OIL' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    LOI THERMIQUE D'ARRHENIUS (Ea / R = 6 500 K)
                  </span>
                  <h4 className="text-xl font-extrabold mt-2 mb-2">
                    {isAr ? 'الأكسدة الحرارية ولزوجة الزيت الحركية' : 'Cinétique d\'Oxydation & Viscosité de l\'Huile'}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 mb-4">
                    {isAr
                      ? 'لا نتخلص من الزيت بصفة اعتباطية كل 10 000 كم. يحسب النظام التدهور الكيميائي الحقيقي وفق حرارة المحرك والسرعة والبيئة المغبرة، ما يمنع تلف السبايك المعدنية ويوفر لترات باهظة الثمن.'
                      : 'La vidange au calendrier détruit la rentabilité. DocteurFlotte applique la loi d\'Arrhenius intégrant l\'historique thermique réel du carter et le taux de charge, prévenant la chute de viscosité et le frottement sec avant tout grippage.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">COÛT ACTION PRÉVENTIVE</span>
                      <strong className="text-emerald-500 text-sm">32 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Vidange &amp; Filtres</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">RISQUE D'INACTION</span>
                      <strong className="text-red-500 text-sm">650 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Coulage bielle / Vilbrequin</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">RATIO DE RENTABILITÉ (ROI)</span>
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-sky-400 mt-1">20.3 : 1</div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {isAr ? 'كل دينار ينفق يقي من 20 دينار خسائر' : 'Chaque 1 000 DZD d\'action préventive évite 20 300 DZD de casse.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-emerald-500 font-bold">
                    PREUVE AUDITABLE CONFORME
                  </div>
                </div>
              </div>
            )}

            {activeOrgan === 'BATTERY' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    MODÈLE CVHI (CHUTE DE TENSION SOUS DÉMARREUR &gt; 9.60 V)
                  </span>
                  <h4 className="text-xl font-extrabold mt-2 mb-2">
                    {isAr ? 'مقاومة البطارية الداخلية وقدرة الإقلاع' : 'Santé Dynamique SOH & Tension de Démarrage'}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 mb-4">
                    {isAr
                      ? 'قياس هبوط الجهد اللحظي أثناء تشغيل المحرك يكشف فوراً ضعف الخلايا قبل أن تعلق الشاحنة في محطة وقود أو طريق صحراوي معزول.'
                      : 'La tension statique au repos est trompeuse. DocteurFlotte analyse le creux de tension minimal lors de l\'appel de courant du démarreur, anticipant la panne sèche avant le départ en mission.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">COÛT ACTION PRÉVENTIVE</span>
                      <strong className="text-emerald-500 text-sm">28 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Remplacement 225 Ah</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">RISQUE D'INACTION</span>
                      <strong className="text-red-500 text-sm">125 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Dépannage désert + Retard</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">RATIO DE RENTABILITÉ (ROI)</span>
                    <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">4.5 : 1</div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {isAr ? 'وقاية تامة من تعطل الشاحنات في نقاط الشحن' : 'Élimine 100% des démarrages impossibles sur site client.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-emerald-500 font-bold">
                    Vmin SEUIL 9.60 V CONTRÔLÉ
                  </div>
                </div>
              </div>
            )}

            {activeOrgan === 'COOLING' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    MODÈLE THERMIQUE EWMA (ΔT = |Thuile - Teau|)
                  </span>
                  <h4 className="text-xl font-extrabold mt-2 mb-2">
                    {isAr ? 'حماية رأس الأسطوانة والتحكم الحراري الفائق' : 'Prévention Anti-Voilage Culasse & Échangeur'}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 mb-4">
                    {isAr
                      ? 'في المنحدرات الصعبة وتحت حرارة الصيف، يكتشف النظام فوراً أي تباين غير طبيعي بين حرارة الماء وحرارة الزيت قبل أن يقع شرخ في رأس الأسطوانة.'
                      : 'Sous forte charge en montée de col, le voyant tableau de bord s\'allume trop tard. Le filtre EWMA différentiel détecte l\'anomalie de transfert thermique avant toute déformation de culasse.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">COÛT ACTION PRÉVENTIVE</span>
                      <strong className="text-emerald-500 text-sm">18 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Thermostat / Purge</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">RISQUE D'INACTION</span>
                      <strong className="text-red-500 text-sm">480 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Voilage culasse / Rectification</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">RATIO DE RENTABILITÉ (ROI)</span>
                    <div className="text-2xl font-extrabold text-red-600 dark:text-rose-400 mt-1">26.6 : 1</div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {isAr ? 'توفير فوري لنصف مليون دينار لكل حادثة محتملة' : 'Le coût d\'inaction le plus destructeur des flottes lourdes.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-emerald-500 font-bold">
                    VÉTO HARDWARE ACTIF
                  </div>
                </div>
              </div>
            )}

            {(activeOrgan === 'BRAKES' || activeOrgan === 'DPF' || activeOrgan === 'TRANSMISSION') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    LOIS TRIBOLOGIQUES D'ARCHARD &amp; DARCY-FORCHHEIMER
                  </span>
                  <h4 className="text-xl font-extrabold mt-2 mb-2">
                    {isAr ? 'الفرامل وفلتر الجسيمات وناقل الحركة' : 'Freinage, FAP & Micro-Glissement Transmission'}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 mb-4">
                    {isAr
                      ? 'حساب الطاقة المبددة في الفرامل وفق انحدار الطرقات الجبلية، ومتابعة تراكم السخام وانسداد العادم دون انتظار فقدان قوة السحب.'
                      : 'Modélisation de l\'énergie dissipée sur les plaquettes et disques selon les pentes de l\'Atlas, et surveillance de la contre-pression d\'échappement pour régénérations optimales sans surconsommation.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">COÛT ACTION PRÉVENTIVE</span>
                      <strong className="text-emerald-500 text-sm">45 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Plaquettes OEM / Nettoyage</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">RISQUE D'INACTION</span>
                      <strong className="text-red-500 text-sm">340 000 DZD</strong>
                      <span className="text-slate-500 block text-[10px]">Disques voilés / FAP colmaté</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">RATIO DE RENTABILITÉ (ROI)</span>
                    <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">7.5 : 1</div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {isAr ? 'حماية سلامة السائق وحمولة الشاحنة' : 'Sécurité absolue en descente de col et maintien du couple.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-emerald-500 font-bold">
                    CALCUL TOPOGRAPHIQUE INTÉGRÉ
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HUISSIER JURIDIQUE CUSUM & ANTI-FRAUDE CARBURANT OPPOSABLE
          ========================================================================= */}
      <section id="carburant" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-3">
                <IconFuel size={12} />
                <span>{isAr ? 'حماية الأصول ضد السحب غير المشروع' : 'HUISSIER JURIDIQUE & TRAÇABILITÉ CARBURANT'}</span>
              </div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
                style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
              >
                {isAr
                  ? 'خوارزمية CUSUM المتقدمة مع التعويض الطبوغرافي للمنحدرات'
                  : 'Détection CUSUM & Compensation Topographique de Pente'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500 mb-6">
                {isAr
                  ? 'تتسبب المنعطفات والمنحدرات الجبلية في إنذارات كاذبة لدى الأنظمة العادية. يدمج نظامنا تضاريس الطريق مع موضع حساس الخزان لإلغاء الإنذارات الكاذبة بنسبة 100%، وتوليد ملف إثبات تقني موقع بشهادة رقمية مشفرة قابلة للاحتجاج القانوني.'
                  : 'Les montées et descentes créent des ballottements que les traceurs ordinaires confondent avec des vols. DocteurFlotte compense l\'inclinaison de la chaussée et le déport de jauge, générant un Dossier d\'Expertise Technique certifié par empreinte SHA-256 infalsifiable.'}
              </p>

              <div className="space-y-3">
                <div
                  className="p-3.5 rounded-lg border flex items-start gap-3"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                    borderColor: isLight ? '#E2E8F0' : '#1E293B',
                  }}
                >
                  <IconCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">{isAr ? 'إلغاء 100% من الإنذارات الكاذبة في المنحدرات' : 'Zéro Faux Positif dans les Gorges et Cols'}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'حساب زاوية ميلان الخزان عبر الارتفاع والخرائط الطبوغرافية.' : 'Compensation de pente et assiette dynamique pour fiabiliser chaque litre mesuré.'}
                    </p>
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-lg border flex items-start gap-3"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                    borderColor: isLight ? '#E2E8F0' : '#1E293B',
                  }}
                >
                  <IconShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">{isAr ? 'ملف إثبات تقني مشفر (SHA-256) لمجالس التأديب' : 'Dossier Technique Opposable Infalsifiable'}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'تقرير رسمي بصيغة PDF محمي ببصمة رقمية غير قابلة للتزوير.' : 'Rapport PDF scellé cryptographiquement pour commissions de discipline et contentieux.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Visuelle Dossier Technique */}
            <div
              className="p-6 rounded-xl border font-mono text-xs shadow-lg"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0A0E17',
                borderColor: isLight ? '#CBD5E1' : '#1E293B',
              }}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-red-500">RAPPORT TECHNIQUE DET-2026-089</span>
                </div>
                <span className="text-[10px] text-slate-400">EMPREINTE SHA-256 VALIDÉE</span>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Véhicule :</span>
                  <span className="font-bold">Tracteur Routier 6x4 (Unité 002)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Localisation :</span>
                  <span>RN1 PK 184 (Zone Hors-Station)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Événement :</span>
                  <span className="text-red-500 font-bold">Chute brutale -65 Litres en 6 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compensation Pente :</span>
                  <span className="text-emerald-500">Pente sol 0.2° (Siphonnage avéré)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Préjudice chiffré :</span>
                  <span className="font-bold">1 885 DZD (Gasoil national)</span>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 break-all">
                SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. RÉSILIENCE CLIMATIQUE & TOPOGRAPHIQUE SUR LES 58 WILAYAS
          ========================================================================= */}
      <section id="wilayas" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
              {isAr ? 'تكيف محلي تام مع جغرافية الوطن' : 'ADAPTATION TERRAIN 100% NATIONALE'}
            </h2>
            <h3
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              {isAr ? 'معايرة بيومناخية تغطي الولايات الـ 58' : 'Résilience sur les 58 Wilayas d\'Algérie'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500">
              {isAr
                ? 'تختلف المتطلبات الميكانيكية جذرياً بين رطوبة البحر الأبيض المتوسط، وصقيع الهضاب العليا، وحرارة الصحراء الكبرى التي تصل إلى 49 درجة مئوية مع الغبار المحتوي على السيليكا.'
                : 'Les solutions étrangères ignorent les réalités climatiques algériennes. DocteurFlotte intègre un calibrage spécifique à chaque zone : chaleur saharienne, poussière abrasive et corridors d\'altitude.'}
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
                {sampleVoicePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunPrompt(item)}
                    className="w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-colors hover:border-blue-500 cursor-pointer"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                      borderColor: isLight ? '#E2E8F0' : '#1E293B',
                      color: isLight ? '#0F172A' : '#F8FAFC',
                    }}
                  >
                    <div>
                      <span className="font-bold">{isAr ? item.labelAr : item.labelFr}</span>
                      <span className="block font-mono text-[11px] text-blue-500 mt-0.5">
                        « {item.query} »
                      </span>
                    </div>
                    <IconArrowUpRight size={14} className="text-slate-400" />
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
            >
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 font-bold text-slate-300">TERMINAL ATELIER SOUVERAIN (CPU 100% LOCAL)</span>
                  </div>
                  <span className="text-emerald-400">&lt; 50 ms</span>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="text-slate-400">
                    &gt; Requête mécanicien :{' '}
                    <span className="text-sky-300 font-bold">
                      {terminalInput || 'choufli zit el moteur w chhal mazalelha'}
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
                        Loi thermique Arrhenius Ea/R=6500K
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
        </div>
      </section>

      {/* =========================================================================
          9. CALCULATEUR INTERACTIF DE RENTABILITÉ & ROI EN DINARS ALGÉRIENS (DZD)
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
                ? 'حدد حجم أسطولك والمسافة الشهرية لمشاهدة حجم التوفير الحقيقي في فاتورة المحروقات، وحماية المحركات من الكسر، وتقليص أيام العطل.'
                : 'Ajustez la taille de votre parc et vos kilomètres mensuels pour calculer immédiatement votre rentabilité nette annuelle en Dinars Algériens (DZD).'}
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
                    {[
                      { id: 'FREIGHT', labelFr: 'Fret & Logistique', labelAr: 'نقل البضائع واللوجستيك' },
                      { id: 'CONSTRUCTION', labelFr: 'BTP & Carrières', labelAr: 'الأشغال العمومية والمحاجر' },
                      { id: 'DISTRIBUTION', labelFr: 'Distribution & Agro', labelAr: 'التوزيع والتغذية' },
                      { id: 'SAHARA', labelFr: 'Énergie & Sahara', labelAr: 'الطاقة والنقل الصحراوي' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setFleetSector(sec.id as any)}
                        className="py-2 px-3 rounded-md border text-center transition-colors cursor-pointer"
                        style={{
                          backgroundColor: fleetSector === sec.id
                            ? (isLight ? '#EFF6FF' : '#1E3A8A')
                            : (isLight ? '#F8FAFC' : '#111827'),
                          borderColor: fleetSector === sec.id
                            ? (isLight ? '#2563EB' : '#3B82F6')
                            : (isLight ? '#E2E8F0' : '#1E293B'),
                          color: fleetSector === sec.id
                            ? (isLight ? '#1D4ED8' : '#FFFFFF')
                            : (isLight ? '#64748B' : '#94A3B8'),
                        }}
                      >
                        {isAr ? sec.labelAr : sec.labelFr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider 1 : Taille de Flotte */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                    <span>{isAr ? 'عدد المركبات أو الآليات :' : 'Taille de la Flotte (Actifs) :'}</span>
                    <span className="font-mono text-sm text-blue-600 dark:text-sky-400">
                      {fleetSize} {isAr ? 'مركبة' : 'véhicules'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={fleetSize}
                    onChange={(e) => setFleetSize(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>5</span>
                    <span>50</span>
                    <span>100</span>
                    <span>200</span>
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
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>2 000 km</span>
                    <span>8 000 km</span>
                    <span>14 000 km</span>
                    <span>18 000 km</span>
                  </div>
                </div>
              </div>

              {/* Colonne Résultats Financiers en DZD */}
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
                      {isAr ? 'التقدير المالي للأرباح السنوية' : 'Bilan Financier Prévisionnel'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-500">
                      ROI {calculatedSavings.netRoiRatio}x
                    </span>
                  </div>

                  <div className="py-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {isAr ? 'توفير استهلاك وسحب الوقود :' : 'Économie Carburant & Siphonnage :'}
                      </span>
                      <span className="font-bold">
                        {calculatedSavings.fuelSavingsDzd.toLocaleString()} DZD
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {isAr ? `كوارث ميكانيكية متفادية (${calculatedSavings.criticalBreakdownsAvoidedPerYear}) :` : `Casses Moteur Évitées (${calculatedSavings.criticalBreakdownsAvoidedPerYear}) :`}
                      </span>
                      <span className="font-bold">
                        {calculatedSavings.breakdownSavingsDzd.toLocaleString()} DZD
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {isAr ? `أيام توقف مسترجعة (${calculatedSavings.daysDowntimeSaved}j) :` : `Jours d'Immobilisation Sauvegardés (${calculatedSavings.daysDowntimeSaved}j) :`}
                      </span>
                      <span className="font-bold">
                        {calculatedSavings.downtimeSavingsDzd.toLocaleString()} DZD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    {isAr ? 'صافي الربح السنوي المتوقع (دينار جزائري) :' : 'ÉCONOMIE NETTE TOTALE ANNUELLE :'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {calculatedSavings.totalSavingsDzd.toLocaleString()} DZD
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-sans">
                    {isAr
                      ? 'محسوبة وفق مؤشرات تكلفة الوقود الوطني وتكلفة التوقف اليومية المقدرة بـ 25 000 دج.'
                      : 'Basé sur les tarifs officiels des carburants et un coût d\'immobilisation unitaire de 25 000 DZD/jour.'}
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
          11. BANNIÈRE D'APPEL À L'ACTION (CTA FINAL)
          ========================================================================= */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 50%, #10B981 100%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
          >
            {isAr
              ? 'جاهزون لتحويل أسطولكم من مركز تكلفة إلى رافعة أرباح صافية ؟'
              : 'Prêt à transformer votre flotte en levier de rentabilité financière ?'}
          </h3>
          <p className="text-sm md:text-base max-w-2xl mx-auto text-slate-500 mb-8 leading-relaxed">
            {isAr
              ? 'انضموا إلى الشركات الرائدة واستفيدوا من تقنية الصيانة التوجيهية 5.0 الأكثر تطوراً ومطابقة لواقع الميدان الوطني.'
              : 'Déployez la plateforme souveraine de référence. Aucun investissement lourd en matériel n\'est requis pour démarrer dès aujourd\'hui.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 text-decoration-none"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)',
              }}
            >
              {isAr ? 'تسجيل مؤسسة وتجربة المنصة' : 'Enregistrer mon Organisation'}
            </Link>

            <Link
              href="/live-cockpit"
              className="px-6 py-3.5 rounded-lg text-sm font-bold border transition-colors text-decoration-none"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#111827',
                borderColor: isLight ? '#CBD5E1' : '#334155',
                color: isLight ? '#0F172A' : '#F8FAFC',
              }}
            >
              {isAr ? 'معاينة قمرة القيادة التجريبية' : 'Consulter le Cockpit de Démonstration'}
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. PIED DE PAGE INDUSTRIEL (FOOTER MONDIAL HAUTE DENSITÉ)
          ========================================================================= */}
      <footer
        className="w-full border-t border-slate-200 dark:border-slate-800/80 py-12 transition-colors"
        style={{
          backgroundColor: isLight ? '#F1F5F9' : '#05070B',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10 text-xs">
            {/* Colonne 1 : Identité & Souveraineté */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-white text-xs"
                  style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)' }}
                >
                  DF
                </div>
                <span className="font-extrabold text-sm tracking-tight text-blue-600 dark:text-sky-400">
                  DOCTEUR<span style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>FLOTTE</span>
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px] max-w-sm mb-4">
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
