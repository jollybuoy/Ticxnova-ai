import { useState } from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { GlowCard, MarketingLayout, MarketingSection } from '../../components/marketing/MarketingLayout';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <MarketingLayout>
      <MarketingSection
        eyebrow="Contact"
        title="Book a demo or talk to the Ticxnova team"
        description="Tell us about your IT operations, Microsoft ecosystem, and service management goals."
        className="pt-28"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <GlowCard icon={Mail} title="Sales" body="Discuss licensing, pilots, and MSP rollout plans." />
            <GlowCard icon={MessageSquare} title="Demo" body="See the AI-first workflow and tenant architecture story." />
            <GlowCard icon={Phone} title="Enterprise" body="Plan Microsoft integration, automation, security, and governance." />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required />
              <Input label="Work email" type="email" required />
              <Input label="Company" required />
              <Input label="Team size" />
            </div>
            <Textarea label="What are you looking to improve?" className="mt-4" rows={6} />
            {sent && <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Thanks. Demo request captured for follow-up.</p>}
            <Button type="submit" className="mt-5 w-full">Book Demo</Button>
          </form>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
