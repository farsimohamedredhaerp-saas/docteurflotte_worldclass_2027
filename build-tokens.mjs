#!/usr/bin/env node
/**
 * DocteurFlotte Design Tokens Builder
 * Génère tokens.css, tailwind.config.ts et tokens.ts depuis tokens.json.
 *
 * Usage : node build-tokens.mjs
 * Aucune dépendance externe — Node 18+ requis.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const tokensPath = resolve(root, 'tokens.json');
const schemaPath = resolve(root, 'tokens.schema.json');

// ---------- Utils ----------
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const log = (...a) => console.log('[tokens]', ...a);

// ---------- Load tokens ----------
let tokens;
try {
  tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  log(`✓ tokens.json chargé (v${tokens.version})`);
} catch (e) {
  console.error(`✗ Impossible de lire tokens.json : ${e.message}`);
  process.exit(1);
}

// ---------- Validate meta + required roots ----------
const P = `--${tokens.meta?.prefix ?? 'df'}`;
const outDir = resolve(root, tokens.meta?.outputDir ?? './dist/tokens');
const targets = tokens.meta?.targets ?? ['css', 'tailwind', 'ts'];
const defaultTheme = tokens.meta?.defaultTheme === 'dark' ? 'dark' : 'light';

for (const req of ['primitives', 'semantic', 'chart']) {
  if (!tokens[req]) {
    console.error(`✗ Section manquante : ${req}`);
    process.exit(1);
  }
}
if (!tokens.semantic.dark || !tokens.semantic.light) {
  console.error('✗ semantic.dark et semantic.light sont obligatoires');
  process.exit(1);
}

// ---------- Flattening ----------
const flattenPrimitives = (p) => {
  const out = {};
  const add = (prefix, obj) => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      out[`${prefix}-${kebab(k)}`] = String(v);
    }
  };
  add(`${P}-space`, p.spacing);
  add(`${P}-radius`, p.radius);
  add(`${P}-z`, p.zIndex);
  add(`${P}-border-w`, p.borderWidths);
  add(`${P}-density`, p.density);
  add(`${P}-dur`, p.motion?.durations);
  add(`${P}-ease`, p.motion?.easings);
  add(`${P}-font`, p.typography?.fonts);
  add(`${P}-text`, p.typography?.sizes);
  add(`${P}-weight`, p.typography?.weights);
  add(`${P}-leading`, p.typography?.lineHeights);
  add(`${P}-tracking`, p.typography?.letterSpacings);
  return out;
};

const flattenTheme = (t) => {
  const out = {};
  const nested = {
    bg: 'bg',
    border: 'border',
    text: 'text',
    brand: 'brand',
    telemetry: 'telemetry',
    status: 'status',
    shadows: 'shadow',
    focus: 'focus',
    skeleton: 'skeleton',
    glass: 'glass',
    selection: 'selection',
  };
  for (const [k, prefix] of Object.entries(nested)) {
    for (const [sk, sv] of Object.entries(t[k] ?? {})) {
      out[`${P}-${prefix}-${kebab(sk)}`] = String(sv);
    }
  }
  for (const k of ['overlay', 'halo']) {
    if (t[k] !== undefined) out[`${P}-${kebab(k)}`] = String(t[k]);
  }
  return out;
};

const flattenChart = (c) => {
  const out = {};
  (c.series ?? []).forEach((v, i) => { out[`${P}-chart-${i + 1}`] = String(v); });
  (c.seriesLight ?? []).forEach((v, i) => { out[`${P}-chart-light-${i + 1}`] = String(v); });
  if (c.grid) out[`${P}-chart-grid`] = String(c.grid);
  if (c.axisText) out[`${P}-chart-axis-text`] = String(c.axisText);
  if (c.sparklineOpacity !== undefined) {
    out[`${P}-chart-sparkline-opacity`] = String(c.sparklineOpacity);
  }
  for (const group of ['tooltip', 'annotation']) {
    for (const [k, v] of Object.entries(c[group] ?? {})) {
      if (v && typeof v === 'object') {
        for (const [mode, val] of Object.entries(v)) {
          out[`${P}-chart-${group}-${kebab(k)}-${mode}`] = String(val);
        }
      } else {
        out[`${P}-chart-${group}-${kebab(k)}`] = String(v);
      }
    }
  }
  return out;
};

// ---------- CSS ----------
const cssVarsBlock = (obj, indent = '  ') =>
  Object.entries(obj).map(([k, v]) => `${indent}${k}: ${v};`).join('\n');

const buildCss = () => {
  const prims = flattenPrimitives(tokens.primitives);
  const chart = flattenChart(tokens.chart);
  const light = flattenTheme(tokens.semantic.light);
  const dark = flattenTheme(tokens.semantic.dark);

  const lightSelectors = defaultTheme === 'light'
    ? ':root, [data-theme="light"]'
    : 'html.light, [data-theme="light"]';
  const darkSelectors = defaultTheme === 'dark'
    ? ':root, [data-theme="dark"]'
    : 'html.dark, [data-theme="dark"]';

  const lightBlock = `${lightSelectors} {\n${cssVarsBlock(light)}\n}`;
  const darkBlock = `${darkSelectors} {\n${cssVarsBlock(dark)}\n}`;

  const themeBlocks = defaultTheme === 'dark'
    ? `${darkBlock}\n\n${lightBlock}`
    : `${lightBlock}\n\n${darkBlock}`;

  return `/* ==========================================================================
   DocteurFlotte Design Tokens — v${tokens.version}
   Généré automatiquement depuis tokens.json — NE PAS ÉDITER MANUELLEMENT
   ========================================================================== */

