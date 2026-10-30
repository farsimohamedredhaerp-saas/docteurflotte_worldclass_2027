import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { RecordMeterReadingDto } from './dto/record-meter-reading.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Asset, AssetCategory, MeterReading, MeterReadingResponse } from '@docteurflotte/contracts';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async createAsset(
    @Req() req: any,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    dto: CreateAssetDto,
  ): Promise<Asset> {
    return this.assetsService.createAsset(req.tenantId, dto);
  }

  @Get()
  async listAssets(
    @Req() req: any,
    @Query('category') category?: AssetCategory,
  ): Promise<Asset[]> {
    return this.assetsService.listAssets(req.tenantId, category);
  }

  @Get(':id')
  async getAssetById(@Req() req: any, @Param('id') id: string): Promise<Asset> {
    return this.assetsService.getAssetById(req.tenantId, id);
  }

  @Put(':id')
  async updateAsset(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAssetDto>,
  ): Promise<Asset> {
    return this.assetsService.updateAsset(req.tenantId, id, dto);
  }

  @Delete(':id')
  async deleteAsset(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.assetsService.deleteAsset(req.tenantId, id);
  }

  @Post(':id/readings')
  async recordMeterReading(
    @Req() req: any,
    @Param('id') assetId: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    dto: RecordMeterReadingDto,
  ): Promise<MeterReadingResponse> {
    return this.assetsService.recordMeterReading(req.tenantId, assetId, dto);
  }

  @Get(':id/readings')
  async listMeterReadings(
    @Req() req: any,
    @Param('id') assetId: string,
  ): Promise<MeterReading[]> {
    return this.assetsService.listMeterReadings(req.tenantId, assetId);
  }
}
