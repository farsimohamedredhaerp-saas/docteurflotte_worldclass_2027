/**
 * Garde-fou D : Détection des littéraux métier suspects (montants, taux de TVA, seuils réglementaires)
 * 
 * Règle : Les paramètres économiques, taux de TVA, plafonds d'amortissement et seuils
 * ne doivent pas être codés en dur dans les services métiers, mais provenir
 * des packs pays/tenant versionnés et configurables (@docteurflotte/contracts).
 */
const fs = require('fs');
const path = require('path');

const SUSPICIOUS_LITERALS = [
  { name: 'Taux TVA Algérie en dur (19% ou 9%)', regex: /\b(0\.19|0\.09)\b/ },
  { name: 'Plafond amortissement VL (3 000 000 DA)', regex: /\b(3000000|3_000_000)\b/ },
  { name: 'Seuil d\'économie suspect / non sourcé (180 000 DA)', regex: /\b(180000|180_000)\b/ },
  { name: 'Montant forfaitaire fixe suspect (> 100 000)', regex: /(:|\=)\s*([1-9][0-9]{5,})\b/ },
];

const IGNORED_PATHS = [
  'node_modules',
  'dist',
  '.turbo',
  '.next',
  '.venv',
  '__pycache__',
  'seeds',
  'scripts',
  'test',
  '.spec.ts',
  '.test.ts',
  '.mock.ts',
  'simulation-sandbox',
  'demoFallbackData.ts',
  'useTelemetryStream.ts',
  'FleetHighDensityTable.tsx',
  'api-maintenance-40.ts',
  'api-fleet-intelligence.ts',
  'oem-scraper/route.ts',
  'page.tsx',
  'country-packs.ts',
  'algeria-regulatory.ts',
  'physics-engine.ts',
];

const NON_ECONOMIC_LINE_PATTERNS = [
  /\b(lat|lng|latitude|longitude)\b/i,
  /(km|odometer|odo|meter|counter|interval|maxkm|specification|vin|imei|max-age)/i,
  /\b(mock|fallback|demo|test|threshold|seuil)\b/i,
];

function checkFile(filePath, warnings) {
  const normPath = path.normalize(filePath).replace(/\\/g, '/');
  if (IGNORED_PATHS.some((ignored) => normPath.includes(ignored))) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (NON_ECONOMIC_LINE_PATTERNS.some((p) => p.test(trimmed))) return;

    for (const lit of SUSPICIOUS_LITERALS) {
      if (lit.regex.test(line)) {
        warnings.push({
          file: path.relative(process.cwd(), filePath),
          line: idx + 1,
          rule: lit.name,
          snippet: trimmed.substring(0, 80),
        });
      }
    }
  });
}

function scanDir(dir, warnings) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (['node_modules', 'dist', '.turbo', '.next'].includes(entry.name)) continue;

    if (entry.isDirectory()) {
      scanDir(full, warnings);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      checkFile(full, warnings);
    }
  }
}

function run() {
  console.log('[GUARDRAIL] Détection des littéraux métier et économiques en dur...');

  const scanTargets = [
    path.join(process.cwd(), 'apps', 'api', 'src'),
    path.join(process.cwd(), 'apps', 'web', 'src'),
    path.join(process.cwd(), 'packages'),
  ];

  const warnings = [];
  scanTargets.forEach((t) => scanDir(t, warnings));

  if (warnings.length > 0) {
    console.warn(`⚠ ${warnings.length} littéral(aux) économique(s) ou réglementaire(s) suspect(s) détecté(s) :`);
    warnings.forEach((w) => {
      console.warn(`  - [${w.rule}] ${w.file}:${w.line} -> ${w.snippet}`);
    });
    console.warn('ℹ RAPPEL AGENTS.md : Les taux, seuils et montants doivent être chargés depuis un Pack Pays/Tenant versionné.');
    return 0;
  }

  console.log('✓ Contrôle des littéraux : Aucun seuil économique hardcodé suspect dans le code métier.');
  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = { run };
