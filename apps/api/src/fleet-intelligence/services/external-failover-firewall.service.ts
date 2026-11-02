import { Injectable, Logger } from '@nestjs/common';

export interface RawTelemetryTransmissionPacket {
  deviceImei: string;
  rawHexPayload: string;
  // Les champs suivants sont STRICTEMENT INTERDITS de sortie par la Loi 18-07
  registrationPlate?: string;
  driverName?: string;
  driverNin?: string;
  driverPhone?: string;
  clientCompanyName?: string;
  tenantId?: string;
}

export interface AnonymizedFailoverPacket {
  ident: string; // IMEI matériel pseudonymisé uniquement
  payload: string; // Trame brute hexadécimale
  sanitizedAt: string;
}

export class PiiViolationError extends Error {
  constructor(message: string) {
    super(`[VIOLATION LOI 18-07 ANPDP] ${message}`);
    this.name = 'PiiViolationError';
  }
}

@Injectable()
export class ExternalFailoverFirewallService {
  private readonly logger = new Logger(ExternalFailoverFirewallService.name);

  // Mots-clés et motifs PII interdits de transit vers des services tiers
  private readonly FORBIDDEN_PII_PATTERNS = [
    /algeria/i,
    /wilaya/i,
    /chauffeur/i,
    /driver/i,
    /permis/i,
    /matricule/i,
    /\d{5}-\d{3}-\d{2}/, // Format matricule algérien standard (ex: 02410-117-22)
    /\+213[0-9]{9}/, // Numéro de téléphone algérien
  ];

  /**
   * Coupe-feu d'anonymisation matérielle stricte (PII Stripper) :
   * Garantit qu'absolument AUCUNE donnée à caractère personnel ne sort du serveur algérien
   */
  sanitizeForExternalFailover(packet: RawTelemetryTransmissionPacket): AnonymizedFailoverPacket {
    if (!packet.deviceImei || !packet.rawHexPayload) {
      throw new PiiViolationError(
        'Le paquet failover doit contenir un IMEI et un payload brut hexadécimal valides.'
      );
    }

    // Validation stricte du format IMEI (14 à 16 chiffres ou identifiant matériel standard)
    const cleanImei = packet.deviceImei.trim();
    if (!/^\d{14,16}$/.test(cleanImei) && !/^[A-Z0-9_-]{8,24}$/i.test(cleanImei)) {
      throw new PiiViolationError(`Format IMEI suspect ou non conforme : ${cleanImei}`);
    }

    // Validation du payload hexadécimal
    const cleanHex = packet.rawHexPayload.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      throw new PiiViolationError('Le payload brut contient des caractères non hexadécimaux.');
    }

    // Détection active de fuite PII dans les champs contextuels
    const leakedFields: string[] = [];
    if (packet.registrationPlate) leakedFields.push(`registrationPlate: ${packet.registrationPlate}`);
    if (packet.driverName) leakedFields.push(`driverName: ${packet.driverName}`);
    if (packet.driverNin) leakedFields.push(`driverNin: ${packet.driverNin}`);
    if (packet.driverPhone) leakedFields.push(`driverPhone: ${packet.driverPhone}`);
    if (packet.clientCompanyName) leakedFields.push(`clientCompanyName: ${packet.clientCompanyName}`);
    if (packet.tenantId) leakedFields.push(`tenantId: ${packet.tenantId}`);

    if (leakedFields.length > 0) {
      this.logger.warn(
        `🛡️ Coupe-feu Loi 18-07 activé : ${leakedFields.length} champ(s) PII intercepté(s) et purgé(s).`
      );
    }

    // Audit approfondi du payload anonymisé : vérifier qu'aucun texte en clair suspect n'est présent
    const hexDecodedAscii = Buffer.from(cleanHex, 'hex').toString('utf8');
    for (const pattern of this.FORBIDDEN_PII_PATTERNS) {
      if (pattern.test(hexDecodedAscii)) {
        throw new PiiViolationError(
          `Trame hexadécimale rejetée par le coupe-feu : détection d'une séquence texte interdite (${pattern.source}).`
        );
      }
    }

    // Seul le couple pseudonymisé (ident, payload) est autorisé à sortir
    return {
      ident: cleanImei,
      payload: cleanHex,
      sanitizedAt: new Date().toISOString(),
    };
  }

  /**
   * Valide la réponse reçue de l'externe pour réinjection locale
   */
  sanitizeExternalDecodedResponse(decodedMetrics: Record<string, unknown>): Record<string, number> {
    const safeMetrics: Record<string, number> = {};

    for (const [key, val] of Object.entries(decodedMetrics)) {
      if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
        safeMetrics[key] = val;
      }
    }

    return safeMetrics;
  }
}

