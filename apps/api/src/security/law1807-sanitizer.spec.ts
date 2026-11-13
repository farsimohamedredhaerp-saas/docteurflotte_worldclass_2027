import { Law1807SanitizerMiddleware } from './law1807-sanitizer.middleware';

describe('Law1807SanitizerMiddleware', () => {
  it('doit pseudonymiser de façon déterministe les noms de chauffeurs et techniciens', () => {
    const p1 = Law1807SanitizerMiddleware.pseudonymizeName('Mourad Belkacem');
    const p2 = Law1807SanitizerMiddleware.pseudonymizeName('Mourad Belkacem');

    expect(p1).toMatch(/^CHAUFFEUR-MB-[A-F0-9]{4}$/);
    expect(p1).toBe(p2); // Déterministe
  });

  it('doit masquer les numéros de téléphone mobiles algériens', () => {
    const masked = Law1807SanitizerMiddleware.maskPhone('0550123489');
    expect(masked).toBe('+213 5** ** 89');
  });

  it('doit masquer les Numéros d Identification Nationale (NIN)', () => {
    const masked = Law1807SanitizerMiddleware.maskNin('102938475610293847');
    expect(masked).toBe('NIN-***-3847');
  });

  it('doit assainir un payload complexe en masquant la PII et préservant les données techniques et d audit', () => {
    const rawPayload = {
      tenantId: 'd664e52f-1175-470a-8673-ec6b2f7d3a04',
      driverName: 'Karim Hadj',
      phoneNumber: '0661987654',
      nationalIdNin: '998877665544332211',
      cardNumber: '6280540012345678',
      vehiclePlate: '16-118-09',
      fuelVolumeLiters: 450.5,
      totalAmountDzd: 13069.0,
      metadata: {
        technicianName: 'Samir Mécanicien',
        contactPhone: '0770112233',
      },
    };

    const sanitized = Law1807SanitizerMiddleware.sanitizeData(rawPayload);

    expect(sanitized.driverName).toMatch(/^CHAUFFEUR-KH-[A-F0-9]{4}$/);
    expect(sanitized.phoneNumber).toBe('+213 5** ** 54');
    expect(sanitized.nationalIdNin).toBe('NIN-***-2211');
    expect(sanitized.cardNumber).toContain('6280-****-****-5678');
    expect(sanitized.metadata.technicianName).toMatch(/^CHAUFFEUR-SM-[A-F0-9]{4}$/);
    expect(sanitized.metadata.contactPhone).toBe('+213 5** ** 33');

    // Les données non-PII doivent rester parfaitement intactes
    expect(sanitized.tenantId).toBe('d664e52f-1175-470a-8673-ec6b2f7d3a04');
    expect(sanitized.vehiclePlate).toBe('16-118-09');
    expect(sanitized.fuelVolumeLiters).toBe(450.5);
    expect(sanitized.totalAmountDzd).toBe(13069.0);
  });
});

