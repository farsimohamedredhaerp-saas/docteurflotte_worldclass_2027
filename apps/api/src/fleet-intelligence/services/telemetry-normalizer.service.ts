import { Injectable } from '@nestjs/common';
import { CanJ1939DecoderService } from './can-j1939-decoder.service';
import {
  CanonicalTelemetryEvent,
  EngineStateEnum,
  IngestionSource,
  Mode0EventType,
  Mode0VirtualIngestionDto,
  TraccarWebhookRequestDto,
} from '../dto/telemetry-ingestion.dto';

@Injectable()
export class TelemetryNormalizerService {
  private readonly KNOTS_TO_KMH = 1.852;

  constructor(private readonly canDecoder: CanJ1939DecoderService) {}

  deriveEngineState(ignitionOn: boolean, rpm: number | null, speedKmh: number): EngineStateEnum {
    if (!ignitionOn && (rpm === null || rpm < 150)) {
      return EngineStateEnum.OFF;
    }
    if (speedKmh < 2.5 && (ignitionOn || (rpm !== null && rpm >= 400))) {
      return EngineStateEnum.IDLE;
    }
    return EngineStateEnum.ON;
  }

  /**
   * 1. Normalisation du Webhook primaire Traccar + Décodage J1939 local
   */
  fromTraccarWebhook(
    payload: TraccarWebhookRequestDto,
    tenantId: string,
    vehicleId: string,
  ): CanonicalTelemetryEvent {
    const pos = payload.position;
    const attrs = pos.attributes || {};

    const ioDecoded = this.canDecoder.enrichFromTeltonikaIo(attrs);
    let j1939Decoded: Record<string, number> = {};
    let needsFlespi = false;

    if (attrs.j1939_raw && typeof attrs.j1939_raw === 'object') {
      const res = this.canDecoder.decodeRawJ1939Frames(attrs.j1939_raw);
      j1939Decoded = res.metrics;
      needsFlespi = res.hasUnknownFrames;
    } else if (attrs.raw && !attrs.obdOdometer && Object.keys(ioDecoded).length === 0) {
      needsFlespi = true;
    }

    const speedKmh =
      ioDecoded.canSpeedKmh ?? Number(((pos.speed || 0) * this.KNOTS_TO_KMH).toFixed(2));

    let ignition = Boolean(attrs.ignition);
    const rpmRaw = j1939Decoded.engineRpm ?? ioDecoded.engineRpm ?? attrs.rpm;
    const rpm = rpmRaw !== undefined && rpmRaw !== null ? Math.round(Number(rpmRaw)) : null;
    if (rpm && rpm > 400) ignition = true;

    const engineState = this.deriveEngineState(ignition, rpm, speedKmh);

    const odomMeters = attrs.obdOdometer ?? ioDecoded.odometerMeters ?? attrs.totalDistance;
    const odometerKm =
      odomMeters !== undefined && odomMeters !== null
        ? Number((Number(odomMeters) / 1000.0).toFixed(3))
        : null;

    let hoursSec: number | null = j1939Decoded.engineHoursSec ?? null;
    if (hoursSec === null) {
      if (attrs.hours !== undefined && attrs.hours !== null) {
        hoursSec = Math.round(Number(attrs.hours) / 1000.0);
      } else if (ioDecoded.engineHoursMin !== undefined) {
        hoursSec = Math.round(ioDecoded.engineHoursMin * 60);
      }
    }

    let battMv: number | null = ioDecoded.batteryMv ?? null;
    if (battMv === null && attrs.power !== undefined) {
      battMv = Math.round(Number(attrs.power) * 1000.0);
    }

    const coolantC =
      j1939Decoded.coolantTempC ?? ioDecoded.coolantTempC ?? attrs.coolantTemp ?? null;
    const fuelPct = j1939Decoded.fuelLevelPct ?? ioDecoded.fuelLevelPct ?? attrs.fuel ?? null;
    const fuelUsedL =
      j1939Decoded.fuelUsedTotalL ?? ioDecoded.fuelUsedL ?? attrs.fuelUsed ?? null;

    const alarm = String(attrs.alarm || '').toLowerCase();
    const harshMap: Record<string, string> = {
      hardbraking: 'HARSH_BRAKE',
      hardacceleration: 'HARSH_ACCEL',
      hardcornering: 'HARSH_TURN',
      accident: 'CRASH',
    };

    const dtcs: string[] = Array.isArray(attrs.dtcs)
      ? attrs.dtcs.map(String)
      : typeof attrs.dtcs === 'string' && attrs.dtcs.length > 0
        ? attrs.dtcs.split(',')
        : [];

    const extraIot: Record<string, any> = {};
    for (const k of ['bleTemp1C', 'bleTemp2C', 'fuelLevelLiters']) {
      if (ioDecoded[k] !== undefined) extraIot[k] = ioDecoded[k];
    }

    return {
      time: new Date(pos.fixTime).toISOString(),
      tenantId,
      vehicleId,
      deviceImei: payload.device.uniqueId,
      sourceProvider: IngestionSource.TRACCAR,
      latitude: pos.latitude,
      longitude: pos.longitude,
      altitudeM: pos.altitude ?? 0,
      speedKmh,
      headingDeg: pos.course ?? 0,
      ignitionOn: ignition,
      engineState,
      odometerKm,
      engineHoursSec: hoursSec,
      engineRpm: rpm,
      engineLoadPct:
        j1939Decoded.engineLoadPct ?? (attrs.engineLoad !== undefined ? Number(attrs.engineLoad) : null),
      coolantTempC: coolantC !== null ? Number(coolantC) : null,
      ambientTempC: attrs.ambientTemp !== undefined ? Number(attrs.ambientTemp) : null,
      batteryMv: battMv,
      fuelLevelPct: fuelPct !== null ? Number(fuelPct) : null,
      fuelUsedTotalL: fuelUsedL !== null ? Number(fuelUsedL) : null,
      defLevelPct: attrs.adBlue !== undefined ? Number(attrs.adBlue) : null,
      oilPressureKpa: j1939Decoded.oilPressureKpa ?? ioDecoded.oilPressureKpa ?? attrs.oilPressure ?? null,
      fuelRateLPerHour: j1939Decoded.fuelRateLPerHour ?? ioDecoded.fuelRateLPerHour ?? attrs.fuelRate ?? null,
      retarderTorquePct: j1939Decoded.retarderTorquePct ?? ioDecoded.retarderTorquePct ?? null,
      axleWeightKg: j1939Decoded.axleWeightKg ?? null,
      ptoEngaged: Boolean(attrs.pto || attrs.in1),
      harshEvent: harshMap[alarm] ?? null,
      dtcCodes: dtcs,
      extraIotSensors: extraIot,
      needsFlespiFailover: needsFlespi,
    };
  }

