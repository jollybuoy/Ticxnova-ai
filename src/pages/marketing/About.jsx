import { GlowCard, MarketingLayout, MarketingSection, TenantVisual } from '../../components/marketing/MarketingLayout';

export default function About() {
  return (
    <MarketingLayout>
      <MarketingSection
        eyebrow="About"
        title="Ticxnova brings AI-native operations to Microsoft-centric IT teams"
        description="The platform is built for SMBs, MSPs, and internal IT teams that need modern ticketing, device visibility, analytics, and automation without operational sprawl."
        className="pt-28"
      >
        <div className="grid gap-5 md:grid-cols-3">
          <GlowCard title="Mission" body="Make enterprise-grade IT operations intelligent, accessible, and automation-ready for every growing organization." />
          <GlowCard title="Audience" body="MSPs, IT teams, SMBs, and Microsoft-heavy organizations managing tickets, devices, users, and analytics." />
          <GlowCard title="Approach" body="Combine AI assistance with structured service management, tenant isolation, reporting, and Microsoft ecosystem workflows." />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Architecture" title="A SaaS foundation built around tenant isolation">
        <TenantVisual />
      </MarketingSection>
    </MarketingLayout>
  );
}
