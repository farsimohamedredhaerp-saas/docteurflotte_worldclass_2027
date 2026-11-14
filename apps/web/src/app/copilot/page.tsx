'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '../../components/navigation/Navbar';
import { useCopilotFilters } from './hooks/useCopilotFilters';
import { useCopilotData } from './hooks/useCopilotData';
import { CopilotHeader } from './components/CopilotHeader';
import { CopilotChatThread } from './components/CopilotChatThread';
import { CopilotPromptInput } from './components/CopilotPromptInput';
import { CopilotProactiveRail } from './components/CopilotProactiveRail';
import { QUICK_PROMPT_CHIPS } from './constants';
import CopilotLoading from './loading';

const LegacyCopilotPage = dynamic(
  () => import('../_legacy/copilot/page.legacy').then((m) => m.default),
  { ssr: false }
);

function CopilotCockpit() {
  const filters = useCopilotFilters();
  const data = useCopilotData(filters.initialQuery);

  const handleSend = (promptToSend?: string) => {
    data.handleSendMessage(promptToSend);
    if (promptToSend) {
      filters.setQueryParam(promptToSend);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <CopilotHeader aiStatus={data.aiStatus} />

      {data.actionFeedback && (
        <div
          style={{
            maxWidth: '1440px',
            margin: '16px auto 0',
            padding: '12px 20px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#6ee7b7',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          {data.actionFeedback}
        </div>
      )}

      <div
        style={{
          maxWidth: '1440px',
          margin: '20px auto 40px',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            height: '78vh',
            boxShadow: 'var(--df-shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <CopilotChatThread
            messages={data.messages}
            isLoading={data.isLoading}
            onExecuteAction={data.handleExecuteAction}
            onRejectAction={data.handleRejectAction}
            bottomRef={data.chatBottomRef}
          />

          <CopilotPromptInput
            inputValue={data.inputValue}
            onInputChange={data.setInputValue}
            isLoading={data.isLoading}
            onSend={handleSend}
            chips={QUICK_PROMPT_CHIPS}
          />
        </div>

        <CopilotProactiveRail
          insights={data.insights}
          onSelectInsightPrompt={handleSend}
        />
      </div>
    </div>
  );
}

export default function CopilotPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_COPILOT !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyCopilotPage />;
  }

  return (
    <Suspense fallback={<CopilotLoading />}>
      <CopilotCockpit />
    </Suspense>
  );
}
