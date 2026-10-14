export const MAIL_PROVIDERS = [
  { value: 'microsoft365', label: 'Microsoft 365 SMTP' },
  { value: 'google', label: 'Google Workspace SMTP' },
  { value: 'smtp', label: 'Custom SMTP relay' },
  { value: 'resend', label: 'Resend API (your domain)' },
  { value: 'sendgrid', label: 'SendGrid API (your domain)' },
];

export const MAIL_PRESETS = {
  microsoft365: { smtp_host: 'smtp.office365.com', smtp_port: 587, smtp_secure: 'starttls' },
  google: { smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_secure: 'starttls' },
  smtp: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
  resend: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
  sendgrid: { smtp_host: '', smtp_port: 587, smtp_secure: 'starttls' },
};

export const EMPTY_MAIL_CONFIG = {
  provider: 'microsoft365',
  from_name: '',
  from_email: '',
  reply_to: '',
  it_inbox: '',
  notify_requester: true,
  notify_it: true,
  smtp_host: 'smtp.office365.com',
  smtp_port: 587,
  smtp_username: '',
  smtp_secure: 'starttls',
};

export function isApiMailProvider(provider) {
  return provider === 'resend' || provider === 'sendgrid';
}

export function normalizeMailConfig(value) {
  const source = value && typeof value === 'object' ? value : {};
  const provider = MAIL_PROVIDERS.some((item) => item.value === source.provider)
    ? source.provider
    : 'microsoft365';
  const preset = MAIL_PRESETS[provider] || MAIL_PRESETS.microsoft365;
  const port = Number(source.smtp_port);
  return {
    provider,
    from_name: String(source.from_name || '').trim(),
    from_email: String(source.from_email || '').trim().toLowerCase(),
    reply_to: String(source.reply_to || '').trim().toLowerCase(),
    it_inbox: String(source.it_inbox || '').trim().toLowerCase(),
    notify_requester: source.notify_requester !== false,
    notify_it: source.notify_it !== false,
    smtp_host: String(source.smtp_host || preset.smtp_host || '').trim(),
    smtp_port: Number.isFinite(port) && port > 0 ? port : preset.smtp_port,
    smtp_username: String(source.smtp_username || '').trim(),
    smtp_secure: source.smtp_secure === 'tls' ? 'tls' : 'starttls',
  };
}

export function mailConfigFromTenant(tenant) {
  return normalizeMailConfig(tenant?.mail_config);
}

export function isMailReady(config, hasSecret) {
  const mail = normalizeMailConfig(config);
  if (!mail.from_email || !hasSecret) return false;
  if (isApiMailProvider(mail.provider)) return true;
  return Boolean(mail.smtp_host && mail.smtp_port && (mail.smtp_username || mail.from_email));
}

export function ticketMailRecipients(config, ticket, event) {
  const mail = normalizeMailConfig(config);
  const recipients = [];
  const requester = String(ticket?.requester_email || '').trim().toLowerCase();
  if (mail.notify_requester && requester) {
    recipients.push({ email: requester, audience: 'requester' });
  }
  if (mail.notify_it && mail.it_inbox && (event === 'created' || event === 'status_changed')) {
    const inbox = mail.it_inbox.toLowerCase();
    if (!recipients.some((item) => item.email === inbox)) {
      recipients.push({ email: inbox, audience: 'it' });
    }
  }
  return recipients;
}
