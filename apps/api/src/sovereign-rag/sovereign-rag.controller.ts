// Fichier : apps/api/src/sovereign-rag/sovereign-rag.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SovereignRagService } from './sovereign-rag.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  IngestKnowledgeItemDto,
  KnowledgeCategory,
  KnowledgeQueryResponse,
  QueryKnowledgeDto,
} from './dto/sovereign-rag.dto';

@Controller('api/v1/sovereign-rag')
@UseGuards(JwtAuthGuard)
export class SovereignRagController {
  constructor(private readonly ragService: SovereignRagService) {}

  /**
   * Recherche Hybride RRF (BM25 + Trigrammes + Spécifications JSONB).
   */
  @Post('query')
  async query(
    @Req() req: any,
    @Body() dto: QueryKnowledgeDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<KnowledgeQueryResponse> {
    const tenantId = req?.tenantId || headerTenantId;
    return this.ragService.searchHybrid(dto, tenantId);
  }

  /**
   * Extraction directe de spécifications déterministes (sans LLM).
   */
  @Get('specs')
  async getSpecs(
    @Query('manufacturer') manufacturer: string,
    @Query('subsystem') subsystem: string,
    @Query('modelSeries') modelSeries?: string,
  ) {
    return this.ragService.getExactSpecs(manufacturer, subsystem, modelSeries);
  }

  /**
   * Injection manuelle d'une nouvelle fiche technique ou procédure atelier.
   */
  @Post('ingest')
  async ingest(@Req() req: any, @Body() dto: IngestKnowledgeItemDto) {
    if (!dto.tenant_id && req?.tenantId) {
      dto.tenant_id = req.tenantId;
    }
    const id = await this.ragService.ingestItem(dto);
    return { success: true, id };
  }

  /**
   * Amorçage initial du coffre-fort avec les manuels officiels algériens (Kerax, Shacman, Actros, ENACTA).
   */
  @Post('seed')
  async seed() {
    return this.ragService.seedKnowledgeVault();
  }

  /**
   * Statistiques globales du coffre-fort souverain.
   */
  @Get('stats')
  async getStats() {
    return this.ragService.getVaultStats();
  }
}

