import React from 'react';

export default function MaintenanceLoading() {
  return (
    <div className="min-h-96 space-y-4">
      <div className="df-skeleton" style={{ height: '7rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
      <div className="df-skeleton" style={{ height: '4rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }} />
      <div className="space-y-3">
        <div className="df-skeleton" style={{ height: '6rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }} />
        <div className="df-skeleton" style={{ height: '6rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }} />
        <div className="df-skeleton" style={{ height: '6rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }} />
      </div>
    </div>
  );
}

