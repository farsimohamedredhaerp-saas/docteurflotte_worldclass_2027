import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QwenOrchestratorService } from './services/qwen-orchestrator.service';
import { DraftActionManagerService } from './services/draft-action-manager.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';

@Controller('api/v1/copilot')
export class AiOrchestratorController {
  constructor(
    private readonly orchestrator: QwenOrchestratorService,
    private readonly draftManager: DraftActionManagerService,
  ) {}

  @Post('orchestrate')
  async handleCommand(
    @Body() body: { prompt: string; operator_id?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const operatorId = body.operator_id || req?.user?.email || 'operator@docteurflotte.dz';
    return this.orchestrator.processOperatorPrompt(body.prompt, operatorId);
  }

  @Post('commit/:draftId')
  async commitPendingAction(
    @Param('draftId') draftId: string,
    @Body() body: { operator_id?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const operatorId = body.operator_id || req?.user?.email || 'operator@docteurflotte.dz';
    return this.draftManager.commitDraft(draftId, operatorId);
  }

  @Post('reject/:draftId')
  async rejectPendingAction(
    @Param('draftId') draftId: string,
    @Body() body: { operator_id?: string; reason?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const operatorId = body.operator_id || req?.user?.email || 'operator@docteurflotte.dz';
    return this.draftManager.rejectDraft(draftId, operatorId, body.reason);
  }

  @Get('drafts/pending')
  async getPendingDrafts() {
    return this.draftManager.getPendingDrafts();
  }
}

