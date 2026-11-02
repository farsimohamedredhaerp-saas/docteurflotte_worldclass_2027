import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DvirService } from '../fleet-intelligence/services/dvir.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import {
  AssetStatus,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

export interface WorkOrderDatabaseRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  title: string;
  description?: string | null;
  priority: WorkOrder['priority'];
  status: WorkOrderStatus;
  trigger_meter_value?: string | number | null;
  estimated_labor_hours?: string | number | null;
  actual_labor_hours?: string | number | null;
  hourly_rate_applied?: string | number | null;
  labor_cost?: string | number | null;
  parts_cost?: string | number | null;
  total_cost?: string | number | null;
  downtime_hours?: string | number | null;
  assigned_to?: string | null;
  completed_at?: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  asset_name?: string;
  asset_code?: string;
}

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly dvirService?: DvirService,
  ) {}

  async createWorkOrder(tenantId: string, dto: CreateWorkOrderDto): Promise<WorkOrder> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const assetRes = await client.query(
        'SELECT * FROM assets WHERE id = $1 AND tenant_id = $2',
        [dto.assetId, tenantId],
      );
      if (assetRes.rowCount === 0) {
        throw new NotFoundException('Actif introuvable.');
      }
      const asset = assetRes.rows[0];

      const woRes = await client.query(
        `INSERT INTO work_orders (
          tenant_id, asset_id, title, description, priority, status,
          estimated_labor_hours, trigger_meter_value, assigned_to
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          tenantId,
          dto.assetId,
          dto.title,
          dto.description || null,
          dto.priority || WorkOrderPriority.MEDIUM,
          WorkOrderStatus.SCHEDULED,
          dto.estimatedLaborHours || 0,
          asset.current_meter_value,
          dto.assignedTo || null,
        ],
      );

      return this.mapWorkOrder(woRes.rows[0], asset.name, asset.code);
    });
  }

  async listWorkOrders(tenantId: string, status?: WorkOrderStatus): Promise<WorkOrder[]> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT wo.*, a.name as asset_name, a.code as asset_code
        FROM work_orders wo
        JOIN assets a ON a.id = wo.asset_id
        WHERE wo.tenant_id = $1
      `;
      const params: (string | WorkOrderStatus)[] = [tenantId];

      if (status) {
        query += ' AND wo.status = $2';
        params.push(status);
      }

      query += ' ORDER BY wo.created_at DESC';
      const res = await client.query<WorkOrderDatabaseRow>(query, params);
      return res.rows.map((row) =>
        this.mapWorkOrder(row, row.asset_name, row.asset_code),
      );
    });
  }

  async updateWorkOrder(
    tenantId: string,
    id: string,
    dto: Partial<CreateWorkOrderDto>,
  ): Promise<WorkOrder> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `UPDATE work_orders
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             priority = COALESCE($3, priority),
             estimated_labor_hours = COALESCE($4, estimated_labor_hours),
             assigned_to = COALESCE($5, assigned_to),
             updated_at = NOW()
         WHERE id = $6 AND tenant_id = $7
         RETURNING *`,
        [
          dto.title,
          dto.description,
          dto.priority,
          dto.estimatedLaborHours,
          dto.assignedTo,
          id,
          tenantId,
        ],
      );
      if (res.rowCount === 0) {
        throw new NotFoundException('Ordre de travail introuvable.');
      }
      return this.mapWorkOrder(res.rows[0]);
    });
  }

  async deleteWorkOrder(tenantId: string, id: string): Promise<{ success: boolean }> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        'DELETE FROM work_orders WHERE id = $1 AND tenant_id = $2',
        [id, tenantId],
      );
      if (res.rowCount === 0) {
        throw new NotFoundException('Ordre de travail introuvable.');
      }
      return { success: true };
    });
  }

  async completeWorkOrder(
    tenantId: string,
    id: string,
    dto: CompleteWorkOrderDto,
  ): Promise<WorkOrder> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const woRes = await client.query(
        `SELECT wo.*, a.name as asset_name, a.code as asset_code, a.maintenance_interval_value, a.current_meter_value
         FROM work_orders wo
         JOIN assets a ON a.id = wo.asset_id
         WHERE wo.id = $1 AND wo.tenant_id = $2`,
        [id, tenantId],
      );
      if (woRes.rowCount === 0) {
        throw new NotFoundException('Ordre de travail introuvable.');
      }
      const wo = woRes.rows[0];

      if (wo.status === WorkOrderStatus.COMPLETED) {
        throw new BadRequestException('Cet ordre de travail est déjà clôturé.');
      }

      const settingsRes = await client.query(
        'SELECT economic_rates FROM tenant_settings WHERE tenant_id = $1',
        [tenantId],
      );
      const economicRates = settingsRes.rows[0]?.economic_rates || {};
      const hourlyRate = Number(economicRates.hourlyLaborRate ?? 1500);

      const actualHours = Number(dto.actualLaborHours);
      const partsCost = Number(dto.partsCost || 0);
      const laborCost = actualHours * hourlyRate;
      const totalCost = laborCost + partsCost;
      const downtimeHours = Number(dto.downtimeHours || 0);

      const updateWoRes = await client.query(
        `UPDATE work_orders
         SET status = $1,
             actual_labor_hours = $2,
             hourly_rate_applied = $3,
             labor_cost = $4,
             parts_cost = $5,
             total_cost = $6,
             downtime_hours = $7,
             description = COALESCE(description || E'\nNotes de clôture: ' || $8, description),
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          WorkOrderStatus.COMPLETED,
          actualHours,
          hourlyRate,
          laborCost,
          partsCost,
          totalCost,
          downtimeHours,
          dto.completionNotes || null,
          id,
        ],
      );

      const interval = wo.maintenance_interval_value ? Number(wo.maintenance_interval_value) : null;
      const currentVal = Number(wo.current_meter_value);
      const nextMaintenance = interval ? currentVal + interval : null;

      await client.query(
        `UPDATE assets
         SET status = $1,
             next_maintenance_meter_value = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [AssetStatus.OPERATIONAL, nextMaintenance, wo.asset_id],
      );

      let resolvedAlgorithmKey = dto.resetAlgorithmKey;
      if (!resolvedAlgorithmKey && wo.title) {
        const lowerTitle = wo.title.toLowerCase();
        if (lowerTitle.includes('vidange') || lowerTitle.includes('huile')) {
          resolvedAlgorithmKey = 'OIL_ARRHENIUS';
        } else if (
          lowerTitle.includes('radiateur') ||
          lowerTitle.includes('refroidissement') ||
          lowerTitle.includes('culasse')
        ) {
          resolvedAlgorithmKey = 'COOLING_THERMAL';
        } else if (
          lowerTitle.includes('frein') ||
          lowerTitle.includes('plaquette') ||
          lowerTitle.includes('disque')
        ) {
          resolvedAlgorithmKey = 'BRAKE_ARCHARD';
        } else if (lowerTitle.includes('batterie') || lowerTitle.includes('alternateur')) {
          resolvedAlgorithmKey = 'BATTERY_CRANKING';
        } else if (lowerTitle.includes('fap') || lowerTitle.includes('inject')) {
          resolvedAlgorithmKey = 'DPF_REGENERATION';
        } else if (lowerTitle.includes('carburant') || lowerTitle.includes('jauge')) {
          resolvedAlgorithmKey = 'CUSUM_FUEL';
        }
      }

      try {
        await client.query(
          `UPDATE decision_recommendations
           SET status = 'EXECUTED', updated_at = NOW()
           WHERE tenant_id = $1 AND asset_id = $2 AND status != 'EXECUTED'`,
          [tenantId, wo.asset_id],
        );
      } catch {
        // Table optionnelle selon contexte tenant
      }

      // Réconciliation automatique avec les blocages de sécurité DVIR
      if (this.dvirService) {
        try {
          const res = this.dvirService.resolveDvirBlock(
            wo.asset_id,
            id,
            tenantId,
            dto.completionNotes || 'Clôture de l\'ordre de travail en atelier — anomalie réparée et certifiée conforme.',
          );
          if (res.resolved) {
            this.logger.log(
              `[RÉCONCILIATION ATELIER DVIR] Verrou de sécurité levé pour l'actif ${wo.asset_id} suite à la clôture de l'OT ${id}.`,
            );
          }
        } catch (dvirErr) {
          this.logger.warn(
            `[RÉCONCILIATION ATELIER DVIR] Impossible de lever le verrou DVIR pour ${wo.asset_id}: ${dvirErr}`,
          );
        }
      }

      const calculatedNewVhi =
        dto.recalculatedVhi ?? (wo.status === WorkOrderStatus.SCHEDULED ? 95 : 100);

      const mapped = this.mapWorkOrder(updateWoRes.rows[0], wo.asset_name, wo.asset_code);
      mapped.resetAlgorithmKey = resolvedAlgorithmKey;
      mapped.oemPartReference = dto.oemPartReference;
      mapped.mathematicalResetCertified = true;
      mapped.recalculatedVhi = calculatedNewVhi;

      return mapped;
    });
  }

  private mapWorkOrder(row: WorkOrderDatabaseRow, assetName?: string, assetCode?: string): WorkOrder {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      assetName,
      assetCode,
      title: row.title,
      description: row.description || undefined,
      priority: row.priority,
      status: row.status,
      triggerMeterValue: row.trigger_meter_value ? Number(row.trigger_meter_value) : undefined,
      estimatedLaborHours: row.estimated_labor_hours ? Number(row.estimated_labor_hours) : 0,
      actualLaborHours: row.actual_labor_hours ? Number(row.actual_labor_hours) : 0,
      hourlyRateApplied: row.hourly_rate_applied ? Number(row.hourly_rate_applied) : undefined,
      laborCost: row.labor_cost ? Number(row.labor_cost) : 0,
      partsCost: row.parts_cost ? Number(row.parts_cost) : 0,
      totalCost: row.total_cost ? Number(row.total_cost) : 0,
      downtimeHours: row.downtime_hours ? Number(row.downtime_hours) : 0,
      assignedTo: row.assigned_to || undefined,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
