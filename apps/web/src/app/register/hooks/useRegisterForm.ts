'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityPack } from '@docteurflotte/contracts';
import { AuthClient } from '@/lib/api-auth';
import { RegisterFormData, UseRegisterFormReturn } from '../types';

export function useRegisterForm(): UseRegisterFormReturn {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>({
    companyName: '',
    wilayaCode: 16, // Alger par défaut
    taxNif: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    activityPack: ActivityPack.TRANSPORT,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback((field: keyof RegisterFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validation de confirmation du mot de passe
      if (formData.adminPassword !== formData.confirmPassword) {
        setError('Les mots de passe saisis ne sont pas identiques.');
        return;
      }

      if (formData.adminPassword.length < 8) {
        setError('Le mot de passe doit comporter au minimum 8 caractères.');
        return;
      }

      setIsLoading(true);

      try {
        const response = await AuthClient.registerTenant({
          companyName: formData.companyName.trim(),
          adminFirstName: formData.adminFirstName.trim(),
          adminLastName: formData.adminLastName.trim(),
          adminEmail: formData.adminEmail.trim().toLowerCase(),
          adminPassword: formData.adminPassword,
          activityPack: formData.activityPack,
        });

        AuthClient.saveSession(response);

        if (typeof window !== 'undefined') {
          localStorage.setItem('df_demo_mode_active', 'false');
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('auth:session-changed'));
        }

        // Redirection vers le setup guidé
        router.push('/setup');
      } catch (err: unknown) {
        let msg = 'Échec de la création du compte.';
        if (err instanceof Error) {
          if (
            err.message.includes('Failed to fetch') ||
            err.message.includes('NetworkError') ||
            err.message.includes('fetch failed')
          ) {
            msg =
              'Serveur local indisponible (port 3001). Veuillez démarrer l’API NestJS ou explorer en mode démo.';
          } else {
            msg = err.message;
          }
        }
        setError(msg);
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
    handleSubmit,
  };
}

