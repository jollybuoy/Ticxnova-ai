import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (item): item is ChatMessage =>
        item &&
        typeof item === 'object' &&
        (item as ChatMessage).role !== undefined &&
        ['user', 'assistant'].includes((item as ChatMessage).role) &&
        typeof (item as ChatMessage).content === 'string',
    )
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 2500),
    }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured' }, 500);
  }

  let payload: { message?: string; history?: unknown };
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const message = payload.message?.trim();
  if (!message) {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  const history = sanitizeHistory(payload.history);

  const systemPrompt = `
You are Ticxnova-AI Copilot, an enterprise IT support assistant for a Managed Service Provider SaaS platform.

Behavior:
- Help troubleshoot IT, identity, endpoint, network, Microsoft 365, VPN, MFA, Teams, Outlook, device, and software issues.
- Give concise, professional, step-by-step guidance.
- Explain likely causes clearly without being verbose.
- Ask at most one clarifying question when required.
- Recommend escalation or ticket creation when the issue is unresolved, recurring, security-sensitive, device-impacting, or requires technician access.
- You cannot create tickets yourself. Never say a ticket has been created. If a ticket is needed, say you recommend creating one.
- Detect when the user is describing a support issue. For unresolved support issues, set shouldCreateTicket true and create a complete ticketDraft.
- If the user is only asking a how-to question and the issue appears resolved through guidance, set shouldCreateTicket false.
- Never invent tenant-specific facts, credentials, device names, or policy settings.

Return strict JSON only:
{
  "response": "professional answer in concise paragraphs or numbered steps",
  "shouldCreateTicket": true | false,
  "ticketDraft": {
    "title": "short ticket title",
    "description": "issue summary and troubleshooting context for the ticket body",
    "summary": "1-2 sentence business-ready ticket summary",
    "category": "Password Reset | Software Issue | Hardware Issue | Network Issue | Other",
    "priority": "low | medium | high | urgent",
    "department": "IT Operations | Security | Network Operations | End User Computing | Collaboration"
  } | null
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message.slice(0, 4000) },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return jsonResponse({ error: 'OpenAI request failed', details }, 502);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return jsonResponse({ error: 'OpenAI returned an empty response' }, 502);
  }

  try {
    const parsed = JSON.parse(content);
    return jsonResponse({
      response:
        parsed.response ??
        'I reviewed the issue, but I could not generate a complete response. Please try again.',
      shouldCreateTicket: Boolean(parsed.shouldCreateTicket),
      ticketDraft: parsed.shouldCreateTicket ? parsed.ticketDraft ?? null : null,
    });
  } catch (_error) {
    return jsonResponse({ error: 'OpenAI returned invalid JSON' }, 502);
  }
});
