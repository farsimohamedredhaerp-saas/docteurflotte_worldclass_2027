'use client';

import { useState, useCallback } from 'react';
import { OPERATOR_APNS } from '../constants';
import type { DeviceItem, TelecomOperator } from '../types';

export function useConfigGenerator() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<TelecomOperator>('mobilis');
  const [serverHost, setServerHost] = useState('telematics.docteurflotte.dz');
  const [copied, setCopied] = useState(false);

  const generateConfigCommand = useCallback(
    (device: DeviceItem): string => {
      const apn = OPERATOR_APNS[selectedOperator] || 'internet';
      return device.defaultConfigSample
        .replace(/<SERVER_IP>/g, serverHost)
        .replace(/<APN>/g, apn);
    },
    [selectedOperator, serverHost]
  );

  const copyCommand = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    selectedDevice,
    setSelectedDevice,
    selectedOperator,
    setSelectedOperator,
    serverHost,
    setServerHost,
    copied,
    generateConfigCommand,
    copyCommand,
  };
}