  /**
   * 2. Normalisation du Failover Stateless Flespi (Conforme Loi Algérienne 18-07)
   */
  fromFlespiMessage(
    msg: Record<string, any>,
    tenantId: string,
    vehicleId: string,
  ): CanonicalTelemetryEvent {
    const tsUnix = msg.timestamp ?? Date.now() / 1000;
    const eventTime = new Date(Number(tsUnix) * 1000).toISOString();

    const imei = String(msg.ident || 'UNKNOWN_IMEI');
    const speedKmh = Number(msg['position.speed'] ?? 0);
    const ignition = Boolean(msg['engine.ignition.status']);
    const rpmVal = msg['can.engine.rpm'] ?? msg['engine.rpm'];
    const rpm = rpmVal !== undefined && rpmVal !== null ? Math.round(Number(rpmVal)) : null;

    const engineState = this.deriveEngineState(ignition, rpm, speedKmh);

    const mileageKm = msg['can.vehicle.mileage'] ?? msg['vehicle.mileage'];
    const motorhoursH = msg['can.engine.motorhours'] ?? msg['engine.motorhours'];
    const engineHoursSec =
      motorhoursH !== undefined && motorhoursH !== null
        ? Math.round(Number(motorhoursH) * 3600)
        : null;

    const extVoltageV = msg['external.powersource.voltage'];
    const batteryMv =
      extVoltageV !== undefined && extVoltageV !== null
        ? Math.round(Number(extVoltageV) * 1000)
        : null;

    const extraIot: Record<string, any> = {};
    for (const [k, v] of Object.entries(msg)) {
      if (k.startsWith('ble.sensor.') || k.startsWith('refrigerator.')) {
        extraIot[k] = v;
      }
    }

    return {
      time: eventTime,
      tenantId,
      vehicleId,
      deviceImei: imei,
      sourceProvider: IngestionSource.FLESPI,
      latitude: Number(msg['position.latitude'] ?? 0),
      longitude: Number(msg['position.longitude'] ?? 0),
      altitudeM: Number(msg['position.altitude'] ?? 0),
      speedKmh,
      headingDeg: Number(msg['position.direction'] ?? 0),
      ignitionOn: ignition,
      engineState,
      odometerKm: mileageKm !== undefined ? Number(mileageKm) : null,
      engineHoursSec,
      engineRpm: rpm,
      engineLoadPct:
        msg['can.engine.load'] !== undefined ? Number(msg['can.engine.load']) : null,
      coolantTempC:
        msg['can.engine.coolant.temperature'] !== undefined
          ? Number(msg['can.engine.coolant.temperature'])
          : null,
      ambientTempC:
        msg['can.ambient.air.temperature'] !== undefined
          ? Number(msg['can.ambient.air.temperature'])
          : null,
      batteryMv,
      fuelLevelPct: msg['can.fuel.level'] !== undefined ? Number(msg['can.fuel.level']) : null,
      fuelUsedTotalL:
        msg['can.fuel.consumed'] !== undefined ? Number(msg['can.fuel.consumed']) : null,
      defLevelPct: msg['can.adblue.level'] !== undefined ? Number(msg['can.adblue.level']) : null,
      oilPressureKpa: msg['can.engine.oil.pressure'] !== undefined ? Number(msg['can.engine.oil.pressure']) : null,
      fuelRateLPerHour: msg['can.fuel.rate'] !== undefined ? Number(msg['can.fuel.rate']) : null,
      retarderTorquePct: msg['can.retarder.torque'] !== undefined ? Number(msg['can.retarder.torque']) : null,
      ptoEngaged: Boolean(msg['can.pto.status'] || msg['din.1']),
      harshEvent: null,
      dtcCodes: Array.isArray(msg['can.dtc']) ? msg['can.dtc'].map(String) : [],
      extraIotSensors: extraIot,
      needsFlespiFailover: false,
    };
  }

