export type MailProvider = 'microsoft365' | 'google' | 'smtp' | 'resend' | 'sendgrid';

export type MailConfig = {
  provider: MailProvider;
  from_name: string;
  from_email: string;
  reply_to: string;
  it_inbox: string;
  notify_requester: boolean;
  notify_it: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_secure: 'starttls' | 'tls';
  inbound_enabled: boolean;
  inbound_address: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const PRESETS: Record<string, { smtp_host: string; smtp_port: number; smtp_secure: 'starttls' | 'tls' }> = {
  microsoft365: { smtp_host: 'smtp.office365.com', smtp_port: 587, smtp_secure: 'starttls' },
  google: { smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_secure: 'starttls' },
  smtp: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
  resend: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
  sendgrid: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
};

export function normalizeMailConfig(value: unknown): MailConfig {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const provider = ['microsoft365', 'google', 'smtp', 'resend', 'sendgrid'].includes(String(source.provider))
    ? String(source.provider) as MailProvider
    : 'microsoft365';
  const preset = PRESETS[provider];
  const port = Number(source.smtp_port);
  return {
    provider,
    from_name: String(source.from_name ?? '').trim(),
    from_email: String(source.from_email ?? '').trim().toLowerCase(),
    reply_to: String(source.reply_to ?? '').trim().toLowerCase(),
    it_inbox: String(source.it_inbox ?? '').trim().toLowerCase(),
    notify_requester: source.notify_requester !== false,
    notify_it: source.notify_it !== false,
    smtp_host: String(source.smtp_host ?? preset.smtp_host).trim(),
    smtp_port: Number.isFinite(port) && port > 0 ? port : preset.smtp_port,
    smtp_username: String(source.smtp_username ?? '').trim(),
    smtp_secure: source.smtp_secure === 'tls' ? 'tls' : 'starttls',
    inbound_enabled: source.inbound_enabled === true,
    inbound_address: String(source.inbound_address ?? '').trim().toLowerCase(),
  };
}

export function publicMailConfig(config: MailConfig) {
  const { ...safe } = config;
  return safe;
}

export function isApiProvider(provider: MailProvider) {
  return provider === 'resend' || provider === 'sendgrid';
}

export function isMailReady(config: MailConfig, hasSecret: boolean) {
  if (!config.from_email || !hasSecret) return false;
  if (isApiProvider(config.provider)) return true;
  return Boolean(config.smtp_host && config.smtp_port);
}

export function ticketMailRecipients(
  config: MailConfig,
  ticket: { requester_email?: string | null },
  event: string,
) {
  const recipients: Array<{ email: string; audience: 'requester' | 'it' }> = [];
  const requester = String(ticket.requester_email ?? '').trim().toLowerCase();
  if (config.notify_requester && requester) {
    recipients.push({ email: requester, audience: 'requester' });
  }
  if (config.notify_it && config.it_inbox && (event === 'created' || event === 'status_changed')) {
    const inbox = config.it_inbox.toLowerCase();
    if (!recipients.some((item) => item.email === inbox)) {
      recipients.push({ email: inbox, audience: 'it' });
    }
  }
  return recipients;
}

function secretMaterial() {
  return Deno.env.get('MAIL_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'ticxnova-mail';
}

async function cryptoKey() {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secretMaterial()));
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));
  const payload = new Uint8Array(iv.length + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.length);
  let binary = '';
  payload.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function decryptSecret(encoded: string) {
  const binary = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  const iv = binary.slice(0, 12);
  const data = binary.slice(12);
  const key = await cryptoKey();
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plain);
}

function fromHeader(config: MailConfig) {
  return config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email;
}

async function sendWithResend(config: MailConfig, secret: string, message: MailMessage) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromHeader(config),
      to: [message.to],
      reply_to: config.reply_to || config.from_email,
      subject: message.subject,
      text: message.text,
      html: message.html || undefined,
    }),
  });
  if (!response.ok) return { ok: false, error: await response.text() };
  return { ok: true };
}

