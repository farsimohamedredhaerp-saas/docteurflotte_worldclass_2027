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
import { JwtAuthGuard } from '../auth/auth.guard';
import { SimulateDigitalTwinDto } from './dto/digital-twin.dto';
import { DigitalTwinAsset } from '@docteurflotte/contracts';

@Controller('digital-twin')
@UseGuards(JwtAuthGuard)
export class DigitalTwinController {
  constructor(private readonly digitalTwinService: DigitalTwinService) {}

  @Get('assets')
  async getDigitalTwins(@Req() req: any): Promise<DigitalTwinAsset[]> {
    return this.digitalTwinService.getDigitalTwinsForTenant(req.tenantId);
  }

  @Get('twins')
  async getDigitalTwinsAlias(@Req() req: any): Promise<DigitalTwinAsset[]> {
    return this.digitalTwinService.getDigitalTwinsForTenant(req.tenantId);
  }

  @Get('assets/:id')
  async getDigitalTwinById(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.getDigitalTwinById(id, req.tenantId);
  }

  @Get('twins/:id')
  async getDigitalTwinByIdAlias(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.getDigitalTwinById(id, req.tenantId);
  }

  @Post('assets/:id/simulate')
  async simulateDigitalTwin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SimulateDigitalTwinDto,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.simulateDigitalTwin(id, dto, req.tenantId);
  }

  @Post('twins/:id/simulate')
  async simulateDigitalTwinAlias(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SimulateDigitalTwinDto,
  ): Promise<DigitalTwinAsset> {
    return this.digitalTwinService.simulateDigitalTwin(id, dto, req.tenantId);
  }
}
