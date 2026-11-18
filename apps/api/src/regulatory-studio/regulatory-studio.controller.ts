import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PlatformAdminGuard } from '../admin/guards/platform-admin.guard';
import {
  CloneRegPackDto,
  PublishRegPackDto,
  SimulateRegPackDto,
  UpdateRegulatoryParameterDto,
} from './dto/regulatory-studio.dto';
import {
  RegulatoryStudioService,
  PackSummary,
  SimulationResult,
} from './regulatory-studio.service';
import { RegPackDefinition } from '@docteurflotte/decision-engine';

@Controller('api/v1/superadmin/regulatory-packs')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class RegulatoryStudioController {
  constructor(private readonly studioService: RegulatoryStudioService) {}

  /**
   * Liste tous les packs réglementaires (officiels et brouillons)
   */
  @Get()
  listPacks(): PackSummary[] {
    return this.studioService.listPacks();
  }

  /**
   * Détails complets d'un pack réglementaire
   */
  @Get(':packCode')
  getPack(@Param('packCode') packCode: string): RegPackDefinition {
    return this.studioService.getPack(packCode);
  }

  /**
   * Résout et compile l'état réglementaire actif pour une date asOf
   */
  @Get(':packCode/active-state')
  resolveActiveState(
    @Query('asOf') asOf?: string,
    @Query('knownAt') knownAt?: string
  ): { asOf: string; knownAt: string; parametersCount: number; parameters: Record<string, string> } {
    const state = this.studioService.resolveActiveState(asOf, knownAt);
    const map = state.compileParameterMap();
    const parameters: Record<string, string> = {};
    for (const [k, v] of map.entries()) {
      parameters[k] = v.value;
    }

    return {
      asOf: state.asOf,
      knownAt: state.knownAt,
      parametersCount: map.size,
      parameters,
    };
  }

  /**
   * Cloner un pack vers un nouvel exercice en brouillon
   */
  @Post('clone')
  clonePack(
    @Body() dto: CloneRegPackDto,
    @Req() req: any
  ): RegPackDefinition {
    const authorEmail = req.user?.email || 'superadmin@docteurflotte.dz';
    return this.studioService.clonePack(dto, authorEmail);
  }

  /**
   * Modifier ou ajouter un paramètre bitemporel avec référence légale obligatoire
   */
  @Put(':packCode/parameters/:parameterKey')
  updateParameter(
    @Param('packCode') packCode: string,
    @Param('parameterKey') parameterKey: string,
    @Body() dto: UpdateRegulatoryParameterDto,
    @Req() req: any
  ): RegPackDefinition {
    const modifierEmail = req.user?.email || 'superadmin@docteurflotte.dz';
    return this.studioService.updateParameter(packCode, parameterKey, dto, modifierEmail);
  }

  /**
   * Simuler l'impact fiscal et économique sur un profil d'entreprise algérien
   */
  @Post(':packCode/simulate')
  simulate(
    @Param('packCode') packCode: string,
    @Body() dto: SimulateRegPackDto
  ): SimulationResult {
    return this.studioService.simulate(packCode, dto);
  }

  /**
   * Signer par Ed25519 et publier officiellement le pack
   */
  @Post(':packCode/publish')
  publish(
    @Param('packCode') packCode: string,
    @Body() dto: PublishRegPackDto
  ): RegPackDefinition {
    return this.studioService.publish(packCode, dto);
  }
}
