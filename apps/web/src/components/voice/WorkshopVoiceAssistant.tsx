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
  structuredData?: Record<string, any>;
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

export function WorkshopVoiceAssistant({ token }: { token?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('kifech zeyer culasse ta3 kerax 440');
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<'FR' | 'DARJA'>('FR');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialisation Web Speech Recognition si supporté
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'fr-DZ';

        recognition.onresult = (event: any) => {
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
        background: '#FFFFFF',
        color: '#0F172A',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}
          >
            <Mic size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Pilier 5 : Assistant Vocal Atelier &amp; Glossaire Darja Algérienne
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}
              >
                Short-Circuit Déterministe &lt; 50 ms
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Mains libres pour mécaniciens en fosse d'atelier. Traduction phonétique Darja &rarr; Spécifications constructeurs exactes.
            </div>
          </div>
        </div>

        {/* Bascule restitution vocale */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
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
              border: selectedVoiceLanguage === 'FR' ? '1px solid #1D4ED8' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: selectedVoiceLanguage === 'FR' ? '#2563EB' : 'transparent',
            }}
          >
            <span style={{ color: selectedVoiceLanguage === 'FR' ? '#FFFFFF' : '#334155', fontWeight: 800 }}>
              🇫🇷 Voix Français
            </span>
          </button>
          <button
            onClick={() => setSelectedVoiceLanguage('DARJA')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '6px',
              border: selectedVoiceLanguage === 'DARJA' ? '1px solid #065F46' : '1px solid transparent',
              cursor: 'pointer',
              backgroundColor: selectedVoiceLanguage === 'DARJA' ? '#059669' : 'transparent',
            }}
          >
            <span style={{ color: selectedVoiceLanguage === 'DARJA' ? '#FFFFFF' : '#334155', fontWeight: 800 }}>
              🇩🇿 Voix Darja Phonétique
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
              backgroundColor: isListening ? '#DC2626' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 12px rgba(220, 38, 38, 0.5)' : '0 2px 6px rgba(37, 99, 235, 0.3)',
              flexShrink: 0,
            }}
            title={isListening ? 'Arrêter écoute' : 'Parler au micro'}
          >
            {isListening ? <MicOff size={22} color="#FFFFFF" className="animate-pulse" /> : <Mic size={22} color="#FFFFFF" />}
          </button>

          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendVoiceQuery()}
            placeholder="Ex: kifech zeyer culasse kerax, chhal zit shacman, injecteur mgrippi..."
            style={{
              flex: 1,
              background: '#F8FAFC',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
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
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: '1px solid #047857',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>
              {isProcessing ? 'Résolution...' : '⚡ Interroger'}
            </span>
          </button>
        </div>

        {/* Presets rapides de phrases Darja */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wrench size={13} color="#475569" /> Phrases Terrains :
          </span>
          {DARJA_PRESET_PHRASES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(preset.query);
                handleSendVoiceQuery(preset.query);
              }}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                border: '1px solid #94A3B8',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RÉSULTAT VOCAL DÉTERMINISTE ── */}
      {result && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
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
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#1E293B',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              >
                {result.vehicleDetected || 'FLOTTE DZ'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                {result.normalizedIntent}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  background: '#ECFDF5',
                  color: '#065F46',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #A7F3D0',
                }}
              >
                ✓ Résolu en {result.executionMs} ms (Zéro LLM)
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
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Volume2 size={13} color="#FFFFFF" />
                <span style={{ color: '#FFFFFF' }}>{isSpeaking ? 'Lecture en cours...' : 'Réécouter'}</span>
              </button>
            </div>
          </div>

          {/* Restitutions Vocales Bilingues */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', marginBottom: '6px' }}>
                🇫🇷 Consigne Orale Français Technique :
              </div>
              <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5', fontWeight: 500 }}>
                {result.spokenResponseFr}
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', marginBottom: '6px' }}>
                🇩🇿 Consigne Orale Phonétique Darja :
              </div>
              <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5', fontWeight: 500 }}>
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
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                }}
              >
                <Gauge size={13} color="#059669" />
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
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      {k.replace(/_/g, ' ')} :
                    </span>
                    <strong style={{ fontSize: '12px', color: '#047857', fontFamily: 'monospace' }}>
                      {String(v)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.sourceManualReference && (
            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BookOpen size={13} color="#64748B" /> Source : <strong>{result.sourceManualReference}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
