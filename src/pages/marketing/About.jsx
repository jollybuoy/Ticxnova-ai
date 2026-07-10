import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  Globe2,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import {
  FinalCTA,
  GlowCard,
  MarketingLayout,
  MarketingSection,
  PremiumCTA,
  TenantVisual,
} from '../../components/marketing/MarketingLayout';
import { aboutMilestones, aboutPillars, aboutValues } from '../../components/marketing/marketingData';

const heroStats = [
  { value: '1', label: 'Unified workspace' },
  { value: 'AI', label: 'Native intelligence' },
  { value: '100%', label: 'Tenant isolated' },
  { value: '24/7', label: 'Operational visibility' },
];

const pillarIcons = [BrainCircuit, Layers, ShieldCheck, Globe2];

export default function About() {
  return (
    <MarketingLayout>
      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-16 pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-80 max-w-4xl rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-32 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-violet-200"
            >
              <Sparkles size={14} className="text-cyan-300" />
              About Ticxnova
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.05]"
            >
              We build the operating system for modern IT teams
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400"
            >
              Ticxnova brings AI-native service management to SMBs, MSPs, and internal IT organizations —
              unifying tickets, devices, analytics, automation, and governance in one premium workspace.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <PremiumCTA to="/get-started">Start Free Trial</PremiumCTA>
              <PremiumCTA to="/contact" variant="secondary">
                Talk to our team
              </PremiumCTA>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-xl"
          >
            <div className="absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30">
              <BrainCircuit size={28} className="text-white" />
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-300/80">Our mission</p>
            <p className="mt-4 text-2xl font-semibold leading-snug text-white">
              Make enterprise-grade IT operations intelligent, accessible, and automation-ready for every growing organization.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                >
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingSection
        eyebrow="Why we exist"
        title="IT operations deserve a platform as intelligent as the teams running them"
        description="Support environments are more complex than ever — distributed teams, growing device fleets, rising SLA pressure, and executives demanding clarity. Ticxnova exists to replace fragmentation with focus."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {aboutPillars.map((pillar, index) => {
            const Icon = pillarIcons[index];
            return (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-cyan-300/25 hover:bg-cyan-300/[0.04]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{pillar.body}</p>
            </motion.div>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Who we serve"
        title="Built for operators, trusted by leaders"
        description="From lean internal IT teams to MSPs managing dozens of clients — Ticxnova scales with operational maturity."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <GlowCard
            icon={Building2}
            title="SMB & mid-market IT"
            body="Run a modern helpdesk with AI triage, device visibility, and executive reporting — without enterprise complexity."
          />
          <GlowCard
            icon={Users}
            title="MSPs & service providers"
            body="Deliver premium service across client workspaces with tenant isolation, RBAC, billing, and automation-ready architecture."
          />
          <GlowCard
            icon={Target}
            title="Enterprise IT leaders"
            body="Govern multi-domain operations with audit trails, SLA engines, directory sync, and AI impact analytics."
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Our journey" title="From foundation to AI-native operations">
        <div className="relative">
          <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-300/40 via-violet-400/30 to-transparent md:left-1/2 md:block" />
          <div className="space-y-8">
            {aboutMilestones.map(([year, title, body], index) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`relative grid gap-4 md:grid-cols-2 md:gap-10 ${
                  index % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''
                }`}
              >
                <div className={`${index % 2 === 0 ? 'md:text-right' : ''}`}>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">{year}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-zinc-400">
                  {body}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Values" title="What guides every product decision">
        <div className="grid gap-4 sm:grid-cols-2">
          {aboutValues.map(([title, body], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Architecture"
        title="A SaaS foundation built around tenant isolation"
        description="Every organization operates inside its own secure workspace — data, users, tickets, devices, and billing stay scoped and governed."
      >
        <TenantVisual />
      </MarketingSection>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-cyan-500/10 p-8 text-center sm:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-200">Join us</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to see what intelligent IT operations feels like?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Start a free trial or book a walkthrough — we&apos;ll show you how Ticxnova unifies support, assets,
              analytics, and automation in one premium workspace.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PremiumCTA to="/get-started" className="inline-flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight size={16} />
              </PremiumCTA>
              <PremiumCTA to="/features" variant="secondary">
                Explore the platform
              </PremiumCTA>
            </div>
          </div>
        </motion.div>
      </section>

      <FinalCTA />
    </MarketingLayout>
  );
}
