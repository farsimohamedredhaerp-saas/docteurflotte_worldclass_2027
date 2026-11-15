import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  className?: string;
}

/**
 * Composant d'état vide standardisé pour listes, filtres et tableaux sans résultats.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}) => {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30',
        className
      )}
    >
      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-full text-slate-400 dark:text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

