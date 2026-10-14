import { useEffect, useState } from 'react';
import { Copy, Inbox, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';
import {
  EMPTY_MAIL_CONFIG,
  MAIL_PRESETS,
  MAIL_PROVIDERS,
  isApiMailProvider,
  normalizeMailConfig,
} from '../../lib/email/mailConfig';

export function OrganizationMailSettings({ tenant }) {
  const [form, setForm] = useState(EMPTY_MAIL_CONFIG);
  const [secret, setSecret] = useState('');
  const [hasSecret, setHasSecret] = useState(false);
  const [hasInboundSecret, setHasInboundSecret] = useState(false);
  const [inboundWebhookUrl, setInboundWebhookUrl] = useState('');
  const [inboundSecret, setInboundSecret] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;
    setForm(normalizeMailConfig(tenant.mail_config));
    let cancelled = false;
    supabase.functions
      .invoke('tenant-mail', { body: { action: 'status', tenantId: tenant.id } })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        if (data?.config) setForm(normalizeMailConfig(data.config));
        setHasSecret(Boolean(data?.hasSecret));
        setHasInboundSecret(Boolean(data?.hasInboundSecret));
        setInboundWebhookUrl(data?.inboundWebhookUrl || '');
        setReady(Boolean(data?.ready));
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, tenant?.mail_config]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyProvider = (provider) => {
    const preset = MAIL_PRESETS[provider] || MAIL_PRESETS.smtp;
    setForm((current) => ({
      ...current,
      provider,
      smtp_host: preset.smtp_host || current.smtp_host,
      smtp_port: preset.smtp_port,
      smtp_secure: preset.smtp_secure,
    }));
  };

  const invokeMail = (body) =>
    supabase.functions.invoke('tenant-mail', {
      body: { tenantId: tenant.id, ...body },
    });

  const handleSave = async (event) => {
    event.preventDefault();
    if (!tenant?.id) return;
    setSaving(true);
    const { data, error } = await invokeMail({
      action: 'save',
      config: form,
      secret,
    });
    setSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Could not save mail relay.');
      return;
    }
    setSecret('');
    setHasSecret(Boolean(data.hasSecret));
    setHasInboundSecret(Boolean(data.hasInboundSecret));
    setInboundWebhookUrl(data.inboundWebhookUrl || inboundWebhookUrl);
    setReady(Boolean(data.ready));
    toast.success('Organization mailbox saved. Ticket mail will send from this address.');
  };

  const handleRotateInbound = async () => {
    if (!tenant?.id) return;
    setRotating(true);
    const { data, error } = await invokeMail({ action: 'rotate-inbound' });
    setRotating(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Could not generate a connection key.');
      return;
    }
    setInboundSecret(data.inboundSecret || '');
    setHasInboundSecret(true);
    setInboundWebhookUrl(data.inboundWebhookUrl || inboundWebhookUrl);
    toast.success('Copy the connection key now. It is shown only once.');
  };

  const copyValue = async (value, label) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleTest = async () => {
    if (!tenant?.id) return;
    setTesting(true);
    const { data, error } = await invokeMail({
      action: 'test',
      config: form,
      secret,
      to: form.it_inbox || form.from_email,
    });
    setTesting(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Test email failed.');
      return;
    }
    toast.success(`Test email sent to ${data.to}`);
  };

  const apiProvider = isApiMailProvider(form.provider);
  const secretLabel = apiProvider ? 'API key' : 'Mailbox password / app password';

  return (
    <form onSubmit={handleSave} className="glass-card space-y-5 p-6 xl:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-200">
            <Mail size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Organization mailbox</h2>
            <p className="text-sm text-zinc-400">
              Ticket mail goes out from your IT address, not from Ticxnova. Use Microsoft 365, Google Workspace, or your SMTP relay.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            ready
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-white/10 bg-white/5 text-zinc-400'
          }`}
        >
          {ready ? 'Relay ready' : 'Not sending yet'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Relay"
          value={form.provider}
          options={MAIL_PROVIDERS}
          onChange={(event) => applyProvider(event.target.value)}
        />
        <Input
          label="From name"
          value={form.from_name}
          placeholder={tenant?.company_name ? `${tenant.company_name} IT` : 'Acme IT'}
          onChange={(event) => updateField('from_name', event.target.value)}
        />
        <Input
          label="From email"
          type="email"
          required
          value={form.from_email}
          placeholder="it@yourcompany.com"
          onChange={(event) => updateField('from_email', event.target.value)}
        />
        <Input
          label="IT inbox (internal alerts)"
          type="email"
          value={form.it_inbox}
          placeholder="it@yourcompany.com"
          onChange={(event) => updateField('it_inbox', event.target.value)}
        />
        <Input
          label="Reply-to"
          type="email"
          value={form.reply_to}
          placeholder="Same as From if blank"
          onChange={(event) => updateField('reply_to', event.target.value)}
        />
        <Input
          label={secretLabel}
          type="password"
          autoComplete="new-password"
          value={secret}
          placeholder={hasSecret ? 'Saved — enter a new value to replace' : 'Required to send'}
          onChange={(event) => setSecret(event.target.value)}
        />
      </div>

      {!apiProvider && (
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="SMTP host"
            value={form.smtp_host}
            placeholder="smtp.office365.com"
            onChange={(event) => updateField('smtp_host', event.target.value)}
          />
          <Input
            label="Port"
            type="number"
            min="1"
            value={form.smtp_port}
            onChange={(event) => updateField('smtp_port', event.target.value)}
          />
          <Input
            label="SMTP username"
            value={form.smtp_username}
            placeholder="Usually the From mailbox"
            onChange={(event) => updateField('smtp_username', event.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.notify_requester}
            onChange={(event) => updateField('notify_requester', event.target.checked)}
          />
          Email requesters
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.notify_it}
            onChange={(event) => updateField('notify_it', event.target.checked)}
          />
          Email IT inbox on new tickets and status changes
        </label>
      </div>

      <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-relaxed text-zinc-400">
        Microsoft 365: enable SMTP AUTH for the mailbox. Google: use an app password.
        If SMTP ports are blocked on the host, pick Resend or SendGrid and verify your company
        domain there — the From address stays yours. Password and API keys are stored encrypted
        and never shown again.
      </p>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-200">
            <Inbox size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Create tickets from email</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Optional. If someone emails this address, Ticxnova can open a ticket. Leave this off if people only submit from the portal.
            </p>
          </div>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={form.inbound_enabled}
            onChange={(event) => updateField('inbound_enabled', event.target.checked)}
          />
          Turn on email-to-ticket
        </label>

        {form.inbound_enabled && (
          <div className="mt-4 space-y-4">
            <Input
              label="Address people should email"
              type="email"
              value={form.inbound_address}
              placeholder={form.it_inbox || form.from_email || 'it@yourcompany.com'}
              onChange={(event) => updateField('inbound_address', event.target.value)}
            />
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-200">Connection URL</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={inboundWebhookUrl}
                  className="field-control focus-ring w-full rounded-xl border px-4 py-3 text-xs text-zinc-300"
                />
                <Button type="button" variant="secondary" onClick={() => copyValue(inboundWebhookUrl, 'Connection URL')}>
                  <Copy size={15} />
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-200">Connection key</p>
              {inboundSecret ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={inboundSecret}
                    className="field-control focus-ring w-full rounded-xl border px-4 py-3 font-mono text-xs text-emerald-200"
                  />
                  <Button type="button" variant="secondary" onClick={() => copyValue(inboundSecret, 'Connection key')}>
                    <Copy size={15} />
                    Copy
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {hasInboundSecret
                    ? 'A key is already saved. Generate a new one only if you need to replace it.'
                    : 'Generate a key, then add it to your mail provider as header x-webhook-secret.'}
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                loading={rotating}
                disabled={rotating}
                onClick={handleRotateInbound}
              >
                {hasInboundSecret ? 'Generate new key' : 'Generate key'}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              In Microsoft 365, Google, Mailgun, or SendGrid, forward or parse that mailbox to the URL above.
              Save this form after turning the option on.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" loading={testing} disabled={testing || saving} onClick={handleTest}>
          <Send size={16} />
          Send test
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          Save mailbox
        </Button>
      </div>
    </form>
  );
}
