import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TelematicsService } from './telematics.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import {
  AssetDeviceBinding,
  BindDeviceDto,
  FleetLiveAsset,
  IngestPositionDto,
  RegisterDeviceDto,
  TelematicsDevice,
  TraccarGatewayHealth,
} from '@docteurflotte/contracts';

@Controller('telematics')
@UseGuards(JwtAuthGuard)
export class TelematicsController {
  constructor(private readonly telematicsService: TelematicsService) { }

  @Post('devices')
  async registerDevice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RegisterDeviceDto,
  ): Promise<TelematicsDevice> {
    return this.telematicsService.registerDevice(req.tenantId, dto);
  }

  @Get('devices')
  async listDevices(@Req() req: AuthenticatedRequest): Promise<TelematicsDevice[]> {
    return this.telematicsService.listDevices(req.tenantId);
  }

  @Post('bindings')
  async bindDevice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: BindDeviceDto,
  ): Promise<AssetDeviceBinding> {
    return this.telematicsService.bindDeviceToAsset(
      req.tenantId,
      dto.assetId,
      dto.deviceId,
    );
  }

  @Delete('bindings/:id')
  async unbindDevice(
    @Req() req: AuthenticatedRequest,
    @Param('id') bindingId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.telematicsService.unbindDevice(req.tenantId, bindingId);
    return { success: true, message: 'Appairage dissocié avec succès.' };
  }

  @Get('bindings')
  async listBindings(@Req() req: AuthenticatedRequest): Promise<AssetDeviceBinding[]> {
    return this.telematicsService.listBindings(req.tenantId);
  }

  @Post('positions')
  async ingestPosition(
    @Req() req: AuthenticatedRequest,
    @Body() dto: IngestPositionDto,
  ) {
    return this.telematicsService.ingestPosition(req.tenantId, dto);
  }

  @Get('fleet-live')
  async getFleetLive(@Req() req: AuthenticatedRequest): Promise<FleetLiveAsset[]> {
    return this.telematicsService.getFleetLive(req.tenantId);
  }

  @Get('health')
  async getHealth(@Req() req: AuthenticatedRequest): Promise<TraccarGatewayHealth> {
    return this.telematicsService.getGatewayHealth(req.tenantId);
  }
}
