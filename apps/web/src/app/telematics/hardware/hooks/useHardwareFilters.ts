'use client';

import { useMemo, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DEVICES_CATALOG } from '../constants';
import type { DeviceCategory, GatewayFilter, DeviceItem } from '../types';

export function useHardwareFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') as DeviceCategory) || 'all';
  const selectedGateway = (searchParams.get('gateway') as GatewayFilter) || 'all';

  const updateParam = useCallback(
    (name: string, value: string, defaultValue: string = '') => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== defaultValue) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      updateParam('q', query, '');
    },
    [updateParam]
  );

  const setSelectedCategory = useCallback(
    (category: DeviceCategory) => {
      updateParam('category', category, 'all');
    },
    [updateParam]
  );

  const setSelectedGateway = useCallback(
    (gateway: GatewayFilter) => {
      updateParam('gateway', gateway, 'all');
    },
    [updateParam]
  );

  const filteredDevices = useMemo<DeviceItem[]>(() => {
    return DEVICES_CATALOG.filter((device) => {
      const matchesSearch =
        searchQuery === '' ||
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.traccarProtocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.traccarPort.toString().includes(searchQuery);

      const matchesCategory = selectedCategory === 'all' || device.category === selectedCategory;

      const matchesGateway =
        selectedGateway === 'all' ||
        (selectedGateway === 'traccar' && device.traccarPort > 0) ||
        (selectedGateway === 'flespi' && device.flespiSupported);

      return matchesSearch && matchesCategory && matchesGateway;
    });
  }, [searchQuery, selectedCategory, selectedGateway]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGateway,
    setSelectedGateway,
    filteredDevices,
    totalDevicesCount: DEVICES_CATALOG.length,
  };
}

