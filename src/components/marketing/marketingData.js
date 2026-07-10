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
  { icon: Cloud, title: 'Microsoft Integration', body: 'Designed for Entra ID, Outlook, Teams, Exchange, and Graph API workflows.' },
  { icon: Zap, title: 'Automation', body: 'Automate onboarding, routing, SLA follow-ups, and recurring operational tasks.' },
  { icon: ShieldCheck, title: 'SLA Engine', body: 'Track response targets, breaches, technician workload, and compliance trends.' },
];

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$149',
    priceNote: 'CAD / mo',
    description: 'For small IT teams starting with AI-assisted service management.',
    features: ['AI ticketing', 'Device inventory', 'Basic reports', 'AI summaries', 'Local authentication'],
  },
  {
    name: 'Professional',
    price: '$499',
    priceNote: 'CAD / mo',
    description: 'For growing MSPs and Microsoft-heavy organizations.',
    features: ['Microsoft Login', 'Custom SMTP', 'Invite users', 'KB module', 'Advanced reports', 'AI assistant'],
  },
  {
    name: 'Enterprise',
    price: '$999',
    priceNote: 'CAD / mo',
    description: 'For multi-tenant operations, automation, and advanced governance.',
    featured: true,
    features: ['Multi-domain', 'Microsoft Graph sync', 'Automation workflows', 'SLA engine', 'Advanced RBAC', 'AI analytics', 'Custom branding'],
  },
];

export const trustStats = [
  { label: 'Tenant isolated', value: '100%' },
  { label: 'AI workflows', value: '24/7' },
  { label: 'Realtime analytics', value: '<1s' },
  { label: 'Microsoft-ready', value: 'Graph' },
];

export const faqItems = [
  ['How does multi-tenancy work?', 'Each organization is mapped to a tenant workspace with isolated tickets, devices, users, reports, and role policies.'],
  ['Does Ticxnova support Microsoft login?', 'Yes. The platform is designed for Microsoft Login, Entra ID, Outlook, Exchange, Teams, and Graph API integrations.'],
  ['Is the AI Assistant replacing technicians?', 'No. It accelerates troubleshooting, ticket creation, summaries, and recommendations while keeping humans in control.'],
  ['How does onboarding work?', 'Organizations create a workspace, configure domains, provision users, then add tickets, devices, reports, and automation workflows.'],
  ['What security controls are available?', 'Tenant isolation, RBAC, secure Supabase policies, local authentication, Microsoft auth, and future advanced enterprise policies.'],
  ['Can pricing scale for MSPs?', 'Yes. Professional and Enterprise plans are designed for MSPs, multiple organizations, automation, and advanced analytics.'],
  ['Are backups supported?', 'Database backups can be managed through Supabase project controls and enterprise deployment practices.'],
  ['Can we use custom SMTP?', 'Custom SMTP is planned for Professional and Enterprise email workflows.'],
];
