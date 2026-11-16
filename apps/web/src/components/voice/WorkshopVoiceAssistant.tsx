'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Wrench,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Clock,
  Gauge,
  BookOpen,
} from 'lucide-react';

interface VoiceResult {
  originalTranscript: string;
  normalizedIntent: string;
  isDeterministicShortCircuit: boolean;
  vehicleDetected?: string;
  subsystemDetected?: string;
  spokenResponseFr: string;
  spokenResponseDarja: string;
  structuredData?: Record<string, unknown>;
  sourceManualReference?: string;
  executionMs: number;
}

const DARJA_PRESET_PHRASES = [
  { label: 'Zeyer culasse Kerax 440', query: 'kifech zeyer culasse ta3 kerax 440' },
  { label: 'Chhal zit Shacman WP12', query: 'chhal zit moteur shacman wp12 saharienne' },
  { label: 'Injecteur m’grippi Actros', query: '3andi injecteur mgrippi fel actros' },
  { label: 'Disques farih plaquettes', query: 'disques farih plaquettes usure cote' },
  { label: 'Seuil freinage ENACTA', query: 'seuil desequilibre frein enacta visite' },
];

interface ISpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export function WorkshopVoiceAssistant({ token }: { token?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('kifech zeyer culasse ta3 kerax 440');
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<'FR' | 'DARJA'>('FR');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Initialisation Web Speech Recognition si supporté
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const speechWin = window as unknown as IWindowWithSpeech;
      const SpeechRecognition =
        speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'fr-DZ';

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          const spokenText = event.results[0][0].transcript;
          setTranscript(spokenText);
          setIsListening(false);
          handleSendVoiceQuery(spokenText);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("La reconnaissance vocale de votre navigateur n'est pas activée. Utilisez les exemples rapides ci-dessous.");
      }
    }
  };

  const handleSendVoiceQuery = async (queryText?: string) => {
    const textToSend = queryText || transcript;
    if (!textToSend.trim()) return;

    setIsProcessing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/workshop-voice/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcribedText: textToSend,
          preferredLanguage: selectedVoiceLanguage === 'FR' ? 'FR' : 'DARJA_PHONETIC',
        }),
      });

      if (res.ok) {
        const data: VoiceResult = await res.json();
        setResult(data);
        speakResponse(data);
      }
    } catch (err) {
      console.error('Erreur query vocale atelier:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (voiceResult: VoiceResult) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak =
        selectedVoiceLanguage === 'FR'
          ? voiceResult.spokenResponseFr
          : voiceResult.spokenResponseDarja;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = selectedVoiceLanguage === 'FR' ? 'fr-FR' : 'ar-XA';
      utterance.rate = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--df-bg-surface-1)',
        color: 'var(--df-text-main)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-xl)',
        padding: '24px',
        boxShadow: 'var(--df-shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ── EN-TÊTE ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--df-border-subtle)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--df-accent-blue-subtle)',
              border: '1px solid var(--df-accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--df-accent-blue)',
            }}
          >
            <Mic size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Pilier 5 : Assistant Vocal Atelier &amp; Glossaire Darja Algérienne
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--df-status-ok-bg)',
                  color: 'var(--df-status-ok-text)',
                  border: '1px solid var(--df-status-ok-border)',
                }}
              >
                Short-Circuit Déterministe &lt; 50 ms
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
              Mains libres pour mécaniciens en fosse d'atelier. Traduction phonétique Darja &rarr; Spécifications constructeurs exactes.
            </div>
          </div>
        </div>

        {/* Bascule restitution vocale */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--df-bg-surface-2)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--df-border-subtle)',
            gap: '6px',
          }}
        >
          <button
            onClick={() => setSelectedVoiceLanguage('FR')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '6px',
              border: selectedVoiceLanguage === 'FR' ? '1px solid var(--df-accent-blue)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: selectedVoiceLanguage === 'FR' ? 'var(--df-accent-blue)' : 'transparent',
            }}
          >
            <span style={{ color: selectedVoiceLanguage === 'FR' ? 'var(--df-text-on-accent)' : 'var(--df-text-secondary)', fontWeight: 800 }}>
              FR • Français Technique
            </span>
          </button>
          <button
            onClick={() => setSelectedVoiceLanguage('DARJA')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '6px',
              border: selectedVoiceLanguage === 'DARJA' ? '1px solid var(--df-status-ok)' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: selectedVoiceLanguage === 'DARJA' ? 'var(--df-status-ok)' : 'transparent',
            }}
          >
            <span style={{ color: selectedVoiceLanguage === 'DARJA' ? 'var(--df-text-on-accent)' : 'var(--df-text-secondary)', fontWeight: 800 }}>
              DZ • Darja Phonétique
            </span>
          </button>
        </div>
      </div>

      {/* ── COMMANDE VOCALE & EXEMPLES ATELIER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleListening}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: isListening ? 'var(--df-status-danger)' : 'var(--df-accent-blue)',
              color: 'var(--df-text-on-accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 12px var(--df-status-danger)' : '0 2px 6px rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
            }}
            title={isListening ? 'Arrêter écoute' : 'Parler au micro'}
          >
            {isListening ? <MicOff size={22} className="animate-pulse" /> : <Mic size={22} />}
          </button>

          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendVoiceQuery()}
            placeholder="Ex: kifech zeyer culasse kerax, chhal zit shacman, injecteur mgrippi..."
            style={{
              flex: 1,
              backgroundColor: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-main)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
            }}
          />

          <button
            onClick={() => handleSendVoiceQuery()}
            disabled={isProcessing}
            style={{
              padding: '12px 22px',
              backgroundColor: 'var(--df-status-ok)',
              color: 'var(--df-text-on-accent)',
              border: '1px solid var(--df-status-ok)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--df-text-on-accent)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} />
              {isProcessing ? 'Résolution...' : 'Interroger'}
            </span>
          </button>
        </div>

        {/* Presets rapides de phrases Darja */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wrench size={13} style={{ color: 'var(--df-text-muted)' }} /> Phrases Terrains :
          </span>
          {DARJA_PRESET_PHRASES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(preset.query);
                handleSendVoiceQuery(preset.query);
              }}
              style={{
                backgroundColor: 'var(--df-bg-surface-2)',
                color: 'var(--df-text-main)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <span style={{ color: 'var(--df-text-main)', fontWeight: 800 }}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RÉSULTAT VOCAL DÉTERMINISTE ── */}
      {result && (
        <div
          style={{
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* En-tête du résultat */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              borderBottom: '1px solid var(--df-border-subtle)',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="df-mono"
                style={{
                  backgroundColor: 'var(--df-bg-surface-3)',
                  color: 'var(--df-text-main)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {result.vehicleDetected || 'FLOTTE DZ'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--df-text-main)' }}>
                {result.normalizedIntent}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="df-mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'var(--df-status-ok-bg)',
                  color: 'var(--df-status-ok-text)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--df-status-ok-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={11} />
                <span>Résolu en {result.executionMs} ms (Zéro LLM)</span>
              </span>
              <button
                onClick={() => speakResponse(result)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  backgroundColor: 'var(--df-accent-blue)',
                  color: 'var(--df-text-on-accent)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Volume2 size={13} />
                <span style={{ color: 'var(--df-text-on-accent)' }}>{isSpeaking ? 'Lecture en cours...' : 'Réécouter'}</span>
              </button>
            </div>
          </div>

          {/* Restitutions Vocales Bilingues */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-accent-blue)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
                Consigne Orale — Français Technique :
              </div>
              <div style={{ fontSize: '13px', color: 'var(--df-text-main)', lineHeight: '1.5', fontWeight: 500 }}>
                {result.spokenResponseFr}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-status-ok-border)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok-text)', marginBottom: '6px' }}>
                Consigne Orale — Darja Phonétique :
              </div>
              <div style={{ fontSize: '13px', color: 'var(--df-text-main)', lineHeight: '1.5', fontWeight: 500 }}>
                {result.spokenResponseDarja}
              </div>
            </div>
          </div>

          {/* Spécifications numériques sous-jacentes */}
          {result.structuredData && Object.keys(result.structuredData).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--df-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                }}
              >
                <Gauge size={13} style={{ color: 'var(--df-status-ok)' }} />
                Données Numériques Officielles Extraites :
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '8px',
                }}
              >
                {Object.entries(result.structuredData).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      backgroundColor: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="df-mono" style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
                      {k.replace(/_/g, ' ')} :
                    </span>
                    <strong className="df-mono" style={{ fontSize: '12px', color: 'var(--df-status-ok)' }}>
                      {String(v)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.sourceManualReference && (
            <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BookOpen size={13} style={{ color: 'var(--df-text-muted)' }} /> Source : <strong style={{ color: 'var(--df-text-main)' }}>{result.sourceManualReference}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

