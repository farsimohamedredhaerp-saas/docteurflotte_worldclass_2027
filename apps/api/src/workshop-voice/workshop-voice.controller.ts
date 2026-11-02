// Fichier : apps/api/src/workshop-voice/workshop-voice.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkshopVoiceService } from './workshop-voice.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { VoiceQueryDto, VoiceRouteResult, WorkshopDictionaryEntry } from './dto/workshop-voice.dto';

@Controller('api/v1/workshop-voice')
@UseGuards(JwtAuthGuard)
export class WorkshopVoiceController {
  constructor(private readonly voiceService: WorkshopVoiceService) {}

  /**
   * Routeur Déterministe d'Atelier en Court-Circuit (< 400 ms).
   */
  @Post('transcribe-and-route')
  async routeVoice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VoiceQueryDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<VoiceRouteResult> {
    if (!dto.tenantId) {
      dto.tenantId = req?.tenantId || headerTenantId;
    }
    return this.voiceService.processVoiceQuery(dto);
  }

  @Post('query')
  async queryVoice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VoiceQueryDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<VoiceRouteResult> {
    return this.routeVoice(req, dto, headerTenantId);
  }

  /**
   * Récupère le glossaire phonétique mécanique Darja / Français de terrain.
   */
  @Get('dictionary')
  getDictionary(): WorkshopDictionaryEntry[] {
    return this.voiceService.getDictionary();
  }
}
