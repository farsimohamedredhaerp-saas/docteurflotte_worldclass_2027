'use client';

import React from 'react';
import { CopilotChatMessage } from './CopilotChatMessage';
import { CopilotChatThreadProps } from '../types';

export function CopilotChatThread({
  messages,
  isLoading,
  onExecuteAction,
  onRejectAction,
  bottomRef,
}: CopilotChatThreadProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {messages.map((msg) => (
        <CopilotChatMessage
          key={msg.id}
          message={msg}
          onExecuteAction={onExecuteAction}
          onRejectAction={onRejectAction}
        />
      ))}

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '13px' }}>
          <span className="df-pulse-live" />
          <span>DocteurFlotte Copilot interroge la télématique et calcule les équations physiques...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

