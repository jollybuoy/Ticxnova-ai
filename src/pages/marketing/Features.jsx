import {
  AiChatPreview,
  AiIdentityPanel,
  DashboardMockup,
  FinalCTA,
  GlowCard,
  MarketingLayout,
  MarketingSection,
  MicrosoftStrip,
  StoryWorkflow,
  TenantVisual,
} from '../../components/marketing/MarketingLayout';
import { AiWorkflowShowcase } from '../../components/marketing/AiWorkflowShowcase';
import { marketingFeatures } from '../../components/marketing/marketingData';

export default function Features() {
  return (
    <MarketingLayout>
      <AiWorkflowShowcase />

      <MarketingSection
        eyebrow="Platform"
        title="AI, tickets, devices, analytics, and automation in one platform"
        description="Explore the full Ticxnova capability map — premium visual showcases of the modules powering your IT operations workspace."
        className="pt-4 sm:pt-8"
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <GlowCard key={feature.title} {...feature} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Product Story"
        title="A unified operating flow from user signal to executive insight"
        description="Six connected stages show how Ticxnova turns fragmented support into one intelligent operating system."
      >
        <StoryWorkflow />
      </MarketingSection>

      <MarketingSection
        eyebrow="AI Intelligence"
        title="Predictive, contextual, and operationally useful"
        description="AI visual language reinforces ticket summaries, recommendations, SLA prediction, and smart action panels throughout the experience."
      >
        <AiIdentityPanel />
      </MarketingSection>

      <MarketingSection eyebrow="AI Assistant" title="Conversational support that creates structured outcomes">
        <AiChatPreview />
      </MarketingSection>

      <MarketingSection
        eyebrow="Operations"
        title="Showcase dashboards for every stakeholder"
        description="Visual-only dashboards communicate ticket trends, device alerts, AI analytics, SLA indicators, and technician activity."
      >
        <DashboardMockup dense />
      </MarketingSection>

      <MarketingSection
        eyebrow="Built For Microsoft Environments"
        title="Ready for Microsoft-centric organizations"
        description="Microsoft Login, Entra ID, Outlook, Exchange, Teams, Graph API, and future Intune support are positioned as a core differentiator."
      >
        <MicrosoftStrip />
      </MarketingSection>

      <MarketingSection eyebrow="Architecture" title="Visualizing tenant isolation">
        <TenantVisual />
      </MarketingSection>

      <FinalCTA />
    </MarketingLayout>
  );
}
