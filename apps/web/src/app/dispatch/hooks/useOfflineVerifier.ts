'use client';

import { useState } from 'react';
import { FleetIntelligenceClient } from '@/lib/api-fleet-intelligence';
import { OfflineVerificationOutput } from '../types';

export function useOfflineVerifier() {
  const [verifyQrText, setVerifyQrText] = useState<string>('');
  const [verifyTokenText, setVerifyTokenText] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationOutput, setVerificationOutput] =
    useState<OfflineVerificationOutput | null>(null);

  const handleVerifyOfflineOrder = async () => {
    if (!verifyQrText) return;
    setIsVerifying(true);
    try {
      const res = await FleetIntelligenceClient.verifyMissionOrder({
        qrPayload: verifyQrText,
        signatureToken: verifyTokenText || 'DUMMY_TOKEN',
      });
      setVerificationOutput(res as OfflineVerificationOutput);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVerificationOutput({
        isValid: false,
        reason: msg || 'Erreur cryptographique lors du décodage hors-ligne',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const populateFromIssuedOrder = (qrPayload: string, token: string) => {
    setVerifyQrText(qrPayload);
    setVerifyTokenText(token);
  };

  return {
    verifyQrText,
    setVerifyQrText,
    verifyTokenText,
    setVerifyTokenText,
    isVerifying,
    verificationOutput,
    handleVerifyOfflineOrder,
    populateFromIssuedOrder,
  };
}

