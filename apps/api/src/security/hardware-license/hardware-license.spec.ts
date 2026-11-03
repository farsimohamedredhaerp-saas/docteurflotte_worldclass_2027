import { HardwareFingerprint } from './hardware-fingerprint';
import { LicenseVerifierService, LicensePayload } from './license-verifier.service';
import * as crypto from 'crypto';

describe('HardwareLicense & Anti-Tampering Security', () => {
  let verifier: LicenseVerifierService;

  beforeEach(() => {
    verifier = new LicenseVerifierService();
  });

  it('devrait générer une empreinte matérielle non vide et canonique (DF-HWID-*)', () => {
    const hwid = HardwareFingerprint.generateFingerprint();
    expect(hwid).toBeDefined();
    expect(hwid).toMatch(/^DF-HWID-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it('devrait valider avec succès une signature Ed25519 générée avec la clé privée correspondante', () => {
    // Génération d'une paire de clés éphémère Ed25519 pour le test
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const payload: LicensePayload = {
      licenseId: 'LIC-TEST-001',
      customerName: 'Sonatrach EP',
      plan: 'PLAN-MODE2-PREDICTIVE',
      maxAssets: 100,
      hardwareFingerprint: HardwareFingerprint.generateFingerprint(),
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      issuedAt: '2026-01-01T00:00:00.000Z',
    };

    const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey).toString('base64');

    const isValid = verifier.verifySignature(payload, signature, publicKey);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter formellement une signature altérée ou falsifiée', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const payload: LicensePayload = {
      licenseId: 'LIC-TEST-002',
      customerName: 'Client Réel',
      plan: 'PLAN-MODE1-STANDARD',
      maxAssets: 50,
      hardwareFingerprint: HardwareFingerprint.generateFingerprint(),
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      issuedAt: '2026-01-01T00:00:00.000Z',
    };

    const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey).toString('base64');

    // Altération du payload (ex: pirate tentant d'augmenter son quota à 10 000 véhicules)
    const tamperedPayload = { ...payload, maxAssets: 10000 };

    const isValid = verifier.verifySignature(tamperedPayload, signature, publicKey);
    expect(isValid).toBe(false);
  });
});

