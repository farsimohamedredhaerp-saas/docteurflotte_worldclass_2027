/**
 * ==============================================================================
 * DOCTEURFLOTTE — Gestionnaire & Générateur de Licences Matérielles (Ed25519)
 * ==============================================================================
 * Outil CLI réservé à l'éditeur DocteurFlotte pour :
 * 1. Générer la paire de clés cryptographiques Ed25519 (Privée / Publique).
 * 2. Calculer l'empreinte matérielle d'une machine cliente.
 * 3. Signer et émettre des licences inviolables (.lic) liées au matériel.
 * 4. Vérifier une licence existante hors-ligne.
 * 
 * Usage :
 *   node scripts/security/license-manager.cjs generate-keys
 *   node scripts/security/license-manager.cjs get-hwid
 *   node scripts/security/license-manager.cjs issue --customer "Sonatrach EP" --hwid "DF-HWID-..." --days 365 --assets 500
 *   node scripts/security/license-manager.cjs verify license.lic
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// Stockage sécurisé des clés HORS du dépôt Git (dans le répertoire utilisateur ou vault)
const KEYS_DIR = process.env.LICENSE_KEYS_DIR || path.join(os.homedir(), '.docteurflotte', 'keys');

// Empreinte matérielle locale en pur JS/Node
function computeLocalHwid() {
  const salt = 'DOCTEURFLOTTE_SOVEREIGN_HARDWARE_INTEGRITY_SALT_2026_DZ';
  let uuid = 'UNKNOWN-UUID';
  const platform = os.platform();

  if (platform === 'linux') {
    const paths = ['/sys/class/dmi/id/product_uuid', '/etc/machine-id'];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        uuid = fs.readFileSync(p, 'utf8').trim();
        break;
      }
    }
  } else if (platform === 'win32') {
    try {
      const out = execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
        encoding: 'utf8',
        timeout: 2000,
      }).trim();
      if (out) uuid = out;
    } catch {
      uuid = os.hostname();
    }
  }

  // MAC
  let mac = '00:00:00:00:00:00';
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    if (!name.startsWith('lo') && !name.startsWith('docker') && !name.startsWith('veth')) {
      const list = ifaces[name] || [];
      const valid = list.find(i => !i.internal && i.mac && i.mac !== '00:00:00:00:00:00');
      if (valid) {
        mac = valid.mac.toUpperCase();
        break;
      }
    }
  }

  const cpus = os.cpus();
  const cpu = `${cpus.length > 0 ? cpus[0].model : 'CPU'}-${cpus.length}-${os.arch()}`;

  const raw = `${salt}|UUID:${uuid}|MAC:${mac}|CPU:${cpu}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();

  return `DF-HWID-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
}

function generateKeys() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const privPath = path.join(KEYS_DIR, 'ed25519_private.pem');
  const pubPath = path.join(KEYS_DIR, 'ed25519_public.pem');

  fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(pubPath, publicKey, { mode: 0o644 });

  console.log('✓ [KEYS GENERATED] Paire de clés Ed25519 générée avec succès dans scripts/security/keys/');
  console.log(`  - Clé privée (CONFIDENTIEL ÉDITEUR) : ${privPath}`);
  console.log(`  - Clé publique (EMBARQUÉE DANS L'APP) : ${pubPath}`);
  console.log('\nClé publique à copier dans apps/api/src/security/hardware-license/license-verifier.service.ts :');
  console.log(publicKey);
}

function issueLicense(args) {
  const privPath = path.join(KEYS_DIR, 'ed25519_private.pem');
  if (!fs.existsSync(privPath)) {
    console.error('❌ Clé privée introuvable. Exécutez d\'abord : node license-manager.cjs generate-keys');
    process.exit(1);
  }

  const privateKeyPem = fs.readFileSync(privPath, 'utf8');

  // Paramètres
  const customerName = args['--customer'] || 'Client Partenaire Algérie';
  const hwid = args['--hwid'] || computeLocalHwid();
  const days = parseInt(args['--days'] || '365', 10);
  const maxAssets = parseInt(args['--assets'] || '100', 10);
  const plan = args['--plan'] || 'PLAN-MODE2-PREDICTIVE';

  const now = new Date();
  const validUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const payload = {
    licenseId: `LIC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    customerName,
    plan,
    maxAssets,
    hardwareFingerprint: hwid,
    validFrom: now.toISOString(),
    validUntil: validUntil.toISOString(),
    issuedAt: now.toISOString(),
  };

  const payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
  const signature = crypto.sign(null, payloadBuffer, privateKeyPem).toString('base64');

  const licenseContent = {
    payload,
    signature,
  };

  const outPath = path.join(process.cwd(), 'license.lic');
  fs.writeFileSync(outPath, JSON.stringify(licenseContent, null, 2), 'utf8');

  console.log('✓ [LICENSE ISSUED] Licence générée et signée avec succès :');
  console.log(`  - Fichier : ${outPath}`);
  console.log(`  - Client : ${customerName}`);
  console.log(`  - Empreinte Matérielle : ${hwid}`);
  console.log(`  - Véhicules autorisés : ${maxAssets}`);
  console.log(`  - Validité : du ${payload.validFrom} au ${payload.validUntil}`);
}

function verifyLicenseFile(filePath) {
  const pubPath = path.join(KEYS_DIR, 'ed25519_public.pem');
  if (!fs.existsSync(pubPath)) {
    console.error('❌ Clé publique introuvable pour vérification.');
    process.exit(1);
  }

  const targetPath = filePath || path.join(process.cwd(), 'license.lic');
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Fichier introuvable : ${targetPath}`);
    process.exit(1);
  }

  const publicKeyPem = fs.readFileSync(pubPath, 'utf8');
  const fileData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

  const payloadBuffer = Buffer.from(JSON.stringify(fileData.payload), 'utf8');
  const signatureBuffer = Buffer.from(fileData.signature, 'base64');

  const isSigValid = crypto.verify(null, payloadBuffer, publicKeyPem, signatureBuffer);
  const localHwid = computeLocalHwid();

  console.log('\n--- RÉSULTAT DE VÉRIFICATION ---');
  console.log(`Signature Cryptographique Ed25519 : ${isSigValid ? '✓ VALIDE' : '❌ INVALIDE / FALSIFIÉE'}`);
  console.log(`Client : ${fileData.payload.customerName}`);
  console.log(`Licence HWID autorisée : ${fileData.payload.hardwareFingerprint}`);
  console.log(`Machine locale HWID : ${localHwid}`);
  
  const hwMatch = fileData.payload.hardwareFingerprint === '*' || fileData.payload.hardwareFingerprint === localHwid;
  console.log(`Correspondance Matérielle : ${hwMatch ? '✓ CORRESPOND (Machine autorisée)' : '❌ INCOMPATIBLE (Machine non autorisée)'}`);

  const now = Date.now();
  const expiry = Date.parse(fileData.payload.validUntil);
  const isExpired = now > expiry;
  console.log(`Statut temporel : ${!isExpired ? '✓ ACTIF (Jusqu\'au ' + fileData.payload.validUntil + ')' : '❌ EXPIRÉE'}`);

  if (isSigValid && hwMatch && !isExpired) {
    console.log('\n🚀 CONCLUSION : LICENCE ENTIÈREMENT CONFORME ET AUTORISÉE.');
  } else {
    console.log('\n🚨 CONCLUSION : LICENCE REJETÉE PAR LE SYSTÈME ANTI-TAMPERING.');
  }
}

// Analyse des arguments CLI
const args = process.argv.slice(2);
const command = args[0];

const parsedArgs = {};
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    parsedArgs[args[i]] = args[i + 1] || true;
    i++;
  }
}

if (command === 'generate-keys') {
  generateKeys();
} else if (command === 'get-hwid') {
  console.log(`Empreinte Matérielle de cette machine : ${computeLocalHwid()}`);
} else if (command === 'issue') {
  issueLicense(parsedArgs);
} else if (command === 'verify') {
  verifyLicenseFile(args[1]);
} else {
  console.log('Usage :');
  console.log('  node license-manager.cjs generate-keys');
  console.log('  node license-manager.cjs get-hwid');
  console.log('  node license-manager.cjs issue --customer "Nom" --hwid "DF-HWID-..." --days 365 --assets 100');
  console.log('  node license-manager.cjs verify [fichier.lic]');
}

