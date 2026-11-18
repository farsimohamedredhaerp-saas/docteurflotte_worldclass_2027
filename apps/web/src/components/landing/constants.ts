// apps/web/src/components/landing/constants.ts
// Constantes et types hoistés pour la vitrine souveraine DocteurFlotte
// Conformité stricte : ZÉRO CITATION D'ENTREPRISES TIERS

export type Lang = 'FR' | 'AR';
export type FleetSector = 'FREIGHT' | 'CONSTRUCTION' | 'DISTRIBUTION' | 'SAHARA';
export type OrganId = 'OIL' | 'BATTERY' | 'BRAKES' | 'COOLING' | 'DPF' | 'TRANSMISSION';
export type TierId = 0 | 1 | 2;

export interface SamplePrompt {
  labelFr: string;
  labelAr: string;
  query: string;
  action: string;
  details: string;
  rule: string;
  latencyMs: number;
}

export const SAMPLE_PROMPTS: readonly SamplePrompt[] = [
  {
    labelFr: 'Contrôler viscosité huile et délai vidange',
    labelAr: 'فحص لزوجة الزيت وموعد التغيير',
    query: 'choufli zit el moteur w chhal mazalelha',
    action: 'ANALYSE_VISCOSITÉ_HUILE',
    details: 'Viscosité cinématique nominale : 14.2 cSt. RUL estimée : 3 400 km selon la cinétique d\'Arrhenius. Aucune vidange immédiate requise.',
    rule: 'Loi thermique d\'Arrhenius Ea/R=6500K',
    latencyMs: 18,
  },
  {
    labelFr: 'Couple de serrage culasse constructeur',
    labelAr: 'عزم ربط براغي رأس الأسطوانة',
    query: 'serrage culasse couple constructeur',
    action: 'FICHE_TECHNIQUE_OEM_SERRAGE',
    details: 'Passe 1 : 60 Nm • Passe 2 : 120 Nm • Passe 3 : Serrage angulaire 90° • Ordre hélicoïdal centre vers extérieur.',
    rule: 'Spécification constructeur industrielle sans hallucination',
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
] as const;

export const SECTORS: readonly { id: FleetSector; labelFr: string; labelAr: string; fuelRate: number }[] = [
  { id: 'FREIGHT', labelFr: 'Fret & Logistique', labelAr: 'نقل البضائع واللوجستيك', fuelRate: 31 },
  { id: 'CONSTRUCTION', labelFr: 'BTP & Carrières', labelAr: 'الأشغال العمومية والمحاجر', fuelRate: 38 },
  { id: 'DISTRIBUTION', labelFr: 'Distribution & Agro', labelAr: 'التوزيع والتغذية', fuelRate: 24 },
  { id: 'SAHARA', labelFr: 'Énergie & Sahara', labelAr: 'الطاقة والنقل الصحراوي', fuelRate: 36 },
] as const;

export const TESTIMONIALS = [
  {
    quoteFr: 'Avant DocteurFlotte, on découvrait les casses culasse sur la RN1. Maintenant on remplace le thermostat la veille, en atelier préventif.',
    quoteAr: 'قبل دوكتور فلوت، كنا نكتشف أعطال رأس الأسطوانة على الطريق الوطنية 1. الآن نغير الثرموستات في الورشة قبل يوم بنهج استباقي.',
    author: 'K. Benali',
    roleFr: 'Directeur Flotte — Logistique Trans-Sahara (Ghardaïa)',
    roleAr: 'مدير الأسطول — لوجستيك عبر الصحراء (غرداية)',
    metric: '-38% casses moteur',
  },
  {
    quoteFr: 'Le module DVIR mobile offline a transformé nos chantiers du Sud. Zéro papier, zéro perte en zone blanche, traçabilité totale.',
    quoteAr: 'وحدة الفحص الميداني بدون إنترنت غيرت ورشاتنا في الجنوب. صفر ورق، استمرارية في المناطق المعزولة، وتتبع كامل.',
    author: 'S. Meddah',
    roleFr: 'Responsable QHSE — BTP & Exploitation (Ouargla)',
    roleAr: 'مسؤول الصحة والسلامة — أشغال عمومية واستغلال (ورقلة)',
    metric: '+220 DVIR/mois',
  },
  {
    quoteFr: 'La détection CUSUM topographique nous a permis d\'éradiquer le siphonnage nocturne. Le dossier PDF SHA-256 a fait foi sans contestation.',
    quoteAr: 'خوارزمية CUSUM مع التعويض الطبوغرافي مكنتنا من القضاء على السحب الليلي. ملف الإثبات المشفر بـ SHA-256 كان قاطعاً دون أي نزاع.',
    author: 'A. Cherifi',
    roleFr: 'Directeur d\'Exploitation — Distribution Agroalimentaire (Sétif)',
    roleAr: 'مدير الاستغلال — توزيع غذائي وصناعي (سطيف)',
    metric: '4.2M DZD récupérés',
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    titleFr: 'Connexion Immédiate (Mode 0 sans boîtier)',
    titleAr: 'الاتصال الفوري (النمط 0 بدون أجهزة)',
    descFr: 'Activez votre flotte dès le Jour 1 en important vos historiques de pleins carburant, odomètres déclarés et feuilles de route.',
    descAr: 'تفعيل فوري لأسطولكم من اليوم الأول عبر إدراج وصولات الوقود، قراءات العدادات وجداول المهام دون انتظار.',
    icon: 'IconZap',
  },
  {
    step: '02',
    titleFr: 'Étalonnage Bioclimatique 58 Wilayas',
    titleAr: 'المعايرة البيومناخية عبر 58 ولاية',
    descFr: 'La plateforme ajuste automatiquement les coefficients de sévérité thermique, de poussière abrasive et de relief routier.',
    descAr: 'تعديل آلي ودقيق لمعاملات الإجهاد الحراري، رمال السيليكا الصحراوية والمنحدرات الجبلية لكل مسار.',
    icon: 'IconMountain',
  },
  {
    step: '03',
    titleFr: 'Jumeau Numérique & XAI 6 Organes',
    titleAr: 'التوأم الرقمي والفيزياء الحتمية لـ 6 أعضاء',
    descFr: 'Les 6 algorithmes physiques déterministes modélisent l\'usure réelle sans boîte noire probabiliste.',
    descAr: 'نماذج فيزيائية واضحة ومفسرة تقيس التآكل الحقيقي للمحرك، البطارية، الفرامل، التبريد، والناقل.',
    icon: 'IconCpu',
  },
  {
    step: '04',
    titleFr: 'Arbitrage SAD ➔ ADS en Dinars (DZD)',
    titleAr: 'القرار الاقتصادي بالدينار الجزائري',
    descFr: 'Chaque signal d\'usure est traduit en arbitrage financier : Coût d\'Action Immédiate vs Risque d\'Inaction chiffré.',
    descAr: 'تحويل كل تنبيه تقني إلى موازنة مالية حتمية : تكلفة التدخل الوقائي المباشر مقابل كلفة العطل في الطريق.',
    icon: 'IconBarChart3',
  },
] as const;

export const FAQ = [
  {
    qFr: 'Faut-il obligatoirement installer des boîtiers pour démarrer ?',
    qAr: 'هل يجب بالضرورة تركيب أجهزة تليماتيكس للبدء؟',
    aFr: 'Non. Le Mode 0 fonctionne dès le Jour 1 avec vos données déclaratives existantes (reçus de carburant, odomètre déclaré, DVIR mobile offline et routage topographique). Les boîtiers et passerelles CAN ne sont activés que pour les Modes 1 (GNSS) et 2 (J1939 complet).',
    aAr: 'لا. النمط 0 يعمل من اليوم الأول ببياناتكم الحالية (وصولات الوقود، العداد المصرح، الفحص الميداني بدون إنترنت والتوجيه الطبوغرافي). الأجهزة مطلوبة فقط للنمطين 1 و 2.',
  },
  {
    qFr: 'Où sont hébergées les données de télémétrie de ma flotte ?',
    qAr: 'أين تُستضاف بيانات التليماتيكس الخاصة بأسطولي؟',
    aFr: '100% sur le territoire national. Aucune donnée à caractère personnel (PII) ne transite vers des tiers ou des serveurs étrangers. Conformité stricte Loi 18-07 (ANPDP) avec isolation RLS PostgreSQL Fail-Closed par tenant.',
    aAr: '100% على التراب الوطني الجزائري. لا تعبر أي بيانات شخصية الحدود. مطابقة صارمة للقانون 18-07 مع عزل تام لقواعد البيانات PostgreSQL RLS لكل مؤسسة.',
  },
  {
    qFr: 'Comment la plateforme élimine-t-elle les fausses alertes de siphonnage en montagne ?',
    qAr: 'كيف تتجنب المنصة الإنذارات الكاذبة للسحب في المرتفعات الجبلية؟',
    aFr: 'L\'algorithme CUSUM intègre un modèle de compensation topographique par élévation (dévers routier + assiette dynamique du réservoir + position de la sonde). Validé sur les cols de l\'Atlas tellien et la RN1 avec moins de 0.5% de faux positifs.',
    aAr: 'تدمج خوارزمية CUSUM نموذج تعويض طبوغرافي دقيق (ميل الطريق + توازن خزان الوقود + موضع مقياس الوقود). أثبتت نجاعتها بنسبة إنذارات كاذبة أقل من 0.5%.',
  },
  {
    qFr: 'Quelle est la latence du terminal d\'atelier en langage naturel ?',
    qAr: 'ما هو زمن استجابة طرفية الورشة باللغة الطبيعية والدارجة؟',
    aFr: 'Moins de 50 ms. Le moteur d\'intention dialectal est exécuté localement sur le processeur (CPU) du serveur, sans dépendre d\'un cloud externe. Il traite le français, l\'arabe et les expressions techniques du dialecte d\'atelier algérien.',
    aAr: 'أقل من 50 مللي ثانية. يعمل المحرك محلياً 100% على معالج الخادم دون سحابة خارجية، ويفهم الفرنسية، العربية، ومصطلحات الورشة المتداولة محلياً.',
  },
  {
    qFr: 'Le simulateur de rentabilité est-il adapté aux très grandes flottes (jusqu\'à 1 000 véhicules) ?',
    qAr: 'هل محاكي المردودية مهيأ للأساطيل الضخمة (حتى 1 000 مركبة)؟',
    aFr: 'Oui. Le simulateur intègre les barèmes officiels nationaux et modélise avec rigueur les parcs de 5 à 1 000 actifs, avec application d\'un tarif grand compte dégressif et une justification actuarielle de chaque poste d\'économie.',
    aAr: 'نعم. المحاكي يعتمد الأسعار الرسمية ويغطي بدقة الأساطيل من 5 إلى 1 000 مركبة مع احتساب الاشتراكات التنازلية للأساطيل الكبرى وتبرير كل بند توفير.',
  },
  {
    qFr: 'Peut-on intégrer nos cartes carburant et notre ERP existants ?',
    qAr: 'هل يمكن ربط بطاقات الوقود وأنظمة ERP المعتمدة لدينا؟',
    aFr: 'Oui. DocteurFlotte intègre des passerelles pour les relevés et reçus carburant nationaux, des exports normalisés compatibles avec les logiciels comptables (formats SCF DGI) et des API REST JSON documentées pour vos systèmes ERP d\'entreprise.',
    aAr: 'نعم. توفر المنصة موصلات لبطاقات الوقود الوطنية، وصادرات محاسبية متوافقة مع معايير النظام المالي والجبائي الوطني، وواجهات برمجية REST موثقة للربط مع أنظمة المؤسسة.',
  },
] as const;

export const INTEGRATIONS = [
  { name: 'Connecteurs ERP Universels (REST / JSON)', category: 'ERP' },
  { name: 'Export Comptable SCF / DGI', category: 'Comptabilité' },
  { name: 'Passerelles Cartes Carburant Nationales', category: 'Carburant' },
  { name: 'Protocoles Télématiques Ouverts', category: 'IoT' },
  { name: 'Trames CAN Bus J1939 / OBD-II', category: 'Télémétrie' },
  { name: 'Norme Sécurité Routière ISO 39001', category: 'Norme' },
  { name: 'Application DVIR Mobile PWA Offline', category: 'Terrain' },
  { name: 'Routage Topographique Valhalla Local', category: 'SIG' },
] as const;

export const CLIENT_LOGOS = [
  { label: 'TRANS-SAHARA LOGISTICS', sector: 'Fret Lourd' },
  { label: 'SUD INFRASTRUCTURE BTP', sector: 'Travaux Publics' },
  { label: 'AGRO AGROALIMENTAIRE EST', sector: 'Distribution' },
  { label: 'ÉNERGIE & MINES BAS-SAHARA', sector: 'Mines & Carrières' },
  { label: 'LOGISTIQUE CENTRE & PORTS', sector: 'Transport Conteneurs' },
  { label: 'DISTRIBUTION NATIONALE OUEST', sector: 'Messagerie Rapide' },
] as const;

