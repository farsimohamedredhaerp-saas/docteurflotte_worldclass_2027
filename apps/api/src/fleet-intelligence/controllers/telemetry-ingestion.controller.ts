import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { TelemetryNormalizerService } from '../services/telemetry-normalizer.service';
import { TelemetryStorageService } from '../services/telemetry-storage.service';
import {
  CanonicalTelemetryEvent,
  FlespiStreamRequestDto,
  Mode0VirtualIngestionDto,
  TraccarWebhookRequestDto,
} from '../dto/telemetry-ingestion.dto';
import * as crypto from 'crypto';

@Controller(['api/v1/ingest', 'api/v1/telemetry/ingest'])
export class TelemetryIngestionController {
  constructor(
    private readonly normalizer: TelemetryNormalizerService,
    private readonly storage: TelemetryStorageService,
  ) {}

  private verifyWebhookSecret(providedToken: string | undefined, expectedSecret: string | undefined, sourceName: string): void {
    if (!expectedSecret) {
      return;
    }
    if (!providedToken) {
      throw new UnauthorizedException(`Jeton webhook ${sourceName} manquant.`);
    }
    const cleanProvided = providedToken.replace(/^FlespiToken\s+/i, '').trim();
    const bufA = Buffer.from(cleanProvided);
    const bufB = Buffer.from(expectedSecret.trim());
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      throw new UnauthorizedException(`Jeton webhook ${sourceName} invalide.`);
    }
  }

  @Post(['webhooks/traccar', 'traccar-webhook'])
  async ingestTraccarWebhook(
    @Body() payload: TraccarWebhookRequestDto,
    @Headers('x-traccar-signature') traccarToken?: string,
  ): Promise<CanonicalTelemetryEvent> {
    this.verifyWebhookSecret(traccarToken, process.env.TRACCAR_WEBHOOK_SECRET, 'Traccar');

    const imei = payload.device.uniqueId;
    const resolved = await this.storage.resolveImeiToVehicle(imei);
    if (!resolved) {
      throw new HttpException(`IMEI non provisionné : ${imei}`, HttpStatus.NOT_FOUND);
    }

    const event = this.normalizer.fromTraccarWebhook(
      payload,
      resolved.tenantId,
      resolved.vehicleId,
    );
    await this.storage.persistCanonicalEvent(event);
    return event;
  }

  @Post('webhooks/flespi')
  async ingestFlespiFailoverStream(
    @Body() payload: FlespiStreamRequestDto,
    @Headers('x-flespi-token') token?: string,
  ): Promise<CanonicalTelemetryEvent[]> {
    this.verifyWebhookSecret(token, process.env.FLESPI_WEBHOOK_TOKEN, 'Flespi');

    const normalizedEvents: CanonicalTelemetryEvent[] = [];

    for (const msg of payload.messages || []) {
      const imei = String(msg.ident || '');
      if (!imei) continue;

      const resolved = await this.storage.resolveImeiToVehicle(imei);
      if (!resolved) continue;

      const event = this.normalizer.fromFlespiMessage(msg, resolved.tenantId, resolved.vehicleId);
      normalizedEvents.push(event);
    }

    if (normalizedEvents.length > 0) {
      await this.storage.persistCanonicalEventBatch(normalizedEvents);
    }

    return normalizedEvents;
  }

  @Post(['mode0-virtual', 'mode0'])
  async ingestMode0VirtualEvent(
    @Body() req: Mode0VirtualIngestionDto,
  ): Promise<CanonicalTelemetryEvent> {
    const event = this.normalizer.fromMode0VirtualEvent(req);
    await this.storage.persistCanonicalEvent(event);
    return event;
  }
}
