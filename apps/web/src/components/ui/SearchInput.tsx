'use client';

import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  shortcutKey?: string;
}

/**
 * Champ de recherche accessible avec icône, bouton d'effacement rapide et raccourci clavier configurable.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher par immatriculation, désignation...',
  className = '',
  onClear,
  autoFocus = false,
  disabled = false,
  shortcutKey,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcutKey || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditable =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === shortcutKey && !isEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, disabled]);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={placeholder}
        className={cn(
          'w-full pl-9 pr-9 py-2 text-xs rounded-lg transition-colors',
          'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
          'text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
          'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
      {value && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcutKey && !disabled ? (
        <kbd className="absolute right-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded pointer-events-none">
          {shortcutKey}
        </kbd>
      ) : null}
    </div>
  );
};
