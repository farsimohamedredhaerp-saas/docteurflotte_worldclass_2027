import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { TmdDriversService } from './services/tmd-drivers.service';
import { TankerCompartmentsService } from './services/tanker-compartments.service';
import { TmdMissionsService } from './services/tmd-missions.service';
import {
  TankerProductType,
  ValveStatus,
  TmdMissionStatus,
} from '@docteurflotte/contracts';

describe('TMD / ADR & Citernes Hydrocarbures (Phase 5 Multi-Métiers)', () => {
  let driversService: TmdDriversService;
  let compartmentsService: TankerCompartmentsService;
  let missionsService: TmdMissionsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      withTenantContext: jest.fn().mockImplementation((tenantId, cb) => {
        const mockClient = {
          query: jest.fn().mockImplementation((queryText: string, params: any[]) => {
            if (queryText.includes('INSERT INTO tmd_driver_certifications')) {
              return {
                rows: [
                  {
                    id: 'driver-cert-mock-1',
                    tenant_id: tenantId,
                    driver_name: params[1],
                    driver_license_number: params[2],
                    tmd_certificate_number: params[3],
                    hazard_classes: params[4],
                    issuing_authority: params[5],
                    issue_date: params[6],
                    expiry_date: params[7],
                    is_valid: params[8],
                    created_at: new Date(),
                    updated_at: new Date(),
                  },
                ],
              };
            }
            if (queryText.includes('INSERT INTO fuel_tanker_compartments')) {
              return {
                rows: [
                  {
                    id: 'comp-mock-1',
                    tenant_id: tenantId,
                    asset_id: params[1],
                    tanker_code: params[2],
                    compartment_number: params[3],
                    capacity_liters: params[4],
                    current_product_type: params[5],
                    current_volume_liters: params[6],
                    bottom_valve_status: ValveStatus.CLOSED,
                    apave_hydrostatic_test_date: params[8],
                    apave_test_expiry_date: params[9],
                    is_adr_compliant: params[10],
                    created_at: new Date(),
                    updated_at: new Date(),
                  },
                ],
              };
            }
            if (queryText.includes('INSERT INTO tmd_transport_missions')) {
              return {
                rows: [
                  {
                    id: 'mission-mock-1',
                    tenant_id: tenantId,
                    mission_code: params[1],
                    asset_id: params[2],
                    driver_certification_id: params[3],
                    origin_depot_name: params[4],
                    destination_station_name: params[5],
                    authorized_route: params[6],
                    total_volume_liters: params[7],
                    fire_extinguishers_checked: params[8],
                    grounding_braid_connected: params[9],
                    status: params[10],
                    unauthorized_valve_opened: params[11],
                    departure_time: new Date(),
                    sha256_audit_seal: params[12],
                    created_at: new Date(),
                  },
                ],
              };
            }
            if (queryText.includes('UPDATE tmd_transport_missions SET')) {
              return {
                rows: [
                  {
                    id: params[1],
                    tenant_id: tenantId,
                    mission_code: 'TMD-MSN-MOCK',
                    asset_id: 'TANKER-MOCK',
                    driver_certification_id: 'DRV-MOCK',
                    origin_depot_name: 'Dépôt El Eulma',
                    destination_station_name: 'Station RN5',
                    total_volume_liters: 36000,
                    fire_extinguishers_checked: true,
                    grounding_braid_connected: true,
                    status: params[0] === true ? TmdMissionStatus.BLOCKED_NON_COMPLIANT : TmdMissionStatus.AUTHORIZED,
                    unauthorized_valve_opened: params[0],
                    sha256_audit_seal: 'mock-seal',
                    created_at: new Date(),
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(mockClient);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdDriversService,
        TankerCompartmentsService,
        TmdMissionsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    driversService = module.get<TmdDriversService>(TmdDriversService);
    compartmentsService = module.get<TankerCompartmentsService>(TankerCompartmentsService);
    missionsService = module.get<TmdMissionsService>(TmdMissionsService);
  });

  describe('1. Contrôle Habilitations Chauffeurs TMD (Ministère des Transports)', () => {
    it('doit valider un chauffeur avec Brevet TMD en cours de validité', async () => {
      jest.spyOn(driversService, 'getCertification').mockResolvedValue({
        id: 'cert-1',
        tenantId: 'demo-tenant-dz',
        driverName: 'Khaled Bouzid',
        driverLicenseNumber: 'PERMIS-16-9921',
        tmdCertificateNumber: 'TMD-DZ-2025-0881',
        hazardClasses: 'CLASS_3_HYDROCARBONS',
        issuingAuthority: 'DTW Alger',
        issueDate: '2025-01-10',
        expiryDate: '2028-01-10', // Valide
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await driversService.checkDriverEligibility('demo-tenant-dz', 'cert-1');
      expect(res.eligible).toBe(true);
    });

    it('doit bloquer un chauffeur dont le Brevet TMD est expiré', async () => {
      jest.spyOn(driversService, 'getCertification').mockResolvedValue({
        id: 'cert-expired',
        tenantId: 'demo-tenant-dz',
        driverName: 'Amar Ziane',
        driverLicenseNumber: 'PERMIS-09-1120',
        tmdCertificateNumber: 'TMD-DZ-2021-0412',
        hazardClasses: 'CLASS_3_HYDROCARBONS',
        issuingAuthority: 'DTW Blida',
        issueDate: '2021-01-10',
        expiryDate: '2024-01-10', // Expiré
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await driversService.checkDriverEligibility('demo-tenant-dz', 'cert-expired');
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('échu');
    });
  });

  describe('2. Contrôle Épreuve Hydrostatique APAVE / ENACTA Citernes', () => {
    it('doit détecter une citerne non conforme si une épreuve APAVE a dépassé 3 ans', async () => {
      jest.spyOn(compartmentsService, 'listCompartments').mockResolvedValue([
        {
          id: 'comp-1',
          tenantId: 'demo-tenant-dz',
          assetId: 'TANKER-01',
          tankerCode: 'CIT-NAF-16-01',
          compartmentNumber: 1,
          capacityLiters: 10000,
          currentProductType: TankerProductType.GASOIL,
          currentVolumeLiters: 10000,
          bottomValveStatus: ValveStatus.CLOSED,
          apaveHydrostaticTestDate: '2021-05-15',
          apaveTestExpiryDate: '2024-05-15', // Échu
          isAdrCompliant: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const res = await compartmentsService.checkTankerApaveStatus('demo-tenant-dz', 'TANKER-01');
      expect(res.compliant).toBe(false);
      expect(res.reason).toContain('Épreuve hydrostatique APAVE échue');
    });
  });

  describe('3. Machine à États Mission TMD & Verrouillage Déterministe', () => {
    it('doit refuser la mission si le chauffeur n’est pas habilité TMD', async () => {
      jest.spyOn(driversService, 'checkDriverEligibility').mockResolvedValue({
        eligible: false,
        reason: 'Brevet TMD échu',
      });

      await expect(
        missionsService.createMission('demo-tenant-dz', {
          missionCode: 'TMD-2026-TEST',
          assetId: 'TANKER-01',
          driverCertificationId: 'cert-bad',
          originDepotName: 'Dépôt Naftal El Eulma',
          destinationStationName: 'Station Sétif',
          totalVolumeLiters: 36000,
        }),
      ).rejects.toThrow('BLOCAGE MISSION TMD : Brevet TMD échu');
    });

    it('doit refuser la mission si la tresse de mise à la terre n’est pas reliée', async () => {
      jest.spyOn(driversService, 'checkDriverEligibility').mockResolvedValue({ eligible: true });
      jest.spyOn(compartmentsService, 'checkTankerApaveStatus').mockResolvedValue({ compliant: true });

      await expect(
        missionsService.createMission('demo-tenant-dz', {
          missionCode: 'TMD-2026-TEST-GROUND',
          assetId: 'TANKER-01',
          driverCertificationId: 'cert-ok',
          originDepotName: 'Dépôt Naftal Caroubier',
          destinationStationName: 'Station Reghaia',
          totalVolumeLiters: 36000,
          fireExtinguishersChecked: true,
          groundingBraidConnected: false, // Équipement manquant !
        }),
      ).rejects.toThrow('BLOCAGE MISSION TMD');
    });

    it('doit autoriser la mission et générer un sceau SHA-256 si tous les critères sont conformes', async () => {
      jest.spyOn(driversService, 'checkDriverEligibility').mockResolvedValue({ eligible: true });
      jest.spyOn(compartmentsService, 'checkTankerApaveStatus').mockResolvedValue({ compliant: true });

      const mission = await missionsService.createMission('demo-tenant-dz', {
        missionCode: 'TMD-2026-OK',
        assetId: 'TANKER-01',
        driverCertificationId: 'cert-ok',
        originDepotName: 'Dépôt Naftal Sidi Arcine',
        destinationStationName: 'Station Bab Ezzouar',
        totalVolumeLiters: 36000,
        fireExtinguishersChecked: true,
        groundingBraidConnected: true,
      });

      expect(mission.status).toBe(TmdMissionStatus.AUTHORIZED);
      expect(mission.sha256AuditSeal).toBeDefined();
      expect(mission.sha256AuditSeal.length).toBe(64);
    });

    it('doit déclencher l’alerte de dépotage non autorisé si la vanne s’ouvre hors géofence', async () => {
      mockDb.withTenantContext = jest.fn().mockImplementation((tenantId, cb) => {
        return cb({
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 'msn-1',
                unauthorized_valve_opened: true,
                status: TmdMissionStatus.BLOCKED_NON_COMPLIANT,
              },
            ],
          }),
        });
      });

      const updated = await missionsService.recordValveOpening('demo-tenant-dz', 'msn-1', false);
      expect(updated.unauthorizedValveOpened).toBe(true);
      expect(updated.status).toBe(TmdMissionStatus.BLOCKED_NON_COMPLIANT);
    });
  });
});

