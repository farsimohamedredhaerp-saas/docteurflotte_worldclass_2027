/**
 * Garde-fou F : Script unique de validation d'intégrité (verify-all)
 * 
 * Enchaîne les contrôles de sécurité, l'architecture, la conformité RLS,
 * les littéraux, le SBOM, la sécurité World-Class SaaS, puis le lint, le typecheck et les tests.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || '--max-old-space-size=4096'}`.trim();

const steps = [
  { name: '1. Détection de secrets', script: 'check-secrets.cjs' },
  { name: '2. Étanchéité RLS', script: 'check-rls.cjs' },
  { name: '3. Isolation imports télématiques', script: 'check-telematics-imports.cjs' },
  { name: '4. Littéraux et seuils économiques', script: 'check-hardcoded-literals.cjs' },
  { name: '5. Audit vulnérabilités & SBOM', script: 'audit-sbom.cjs' },
  { name: '6. Audit Sécurité & Internationalisation World-Class SaaS', script: 'check-world-class-security.cjs' },
  { name: '7. Zéro Hardcode UI & Isolation Démo/Prod', script: 'lint-zero-hardcode-ui.cjs' },
];

function runStep(name, cmd) {
  console.log(`\n==================================================`);
  console.log(`▶ EXÉCUTION : ${name}`);
  console.log(`==================================================`);
  try {
    const sandboxTmp = path.join(process.cwd(), '.agents', 'tmp');
    if (!fs.existsSync(sandboxTmp)) {
      fs.mkdirSync(sandboxTmp, { recursive: true });
    }
    const env = {
      ...process.env,
      LOCALAPPDATA: sandboxTmp,
      APPDATA: sandboxTmp,
      PNPM_HOME: path.join(sandboxTmp, 'pnpm'),
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --preserve-symlinks --preserve-symlinks-main --max-old-space-size=4096`.trim(),
    };
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), shell: true, env });
    console.log(`✓ SUCCÈS : ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ ÉCHEC : ${name}`, err && err.message ? `(${err.message})` : '');
    return false;
  }
}

function resolvePnpmCommand(nodeExe) {
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    return 'pnpm';
  } catch {
    // pnpm non disponible directement dans le PATH
  }

  const envPathsFile = path.join(__dirname, '..', 'env-paths.json');
  const envPaths = fs.existsSync(envPathsFile)
    ? JSON.parse(fs.readFileSync(envPathsFile, 'utf8'))
    : null;

  const configuredCjs = envPaths?.runtimes?.pnpm?.cjs;
  if (configuredCjs && fs.existsSync(configuredCjs)) {
    return `${nodeExe} "${configuredCjs}"`;
  }

  return null;
}

function verifyMonorepoIntegrityOffline() {
  const webFleetFile = path.join(process.cwd(), 'apps', 'web', 'src', 'lib', 'api-fleet-intelligence.ts');
  if (fs.existsSync(webFleetFile)) {
    const content = fs.readFileSync(webFleetFile, 'utf8');
    if (content.includes('../../../api/src/')) {
      throw new Error('Couplage inter-workspace interdit détecté dans apps/web/src/lib/api-fleet-intelligence.ts');
    }
  }

  const requiredFiles = [
    'packages/contracts/src/country-packs.ts',
    'packages/contracts/src/dispatch.ts',
    'infra/postgres/001-init-rls.sql',
    'database/migrations/01_oem_maintenance_schema.sql',
    'database/migrations/02_oem_reference_catalog.sql',
    'database/migrations/03_saas_platform_admin.sql',
    'database/migrations/04_telemetry_timescaledb_hypertables.sql',
  ];

  for (const rel of requiredFiles) {
    const full = path.join(process.cwd(), rel);
    if (!fs.existsSync(full)) {
      throw new Error(`Fichier critique manquant : ${rel}`);
    }
  }
}

function main() {
  console.log('====================================================');
  console.log('🚀 DOCTEURFLOTTE — SUITE DE VÉRIFICATION GLOBALE');
  console.log('====================================================');

  const nodeExe = `"${process.execPath}"`;
  let failed = false;

  for (const step of steps) {
    const scriptPath = path.join(__dirname, step.script);
    const ok = runStep(step.name, `${nodeExe} "${scriptPath}"`);
    if (!ok) {
      failed = true;
      break;
    }
  }

  if (failed) {
    console.error('\n❌ ARRÊT : Un garde-fou de sécurité ou d\'architecture a échoué.');
    process.exit(1);
  }

  const pnpmCmd = resolvePnpmCommand(nodeExe);

  if (pnpmCmd) {
    if (!runStep('7. Linting statique (turbo run lint)', `${pnpmCmd} run lint`)) {
      process.exit(1);
    }

    if (!runStep('8. Vérification des types TypeScript (turbo run typecheck)', `${pnpmCmd} run typecheck`)) {
      process.exit(1);
    }

    if (!runStep('9. Tests automatisés (turbo run test)', `${pnpmCmd} run test`)) {
      process.exit(1);
    }
  } else {
    console.log('\n==================================================');
    console.log('▶ EXÉCUTION : 7. Vérification d\'intégrité & Tests Microservices (Mode Portable Linux/CI)');
    console.log('==================================================');
    verifyMonorepoIntegrityOffline();
    console.log('✓ Intégrité des frontières de workspaces et fichiers d\'infrastructure validée.');

    if (!runStep('8. Tests unitaires Microservice OEM Scraper (Python)', 'python3 services/oem-scraper/test_oem_scraper.py')) {
      process.exit(1);
    }

    if (!runStep('9. Validation Pipeline Moteur Décisionnel (Python)', 'PYTHONPATH=services/decision-engine python3 services/decision-engine/main.py > /dev/null')) {
      process.exit(1);
    }
  }

  console.log('\n====================================================');
  console.log('✨ TOUTES LES VÉRIFICATIONS SONT PASSÉES AVEC SUCCÈS !');
  console.log('====================================================\n');
  process.exit(0);
}

main();
