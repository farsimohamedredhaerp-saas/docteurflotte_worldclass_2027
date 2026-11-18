import { UnauthorizedException } from '@nestjs/common';
import { TelemetryIngestionController } from './telemetry-ingestion.controller';

describe('TelemetryIngestionController — authentification des webhooks', () => {
  const originalEnv = { ...process.env };

  const storage = {
    resolveImeiToVehicle: jest.fn(),
    persistCanonicalEvent: jest.fn(),
  };
  const normalizer = { fromTraccarWebhook: jest.fn() };

  const traccarPayload = { device: { uniqueId: '123456789012345' } } as any;

  let controller: TelemetryIngestionController;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.TRACCAR_WEBHOOK_SECRET;
    controller = new TelemetryIngestionController(normalizer as any, storage as any);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('refuse le webhook Traccar en production quand aucun secret n\'est configuré', async () => {
    process.env.NODE_ENV = 'production';

    await expect(
      controller.ingestTraccarWebhook(traccarPayload, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(storage.resolveImeiToVehicle).not.toHaveBeenCalled();
  });

  it('refuse un jeton invalide quand un secret est configuré', async () => {
    process.env.NODE_ENV = 'production';
    process.env.TRACCAR_WEBHOOK_SECRET = 'secret-de-test-suffisamment-long-0123456789';

    await expect(
      controller.ingestTraccarWebhook(traccarPayload, 'mauvais-jeton'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(storage.resolveImeiToVehicle).not.toHaveBeenCalled();
  });

  it('accepte un jeton valide et poursuit vers la résolution de l\'IMEI', async () => {
    process.env.NODE_ENV = 'production';
    process.env.TRACCAR_WEBHOOK_SECRET = 'secret-de-test-suffisamment-long-0123456789';
    storage.resolveImeiToVehicle.mockResolvedValue({ tenantId: 't-1', vehicleId: 'v-1' });
    normalizer.fromTraccarWebhook.mockReturnValue({ id: 'evt-1' });

    await expect(
      controller.ingestTraccarWebhook(
        traccarPayload,
        'secret-de-test-suffisamment-long-0123456789',
      ),
    ).resolves.toEqual({ id: 'evt-1' });
    expect(storage.persistCanonicalEvent).toHaveBeenCalledTimes(1);
  });

  it('reste permissif hors production sans secret (développement local)', async () => {
    process.env.NODE_ENV = 'development';
    storage.resolveImeiToVehicle.mockResolvedValue({ tenantId: 't-1', vehicleId: 'v-1' });
    normalizer.fromTraccarWebhook.mockReturnValue({ id: 'evt-2' });

    await expect(
      controller.ingestTraccarWebhook(traccarPayload, undefined),
    ).resolves.toEqual({ id: 'evt-2' });
  });
});
