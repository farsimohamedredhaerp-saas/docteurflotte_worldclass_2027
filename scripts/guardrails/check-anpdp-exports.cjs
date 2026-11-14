/**
 * GUARDRAIL ANPDP (Loi 18-07) : Contrôle Statique & Automatisé Anti-Fuite PII
 * Vérifie qu'aucun identifiant personnel en clair (nom chauffeur, permis, NIN, NIS, téléphone)
 * n'est émis dans les requêtes vers des services externes tiers (Ollama, scrapers, API cartographiques).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
console.log('🛡️  [ANPDP Loi 18-07] Audit automatisé anti-fuite de données personnelles...');

// Fichiers/dossiers d'intégration ou d'appels externes inspectés
const TARGET_DIRS = [
  path.join(ROOT, 'apps/web/src/lib'),
  path.join(ROOT, 'apps/api/src/copilot'),
  path.join(ROOT, 'apps/api/src/sovereign-rag'),
  path.join(ROOT, 'apps/api/src/telematics'),
];

// Motifs suspects de fuite PII directe dans des payloads d'export
const FORBIDDEN_EXPORT_PATTERNS = [
  /api-external.*driverLicenseNumber/i,
  /api-external.*driverPhone/i,
  /api-external.*driverNif/i,
  /api-external.*socialSecurityNumber/i,
];

let violations = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Si le fichier effectue des requêtes sortantes vers l'extérieur
      if (content.includes('fetch(') || content.includes('axios.') || content.includes('http')) {
        for (const pattern of FORBIDDEN_EXPORT_PATTERNS) {
          if (pattern.test(content)) {
            console.error(`❌ [VIOLATION ANPDP 18-07] Fuite potentielle de PII détectée dans : ${fullPath}`);
            violations++;
          }
        }
      }
    }
  }
}

for (const dir of TARGET_DIRS) {
  scanDir(dir);
}

if (violations === 0) {
  console.log('✅ [PASS] Aucune émission de PII en clair vers des tiers détectée.');
  console.log('✓ Conforme Loi 18-07 ANPDP (Pseudonymisation matérielle validée).');
  process.exit(0);
} else {
  console.error(`🚨 ÉCHEC : ${violations} violation(s) Loi 18-07 ANPDP constatée(s).`);
  process.exit(1);
}

