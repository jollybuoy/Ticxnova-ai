import { lazy } from 'react';

const lazyPage = (factory) => lazy(factory);

export const Login = lazyPage(() => import('../pages/Login'));
export const MarketingHome = lazyPage(() => import('../pages/marketing/Home'));
export const MarketingFeatures = lazyPage(() => import('../pages/marketing/Features'));
export const MarketingPricing = lazyPage(() => import('../pages/marketing/Pricing'));
export const MarketingAbout = lazyPage(() => import('../pages/marketing/About'));
export const MarketingContact = lazyPage(() => import('../pages/marketing/Contact'));
export const MarketingGetStarted = lazyPage(() => import('../pages/marketing/GetStarted'));

export const Dashboard = lazyPage(() => import('../pages/Dashboard'));
export const Tickets = lazyPage(() => import('../pages/Tickets'));
export const TicketDetails = lazyPage(() => import('../pages/TicketDetails'));
export const AIAssistant = lazyPage(() => import('../pages/AIAssistant'));
export const Devices = lazyPage(() => import('../pages/Devices'));
export const DeviceDetails = lazyPage(() => import('../pages/DeviceDetails'));
export const AssetOverview = lazyPage(() => import('../pages/AssetOverview'));
export const KnowledgeBase = lazyPage(() => import('../pages/KnowledgeBase'));

export const ReportsDashboard = lazyPage(() => import('../pages/reports/ReportsDashboard'));
export const TicketAnalytics = lazyPage(() => import('../pages/reports/TicketAnalytics'));
export const DeviceAnalytics = lazyPage(() => import('../pages/reports/DeviceAnalytics'));
export const AIInsightsReport = lazyPage(() => import('../pages/reports/AIInsightsReport'));
export const SLAReports = lazyPage(() => import('../pages/reports/SLAReports'));

export const OrganizationSettings = lazyPage(() => import('../pages/admin/OrganizationSettings'));
export const UserManagement = lazyPage(() => import('../pages/admin/UserManagement'));
export const RolesPermissions = lazyPage(() => import('../pages/admin/RolesPermissions'));
export const BillingSettings = lazyPage(() => import('../pages/admin/BillingSettings'));

export const Profile = lazyPage(() => import('../pages/Profile'));
export const TrialExpired = lazyPage(() => import('../pages/TrialExpired'));
export const VerifyDomain = lazyPage(() => import('../pages/VerifyDomain'));
export const AuthVerify = lazyPage(() => import('../pages/auth/AuthVerify'));
export const FirstLoginPasswordReset = lazyPage(() => import('../pages/FirstLoginPasswordReset'));

export const PlatformAdminLogin = lazyPage(() => import('../pages/platform-admin/PlatformAdminLogin'));
export const PlatformAdminDashboard = lazyPage(() => import('../pages/platform-admin/PlatformAdminDashboard'));
export const PlatformAdminWorkspaces = lazyPage(() => import('../pages/platform-admin/PlatformAdminWorkspaces'));
export const PlatformAdminUsers = lazyPage(() => import('../pages/platform-admin/PlatformAdminUsers'));
export const PlatformAdminProfile = lazyPage(() => import('../pages/platform-admin/PlatformAdminProfile'));
export const PlatformAdminVerifications = lazyPage(() => import('../pages/platform-admin/PlatformAdminVerifications'));

/** Route path → dynamic import for sidebar prefetch */
export const PREFETCH_BY_PATH = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/tickets': () => import('../pages/Tickets'),
  '/ai-assistant': () => import('../pages/AIAssistant'),
  '/assets': () => import('../pages/AssetOverview'),
  '/devices': () => import('../pages/Devices'),
  '/reports': () => import('../pages/reports/ReportsDashboard'),
  '/reports/tickets': () => import('../pages/reports/TicketAnalytics'),
  '/reports/devices': () => import('../pages/reports/DeviceAnalytics'),
  '/reports/ai-insights': () => import('../pages/reports/AIInsightsReport'),
  '/reports/sla': () => import('../pages/reports/SLAReports'),
  '/knowledge-base': () => import('../pages/KnowledgeBase'),
  '/settings/organization': () => import('../pages/admin/OrganizationSettings'),
  '/settings/users': () => import('../pages/admin/UserManagement'),
  '/settings/roles': () => import('../pages/admin/RolesPermissions'),
  '/settings/billing': () => import('../pages/admin/BillingSettings'),
};

const prefetched = new Set();

export function prefetchRoute(path) {
  const loader = PREFETCH_BY_PATH[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  void loader();
}
