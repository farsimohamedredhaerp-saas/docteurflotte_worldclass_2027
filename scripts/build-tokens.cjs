/**
 * DocteurFlotte — Compilateur de Tokens as Code (v5.0)
 * Lit tokens/tokens.json et compile :
 * 1. apps/web/src/app/tokens.css (Variables CSS :root et dark mode)
 * 2. apps/web/src/tokens/tokens.ts (Typage et constantes TS pour composants)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tokensPath = path.join(rootDir, 'tokens', 'tokens.json');
const cssOutputPath = path.join(rootDir, 'apps', 'web', 'src', 'app', 'tokens.css');
const tsOutputDir = path.join(rootDir, 'apps', 'web', 'src', 'tokens');
const tsOutputPath = path.join(tsOutputDir, 'tokens.ts');

if (!fs.existsSync(tokensPath)) {
  console.error(`❌ Fichier introuvable : ${tokensPath}`);
  process.exit(1);
}

const rawTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const { primitives, semantic, chart } = rawTokens;

// 1. Génération CSS
let css = `/* ==========================================================================
   DOCTEURFLOTTE — DESIGN OPERATING SYSTEM TOKENS (v5.0)
   GÉNÉRÉ AUTOMATIQUEMENT PAR scripts/build-tokens.cjs — NE PAS ÉDITER DIRECTEMENT
   Source de vérité : tokens/tokens.json
   ========================================================================== */\n\n`;

css += `:root {\n`;

// Primitives spacing
css += `  /* Espacements (base 4px) */\n`;
for (const [key, val] of Object.entries(primitives.spacing)) {
  css += `  --df-space-${key}: ${val};\n`;
}

// Primitives radius
css += `\n  /* Rayons de courbure techniques */\n`;
for (const [key, val] of Object.entries(primitives.radius)) {
  css += `  --df-radius-${key}: ${val};\n`;
}

// Primitives z-index
css += `\n  /* Niveaux d'élévation Z-Index */\n`;
for (const [key, val] of Object.entries(primitives.zIndex)) {
  css += `  --df-z-${key}: ${val};\n`;
}

// Primitives motion
css += `\n  /* Durées et Easings d'Animation */\n`;
for (const [key, val] of Object.entries(primitives.motion.durations)) {
  css += `  --df-dur-${key}: ${val};\n`;
}
for (const [key, val] of Object.entries(primitives.motion.easings)) {
  css += `  --df-ease-${key}: ${val};\n`;
}

// Primitives typography
css += `\n  /* Typographie */\n`;
css += `  --df-font-sans: ${primitives.typography.fonts.sans};\n`;
css += `  --df-font-mono: ${primitives.typography.fonts.mono};\n`;
css += `  --df-font-arabic: ${primitives.typography.fonts.arabic};\n`;
for (const [key, val] of Object.entries(primitives.typography.sizes)) {
  css += `  --df-text-${key}: ${val};\n`;
}

// Semantic Light (Default)
css += `\n  /* Couleurs Sémantiques — Thème Clair (Sahara Calcite) */\n`;
css += `  --df-bg-base: ${semantic.light.bg.base};\n`;
css += `  --df-bg-surface-1: ${semantic.light.bg.surface1};\n`;
css += `  --df-bg-surface-2: ${semantic.light.bg.surface2};\n`;
css += `  --df-bg-surface-3: ${semantic.light.bg.surface3};\n`;

css += `  --df-border-hairline: ${semantic.light.border.hairline};\n`;
css += `  --df-border-subtle: ${semantic.light.border.subtle};\n`;
css += `  --df-border-medium: ${semantic.light.border.medium};\n`;
css += `  --df-border-highlight: ${semantic.light.border.highlight};\n`;

css += `  --df-text-primary: ${semantic.light.text.primary};\n`;
css += `  --df-text-secondary: ${semantic.light.text.secondary};\n`;
css += `  --df-text-muted: ${semantic.light.text.muted};\n`;
css += `  --df-text-faint: ${semantic.light.text.faint};\n`;

css += `  --df-brand-primary: ${semantic.light.brand.primary};\n`;
css += `  --df-brand-primary-hover: ${semantic.light.brand.primaryHover};\n`;
css += `  --df-brand-glow: ${semantic.light.brand.glow};\n`;

css += `  --df-telemetry-cyan: ${semantic.light.telemetry.cyan};\n`;
css += `  --df-telemetry-cyan-subtle: ${semantic.light.telemetry.cyanSubtle};\n`;

css += `  --df-status-nominal: ${semantic.light.status.nominal};\n`;
css += `  --df-status-nominal-bg: ${semantic.light.status.nominalBg};\n`;
css += `  --df-status-warning: ${semantic.light.status.warning};\n`;
css += `  --df-status-warning-bg: ${semantic.light.status.warningBg};\n`;
css += `  --df-status-critical: ${semantic.light.status.critical};\n`;
css += `  --df-status-critical-bg: ${semantic.light.status.criticalBg};\n`;
css += `  --df-status-neutral: ${semantic.light.status.neutral};\n`;
css += `  --df-status-neutral-bg: ${semantic.light.status.neutralBg};\n`;

// Data-viz tokens
css += `\n  /* Data-Viz Séries & Grilles */\n`;
chart.series.forEach((c, idx) => {
  css += `  --df-chart-${idx + 1}: ${c};\n`;
});
css += `  --df-chart-grid: ${chart.grid};\n`;
css += `  --df-chart-axis-text: ${chart.axisText};\n`;
css += `  --df-chart-tooltip-bg: ${chart.tooltipBgLight};\n`;

css += `}\n\n`;

// Semantic Dark Mode
css += `/* Thème Sombre — Titanium Aerospace */\n`;
css += `:root[data-theme="dark"], html.dark {\n`;
css += `  --df-bg-base: ${semantic.dark.bg.base};\n`;
css += `  --df-bg-surface-1: ${semantic.dark.bg.surface1};\n`;
css += `  --df-bg-surface-2: ${semantic.dark.bg.surface2};\n`;
css += `  --df-bg-surface-3: ${semantic.dark.bg.surface3};\n`;

css += `  --df-border-hairline: ${semantic.dark.border.hairline};\n`;
css += `  --df-border-subtle: ${semantic.dark.border.subtle};\n`;
css += `  --df-border-medium: ${semantic.dark.border.medium};\n`;
css += `  --df-border-highlight: ${semantic.dark.border.highlight};\n`;

css += `  --df-text-primary: ${semantic.dark.text.primary};\n`;
css += `  --df-text-secondary: ${semantic.dark.text.secondary};\n`;
css += `  --df-text-muted: ${semantic.dark.text.muted};\n`;
css += `  --df-text-faint: ${semantic.dark.text.faint};\n`;

css += `  --df-brand-primary: ${semantic.dark.brand.primary};\n`;
css += `  --df-brand-primary-hover: ${semantic.dark.brand.primaryHover};\n`;
css += `  --df-brand-glow: ${semantic.dark.brand.glow};\n`;

css += `  --df-telemetry-cyan: ${semantic.dark.telemetry.cyan};\n`;
css += `  --df-telemetry-cyan-subtle: ${semantic.dark.telemetry.cyanSubtle};\n`;

css += `  --df-status-nominal: ${semantic.dark.status.nominal};\n`;
css += `  --df-status-nominal-bg: ${semantic.dark.status.nominalBg};\n`;
css += `  --df-status-warning: ${semantic.dark.status.warning};\n`;
css += `  --df-status-warning-bg: ${semantic.dark.status.warningBg};\n`;
css += `  --df-status-critical: ${semantic.dark.status.critical};\n`;
css += `  --df-status-critical-bg: ${semantic.dark.status.criticalBg};\n`;
css += `  --df-status-neutral: ${semantic.dark.status.neutral};\n`;
css += `  --df-status-neutral-bg: ${semantic.dark.status.neutralBg};\n`;

css += `  --df-chart-tooltip-bg: ${chart.tooltipBgDark};\n`;
css += `}\n\n`;

// Accessibilité : prefers-reduced-motion
css += `/* Accessibilité WCAG : Respect strict du mode sans animation */\n`;
css += `@media (prefers-reduced-motion: reduce) {\n`;
css += `  :root {\n`;
css += `    --df-dur-fast: 0.01ms !important;\n`;
css += `    --df-dur-base: 0.01ms !important;\n`;
css += `    --df-dur-slow: 0.01ms !important;\n`;
css += `    --df-dur-xslow: 0.01ms !important;\n`;
css += `  }\n`;
css += `  *, *::before, *::after {\n`;
css += `    animation-duration: 0.01ms !important;\n`;
css += `    animation-iteration-count: 1 !important;\n`;
css += `    transition-duration: 0.01ms !important;\n`;
css += `    scroll-behavior: auto !important;\n`;
css += `  }\n`;
css += `}\n`;

fs.writeFileSync(cssOutputPath, css, 'utf8');
console.log(`✅ CSS compilé avec succès : ${cssOutputPath}`);

// 2. Génération TypeScript
if (!fs.existsSync(tsOutputDir)) {
  fs.mkdirSync(tsOutputDir, { recursive: true });
}

let ts = `/**
 * DocteurFlotte Design Tokens (v5.0) — Typage et constantes TypeScript
 * GÉNÉRÉ AUTOMATIQUEMENT PAR scripts/build-tokens.cjs
 */

export const DESIGN_TOKENS = ${JSON.stringify(rawTokens, null, 2)} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
export type SpacingToken = keyof typeof DESIGN_TOKENS.primitives.spacing;
export type RadiusToken = keyof typeof DESIGN_TOKENS.primitives.radius;
export type ZIndexToken = keyof typeof DESIGN_TOKENS.primitives.zIndex;
export type ChartSeriesColor = typeof DESIGN_TOKENS.chart.series[number];
`;

fs.writeFileSync(tsOutputPath, ts, 'utf8');
console.log(`✅ TypeScript compilé avec succès : ${tsOutputPath}`);

