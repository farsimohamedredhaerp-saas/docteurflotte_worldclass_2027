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
        // Mission-Critical Command Center Industrial Slate Palette
        slate: {
          canvas: '#090A0C',
          panel: '#111317',
          surface: '#111317',
          hover: '#181B20',
          active: '#181B20',
        },
        border: {
          hairline: '#23272F',
          focus: '#343A46',
        },
        primary: {
          text: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        // Couleurs Sémantiques Normées
        cobalt: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: 'rgba(37, 99, 235, 0.14)',
        },
        telemetry: {
          nominal: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          offline: '#64748B',
        },
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '2px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        none: 'none',
        crisp: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
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
