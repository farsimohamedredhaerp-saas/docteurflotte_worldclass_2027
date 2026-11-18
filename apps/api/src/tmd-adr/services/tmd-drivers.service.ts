import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  TmdDriverCertification,
  CreateTmdDriverCertificationDto,
} from '@docteurflotte/contracts';

@Injectable()
export class TmdDriversService {
  private readonly logger = new Logger(TmdDriversService.name);

  constructor(private readonly db: DatabaseService) {}

  async listCertifications(tenantId: string): Promise<TmdDriverCertification[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM tmd_driver_certifications WHERE tenant_id = $1 ORDER BY expiry_date ASC`,
        [tenantId],
      );
      return res.rows.map((r) => this.mapCert(r));
    });
  }

  async getCertification(tenantId: string, id: string): Promise<TmdDriverCertification> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM tmd_driver_certifications WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException(`Brevet TMD ${id} introuvable.`);
      }
      return this.mapCert(res.rows[0]);
    });
  }

  async createCertification(
    tenantId: string,
    dto: CreateTmdDriverCertificationDto,
  ): Promise<TmdDriverCertification> {
    if (!dto.driverName || !dto.driverLicenseNumber || !dto.tmdCertificateNumber) {
      throw new BadRequestException('Nom, numéro de permis et numéro de brevet TMD obligatoires.');
    }

    const isExpired = new Date(dto.expiryDate) < new Date();

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO tmd_driver_certifications (
          tenant_id, driver_name, driver_license_number, tmd_certificate_number,
          hazard_classes, issuing_authority, issue_date, expiry_date, is_valid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          tenantId,
          dto.driverName.trim(),
          dto.driverLicenseNumber.trim().toUpperCase(),
          dto.tmdCertificateNumber.trim().toUpperCase(),
          dto.hazardClasses || 'CLASS_3_HYDROCARBONS',
          dto.issuingAuthority || 'Direction des Transports de Wilaya (DTW)',
          dto.issueDate,
          dto.expiryDate,
          !isExpired,
        ],
      );
      return this.mapCert(res.rows[0]);
    });
  }

  async checkDriverEligibility(tenantId: string, driverCertificationId: string): Promise<{ eligible: boolean; reason?: string }> {
    const cert = await this.getCertification(tenantId, driverCertificationId);
    const now = new Date();
    const expiry = new Date(cert.expiryDate);

    if (expiry < now) {
      return {
        eligible: false,
        reason: `Brevet TMD échu depuis le ${cert.expiryDate} (Infraction Décret 04-415).`,
      };
    }
    if (!cert.isValid) {
      return {
        eligible: false,
        reason: 'Brevet TMD suspendu ou non validé par la DTW.',
      };
    }
    return { eligible: true };
  }

  private mapCert(row: any): TmdDriverCertification {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      driverName: row.driver_name,
      driverLicenseNumber: row.driver_license_number,
      tmdCertificateNumber: row.tmd_certificate_number,
      hazardClasses: row.hazard_classes,
      issuingAuthority: row.issuing_authority,
      issueDate: row.issue_date?.toISOString?.()?.slice(0, 10) || String(row.issue_date).slice(0, 10),
      expiryDate: row.expiry_date?.toISOString?.()?.slice(0, 10) || String(row.expiry_date).slice(0, 10),
      isValid: row.is_valid,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }
}

