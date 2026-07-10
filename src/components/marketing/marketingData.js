import {
  Bot,
  Building2,
  Cloud,
  Cpu,
  Database,
  LineChart,
  ShieldCheck,
  Ticket,
  Zap,
} from 'lucide-react';

export const marketingFeatures = [
  { icon: Bot, title: 'AI Assistant', body: 'Troubleshoot, summarize, classify, and guide users through IT issues.' },
  { icon: Ticket, title: 'Conversational Ticketing', body: 'Turn unresolved support conversations into structured incidents or service requests.' },
  { icon: Cpu, title: 'Asset Management', body: 'Track devices, ownership, health posture, warranty risk, and related incidents.' },
  { icon: LineChart, title: 'Reports & Analytics', body: 'Executive dashboards, SLA metrics, AI impact, and export-ready reporting.' },
  { icon: Database, title: 'Knowledge Base', body: 'Prepare repeatable support content and operational knowledge for teams.' },
  { icon: Building2, title: 'Multi-Tenant SaaS', body: 'Workspace-based tenant isolation, RBAC, and organization-specific data.' },
  { icon: Cloud, title: 'Enterprise Integrations', body: 'Connect identity providers, email, messaging, and directory services into one workflow.' },
  { icon: Zap, title: 'Automation', body: 'Automate onboarding, routing, SLA follow-ups, and recurring operational tasks.' },
  { icon: ShieldCheck, title: 'SLA Engine', body: 'Track response targets, breaches, technician workload, and compliance trends.' },
];

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$149',
    priceNote: 'CAD / mo',
    description: 'For small IT teams starting with AI-assisted service management.',
    features: ['AI ticketing', 'Device inventory', 'Basic reports', 'AI summaries', 'Email & password auth'],
  },
  {
    name: 'Professional',
    price: '$499',
    priceNote: 'CAD / mo',
    description: 'For growing MSPs and multi-team IT organizations.',
    features: ['Enterprise SSO', 'Custom SMTP', 'Invite users', 'KB module', 'Advanced reports', 'AI assistant'],
  },
  {
    name: 'Enterprise',
    price: '$999',
    priceNote: 'CAD / mo',
    description: 'For multi-tenant operations, automation, and advanced governance.',
    featured: true,
    features: ['Multi-domain', 'Directory sync', 'Automation workflows', 'SLA engine', 'Advanced RBAC', 'AI analytics', 'Custom branding'],
  },
];

export const trustStats = [
  { label: 'Tenant isolated', value: '100%' },
  { label: 'AI workflows', value: '24/7' },
  { label: 'Realtime analytics', value: '<1s' },
  { label: 'Integration-ready', value: 'SSO' },
];

export const faqItems = [
  ['How does multi-tenancy work?', 'Each organization is mapped to a tenant workspace with isolated tickets, devices, users, reports, and role policies.'],
  ['Does Ticxnova support enterprise SSO?', 'Yes. Professional and Enterprise plans support identity provider login, directory sync, and enterprise integration workflows.'],
  ['Is the AI Assistant replacing technicians?', 'No. It accelerates troubleshooting, ticket creation, summaries, and recommendations while keeping humans in control.'],
  ['How does onboarding work?', 'Organizations create a workspace, configure domains, provision users, then add tickets, devices, reports, and automation workflows.'],
  ['What security controls are available?', 'Tenant isolation, RBAC, secure Supabase policies, email authentication, enterprise SSO, and advanced audit controls on higher tiers.'],
  ['Can pricing scale for MSPs?', 'Yes. Professional and Enterprise plans are designed for MSPs, multiple organizations, automation, and advanced analytics.'],
  ['Are backups supported?', 'Database backups can be managed through Supabase project controls and enterprise deployment practices.'],
  ['Can we use custom SMTP?', 'Custom SMTP is available on Professional and Enterprise email workflows.'],
];

export const aboutPillars = [
  {
    title: 'Intelligence first',
    body: 'AI is embedded in triage, routing, summaries, and recommendations — not bolted on as an afterthought.',
  },
  {
    title: 'Operational clarity',
    body: 'Tickets, devices, users, and analytics live in one workspace so teams stop context-switching.',
  },
  {
    title: 'Enterprise discipline',
    body: 'Tenant isolation, RBAC, audit trails, and subscription governance built for serious IT operations.',
  },
  {
    title: 'Built to scale',
    body: 'From a single SMB helpdesk to MSP portfolios and multi-domain enterprises — one platform grows with you.',
  },
];

export const aboutMilestones = [
  ['2024', 'Platform foundation', 'Multi-tenant architecture, AI ticketing, and device visibility.'],
  ['2025', 'SaaS maturity', 'Plan gating, trial enforcement, billing, RBAC, and audit logging.'],
  ['Today', 'AI-native operations', 'Unified workspace for service delivery, analytics, and automation.'],
  ['Next', 'Deeper automation', 'Expanded integrations, SLA orchestration, and executive intelligence.'],
];

export const aboutValues = [
  ['Precision', 'Every workflow should reduce noise and surface what matters.'],
  ['Trust', 'Security, isolation, and transparency are non-negotiable.'],
  ['Velocity', 'Teams resolve faster when context travels with the ticket.'],
  ['Partnership', 'We build for IT leaders who run real operations — not slide decks.'],
];
