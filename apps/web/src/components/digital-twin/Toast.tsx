export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--df-toast-bg)',
        color: 'var(--df-toast-text)',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}

