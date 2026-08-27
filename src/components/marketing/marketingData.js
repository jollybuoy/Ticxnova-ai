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
  { icon: LineChart, title: 'Reports & Analytics', body: 'Executive dashboards, SLA reports, AI impact, and export-ready reporting.' },
  { icon: Database, title: 'Knowledge Base', body: 'Prepare repeatable support content and operational knowledge for teams.' },
  { icon: Building2, title: 'Multi-Tenant SaaS', body: 'Workspace-based tenant isolation, RBAC, and organization-specific data.' },
  { icon: Cloud, title: 'Secure workspace access', body: 'Email-and-password authentication, domain verification, and tenant-scoped roles.' },
  { icon: Zap, title: 'AI ticket drafts', body: 'Turn assistant conversations into structured tickets with suggested priority and category.' },
  { icon: ShieldCheck, title: 'SLA reports', body: 'Track response windows, breached tickets, technician workload, and compliance trends.' },
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
    features: ['Invite users', 'Knowledge base', 'Advanced reports', 'AI assistant', 'Notifications'],
  },
  {
    name: 'Enterprise',
    price: '$999',
    priceNote: 'CAD / mo',
    description: 'For larger IT operations that need SLA reporting, audit trails, and AI analytics.',
    featured: true,
    features: ['Everything in Professional', 'SLA reports', 'Audit logs', 'AI analytics'],
  },
];

export const trustStats = [
  { label: 'Tenant isolated', value: '100%' },
  { label: 'AI workflows', value: '24/7' },
  { label: 'Realtime analytics', value: '<1s' },
  { label: 'Auth', value: 'Email' },
];

export const faqItems = [
  ['How does multi-tenancy work?', 'Each organization is mapped to a tenant workspace with isolated tickets, devices, users, reports, and role policies.'],
  ['Does Ticxnova support enterprise SSO?', 'Not yet. Workspaces currently sign in with email and password. Identity-provider SSO is on the roadmap — contact us if you need it for a rollout.'],
  ['Is the AI Assistant replacing technicians?', 'No. It accelerates troubleshooting, ticket creation, summaries, and recommendations while keeping humans in control.'],
  ['How does onboarding work?', 'Organizations create a workspace, verify their domain, invite users, then add tickets, devices, and knowledge articles.'],
  ['What security controls are available?', 'Tenant isolation, five system roles, domain verification, and audit logging on Enterprise. Custom roles are not enforced yet.'],
  ['Can pricing scale for MSPs?', 'Yes. Professional and Enterprise add invites, knowledge base, advanced reports, SLA reporting, and audit logs.'],
  ['Are backups supported?', 'Database backups are managed through the Supabase project. Contact us for enterprise backup requirements.'],
  ['Can we use custom SMTP?', 'Not in this release. Invites currently share a temporary password in the admin UI. Custom SMTP is on the roadmap.'],
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
