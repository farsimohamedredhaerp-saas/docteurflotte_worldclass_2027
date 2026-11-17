import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { EngineRulesConfigService } from './engine-rules.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  EngineRuleCategory,
  EngineRuleCode,
  UpdateEngineRuleParamDto,
} from '@docteurflotte/contracts';

@Controller('engine-rules')
@UseGuards(JwtAuthGuard)
export class EngineRulesConfigController {
  constructor(private readonly rulesService: EngineRulesConfigService) {}

  @Get()
  async listRules(
    @Query('category') category?: EngineRuleCategory,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.rulesService.listRules(tenantId, category);
  }

  @Get('summary/fiscal')
  async getFiscalSummary(@Headers('x-tenant-id') tenantId?: string) {
    const [ras, guarantee, stampDuty, f20, vatForfeiture] = await Promise.all([
      this.rulesService.getFiscalRasParams(tenantId),
      this.rulesService.getGuaranteeWithholdingParams(tenantId),
      this.rulesService.getStampDutyParams(tenantId),
      this.rulesService.getF20FranchiseParams(tenantId),
      this.rulesService.getVatForfeitureParams(tenantId),
    ]);

    return {
      ras,
      guarantee,
      stampDuty,
      f20,
      vatForfeiture,
    };
  }

  @Get('summary/telematics')
  async getTelematicsSummary(@Headers('x-tenant-id') tenantId?: string) {
    const [cusum, ghostRefuel, cylinderHead, idleWaste, clutchSlip] = await Promise.all([
      this.rulesService.getTelematicsCusumParams(tenantId),
      this.rulesService.getGhostRefuelParams(tenantId),
      this.rulesService.getCylinderHeadParams(tenantId),
      this.rulesService.getIdleWasteParams(tenantId),
      this.rulesService.getClutchSlipParams(tenantId),
    ]);

    return {
      cusum,
      ghostRefuel,
      cylinderHead,
      idleWaste,
      clutchSlip,
    };
  }

  @Get('summary/regulatory')
  async getRegulatorySummary(@Headers('x-tenant-id') tenantId?: string) {
    const [enacta, drivingHours, coldChain] = await Promise.all([
      this.rulesService.getEnactaParams(tenantId),
      this.rulesService.getDrivingHoursParams(tenantId),
      this.rulesService.getColdChainParams(tenantId),
    ]);

    return {
      enacta,
      drivingHours,
      coldChain,
    };
  }

  @Get('summary/procurement')
  async getProcurementSummary(@Headers('x-tenant-id') tenantId?: string) {
    const [threeWayMatch, sparePartsSerial, odometerCheck] = await Promise.all([
      this.rulesService.getThreeWayMatchParams(tenantId),
      this.rulesService.getSparePartsSerialParams(tenantId),
      this.rulesService.getOdometerCheckParams(tenantId),
    ]);

    return {
      threeWayMatch,
      sparePartsSerial,
      odometerCheck,
    };
  }

  @Post('tenant')
  async setTenantParam(
    @Body() dto: UpdateEngineRuleParamDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rulesService.setTenantParam(
      tenantId,
      dto.ruleCategory,
      dto.ruleCode,
      dto.paramKey,
      dto.paramValue,
      dto.description,
    );
  }

  @Post('superadmin')
  async setSuperAdminParam(
    @Body()
    dto: UpdateEngineRuleParamDto & { isLockedByLaw?: boolean },
  ) {
    return this.rulesService.setSuperAdminParam(
      dto.ruleCategory,
      dto.ruleCode,
      dto.paramKey,
      dto.paramValue,
      dto.isLockedByLaw || false,
      dto.description,
    );
  }

  @Delete('tenant/:ruleCode/:paramKey')
  async resetTenantParam(
    @Param('ruleCode') ruleCode: EngineRuleCode,
    @Param('paramKey') paramKey: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.rulesService.resetTenantParam(tenantId, ruleCode, paramKey);
  }
}
