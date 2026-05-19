import { useState } from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { GlowCard, MarketingLayout, MarketingSection } from '../../components/marketing/MarketingLayout';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { submitDemoRequest } from '../../lib/marketing/contactService';

const countryCodeOptions = [
  { value: '+1', label: '+1 (US / Canada)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+49', label: '+49 (Germany)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+971', label: '+971 (UAE)' },
  { value: '+65', label: '+65 (Singapore)' },
  { value: '+81', label: '+81 (Japan)' },
  { value: '+82', label: '+82 (South Korea)' },
];

const initialForm = {
  fullName: '',
  email: '',
  countryCode: '+1',
  phoneNumber: '',
  company: '',
  teamSize: '',
  message: '',
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    const result = await submitDemoRequest(form);
    setLoading(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.message });
      return;
    }

    setFeedback({ type: 'success', text: result.message });
    setForm(initialForm);
  };

  return (
    <MarketingLayout>
      <MarketingSection
        eyebrow="Contact"
        title="Book a demo or talk to the Ticxnova team"
        description="See how our advanced AI ticketing platform can transform your IT operations. Share your goals and we will tailor the walkthrough to your environment."
        className="pt-28"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <GlowCard icon={Mail} title="Sales" body="Discuss licensing, pilots, and MSP rollout plans." />
            <GlowCard icon={MessageSquare} title="Demo" body="Live walkthrough of AI ticketing, classification, and Microsoft workflows." />
            <GlowCard icon={Phone} title="Enterprise" body="Plan Microsoft integration, automation, security, and governance." />
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
              Demo requests are sent to{' '}
              <a href="mailto:ticxnova-ai@jollybuoy.com" className="text-cyan-300 hover:text-cyan-200">
                ticxnova-ai@jollybuoy.com
              </a>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.fullName}
                onChange={update('fullName')}
                required
                disabled={loading}
              />
              <Input
                label="Work email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                disabled={loading}
              />
              <Input
                label="Company"
                value={form.company}
                onChange={update('company')}
                required
                disabled={loading}
              />
              <Input
                label="Team size"
                placeholder="e.g. 25 technicians"
                value={form.teamSize}
                onChange={update('teamSize')}
                disabled={loading}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
              <Select
                label="Country code"
                value={form.countryCode}
                onChange={update('countryCode')}
                options={countryCodeOptions}
                disabled={loading}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="555 123 4567"
                value={form.phoneNumber}
                onChange={update('phoneNumber')}
                required
                disabled={loading}
              />
            </div>

            <Textarea
              label="What are you looking to improve?"
              className="mt-4"
              rows={6}
              value={form.message}
              onChange={update('message')}
              disabled={loading}
            />

            {feedback && (
              <p
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-7 ${
                  feedback.type === 'error'
                    ? 'border-red-400/20 bg-red-500/10 text-red-200'
                    : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                }`}
              >
                {feedback.text}
              </p>
            )}

            {!feedback?.success && (
              <p className="mt-4 text-xs leading-6 text-zinc-500">
                After you submit, our team will review your request and contact you at the email and phone number provided.
                We appreciate your interest in Ticxnova.
              </p>
            )}

            <Button type="submit" className="mt-5 w-full" loading={loading} disabled={loading}>
              Book Demo
            </Button>
          </form>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
