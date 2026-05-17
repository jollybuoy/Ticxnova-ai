import { useEffect, useRef } from 'react';
import { Bot, ShieldCheck, Sparkles, Trash2, Zap } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ChatInput } from '../components/ai/ChatInput';
import { ChatMessage } from '../components/ai/ChatMessage';
import { SuggestedPrompts } from '../components/ai/SuggestedPrompts';
import { TypingIndicator } from '../components/ai/TypingIndicator';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { useAIAssistant } from '../hooks/useAIAssistant';

export default function AIAssistant() {
  const {
    messages,
    loading,
    creatingTicketId,
    sendMessage,
    clearConversation,
    createTicketFromMessage,
    prepareTicketProposal,
    declineTicketProposal,
  } = useAIAssistant();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-9rem)] min-h-[680px] flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-label mb-2">Enterprise IT Copilot</p>
            <h1 className="text-display">AI Assistant</h1>
            <p className="text-body mt-2 max-w-2xl">
              Troubleshoot endpoint, identity, collaboration, and network issues with concise MSP-grade guidance.
            </p>
          </div>
          <Button variant="secondary" onClick={clearConversation}>
            <Trash2 size={16} />
            Clear conversation
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[1fr_360px]">
          <Card hover={false} className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader
              title="Ticxnova-AI Copilot"
              subtitle="Professional IT support assistant"
              action={
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Online
                </span>
              }
            />
            <CardBody className="flex min-h-0 flex-1 flex-col p-0">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="mx-auto max-w-4xl space-y-6">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onCreateTicket={createTicketFromMessage}
                      onPrepareTicket={prepareTicketProposal}
                      onDeclineTicket={declineTicketProposal}
                      creatingTicket={creatingTicketId === message.id}
                    />
                  ))}
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="border-t border-white/[0.06] p-4 sm:p-6">
                <ChatInput onSend={sendMessage} loading={loading} />
              </div>
            </CardBody>
          </Card>

          <aside className="space-y-6">
            <SuggestedPrompts onSelect={sendMessage} disabled={loading} />

            <Card hover={false}>
              <CardHeader title="Copilot Capabilities" subtitle="Optimized for MSP support" />
              <CardBody className="space-y-4">
                {[
                  {
                    icon: Sparkles,
                    title: 'Step-by-step guidance',
                    body: 'Clear troubleshooting instructions for common IT support incidents.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Enterprise-aware',
                    body: 'Keeps security, identity, and device management practices in mind.',
                  },
                  {
                    icon: Zap,
                    title: 'Ticket handoff',
                    body: 'Flags unresolved issues and prompts when a ticket should be created.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20">
                      <item.icon size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.body}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Secure AI Routing</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    OpenAI calls run through Supabase Edge Functions only.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
