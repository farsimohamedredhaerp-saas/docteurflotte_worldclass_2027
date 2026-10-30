import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PlatformAuditLog } from '@docteurflotte/contracts';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getAuditLogs(limit = 100): Promise<PlatformAuditLog[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `SELECT * 
       FROM platform_audit_logs 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return res.rows;
  }
}
