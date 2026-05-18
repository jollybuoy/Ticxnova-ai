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
  WorkflowGraphic,
} from '../../components/marketing/MarketingLayout';
import { marketingFeatures } from '../../components/marketing/marketingData';

export default function Features() {
  return (
    <MarketingLayout>
      <MarketingSection
        eyebrow="Features"
        title="AI, tickets, devices, analytics, and automation in one platform"
        description="Explore the public product story. These are premium visual showcases, not duplicated backend modules."
        className="pt-28"
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
        description="The public website now explains the platform as a complete operational system, not just a feature list."
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

      <MarketingSection eyebrow="AI Workflow" title="From issue to resolution path">
        <div className="grid gap-8 lg:grid-cols-2">
          <AiChatPreview />
          <WorkflowGraphic />
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Operations"
        title="Showcase dashboards for every stakeholder"
        description="Visual-only dashboards communicate ticket trends, device alerts, AI analytics, SLA indicators, and technician activity without touching backend logic."
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
