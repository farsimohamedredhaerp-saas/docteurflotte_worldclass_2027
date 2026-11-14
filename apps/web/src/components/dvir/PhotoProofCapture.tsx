'use client';

import React, { useRef, useState } from 'react';
import { IconCamera, IconX, IconCheck, IconActivity } from '../navigation/TechIcons';

interface PhotoProofCaptureProps {
  itemCode: string;
  itemLabel: string;
  photoUrl?: string;
  onChange: (photoUrl: string | undefined) => void;
  language?: 'fr' | 'ar';
}

/**
 * Compresse une image côté client via Canvas HTML5 pour réduire la taille à ~40-80 Ko.
 * Indispensable pour la synchronisation Store-and-Forward en zone saharienne 2G/3G.
 */
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context non disponible'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Exporter en JPEG compressé
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoProofCapture({
  itemCode,
  itemLabel,
  photoUrl,
  onChange,
  language = 'fr',
}: PhotoProofCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const t = {
    fr: {
      attachPhoto: 'Photo de Preuve (Appareil Photo / Galerie)',
      compressing: 'Compression de la photo en cours...',
      remove: 'Supprimer',
      view: 'Agrandir',
      sizeNote: 'Compressé automatiquement < 80 Ko pour réseau saharien',
      modalClose: 'Fermer',
    },
    ar: {
      attachPhoto: 'صورة إثبات العطب (كاميرا / معرض الصور)',
      compressing: 'جاري ضغط الصورة محلياً...',
      remove: 'حذف',
      view: 'تكبير',
      sizeNote: 'مضغوطة تلقائياً أقل من 80 ك.ب لشبكات الصحراء',
      modalClose: 'إغلاق',
    },
  }[language];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 800, 0.7);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('[PhotoProofCapture] Erreur compression:', err);
    } finally {
      setIsCompressing(false);
      // Réinitialiser l'input pour permettre de reprendre la même photo si besoin
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Sur mobile, active la caméra arrière en priorité
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id={`photo-input-${itemCode}`}
      />

      {!photoUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--df-radius-xs)',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              fontSize: '0.75rem',
              color: 'var(--df-text-secondary)',
              cursor: isCompressing ? 'wait' : 'pointer',
              fontWeight: 600,
              transition: 'all var(--df-transition-fast)',
            }}
          >
            {isCompressing ? (
              <>
                <IconActivity size={12} className="inline animate-spin mr-1 text-cyan-400" />
                {t.compressing}
              </>
            ) : (
              <>
                <IconCamera size={13} className="inline mr-1 text-slate-400" />
                {t.attachPhoto}
              </>
            )}
          </button>
          <span style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>
            {t.sizeNote}
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.4rem 0.6rem',
            background: 'var(--df-bg-surface-1)',
            borderRadius: 'var(--df-radius-xs)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            maxWidth: '360px',
          }}
        >
          <img
            src={photoUrl}
            alt={`Preuve ${itemLabel}`}
            onClick={() => setPreviewOpen(true)}
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid var(--df-border-medium)',
              cursor: 'pointer',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--df-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconCamera size={13} className="text-slate-400" /> Photo attachée
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--df-status-ok)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconCheck size={12} className="text-emerald-500" /> Preuve JPEG compressée
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              style={{
                fontSize: '0.7rem',
                color: 'var(--df-accent-cyan)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 4px',
              }}
            >
              {t.view}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                fontSize: '0.7rem',
                color: 'var(--df-status-danger)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <IconX size={12} /> {t.remove}
            </button>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX POUR AGRANDIR LA PHOTO */}
      {previewOpen && photoUrl && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: 'var(--df-bg-surface-2)',
              padding: '1rem',
              borderRadius: 'var(--df-radius-md)',
              border: '1px solid var(--df-border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--df-text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconCamera size={15} className="text-cyan-400" /> Preuve photographique : {itemLabel}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--df-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <IconX size={16} />
              </button>
            </div>

            <img
              src={photoUrl}
              alt={itemLabel}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: 'var(--df-radius-sm)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--df-radius-xs)',
                  background: 'var(--df-bg-surface-3)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                {t.modalClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

