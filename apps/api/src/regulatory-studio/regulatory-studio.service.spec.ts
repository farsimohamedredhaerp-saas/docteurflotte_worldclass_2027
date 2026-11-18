import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RegulatoryStudioService } from './regulatory-studio.service';
import { RegPackStatus } from '@docteurflotte/decision-engine';

describe('RegulatoryStudioService — Contrôle & Administration des RegPacks', () => {
  let service: RegulatoryStudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegulatoryStudioService],
    }).compile();

    service = module.get<RegulatoryStudioService>(RegulatoryStudioService);
  });

  it('est défini et initialise les packs officiels 2025, 2026 et 2027', () => {
    expect(service).toBeDefined();
    const packs = service.listPacks();
    expect(packs.length).toBeGreaterThanOrEqual(3);

    const pack2025 = packs.find((p) => p.packCode === 'DZ_LF_2025_OFFICIAL');
    const pack2026 = packs.find((p) => p.packCode === 'DZ_LF_2026_OFFICIAL');
    const pack2027 = packs.find((p) => p.packCode === 'DZ_LF_2027_DRAFT');

    expect(pack2025?.status).toBe(RegPackStatus.PUBLISHED);
    expect(pack2026?.status).toBe(RegPackStatus.PUBLISHED);
    expect(pack2027?.status).toBe(RegPackStatus.DRAFT);
  });

  it('récupère un pack ou lève NotFoundException si inexistant', () => {
    const pack = service.getPack('DZ_LF_2025_OFFICIAL');
    expect(pack.packCode).toBe('DZ_LF_2025_OFFICIAL');
    expect(pack.items.length).toBeGreaterThan(10);

    expect(() => service.getPack('INCONNU_2099')).toThrow(NotFoundException);
  });

  it('clone un pack existant vers un nouveau pack au statut DRAFT', () => {
    const cloned = service.clonePack(
      {
        sourcePackId: 'DZ_LF_2026_OFFICIAL',
        newPackId: 'DZ_LF_2028_TEST_DRAFT',
        newVersion: '2028.0.1-draft',
        descriptionFr: 'Pack de test exercice 2028',
      },
      'admin.fiscal@dzerp.dz'
    );

    expect(cloned.packCode).toBe('DZ_LF_2028_TEST_DRAFT');
    expect(cloned.status).toBe(RegPackStatus.DRAFT);
    expect(cloned.authorEmail).toBe('admin.fiscal@dzerp.dz');
    expect(cloned.items.length).toBeGreaterThan(5);

    // Conflit si on tente de cloner sous le même identifiant
    expect(() =>
      service.clonePack(
        {
          sourcePackId: 'DZ_LF_2026_OFFICIAL',
          newPackId: 'DZ_LF_2028_TEST_DRAFT',
          newVersion: '2028.0.2',
          descriptionFr: 'Doublon',
        },
        'admin@dzerp.dz'
      )
    ).toThrow(ConflictException);
  });

  it('refuse la modification d\'un paramètre sur un pack déjà publié (immuabilité)', () => {
    expect(() =>
      service.updateParameter(
        'DZ_LF_2025_OFFICIAL',
        'IFU_MINIMUM_GENERAL',
        {
          value: '40000',
          type: 'MONTANT_DZD',
          applicableFrom: '2025-01-01',
          legalReference: 'Tentative modification illicite',
        },
        'pirate@dzerp.dz'
      )
    ).toThrow(BadRequestException);
  });

  it('modifie un paramètre avec référence légale sur un pack en statut DRAFT', () => {
    // 1. Cloner
    service.clonePack(
      {
        sourcePackId: 'DZ_LF_2026_OFFICIAL',
        newPackId: 'DZ_LF_2027_CUSTOM_DRAFT',
        newVersion: '2027.0.1',
        descriptionFr: 'Brouillon pour test update',
      },
      'author@dzerp.dz'
    );

    // 2. Modifier
    const updated = service.updateParameter(
      'DZ_LF_2027_CUSTOM_DRAFT',
      'IFU_MINIMUM_GENERAL',
      {
        value: '35000',
        type: 'MONTANT_DZD',
        applicableFrom: '2027-01-01',
        legalReference: 'Projet de Loi de Finances 2027, Art. X',
        joradpCitation: 'Conseil des ministres',
      },
      'updater@dzerp.dz'
    );

    const param = updated.items.find((i) => i.code === 'IFU_MINIMUM_GENERAL');
    expect(param?.payload.value).toBe('35000');
    expect(param?.legalRef).toBe('Projet de Loi de Finances 2027, Art. X');
    expect(param?.payload.sourceHash).toBeDefined();
  });

  describe('Simulations d\'impacts économiques et fiscaux', () => {
    it('simule le cas ARTISAN_IFU_5M avec application du minimum légal', () => {
      const res = service.simulate('DZ_LF_2025_OFFICIAL', {
        caseType: 'ARTISAN_IFU_5M',
      });

      expect(res.packCode).toBe('DZ_LF_2025_OFFICIAL');
      expect(res.metrics.chiffreAffairesTotalDzd).toBe('5000000.00');
      // 2M vente (5% = 100k) + 3M services (12% = 360k) = 460k DA
      expect(res.metrics.impotIfuFinalDuDzd).toBe('460000.00');
      expect(res.metrics.maintienRegimeIfu).toBe(true);
    });

    it('simule le cas SARL_BTPH_50M avec comptabilité séparée et CNAS', () => {
      const res = service.simulate('DZ_LF_2026_OFFICIAL', {
        caseType: 'SARL_BTPH_50M',
      });

      expect(res.packCode).toBe('DZ_LF_2026_OFFICIAL');
      // BTPH: 7M à 23% = 1.61M ; Location: 3M à 26% = 780k ; Total = 2.39M
      expect(res.metrics.ibsTotalDuDzd).toBe('2390000.00');
      expect(res.metrics.cnasPartEmployeurDzd).toBe('3060000.00'); // 12M * 25.5%
      expect(res.metrics.cnasPartSalarieDzd).toBe('1080000.00');  // 12M * 9.0%
    });

    it('simule le cas TRANSPORTEUR_GRAND_SUD avec les forfaits sahariens', () => {
      const res = service.simulate('DZ_LF_2026_OFFICIAL', {
        caseType: 'TRANSPORTEUR_GRAND_SUD',
      });

      expect(res.metrics.forfaitRemorquageSudDzd).toBe('75000');
      expect(res.metrics.forfaitRemorquageNordDzd).toBe('35000');
      expect(res.metrics.coutImmobilisationJourDzd).toBe('25000');
      expect(res.metrics.seuilPaiementEspecesDzd).toBe('1000000');
    });

    it('simule le cas STARTUP_INNOVATION avec les avantages LF 2026', () => {
      const res = service.simulate('DZ_LF_2026_OFFICIAL', {
        caseType: 'STARTUP_INNOVATION',
      });

      expect(res.metrics.dureeExonerationInitialeAnnees).toBe(4);
      expect(res.metrics.prolongationLabelAnnees).toBe(2);
      expect(res.metrics.dureeTotaleExonerationAnnees).toBe(6);
      expect(res.metrics.tauxCreditImpotRd).toBe('35%');
    });
  });

  describe('Publication et signature Ed25519', () => {
    it('interdit la publication par l\'auteur lui-même (Maker-Checker)', () => {
      service.clonePack(
        {
          sourcePackId: 'DZ_LF_2026_OFFICIAL',
          newPackId: 'DZ_LF_2027_MAKER_TEST',
          newVersion: '2027.1.0',
          descriptionFr: 'Test Maker Checker',
        },
        'author.only@dzerp.dz'
      );

      expect(() =>
        service.publish('DZ_LF_2027_MAKER_TEST', {
          publishedByEmail: 'author.only@dzerp.dz',
          validatedByExpert: 'Expert Comptable',
        })
      ).toThrow(BadRequestException);
    });

    it('valide les portes de publication, signe avec Ed25519 et publie le pack', () => {
      service.clonePack(
        {
          sourcePackId: 'DZ_LF_2026_OFFICIAL',
          newPackId: 'DZ_LF_2027_SIGN_TEST',
          newVersion: '2027.1.0',
          descriptionFr: 'Test publication et signature',
        },
        'author@dzerp.dz'
      );

      const published = service.publish('DZ_LF_2027_SIGN_TEST', {
        publishedByEmail: 'checker.admin@dzerp.dz',
        approverEmail: 'expert.cnc@dzerp.dz',
        validatedByExpert: 'Conseil Supérieur de l\'Ordre des Experts Comptables',
      });

      expect(published.status).toBe(RegPackStatus.PUBLISHED);
      expect(published.publishedByEmail).toBe('checker.admin@dzerp.dz');
      expect(published.signatureEd25519).toBeDefined();
      expect(published.contentHash).toBeDefined();
    });
  });

  it('résout l\'état consolidé actif pour une date asOf donnée', () => {
    const state = service.resolveActiveState('2026-07-01');
    expect(state.asOf).toBe('2026-07-01');
    expect(state.getParameterDecimal('IFU_MINIMUM_GENERAL').toFixed(2)).toBe('30000.00');
    expect(state.getParameterDecimal('CASNOS_ASSIETTE_MINIMALE').toFixed(2)).toBe('288000.00');
  });
});

