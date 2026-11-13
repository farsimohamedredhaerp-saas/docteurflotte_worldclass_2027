#!/usr/bin/env node
/**
 * Outil CLI Hors-Ligne de Gestion des Packs Réglementaires
 * Commandes :
 *   node scripts/pack-cli.cjs sign <fichier_pack.json> <cle_privee.pem>
 *   node scripts/pack-cli.cjs verify <fichier_pack.json> <cle_publique.pem>
 *   node scripts/pack-cli.cjs generate-keys
 */

const fs = require('fs');
const path = require('path');
const {
  EngineCrypto,
  RegPackService,
} = require('../packages/decision-engine/dist');

const [,, command, arg1, arg2] = process.argv;

function printUsage() {
  console.log(`
Usage:
  node scripts/pack-cli.cjs generate-keys <out_dir>
  node scripts/pack-cli.cjs sign <pack.json> <private_key.pem>
  node scripts/pack-cli.cjs verify <pack.json> <public_key.pem>
`);
}

switch (command) {
  case 'generate-keys': {
    const outDir = arg1 || process.cwd();
    const { publicKeyPem, privateKeyPem, publicKeyHex } = EngineCrypto.generateKeyPair();

    const privPath = path.join(outDir, 'ed25519_pack_signing.key');
    const pubPath = path.join(outDir, 'ed25519_pack_signing.pub');

    fs.writeFileSync(privPath, privateKeyPem, 'utf8');
    fs.writeFileSync(pubPath, publicKeyPem, 'utf8');

    console.log('✅ Paire de clés Ed25519 générée avec succès :');
    console.log(`   Clé privée : ${privPath}`);
    console.log(`   Clé publique : ${pubPath}`);
    console.log(`   Clé publique (hex) : ${publicKeyHex}`);
    break;
  }

  case 'sign': {
    if (!arg1 || !arg2) {
      console.error('❌ Erreur : paramètres manquants pour la signature.');
      printUsage();
      process.exit(1);
    }

    const packPath = path.resolve(arg1);
    const privKeyPath = path.resolve(arg2);

    if (!fs.existsSync(packPath) || !fs.existsSync(privKeyPath)) {
      console.error('❌ Erreur : fichier introuvable.');
      process.exit(1);
    }

    const packRaw = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    const privateKeyPem = fs.readFileSync(privKeyPath, 'utf8');

    const signedPack = RegPackService.signPack(packRaw, privateKeyPem);
    fs.writeFileSync(packPath, JSON.stringify(signedPack, null, 2), 'utf8');

    console.log('✅ Pack signé avec succès :');
    console.log(`   Code pack : ${signedPack.packCode}`);
    console.log(`   Version   : ${signedPack.version}`);
    console.log(`   SHA-256   : ${signedPack.contentHash}`);
    console.log(`   Signature : ${signedPack.signatureEd25519.substring(0, 32)}...`);
    break;
  }

  case 'verify': {
    if (!arg1 || !arg2) {
      console.error('❌ Erreur : paramètres manquants pour la vérification.');
      printUsage();
      process.exit(1);
    }

    const packPath = path.resolve(arg1);
    const pubKeyPath = path.resolve(arg2);

    if (!fs.existsSync(packPath) || !fs.existsSync(pubKeyPath)) {
      console.error('❌ Erreur : fichier introuvable.');
      process.exit(1);
    }

    const packRaw = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    const publicKeyPem = fs.readFileSync(pubKeyPath, 'utf8');

    const summary = RegPackService.verifyPack(packRaw, publicKeyPem);

    console.log('\n================================================================');
    console.log(` RAPPORT DE VÉRIFICATION — PACK ${packRaw.packCode}`);
    console.log('================================================================\n');

    console.log(`Statut signature : ${summary.signatureResult.status} (${summary.signatureResult.valid ? 'VALIDE' : 'NON VALIDE'})`);
    console.log(`Condensat SHA-256 : ${summary.signatureResult.contentHash}`);

    console.log(`\nPortes de publication : ${summary.gateReport.isApprovedForPublication ? 'PASS' : 'REJETÉ'}`);
    console.log(`Items vérifiés : ${summary.gateReport.verifiedItemsCount}/${summary.gateReport.totalItemsCount}`);
    console.log(`Items non vérifiés (UNVERIFIED) : ${summary.gateReport.unverifiedItemsCount}`);

    if (summary.gateReport.failures.length > 0) {
      console.log('\nMotifs de rejet :');
      summary.gateReport.failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.gateCode}] ${f.ruleDescription}`);
        console.log(`     ${f.details}`);
      });
    }

    if (!summary.isFullyCompliantForProduction) {
      process.exit(2);
    }
    console.log('\n✅ Pack homologué et prêt pour mise en production.');
    break;
  }

  default:
    printUsage();
    process.exit(1);
}

