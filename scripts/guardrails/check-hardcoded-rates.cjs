/**
 * Garde-fou Porte 4 : Interdit les valeurs numériques de taux ou tarifs en dur dans les composants UI
 * Autorise uniquement useSystemConfig().xxx ou @docteurflotte/contracts
 */
const fs = require('fs');
const path = require('path');

const FORBIDDEN = [
  { name: 'Taux horaire MO 1500 DA en dur', regex: /1500\s*DA/gi },
  { name: 'Forfait saharien 75 000 DA en dur', regex: /75000\s*DA|75\s*000\s*DA/gi },
  { name: 'Taux TVA 19% inline en dur', regex: /\b19\s*%\s*TVA/gi },
];

const SCAN_DIR = path.resolve(__dirname, '../../apps/web/src/app');
let hasError = false;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '_legacy' && entry.name !== 'node_modules') {
      scanDir(fullPath);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const rule of FORBIDDEN) {
        if (rule.regex.test(content)) {
          console.error(`[PORTE 4 VIOLATION] ${rule.name} détecté dans : ${fullPath}`);
          hasError = true;
        }
      }
    }
  }
}

scanDir(SCAN_DIR);
if (hasError) {
  console.error('❌ Échec Porte 4 : Constantes tarifaires en dur détectées.');
  process.exit(1);
} else {
  console.log('✓ [PASS] Porte 4 : Zéro constante tarifaire en dur.');
}

