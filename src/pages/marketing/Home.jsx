import { motion } from 'framer-motion';
import {
  AiChatPreview,
  AiIdentityPanel,
  DashboardMockup,
  FinalCTA,
  GlowCard,
  IntegrationStrip,
  MarketingLayout,
  MarketingSection,
  PremiumCTA,
  SocialProofSection,
  StoryWorkflow,
  TenantVisual,
  WorkflowGraphic,
} from '../../components/marketing/MarketingLayout';
import { faqItems, marketingFeatures, trustStats } from '../../components/marketing/marketingData';

export default function Home() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto hidden h-72 max-w-5xl rounded-full bg-cyan-300/10 blur-3xl md:block" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200"
        >
          AI-powered IT operations
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-8 max-w-5xl text-5xl font-semibold tracking-tight text-white md:text-7xl"
        >
          AI-Powered IT Operations Platform
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400"
        >
          Modern ticketing, AI support, asset management, analytics, and enterprise automation in one intelligent platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <PremiumCTA to="/get-started">Start Free Trial</PremiumCTA>
          <PremiumCTA to="/features" variant="secondary">Watch Demo</PremiumCTA>
        </motion.div>
        <DashboardMockup dense />
      </section>

      <MarketingSection
        eyebrow="The Problem"
        title="Modern IT operations are fragmented"
        description="Tickets live in one tool, device data in another, identity context somewhere else, and executives still ask for better reporting. Ticxnova turns that fragmentation into a single AI-assisted operating model."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <GlowCard title="Disconnected support" body="Technicians lose time jumping between chat, tickets, device inventory, email context, and manual notes." />
          <GlowCard title="Reactive operations" body="SLA risk, device failures, and repeat incidents are often discovered after users feel the impact." />
          <GlowCard title="Weak visibility" body="Leaders need operational analytics, AI impact, and tenant-level reporting without spreadsheet work." />
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="The Solution"
        title="Ticxnova unifies AI-powered IT operations in one intelligent platform"
        description="A modern SaaS experience that connects AI support, ticketing, devices, analytics, automation, RBAC, and tenant isolation."
      >
        <StoryWorkflow />
      </MarketingSection>

      <MarketingSection
        eyebrow="Enterprise Trust"
        title="Built for secure, modern IT operations"
        description="Showcase-ready architecture for tenant isolation, AI workflows, enterprise integrations, security controls, and realtime visibility."
      >
        <div className="grid gap-4 md:grid-cols-4">
          {trustStats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/20"
            >
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Platform"
        title="One AI-native workspace for IT service delivery"
        description="A premium public showcase of the modules already powering the internal SaaS application."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <GlowCard key={feature.title} {...feature} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="AI Identity"
        title="An intelligent command layer for service operations"
        description="Ticxnova should feel like an AI platform from the first scroll: predictive, contextual, integration-aware, and operationally useful."
      >
        <AiIdentityPanel />
      </MarketingSection>

      <MarketingSection eyebrow="AI Assistant" title="Conversational support that creates structured outcomes">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <AiChatPreview />
          <WorkflowGraphic />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Assets" title="Device intelligence for endpoint-heavy teams">
        <div className="grid gap-5 lg:grid-cols-4">
          {['Inventory', 'Health tracking', 'Warranty monitoring', 'Incident history'].map((item) => (
            <GlowCard key={item} title={item} body="Visual showcase for device lifecycle visibility, operational risk, and support history." />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Analytics"
        title="Executive reports, SLA metrics, and AI impact"
        description="Operational dashboards show ticket trends, SLA health, device posture, AI recommendations, and technician activity as premium visual previews."
      >
        <DashboardMockup dense />
      </MarketingSection>

      <MarketingSection
        eyebrow="Enterprise Integrations"
        title="Connect your identity and collaboration stack"
        description="Ticxnova is designed for enterprise SSO, directory sync, email intake, messaging workflows, and endpoint management — without locking you into a single vendor."
      >
        <IntegrationStrip />
      </MarketingSection>

      <MarketingSection eyebrow="Multi-Tenant SaaS" title="Every organization gets an isolated workspace">
        <TenantVisual />
      </MarketingSection>

      <MarketingSection
        eyebrow="Social Proof"
        title="Enterprise trust signals for a serious AI operations platform"
        description="Metrics, operational outcomes, and placeholder testimonials help the public site communicate maturity and conversion quality."
      >
        <SocialProofSection />
      </MarketingSection>

      <MarketingSection eyebrow="FAQ" title="Questions before you start?">
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map(([question, answer]) => (
            <div key={question} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-semibold text-white">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{answer}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <FinalCTA />
    </MarketingLayout>
  );
}
