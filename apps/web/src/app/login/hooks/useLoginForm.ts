'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClient } from '@/lib/api-auth';
import { LoginFormData, UseLoginFormReturn } from '../types';

export function useLoginForm(): UseLoginFormReturn {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    tenantSlug: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState(false);

  const setField = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (
        field === 'email' &&
        typeof value === 'string' &&
        value.trim() !== 'admin@farsi.dz' &&
        prev.tenantSlug === 'entreprise-bth'
      ) {
        next.tenantSlug = '';
      }
      return next;
    });
    setError(null);
    setIsOfflineError(false);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleQuickFillAdmin = useCallback(() => {
    // Raccourci réservé au développement local : le bloc est supprimé du bundle de production
    // (Next.js remplace process.env.NODE_ENV au build), aucun identifiant n'est embarqué.
    if (process.env.NODE_ENV !== 'production') {
      setFormData({
        email: 'admin@farsi.dz',
        password: 'Admin@2027!',
        tenantSlug: 'entreprise-bth',
        rememberMe: true,
      });
      setError(null);
      setIsOfflineError(false);
    }
  }, []);

  const handleEnterDemoMode = useCallback(() => {
    // Mode démo : actif en développement, ou en production uniquement si NEXT_PUBLIC_ENABLE_DEMO_MODE=true.
    const demoEnabled =
      process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';
    if (!demoEnabled) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('df_demo_mode_active', 'true');
    }
    router.push('/');
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsOfflineError(false);
      setIsLoading(true);

      try {
        const response = await AuthClient.login({
          email: formData.email.trim(),
          password: formData.password,
          tenantSlug: formData.tenantSlug.trim() || undefined,
        });

        AuthClient.saveSession(response);

        if (!response.tenant?.isSetupCompleted) {
          router.push('/setup');
        } else {
          router.push('/');
        }
      } catch (err: unknown) {
        let msg = 'Identifiants invalides.';
        let offline = false;
        if (err instanceof Error) {
          if (
            err.message.includes('Failed to fetch') ||
            err.message.includes('NetworkError') ||
            err.message.includes('fetch failed')
          ) {
            msg =
              'Le serveur d’API local (port 3001) est temporairement injoignable. Vous pouvez explorer la plateforme en mode démo interactive sans attendre.';
            offline = true;
          } else {
            msg = err.message;
          }
        }
        setError(msg);
        setIsOfflineError(offline);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, router]
  );

  return {
    formData,
    setField,
    showPassword,
    toggleShowPassword,
    isLoading,
    error,
    isOfflineError,
    handleSubmit,
    handleQuickFillAdmin,
    handleEnterDemoMode,
  };
}

