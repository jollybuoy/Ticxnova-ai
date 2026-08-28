import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Bot, ShieldCheck, Sparkles, Trash2, Zap } from 'lucide-react';
import { ChatInput } from '../components/ai/ChatInput';
import { ChatMessage } from '../components/ai/ChatMessage';
import { SuggestedPrompts } from '../components/ai/SuggestedPrompts';
import { TypingIndicator } from '../components/ai/TypingIndicator';
import { AiInsightPanel } from '../components/ai/AiInsightPanel';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { useTickets } from '../hooks/useTickets';
import { useDevices } from '../hooks/useDevices';
import { getSlaRiskTickets, getUnassignedTickets } from '../lib/tickets/queueMetrics';
import { getFleetBreakdown } from '../lib/devices/fleetMetrics';

export default function AIAssistant() {
  const navigate = useNavigate();
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
  const { tickets } = useTickets();
  const { devices } = useDevices();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const initialPromptSent = useRef(false);

  const slaRisk = useMemo(() => getSlaRiskTickets(tickets).length, [tickets]);
  const unassigned = useMemo(() => getUnassignedTickets(tickets).length, [tickets]);
  const fleet = useMemo(() => getFleetBreakdown(devices), [devices]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (!prompt || initialPromptSent.current) return;
    initialPromptSent.current = true;
    sendMessage(prompt);
    setSearchParams({}, { replace: true });
  }, [searchParams, sendMessage, setSearchParams]);

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[680px] flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">AI Assistant</h1>
          <p className="mt-1 text-sm text-zinc-400">Troubleshoot issues and hand off tickets with the same workspace intelligence.</p>
        </div>
        <Button variant="secondary" onClick={clearConversation}>
          <Trash2 size={16} />
          Clear conversation
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card hover={false} className="flex min-h-0 flex-col overflow-hidden p-0">
          <CardHeader
            title="Ticxnova Copilot"
            subtitle="IT operations assistant"
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                Online
              </span>
            }
          />
          <CardBody className="flex min-h-0 flex-1 flex-col !p-0">
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
            <div className="border-t border-white/15 p-4 sm:p-5">
              <ChatInput onSend={sendMessage} loading={loading} />
            </div>
          </CardBody>
        </Card>

        <aside className="min-h-0 space-y-4 overflow-y-auto">
          <AiInsightPanel
            title="Operations intelligence"
            subtitle="Live queue and fleet signals"
            gauges={[
              { label: 'SLA risk', value: slaRisk, max: Math.max(5, slaRisk + 3), display: slaRisk, color: '#fb7185' },
              { label: 'Unassigned', value: unassigned, max: Math.max(5, unassigned + 3), display: unassigned, color: '#fb923c' },
              { label: 'At-risk devices', value: fleet.unmanagedRisk, max: Math.max(5, fleet.total || 5), display: fleet.unmanagedRisk, color: '#8b5cf6' },
            ]}
            alerts={[
              slaRisk > 0 && { id: 'sla', tone: 'red', label: 'Tickets near SLA', value: slaRisk },
              unassigned > 0 && { id: 'queue', tone: 'orange', label: 'Unassigned tickets', value: unassigned },
              fleet.unmanagedRisk > 0 && { id: 'fleet', tone: 'yellow', label: 'Devices needing review', value: fleet.unmanagedRisk },
            ].filter(Boolean)}
            cta="Review recommendations"
            onCta={() => navigate('/tickets?quick=sla')}
          />

          <SuggestedPrompts onSelect={sendMessage} disabled={loading} />

          <Card hover={false} className="p-0">
            <CardHeader title="Copilot capabilities" subtitle="MSP-grade guidance" />
            <CardBody className="space-y-4">
              {[
                { icon: Sparkles, title: 'Step-by-step guidance', body: 'Clear troubleshooting for common IT incidents.' },
                { icon: ShieldCheck, title: 'Enterprise-aware', body: 'Keeps identity, endpoint, and security practice in view.' },
                { icon: Zap, title: 'Ticket handoff', body: 'Propose a ticket when the issue needs a human owner.' },
                { icon: BookOpen, title: 'Knowledge base aware', body: 'Prioritizes published runbooks in answers.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-violet-500/15 text-violet-300">
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

          <Card hover={false} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-blue-500/15 text-blue-300">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Secure AI routing</p>
                <p className="mt-1 text-xs text-zinc-500">Model calls run through Supabase Edge Functions only.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
