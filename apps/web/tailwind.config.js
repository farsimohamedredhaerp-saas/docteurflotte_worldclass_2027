/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design Operating System v5.1 — Tokens Sémantiques Officiels
        canvas: 'var(--df-bg-base)',
        surface: {
          DEFAULT: 'var(--df-bg-surface1)',
          1: 'var(--df-bg-surface1)',
          2: 'var(--df-bg-surface2)',
          3: 'var(--df-bg-surface3)',
        },
        border: {
          hairline: 'var(--df-border-hairline)',
          subtle: 'var(--df-border-subtle)',
          medium: 'var(--df-border-medium)',
          highlight: 'var(--df-border-highlight)',
          focus: 'var(--df-border-highlight)',
        },
        foreground: {
          primary: 'var(--df-text-primary)',
          secondary: 'var(--df-text-secondary)',
          muted: 'var(--df-text-muted)',
          faint: 'var(--df-text-faint)',
          onBrand: 'var(--df-text-on-brand)',
        },
        brand: {
          primary: 'var(--df-brand-primary)',
          'primary-hover': 'var(--df-brand-primary-hover)',
          glow: 'var(--df-brand-glow)',
        },
        telemetry: {
          nominal: 'var(--df-status-nominal)',
          warning: 'var(--df-status-warning)',
          critical: 'var(--df-status-critical)',
          offline: 'var(--df-status-neutral)',
          cyan: 'var(--df-telemetry-cyan)',
          'cyan-subtle': 'var(--df-telemetry-cyan-subtle)',
        },
        status: {
          nominal: 'var(--df-status-nominal)',
          'nominal-bg': 'var(--df-status-nominal-bg)',
          warning: 'var(--df-status-warning)',
          'warning-bg': 'var(--df-status-warning-bg)',
          critical: 'var(--df-status-critical)',
          'critical-bg': 'var(--df-status-critical-bg)',
          neutral: 'var(--df-status-neutral)',
          'neutral-bg': 'var(--df-status-neutral-bg)',
        },

        // Mission-Critical Command Center Industrial Slate Palette (compatibilité)
        slate: {
          canvas: 'var(--df-bg-base)',
          panel: 'var(--df-bg-surface1)',
          surface: 'var(--df-bg-surface1)',
          hover: 'var(--df-bg-surface2)',
          active: 'var(--df-bg-surface3)',
        },
        primary: {
          text: 'var(--df-text-primary)',
          secondary: 'var(--df-text-secondary)',
          muted: 'var(--df-text-muted)',
        },
        cobalt: {
          DEFAULT: 'var(--df-brand-primary)',
          hover: 'var(--df-brand-primary-hover)',
          subtle: 'var(--df-brand-glow)',
        },
      },
      borderRadius: {
        none: '0',
        xs: 'var(--df-radius-xs, 4px)',
        sm: 'var(--df-radius-sm, 6px)',
        DEFAULT: 'var(--df-radius-md, 8px)',
        md: 'var(--df-radius-md, 8px)',
        lg: 'var(--df-radius-lg, 10px)',
        xl: 'var(--df-radius-xl, 14px)',
        full: 'var(--df-radius-full, 9999px)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        arabic: ['Noto Sans Arabic', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
        crisp: 'var(--df-shadow-card)',
        card: 'var(--df-shadow-card)',
        dropdown: 'var(--df-shadow-dropdown)',
        modal: 'var(--df-shadow-modal)',
        focus: 'var(--df-shadow-focus)',
      },
      transitionDuration: {
        fast: 'var(--df-dur-fast, 120ms)',
        base: 'var(--df-dur-base, 200ms)',
        slow: 'var(--df-dur-slow, 320ms)',
        xslow: 'var(--df-dur-xslow, 480ms)',
      },
      transitionTimingFunction: {
        'out-quint': 'var(--df-ease-out-quint, cubic-bezier(0.22, 1, 0.36, 1))',
        'in-out': 'var(--df-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1))',
        spring: 'var(--df-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))',
      },
      height: {
        header: '48px',
      },
      width: {
        sidebar: '240px',
        'sidebar-collapsed': '48px',
      },
    },
  },
  plugins: [],
};
