'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanRawFrame } from './types';
import { IconTerminal, IconRefreshCw } from '../navigation/TechIcons';

interface LiveCanConsoleProps {
  frames: CanRawFrame[];
}

export function LiveCanConsole({ frames }: LiveCanConsoleProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll au bas lors de l'arrivée de nouvelles trames
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [frames, autoScroll]);

  const copyFramePayload = (frame: CanRawFrame) => {
    navigator.clipboard.writeText(
      `${frame.timestamp} | ${frame.canIdHex} | PGN ${frame.pgn} (${frame.name}) | ${frame.payloadHex} | ${frame.decodedField}`
    );
    setCopiedId(frame.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      className="rounded-sm overflow-hidden flex flex-col h-[220px]"
      style={{
        backgroundColor: 'var(--df-cockpit-sidebar-bg)',
        border: '1px solid var(--df-cockpit-border)',
      }}
    >
      {/* En-tête de la console */}
      <div
        className="h-7 px-2.5 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderBottom: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <IconTerminal size={12} className="text-emerald-500" />
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-wider"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            Live CAN-bus J1939 Frame Inspector
          </span>
          <span
            className="text-[9px] font-mono px-1 py-0.2 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-card-hover)',
              color: 'var(--df-cockpit-text-muted)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            {frames.length} trames
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label
            className="flex items-center gap-1 text-[9px] font-mono cursor-pointer select-none"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 rounded-xs text-blue-600 focus:ring-0"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Tableau Déroulant des Trames Hex */}
      <div
        ref={consoleRef}
        onMouseEnter={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
        className="flex-1 overflow-y-auto font-mono text-[10px] tabular-nums p-1 scrollbar-thin select-text"
      >
        {frames.length === 0 ? (
          <div
            className="p-4 text-center font-mono text-[11px]"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            En attente de réception des premières trames J1939...
          </div>
        ) : (
          frames.map((frame) => {
            const isCopied = copiedId === frame.id;
            return (
              <div
                key={frame.id}
                onClick={() => copyFramePayload(frame)}
                className="py-0.5 px-1.5 flex items-center justify-between cursor-pointer transition-colors"
                style={{
                  backgroundColor: isCopied
                    ? 'var(--df-accent-blue-subtle)'
                    : 'transparent',
                  color: isCopied
                    ? 'var(--df-accent-blue)'
                    : 'var(--df-cockpit-text-body)',
                  borderBottom: '1px solid var(--df-cockpit-border)',
                }}
                title="Cliquer pour copier la trame complète"
              >
                {/* Timestamp & CAN ID */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    {frame.timestamp}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{frame.canIdHex}</span>
                  <span
                    className="px-1 py-0.2 rounded-xs text-[8px]"
                    style={{
                      backgroundColor: 'var(--df-cockpit-card-bg)',
                      border: '1px solid var(--df-cockpit-border)',
                      color: 'var(--df-cockpit-text-muted)',
                    }}
                  >
                    PGN {frame.pgn}
                  </span>
                  <span className="font-bold text-[9px] text-amber-600 dark:text-amber-400">
                    {frame.name}
                  </span>
                </div>

                {/* Hex Payload & Decoded Interpretation */}
                <div className="flex items-center gap-2 text-right">
                  <span
                    className="tracking-wider hidden sm:inline"
                    style={{ color: 'var(--df-cockpit-text-muted)' }}
                  >
                    [{frame.payloadHex}]
                  </span>
                  <span
                    className="font-bold px-1 rounded-xs border text-[9px]"
                    style={{
                      backgroundColor: 'var(--df-status-ok-bg)',
                      border: '1px solid var(--df-status-ok-border)',
                      color: 'var(--df-status-ok-text)',
                    }}
                  >
                    {frame.decodedField}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer console */}
      <div
        className="h-5 px-2 text-[8px] font-mono flex items-center justify-between"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderTop: '1px solid var(--df-cockpit-border)',
          color: 'var(--df-cockpit-text-muted)',
        }}
      >
        <span>Baudrate: 250 kbps (J1939 Nominal)</span>
        <span>Filter: Strict failover local sans PII</span>
      </div>
    </div>
  );
}
