/**
 * Garde-fou Anti-Hardcode : Moteur Décisionnel (packages/decision-engine/src)
 * 
 * RÈGLE NON NÉGOCIABLE N°1 :
 * L'ontologie est du code, les valeurs sont des données.
 * Échoue rigoureusement si un numéro de compte SCF, un taux fiscal, un seuil
 * ou un terme d'accusation (« fraude », « rejet certain ») est détecté dans le code source.
 */

const fs = require('fs');
const path = require('path');

const VIOLATION_PATTERNS = [
  // 1. Taux fiscaux algériens en dur
  {
    name: 'Taux fiscal en dur (TVA 19%/9%, IBS 26%/23%/19%, IFU 5%/12%, ANAE 0.5%, TLS 3%/1.5%, Dividendes 15%)',
    regex: /\b(0\.19|0\.09|0\.26|0\.23|0\.15|0\.12|0\.05|0\.015|0\.005|0\.03)\b/,
  },
  // 2. Seuils et plafonds fiscaux algériens en dur (DA)
  {
    name: 'Seuil ou plafond fiscal en dur (300k, 3M, 1M, 100k, 8M, 5M, 10M, 30k, 10k)',
    regex: /\b(300000|300_000|3000000|3_000_000|1000000|1_000_000|100000|100_000|8000000|8_000_000|5000000|5_000_000|10000000|10_000_000|30000|30_000|10000|10_000)\b/,
  },
  // 3. Numéros de comptes SCF en dur (interdit, seuls les AccountRole sont permis)
  {
    name: 'Numéro de compte SCF en dur (classes 1 à 7 : ex 445, 411, 401, 512, 530, 601, 700...)',
    regex: /\b(445\d*|4457\d*|530\d*|512\d*|411\d*|401\d*|601\d*|700\d*|681\d*|281\d*|455\d*|613\d*|766\d*|666\d*)\b/,
  },
  // 4. Termes d'accusation interdits (Règle 6 : indicateurs, pas accusations)
  {
    name: 'Terme accusatoire formellement proscrit (« fraude » ou « rejet certain »)',
    regex: /\b(fraude|rejet\s+certain)\b/i,
  },
];

const SCAN_DIR = path.join(process.cwd(), 'packages', 'decision-engine', 'src');

const TECHNICAL_LINE_PATTERNS = [
  /\bMAX_OPERATIONS\b/i,
  /\bmaxOperations\b/i,
];

function checkFile(filePath, violations) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Ignorer les commentaires et constantes techniques d'évaluation
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }
    if (TECHNICAL_LINE_PATTERNS.some((p) => p.test(trimmed))) {
      return;
    }

    for (const rule of VIOLATION_PATTERNS) {
      if (rule.regex.test(trimmed)) {
        violations.push({
          file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
          line: idx + 1,
          rule: rule.name,
          snippet: trimmed.substring(0, 100),
        });
      }
    }
  });
}

function scan(dir, violations) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full, violations);
    } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      checkFile(full, violations);
    }
  }
}

function main() {
  console.log('[LINT:HARDCODE] Vérification de l\'absence de littéraux fiscaux et numéros de comptes...');
  console.log(`Cible : ${SCAN_DIR}`);

  const violations = [];
  scan(SCAN_DIR, violations);

  if (violations.length > 0) {
    console.error(`\n❌ ÉCHEC DU GARDE-FOU ANTI-HARDCODE : ${violations.length} violation(s) détectée(s) :\n`);
    violations.forEach((v, i) => {
      console.error(`  ${i + 1}. [${v.rule}]`);
      console.error(`     Fichier : ${v.file}:${v.line}`);
      console.error(`     Code    : ${v.snippet}\n`);
    });
    process.exit(1);
  }

  console.log('✅ SUCCÈS : 0 littéral fiscal ou numéro de compte en dur dans packages/decision-engine/src.');
  process.exit(0);
}

main();

