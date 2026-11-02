import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantSetupDto } from './dto/tenant-setup.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import {
  PurgeDemoDataResponse,
  TenantSettings,
  TenantSetupResponse,
} from '@docteurflotte/contracts';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async completeSetup(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: TenantSetupDto,
  ): Promise<TenantSetupResponse> {
    return this.tenantsService.completeSetup(req.tenantId, dto);
  }

  @Get('current')
  async getCurrent(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.getCurrentTenant(req.tenantId);
  }

  @Get('settings')
  async getSettings(@Req() req: AuthenticatedRequest): Promise<TenantSettings> {
    const data = await this.tenantsService.getCurrentTenant(req.tenantId);
    return data.settings;
  }

  @Put('settings')
  async updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateTenantSettingsDto,
  ): Promise<TenantSettings> {
    return this.tenantsService.updateSettings(req.tenantId, dto);
  }

  @Post('purge-demo')
  @HttpCode(HttpStatus.OK)
  async purgeDemo(@Req() req: AuthenticatedRequest): Promise<PurgeDemoDataResponse> {
    return this.tenantsService.purgeDemoData(req.tenantId);
  }
}
