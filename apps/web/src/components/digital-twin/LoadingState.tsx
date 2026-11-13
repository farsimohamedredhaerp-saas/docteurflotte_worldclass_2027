export function LoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--df-text-muted)' }}
    >
      {label}
    </div>
  );
}

