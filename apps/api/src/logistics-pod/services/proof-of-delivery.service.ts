import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  ProofOfDelivery,
  RecordPodDto,
  ShipmentStatus,
} from '@docteurflotte/contracts';

interface PodRow {
  id: string;
  tenant_id: string;
  lve_id: string;
  asset_id: string;
  delivered_at: string;
  recipient_name: string;
  recipient_identity_doc_ref: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  packages_delivered: number;
  packages_damaged: number;
  packages_refused: number;
  photos_urls: string[];
  signature_svg: string;
  notes: string | null;
  is_first_pass_delivery: boolean;
  sha256_proof_seal: string;
  created_at: string;
}

@Injectable()
export class ProofOfDeliveryService {
  constructor(private readonly db: DatabaseService) {}

  async recordProofOfDelivery(
    tenantId: string,
    dto: RecordPodDto,
  ): Promise<ProofOfDelivery> {
    if (!dto.lveId) {
      throw new BadRequestException('lveId est obligatoire pour enregistrer une preuve de livraison.');
    }
    if (!dto.recipientName) {
      throw new BadRequestException('Le nom du destinataire réceptionnaire est obligatoire.');
    }
    if (!dto.signatureSvg) {
      throw new BadRequestException('La signature numérique du destinataire est requise pour le scellement de la POD.');
    }

    // 1. Récupération de la LVE
    const lveRes = await this.db.query<{ id: string; asset_id: string; packages_count: number }>(
      `SELECT id, asset_id, packages_count FROM logistics_consignment_notes WHERE tenant_id = $1 AND id = $2`,
      [tenantId, dto.lveId],
    );
    if (lveRes.rows.length === 0) {
      throw new NotFoundException(`Lettre de voiture introuvable: ${dto.lveId}`);
    }
    const lve = lveRes.rows[0];

    // Vérification qu'une POD n'a pas déjà été enregistrée
    const existingPod = await this.db.query(
      `SELECT id FROM logistics_proof_of_delivery WHERE tenant_id = $1 AND lve_id = $2`,
      [tenantId, dto.lveId],
    );
    if (existingPod.rows.length > 0) {
      throw new BadRequestException('Une preuve de livraison a déjà été enregistrée pour cette LVE.');
    }

    // 2. Calcul du scellé d'intégrité SHA-256 de la POD
    const deliveredAt = new Date().toISOString();
    const canonicalPayload = JSON.stringify({
      tenantId,
      lveId: dto.lveId,
      assetId: lve.asset_id,
      recipientName: dto.recipientName,
      recipientIdentityDocRef: dto.recipientIdentityDocRef || '',
      packagesDelivered: dto.packagesDelivered,
      packagesDamaged: dto.packagesDamaged || 0,
      packagesRefused: dto.packagesRefused || 0,
      latitude: dto.latitude || null,
      longitude: dto.longitude || null,
      deliveredAt,
    });
    const sha256ProofSeal = createHash('sha256').update(canonicalPayload).digest('hex');

    // 3. Insertion
    const insertSql = `
      INSERT INTO logistics_proof_of_delivery (
        tenant_id, lve_id, asset_id, delivered_at, recipient_name, recipient_identity_doc_ref,
        latitude, longitude, packages_delivered, packages_damaged, packages_refused,
        photos_urls, signature_svg, notes, is_first_pass_delivery, sha256_proof_seal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.lveId,
      lve.asset_id,
      deliveredAt,
      dto.recipientName,
      dto.recipientIdentityDocRef || null,
      dto.latitude || null,
      dto.longitude || null,
      dto.packagesDelivered,
      dto.packagesDamaged || 0,
      dto.packagesRefused || 0,
      JSON.stringify(dto.photosUrls || []),
      dto.signatureSvg,
      dto.notes || null,
      dto.isFirstPassDelivery !== false,
      sha256ProofSeal,
    ];

    const res = await this.db.query<PodRow>(insertSql, params);

    // 4. Mise à jour statut LVE
    const hasIssues = (dto.packagesDamaged || 0) > 0 || (dto.packagesRefused || 0) > 0;
    const newStatus = hasIssues ? ShipmentStatus.PARTIALLY_DELIVERED : ShipmentStatus.DELIVERED;
    await this.db.query(
      `UPDATE logistics_consignment_notes SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, dto.lveId],
    );

    return this.mapRow(res.rows[0]);
  }

  async getPodByLveId(tenantId: string, lveId: string): Promise<ProofOfDelivery | null> {
    const res = await this.db.query<PodRow>(
      `SELECT * FROM logistics_proof_of_delivery WHERE tenant_id = $1 AND lve_id = $2`,
      [tenantId, lveId],
    );
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: PodRow): ProofOfDelivery {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      lveId: r.lve_id,
      assetId: r.asset_id,
      deliveredAt: r.delivered_at,
      recipientName: r.recipient_name,
      recipientIdentityDocRef: r.recipient_identity_doc_ref || undefined,
      latitude: r.latitude !== null ? Number(r.latitude) : undefined,
      longitude: r.longitude !== null ? Number(r.longitude) : undefined,
      packagesDelivered: Number(r.packages_delivered),
      packagesDamaged: Number(r.packages_damaged),
      packagesRefused: Number(r.packages_refused),
      photosUrls: typeof r.photos_urls === 'string'
        ? JSON.parse(r.photos_urls)
        : (r.photos_urls || []),
      signatureSvg: r.signature_svg,
      notes: r.notes || undefined,
      isFirstPassDelivery: r.is_first_pass_delivery,
      sha256ProofSeal: r.sha256_proof_seal,
      createdAt: r.created_at,
    };
  }
}

