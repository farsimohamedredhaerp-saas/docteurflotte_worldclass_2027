import { OemScraperService } from './services/oem-scraper.service';

describe('OemScraperService - Référentiel Souverain & Résolution OEM RMI', () => {
  let service: OemScraperService;

  beforeAll(() => {
    service = new OemScraperService();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  describe('Résolution de signature de véhicule (resolveSignature)', () => {
    it('doit résoudre fidèlement une requête "mercedes glk 2012 4matic" vers Mercedes-Benz GLK 220 CDI', () => {
      const sig = service.resolveSignature({
        make: 'mercedes glk 2012 4matic',
        model: '',
        engineCode: '',
        assetCategory: 'LIGHT_VEHICLE',
      });

      expect(sig.make).toBe('Mercedes-Benz');
      expect(sig.model).toBe('GLK 220 CDI 4MATIC (X204)');
      expect(sig.engine).toBe('OM 651 DE 22 LA (2.1L Bi-Turbo 170ch)');
      expect(sig.wmi).toBe('WDC');
      expect(sig.category).toBe('LIGHT_VEHICLE');
    });

    it('doit résoudre un numéro de châssis VIN WDC (Mercedes GLK)', () => {
      const sig = service.resolveSignature({
        vin: 'WDC2049841F123456',
      });

      expect(sig.make).toBe('Mercedes-Benz');
      expect(sig.model).toContain('GLK');
      expect(sig.wmi).toBe('WDC');
    });

    it('doit résoudre la variante V6 GLK 350 CDI 4MATIC si 350 ou V6 est spécifié', () => {
      const sig = service.resolveSignature({
        make: 'Mercedes-Benz',
        model: 'GLK 350 CDI 4MATIC',
        engineCode: 'OM 642 V6',
      });

      expect(sig.make).toBe('Mercedes-Benz');
      expect(sig.model).toBe('GLK 350 CDI 4MATIC (X204)');
      expect(sig.engine).toContain('OM 642');
      expect(sig.wmi).toBe('WDC');
    });
  });

  describe('Crawl universel par marque & modèle (bulkCrawlCatalog)', () => {
    it('doit retourner le Mercedes GLK et JAMAIS un Toyota Hilux lors de la recherche "mercedes glk 2012 4matic"', async () => {
      const result = await service.bulkCrawlCatalog({
        targetMake: 'mercedes glk 2012 4matic',
        assetCategory: 'LIGHT_VEHICLE',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.importedCount).toBeGreaterThanOrEqual(1);
      expect(result.sampleTemplates.length).toBeGreaterThanOrEqual(1);

      const firstVehicle = result.sampleTemplates[0];

      // Vérification absolue : Zéro substitution par Toyota
      expect(firstVehicle.make).toBe('Mercedes-Benz');
      expect(firstVehicle.model).toContain('GLK');
      expect(firstVehicle.make.toLowerCase()).not.toContain('toyota');
      expect(firstVehicle.model.toLowerCase()).not.toContain('hilux');

      // Vérification des spécifications mécaniques exactes
      expect(firstVehicle.oilCapacityLiters).toBe(6.5);
      expect(firstVehicle.oilNormSpec).toContain('229.52');

      // Vérification des tâches d'entretien constructeur (4MATIC + Service A/B)
      const taskCodes = firstVehicle.tasks.map((t) => t.taskCode);
      expect(taskCodes).toContain('ENG_OIL_FILTER_SERVICE_A');
      expect(taskCodes).toContain('TRANSMISSION_7G_TRONIC_4MATIC');
      expect(taskCodes).toContain('BRAKE_SYSTEM_SERVICE_B');

      // Vérification du message descriptif
      expect(result.message).toContain('MERCEDES GLK 2012 4MATIC');
    });

    it('doit retourner tous les modèles Mercedes lors d\'un crawl générique de marque "mercedes"', async () => {
      const result = await service.bulkCrawlCatalog({
        targetMake: 'mercedes',
        assetCategory: 'LIGHT_VEHICLE',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.sampleTemplates.length).toBeGreaterThanOrEqual(1);

      for (const t of result.sampleTemplates) {
        expect(t.make).toBe('Mercedes-Benz');
      }
    });
  });
});