async function sendWithSendgrid(config: MailConfig, secret: string, message: MailMessage) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: config.from_email, name: config.from_name || undefined },
      reply_to: { email: config.reply_to || config.from_email },
      subject: message.subject,
      content: [
        { type: 'text/plain', value: message.text },
        ...(message.html ? [{ type: 'text/html', value: message.html }] : []),
      ],
    }),
  });
  if (!response.ok) return { ok: false, error: await response.text() };
  return { ok: true };
}

async function sendWithSmtp(config: MailConfig, secret: string, message: MailMessage) {
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const useTls = config.smtp_secure === 'tls' || Number(config.smtp_port) === 465;
  const client = new SMTPClient({
    connection: {
      hostname: config.smtp_host,
      port: config.smtp_port,
      tls: useTls,
      auth: {
        username: config.smtp_username || config.from_email,
        password: secret,
      },
    },
  });
  try {
    await client.send({
      from: fromHeader(config),
      to: message.to,
      subject: message.subject,
      content: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `${detail}. If this is Microsoft 365 or Google, confirm SMTP AUTH / an app password. Serverless hosts sometimes block SMTP ports; Resend or SendGrid with your domain still sends as your mailbox.`,
    };
  } finally {
    try {
      await client.close();
    } catch {
      // ignore
    }
  }
}

export async function sendTenantMail(config: MailConfig, secret: string, message: MailMessage) {
  if (!config.from_email) return { ok: false, error: 'From email is required.' };
  if (!secret) return { ok: false, error: 'Mailbox password or API key is required.' };
  if (config.provider === 'resend') return sendWithResend(config, secret, message);
  if (config.provider === 'sendgrid') return sendWithSendgrid(config, secret, message);
  return sendWithSmtp(config, secret, message);
}

export function brandedTicketCopy(options: {
  companyName: string;
  event: string;
  ticket: {
    title?: string | null;
    ticket_number?: string | null;
    status?: string | null;
    requester_name?: string | null;
  };
  message?: string;
  audience: 'requester' | 'it';
  origin?: string;
}) {
  const number = options.ticket.ticket_number || 'ticket';
  const company = options.companyName || 'IT';
  const name = options.ticket.requester_name || (options.audience === 'it' ? 'team' : 'there');
  const title = options.ticket.title || 'Support request';
  const link = options.origin ? `${options.origin}/tickets` : '';
  const requesterText =
    options.event === 'created'
      ? `Hi ${name},\n\n${company} received "${title}". We will follow up on ${number}.`
      : options.event === 'public_reply'
        ? `Hi ${name},\n\nThere is a new update on ${number}:\n\n${options.message || 'Please sign in to view the reply.'}`
        : `Hi ${name},\n\n${number} is now ${options.ticket.status || 'updated'}.${options.message ? `\n\n${options.message}` : ''}`;
  const itText =
    options.event === 'created'
      ? `New ticket ${number} from ${options.ticket.requester_name || 'a requester'}: ${title}`
      : `Ticket ${number} is now ${options.ticket.status || 'updated'}: ${title}`;
  const text = options.audience === 'it' ? itText : requesterText;
  const subject =
    options.audience === 'it'
      ? `[${company}] ${options.event === 'created' ? 'New ticket' : 'Ticket update'} ${number}`
      : `[${number}] ${options.event === 'created' ? 'We received your request' : options.event === 'public_reply' ? 'Update on your request' : `Status: ${options.ticket.status}`}`;
  const html = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#111827">
  <p style="margin:0 0 12px 0">${text.replaceAll('\n', '<br />')}</p>
  ${link ? `<p style="margin:16px 0 0 0"><a href="${link}">Open in ${company}</a></p>` : ''}
  <p style="margin:24px 0 0 0;font-size:12px;color:#6b7280">Sent by ${company} using Ticxnova with your organization mailbox.</p>
</div>`;
  return { subject, text, html };
}
