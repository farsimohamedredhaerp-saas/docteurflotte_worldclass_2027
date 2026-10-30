import React from 'react';
import Link from 'next/link';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--df-brand-primary), var(--df-accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--df-shadow-glow-blue)',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>DF</span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.5px' }}>
            Docteur<span style={{ color: 'var(--df-accent-cyan)' }}>Flotte</span>
          </span>
        </div>
      </Link>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
        {title}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
};
