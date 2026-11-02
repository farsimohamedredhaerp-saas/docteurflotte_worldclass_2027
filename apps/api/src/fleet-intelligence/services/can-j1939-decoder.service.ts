import { Injectable } from '@nestjs/common';

@Injectable()
export class CanJ1939DecoderService {
  // Mapping des identifiants AVL IO Teltonika (FMB140, FMC650, FMB920)
  private readonly TELTONIKA_AVL_IO_MAP: Record<string, [string, number]> = {
    io66: ['batteryMv', 1.0],
    io67: ['internalBattMv', 1.0],
    io81: ['canSpeedKmh', 1.0],
    io82: ['oilPressureKpa', 1.0],
    io84: ['fuelLevelLiters', 0.1],
    io85: ['engineRpm', 1.0],
    io87: ['odometerMeters', 1.0],
    io89: ['fuelLevelPct', 1.0],
    io102: ['engineHoursMin', 1.0],
    io107: ['fuelUsedL', 0.1],
    io115: ['coolantTempC', 0.1],
    io183: ['fuelRateLPerHour', 0.1],
    io520: ['retarderTorquePct', 1.0],
    io25: ['bleTemp1C', 0.01], // Sonde BLE Frigo 1
    io26: ['bleTemp2C', 0.01], // Sonde BLE Frigo 2
  };

  enrichFromTeltonikaIo(attributes: Record<string, unknown>): Record<string, number> {
    const decoded: Record<string, number> = {};
    for (const [ioKey, [metricName, scale]] of Object.entries(this.TELTONIKA_AVL_IO_MAP)) {
      if (attributes[ioKey] !== undefined && attributes[ioKey] !== null) {
        const num = Number(attributes[ioKey]);
        if (!Number.isNaN(num)) {
          decoded[metricName] = Number((num * scale).toFixed(3));
        }
      }
    }
    return decoded;
  }

  /**
   * Décode nativement via Buffer Node.js les trames hexadécimales SAE J1939 Poids Lourds
   * Décodage haute vitesse conforme AGENTS.md v3.0 (EPIC 2)
   */
  decodeRawJ1939Frames(rawHexFrames: Record<string, string>): {
    metrics: Record<string, number>;
    hasUnknownFrames: boolean;
  } {
    const metrics: Record<string, number> = {};
    let hasUnknownFrames = false;

    for (const [canIdStr, hexData] of Object.entries(rawHexFrames)) {
      try {
        const canId = parseInt(canIdStr, 16);
        const pf = (canId >> 16) & 0xff;
        const ps = (canId >> 8) & 0xff;
        const pgn = (pf << 8) + (pf >= 240 ? ps : 0);

        const cleanHex = hexData.replace(/\s+/g, '');
        const buf = Buffer.from(cleanHex, 'hex');
        if (buf.length < 8) continue;

        // PGN 61444 (0xF004) - EEC1 : Engine RPM (Bytes 4-5 LE) & Engine Load (Byte 3)
        if (pgn === 61444) {
          const rawRpm = buf.readUInt16LE(3);
          if (rawRpm !== 0xffff) metrics.engineRpm = Math.round(rawRpm * 0.125);
          if (buf[2] !== 0xff) metrics.engineLoadPct = buf[2] - 125;
        }
        // PGN 65262 (0xFEEE) - ET1 : Coolant Temperature (Byte 1)
        else if (pgn === 65262) {
          if (buf[0] !== 0xff) metrics.coolantTempC = buf[0] - 40;
        }
        // PGN 65276 (0xFEFC) - Dash Display : Fuel Level % (Byte 2)
        else if (pgn === 65276) {
          if (buf[1] !== 0xff) metrics.fuelLevelPct = Number((buf[1] * 0.4).toFixed(1));
        }
        // PGN 65253 (0xFEE5) - Engine Hours (Bytes 1-4 LE)
        else if (pgn === 65253) {
          const rawHours = buf.readUInt32LE(0);
          if (rawHours !== 0xffffffff) metrics.engineHoursSec = Math.round(rawHours * 0.05 * 3600);
        }
        // PGN 65257 (0xFEE9) - Total Fuel Used (Bytes 5-8 LE)
        else if (pgn === 65257) {
          const rawFuel = buf.readUInt32LE(4);
          if (rawFuel !== 0xffffffff) metrics.fuelUsedTotalL = Number((rawFuel * 0.5).toFixed(2));
        }
        // PGN 65263 (0xFEEF) - Engine Fluid Level/Pressure (EFL_P) : Oil Pressure (Byte 4)
        else if (pgn === 65263) {
          const rawOil = buf[3]; // Byte 4 (0-indexed: 3)
          if (rawOil !== 0xff) metrics.oilPressureKpa = Number((rawOil * 4.0).toFixed(1));
        }
        // PGN 65266 (0xFEF2) - Fuel Economy (LFE) : Fuel Rate L/h (Bytes 1-2 LE)
        else if (pgn === 65266) {
          const rawRate = buf.readUInt16LE(0);
          if (rawRate !== 0xffff) metrics.fuelRateLPerHour = Number((rawRate * 0.05).toFixed(2));
        }
        // PGN 61440 (0xF000) - Electronic Retarder Controller 1 (ERC1) : Retarder Torque % (Byte 2)
        else if (pgn === 61440) {
          const rawRetarder = buf[1];
          if (rawRetarder !== 0xff) metrics.retarderTorquePct = rawRetarder - 125;
        }
        // PGN 65258 (0xFEEA) - Axle Weight (Bytes 3-4 LE)
        else if (pgn === 65258) {
          const rawAxleWeight = buf.readUInt16LE(2);
          if (rawAxleWeight !== 0xffff) metrics.axleWeightKg = Number((rawAxleWeight * 0.5).toFixed(1));
        } else {
          hasUnknownFrames = true;
        }
      } catch {
        hasUnknownFrames = true;
      }
    }

    return { metrics, hasUnknownFrames };
  }
}
