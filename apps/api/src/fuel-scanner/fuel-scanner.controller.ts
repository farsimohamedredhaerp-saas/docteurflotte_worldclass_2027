import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FuelScannerService } from './fuel-scanner.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { ScanFuelReceiptDto } from './dto/fuel-scanner.dto';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';

@Controller('fuel-scanner')
@UseGuards(JwtAuthGuard)
export class FuelScannerController {
  constructor(private readonly fuelScannerService: FuelScannerService) {}

  @Post('scan')
  async scanReceipt(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ScanFuelReceiptDto,
  ): Promise<FuelReceiptScanResult> {
    return this.fuelScannerService.scanAndReconcile(dto, req.tenantId);
  }

  @Get('receipts')
  async listRecentReceipts(@Req() req: AuthenticatedRequest): Promise<FuelReceiptScanResult[]> {
    return this.fuelScannerService.listRecentReceipts(req.tenantId);
  }
}
