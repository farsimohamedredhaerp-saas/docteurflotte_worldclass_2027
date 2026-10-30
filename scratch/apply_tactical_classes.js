const fs = require('fs');

const path = 'apps/web/src/components/live-cockpit/VehicleDiagnosticTacticalHud.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Grid classes
content = content.replace(
  '<main className="max-w-[1600px] w-full mx-auto p-2.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 items-start">',
  '<main className="tactical-hud-grid max-w-[1600px] w-full mx-auto p-2.5 flex-1 items-start">'
);

content = content.replace(
  '<section className="lg:col-span-3 flex flex-col gap-2.5">',
  '<section className="tactical-col-3 flex flex-col gap-2.5">'
);

content = content.replace(
  '<section className="lg:col-span-5 flex flex-col gap-2.5">',
  '<section className="tactical-col-5 flex flex-col gap-2.5">'
);

content = content.replace(
  '<section className="lg:col-span-4 flex flex-col gap-2.5">',
  '<section className="tactical-col-4 flex flex-col gap-2.5">'
);

// 2. Fix wilaya display
content = content.replace(
  `<span className="text-slate-400 hidden lg:inline">\r\n              WILAYA : <strong className="text-slate-300">{vehicleSchema.identity.wilaya}</strong>\r\n            </span>`,
  `{vehicleSchema.identity.wilaya ? (\r\n              <span className="text-slate-400 hidden lg:inline">\r\n                WILAYA : <strong className="text-slate-300">{vehicleSchema.identity.wilaya}</strong>\r\n              </span>\r\n            ) : null}`
);

// Also try without \r
content = content.replace(
  `<span className="text-slate-400 hidden lg:inline">\n              WILAYA : <strong className="text-slate-300">{vehicleSchema.identity.wilaya}</strong>\n            </span>`,
  `{vehicleSchema.identity.wilaya ? (\n              <span className="text-slate-400 hidden lg:inline">\n                WILAYA : <strong className="text-slate-300">{vehicleSchema.identity.wilaya}</strong>\n              </span>\n            ) : null}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Applied tactical classes and wilaya fix successfully.');

