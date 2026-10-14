import { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
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
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
    setReady(Boolean(data.ready));
    toast.success('Organization mailbox saved. Ticket mail will send from this address.');
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
