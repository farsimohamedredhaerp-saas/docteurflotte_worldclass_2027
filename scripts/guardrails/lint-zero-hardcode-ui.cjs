/**
 * Garde-fou UI : Vérification stricte du principe ZÉRO HARDCODE & ISOLATION DÉMO / PRODUCTION
 * 
 * Règle d'or : Les composants de pages web (apps/web/src/app/**) ne doivent contenir
 * AUCUN tableau ou constante de simulation en dur (ex: DEMO_*, MOCK_* arrays, DEFAULT_FLEET_*).
 * Tout jeu d'essai doit être isolé dans apps/web/src/lib/simulation-sandbox/ et chargé
 * uniquement de façon conditionnelle lorsque isDemoMode === true.
 */
const fs = require('fs');
const path = require('path');

const VIOLATION_PATTERNS = [
  {
    name: 'Déclaration de constante DEMO_* en dur dans une page',
    regex: /(const|let|var)\s+DEMO_[A-Z0-9_]+\s*(=|:)/,
  },
  {
    name: 'Déclaration de constante DEFAULT_FLEET_* en dur dans une page',
    regex: /(const|let|var)\s+DEFAULT_FLEET_[A-Z0-9_]+\s*(=|:)/,
  },
  {
    name: 'Déclaration de tableau MOCK_* inline dans une page',
    regex: /(const|let|var)\s+MOCK_[A-Z0-9_]+\s*:\s*[A-Za-z0-9_]+\[\]\s*=/,
  },
];

const SCAN_DIR = path.resolve(__dirname, '../../apps/web/src/app');

function scanDirectory(dir, violations) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, violations);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      checkFile(fullPath, violations);
    }
  }
}

function checkFile(filePath, violations) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    for (const rule of VIOLATION_PATTERNS) {
      if (rule.regex.test(trimmed)) {
        violations.push({
          file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
          line: idx + 1,
          rule: rule.name,
          snippet: trimmed.substring(0, 90),
        });
      }
    }
  });
}

function main() {
  console.log('🛡️  Contrôle Zéro-Hardcode UI : Vérification de l\'isolation stricte Démo / Production...');
  const violations = [];
  scanDirectory(SCAN_DIR, violations);

  if (violations.length > 0) {
    console.error(`\n❌ ÉCHEC : ${violations.length} violation(s) du principe ZÉRO HARDCODE détectée(s) :`);
    violations.forEach((v) => {
      console.error(`   - [${v.file}:${v.line}] ${v.rule}`);
      console.error(`     Extrait : "${v.snippet}"`);
    });
    console.error('\n➡️  Action requise : Déplacez ces jeux d\'essai dans apps/web/src/lib/simulation-sandbox/ et chargez-les via dynamic import conditionné par isDemoMode.');
    process.exit(1);
  }

  console.log('✅ SUCCÈS : 100% des pages UI respectent l\'isolation stricte Démo/Production (0 mock inline).');
  process.exit(0);
}

main();
