'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface NotificationState {
  message: string;
  type: NotificationType;
  title?: string;
}

export interface UseNotificationReturn {
  notification: NotificationState | null;
  notify: (message: string, type?: NotificationType, title?: string, durationMs?: number) => void;
  notifySuccess: (message: string, title?: string) => void;
  notifyWarning: (message: string, title?: string) => void;
  notifyError: (message: string, title?: string) => void;
  notifyInfo: (message: string, title?: string) => void;
  clearNotification: () => void;
}

/**
 * Hook unifié de notifications utilisateur avec nettoyage automatique de timer et démontage sécurisé.
 */
export function useNotification(defaultDurationMs: number = 4000): UseNotificationReturn {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
  }, []);

  const notify = useCallback(
    (message: string, type: NotificationType = 'info', title?: string, durationMs: number = defaultDurationMs) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setNotification({ message, type, title });
      if (durationMs > 0) {
        timerRef.current = setTimeout(() => {
          setNotification(null);
          timerRef.current = null;
        }, durationMs);
      }
    },
    [defaultDurationMs]
  );

  const notifySuccess = useCallback(
    (message: string, title?: string) => notify(message, 'success', title),
    [notify]
  );

  const notifyWarning = useCallback(
    (message: string, title?: string) => notify(message, 'warning', title),
    [notify]
  );

  const notifyError = useCallback(
    (message: string, title?: string) => notify(message, 'error', title),
    [notify]
  );

  const notifyInfo = useCallback(
    (message: string, title?: string) => notify(message, 'info', title),
    [notify]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useMemo(
    () => ({
      notification,
      notify,
      notifySuccess,
      notifyWarning,
      notifyError,
      notifyInfo,
      clearNotification,
    }),
    [
      notification,
      notify,
      notifySuccess,
      notifyWarning,
      notifyError,
      notifyInfo,
      clearNotification,
    ]
  );
}