/* ---- Primitives (invariants, partagés) ---- */
:root {
${cssVarsBlock(prims)}
}

/* ---- Chart (partagé + variantes dark/light suffixées) ---- */
:root {
${cssVarsBlock(chart)}
}

/* ---- Thème (défaut : ${defaultTheme}) ---- */
${themeBlocks}
`;
};

// ---------- Tailwind Config ----------
const buildTailwind = () => {
  const t = tokens.primitives;
  const escapeKey = (k) => (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `'${k}'`);

  const radius = Object.entries(t.radius)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');
  const spacing = Object.entries(t.spacing)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');
  const zIndex = Object.entries(t.zIndex)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');
  const borderWidth = Object.entries(t.borderWidths)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');
  const durations = Object.entries(t.motion.durations)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');
  const easings = Object.entries(t.motion.easings)
    .map(([k, v]) => `        ${escapeKey(kebab(k))}: '${v}'`)
    .join(',\n');
  const fontSizes = Object.entries(t.typography.sizes)
    .map(([k, v]) => `        ${escapeKey(k)}: '${v}'`)
    .join(',\n');

  return `// Généré automatiquement depuis tokens.json — NE PAS ÉDITER
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,mdx}', './app/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(${P}-bg-base)',
        surface: {
          1: 'var(${P}-bg-surface1)',
          2: 'var(${P}-bg-surface2)',
          3: 'var(${P}-bg-surface3)',
        },
        border: {
          hairline: 'var(${P}-border-hairline)',
          subtle: 'var(${P}-border-subtle)',
          medium: 'var(${P}-border-medium)',
          highlight: 'var(${P}-border-highlight)',
        },
        foreground: {
          primary: 'var(${P}-text-primary)',
          secondary: 'var(${P}-text-secondary)',
          muted: 'var(${P}-text-muted)',
          faint: 'var(${P}-text-faint)',
          onBrand: 'var(${P}-text-on-brand)',
        },
        brand: {
          primary: 'var(${P}-brand-primary)',
          'primary-hover': 'var(${P}-brand-primary-hover)',
          glow: 'var(${P}-brand-glow)',
        },
        telemetry: {
          cyan: 'var(${P}-telemetry-cyan)',
          'cyan-subtle': 'var(${P}-telemetry-cyan-subtle)',
        },
        status: {
          nominal: 'var(${P}-status-nominal)',
          'nominal-bg': 'var(${P}-status-nominal-bg)',
          warning: 'var(${P}-status-warning)',
          'warning-bg': 'var(${P}-status-warning-bg)',
          critical: 'var(${P}-status-critical)',
          'critical-bg': 'var(${P}-status-critical-bg)',
          neutral: 'var(${P}-status-neutral)',
          'neutral-bg': 'var(${P}-status-neutral-bg)',
        },
      },
      borderRadius: {
${radius}
      },
      spacing: {
${spacing}
      },
      zIndex: {
${zIndex}
      },
      borderWidth: {
${borderWidth}
      },
      fontFamily: {
        sans: [${t.typography.fonts.sans.split(',').map((f) => `'${f.trim().replace(/'/g, '')}'`).join(', ')}],
        mono: [${t.typography.fonts.mono.split(',').map((f) => `'${f.trim().replace(/'/g, '')}'`).join(', ')}],
        arabic: [${t.typography.fonts.arabic.split(',').map((f) => `'${f.trim().replace(/'/g, '')}'`).join(', ')}],
      },
      fontSize: {
${fontSizes}
      },
      boxShadow: {
        card: 'var(${P}-shadow-card)',
        dropdown: 'var(${P}-shadow-dropdown)',
        modal: 'var(${P}-shadow-modal)',
        focus: 'var(${P}-shadow-focus)',
      },
      transitionTimingFunction: {
${easings}
      },
      transitionDuration: {
${durations}
      },
    },
  },
  plugins: [],
};

