import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConsignmentNoteService } from './services/consignment-note.service';
import { ProofOfDeliveryService } from './services/proof-of-delivery.service';
import { DeliveryDisputeService } from './services/delivery-dispute.service';
import { OtifMetricsService } from './services/otif-metrics.service';
import { ShipmentStatus } from '@docteurflotte/contracts';

describe('Module C — Logistics & POD (LVE Décret 03-223 & Scellements SHA-256)', () => {
  let lveService: ConsignmentNoteService;
  let podService: ProofOfDeliveryService;
  let disputeService: DeliveryDisputeService;
  let otifService: OtifMetricsService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const otherTenantId = '99999999-9999-9999-9999-999999999999';
  const assetId = '11111111-1111-1111-1111-111111111111';
  const lveId = 'llllllll-llll-llll-llll-llllllllllll';

  const mockDb = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentNoteService,
        ProofOfDeliveryService,
        DeliveryDisputeService,
        OtifMetricsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    lveService = module.get<ConsignmentNoteService>(ConsignmentNoteService);
    podService = module.get<ProofOfDeliveryService>(ProofOfDeliveryService);
    disputeService = module.get<DeliveryDisputeService>(DeliveryDisputeService);
    otifService = module.get<OtifMetricsService>(OtifMetricsService);

    jest.clearAllMocks();
  });

  describe('1. Intégrité Racine Asset & Émission LVE (Décret 03-223)', () => {
    it('refuse la création sans assetId', async () => {
      await expect(
        lveService.createConsignmentNote(tenantId, {
          assetId: '',
          shipperName: 'CEVITAL SPA',
          shipperAddress: 'Port de Bejaia',
          shipperWilayaCode: 6,
          consigneeName: 'Grossiste Agro Alger',
          consigneeAddress: 'Zone Industrielle Oued Smar',
          consigneeWilayaCode: 16,
          consigneePhoneDz: '0550112233',
          cargoNature: 'Sucre raffiné 50kg',
          totalWeightKg: 24000,
          packagesCount: 480,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse si le code wilaya est invalide (> 58)', async () => {
      await expect(
        lveService.createConsignmentNote(tenantId, {
          assetId,
          shipperName: 'CEVITAL SPA',
          shipperAddress: 'Port de Bejaia',
          shipperWilayaCode: 65, // Wilaya inexistante
          consigneeName: 'Grossiste',
          consigneeAddress: 'Alger',
          consigneeWilayaCode: 16,
          consigneePhoneDz: '0550112233',
          cargoNature: 'Marchandises',
          totalWeightKg: 1000,
          packagesCount: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse si l’actif appartient à un autre tenant', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: otherTenantId, code: 'CAM-01', status: 'IN_SERVICE' }],
      });
      await expect(
        lveService.createConsignmentNote(tenantId, {
          assetId,
          shipperName: 'CEVITAL SPA',
          shipperAddress: 'Port de Bejaia',
          shipperWilayaCode: 6,
          consigneeName: 'Grossiste',
          consigneeAddress: 'Alger',
          consigneeWilayaCode: 16,
          consigneePhoneDz: '0550112233',
          cargoNature: 'Marchandises',
          totalWeightKg: 1000,
          packagesCount: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('émet une LVE conforme avec jeton HMAC-256 pour QR code', async () => {
      // 1. Asset check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'CAM-02', status: 'IN_SERVICE' }],
      });
      // 2. Count seq
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '14' }] });
      // 3. Insert LVE
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'lve-01',
            tenant_id: tenantId,
            lve_number: 'LVE-2026-00015',
            asset_id: assetId,
            shipper_name: 'CEVITAL SPA',
            shipper_address: 'Port de Bejaia',
            shipper_wilaya_code: 6,
            consignee_name: 'Grossiste Oued Smar',
            consignee_address: 'Alger',
            consignee_wilaya_code: 16,
            consignee_phone_dz: '0550112233',
            cargo_nature: 'Sucre 50kg',
            total_weight_kg: '24000',
            packages_count: 480,
            status: ShipmentStatus.PREPARED,
            qr_code_validation_hmac: 'abcdef1234567890abcdef1234567890',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const lve = await lveService.createConsignmentNote(tenantId, {
        assetId,
        shipperName: 'CEVITAL SPA',
        shipperAddress: 'Port de Bejaia',
        shipperWilayaCode: 6,
        consigneeName: 'Grossiste Oued Smar',
        consigneeAddress: 'Alger',
        consigneeWilayaCode: 16,
        consigneePhoneDz: '0550112233',
        cargoNature: 'Sucre 50kg',
        totalWeightKg: 24000,
        packagesCount: 480,
      });

      expect(lve.lveNumber).toBe('LVE-2026-00015');
      expect(lve.qrCodeValidationHmac).toBeDefined();
      expect(lve.shipperWilayaCode).toBe(6);
      expect(lve.consigneeWilayaCode).toBe(16);
    });
  });

  describe('2. Preuves de Livraison (POD) & Scellement SHA-256', () => {
    it('enregistre une POD complète et passe la LVE à DELIVERED', async () => {
      // 1. LVE check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: lveId, asset_id: assetId, packages_count: 50 }],
      });
      // 2. Existing POD check : none
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert POD
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'pod-01',
            tenant_id: tenantId,
            lve_id: lveId,
            asset_id: assetId,
            delivered_at: new Date().toISOString(),
            recipient_name: 'Hassan Amine',
            recipient_identity_doc_ref: 'CNI-16-0987654',
            latitude: '36.7525',
            longitude: '3.0420',
            packages_delivered: 50,
            packages_damaged: 0,
            packages_refused: 0,
            photos_urls: [],
            signature_svg: '<svg>signature</svg>',
            notes: 'Réception conforme 50 colis',
            is_first_pass_delivery: true,
            sha256_proof_seal: '5d41402abc4b2a76b9719d911017c592',
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 4. Update LVE status to DELIVERED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const pod = await podService.recordProofOfDelivery(tenantId, {
        lveId,
        recipientName: 'Hassan Amine',
        recipientIdentityDocRef: 'CNI-16-0987654',
        packagesDelivered: 50,
        packagesDamaged: 0,
        packagesRefused: 0,
        signatureSvg: '<svg>signature</svg>',
      });

      expect(pod.packagesDelivered).toBe(50);
      expect(pod.packagesDamaged).toBe(0);
      expect(pod.isFirstPassDelivery).toBe(true);
      expect(pod.sha256ProofSeal).toBeDefined();
    });

    it('bascule la LVE à PARTIALLY_DELIVERED si des colis sont endommagés', async () => {
      // 1. LVE check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: lveId, asset_id: assetId, packages_count: 50 }],
      });
      // 2. Existing POD check : none
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert POD
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'pod-02',
            tenant_id: tenantId,
            lve_id: lveId,
            asset_id: assetId,
            delivered_at: new Date().toISOString(),
            recipient_name: 'Hassan Amine',
            packages_delivered: 45,
            packages_damaged: 5,
            packages_refused: 0,
            photos_urls: [],
            signature_svg: '<svg>sig</svg>',
            is_first_pass_delivery: false,
            sha256_proof_seal: '12345678',
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 4. Update LVE status to PARTIALLY_DELIVERED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const pod = await podService.recordProofOfDelivery(tenantId, {
        lveId,
        recipientName: 'Hassan Amine',
        packagesDelivered: 45,
        packagesDamaged: 5,
        packagesRefused: 0,
        signatureSvg: '<svg>sig</svg>',
      });

      expect(pod.packagesDamaged).toBe(5);
    });
  });

  describe('3. Litiges de Livraison & Règle du Blocage Facturation', () => {
    it('déclare un litige et bloque automatiquement la facturation client', async () => {
      // 1. LVE check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: lveId, asset_id: assetId }],
      });
      // 2. Count disputes seq
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      // 3. Insert dispute
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'disp-lve-01',
            tenant_id: tenantId,
            lve_id: lveId,
            asset_id: assetId,
            dispute_number: 'LIT-LVE-2026-0002',
            dispute_type: 'DAMAGE',
            description: '5 palettes mouillées par infiltration bâche',
            estimated_claim_amount_dzd: '85000',
            is_billing_blocked: true,
            status: 'OPEN',
            photos_urls: [],
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 4. Update LVE status to DISPUTED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const dispute = await disputeService.createDispute(tenantId, {
        lveId,
        disputeType: 'DAMAGE',
        description: '5 palettes mouillées par infiltration bâche',
        estimatedClaimAmountDzd: 85000,
      });

      expect(dispute.disputeNumber).toBe('LIT-LVE-2026-0002');
      expect(dispute.isBillingBlocked).toBe(true);
    });

    it('débloque la facturation lors du règlement du litige (SETTLED)', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'disp-lve-01',
            tenant_id: tenantId,
            lve_id: lveId,
            asset_id: assetId,
            dispute_number: 'LIT-LVE-2026-0002',
            dispute_type: 'DAMAGE',
            description: '5 palettes mouillées',
            estimated_claim_amount_dzd: '85000',
            is_billing_blocked: false,
            status: 'SETTLED',
            photos_urls: [],
            created_at: new Date().toISOString(),
          },
        ],
      });

      const settled = await disputeService.settleDispute(tenantId, 'disp-lve-01');
      expect(settled.status).toBe('SETTLED');
      expect(settled.isBillingBlocked).toBe(false);
    });
  });

  describe('4. Métriques d’Excellence Logistique OTIF', () => {
    it('calcule le score OTIF et le taux de livraison sans incident', async () => {
      // 1. Total LVEs : 20
      mockDb.query.mockResolvedValueOnce({
        rows: Array(20).fill({ id: 'lve-mock', status: 'DELIVERED' }),
      });
      // 2. PODs : 18 parfaites (0 avarie, 0 refus, first pass), 2 avec avaries
      const mockPods = [
        ...Array(18).fill({ packages_delivered: 10, packages_damaged: 0, packages_refused: 0, is_first_pass_delivery: true }),
        ...Array(2).fill({ packages_delivered: 8, packages_damaged: 2, packages_refused: 0, is_first_pass_delivery: false }),
      ];
      mockDb.query.mockResolvedValueOnce({ rows: mockPods });
      // 3. Litiges : 2
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: 2 }] });

      const metrics = await otifService.getOtifMetrics(tenantId);

      expect(metrics.totalShipments).toBe(20);
      expect(metrics.deliveredInFull).toBe(18);
      expect(metrics.otifRatePct).toBe(90.0);
      expect(metrics.firstPassDeliveryRatePct).toBe(90.0);
      expect(metrics.disputesCount).toBe(2);
    });
  });
});

