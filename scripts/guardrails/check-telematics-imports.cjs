/**
 * Garde-fou C : Règle d'architecture d'étanchéité télématique
 * 
 * Règle : Les modules métier (actifs, maintenance, décisions, contrôle de gestion)
 * ne doivent JAMAIS importer directement des bibliothèques ou types propriétaires Traccar ou flespi.
 * L'intégration télématique doit être strictement cantonnée aux adaptateurs (ports & adapters).
 */
const fs = require('fs');
const path = require('path');

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*traccar[^'"]*['"]/i,
  /require\(['"][^'"]*traccar[^'"]*['"]\)/i,
  /from\s+['"][^'"]*flespi[^'"]*['"]/i,
  /require\(['"][^'"]*flespi[^'"]*['"]\)/i,
];

// Chemins autorisés à communiquer avec les SDK/protocoles externes
const ALLOWED_ADAPTER_PATHS = [
  path.normalize('telematics/adapters'),
  path.normalize('modules/telematics/providers'),
  path.normalize('scripts/guardrails'),
  path.normalize('telematics'),
];

function checkFile(filePath, violations) {
  const normPath = path.normalize(filePath);
  if (ALLOWED_ADAPTER_PATHS.some(allowed => normPath.includes(allowed))) {
    return; // chemin autorisé
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // ignorer commentaires
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          line: idx + 1,
          code: trimmed,
        });
      }
    }
  });
}

function scanDir(dir, violations) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (['node_modules', 'dist', '.turbo', '.next'].includes(entry.name)) continue;

    if (entry.isDirectory()) {
      scanDir(full, violations);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      checkFile(full, violations);
    }
  }
}

function run() {
  console.log('[GUARDRAIL] Vérification de l\'étanchéité architecturale télématique (Traccar / flespi)...');

  const targetDirs = [
    path.join(process.cwd(), 'apps', 'api', 'src'),
    path.join(process.cwd(), 'apps', 'web', 'src'),
    path.join(process.cwd(), 'packages'),
  ];

  const violations = [];
  targetDirs.forEach(d => scanDir(d, violations));

  if (violations.length > 0) {
    console.error('❌ Violation d\'architecture télématique : Dépendance directe vers Traccar/flespi détectée en dehors des adaptateurs :');
    violations.forEach(v => {
      console.error(`  - ${v.file}:${v.line} -> ${v.code}`);
    });
    return 1;
  }

  console.log('✓ Étanchéité télématique validée : Aucun import propriétaire Traccar/flespi dans le domaine métier.');
  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = { run };