export default config;
`;
};

// ---------- TypeScript ----------
const buildTs = () => {
  const json = JSON.stringify(tokens, null, 2);
  return `// Généré automatiquement depuis tokens.json — NE PAS ÉDITER
// Source unique de vérité : tokens.json (v${tokens.version})

export type ThemeName = 'dark' | 'light';
export type Density = 'compact' | 'comfort' | 'spacious';

export const tokens = ${json} as const;

export const primitives = tokens.primitives;
export const semantic = tokens.semantic;
export const chart = tokens.chart;

export type PrimitiveTokens = typeof primitives;
export type SemanticTokens = typeof semantic;
export type ChartTokens = typeof chart;

export default tokens;
`;
};

// ---------- Write ----------
mkdirSync(outDir, { recursive: true });

const written = [];

if (targets.includes('css')) {
  const cssContent = buildCss();
  const path = join(outDir, 'tokens.css');
  writeFileSync(path, cssContent, 'utf8');
  written.push(path);

  // Synchronisation automatique apps/web
  const webCssPath = resolve(root, 'apps/web/src/app/tokens.css');
  writeFileSync(webCssPath, cssContent, 'utf8');
  written.push(webCssPath);
}

if (targets.includes('tailwind')) {
  const path = join(outDir, 'tailwind.config.ts');
  writeFileSync(path, buildTailwind(), 'utf8');
  written.push(path);
}

if (targets.includes('ts')) {
  const tsContent = buildTs();
  const path = join(outDir, 'tokens.ts');
  writeFileSync(path, tsContent, 'utf8');
  written.push(path);

  // Synchronisation automatique apps/web
  const webTsDir = resolve(root, 'apps/web/src/tokens');
  mkdirSync(webTsDir, { recursive: true });
  const webTsPath = join(webTsDir, 'tokens.ts');
  writeFileSync(webTsPath, tsContent, 'utf8');
  written.push(webTsPath);
}

written.forEach((p) => log(`✓ ${p.replace(root, '.')}`));
log(`\n✓ Build terminé — ${written.length} fichier(s) généré(s) depuis tokens.json v${tokens.version}`);
