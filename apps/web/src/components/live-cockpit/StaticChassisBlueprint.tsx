'use client';

import React from 'react';
import { CadLayers } from './demoFallbackData';

export interface StaticChassisBlueprintProps {
  vehicleId: string;
  layers: CadLayers;
}

/**
 * DOCTEURFLOTTE — Chassis Blueprint Vectoriel Statique
 * 
 * Optimisation GPU / DOM :
 * Ce composant est encapsulé dans React.memo avec comparaison stricte.
 * Il ne se re-rend JAMAIS lors de la réception de nouvelles trames télématiques (RPM, temp, GPS).
 * Il ne se met à jour QUE si l'utilisateur change de modèle de véhicule ou active/désactive un calque CAD.
 */
export const StaticChassisBlueprint = React.memo(
  function StaticChassisBlueprint({ vehicleId, layers }: StaticChassisBlueprintProps) {
    const showChassis = layers.chassis;
    const showPowertrain = layers.powertrain;
    const showThermal = layers.thermal;

    return (
      <g className="static-chassis-blueprint select-none pointer-events-none">
        {/* 1. VOITURE DE TOURISME (SEDAN) */}
        {vehicleId === 'sedan' && (
          <g>
            {showChassis && (
              <g stroke="#334155" fill="none">
                <path
                  d="M115,72 C135,54 225,54 245,72 L258,135 L258,495 C258,530 235,552 180,552 C125,552 102,530 102,495 L102,135 Z"
                  fill="url(#xrayGlow)"
                  stroke="#38bdf8"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
                <path d="M118,185 L242,185 L230,245 L130,245 Z" stroke="#475569" strokeWidth="1.2" />
                <rect x="130" y="245" width="100" height="125" stroke="#334155" strokeWidth="1" />
                <path d="M130,370 L230,370 L240,425 L120,425 Z" stroke="#475569" strokeWidth="1.2" />
                {[
                  { x: 84, y: 120 },
                  { x: 256, y: 120 },
                  { x: 84, y: 432 },
                  { x: 256, y: 432 },
                ].map((w, idx) => (
                  <g key={idx}>
                    <rect x={w.x} y={w.y} width="20" height="54" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
                    <line x1={w.x + 10} y1={w.y + 8} x2={w.x + 10} y2={w.y + 46} stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="2" />
                  </g>
                ))}
                <line x1="104" y1="147" x2="145" y2="147" stroke="#64748b" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="215" y1="147" x2="256" y2="147" stroke="#64748b" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="104" y1="459" x2="256" y2="459" stroke="#64748b" strokeWidth="2" />
              </g>
            )}

            {showPowertrain && (
              <g>
                <rect x="145" y="102" width="72" height="42" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                {[156, 172, 188, 204].map((cx) => (
                  <circle key={cx} cx={cx} cy="123" r="6" fill="#020617" stroke="#22d3ee" strokeWidth="1.2" />
                ))}
                <rect x="132" y="148" width="44" height="34" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.2" />
                <rect x="112" y="96" width="24" height="18" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
                <rect x="232" y="126" width="20" height="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <path d="M135,405 L225,405 L220,445 L140,445 Z" fill="#0f172a" stroke="#06b6d4" strokeOpacity="0.6" strokeWidth="1.2" />
              </g>
            )}

            {showThermal && (
              <g>
                <rect x="135" y="74" width="90" height="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M180,144 L180,520" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="2.5" fill="none" />
                <rect x="170" y="325" width="20" height="42" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.3" />
                <rect x="152" y="502" width="56" height="22" fill="#0f172a" stroke="#fbbf24" strokeOpacity="0.7" strokeWidth="1.2" />
              </g>
            )}
          </g>
        )}

        {/* 2. FOURGON UTILITAIRE (VAN) */}
        {vehicleId === 'van' && (
          <g>
            {showChassis && (
              <g>
                <path
                  d="M104,68 C130,55 230,55 256,68 L264,120 L264,552 L96,552 L96,120 Z"
                  fill="url(#xrayGlow)"
                  stroke="#38bdf8"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                />
                <line x1="138" y1="80" x2="138" y2="545" stroke="#475569" strokeWidth="2" />
                <line x1="222" y1="80" x2="222" y2="545" stroke="#475569" strokeWidth="2" />
                {[150, 210, 270, 330, 390, 450, 510].map((y) => (
                  <line key={y} x1="138" y1={y} x2="222" y2={y} stroke="#334155" strokeWidth="1.2" />
                ))}
                <line x1="96" y1="196" x2="264" y2="196" stroke="#22d3ee" strokeWidth="2" />
                <rect x="104" y="204" width="152" height="338" fill="none" stroke="#06b6d4" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="6 3" />
                <line x1="266" y1="225" x2="266" y2="395" stroke="#34d399" strokeWidth="3" />
                <line x1="180" y1="542" x2="180" y2="556" stroke="#34d399" strokeWidth="2" />
                {[
                  { x: 78, y: 112 },
                  { x: 264, y: 112 },
                  { x: 78, y: 446 },
                  { x: 264, y: 446 },
                ].map((w, idx) => (
                  <rect key={idx} x={w.x} y={w.y} width="18" height="56" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
                ))}
                <line x1="96" y1="474" x2="264" y2="474" stroke="#94a3b8" strokeWidth="3" />
              </g>
            )}

            {showPowertrain && (
              <g>
                <rect x="150" y="88" width="60" height="46" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                <rect x="160" y="134" width="40" height="36" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="180" y1="170" x2="180" y2="474" stroke="#64748b" strokeWidth="2.5" />
                <circle cx="180" cy="474" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              </g>
            )}

            {showThermal && (
              <g>
                <rect x="134" y="315" width="92" height="68" fill="#091526" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="158" cy="349" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 2" />
                <circle cx="202" cy="349" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 2" />
                <path d="M198,134 L198,430" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                <rect x="186" y="216" width="24" height="46" fill="#2a0a18" stroke="#f43f5e" strokeWidth="1.8" />
              </g>
            )}
          </g>
        )}

        {/* 3. SUV / 4X4 */}
        {vehicleId === 'suv' && (
          <g>
            {showChassis && (
              <g>
                <path d="M120,58 L240,58 L248,72 L112,72 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="162" y="54" width="36" height="12" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.2" />
                <path
                  d="M104,72 L256,72 L266,180 L266,490 L252,535 L108,535 L94,490 L94,180 Z"
                  fill="url(#xrayGlow)"
                  stroke="#38bdf8"
                  strokeOpacity="0.5"
                  strokeWidth="1.6"
                />
                <polygon points="138,105 222,105 214,205 146,205" fill="#0f172a" fillOpacity="0.7" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
                <rect x="146" y="255" width="68" height="65" fill="#0f172a" fillOpacity="0.7" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
                {[
                  { x: 68, y: 116 },
                  { x: 264, y: 116 },
                  { x: 68, y: 414 },
                  { x: 264, y: 414 },
                ].map((w, idx) => (
                  <g key={idx}>
                    <rect x={w.x} y={w.y} width="28" height="66" fill="#090d16" stroke="#94a3b8" strokeWidth="1.8" />
                    {[12, 24, 36, 48, 58].map((ty) => (
                      <line key={ty} x1={w.x + 2} y1={w.y + ty} x2={w.x + 26} y2={w.y + ty} stroke="#475569" strokeWidth="2" />
                    ))}
                  </g>
                ))}
              </g>
            )}

            {showPowertrain && (
              <g>
                <line x1="96" y1="149" x2="264" y2="149" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="180" cy="149" r="13" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                <rect x="148" y="115" width="64" height="58" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.6" />
                <rect x="160" y="178" width="40" height="62" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x="152" y="262" width="56" height="46" fill="#271a0c" stroke="#fbbf24" strokeWidth="1.8" />
                <line x1="180" y1="262" x2="180" y2="162" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="5 2" />
                <line x1="180" y1="308" x2="180" y2="447" stroke="#22d3ee" strokeWidth="2.5" />
                <circle cx="180" cy="447" r="14" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="96" y1="447" x2="264" y2="447" stroke="#38bdf8" strokeWidth="3" />
              </g>
            )}

            {showThermal && (
              <g>
                <path d="M214,140 L214,510" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="6 2" />
                <rect x="202" y="340" width="24" height="55" fill="#271a0c" stroke="#f59e0b" strokeWidth="1.5" />
                <rect x="120" y="330" width="45" height="75" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
              </g>
            )}
          </g>
        )}

        {/* 4. CAMION LOURD (TRUCK 6X4) */}
        {vehicleId === 'truck' && (
          <g>
            {showChassis && (
              <g>
                <line x1="124" y1="45" x2="124" y2="575" stroke="#94a3b8" strokeWidth="4.5" />
                <line x1="236" y1="45" x2="236" y2="575" stroke="#94a3b8" strokeWidth="4.5" />
                {[55, 110, 180, 245, 310, 375, 440, 505, 565].map((y) => (
                  <line key={y} x1="124" y1={y} x2="236" y2={y} stroke="#64748b" strokeWidth="2.5" />
                ))}
                <path
                  d="M102,48 L258,48 L258,185 L102,185 Z"
                  fill="url(#xrayGlow)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeOpacity="0.75"
                />
                <rect x="110" y="56" width="140" height="26" fill="#090d16" stroke="#22d3ee" strokeWidth="1.2" />
                {[
                  { x: 62, y: 110, w: 26, h: 65 },
                  { x: 272, y: 110, w: 26, h: 65 },
                  { x: 42, y: 420, w: 22, h: 68 },
                  { x: 66, y: 420, w: 22, h: 68 },
                  { x: 272, y: 420, w: 22, h: 68 },
                  { x: 296, y: 420, w: 22, h: 68 },
                  { x: 42, y: 495, w: 22, h: 68 },
                  { x: 66, y: 495, w: 22, h: 68 },
                  { x: 272, y: 495, w: 22, h: 68 },
                  { x: 296, y: 495, w: 22, h: 68 },
                ].map((w, idx) => (
                  <rect key={idx} x={w.x} y={w.y} width={w.w} height={w.h} fill="#020617" stroke="#64748b" strokeWidth="1.6" />
                ))}
                <line x1="88" y1="142" x2="272" y2="142" stroke="#475569" strokeWidth="3" />
                <line x1="88" y1="454" x2="272" y2="454" stroke="#475569" strokeWidth="3.5" />
                <line x1="88" y1="529" x2="272" y2="529" stroke="#475569" strokeWidth="3.5" />
              </g>
            )}

            {showPowertrain && (
              <g>
                <rect x="142" y="80" width="76" height="85" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                {[96, 114, 132, 150].map((cy) => (
                  <ellipse key={cy} cx="180" cy={cy} rx="16" ry="6" fill="#020617" stroke="#22d3ee" strokeWidth="1.2" />
                ))}
                <rect x="148" y="168" width="64" height="60" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="180" y1="228" x2="180" y2="454" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle cx="180" cy="454" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <line x1="180" y1="470" x2="180" y2="529" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle cx="180" cy="529" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              </g>
            )}

            {showThermal && (
              <g>
                <rect x="135" y="48" width="90" height="22" fill="#042f2e" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="3 2" />
                <rect x="74" y="240" width="46" height="120" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
                <rect x="76" y="375" width="42" height="35" fill="#1e3a5f" stroke="#0ea5e9" strokeWidth="1.4" />
                <rect x="240" y="235" width="46" height="85" fill="#3b0764" stroke="#c084fc" strokeWidth="1.8" />
                <circle cx="263" cy="355" r="18" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" />
                <circle cx="263" cy="395" r="18" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" />
              </g>
            )}
          </g>
        )}

        {/* 5. SEMI-REMORQUE (SEMI TRIDEM) */}
        {vehicleId === 'semi' && (
          <g>
            {showChassis && (
              <g>
                <path d="M110,48 L250,48 L250,140 L110,140 Z" fill="url(#xrayGlow)" stroke="#38bdf8" strokeWidth="1.8" />
                <circle cx="180" cy="165" r="16" fill="#090d16" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" />
                <rect x="96" y="160" width="168" height="395" fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="8 4" />
                <line x1="126" y1="165" x2="126" y2="555" stroke="#64748b" strokeWidth="3.5" />
                <line x1="234" y1="165" x2="234" y2="555" stroke="#64748b" strokeWidth="3.5" />
                {[220, 275, 330, 385, 440, 495].map((y) => (
                  <line key={y} x1="126" y1={y} x2="234" y2={y} stroke="#475569" strokeWidth="1.5" />
                ))}
                {[
                  { x: 58, y: 75, w: 22, h: 52 },
                  { x: 280, y: 75, w: 22, h: 52 },
                  { x: 44, y: 145, w: 20, h: 52 },
                  { x: 66, y: 145, w: 20, h: 52 },
                  { x: 274, y: 145, w: 20, h: 52 },
                  { x: 296, y: 145, w: 20, h: 52 },
                  { x: 44, y: 415, w: 20, h: 52 },
                  { x: 66, y: 415, w: 20, h: 52 },
                  { x: 274, y: 415, w: 20, h: 52 },
                  { x: 296, y: 415, w: 20, h: 52 },
                  { x: 44, y: 472, w: 20, h: 52 },
                  { x: 66, y: 472, w: 20, h: 52 },
                  { x: 274, y: 472, w: 20, h: 52 },
                  { x: 296, y: 472, w: 20, h: 52 },
                  { x: 44, y: 528, w: 20, h: 52 },
                  { x: 66, y: 528, w: 20, h: 52 },
                  { x: 274, y: 528, w: 20, h: 52 },
                  { x: 296, y: 528, w: 20, h: 52 },
                ].map((w, idx) => (
                  <rect key={idx} x={w.x} y={w.y} width={w.w} height={w.h} fill="#020617" stroke="#64748b" strokeWidth="1.4" />
                ))}
              </g>
            )}

            {showPowertrain && (
              <g>
                <circle cx="180" cy="441" r="10" fill="#020617" stroke="#22d3ee" strokeWidth="1.5" />
                <circle cx="180" cy="498" r="10" fill="#020617" stroke="#22d3ee" strokeWidth="1.5" />
                <circle cx="180" cy="554" r="10" fill="#020617" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="86" y1="441" x2="274" y2="441" stroke="#22d3ee" strokeWidth="2.5" />
                <line x1="86" y1="498" x2="274" y2="498" stroke="#22d3ee" strokeWidth="2.5" />
                <line x1="86" y1="554" x2="274" y2="554" stroke="#22d3ee" strokeWidth="2.5" />
              </g>
            )}

            {showThermal && (
              <g>
                <rect x="135" y="180" width="90" height="24" fill="#082f49" stroke="#38bdf8" strokeWidth="1.4" />
                <line x1="180" y1="204" x2="180" y2="435" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 3" />
                <rect x="165" y="380" width="30" height="20" fill="#2a1b08" stroke="#fbbf24" strokeWidth="1.4" />
              </g>
            )}
          </g>
        )}

        {/* 6. AUTOCAR TRANSPORT DE VOYAGEURS (COACH) */}
        {vehicleId === 'coach' && (
          <g>
            {showChassis && (
              <g>
                <path
                  d="M102,52 C125,45 235,45 258,52 L266,120 L266,558 L94,558 L94,120 Z"
                  fill="url(#xrayGlow)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeOpacity="0.75"
                />
                <rect x="110" y="54" width="140" height="20" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="180" y1="120" x2="180" y2="490" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" />
                {Array.from({ length: 11 }).map((_, i) => (
                  <g key={i} transform={`translate(0, ${130 + i * 32})`}>
                    <rect x="108" y="0" width="28" height="22" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <rect x="140" y="0" width="28" height="22" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <rect x="192" y="0" width="28" height="22" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <rect x="224" y="0" width="28" height="22" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                  </g>
                ))}
                {[
                  { x: 74, y: 110, w: 18, h: 62 },
                  { x: 268, y: 110, w: 18, h: 62 },
                  { x: 74, y: 440, w: 18, h: 62 },
                  { x: 268, y: 440, w: 18, h: 62 },
                ].map((w, idx) => (
                  <rect key={idx} x={w.x} y={w.y} width={w.w} height={w.h} fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                ))}
              </g>
            )}

            {showPowertrain && (
              <g>
                <rect x="135" y="495" width="90" height="58" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                <line x1="180" y1="495" x2="180" y2="471" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="180" cy="471" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="92" y1="471" x2="268" y2="471" stroke="#38bdf8" strokeWidth="3" />
              </g>
            )}

            {showThermal && (
              <g>
                <rect x="140" y="240" width="80" height="60" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="180" cy="270" r="18" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 2" />
                <path d="M180,300 L180,495" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
              </g>
            )}
          </g>
        )}
      </g>
    );
  },
  (prev, next) =>
    prev.vehicleId === next.vehicleId &&
    prev.layers.chassis === next.layers.chassis &&
    prev.layers.powertrain === next.layers.powertrain &&
    prev.layers.thermal === next.layers.thermal
);

