import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AskCopilotDto, ExecuteCopilotActionDto } from './dto/copilot.dto';
import { CopilotResponse, CopilotInsightItem } from '@docteurflotte/contracts';

@Controller('copilot')
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('query')
  async ask(
    @Req() req: any,
    @Body() dto: AskCopilotDto,
  ): Promise<CopilotResponse> {
    return this.copilotService.ask(dto, req.tenantId);
  }

  @Get('insights')
  async getInsights(@Req() req: any): Promise<CopilotInsightItem[]> {
    return this.copilotService.getInsights(req.tenantId);
  }

  @Post('actions/:id/execute')
  async executeAction(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ExecuteCopilotActionDto,
  ) {
    const actorEmail = req.user?.email || 'operator@docteurflotte.dz';
    return this.copilotService.executeAction(
      id,
      dto.justification || 'Validation manuelle via le Copilote Décisionnel',
      req.tenantId,
      actorEmail,
    );
  }
}
