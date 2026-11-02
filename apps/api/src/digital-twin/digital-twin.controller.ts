import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DigitalTwinService } from './digital-twin.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SimulateDigitalTwinDto } from './dto/digital-twin.dto';
import {
  DigitalTwinAsset,
  AlgeriaWilayaProfile,
  ALGERIA_58_WILAYAS_PROFILES,
} from '@docteurflotte/contracts';

@Controller('digital-twin')
export class DigitalTwinController {
  constructor(private readonly digitalTwinService: DigitalTwinService) {}

  @Get('wilayas')
  getAlgeriaWilayas(): AlgeriaWilayaProfile[] {
    return ALGERIA_58_WILAYAS_PROFILES;
  }

  @Get('assets')
  @UseGuards(JwtAuthGuard)
  async getDigitalTwins(@Req() req: AuthenticatedRequest): Promise<DigitalTwinAsset[]> {
    return this.digitalTwinService.getDigitalTwinsForTenant(req.tenantId);
  }

  @Get('twins')
  @UseGuards(JwtAuthGuard)
  async getDigitalTwinsAlias(@Req() req: AuthenticatedRequest): Promise<DigitalTwinAsset[]> {
    return this.digitalTwinService.getDigitalTwinsForTenant(req.tenantId);
  }

  @Get('assets/:id')
  @UseGuards(JwtAuthGuard)
  async getDigitalTwinById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.getDigitalTwinById(id, req.tenantId);
  }

  @Get('twins/:id')
  @UseGuards(JwtAuthGuard)
  async getDigitalTwinByIdAlias(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.getDigitalTwinById(id, req.tenantId);
  }

  @Post('assets/:id/simulate')
  @UseGuards(JwtAuthGuard)
  async simulateDigitalTwin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SimulateDigitalTwinDto,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.simulateDigitalTwin(id, dto, req.tenantId);
  }

  @Post('twins/:id/simulate')
  @UseGuards(JwtAuthGuard)
  async simulateDigitalTwinAlias(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SimulateDigitalTwinDto,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.simulateDigitalTwin(id, dto, req.tenantId);
  }
}
