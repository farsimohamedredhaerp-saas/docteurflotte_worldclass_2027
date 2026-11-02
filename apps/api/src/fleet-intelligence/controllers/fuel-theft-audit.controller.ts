import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CusumLegalClerkService,
  FuelIncidentEvaluationInput,
} from '../services/cusum-legal-clerk.service';
import {
  BilingualLegalAuditReport,
  PreComputedContextGraphPayload,
} from '@docteurflotte/contracts';

@Controller('api/v1/fleet-intelligence/fuel-theft')
export class FuelTheftAuditController {
  constructor(private readonly clerkService: CusumLegalClerkService) {}

  /**
   * Évalue un incident de carburant avec correction de dévers Valhalla et génère un PV bilingue opposable
   */
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateIncident(
    @Body() payload: FuelIncidentEvaluationInput,
  ): Promise<BilingualLegalAuditReport> {
    return this.clerkService.generateAuditReport(payload);
  }

  /**
   * Génère uniquement le graphe pré-calculé (Deterministic Pre-Computed Context Graph)
   */
  @Post('graph')
  @HttpCode(HttpStatus.OK)
  generatePreComputedGraph(
    @Body() payload: FuelIncidentEvaluationInput,
  ): PreComputedContextGraphPayload {
    return this.clerkService.buildPreComputedGraph(payload);
  }

  /**
   * Liste l'ensemble des rapports d'audit juridique CUSUM générés
   */
  @Get('reports')
  listReports(): BilingualLegalAuditReport[] {
    return this.clerkService.listReports();
  }

  /**
   * Récupère un rapport d'audit spécifique par son identifiant scellé HMAC
   */
  @Get('reports/:id')
  getReportById(@Param('id') id: string): BilingualLegalAuditReport {
    const report = this.clerkService.getReportById(id);
    if (!report) {
      throw new NotFoundException(`Rapport d'audit CUSUM introuvable : ${id}`);
    }
    return report;
  }
}

