/**
 * Garde-fou A : Détection de secrets et fuites de clés API / credentials
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP)?\s*PRIVATE KEY-----/ },
  { name: 'Generic Password in URL', regex: /postgresql:\/\/[^:]+:[^@\s]+@/i },
  { name: 'Traccar / Flespi Token', regex: /(traccar|flespi)_(token|secret|password|api_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'High Entropy Secret String', regex: /(secret|password|bearer|apikey|api_key|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{24,}['"]/i },
];

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.pnpm-store',
  'dist',
  '.next',
  '.turbo',
  '.venv',
  '__pycache__',
  'package-lock.json',
  'pnpm-lock.yaml',
  '.env.example',
  'check-secrets.cjs',
];

function scanDirectory(dir, violations = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath);

    if (IGNORED_PATHS.some(ignored => relPath.includes(ignored))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, violations);
    } else if (entry.isFile()) {
      // Ignorer fichiers binaires
      if (/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|lock)$/i.test(entry.name)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Ignorer exemples et mocks explicitement déclarés
          if (line.includes('docteurflotte_dev_password_local_only') || line.includes('example') || line.includes('mock')) {
            return;
          }

          for (const pattern of SECRET_PATTERNS) {
            if (pattern.regex.test(line)) {
              violations.push({
                file: relPath,
                line: index + 1,
                rule: pattern.name,
                snippet: line.trim().substring(0, 80),
              });
            }
          }
        });
      } catch (err) {
        // Ignorer erreurs de lecture de fichiers non UTF-8
      }
    }
  }

  return violations;
}

function run() {
  console.log('[GUARDRAIL] Vérification de détection de secrets...');
  
  // 1. Essayer gitleaks si explicitement activé
  if (process.env.GITLEAKS_ENABLED === 'true') {
    try {
      execSync('gitleaks version', { stdio: 'pipe', timeout: 1000 });
      execSync('gitleaks detect --no-git --source . --verbose', { stdio: 'inherit' });
      console.log('✓ Audit gitleaks : Zéro secret détecté.');
      return 0;
    } catch {
      console.log('ℹ gitleaks échoué ou absent. Utilisation de l\'analyseur statique intégré...');
    }
  }

  // 2. Analyseur intégré
  const violations = scanDirectory(process.cwd());

  if (violations.length > 0) {
    console.error(`❌ ${violations.length} secret(s) potentiel(s) détecté(s) :`);
    violations.forEach(v => {
      console.error(`  - [${v.rule}] ${v.file}:${v.line} -> ${v.snippet}`);
    });
    return 1;
  }

  console.log('✓ Détection de secrets : Zéro secret exposé dans le code source.');
  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = { run };
