import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ActivityPack, UserRole } from '@docteurflotte/contracts';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabaseService: any;
  let passwordService: PasswordService;
  let tokenService: TokenService;

  beforeEach(async () => {
    mockDatabaseService = {
      getPool: jest.fn(),
      query: jest.fn(),
      withTenantContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PasswordService,
        {
          provide: TokenService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            verify: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('registerTenant', () => {
    it('should reject weak admin password', async () => {
      await expect(
        authService.registerTenant({
          companyName: 'Flotte Express',
          adminEmail: 'admin@flotte.dz',
          adminPassword: '123', // Trop court
          adminFirstName: 'Amine',
          adminLastName: 'Benali',
          activityPack: ActivityPack.TRANSPORT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register tenant and return AuthResponse on valid input', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      // Mock pool
      mockDatabaseService.getPool.mockReturnValue({
        connect: jest.fn().mockResolvedValue(mockClient),
      });

      // Mock slug lookup
      mockDatabaseService.query.mockResolvedValue({ rowCount: 0, rows: [] });

      // Mock client queries for transaction
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          // INSERT tenants
          rows: [
            {
              id: 'tenant-uuid-1',
              name: 'Flotte Express',
              slug: 'flotte-express',
              activity_pack: ActivityPack.TRANSPORT,
              country_code: 'DZ',
              currency: 'DZD',
              data_origin: 'USER_ENTRY',
              status: 'PENDING_SETUP',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({
          // INSERT users
          rows: [
            {
              id: 'user-uuid-1',
              tenant_id: 'tenant-uuid-1',
              email: 'admin@flotte.dz',
              first_name: 'Amine',
              last_name: 'Benali',
              role: UserRole.TENANT_ADMIN,
              is_active: true,
              created_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({}) // INSERT tenant_settings
        .mockResolvedValueOnce({}); // COMMIT

      const response = await authService.registerTenant({
        companyName: 'Flotte Express',
        adminEmail: 'admin@flotte.dz',
        adminPassword: 'SuperPassword2027!',
        adminFirstName: 'Amine',
        adminLastName: 'Benali',
        activityPack: ActivityPack.TRANSPORT,
      });

      expect(response).toBeDefined();
      expect(response.accessToken).toBe('mock.jwt.token');
      expect(response.user.email).toBe('admin@flotte.dz');
      expect(response.tenant.name).toBe('Flotte Express');
      expect(response.tenant.isSetupCompleted).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockDatabaseService.query.mockResolvedValue({ rowCount: 0, rows: [] });

      await expect(
        authService.login({
          email: 'unknown@flotte.dz',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      const realHash = await passwordService.hashPassword('CorrectPassword123!');
      mockDatabaseService.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 'user-1',
            tenant_id: 'tenant-1',
            email: 'admin@flotte.dz',
            password_hash: realHash,
            first_name: 'Amine',
            last_name: 'Benali',
            role: UserRole.TENANT_ADMIN,
            is_active: true,
            created_at: new Date(),
            tenant_name: 'Flotte Express',
            tenant_slug: 'flotte-express',
            tenant_status: 'ACTIVE',
            activity_pack: ActivityPack.TRANSPORT,
            is_setup_completed: true,
          },
        ],
      });

      await expect(
        authService.login({
          email: 'admin@flotte.dz',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed and return AuthResponse on valid credentials', async () => {
      const plain = 'CorrectPassword123!';
      const realHash = await passwordService.hashPassword(plain);

      mockDatabaseService.query.mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 'user-1',
            tenant_id: 'tenant-1',
            email: 'admin@flotte.dz',
            password_hash: realHash,
            first_name: 'Amine',
            last_name: 'Benali',
            role: UserRole.TENANT_ADMIN,
            is_active: true,
            created_at: new Date(),
            tenant_name: 'Flotte Express',
            tenant_slug: 'flotte-express',
            tenant_status: 'ACTIVE',
            activity_pack: ActivityPack.TRANSPORT,
            is_setup_completed: true,
          },
        ],
      });

      const res = await authService.login({
        email: 'admin@flotte.dz',
        password: plain,
      });

      expect(res).toBeDefined();
      expect(res.accessToken).toBe('mock.jwt.token');
      expect(res.user.email).toBe('admin@flotte.dz');
      expect(res.tenant.isSetupCompleted).toBe(true);
    });
  });
});
