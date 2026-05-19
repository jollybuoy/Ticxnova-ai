import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEMO_INBOX = 'ticxnova-ai@jollybuoy.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function sendWithResend(payload: Record<string, string>) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Ticxnova <onboarding@resend.dev>';

  if (!apiKey) {
    return { ok: false, reason: 'RESEND_API_KEY is not configured.' };
  }

  const html = `
    <h2>New Ticxnova demo request</h2>
    <p><strong>Name:</strong> ${escapeHtml(payload.fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Company:</strong> ${escapeHtml(payload.company)}</p>
    <p><strong>Team size:</strong> ${escapeHtml(payload.teamSize || '—')}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(payload.message || '—').replaceAll('\n', '<br />')}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [DEMO_INBOX],
      reply_to: payload.email,
      subject: `Demo request — ${payload.company} (${payload.fullName})`,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return { ok: false, reason: errorBody || 'Failed to send email via Resend.' };
  }

  return { ok: true };
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed.' }, 405);
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const countryCode = String(body.countryCode ?? '').trim();
    const phoneNumber = String(body.phoneNumber ?? '').trim();
    const company = String(body.company ?? '').trim();
    const teamSize = String(body.teamSize ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!fullName || !email || !company || !phoneNumber) {
      return jsonResponse({ success: false, message: 'Please complete all required fields.' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, message: 'Please enter a valid work email.' }, 400);
    }

    const phone = `${countryCode || '+1'} ${phoneNumber}`.trim();
    const payload = { fullName, email, phone, company, teamSize, message };

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      await supabase.from('demo_requests').insert({
        full_name: fullName,
        email,
        phone,
        company,
        team_size: teamSize || null,
        message: message || null,
      });
    }

    const emailResult = await sendWithResend(payload);
    if (!emailResult.ok) {
      const storedOnly = Boolean(supabaseUrl && serviceRoleKey);
      if (storedOnly) {
        return jsonResponse({
          success: true,
          message:
            'Your demo request was received. Our team will contact you shortly. (Email delivery is pending server configuration.)',
        });
      }
      return jsonResponse(
        {
          success: false,
          message: 'Unable to send your request right now. Please email us directly at ticxnova-ai@jollybuoy.com.',
        },
        502,
      );
    }

    return jsonResponse({
      success: true,
      message:
        'Thank you for your interest in Ticxnova. We have received your demo request and a member of our team will contact you shortly.',
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error while submitting your request.',
      },
      500,
    );
  }
});
