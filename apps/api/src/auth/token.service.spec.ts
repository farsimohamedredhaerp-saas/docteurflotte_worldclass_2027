import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@docteurflotte/contracts';
import { UnauthorizedException } from '@nestjs/common';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test_secret_for_jwt_verification_32chars!'),
    } as unknown as ConfigService;
    service = new TokenService(configService);
  });

  it('should sign and verify a valid JWT payload', () => {
    const payload = {
      sub: 'usr-123',
      tenantId: 'tnt-456',
      email: 'admin@flotte.dz',
      role: UserRole.TENANT_ADMIN,
    };

    const token = service.sign(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = service.verify(token);
    expect(verified.sub).toBe('usr-123');
    expect(verified.tenantId).toBe('tnt-456');
    expect(verified.email).toBe('admin@flotte.dz');
    expect(verified.role).toBe(UserRole.TENANT_ADMIN);
  });

  it('should reject tampered token signatures', () => {
    const token = service.sign({
      sub: 'usr-123',
      tenantId: 'tnt-456',
      email: 'admin@flotte.dz',
      role: UserRole.TENANT_ADMIN,
    });

    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.tamperedSignatureHere`;

    expect(() => service.verify(tampered)).toThrow(UnauthorizedException);
  });

  it('should reject expired tokens', () => {
    const token = service.sign(
      {
        sub: 'usr-123',
        tenantId: 'tnt-456',
        email: 'admin@flotte.dz',
        role: UserRole.TENANT_ADMIN,
      },
      -10, // Expiré il y a 10 secondes
    );

    expect(() => service.verify(token)).toThrow(UnauthorizedException);
  });
});
