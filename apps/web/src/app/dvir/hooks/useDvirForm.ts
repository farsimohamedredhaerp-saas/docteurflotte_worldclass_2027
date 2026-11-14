'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DVIRChecklistItem,
  DVIRInspectionType,
  DVIRItemStatus,
  VehicleProfile,
  DvirLanguage,
} from '../types';
import { INITIAL_CHECKLIST } from '../lib/dvirConstants';
import { hasCriticalFailure, countChecklistDefects } from '../lib/dvirSelectors';

export function useDvirForm(vehicles: VehicleProfile[]) {
  const [language, setLanguage] = useState<DvirLanguage>('fr');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [inspectionType, setInspectionType] = useState<DVIRInspectionType>(
    DVIRInspectionType.PRE_TRIP
  );
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [checklist, setChecklist] = useState<DVIRChecklistItem[]>(INITIAL_CHECKLIST);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedAssetId) || null;
  }, [vehicles, selectedAssetId]);

  const selectVehicle = useCallback(
    (assetId: string) => {
      setSelectedAssetId(assetId);
      const v = vehicles.find((item) => item.id === assetId);
      if (v) {
        setDriverName(v.driverName);
        setOdometerKm(v.odometerKm);
      }
    },
    [vehicles]
  );

  const updateItemStatus = useCallback((code: string, status: DVIRItemStatus) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, status } : item))
    );
  }, []);

  const updateItemComment = useCallback((code: string, comment: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, comment } : item))
    );
  }, []);

  const updateItemPhoto = useCallback((code: string, photoUrl: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, photoUrl } : item))
    );
  }, []);

  const resetForm = useCallback(() => {
    setChecklist(INITIAL_CHECKLIST);
    setGeneralNotes('');
    setSignatureDataUrl(null);
  }, []);

  const hasCritical = useMemo(() => hasCriticalFailure(checklist), [checklist]);
  const defectCounts = useMemo(() => countChecklistDefects(checklist), [checklist]);

  return {
    language,
    setLanguage,
    selectedAssetId,
    selectVehicle,
    selectedVehicle,
    driverName,
    setDriverName,
    inspectionType,
    setInspectionType,
    odometerKm,
    setOdometerKm,
    checklist,
    updateItemStatus,
    updateItemComment,
    updateItemPhoto,
    generalNotes,
    setGeneralNotes,
    signatureDataUrl,
    setSignatureDataUrl,
    resetForm,
    hasCritical,
    defectCounts,
  };
}
