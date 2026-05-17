import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  const { title, description, category, priority } = await req.json();

  if (!title && !description) {
    return jsonResponse({ error: 'Ticket title or description is required' }, 400);
  }

  const prompt = `
You are an AI service desk analyst for a managed service provider.
Summarize the support ticket and suggest a category and priority.

Ticket:
Title: ${title ?? ''}
Current category: ${category ?? 'None'}
Current priority: ${priority ?? 'None'}
Description:
${description ?? 'No description provided.'}

Return strict JSON with:
{
  "summary": "2-3 sentence plain-English summary",
  "category": "Password Reset | Software Issue | Hardware Issue | Network Issue | Other",
  "priority": "low | medium | high | urgent",
  "reasoning": "one short sentence explaining the recommendation"
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
      messages: [
        {
          role: 'system',
          content:
            'You classify IT support tickets. Return only valid JSON and no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
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

  return jsonResponse(JSON.parse(content));
});
