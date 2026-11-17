import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { PartsInventoryService } from './services/parts-inventory.service';
import { PartsWarehouseService } from './services/parts-warehouse.service';
import { WorkOrderPartsService } from './services/work-order-parts.service';
import { PartsPurchaseOrderService } from './services/parts-purchase-order.service';
import { BadRequestException } from '@nestjs/common';

describe('Module F — PartsProcurementService (Stock Pièces & Approvisionnement)', () => {
  let inventoryService: PartsInventoryService;
  let warehouseService: PartsWarehouseService;
  let workOrderPartsService: WorkOrderPartsService;
  let poService: PartsPurchaseOrderService;
  let db: { query: jest.Mock };

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const assetId = '22222222-2222-2222-2222-222222222222';
  const partId = '33333333-3333-3333-3333-333333333333';
  const warehouseId = '44444444-4444-4444-4444-444444444444';
  const workOrderId = '55555555-5555-5555-5555-555555555555';
  const userId = '66666666-6666-6666-6666-666666666666';

  beforeEach(async () => {
    db = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsInventoryService,
        PartsWarehouseService,
        WorkOrderPartsService,
        PartsPurchaseOrderService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    inventoryService = module.get<PartsInventoryService>(PartsInventoryService);
    warehouseService = module.get<PartsWarehouseService>(PartsWarehouseService);
    workOrderPartsService = module.get<WorkOrderPartsService>(WorkOrderPartsService);
    poService = module.get<PartsPurchaseOrderService>(PartsPurchaseOrderService);
  });

  describe('PartsInventoryService', () => {
    it('doit créer un article de stock avec CMUP et seuil d’alerte', async () => {
      // 1. Check duplicate
      db.query.mockResolvedValueOnce({ rows: [] });
      // 2. Insert part
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: partId,
            tenant_id: tenantId,
            part_number: 'FIL-OIL-001',
            designation: 'Filtre à Huile Shacman Weichai WP12',
            category: 'FILTRES',
            oem_brand_compatibility: ['Shacman', 'Weichai'],
            unit_measure: 'PIECE',
            average_weighted_cost_dzd: '3500.00',
            default_selling_price_dzd: '4375.00',
            total_quantity_in_stock: '0',
            reorder_point_quantity: '10',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const part = await inventoryService.createPartItem(tenantId, {
        partNumber: 'fil-oil-001',
        designation: 'Filtre à Huile Shacman Weichai WP12',
        category: 'FILTRES',
        oemBrandCompatibility: ['Shacman', 'Weichai'],
        initialCostDzd: 3500,
        reorderPointQuantity: 10,
      });

      expect(part.partNumber).toBe('FIL-OIL-001');
      expect(part.averageWeightedCostDzd).toBe(3500);
      expect(part.reorderPointQuantity).toBe(10);
    });

    it('doit rejeter la création si la référence existe déjà pour ce tenant', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: partId }] });

      await expect(
        inventoryService.createPartItem(tenantId, {
          partNumber: 'FIL-OIL-001',
          designation: 'Filtre existant',
          category: 'FILTRES',
          initialCostDzd: 3500,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('WorkOrderPartsService', () => {
    it('doit imputer la consommation sur l’actif racine et décrémenter les stocks', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-SHAC-01', tenant_id: tenantId }],
      });
      // 2. Work order check
      db.query.mockResolvedValueOnce({
        rows: [{ id: workOrderId, asset_id: assetId, tenant_id: tenantId }],
      });
      // 3. Stock availability check (15 disponibles)
      db.query.mockResolvedValueOnce({
        rows: [{ quantity_on_hand: '15.00', quantity_reserved: '0.00' }],
      });
      // 4. CMUP check (3 500 DZD)
      db.query.mockResolvedValueOnce({
        rows: [{ average_weighted_cost_dzd: '3500.00' }],
      });
      // 5. Decrement warehouse stock
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // 6. Decrement global inventory
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // 7. Insert consumption record
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cons-01',
            tenant_id: tenantId,
            work_order_id: workOrderId,
            asset_id: assetId,
            part_id: partId,
            warehouse_id: warehouseId,
            quantity_consumed: '2',
            unit_cost_applied_dzd: '3500.00',
            total_cost_dzd: '7000.00',
            consumed_at: new Date().toISOString(),
            consumed_by_user_id: userId,
          },
        ],
      });

      const consumption = await workOrderPartsService.recordPartsConsumption(tenantId, userId, {
        workOrderId,
        assetId,
        partId,
        warehouseId,
        quantityConsumed: 2,
      });

      expect(consumption.assetId).toBe(assetId);
      expect(consumption.workOrderId).toBe(workOrderId);
      expect(consumption.quantityConsumed).toBe(2);
      expect(consumption.totalCostDzd).toBe(7000);
    });

    it('doit bloquer la consommation avec BadRequestException en cas de rupture de stock', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-SHAC-01', tenant_id: tenantId }],
      });
      // 2. Work order check
      db.query.mockResolvedValueOnce({
        rows: [{ id: workOrderId, asset_id: assetId, tenant_id: tenantId }],
      });
      // 3. Stock availability check (seulement 1 disponible)
      db.query.mockResolvedValueOnce({
        rows: [{ quantity_on_hand: '1.00', quantity_reserved: '0.00' }],
      });

      await expect(
        workOrderPartsService.recordPartsConsumption(tenantId, userId, {
          workOrderId,
          assetId,
          partId,
          warehouseId,
          quantityConsumed: 4, // Demande 4 alors qu'il n'y en a que 1
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PartsPurchaseOrderService', () => {
    it('doit créer un bon de commande multi-devises et convertir en DZD', async () => {
      // 1. Count for seq
      db.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // 2. Insert PO
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-1',
            tenant_id: tenantId,
            po_number: 'BC-2026-0001',
            supplier_name: 'Caterpillar Algérie Spa',
            supplier_nif: '000116001234567',
            supplier_currency: 'EUR',
            exchange_rate_to_dzd: '150.0000',
            total_amount_currency: '1000.00',
            total_amount_dzd: '150000.00',
            status: 'ORDERED',
            items: [
              {
                partId,
                partNumber: 'FIL-OIL-001',
                quantityOrdered: 10,
                quantityReceived: 0,
                unitPriceCurrency: 100,
              },
            ],
            ordered_at: new Date().toISOString(),
            expected_delivery_date: '2026-12-01',
            received_at: null,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const po = await poService.createPurchaseOrder(tenantId, {
        supplierName: 'Caterpillar Algérie Spa',
        supplierNif: '000116001234567',
        supplierCurrency: 'EUR',
        exchangeRateToDzd: 150,
        expectedDeliveryDate: '2026-12-01',
        items: [
          {
            partId,
            partNumber: 'FIL-OIL-001',
            quantityOrdered: 10,
            unitPriceCurrency: 100,
          },
        ],
      });

      expect(po.poNumber).toBe('BC-2026-0001');
      expect(po.supplierCurrency).toBe('EUR');
      expect(po.totalAmountCurrency).toBe(1000);
      expect(po.totalAmountDzd).toBe(150000);
    });
  });
});

