'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '../../lib/utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  impactDzd?: number | string;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-950/50',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  },
};

/**
 * Boîte de dialogue de confirmation d'action critique (suppression, verrouillage, annulation).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  impactDzd,
}) => {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="sm"
      showCloseButton={!isLoading}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-2.5 rounded-full flex-shrink-0', config.iconBg)}>
          <IconComponent className={cn('w-5 h-5', config.iconColor)} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
          {impactDzd !== undefined && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Aperçu d&apos;impact financier (Principe P3)
              </div>
              <div className="text-sm font-bold font-mono tabular-nums mt-0.5 text-amber-900 dark:text-amber-100">
                {typeof impactDzd === 'number' ? impactDzd.toLocaleString('fr-DZ') : impactDzd}{' '}
                <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">DZD</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50',
            config.buttonClass
          )}
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

