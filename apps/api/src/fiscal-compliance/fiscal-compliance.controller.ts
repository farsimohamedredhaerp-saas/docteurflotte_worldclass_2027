import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { FiscalProfileService } from './services/fiscal-profile.service';
import { FiscalDocumentService } from './services/fiscal-document.service';
import { FiscalEventService } from './services/fiscal-event.service';
import { DeclarationDraftService } from './services/declaration-draft.service';
import { FiscalAuditService } from './services/fiscal-audit.service';
import { EInvoicingReadinessService } from './services/e-invoicing-readiness.service';
import { PartnerAccountingExportService } from './services/partner-accounting-export.service';
import { FiscalProfileConfiguredGuard } from './guards/fiscal-profile.guard';
import {
  UpdateTenantFiscalProfileDto,
  CreateFiscalDocumentDto,
  CreateTenantCnrcActivityDto,
  FiscalDocumentType,
} from '@docteurflotte/contracts';

@Controller('fiscal')
@UseGuards(JwtAuthGuard)
export class FiscalComplianceController {
  constructor(
    private readonly profileService: FiscalProfileService,
    private readonly documentService: FiscalDocumentService,
    private readonly eventService: FiscalEventService,
    private readonly draftService: DeclarationDraftService,
    private readonly auditService: FiscalAuditService,
    private readonly eInvoicingService: EInvoicingReadinessService,
    private readonly partnerExportService: PartnerAccountingExportService,
  ) {}

  // 1. Profil Fiscal Tenant
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.tenantId);
  }

  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTenantFiscalProfileDto,
  ) {
    return this.profileService.updateProfile(req.tenantId, dto);
  }

  // 1bis. Activités CNRC du Tenant (Multi-Activités Art. 150 CIDTA)
  @Get('cnrc-activities')
  async getCnrcActivities(@Req() req: AuthenticatedRequest) {
    return this.profileService.getCnrcActivities(req.tenantId);
  }

  @Post('cnrc-activities')
  async createCnrcActivity(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTenantCnrcActivityDto,
  ) {
    return this.profileService.createCnrcActivity(req.tenantId, dto);
  }

  @Delete('cnrc-activities/:id')
  async deleteCnrcActivity(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.profileService.deleteCnrcActivity(req.tenantId, id);
  }

  // 2. Pièces Justificatives Fiscales (Asset-Centric)
  @Get('documents')
  async listDocuments(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('documentType') documentType?: FiscalDocumentType,
  ) {
    return this.documentService.listDocuments(req.tenantId, assetId, documentType);
  }

  @Post('documents')
  @UseGuards(FiscalProfileConfiguredGuard)
  async createDocument(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFiscalDocumentDto,
  ) {
    const doc = await this.documentService.createDocument(req.tenantId, dto);
    // Génération automatique synchrone de l'événement fiscal qualifié
    await this.eventService.createEventFromDocument(req.tenantId, doc.id);
    return doc;
  }

  @Get('documents/:id')
  async getDocumentById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentById(req.tenantId, id);
  }

  // 3. Événements Fiscaux Qualifiés
  @Get('events')
  async listEvents(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('periodYear') periodYear?: string,
    @Query('periodMonth') periodMonth?: string,
  ) {
    return this.eventService.listEvents(
      req.tenantId,
      assetId,
      periodYear ? parseInt(periodYear, 10) : undefined,
      periodMonth ? parseInt(periodMonth, 10) : undefined,
    );
  }

  @Post('events/recompute')
  @UseGuards(FiscalProfileConfiguredGuard)
  async recomputeFiscalEvents(
    @Req() req: AuthenticatedRequest,
    @Body('periodYear', ParseIntPipe) periodYear: number,
    @Body('periodMonth', ParseIntPipe) periodMonth: number,
  ) {
    return this.eventService.recomputeFiscalEvents(req.tenantId, periodYear, periodMonth);
  }

  // 4. Brouillons de Déclarations (G50 / Liasse)
  @Get('declarations/drafts')
  async getDrafts(
    @Req() req: AuthenticatedRequest,
    @Query('periodYear') periodYear?: string,
  ) {
    return this.draftService.getDrafts(
      req.tenantId,
      periodYear ? parseInt(periodYear, 10) : undefined,
    );
  }

  @Get('declarations/drafts/:id')
  async getDraftById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.draftService.getDraftById(req.tenantId, id);
  }

  @Post('declarations/drafts')
  @UseGuards(FiscalProfileConfiguredGuard)
  async generateMonthlyDraft(
    @Req() req: AuthenticatedRequest,
    @Body('periodYear', ParseIntPipe) periodYear: number,
    @Body('periodMonth', ParseIntPipe) periodMonth: number,
  ) {
    return this.draftService.generateMonthlyDraft(req.tenantId, periodYear, periodMonth);
  }

  @Post('declarations/:id/seal')
  @UseGuards(FiscalProfileConfiguredGuard)
  async sealDeclaration(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.email || 'admin@docteurflotte.dz';
    return this.draftService.sealDeclaration(req.tenantId, id, userId);
  }

  // 4bis. Liasse Fiscale SCF — Tableau 9 (Passage du résultat comptable au résultat fiscal - Règle 8)
  @Get('liasse/tableau-9')
  @UseGuards(FiscalProfileConfiguredGuard)
  async getTableau9(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ) {
    const fiscalYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.draftService.generateTableau9(req.tenantId, fiscalYear);
  }

  // 5. Piste d'Audit & Scellés Cryptographiques
  @Get('audit')
  async getAuditSeals(@Req() req: AuthenticatedRequest) {
    return this.auditService.getAuditSeals(req.tenantId);
  }

  @Get('audit/:sealId/verify')
  async verifySealIntegrity(
    @Req() req: AuthenticatedRequest,
    @Param('sealId') sealId: string,
  ) {
    return this.auditService.verifySealIntegrity(req.tenantId, sealId);
  }

  // 6. Synthèse Fiscale par Actif Racine (Asset)
  @Get('asset-summary/:assetId')
  async getAssetFiscalSummary(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
  ) {
    return this.auditService.getAssetFiscalSummary(req.tenantId, assetId);
  }

  // 7. Audit Flash & Préparation e-Facturation 2027 (Modèle DGI CTC)
  @Get('e-invoicing/readiness')
  async getEInvoicingReadiness(@Req() req: AuthenticatedRequest) {
    return this.eInvoicingService.getReadinessReport(req.tenantId);
  }

  // 8. Passerelle d'Export Comptable Partenaire 1-Clic (PC Compta DGI / Odoo Almawarid / Sage)
  @Get('partner-export')
  async exportPartnerAccounting(
    @Req() req: AuthenticatedRequest,
    @Query('format') format?: 'PC_COMPTA_DGI' | 'ODOO_ALMAWARID_JSON' | 'SAGE_CSV',
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const targetFormat = format || 'PC_COMPTA_DGI';
    const periodYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const periodMonth = month ? parseInt(month, 10) : undefined;
    return this.partnerExportService.exportAccounting(
      req.tenantId,
      targetFormat,
      periodYear,
      periodMonth,
    );
  }
}

