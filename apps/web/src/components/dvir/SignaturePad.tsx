'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  driverName?: string;
  language?: 'fr' | 'ar';
}

export function SignaturePad({
  value,
  onChange,
  driverName = 'Chauffeur / Opérateur',
  language = 'fr',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    setTimestamp(new Date().toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ'));
  }, [language]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support DPI élevé pour netteté sur écrans mobiles Retina / OLED
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8'; // Couleur cyan distincte DocteurFlotte
    ctx.lineWidth = 2.5;

    // Si on a déjà une valeur restaurée
    if (value && !hasSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, hasSignature]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange(null);
  };

  const t = {
    fr: {
      title: 'Signature Tactile du Chauffeur / Visiteur Technique',
      subtitle: 'Signer du doigt ou au stylet dans la zone ci-dessous (Engagement légal DVIR)',
      placeholder: '✍️ Tracez votre signature ici...',
      certifiedBy: 'Certifié par :',
      clear: 'Effacer la signature',
      signed: '✓ Signature capturée',
      empty: 'Signature requise avant départ',
      legalNote: 'Horodatage sécurisé • Loi 18-07 ANPDP & Décret Exécutif 03-223',
    },
    ar: {
      title: 'التوقيع الرقمي الميداني للسائق / الفاحص التقني',
      subtitle: 'وقع بإصبعك أو بالقلم في المربع أدناه (مصادقة قانونية على الفحص)',
      placeholder: '✍️ ضع إمضاءك هنا...',
      certifiedBy: 'مصادق من طرف :',
      clear: 'مسح التوقيع',
      signed: '✓ تم تسجيل الإمضاء',
      empty: 'التوقيع إلزامي قبل الانطلاق',
      legalNote: 'بصمة زمنية مشفرة • القانون 18-07 والمرسوم التنفيذي 03-223',
    },
  }[language];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        padding: '0.9rem',
        background: 'var(--df-bg-surface-3)',
        borderRadius: 'var(--df-radius-sm)',
        border: `1px solid ${hasSignature ? 'rgba(56, 189, 248, 0.4)' : 'var(--df-border-subtle)'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
            {t.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
            {t.subtitle}
          </div>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--df-radius-xs)',
            background: hasSignature ? 'var(--df-status-ok-bg)' : 'var(--df-status-warning-bg)',
            color: hasSignature ? 'var(--df-status-ok-text)' : 'var(--df-status-warning-text)',
            border: `1px solid ${hasSignature ? 'var(--df-status-ok-border)' : 'var(--df-status-warning-border)'}`,
          }}
        >
          {hasSignature ? t.signed : t.empty}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          background: 'var(--df-bg-surface-1)',
          borderRadius: 'var(--df-radius-xs)',
          border: '1px dashed var(--df-border-medium)',
          overflow: 'hidden',
          touchAction: 'none', // Empêche le défilement pendant la signature sur mobile
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'var(--df-text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              pointerEvents: 'none',
              opacity: 0.6,
              textAlign: 'center',
            }}
          >
            {t.placeholder}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
          <strong style={{ color: 'var(--df-text-secondary)' }}>{t.certifiedBy}</strong> {driverName} •{' '}
          <span className="df-mono">{timestamp}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasSignature && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                fontSize: '0.72rem',
                color: 'var(--df-status-danger)',
                background: 'transparent',
                border: '1px solid var(--df-status-danger)',
                padding: '3px 8px',
                borderRadius: 'var(--df-radius-xs)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🗑️ {t.clear}
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '0.3rem' }}>
        🛡️ {t.legalNote}
      </div>
    </div>
  );
}

