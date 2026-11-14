import { describe, it, expect } from 'vitest';
import {
  DEVICES_CATALOG,
  PROTOCOL_REFERENCE_DATA,
  OPERATOR_APNS,
  DEVICE_CATEGORIES,
} from '../app/telematics/hardware/constants';
import type { DeviceItem } from '../app/telematics/hardware/types';

describe('Telematics Hardware Catalog & Protocol Reference', () => {
  it('should include all certified devices with complete specifications', () => {
    expect(DEVICES_CATALOG.length).toBeGreaterThanOrEqual(13);

    const fmc130 = DEVICES_CATALOG.find((d) => d.id === 'teltonika-fmc130');
    expect(fmc130).toBeDefined();
    expect(fmc130?.traccarPort).toBe(5027);
    expect(fmc130?.traccarProtocol).toBe('teltonika');
    expect(fmc130?.flespiSupported).toBe(true);
    expect(fmc130?.algeriaReadiness).toBe('EXCELLENT');
    expect(fmc130?.specs.voltage).toBeDefined();
    expect(fmc130?.specs.ipRating).toBeDefined();

    const fmc640 = DEVICES_CATALOG.find((d) => d.id === 'teltonika-fmc640');
    expect(fmc640).toBeDefined();
    expect(fmc640?.category).toBe('heavy');
    expect(fmc640?.canSupport).toContain('J1939');

    const hcv5 = DEVICES_CATALOG.find((d) => d.id === 'ruptela-hcv5');
    expect(hcv5).toBeDefined();
    expect(hcv5?.traccarPort).toBe(5046);
    expect(hcv5?.traccarProtocol).toBe('ruptela');

    const mobileClient = DEVICES_CATALOG.find((d) => d.id === 'traccar-client-mobile');
    expect(mobileClient).toBeDefined();
    expect(mobileClient?.traccarPort).toBe(5055);
    expect(mobileClient?.traccarProtocol).toBe('osmand');
    expect(mobileClient?.flespiSupported).toBe(false);
  });

  it('should map Algerian telecom operators to correct APNs without hardcoding in templates', () => {
    expect(OPERATOR_APNS.mobilis).toBe('internet');
    expect(OPERATOR_APNS.ooredoo).toBe('internet');
    expect(OPERATOR_APNS.djezzy).toBe('djezzy.internet');
  });

  it('should correctly format SMS/GPRS configuration commands with dynamic server and APN', () => {
    const fmc130 = DEVICES_CATALOG.find((d) => d.id === 'teltonika-fmc130')!;
    const serverHost = 'telematics.docteurflotte.dz';
    const apn = OPERATOR_APNS.djezzy;

    const command = fmc130.defaultConfigSample
      .replace(/<SERVER_IP>/g, serverHost)
      .replace(/<APN>/g, apn);

    expect(command).toContain('setparam 2001:telematics.docteurflotte.dz;2002:5027');
    expect(command).toContain('2005:djezzy.internet');
    expect(command).not.toContain('<SERVER_IP>');
    expect(command).not.toContain('<APN>');
  });

  it('should contain the full 19 protocol reference mappings matching Traccar and Flespi ports', () => {
    expect(PROTOCOL_REFERENCE_DATA.length).toBe(19);

    const teltonikaRow = PROTOCOL_REFERENCE_DATA.find((r) => r.proto === 'teltonika');
    expect(teltonikaRow).toBeDefined();
    expect(teltonikaRow?.port).toBe(5027);

    const ruptelaRow = PROTOCOL_REFERENCE_DATA.find((r) => r.proto === 'ruptela');
    expect(ruptelaRow).toBeDefined();
    expect(ruptelaRow?.port).toBe(5046);

    const concoxRow = PROTOCOL_REFERENCE_DATA.find((r) => r.proto === 'gt06');
    expect(concoxRow).toBeDefined();
    expect(concoxRow?.port).toBe(5023);

    const queclinkRow = PROTOCOL_REFERENCE_DATA.find((r) => r.proto === 'gl200');
    expect(queclinkRow).toBeDefined();
    expect(queclinkRow?.port).toBe(5004);

    const osmandRow = PROTOCOL_REFERENCE_DATA.find((r) => r.proto === 'osmand');
    expect(osmandRow).toBeDefined();
    expect(osmandRow?.port).toBe(5055);
  });

  it('should filter devices by search query across name, manufacturer, protocol, and port', () => {
    const filterFn = (devices: DeviceItem[], query: string) => {
      const q = query.toLowerCase();
      return devices.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.manufacturer.toLowerCase().includes(q) ||
          d.traccarProtocol.toLowerCase().includes(q) ||
          d.traccarPort.toString().includes(q)
      );
    };

    const searchTeltonika = filterFn(DEVICES_CATALOG, 'teltonika');
    expect(searchTeltonika.length).toBeGreaterThanOrEqual(4);

    const search5046 = filterFn(DEVICES_CATALOG, '5046');
    expect(search5046.length).toBe(1);
    expect(search5046[0].id).toBe('ruptela-hcv5');

    const searchQueclink = filterFn(DEVICES_CATALOG, 'queclink');
    expect(searchQueclink.length).toBe(1);
    expect(searchQueclink[0].id).toBe('queclink-gv58ce');
  });

  it('should filter devices by category and gateway support', () => {
    const heavyDevices = DEVICES_CATALOG.filter((d) => d.category === 'heavy');
    expect(heavyDevices.length).toBeGreaterThanOrEqual(2);
    expect(heavyDevices.every((d) => d.category === 'heavy')).toBe(true);

    const coldChainDevices = DEVICES_CATALOG.filter((d) => d.category === 'cold-chain');
    expect(coldChainDevices.length).toBeGreaterThanOrEqual(1);
    expect(coldChainDevices[0].id).toBe('meitrack-t399l');

    const flespiSupported = DEVICES_CATALOG.filter((d) => d.flespiSupported);
    expect(flespiSupported.every((d) => d.flespiSupported === true)).toBe(true);
    expect(flespiSupported.some((d) => d.id === 'traccar-client-mobile')).toBe(false);
  });

  it('should maintain category options with French labels', () => {
    expect(DEVICE_CATEGORIES.length).toBe(7);
    const heavyCat = DEVICE_CATEGORIES.find((c) => c.id === 'heavy');
    expect(heavyCat?.label).toBe('Poids Lourds / BTP');
  });
});

