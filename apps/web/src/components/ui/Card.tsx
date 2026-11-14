import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'subtle' | 'warning' | 'danger';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
  elevated: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md',
  glass: 'df-glass border border-slate-200 dark:border-slate-800/80',
  subtle: 'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60',
  warning: 'bg-amber-500/5 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60',
  danger: 'bg-rose-500/5 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/60',
};

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

/**
 * Composant de carte Bento standardisé pour tous les cockpits opérationnels.
 */
export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        variantStyles[variant],
        paddingStyles[padding],
        interactive && 'hover:border-blue-500/50 hover:shadow-md cursor-pointer active:scale-[0.995]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-3', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3 className={cn('text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={cn('text-xs text-slate-600 dark:text-slate-400', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={cn('flex items-center pt-3 border-t border-slate-100 dark:border-slate-800/80', className)} {...props}>
      {children}
    </div>
  );
};

