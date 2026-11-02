import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface DraftTransaction {
  draft_id: string;
  tool_name: string;
  payload: Record<string, unknown>;
  status: 'PENDING_APPROVAL' | 'COMMITTED' | 'REJECTED';
  created_at: string;
  expires_at: string;
  operator_id: string;
  ui_summary_card: {
    badge: string;
    title: string;
    impact_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    fields: Record<string, string | number>;
  };
}

export interface DraftExecutionReceipt {
  work_order_id?: string;
  matricule?: unknown;
  statut_atelier?: string;
  horodatage_execution?: string;
  naftal_lock_id?: string;
  id_carte?: unknown;
  statut_carte?: string;
  notification_envoyee?: string;
  [key: string]: unknown;
}

@Injectable()
export class DraftActionManagerService {
  // En production : Remplacer par @InjectRedis() private readonly redis: Redis
  private readonly draftStore = new Map<string, DraftTransaction>();

  async createDraft(
    toolName: string,
    validatedPayload: Record<string, unknown>,
    operatorId: string,
  ): Promise<DraftTransaction> {
    const draftId = `DRF-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 15 * 60000); // TTL 15 minutes

    const uiCard = this.buildTacticalUiCard(toolName, validatedPayload);

    const draft: DraftTransaction = {
      draft_id: draftId,
      tool_name: toolName,
      payload: validatedPayload,
      status: 'PENDING_APPROVAL',
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      operator_id: operatorId,
      ui_summary_card: uiCard,
    };

    this.draftStore.set(draftId, draft);
    return draft;
  }

  async commitDraft(
    draftId: string,
    operatorId: string,
  ): Promise<{ committed: boolean; execution_receipt: DraftExecutionReceipt }> {
    const draft = this.draftStore.get(draftId);
    if (!draft) throw new NotFoundException(`Transaction Draft ${draftId} introuvable ou expirée.`);
    if (draft.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Transaction déjà traitée (Statut: ${draft.status}).`);
    }

    // Exécution réelle dans PostgreSQL / TimescaleDB après validation humaine
    let receipt: DraftExecutionReceipt = {};

    if (draft.tool_name === 'creer_ordre_reparation') {
      receipt = {
        work_order_id: `OT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        matricule: draft.payload.matricule,
        statut_atelier: 'ASSIGNE_CHEF_ATELIER',
        horodatage_execution: new Date().toISOString(),
      };
    } else if (draft.tool_name === 'bloquer_carte_carburant') {
      receipt = {
        naftal_lock_id: `BLK-${Date.now()}`,
        id_carte: draft.payload.id_carte_naftal,
        statut_carte: 'QUARANTAINE_ACTIVE',
        notification_envoyee: 'Direction Sécurité & Audit Carburant',
      };
    }

    draft.status = 'COMMITTED';
    this.draftStore.set(draftId, draft);

    return { committed: true, execution_receipt: receipt };
  }

  async rejectDraft(draftId: string, operatorId: string, reason?: string): Promise<{ rejected: boolean; draft_id: string }> {
    const draft = this.draftStore.get(draftId);
    if (!draft) throw new NotFoundException(`Transaction Draft ${draftId} introuvable ou expirée.`);
    if (draft.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Transaction déjà traitée (Statut: ${draft.status}).`);
    }

    draft.status = 'REJECTED';
    this.draftStore.set(draftId, draft);
    return { rejected: true, draft_id: draftId };
  }

  getPendingDrafts(): DraftTransaction[] {
    return Array.from(this.draftStore.values()).filter((d) => d.status === 'PENDING_APPROVAL');
  }

  getDraft(draftId: string): DraftTransaction | undefined {
    return this.draftStore.get(draftId);
  }

  private buildTacticalUiCard(
    toolName: string,
    payload: Record<string, unknown>,
  ): DraftTransaction['ui_summary_card'] {
    if (toolName === 'creer_ordre_reparation') {
      const pieces = Array.isArray(payload.pieces_suspectees)
        ? payload.pieces_suspectees.join(', ')
        : String(payload.pieces_suspectees || '');
      return {
        badge: 'MAINTENANCE / ORDRE DE TRAVAIL',
        title: `Ouverture OT — ${String(payload.matricule || '')}`,
        impact_level: payload.priorite === 'CRITIQUE_IMMOBILISATION' ? 'CRITICAL' : 'HIGH',
        fields: {
          Système: String(payload.systeme_affecte || ''),
          Pièces: pieces,
          Priorité: String(payload.priorite || ''),
        },
      };
    }
    return {
      badge: 'SÉCURITÉ CARBURANT / NAFTAL',
      title: `Mise en Quarantaine Carte ${String(payload.id_carte_naftal || '')}`,
      impact_level: 'CRITICAL',
      fields: {
        Véhicule: String(payload.matricule_associe || ''),
        'Écart CUSUM': `-${String(payload.ecart_cusum_litres || '')} L`,
        Motif: String(payload.motif_suspicion || ''),
      },
    };
  }
}

