import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

@Injectable()
export class PasswordService {
  private readonly keyLength = 64;

  /**
   * Hache un mot de passe avec un sel cryptographique aléatoire via scrypt asynchrone (non-bloquant pour l'Event Loop).
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, this.keyLength)) as Buffer;
    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Vérifie un mot de passe de manière asynchrone et en temps constant pour prévenir les attaques temporelles et DoS.
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash || typeof storedHash !== 'string') {
      return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }

    const [, salt, keyHex] = parts;
    if (!salt || !keyHex || !/^[0-9a-fA-F]+$/.test(keyHex)) {
      return false;
    }

    const keyBuffer = Buffer.from(keyHex, 'hex');
    if (keyBuffer.length !== this.keyLength) {
      return false;
    }

    const derivedKey = (await scryptAsync(password, salt, this.keyLength)) as Buffer;
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  /**
   * Valide la robustesse d'un mot de passe (min 8 caractères, 1 chiffre, 1 lettre).
   */
  validateStrength(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'Le mot de passe doit comporter au moins 8 caractères.' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre.' };
    }
    return { isValid: true };
  }
}
