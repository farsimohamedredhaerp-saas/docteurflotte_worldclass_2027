/**
 * Système d'internationalisation souverain pour le Cockpit Jumeau Numérique
 * Support complet Français (FR), Arabe (AR) et Anglais (EN).
 * Aucune chaîne de caractères métier n'est codée en dur dans le JSX.
 */

export type Locale = 'fr' | 'ar' | 'en';

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  fr: {
    "digitalTwin.header.badgeTitle": "JUMEAU NUMÉRIQUE DYNAMIQUE & RUL",
    "digitalTwin.header.title": "Physique Prédictive de l’Actif & Durée de Vie Résiduelle (RUL)",
    "digitalTwin.header.description":
      "Modélisation dynamique des {count} organes physiques d’usure ({algorithms}). Calibrée sur les contraintes thermiques et abrasives des {wilayasCount} Wilayas algériennes.",
    "digitalTwin.header.liveCockpit": "Live Cockpit MapLibre",
    "digitalTwin.header.vehicleSelectLabel": "Véhicule :",
    "digitalTwin.header.noVehicles": "Aucun véhicule disponible",

    "digitalTwin.vhi.scoreTitle": "Score de Santé Globale",
    "digitalTwin.vhi.proofButton": "Règle & Preuve VHI",
    "digitalTwin.vhi.scoreUnit": "/ 100 VHI",
    "digitalTwin.vhi.explanation":
      "Pondération physique des {count} algorithmes ({organs}). Zéro moyenne naïve.",

    "digitalTwin.status.healthy": "Sain",
    "digitalTwin.status.preCritical": "Pré-Critique",
    "digitalTwin.status.critical": "Critique",
    "digitalTwin.status.excellent": "Excellente Santé Opérationnelle",
    "digitalTwin.status.vigilance": "Vigilance & Maintenance Préventive",
    "digitalTwin.status.preCriticalRisk": "Risque d’Immobilisation Pré-Critique",
    "digitalTwin.status.immediateStop": "Arrêt Véhicule Requis Immédiatement",

    "digitalTwin.context.plate": "Immatriculation / Code",
    "digitalTwin.context.odometer": "Odomètre Réel",
    "digitalTwin.context.wilaya": "Wilaya & Climat",
    "digitalTwin.context.stress": "Facteurs de Contraintes",
    "digitalTwin.context.climateFactor": "Climat :",
    "digitalTwin.context.driverFactor": "Conduite :",

    "digitalTwin.anatomy.title": "Schéma Anatomique & Capteurs Télématiques en Continu",
    "digitalTwin.anatomy.subtitle":
      "Sélectionnez un organe pour analyser ses équations physiques, sa dégradation et son RUL.",
    "digitalTwin.anatomy.legend":
      "• Vue télématique en temps réel • Modélisation {count} organes physiques ({algorithms}) conforme {specVersion}",

    "digitalTwin.organ.algorithmPrefix": "Algorithme :",
    "digitalTwin.organ.proofButton": "Formule & Preuve",
    "digitalTwin.organ.rulLabel": "RUL Résiduel",
    "digitalTwin.organ.healthLevelLabel": "Niveau de Santé VHI de l’Organe",
    "digitalTwin.organ.thresholdPrefix": "Seuil :",
    "digitalTwin.organ.physicalFinding": "Constat Physique SAD :",

    "digitalTwin.trajectory.title": "Trajectoire Prédictive Déterministe",
    "digitalTwin.trajectory.proofButton": "Preuve dégradation",
    "digitalTwin.trajectory.subtitle":
      "Comparaison du score VHI sans action vs avec action préventive SAD.",
    "digitalTwin.trajectory.day0": "Aujourd’hui (J0)",
    "digitalTwin.trajectory.day30": "Dans 30 jours (J+30)",
    "digitalTwin.trajectory.day30Sub": "Sans intervention vs Avec intervention",
    "digitalTwin.trajectory.day60": "Dans 60 jours (J+60)",
    "digitalTwin.trajectory.day90": "Dans 90 jours (J+90)",
    "digitalTwin.trajectory.highRisk": "(Panne Élevée)",

    "digitalTwin.arbitrage.title": "Arbitrage Financier SAD → ADS ({currency})",
    "digitalTwin.arbitrage.roi": "ROI {roi}x",
    "digitalTwin.arbitrage.subtitle":
      "Arbitrage déterministe Coût Préventif vs Risque Inaction (remorquage saharien & immo).",
    "digitalTwin.arbitrage.proofButton": "Preuve Financière",
    "digitalTwin.arbitrage.preventiveCost": "Coût Action Préventive",
    "digitalTwin.arbitrage.preventiveCostSub": "Pièces OEM + MO Atelier",
    "digitalTwin.arbitrage.breakdownRisk": "Risque Panne Sévère",
    "digitalTwin.arbitrage.breakdownRiskSub": "Casse moteur + remorquage",
    "digitalTwin.arbitrage.towingAndImmo": "Remorquage & Immo",
    "digitalTwin.arbitrage.perDayDowntime": "+ {amount}/j d'arrêt",
    "digitalTwin.arbitrage.netSavings": "Économie Nette",
    "digitalTwin.arbitrage.actionInDays": "Action sous {days} jours",
    "digitalTwin.arbitrage.recommendation": "Recommandation ADS :",
    "digitalTwin.arbitrage.maxDays": "Max : {days} j.",
    "digitalTwin.arbitrage.openWorkOrder": "Ouvrir l’Ordre de Travail Atelier ({currency})",
    "digitalTwin.arbitrage.redirectNotification":
      "Redirection vers le module Ordres de Travail pour l'actif {assetCode}...",

    "digitalTwin.simulation.title": "Studio de Simulation : Scénarios « What-If » ({wilayasCount} Wilayas)",
    "digitalTwin.simulation.subtitle":
      "Évaluez l’impact des contraintes climatiques des {wilayasCount} Wilayas et de la conduite sur le VHI.",
    "digitalTwin.simulation.wilayaSelect": "Wilaya ({wilayasCount} Wilayas) :",
    "digitalTwin.simulation.desertTransitCheckbox": "Transit Désertique (Remorquage {amount})",
    "digitalTwin.simulation.bioZone": "Zone Bioclimatique",
    "digitalTwin.simulation.summerTempMax": "T° Max Estivale",
    "digitalTwin.simulation.silicaDust": "Silice & Poussière",
    "digitalTwin.simulation.oilArrhenius": "Arrhenius Huile",
    "digitalTwin.simulation.brakeGradient": "Déclivité Freins",
    "digitalTwin.simulation.climateSliderLabel": "Sévérité Wilaya (K_clim)",
    "digitalTwin.simulation.driverSliderLabel": "Conduite (K_driver)",
    "digitalTwin.simulation.recalculateBtn": "Recalculer le Jumeau Numérique",
    "digitalTwin.simulation.recalculatingBtn": "Calcul des équations physiques...",
    "digitalTwin.simulation.successNotification":
      "Simulation validée pour la Wilaya {wilayaCode} - {wilayaName} (VHI: {vhi}/100)",
    "digitalTwin.simulation.climateMin": "1.00 (Tempéré)",
    "digitalTwin.simulation.climateMax": "1.70 (In Salah/HMD)",
    "digitalTwin.simulation.driverMin": "0.80 (Éco)",
    "digitalTwin.simulation.driverMax": "1.60 (Agressif)",
    "digitalTwin.simulation.limits.climateMin": "1.00 (Tempéré)",
    "digitalTwin.simulation.limits.climateMax": "1.70 (In Salah/HMD)",
    "digitalTwin.simulation.limits.driverMin": "0.80 (Éco)",
    "digitalTwin.simulation.limits.driverMax": "1.60 (Agressif)",

    "digitalTwin.ads.badge": "ADS ACTION AUTONOME",
    "digitalTwin.ads.title": "Réservation Prédictive Pièces & Substitution",
    "digitalTwin.ads.subtitle":
      "Allocation proactive des pièces certifiées OEM avant le seuil d’usure critique.",
    "digitalTwin.ads.inStock": "En Stock ({qty})",
    "digitalTwin.ads.oemRef": "Réf OEM : {partNumber} • {homologation}",
    "digitalTwin.ads.substitutionWarning": "Remplacement Flotte Recommandé (VHI < {threshold})",
    "digitalTwin.ads.suggestedAsset": "Actif suggéré : {name} ({code})",
    "digitalTwin.ads.vhiHealth": "Santé VHI : {vhi}/100 • {reason}",
    "digitalTwin.ads.generateOrderBtn": "Générer l’Ordre d’Intervention Préventif",
    "digitalTwin.ads.generatingOrderNotification":
      "Génération de l'ordre d'intervention préventif pour {assetCode}...",

    "digitalTwin.empty.title": "Aucun Jumeau Numérique Disponible",
    "digitalTwin.empty.description":
      "Aucun actif n'est actuellement configuré pour la télémétrie prédictive ou la session est inactive.",
    "digitalTwin.empty.retry": "Actualiser la flotte",
    "digitalTwin.error.title": "Erreur de Chargement du Jumeau Numérique",
    "digitalTwin.error.retry": "Réessayer",
    "digitalTwin.common.unavailable": "Donnée indisponible",
    "digitalTwin.common.loading": "Chargement des équations physiques...",
    "digitalTwin.loading": "Chargement du Jumeau Numérique...",
    "digitalTwin.proof.unavailable": "Détails de la preuve de calcul indisponibles.",
    "digitalTwin.config.defaultBanner": "Configuration par défaut active — les seuils proviennent du fallback local.",
    "digitalTwin.error.unknown": "Erreur inconnue",
    "digitalTwin.share.summary": "{assetCode} — VHI {vhi}/100 | {odometer} km | {wilaya} | {organs} organes ({algorithms}) | {spec}",
    "digitalTwin.share.noAlgorithms": "algorithmes physiques",
    "digitalTwin.share.unknownSpec": "MASTER_SPEC",
    "digitalTwin.share.copied": "Résumé copié dans le presse-papiers",
    "digitalTwin.share.copiedShort": "Copié !",
    "digitalTwin.share.copy": "Copier le résumé",
    "digitalTwin.share.copyAria": "Copier le résumé du jumeau numérique",
    "digitalTwin.share.copyFailed": "Impossible de copier — vérifiez les permissions du navigateur",
  },
  ar: {
    "digitalTwin.header.badgeTitle": "التوأم الرقمي الديناميكي ومؤشر RUL",
    "digitalTwin.header.title": "الفيزياء التنبؤية للأصل والعمر الافتراضي المتبقي (RUL)",
    "digitalTwin.header.description":
      "النمذجة الديناميكية لـ {count} أعضاء ميكانيكية ({algorithms}). معايرة حسب الظروف المناخية لـ {wilayasCount} ولاية جزائرية.",
    "digitalTwin.header.liveCockpit": "مقصورة القيادة المباشرة MapLibre",
    "digitalTwin.header.vehicleSelectLabel": "المركبة :",
    "digitalTwin.header.noVehicles": "لا توجد مركبات متاحة",

    "digitalTwin.vhi.scoreTitle": "مؤشر الصحة العامة VHI",
    "digitalTwin.vhi.proofButton": "قاعدة وإثبات VHI",
    "digitalTwin.vhi.scoreUnit": "/ 100 VHI",
    "digitalTwin.vhi.explanation":
      "ترجيح فيزيائي لـ {count} خوارزميات ({organs}). بدون أي متوسط عشوائي.",

    "digitalTwin.status.healthy": "سليم",
    "digitalTwin.status.preCritical": "ما قبل الحرج",
    "digitalTwin.status.critical": "حرج",
    "digitalTwin.status.excellent": "حالة تشغيلية ممتازة",
    "digitalTwin.status.vigilance": "يقظة وصيانة وقائية",
    "digitalTwin.status.preCriticalRisk": "خطر التوقف وشيك",
    "digitalTwin.status.immediateStop": "توقيف المركبة فورا مطلوب",

    "digitalTwin.context.plate": "الترقيم / الرمز",
    "digitalTwin.context.odometer": "العداد الفعلي",
    "digitalTwin.context.wilaya": "الولاية والمناخ",
    "digitalTwin.context.stress": "معاملات الإجهاد",
    "digitalTwin.context.climateFactor": "المناخ :",
    "digitalTwin.context.driverFactor": "السياقة :",

    "digitalTwin.anatomy.title": "المخطط التشريحي ومستشعرات القياس عن بُعد",
    "digitalTwin.anatomy.subtitle":
      "اختر عضواً لتحليل معادلاته الفيزيائية وتدهوره وعمره المتبقي.",
    "digitalTwin.anatomy.legend":
      "• رؤية القياس عن بُعد الحية • نمذجة {count} أعضاء ({algorithms}) مطابقة لـ {specVersion}",

    "digitalTwin.organ.algorithmPrefix": "الخوارزمية :",
    "digitalTwin.organ.proofButton": "المعادلة والإثبات",
    "digitalTwin.organ.rulLabel": "العمر المتبقي RUL",
    "digitalTwin.organ.healthLevelLabel": "مستوى صحة العضو VHI",
    "digitalTwin.organ.thresholdPrefix": "العتبة :",
    "digitalTwin.organ.physicalFinding": "الاستنتاج الفيزيائي SAD :",

    "digitalTwin.trajectory.title": "المسار التنبؤي الحتمي",
    "digitalTwin.trajectory.proofButton": "إثبات التدهور",
    "digitalTwin.trajectory.subtitle":
      "مقارنة درجة VHI دون تدخل مقابل التدخل الوقائي SAD.",
    "digitalTwin.trajectory.day0": "اليوم (J0)",
    "digitalTwin.trajectory.day30": "خلال 30 يوماً (J+30)",
    "digitalTwin.trajectory.day30Sub": "بدون صيانة مقابل مع صيانة",
    "digitalTwin.trajectory.day60": "خلال 60 يوماً (J+60)",
    "digitalTwin.trajectory.day90": "خلال 90 يوماً (J+90)",
    "digitalTwin.trajectory.highRisk": "(عطل مرتفع)",

    "digitalTwin.arbitrage.title": "التحكيم المالي SAD ← ADS ({currency})",
    "digitalTwin.arbitrage.roi": "العائد {roi}x",
    "digitalTwin.arbitrage.subtitle":
      "تحكيم حتمي بين كلفة التدخل الوقائي ومخاطر الأعطال الفجائية.",
    "digitalTwin.arbitrage.proofButton": "الإثبات المالي",
    "digitalTwin.arbitrage.preventiveCost": "كلفة التدخل الوقائي",
    "digitalTwin.arbitrage.preventiveCostSub": "قطع الغيار OEM + اليد العاملة",
    "digitalTwin.arbitrage.breakdownRisk": "مخاطر العطل الشديد",
    "digitalTwin.arbitrage.breakdownRiskSub": "انكسار المحرك + القطر الصحراوي",
    "digitalTwin.arbitrage.towingAndImmo": "القطر وشلل النشاط",
    "digitalTwin.arbitrage.perDayDowntime": "+ {amount}/يوم توقف",
    "digitalTwin.arbitrage.netSavings": "الوفر الصافي",
    "digitalTwin.arbitrage.actionInDays": "التدخل خلال {days} أيام",
    "digitalTwin.arbitrage.recommendation": "توصية نظام ADS :",
    "digitalTwin.arbitrage.maxDays": "أقصى أجل : {days} ي.",
    "digitalTwin.arbitrage.openWorkOrder": "فتح أمر عمل الورشة ({currency})",
    "digitalTwin.arbitrage.redirectNotification":
      "جاري التوجيه إلى أوامر العمل للأصل {assetCode}...",

    "digitalTwin.simulation.title": "استوديو المحاكاة : سيناريوهات افتراضية ({wilayasCount} ولاية)",
    "digitalTwin.simulation.subtitle":
      "تقييم أثر الإجهاد المناخي والسياقة عبر {wilayasCount} ولاية على VHI.",
    "digitalTwin.simulation.wilayaSelect": "الولاية ({wilayasCount} ولاية) :",
    "digitalTwin.simulation.desertTransitCheckbox": "عبور صحراوي (قطر {amount})",
    "digitalTwin.simulation.bioZone": "المنطقة المناخية",
    "digitalTwin.simulation.summerTempMax": "حرارة الصيف القصوى",
    "digitalTwin.simulation.silicaDust": "السيليكا والغبار",
    "digitalTwin.simulation.oilArrhenius": "أرهينيوس الزيت",
    "digitalTwin.simulation.brakeGradient": "انحدار الفرامل",
    "digitalTwin.simulation.climateSliderLabel": "شدة المناخ (K_clim)",
    "digitalTwin.simulation.driverSliderLabel": "طريقة السياقة (K_driver)",
    "digitalTwin.simulation.recalculateBtn": "إعادة حساب التوأم الرقمي",
    "digitalTwin.simulation.recalculatingBtn": "جاري حساب المعادلات الفيزيائية...",
    "digitalTwin.simulation.successNotification":
      "تمت المحاكاة بنجاح لولاية {wilayaCode} - {wilayaName} (VHI: {vhi}/100)",
    "digitalTwin.simulation.climateMin": "1.00 (معتدل)",
    "digitalTwin.simulation.climateMax": "1.70 (عين صالح/حاسي مسعود)",
    "digitalTwin.simulation.driverMin": "0.80 (اقتصادي)",
    "digitalTwin.simulation.driverMax": "1.60 (عنيف)",
    "digitalTwin.simulation.limits.climateMin": "1.00 (معتدل)",
    "digitalTwin.simulation.limits.climateMax": "1.70 (عين صالح/حاسي مسعود)",
    "digitalTwin.simulation.limits.driverMin": "0.80 (اقتصادي)",
    "digitalTwin.simulation.limits.driverMax": "1.60 (عنيف)",

    "digitalTwin.ads.badge": "إجراء ذاتي ADS",
    "digitalTwin.ads.title": "الحجز الاستباقي لقطع الغيار والاستبدال",
    "digitalTwin.ads.subtitle":
      "تخصيص استباقي للقطع الأصلية المعتمدة قبل بلوغ عتبة الاهتراء الحرج.",
    "digitalTwin.ads.inStock": "في المخزن ({qty})",
    "digitalTwin.ads.oemRef": "رقم OEM : {partNumber} • {homologation}",
    "digitalTwin.ads.substitutionWarning": "يوصى باستبدال المركبة في الأسطول (VHI < {threshold})",
    "digitalTwin.ads.suggestedAsset": "المركبة المقترحة : {name} ({code})",
    "digitalTwin.ads.vhiHealth": "درجة الصحة : {vhi}/100 • {reason}",
    "digitalTwin.ads.generateOrderBtn": "توليد أمر التدخل الوقائي",
    "digitalTwin.ads.generatingOrderNotification":
      "جاري إعداد أمر التدخل الوقائي للمركبة {assetCode}...",

    "digitalTwin.empty.title": "لا يتوفر توأم رقمي",
    "digitalTwin.empty.description":
      "لا توجد أصول مهيأة للقياس عن بُعد التنبؤي أو أن الجلسة منتهية.",
    "digitalTwin.empty.retry": "تحديث بيانات الأسطول",
    "digitalTwin.error.title": "خطأ في تحميل التوأم الرقمي",
    "digitalTwin.error.retry": "إعادة المحاولة",
    "digitalTwin.common.unavailable": "البيانات غير متاحة",
    "digitalTwin.common.loading": "جاري تحميل المعادلات الفيزيائية...",
    "digitalTwin.loading": "جاري تحميل التوأم الرقمي...",
    "digitalTwin.proof.unavailable": "تفاصيل إثبات الحساب غير متوفرة.",
    "digitalTwin.config.defaultBanner": "الإعدادات الافتراضية مفعلة — العتبات مستمدة من التكوين الاحتياطي المحلي.",
    "digitalTwin.error.unknown": "خطأ غير معروف",
    "digitalTwin.share.summary": "{assetCode} — مؤشر VHI {vhi}/100 | {odometer} كم | {wilaya} | {organs} أعضاء ({algorithms}) | {spec}",
    "digitalTwin.share.noAlgorithms": "خوارزميات فيزيائية",
    "digitalTwin.share.unknownSpec": "MASTER_SPEC",
    "digitalTwin.share.copied": "تم نسخ الملخص إلى الحافظة",
    "digitalTwin.share.copiedShort": "تم النسخ !",
    "digitalTwin.share.copy": "نسخ الملخص",
    "digitalTwin.share.copyAria": "نسخ ملخص التوأم الرقمي",
    "digitalTwin.share.copyFailed": "تعذر النسخ — يرجى التحقق من أذونات المتصفح",
  },
  en: {
    "digitalTwin.header.badgeTitle": "DYNAMIC DIGITAL TWIN & RUL",
    "digitalTwin.header.title": "Asset Predictive Physics & Remaining Useful Life (RUL)",
    "digitalTwin.header.description":
      "Dynamic modeling of {count} physical wear components ({algorithms}). Calibrated for thermal and abrasive stress across Algeria’s {wilayasCount} Wilayas.",
    "digitalTwin.header.liveCockpit": "Live Cockpit MapLibre",
    "digitalTwin.header.vehicleSelectLabel": "Vehicle:",
    "digitalTwin.header.noVehicles": "No vehicle available",

    "digitalTwin.vhi.scoreTitle": "Overall Health Score (VHI)",
    "digitalTwin.vhi.proofButton": "VHI Rule & Proof",
    "digitalTwin.vhi.scoreUnit": "/ 100 VHI",
    "digitalTwin.vhi.explanation":
      "Physical weighting of {count} algorithms ({organs}). Zero naive averages.",

    "digitalTwin.status.healthy": "Healthy",
    "digitalTwin.status.preCritical": "Pre-Critical",
    "digitalTwin.status.critical": "Critical",
    "digitalTwin.status.excellent": "Excellent Operational Health",
    "digitalTwin.status.vigilance": "Vigilance & Preventive Maintenance",
    "digitalTwin.status.preCriticalRisk": "Pre-Critical Immobilization Risk",
    "digitalTwin.status.immediateStop": "Immediate Vehicle Stoppage Required",

    "digitalTwin.context.plate": "Registration / Code",
    "digitalTwin.context.odometer": "Real Odometer",
    "digitalTwin.context.wilaya": "Wilaya & Climate",
    "digitalTwin.context.stress": "Stress Factors",
    "digitalTwin.context.climateFactor": "Climate:",
    "digitalTwin.context.driverFactor": "Driving:",

    "digitalTwin.anatomy.title": "Anatomical Diagram & Continuous Telematics Sensors",
    "digitalTwin.anatomy.subtitle":
      "Select a component to inspect its physics equations, degradation kinetics and RUL.",
    "digitalTwin.anatomy.legend":
      "• Real-time telematics view • Modeling {count} physical organs ({algorithms}) per {specVersion}",

    "digitalTwin.organ.algorithmPrefix": "Algorithm:",
    "digitalTwin.organ.proofButton": "Formula & Proof",
    "digitalTwin.organ.rulLabel": "Remaining Useful Life",
    "digitalTwin.organ.healthLevelLabel": "Component VHI Health Level",
    "digitalTwin.organ.thresholdPrefix": "Threshold:",
    "digitalTwin.organ.physicalFinding": "SAD Physical Assessment:",

    "digitalTwin.trajectory.title": "Deterministic Predictive Trajectory",
    "digitalTwin.trajectory.proofButton": "Degradation Proof",
    "digitalTwin.trajectory.subtitle":
      "Comparison of VHI score without action vs with preventive workshop action.",
    "digitalTwin.trajectory.day0": "Today (D0)",
    "digitalTwin.trajectory.day30": "In 30 Days (D+30)",
    "digitalTwin.trajectory.day30Sub": "Without Intervention vs With Intervention",
    "digitalTwin.trajectory.day60": "In 60 Days (D+60)",
    "digitalTwin.trajectory.day90": "In 90 Days (D+90)",
    "digitalTwin.trajectory.highRisk": "(High Breakdown Risk)",

    "digitalTwin.arbitrage.title": "Financial Arbitrage SAD → ADS ({currency})",
    "digitalTwin.arbitrage.roi": "ROI {roi}x",
    "digitalTwin.arbitrage.subtitle":
      "Deterministic arbitrage: Preventive Cost vs Inaction Risk (desert towing & downtime).",
    "digitalTwin.arbitrage.proofButton": "Financial Proof",
    "digitalTwin.arbitrage.preventiveCost": "Preventive Action Cost",
    "digitalTwin.arbitrage.preventiveCostSub": "OEM Parts + Workshop Labor",
    "digitalTwin.arbitrage.breakdownRisk": "Severe Breakdown Risk",
    "digitalTwin.arbitrage.breakdownRiskSub": "Engine breakdown + desert towing",
    "digitalTwin.arbitrage.towingAndImmo": "Towing & Downtime",
    "digitalTwin.arbitrage.perDayDowntime": "+ {amount}/day downtime",
    "digitalTwin.arbitrage.netSavings": "Net Benefit",
    "digitalTwin.arbitrage.actionInDays": "Action within {days} days",
    "digitalTwin.arbitrage.recommendation": "ADS Recommendation:",
    "digitalTwin.arbitrage.maxDays": "Max: {days} d.",
    "digitalTwin.arbitrage.openWorkOrder": "Open Workshop Work Order ({currency})",
    "digitalTwin.arbitrage.redirectNotification":
      "Redirecting to Work Orders module for asset {assetCode}...",

    "digitalTwin.simulation.title": "Simulation Studio: What-If Stress Scenarios ({wilayasCount} Wilayas)",
    "digitalTwin.simulation.subtitle":
      "Evaluate climate stress across {wilayasCount} Wilayas and driving styles on VHI.",
    "digitalTwin.simulation.wilayaSelect": "Wilaya ({wilayasCount} Wilayas):",
    "digitalTwin.simulation.desertTransitCheckbox": "Desert Transit (Towing {amount})",
    "digitalTwin.simulation.bioZone": "Bioclimatic Zone",
    "digitalTwin.simulation.summerTempMax": "Max Summer T°",
    "digitalTwin.simulation.silicaDust": "Silica & Dust",
    "digitalTwin.simulation.oilArrhenius": "Oil Arrhenius",
    "digitalTwin.simulation.brakeGradient": "Brake Gradient",
    "digitalTwin.simulation.climateSliderLabel": "Wilaya Severity (K_clim)",
    "digitalTwin.simulation.driverSliderLabel": "Driver Style (K_driver)",
    "digitalTwin.simulation.recalculateBtn": "Recalculate Digital Twin",
    "digitalTwin.simulation.recalculatingBtn": "Computing physics equations...",
    "digitalTwin.simulation.successNotification":
      "Simulation validated for Wilaya {wilayaCode} - {wilayaName} (VHI: {vhi}/100)",
    "digitalTwin.simulation.climateMin": "1.00 (Temperate)",
    "digitalTwin.simulation.climateMax": "1.70 (In Salah/HMD)",
    "digitalTwin.simulation.driverMin": "0.80 (Eco)",
    "digitalTwin.simulation.driverMax": "1.60 (Aggressive)",
    "digitalTwin.simulation.limits.climateMin": "1.00 (Temperate)",
    "digitalTwin.simulation.limits.climateMax": "1.70 (In Salah/HMD)",
    "digitalTwin.simulation.limits.driverMin": "0.80 (Eco)",
    "digitalTwin.simulation.limits.driverMax": "1.60 (Aggressive)",

    "digitalTwin.ads.badge": "ADS AUTONOMOUS ACTION",
    "digitalTwin.ads.title": "Predictive Parts Reservation & Fleet Substitution",
    "digitalTwin.ads.subtitle":
      "Proactive allocation of OEM parts before critical wear threshold.",
    "digitalTwin.ads.inStock": "In Stock ({qty})",
    "digitalTwin.ads.oemRef": "OEM Ref: {partNumber} • {homologation}",
    "digitalTwin.ads.substitutionWarning": "Fleet Replacement Recommended (VHI < {threshold})",
    "digitalTwin.ads.suggestedAsset": "Suggested Asset: {name} ({code})",
    "digitalTwin.ads.vhiHealth": "VHI Health: {vhi}/100 • {reason}",
    "digitalTwin.ads.generateOrderBtn": "Generate Preventive Work Order",
    "digitalTwin.ads.generatingOrderNotification":
      "Generating preventive work order for {assetCode}...",

    "digitalTwin.empty.title": "No Digital Twin Available",
    "digitalTwin.empty.description":
      "No asset is currently configured for predictive telematics or session is inactive.",
    "digitalTwin.empty.retry": "Refresh Fleet Data",
    "digitalTwin.error.title": "Error Loading Digital Twin",
    "digitalTwin.error.retry": "Retry",
    "digitalTwin.common.unavailable": "Data unavailable",
    "digitalTwin.common.loading": "Loading physics equations...",
    "digitalTwin.loading": "Loading Digital Twin...",
    "digitalTwin.proof.unavailable": "Calculation proof details unavailable.",
    "digitalTwin.config.defaultBanner": "Default configuration active — thresholds are sourced from local fallback.",
    "digitalTwin.error.unknown": "Unknown error",
    "digitalTwin.share.summary": "{assetCode} — VHI {vhi}/100 | {odometer} km | {wilaya} | {organs} organs ({algorithms}) | {spec}",
    "digitalTwin.share.noAlgorithms": "physics algorithms",
    "digitalTwin.share.unknownSpec": "MASTER_SPEC",
    "digitalTwin.share.copied": "Summary copied to clipboard",
    "digitalTwin.share.copiedShort": "Copied!",
    "digitalTwin.share.copy": "Copy summary",
    "digitalTwin.share.copyAria": "Copy digital twin summary",
    "digitalTwin.share.copyFailed": "Unable to copy — check browser permissions",
  },
};

/**
 * Traduit une clé avec interpolation de paramètres
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  let text = dict[key] || TRANSLATIONS.fr[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * Hook utilitaire pour utiliser la traduction
 */
export function useI18n(preferredLocale: string = 'fr') {
  const norm = preferredLocale.toLowerCase();
  const locale: Locale = norm.startsWith('ar') ? 'ar' : norm.startsWith('en') ? 'en' : 'fr';
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  return { t, locale };
}
