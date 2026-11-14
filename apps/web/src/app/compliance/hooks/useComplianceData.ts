'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { EnactaRecord, InsuranceRecord } from '../types';

export function useComplianceData() {
  const { isDemoMode } = useDemoMode();
  const [enactaList, setEnactaList] = useState<EnactaRecord[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isDemoMode) {
      import('@/lib/simulation-sandbox')
        .then((sandbox) => {
          setEnactaList(sandbox.MOCK_SANDBOX_ENACTA);
          setInsuranceList(sandbox.MOCK_SANDBOX_INSURANCE);
        })
        .finally(() => setLoading(false));
    } else {
      setEnactaList([]);
      setInsuranceList([]);
      setLoading(false);
    }
  }, [isDemoMode]);

  const saveEnacta = useCallback(
    (formData: Partial<EnactaRecord>, editingId?: string) => {
      if (editingId) {
        setEnactaList((prev) =>
          prev.map((item) =>
            item.id === editingId ? ({ ...item, ...formData } as EnactaRecord) : item,
          ),
        );
        showNotification(`Contrôle ENACTA mis à jour pour ${formData.registrationNumber}`);
      } else {
        const newRec: EnactaRecord = {
          id: `EN-${Date.now().toString().slice(-4)}`,
          registrationNumber: formData.registrationNumber || '',
          makeModel: formData.makeModel || 'Véhicule Flotte',
          category: formData.category || 'PL',
          lastInspectionDate: formData.lastInspectionDate || new Date().toISOString().split('T')[0],
          expiryDate: formData.expiryDate || '',
          daysRemaining: 180,
          centerName: formData.centerName || 'Centre Agréé ENACTA',
          wilaya: formData.wilaya || 'Alger (16)',
          status: formData.status || 'VALID',
          defectCount: 0,
        };
        setEnactaList((prev) => [newRec, ...prev]);
        showNotification(`Nouveau contrôle ENACTA consigné pour ${newRec.registrationNumber}`);
      }
    },
    [showNotification],
  );

  const deleteEnacta = useCallback(
    (id: string, plate: string) => {
      setEnactaList((prev) => prev.filter((i) => i.id !== id));
      showNotification(`Contrôle ENACTA supprimé pour ${plate}`);
    },
    [showNotification],
  );

  const saveInsurance = useCallback(
    (formData: Partial<InsuranceRecord>, editingId?: string) => {
      if (editingId) {
        setInsuranceList((prev) =>
          prev.map((item) =>
            item.id === editingId ? ({ ...item, ...formData } as InsuranceRecord) : item,
          ),
        );
        showNotification(`Police d'assurance mise à jour pour ${formData.registrationNumber}`);
      } else {
        const newIns: InsuranceRecord = {
          id: `INS-${Date.now().toString().slice(-4)}`,
          registrationNumber: formData.registrationNumber || '',
          makeModel: formData.makeModel || 'Véhicule Flotte',
          insurer: formData.insurer || 'CAAT',
          policyNumber: formData.policyNumber || '',
          expiryDate: formData.expiryDate || '',
          daysRemaining: 365,
          coverageType: formData.coverageType || 'TOUS_RISQUES',
          status: formData.status || 'VALID',
        };
        setInsuranceList((prev) => [newIns, ...prev]);
        showNotification(`Nouvelle police d'assurance consignée pour ${newIns.registrationNumber}`);
      }
    },
    [showNotification],
  );

  const deleteInsurance = useCallback(
    (id: string, plate: string) => {
      setInsuranceList((prev) => prev.filter((i) => i.id !== id));
      showNotification(`Police d'assurance supprimée pour ${plate}`);
    },
    [showNotification],
  );

  return {
    enactaList,
    insuranceList,
    loading,
    notification,
    saveEnacta,
    deleteEnacta,
    saveInsurance,
    deleteInsurance,
  };
}

