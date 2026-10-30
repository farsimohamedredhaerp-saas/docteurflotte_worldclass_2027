const fs = require('fs');

const path = 'apps/web/src/components/live-cockpit/VehicleDiagnosticTacticalHud.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Blueprint node & legend overlays
content = content.replace(
  '<div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">',
  '<div className="blueprint-node-overlay flex flex-col gap-1">'
);

content = content.replace(
  '<div className="absolute top-2.5 right-2.5 z-10 bg-slate-950/90 border border-slate-800 px-2 py-1.5 font-mono text-[9px] space-y-1">',
  '<div className="blueprint-legend-overlay bg-slate-950/90 border border-slate-800 px-2 py-1.5 font-mono text-[9px] space-y-1">'
);

// 2. CAD layers bar formatting
const oldCadBar = `<div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase">CALQUES CAD:</span>
              {(
                [
                  { id: 'chassis', label: 'CHÂSSIS' },
                  { id: 'powertrain', label: 'MOTOPROPULSEUR' },
                  { id: 'thermal', label: 'THERMIQUE/FLUX' },
                  { id: 'sensors', label: 'NOEUDS CAPTEURS' },
                ] as { id: keyof CadLayers; label: string }[]
              ).map((ly) => (
                <button
                  key={ly.id}
                  onClick={() => onToggleLayer(ly.id)}
                  className={\`px-2 py-0.5 border transition cursor-pointer \${
                    layers[ly.id]
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }\`}
                >
                  {ly.label}
                </button>
              ))}
            </div>
            <span className="text-slate-400 text-[9.5px]">STATUTS NOEUDS CALCULÉS EN DIRECT</span>
          </div>`;

const newCadBar = `<div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase text-[9px] hidden sm:inline">CALQUES CAD:</span>
              {(
                [
                  { id: 'chassis', label: 'CHÂSSIS' },
                  { id: 'powertrain', label: 'MOTOPROPULSEUR' },
                  { id: 'thermal', label: 'THERMIQUE/FLUX' },
                  { id: 'sensors', label: 'NOEUDS CAPTEURS' },
                ] as { id: keyof CadLayers; label: string }[]
              ).map((ly) => (
                <button
                  key={ly.id}
                  onClick={() => onToggleLayer(ly.id)}
                  className={\`px-1.5 py-0.5 border text-[9px] font-semibold transition cursor-pointer \${
                    layers[ly.id]
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }\`}
                >
                  {ly.label}
                </button>
              ))}
            </div>
            <span className="text-slate-400 text-[9px]">STATUTS NOEUDS CALCULÉS EN DIRECT</span>
          </div>`;

content = content.replace(oldCadBar.replace(/\r\n/g, '\n'), newCadBar);
content = content.replace(oldCadBar.replace(/\n/g, '\r\n'), newCadBar.replace(/\n/g, '\r\n'));

// 3. Blueprint container and SVG max-height
content = content.replace(
  'min-h-[380px] max-h-[440px]',
  'min-h-[360px] max-h-[400px]'
);
content = content.replace(
  'className="w-full h-full max-h-[420px] select-none mx-auto"',
  'className="w-full h-full max-h-[380px] select-none mx-auto"'
);

// 4. Callout card
content = content.replace(
  '<div className="mt-3 p-3 bg-slate-950 border border-cyan-500/40 relative">',
  '<div className="mt-2.5 p-2.5 bg-slate-950 border border-cyan-500/40 relative">'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Polished tactical hud elements successfully.');

