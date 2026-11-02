// Fichier : apps/api/src/copilot/copilot.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Optional,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { OllamaSovereignService } from './ollama-sovereign.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { AskCopilotDto, ExecuteCopilotActionDto, RejectCopilotActionDto, TestInferenceDto } from './dto/copilot.dto';
import { CopilotResponse, CopilotInsightItem, CopilotActionSuggestion } from '@docteurflotte/contracts';

@Controller('copilot')
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(
    private readonly copilotService: CopilotService,
    @Optional() private readonly ollamaSovereignService?: OllamaSovereignService,
  ) {}

  @Get('ai-status')
  async getAiStatus() {
    return this.copilotService.getAiStatus();
  }

  @Get('ollama/status')
  async getOllamaStatus() {
    return this.copilotService.getAiStatus();
  }

  @Get('ai-logs')
  async getAiLogs() {
    return this.copilotService.getAiLogs();
  }

  @Post('test-inference')
  async testInference(@Body() dto: TestInferenceDto) {
    return this.copilotService.testInference(dto);
  }

  @Post('query')
  async ask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AskCopilotDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<CopilotResponse> {
    const tenantId = req?.tenantId || headerTenantId || 'tenant-default';
    return this.copilotService.ask(dto, tenantId);
  }

  @Post('ask')
  async askAlias(
    @Body() dto: AskCopilotDto,
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Req() req?: AuthenticatedRequest,
  ): Promise<CopilotResponse> {
    return this.copilotService.ask(dto, req?.tenantId || tenantId);
  }

  @Post('ocr/naftal')
  async processNaftalReceipt(@Body() body: { raw_text: string }) {
    if (!this.ollamaSovereignService) {
      return null;
    }
    return this.ollamaSovereignService.extractNaftalReceiptJson(body.raw_text);
  }

  @Get('insights')
  async getInsights(@Req() req: AuthenticatedRequest): Promise<CopilotInsightItem[]> {
    return this.copilotService.getInsights(req?.tenantId || 'tenant-default');
  }

  @Get('actions/pending')
  async getPendingActions(@Req() req: AuthenticatedRequest): Promise<CopilotActionSuggestion[]> {
    return this.copilotService.getPendingActions(req?.tenantId || 'tenant-default');
  }

  @Post('actions/:id/execute')
  async executeAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ExecuteCopilotActionDto,
  ) {
    const actorEmail = req?.user?.email || 'operator@docteurflotte.dz';
    return this.copilotService.executeAction(
      id,
      dto.justification || 'Validation manuelle via le Copilote Décisionnel',
      req?.tenantId || 'tenant-default',
      actorEmail,
    );
  }

  @Post('actions/:id/approve')
  async approveAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ExecuteCopilotActionDto,
  ) {
    const actorEmail = req?.user?.email || 'operator@docteurflotte.dz';
    return this.copilotService.executeAction(
      id,
      dto.justification || 'Approbation explicite (Human-in-the-Loop)',
      req?.tenantId || 'tenant-default',
      actorEmail,
    );
  }

  @Post('actions/:id/reject')
  async rejectAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RejectCopilotActionDto,
  ) {
    const actorEmail = req?.user?.email || 'operator@docteurflotte.dz';
    return this.copilotService.rejectAction(
      id,
      dto.reason || 'Rejeté par le gestionnaire',
      req?.tenantId || 'tenant-default',
      actorEmail,
    );
  }
}
