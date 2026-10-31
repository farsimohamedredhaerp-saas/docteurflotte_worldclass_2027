// Fichier : apps/api/src/decisions/services/proactive-anomaly-daemon.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface TelemetryDriftEvent {
  vehicleId: string;
  vehiclePlate: string;
  subsystem: 'MOTEUR' | 'FREINAGE' | 'ECHAPPEMENT_FAP' | 'INJECTION_CARBURANT' | 'CIRCUIT_HUILE';
  anomalyType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  evidence: {
    metricName: string;
    baselineValue: number;
    currentValue: number;
    driftDelta: number;
    driftPeriodDays: number;
    physicalLaw: string; // ex: 'Loi de Newton sur le refroidissement / Arrhenius' ou 'Modèle d Archard'
    explanation: string;
  };
  recommendedAction: string;
  estimatedActionCostDzd: number;
  inactionRiskCostDzd: number;
}

export interface ProactiveCard {
  id: string;
  vehiclePlate: string;
  subsystem: string;
  anomalyType: string;
  severity: string;
  evidence: Record<string, any>;
  recommendedAction: string;
  estimatedActionCostDzd: number;
  inactionRiskCostDzd: number;
  status: 'ACTIVE_CARD' | 'SNOOZED' | 'WORK_ORDER_CREATED' | 'DISMISSED';
  cooldownUntil: string;
  emittedAt: string;
}

@Injectable()
export class ProactiveAnomalyDaemonService {
  private readonly logger = new Logger(ProactiveAnomalyDaemonService.name);
  public static readonly DEFAULT_COOLDOWN_HOURS = 72;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Vérifie si une anomalie identique est actuellement sous cooldown actif (72h)
   * afin d'éviter l'effet "Echo Storm" matinal.
   */
  async hasActiveCooldown(
    tenantId: string,
    vehiclePlate: string,
    subsystem: string,
    anomalyType: string,
  ): Promise<boolean> {
    const pool = this.db.getPool();
    if (!pool) return false;

    const query = `
      SELECT id, cooldown_until, status
      FROM anomaly_cooldown_ledger
      WHERE 
        tenant_id = $1
        AND vehicle_plate = $2
        AND subsystem = $3
        AND anomaly_type = $4
        AND status IN ('ACTIVE_CARD', 'SNOOZED')
        AND cooldown_until > NOW()
      LIMIT 1;
    `;

    const res = await pool.query(query, [tenantId, vehiclePlate, subsystem, anomalyType]);
    return res.rows.length > 0;
  }

  /**
   * Vérifie si un Ordre de Travail (Work Order) est déjà ouvert ou programmé
   * sur le sous-système concerné, rendant toute alerte proactive redondante.
   */
  async hasOpenWorkOrder(tenantId: string, vehicleId: string, subsystem: string): Promise<boolean> {
    const pool = this.db.getPool();
    if (!pool) return false;

    const query = `
      SELECT id, status, title
      FROM work_orders
      WHERE 
        tenant_id = $1
        AND asset_id = $2
        AND status IN ('DRAFT', 'SCHEDULED', 'IN_PROGRESS')
        AND (title ILIKE $3 OR description ILIKE $3)
      LIMIT 1;
    `;

    const res = await pool.query(query, [tenantId, vehicleId, `%${subsystem}%`]);
    return res.rows.length > 0;
  }