  /**
   * 3. Synthétiseur Cinématique Mode 0 (Sans Boîtier : Ticket Naftal, DVIR Mobile, Mission Valhalla)
   */
  fromMode0VirtualEvent(req: Mode0VirtualIngestionDto): CanonicalTelemetryEvent {
    let newOdomKm = req.currentDbOdometerKm;
    let newHours = req.currentDbEngineHours;
    let fuelPct: number | null = null;

    if (req.eventType === Mode0EventType.NAFTAL_FUEL_TICKET && req.naftalLitersFilled) {
      const severityCorr = 2.0 - (req.climateSeverityAlpha ?? 0.75);
      const deltaKm =
        (req.naftalLitersFilled * 100.0) / ((req.refConsumptionL100Km ?? 34.0) * severityCorr);
      const deltaHours = deltaKm / 42.0;
      newOdomKm = req.reportedOdometerKm ?? req.currentDbOdometerKm + deltaKm;
      newHours = req.currentDbEngineHours + deltaHours;
      fuelPct = 100.0;
    } else if (req.eventType === Mode0EventType.VALHALLA_MISSION_COMPLETED) {
      const deltaKm = req.missionDistanceKm ?? 0;
      const deltaHours = req.missionDurationHours ?? deltaKm / 45.0;
      newOdomKm = req.currentDbOdometerKm + deltaKm;
      newHours = req.currentDbEngineHours + deltaHours;
    } else if (req.eventType === Mode0EventType.MOBILE_DVIR_ODOMETER) {
      if (req.reportedOdometerKm) {
        newOdomKm = Math.max(req.currentDbOdometerKm, req.reportedOdometerKm);
      }
      if (req.reportedEngineHours) {
        newHours = Math.max(req.currentDbEngineHours, req.reportedEngineHours);
      }
    }

    return {
      time: req.recordedAt ?? new Date().toISOString(),
      tenantId: req.tenantId,
      vehicleId: req.vehicleId,
      deviceImei: `VIRTUAL-MODE0-${req.vehicleId.slice(0, 8)}`,
      sourceProvider: IngestionSource.VIRTUAL_MODE_0,
      latitude: req.latitude ?? 36.7525,
      longitude: req.longitude ?? 3.042,
      altitudeM: 0,
      speedKmh: 0,
      headingDeg: 0,
      ignitionOn: false,
      engineState: EngineStateEnum.OFF,
      odometerKm: Number(newOdomKm.toFixed(2)),
      engineHoursSec: Math.round(newHours * 3600),
      engineRpm: null,
      engineLoadPct: null,
      coolantTempC: null,
      ambientTempC: null,
      batteryMv: null,
      fuelLevelPct: fuelPct,
      fuelUsedTotalL: null,
      defLevelPct: null,
      ptoEngaged: false,
      harshEvent: null,
      dtcCodes: [],
      extraIotSensors: { mode0Trigger: req.eventType },
      needsFlespiFailover: false,
    };
  }
}
