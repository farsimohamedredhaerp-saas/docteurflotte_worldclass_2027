'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { IconFileText, IconCheck } from '@/components/navigation/TechIcons';
import type { DeviceItem, TelecomOperator } from '../../types';

interface ConfigGeneratorModalProps {
  device: DeviceItem | null;
  isOpen: boolean;
  onClose: () => void;
  selectedOperator: TelecomOperator;
  onOperatorChange: (operator: TelecomOperator) => void;
  serverHost: string;
  onServerHostChange: (host: string) => void;
  generatedCommand: string;
  onCopyCommand: () => void;
  copied: boolean;
}

export function ConfigGeneratorModal({
  device,
  isOpen,
  onClose,
  selectedOperator,
  onOperatorChange,
  serverHost,
  onServerHostChange,
  generatedCommand,
  onCopyCommand,
  copied,
}: ConfigGeneratorModalProps) {
  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={device.name}
      subtitle="Générateur de Paramètres SMS / GPRS"
      size="lg"
      footer={
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-medium)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      }
    >
      <div>
        {/* Inputs Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
              Opérateur Télécom (Carte SIM) :
            </label>
            <select
              value={selectedOperator}
              onChange={(e) => onOperatorChange(e.target.value as TelecomOperator)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--df-border-medium)',
                background: 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '13px',
              }}
            >
              <option value="mobilis">Mobilis (APN : internet)</option>
              <option value="ooredoo">Ooredoo (APN : internet)</option>
              <option value="djezzy">Djezzy (APN : djezzy.internet)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
              Hôte ou IP du Serveur DocteurFlotte :
            </label>
            <input
              type="text"
              value={serverHost}
              onChange={(e) => onServerHostChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--df-border-medium)',
                background: 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Generated Command Box */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
              Commande SMS / GPRS Prête à Envoyer :
            </span>
            <button
              onClick={onCopyCommand}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
                color: copied ? '#6ee7b7' : '#7dd3fc',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <IconCheck size={12} /> : <IconFileText size={12} />}
              {copied ? 'Copié !' : 'Copier la Commande'}
            </button>
          </div>
          <pre
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#6ee7b7',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {generatedCommand}
          </pre>
        </div>

        {/* Instruction Steps */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '12.5px',
            color: 'var(--df-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '10px',
          }}
        >
          <strong>Procédure d’Activation :</strong>
          <ol style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
            <li>Insérez la carte SIM dans le boîtier (désactivez préalablement le code PIN).</li>
            <li>Envoyez la commande ci-dessus par SMS au numéro de la carte SIM depuis votre smartphone.</li>
            <li>
              Dès réception de la réponse <em>OK / Success</em>, rendez-vous sur{' '}
              <Link href="/telematics" style={{ color: '#818cf8', textDecoration: 'underline' }}>
                la Console Télématique
              </Link>{' '}
              pour appairer le numéro IMEI au véhicule correspondant.
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}