  /**
   * Évalue les signaux faibles physiques et génère les cartes proactives de 08h00
   * en appliquant strictement les verrous Anti-Echo Storm et Dédoublonnage OT.
   */
  async processDetectedDrift(
    tenantId: string,
    drift: TelemetryDriftEvent,
  ): Promise<{ emitted: boolean; card?: ProactiveCard; suppressionReason?: string }> {
    // 1. Verrou 1 : Contrôle des Ordres de Travaux existants
    const hasWorkOrder = await this.hasOpenWorkOrder(tenantId, drift.vehicleId, drift.subsystem);
    if (hasWorkOrder) {
      this.logger.debug(
        `[Anti-Echo] Alerte supprimée pour ${drift.vehiclePlate} (${drift.anomalyType}) : Un Ordre de Travail est déjà ouvert sur le sous-système ${drift.subsystem}.`,
      );
      return {
        emitted: false,
        suppressionReason: `WORK_ORDER_ALREADY_OPEN_ON_${drift.subsystem}`,
      };
    }

    // 2. Verrou 2 : Contrôle du Cooldown de 72h
    const isUnderCooldown = await this.hasActiveCooldown(
      tenantId,
      drift.vehiclePlate,
      drift.subsystem,
      drift.anomalyType,
    );
    if (isUnderCooldown) {
      this.logger.debug(
        `[Anti-Echo] Alerte supprimée pour ${drift.vehiclePlate} (${drift.anomalyType}) : Sous période de cooldown (72h) active.`,
      );
      return {
        emitted: false,
        suppressionReason: 'ACTIVE_72H_COOLDOWN_IN_EFFECT',
      };
    }

    // 3. Émission de la carte décisionnelle & Enregistrement dans le Ledger
    const pool = this.db.getPool();
    const cooldownDate = new Date(Date.now() + ProactiveAnomalyDaemonService.DEFAULT_COOLDOWN_HOURS * 3600 * 1000);

    const fullEvidence = {
      ...drift.evidence,
      recommendedAction: drift.recommendedAction,
      estimatedActionCostDzd: drift.estimatedActionCostDzd,
      inactionRiskCostDzd: drift.inactionRiskCostDzd,
    };

    let cardId: string;
    if (pool) {
      const insertQuery = `
        INSERT INTO anomaly_cooldown_ledger (
          tenant_id, vehicle_plate, subsystem, anomaly_type, severity,
          status, evidence, cooldown_until, last_emitted_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE_CARD', $6, $7, NOW(), NOW())
        RETURNING id;
      `;
      const res = await pool.query(insertQuery, [
        tenantId,
        drift.vehiclePlate,
        drift.subsystem,
        drift.anomalyType,
        drift.severity,
        JSON.stringify(fullEvidence),
        cooldownDate.toISOString(),
      ]);
      cardId = res.rows[0].id;
    } else {
      cardId = `mock-card-${Date.now()}`;
    }

    const card: ProactiveCard = {
      id: cardId,
      vehiclePlate: drift.vehiclePlate,
      subsystem: drift.subsystem,
      anomalyType: drift.anomalyType,
      severity: drift.severity,
      evidence: fullEvidence,
      recommendedAction: drift.recommendedAction,
      estimatedActionCostDzd: drift.estimatedActionCostDzd,
      inactionRiskCostDzd: drift.inactionRiskCostDzd,
      status: 'ACTIVE_CARD',
      cooldownUntil: cooldownDate.toISOString(),
      emittedAt: new Date().toISOString(),
    };

    this.logger.log(
      `[ProactiveDaemon] Nouvelle carte émise : ${drift.vehiclePlate} | ${drift.anomalyType} (Cooldown fixé jusqu'au ${cooldownDate.toISOString()})`,
    );

    return {
      emitted: true,
      card,
    };
  }

  /**
   * Acquitte ou met en veille une carte décisionnelle pour X heures (ex: 72h).
   */
  async snoozeCard(tenantId: string, cardId: string, hours = 72): Promise<boolean> {
    const pool = this.db.getPool();
    if (!pool) return false;

    const cooldownDate = new Date(Date.now() + hours * 3600 * 1000);
    const query = `
      UPDATE anomaly_cooldown_ledger
      SET status = 'SNOOZED', cooldown_until = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3;
    `;
    const res = await pool.query(query, [cooldownDate.toISOString(), cardId, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Associe un Ordre de Travail créé à la carte décisionnelle pour clôturer l'anomalie.
   */
  async attachWorkOrder(tenantId: string, cardId: string, workOrderId: string): Promise<boolean> {
    const pool = this.db.getPool();
    if (!pool) return false;

    const query = `
      UPDATE anomaly_cooldown_ledger
      SET status = 'WORK_ORDER_CREATED', work_order_id = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3;
    `;
    const res = await pool.query(query, [workOrderId, cardId, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }
}
