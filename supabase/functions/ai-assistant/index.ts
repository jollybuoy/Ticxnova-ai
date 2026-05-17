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

type DeviceContext = {
  id: string;
  name: string;
  asset_tag?: string;
  device_type?: string;
  department?: string;
  health_status?: string;
  assigned_user?: string;
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

function sanitizeDeviceContext(value: unknown): DeviceContext[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is DeviceContext => Boolean(item && typeof item === 'object' && (item as DeviceContext).id))
    .slice(0, 20)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name ?? 'Unnamed device').slice(0, 120),
      asset_tag: item.asset_tag ? String(item.asset_tag).slice(0, 80) : undefined,
      device_type: item.device_type ? String(item.device_type).slice(0, 80) : undefined,
      department: item.department ? String(item.department).slice(0, 80) : undefined,
      health_status: item.health_status ? String(item.health_status).slice(0, 40) : undefined,
      assigned_user: item.assigned_user ? String(item.assigned_user).slice(0, 120) : undefined,
    }));
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

  let payload: { message?: string; history?: unknown; deviceContext?: unknown };
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
  const deviceContext = sanitizeDeviceContext(payload.deviceContext);
  const deviceContextText = deviceContext.length
    ? deviceContext
        .map(
          (device) =>
            `- ${device.name} (${device.asset_tag ?? 'no asset tag'}, ${device.device_type ?? 'unknown type'}, ${device.health_status ?? 'unknown health'}, department: ${device.department ?? 'unknown'}, assigned: ${device.assigned_user ?? 'unassigned'}, id: ${device.id})`,
        )
        .join('\n')
    : 'No device inventory context was provided.';

  const systemPrompt = `
You are Ticxnova-AI Copilot, an enterprise IT support assistant for a Managed Service Provider SaaS platform.

Behavior:
- Help troubleshoot IT, identity, endpoint, network, Microsoft 365, VPN, MFA, Teams, Outlook, device, and software issues.
- Always give concise, professional, step-by-step troubleshooting guidance first before any ticket handoff.
- Explain likely causes clearly without being verbose.
- Ask at most one clarifying question when required.
- Recommend escalation or ticket creation when the issue is unresolved, recurring, security-sensitive, device-impacting, or requires technician access.
- You cannot create tickets yourself. Never say a ticket has been created. If a ticket is needed, say you recommend creating one.
- Detect when the user is describing a support issue. For unresolved support issues, set shouldCreateTicket true and create a complete ticketDraft.
- If shouldCreateTicket is true, do not include ticket details in the text response. The frontend will show Create Ticket and No Thanks buttons.
- End the response by saying: "If the issue continues, I can prepare a ticket for your review."
- If the user is only asking a how-to question and the issue appears resolved through guidance, set shouldCreateTicket false.
- Never invent tenant-specific facts, credentials, device names, or policy settings.
- Device inventory context is available below. If the user mentions a device, endpoint, laptop, server, network device, mobile device, asset tag, assigned user, or recurring hardware issue, reference likely matching devices from this context.
- If a ticketDraft is for a specific device, include "device_ids" with matching device IDs. Prefer unhealthy devices or direct name/asset tag matches.
- Use category "Device Request" for device provisioning, refresh, replacement, accessory, repair, or attach-to-device requests. Device Request must always use ticket_type "service_request".
- If repeated failures or unhealthy status are visible, mention replacement review or recurring incident investigation where appropriate.

Device inventory context:
${deviceContextText}

Return strict JSON only:
{
  "response": "professional answer in concise paragraphs or numbered steps",
  "shouldCreateTicket": true | false,
  "ticketDraft": {
    "title": "short ticket title",
    "description": "issue summary and troubleshooting context for the ticket body",
    "summary": "1-2 sentence business-ready ticket summary",
    "category": "Password Reset | Software Issue | Hardware Issue | Device Request | Network Issue | Other",
    "priority": "low | medium | high | urgent",
    "department": "IT Operations | Security | Network Operations | End User Computing | Collaboration",
    "ticket_type": "incident | service_request | problem | change_request",
    "device_ids": ["matching-device-id"]
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
