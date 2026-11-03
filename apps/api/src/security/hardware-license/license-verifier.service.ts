/**
 * ==============================================================================
 * DOCTEURFLOTTE — Service de Vérification Cryptographique de Licence (Ed25519)
 * ==============================================================================
 * Vérifie au démarrage (OnModuleInit) la signature cryptographique asymétrique
 * hors-ligne de la licence logicielle et sa liaison matérielle (Hardware Binding).
 * Empêche toute duplication non autorisée de l'application ou des conteneurs.
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { HardwareFingerprint } from './hardware-fingerprint';

export interface LicensePayload {
  licenseId: string;
  customerName: string;
  plan: string;
  maxAssets: number;
  hardwareFingerprint: string;
  validFrom: string;
  validUntil: string;
  issuedAt: string;
}

export interface LicenseFileContent {
  payload: LicensePayload;
  signature: string; // Ed25519 Base64
}

@Injectable()
export class LicenseVerifierService implements OnModuleInit {
  private readonly logger = new Logger('LicenseVerifier');

  // Clé publique Ed25519 par défaut pour vérification hors-ligne de l'éditeur
  // Peut être surchargée par la variable DOCTEURFLOTTE_PUBLIC_KEY
  private readonly DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAp59iBmHfFz8+sclePonufTKWgCYpdieyKCSFnajKvrg=
-----END PUBLIC KEY-----`;

  public onModuleInit() {
    this.verifyLicense();
  }

  /**
   * Vérifie la validité de la licence logicielle au démarrage
   */
  public verifyLicense(): { valid: boolean; payload?: LicensePayload; error?: string } {
    const isEnforced = process.env.LICENSE_CHECK_ENFORCED === 'true';
    const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

    if (!isEnforced && isTestOrDev) {
      this.logger.log('ℹ Mode Développement/Test : Contrôle de licence matérielle bypassé.');
      return { valid: true };
    }

    const currentHwid = HardwareFingerprint.generateFingerprint();
    this.logger.log(`🔍 Empreinte matérielle de l'hôte calculée : ${currentHwid}`);

    const licenseData = this.loadLicenseContent();
    if (!licenseData) {
      const msg = 'Fichier de licence (license.lic) manquant ou variable DOCTEURFLOTTE_LICENSE_KEY absente.';
      return this.handleFailure(msg, isEnforced);
    }

    const { payload, signature } = licenseData;

    // 1. Vérification de la signature cryptographique Ed25519
    const publicKeyPem = process.env.DOCTEURFLOTTE_PUBLIC_KEY || this.DEFAULT_PUBLIC_KEY;
    const isSignatureValid = this.verifySignature(payload, signature, publicKeyPem);

    if (!isSignatureValid) {
      const msg = 'Signature cryptographique de licence altérée ou invalide (Ed25519 Fail).';
      return this.handleFailure(msg, isEnforced);
    }

    // 2. Vérification de la date d'expiration
    const now = Date.now();
    const expiryTime = Date.parse(payload.validUntil);
    if (isNaN(expiryTime) || now > expiryTime) {
      const msg = `Licence expirée le ${payload.validUntil}. Veuillez renouveler votre abonnement auprès de l'éditeur.`;
      return this.handleFailure(msg, isEnforced);
    }

    // 3. Vérification de la date de début de validité
    const startTime = Date.parse(payload.validFrom);
    if (!isNaN(startTime) && now < startTime) {
      const msg = `Licence non encore active (valide à partir du ${payload.validFrom}).`;
      return this.handleFailure(msg, isEnforced);
    }

    // 4. Verrouillage matériel strict (Anti-Tampering / Anti-Clone)
    // Tolérance d'empreinte universelle WILDCARD pour cloud multi-zones si explicitement accordée par l'éditeur
    if (payload.hardwareFingerprint !== '*' && payload.hardwareFingerprint !== currentHwid) {
      const msg = `Violation d'empreinte matérielle ! Cette licence est restreinte à la machine [${payload.hardwareFingerprint}], or le serveur actuel est [${currentHwid}]. Copie non autorisée détectée.`;
      return this.handleFailure(msg, isEnforced);
    }

    this.logger.log(
      `✓ [LICENSE PASS] Licence certifiée valide pour "${payload.customerName}" (Plan: ${payload.plan}, Quota: ${payload.maxAssets} actifs, Expiration: ${payload.validUntil}).`,
    );

    return { valid: true, payload };
  }

  /**
   * Vérifie la signature Ed25519 du payload JSON
   */
  public verifySignature(payload: LicensePayload, signatureBase64: string, publicKeyPem: string): boolean {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
      const signatureBuffer = Buffer.from(signatureBase64, 'base64');

      return crypto.verify(null, dataBuffer, publicKeyPem, signatureBuffer);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erreur lors de la vérification de signature : ${errorMsg}`);
      return false;
    }
  }

  /**
   * Charge la licence depuis l'environnement ou le fichier license.lic
   */
  private loadLicenseContent(): LicenseFileContent | null {
    // 1. Variable d'environnement base64 ou JSON direct
    if (process.env.DOCTEURFLOTTE_LICENSE_KEY) {
      try {
        const raw = process.env.DOCTEURFLOTTE_LICENSE_KEY.trim();
        const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
        return JSON.parse(jsonStr) as LicenseFileContent;
      } catch {
        this.logger.warn('Variable DOCTEURFLOTTE_LICENSE_KEY malformée.');
      }
    }

    // 2. Fichier local license.lic
    const candidatePaths = [
      path.join(process.cwd(), 'license.lic'),
      path.join(process.cwd(), 'apps', 'api', 'license.lic'),
      '/etc/docteurflotte/license.lic',
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8').trim();
          return JSON.parse(raw) as LicenseFileContent;
        } catch {
          this.logger.warn(`Échec de lecture du fichier de licence : ${p}`);
        }
      }
    }

    return null;
  }

  /**
   * Gestion de l'échec de licence
   */
  private handleFailure(reason: string, isEnforced: boolean): { valid: boolean; error: string } {
    this.logger.error(`❌ [VERROU DE LICENCE] ${reason}`);

    if (isEnforced) {
      this.logger.error('🚨 Arrêt immédiat de l\'application (Fail-Closed). Contactez le support éditeur.');
      process.exit(1);
    }

    return { valid: false, error: reason };
  }
}
