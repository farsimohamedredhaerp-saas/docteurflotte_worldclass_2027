'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { CopilotClient } from '../../../lib/api-copilot';
import {
  Message,
  CopilotInsightItem,
  CopilotActionSuggestion,
  OllamaStatusResponse,
} from '../types';
import { DEFAULT_AI_STATUS, buildInitialWelcomeMessage } from '../constants';

export function useCopilotData(initialQuery?: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([buildInitialWelcomeMessage()]);
  const [inputValue, setInputValue] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<CopilotInsightItem[]>([]);
  const [aiStatus, setAiStatus] = useState<OllamaStatusResponse>(DEFAULT_AI_STATUS);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadAiStatus = useCallback(async (token?: string) => {
    try {
      const status = await CopilotClient.getAiStatus(token);
      setAiStatus(status);
    } catch {
      // Fallback gracieux
    }
  }, []);

  const loadInsights = useCallback(async (token: string) => {
    try {
      const data = await CopilotClient.getInsights(token);
      setInsights(data);
    } catch {
      // Fallback gracieux
    }
  }, []);

  useEffect(() => {
    const s = AuthClient.getSession();
    if (s.token) {
      setSessionToken(s.token);
      loadInsights(s.token);
      loadAiStatus(s.token);
    } else {
      loadAiStatus();
    }
  }, [loadInsights, loadAiStatus]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputValue;
    if (!query.trim() || !sessionToken || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await CopilotClient.ask({ prompt: query }, sessionToken);
      if (res.aiSource) {
        setAiStatus((prev) => ({
          ...prev,
          available: res.aiSource === 'OLLAMA_QWEN_LOCAL',
          mode: res.aiSource || prev.mode,
          model: res.aiModel || prev.model,
        }));
      }
      setMessages([
        ...newMessages,
        {
          id: res.id,
          sender: 'copilot',
          text: res.answer,
          responsePayload: res,
          timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          sender: 'copilot',
          text: `Désolé, une erreur s'est produite lors de l'analyse : ${msg}`,
          timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: CopilotActionSuggestion) => {
    if (!sessionToken) return;
    try {
      const res = await CopilotClient.approveAction(
        action.id,
        `Validation formelle via le Copilote (Human-in-the-Loop) pour ${action.assetName}`,
        sessionToken
      );
      action.status = 'EXECUTED';
      const codeMsg = res.confirmationCode ? ` [Code ANPDP : ${res.confirmationCode}]` : '';
      setActionFeedback(`Action validée avec succès ! ${res.message}${codeMsg} (Réf : ${res.generatedWorkOrderId})`);
      setTimeout(() => setActionFeedback(null), 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionFeedback(`Erreur lors de l'exécution : ${msg}`);
    }
  };

  const handleRejectAction = async (action: CopilotActionSuggestion) => {
    if (!sessionToken) return;
    try {
      await CopilotClient.rejectAction(
        action.id,
        `Rejeté manuellement par l'opérateur de parc`,
        sessionToken
      );
      action.status = 'REJECTED';
      setActionFeedback(`Action ${action.id} rejetée avec succès et consignée dans le registre d'audit.`);
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionFeedback(`Erreur lors du rejet : ${msg}`);
    }
  };

  return {
    sessionToken,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    insights,
    aiStatus,
    actionFeedback,
    setActionFeedback,
    chatBottomRef,
    handleSendMessage,
    handleExecuteAction,
    handleRejectAction,
  };
}

