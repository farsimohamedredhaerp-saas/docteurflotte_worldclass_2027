import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { sha256Hex, canonicalJson } from '@docteurflotte/decision-engine';
import { DatabaseService } from '../database/database.service';
import { DecisionRulesEngine } from './decision-rules.engine';
import {
  ApproveDecisionDto,
  BudgetVarianceReport,
  CategoryVariance,
  CreateBudgetDto,
  DataOrigin,
  DecisionExplanationDossier,
  DecisionRecommendation,
  DecisionStatus,
  DismissDecisionDto,
  WorkOrderPriority,
  WorkOrderStatus,
  resolveCountryPack,
} from '@docteurflotte/contracts';

interface DecisionDatabaseRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  asset_name?: string;
  asset_code?: string;
  asset_category?: string;
  rule_id: string;
  rule_version: string;
  urgency: DecisionRecommendation['urgency'];
  title: string;
  description: string;
  estimated_action_cost: number | string;
  cost_inaction_risk: number | string;
  net_expected_savings: number | string;
  confidence_score: number | string;
  explanation_dossier?: DecisionExplanationDossier;
  status: string;
  resolved_work_order_id?: string;
  data_origin?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DecisionsService {
  private readonly logger = new Logger(DecisionsService.name);

  constructor(private readonly db: DatabaseService) {}

  async evaluateTenantDecisions(tenantId: string): Promise<DecisionRecommendation[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const settingsRes = await client.query(
        `SELECT economic_rates, currency FROM tenant_settings WHERE tenant_id = $1`,
        [tenantId],
      );
      const economicRates = settingsRes.rows[0]?.economic_rates || {};

      const assetsRes = await client.query(
        `SELECT * FROM assets WHERE tenant_id = $1`,
        [tenantId],
      );

      for (const assetRow of assetsRes.rows) {
        const asset = {
          id: assetRow.id,
          tenantId: assetRow.tenant_id,
          name: assetRow.name,
          code: assetRow.code,
          category: assetRow.category,
          status: assetRow.status,
          primaryMeterType: assetRow.primary_meter_type,
          currentMeterValue: Number(assetRow.current_meter_value),
          maintenanceIntervalValue: assetRow.maintenance_interval_value
            ? Number(assetRow.maintenance_interval_value)
            : undefined,
          nextMaintenanceMeterValue: assetRow.next_maintenance_meter_value
            ? Number(assetRow.next_maintenance_meter_value)
            : undefined,
          dataOrigin: assetRow.data_origin || DataOrigin.USER_ENTRY,
          createdAt: assetRow.created_at,
          updatedAt: assetRow.updated_at,
        };

        const recommendation = DecisionRulesEngine.evaluateAsset(asset, economicRates);

        if (recommendation) {
          const existingRes = await client.query(
            `SELECT id FROM decision_recommendations
             WHERE tenant_id = $1 AND asset_id = $2 AND rule_id = $3 AND status = $4`,
            [tenantId, asset.id, recommendation.ruleId, DecisionStatus.PENDING],
          );

          if (existingRes.rows.length === 0) {
            await client.query(
              `INSERT INTO decision_recommendations (
                 tenant_id, asset_id, rule_id, rule_version, urgency,
                 title, description, estimated_action_cost, cost_inaction_risk,
                 net_expected_savings, confidence_score, explanation_dossier, status, data_origin
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
              [
                tenantId,
                asset.id,
                recommendation.ruleId,
                recommendation.ruleVersion,
                recommendation.urgency,
                recommendation.title,
                recommendation.description,
                recommendation.estimatedActionCost,
                recommendation.costInactionRisk,
                recommendation.netExpectedSavings,
                recommendation.confidenceScore,
                JSON.stringify(recommendation.explanationDossier),
                DecisionStatus.PENDING,
                assetRow.data_origin || 'ESTIMATED',
              ],
            );

            this.logger.log(
              `[Décisionnel] Arbitrage ${recommendation.ruleId} émis pour l'actif ${asset.code}`,
            );
          }
        }
      }

      const listRes = await client.query(
        `SELECT d.*, a.name as asset_name, a.code as asset_code, a.category as asset_category
         FROM decision_recommendations d
         JOIN assets a ON a.id = d.asset_id
         WHERE d.tenant_id = $1 AND d.status = $2
         ORDER BY d.created_at DESC`,
        [tenantId, DecisionStatus.PENDING],
      );
      return listRes.rows.map((r) => this.mapDecision(r));
    });
  }

  async listDecisions(
    tenantId: string,
    status?: DecisionStatus,
  ): Promise<DecisionRecommendation[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT d.*, a.name as asset_name, a.code as asset_code, a.category as asset_category
        FROM decision_recommendations d
        JOIN assets a ON a.id = d.asset_id
        WHERE d.tenant_id = $1
      `;
      const params: (string | DecisionStatus)[] = [tenantId];

      if (status) {
        query += ` AND d.status = $2`;
        params.push(status);
      }

      query += ` ORDER BY d.created_at DESC`;

      const res = await client.query(query, params);
      return res.rows.map((r) => this.mapDecision(r));
    });
  }

  async approveDecision(
    tenantId: string,
    decisionId: string,
    dto: ApproveDecisionDto = {},
  ): Promise<{ decision: DecisionRecommendation; workOrderId: string }> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const decRes = await client.query(
        `SELECT d.*, a.name as asset_name, a.code as asset_code, a.current_meter_value
         FROM decision_recommendations d
         JOIN assets a ON a.id = d.asset_id
         WHERE d.id = $1 AND d.tenant_id = $2`,
        [decisionId, tenantId],
      );

      if (decRes.rows.length === 0) {
        throw new NotFoundException(`Décision ${decisionId} introuvable.`);
      }

      const dec = decRes.rows[0];
      if (dec.status !== DecisionStatus.PENDING) {
        throw new BadRequestException(
          `Cette décision a déjà été traitée (Statut : ${dec.status}).`,
        );
      }

      const targetBudget = dto.customBudget || Number(dec.estimated_action_cost);
      const woRes = await client.query(
        `INSERT INTO work_orders (
           tenant_id, asset_id, title, description, priority, status,
           trigger_meter_value, total_cost, assigned_to
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          tenantId,
          dec.asset_id,
          `OT Arbitré : ${dec.title}`,
          `Généré suite à l'arbitrage décisionnel ${dec.id} (${dec.rule_id}).\n` +
            `Économie nette projetée : ${dec.net_expected_savings} DA.\n` +
            (dto.notes ? `Notes : ${dto.notes}` : ''),
          dec.urgency === 'danger' ? WorkOrderPriority.CRITICAL : WorkOrderPriority.HIGH,
          WorkOrderStatus.SCHEDULED,
          dec.current_meter_value,
          targetBudget,
          dto.assignedTo || 'Atelier Central',
        ],
      );

      const workOrderId = woRes.rows[0].id;

      const updatedDecRes = await client.query(
        `UPDATE decision_recommendations
         SET status = $1, resolved_work_order_id = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [DecisionStatus.APPROVED, workOrderId, decisionId, tenantId],
      );

      // Enregistrement de l'événement dans le Data Plane Ledger (business_event)
      try {
        const payload = {
          decisionId,
          workOrderId,
          assetId: dec.asset_id,
          ruleId: dec.rule_id,
          title: dec.title,
          estimatedActionCost: Number(dec.estimated_action_cost),
          costInactionRisk: Number(dec.cost_inaction_risk),
          netExpectedSavings: Number(dec.net_expected_savings),
        };
        const sourceEventHash = sha256Hex(canonicalJson(payload));
        await client.query(
          `INSERT INTO business_event (
             id, tenant_id, event_id, event_type, source_event_hash,
             occurred_at, local_date, payload, status
           ) VALUES (
             $1::uuid, $2::uuid, $3, $4, $5,
             NOW(), CURRENT_DATE, $6::jsonb, 'PROCESSED'
           ) ON CONFLICT (tenant_id, event_id) DO NOTHING`,
          [
            crypto.randomUUID(),
            tenantId,
            `EVT-DEC-${decisionId}`,
            'MAINTENANCE_DECISION_APPROVED',
            sourceEventHash,
            JSON.stringify(payload),
          ],
        );
      } catch {
        // Enregistrement tolérant si schéma business_event en cours d'initialisation
      }

      return {
        decision: this.mapDecision({
          ...updatedDecRes.rows[0],
          asset_name: dec.asset_name,
          asset_code: dec.asset_code,
          asset_category: dec.asset_category,
        }),
        workOrderId,
      };
    });
  }

  async dismissDecision(
    tenantId: string,
    decisionId: string,
    dto: DismissDecisionDto,
  ): Promise<DecisionRecommendation> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const decRes = await client.query(
        `SELECT d.*, a.name as asset_name, a.code as asset_code, a.category as asset_category
         FROM decision_recommendations d
         JOIN assets a ON a.id = d.asset_id
         WHERE d.id = $1 AND d.tenant_id = $2`,
        [decisionId, tenantId],
      );

      if (decRes.rows.length === 0) {
        throw new NotFoundException(`Décision ${decisionId} introuvable.`);
      }

      const dec = decRes.rows[0];
      const updatedDossier = {
        ...dec.explanation_dossier,
        dismissalReason: dto.reason,
        dismissedAt: new Date().toISOString(),
      };

      const res = await client.query(
        `UPDATE decision_recommendations
         SET status = $1, explanation_dossier = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4
         RETURNING *`,
        [DecisionStatus.DISMISSED, JSON.stringify(updatedDossier), decisionId, tenantId],
      );

      return this.mapDecision({
        ...res.rows[0],
        asset_name: dec.asset_name,
        asset_code: dec.asset_code,
        asset_category: dec.asset_category,
      });
    });
  }

  async setBudget(tenantId: string, dto: CreateBudgetDto): Promise<void> {
    await this.db.withTenantContext(tenantId, async (client) => {
      await client.query(
        `INSERT INTO maintenance_budgets (tenant_id, period_year, period_month, budget_amount, allocated_category)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tenantId,
          dto.periodYear,
          dto.periodMonth || null,
          dto.budgetAmount,
          dto.allocatedCategory || 'GLOBAL',
        ],
      );
    });
  }

  async getBudgetVarianceReport(
    tenantId: string,
    year: number,
  ): Promise<BudgetVarianceReport> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const settingsRes = await client.query(
        `SELECT currency FROM tenant_settings WHERE tenant_id = $1`,
        [tenantId],
      );
      const currency = settingsRes.rows[0]?.currency || 'DZD';
      const countryPack = resolveCountryPack(undefined, currency);

      const budgetRes = await client.query(
        `SELECT COALESCE(SUM(budget_amount), 0) as total_budget, allocated_category
         FROM maintenance_budgets
         WHERE tenant_id = $1 AND period_year = $2
         GROUP BY allocated_category`,
        [tenantId, year],
      );

      let totalBudget = 0;
      const budgetByCategory: Record<string, number> = {};
      for (const r of budgetRes.rows) {
        const val = Number(r.total_budget);
        totalBudget += val;
        budgetByCategory[r.allocated_category] = val;
      }

      if (totalBudget === 0) {
        totalBudget = countryPack.defaultAnnualMaintenanceBudget;
      }

      const actualRes = await client.query(
        `SELECT COALESCE(SUM(w.total_cost), 0) as total_actual, a.category
         FROM work_orders w
         JOIN assets a ON a.id = w.asset_id
         WHERE w.tenant_id = $1 AND EXTRACT(YEAR FROM w.created_at) = $2
         GROUP BY a.category`,
        [tenantId, year],
      );

      let totalActual = 0;
      const actualByCategory: Record<string, number> = {};
      for (const r of actualRes.rows) {
        const val = Number(r.total_actual);
        totalActual += val;
        actualByCategory[r.category] = val;
      }

      const varianceAmount = totalActual - totalBudget;
      const variancePercentage =
        totalBudget > 0 ? Math.round((varianceAmount / totalBudget) * 1000) / 10 : 0;
      const isOverBudget = varianceAmount > 0;

      const allCategories = Array.from(
        new Set([...Object.keys(budgetByCategory), ...Object.keys(actualByCategory)]),
      );
      const categories: CategoryVariance[] = allCategories.map((cat) => {
        const b = budgetByCategory[cat] || totalBudget / (allCategories.length || 1);
        const a = actualByCategory[cat] || 0;
        const diff = a - b;
        return {
          category: cat,
          budget: Math.round(b),
          actual: Math.round(a),
          variance: Math.round(diff),
          variancePercentage: b > 0 ? Math.round((diff / b) * 1000) / 10 : 0,
        };
      });

      return {
        periodYear: year,
        totalBudget,
        totalActual,
        varianceAmount,
        variancePercentage,
        isOverBudget,
        currency,
        categories,
      };
    });
  }

  private mapDecision(row: DecisionDatabaseRow): DecisionRecommendation {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      assetName: row.asset_name || 'Véhicule Flotte',
      assetCode: row.asset_code || 'VEH-01',
      assetCategory: row.asset_category || 'HEAVY_TRUCK',
      ruleId: row.rule_id,
      ruleVersion: row.rule_version,
      urgency: row.urgency,
      title: row.title,
      description: row.description,
      estimatedActionCost: Number(row.estimated_action_cost),
      costInactionRisk: Number(row.cost_inaction_risk),
      netExpectedSavings: Number(row.net_expected_savings),
      confidenceScore: Number(row.confidence_score),
      explanationDossier: row.explanation_dossier || {
        inputMetrics: {},
        economicHypotheses: {},
        potentialFailureModes: [],
        mitigationAction: '',
      },
      status: row.status as DecisionStatus,
      resolvedWorkOrderId: row.resolved_work_order_id,
      dataOrigin: row.data_origin || 'PRODUCTION',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
