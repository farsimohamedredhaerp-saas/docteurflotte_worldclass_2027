'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { NotificationState, NotificationType } from '@/lib/hooks/useNotification';
import { feedbackContainerStyles, feedbackIconStyles } from '@/lib/utils/feedbackStyles';
import { cn } from '@/lib/utils/cn';

export interface NotificationBannerProps {
  notification: NotificationState | null;
  onClose?: () => void;
  className?: string;
}

const icons: Record<NotificationType, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

/**
 * Bannière de notification accessible (role="status", aria-live="polite")
 * pour le retour d'information immédiat des actions asynchrones de l'utilisateur.
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onClose,
  className = '',
}) => {
  if (!notification) return null;

  const IconComponent = icons[notification.type] || Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs shadow-sm transition-all animate-in fade-in-50',
        feedbackContainerStyles(notification.type),
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <IconComponent className={cn('w-4 h-4 flex-shrink-0', feedbackIconStyles(notification.type))} />
        <div className="truncate">
          {notification.title && (
            <span className="font-semibold mr-1.5">{notification.title} —</span>
          )}
          <span>{notification.message}</span>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la notification"
          className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

