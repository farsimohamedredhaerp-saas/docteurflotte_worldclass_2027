import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  describe('validateStrength', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const res = service.validateStrength('Short1');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('au moins 8 caractères');
    });

    it('should reject passwords without numbers', () => {
      const res = service.validateStrength('PasswordOnly');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('au moins un chiffre');
    });

    it('should reject passwords without letters', () => {
      const res = service.validateStrength('1234567890');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('au moins une lettre');
    });

    it('should accept robust passwords', () => {
      const res = service.validateStrength('DocteurFlotte2027!');
      expect(res.isValid).toBe(true);
    });
  });

  describe('hashPassword & verifyPassword', () => {
    it('should hash a password and verify it successfully', async () => {
      const plain = 'SecuriteOptimale2027!';
      const hash = await service.hashPassword(plain);

      expect(hash).toBeDefined();
      expect(hash.startsWith('scrypt:')).toBe(true);

      const isValid = await service.verifyPassword(plain, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plain = 'SecuriteOptimale2027!';
      const hash = await service.hashPassword(plain);

      const isValid = await service.verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should safely reject malformed hash strings without throwing', async () => {
      expect(await service.verifyPassword('password', 'not-a-hash')).toBe(false);
      expect(await service.verifyPassword('password', 'scrypt:missing')).toBe(false);
    });
  });
});
