import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import {
  OemScraperService,
  OEMIngestDto,
  OEMTemplateResult,
  BulkCatalogImportDto,
  BulkCrawlResult,
} from '../services/oem-scraper.service';

@Controller('api/v1/oem-scraper')
export class OemScraperController {
  constructor(private readonly oemScraperService: OemScraperService) {}

  @Post('resolve-and-ingest')
  async resolveAndIngest(@Body() body: OEMIngestDto): Promise<OEMTemplateResult> {
    if (!body.vin && (!body.make || !body.model)) {
      throw new HttpException(
        'Fournissez soit un VIN de 17 caractères, soit au minimum la marque et le modèle.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.oemScraperService.resolveAndIngest(body);
  }

  @Post('bulk-crawl-catalog')
  async bulkCrawlCatalog(@Body() body: BulkCatalogImportDto): Promise<BulkCrawlResult> {
    return this.oemScraperService.bulkCrawlCatalog(body);
  }
}

