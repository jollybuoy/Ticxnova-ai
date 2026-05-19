import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import {
  PlatformAdminGuestRoute,
  PlatformAdminRoute,
} from './components/platform-admin/PlatformAdminRoute';
const Login = lazy(() => import('./pages/Login'));
const MarketingHome = lazy(() => import('./pages/marketing/Home'));
const MarketingFeatures = lazy(() => import('./pages/marketing/Features'));
const MarketingPricing = lazy(() => import('./pages/marketing/Pricing'));
const MarketingAbout = lazy(() => import('./pages/marketing/About'));
const MarketingContact = lazy(() => import('./pages/marketing/Contact'));
const MarketingGetStarted = lazy(() => import('./pages/marketing/GetStarted'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const TicketDetails = lazy(() => import('./pages/TicketDetails'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Devices = lazy(() => import('./pages/Devices'));
const DeviceDetails = lazy(() => import('./pages/DeviceDetails'));
const AssetOverview = lazy(() => import('./pages/AssetOverview'));
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const TicketAnalytics = lazy(() => import('./pages/reports/TicketAnalytics'));
const DeviceAnalytics = lazy(() => import('./pages/reports/DeviceAnalytics'));
const AIInsightsReport = lazy(() => import('./pages/reports/AIInsightsReport'));
const SLAReports = lazy(() => import('./pages/reports/SLAReports'));
const OrganizationSettings = lazy(() => import('./pages/admin/OrganizationSettings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const RolesPermissions = lazy(() => import('./pages/admin/RolesPermissions'));
const PlatformAdminLogin = lazy(() => import('./pages/platform-admin/PlatformAdminLogin'));
const PlatformAdminDashboard = lazy(() => import('./pages/platform-admin/PlatformAdminDashboard'));
const PlatformAdminWorkspaces = lazy(() => import('./pages/platform-admin/PlatformAdminWorkspaces'));
const PlatformAdminUsers = lazy(() => import('./pages/platform-admin/PlatformAdminUsers'));
const PlatformAdminProfile = lazy(() => import('./pages/platform-admin/PlatformAdminProfile'));
const PlatformAdminVerifications = lazy(() => import('./pages/platform-admin/PlatformAdminVerifications'));
const VerifyDomain = lazy(() => import('./pages/VerifyDomain'));
const AuthVerify = lazy(() => import('./pages/auth/AuthVerify'));
const FirstLoginPasswordReset = lazy(() => import('./pages/FirstLoginPasswordReset'));
const Profile = lazy(() => import('./pages/Profile'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const BillingSettings = lazy(() => import('./pages/admin/BillingSettings'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const TrialExpired = lazy(() => import('./pages/TrialExpired'));

function RouteLoader() {
  return (
    <div className="mesh-dashboard min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-xl bg-white/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<MarketingHome />} />
          <Route path="/features" element={<MarketingFeatures />} />
          <Route path="/pricing" element={<MarketingPricing />} />
          <Route path="/about" element={<MarketingAbout />} />
          <Route path="/contact" element={<MarketingContact />} />
          <Route path="/get-started" element={<MarketingGetStarted />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/first-login-reset"
            element={
              <ProtectedRoute allowPasswordReset>
                <FirstLoginPasswordReset />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-domain"
            element={
              <ProtectedRoute allowDomainVerification>
                <VerifyDomain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:ticketId"
            element={
              <ProtectedRoute>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AssetOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <Devices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices/:deviceId"
            element={
              <ProtectedRoute>
                <DeviceDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/tickets"
            element={
              <ProtectedRoute>
                <TicketAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/devices"
            element={
              <ProtectedRoute>
                <DeviceAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/ai-insights"
            element={
              <ProtectedRoute>
                <AIInsightsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/sla"
            element={
              <ProtectedRoute>
                <SLAReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute>
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trial-expired"
            element={
              <ProtectedRoute allowTrialExpired>
                <TrialExpired />
              </ProtectedRoute>
            }
          />
          <Route path="/platform-admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/platform-admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/login"
            element={
              <PlatformAdminGuestRoute>
                <PlatformAdminLogin />
              </PlatformAdminGuestRoute>
            }
          />
          <Route path="/admin" element={<PlatformAdminRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PlatformAdminDashboard />} />
            <Route path="verifications" element={<PlatformAdminVerifications />} />
            <Route path="workspaces" element={<PlatformAdminWorkspaces />} />
            <Route path="users" element={<PlatformAdminUsers />} />
            <Route path="profile" element={<PlatformAdminProfile />} />
          </Route>
          <Route path="/admin/organization" element={<Navigate to="/settings/organization" replace />} />
          <Route path="/admin/users" element={<Navigate to="/settings/users" replace />} />
          <Route path="/admin/roles" element={<Navigate to="/settings/roles" replace />} />
          <Route
            path="/settings/organization"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'org_admin']}>
                <OrganizationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'org_admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/roles"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'org_admin']}>
                <RolesPermissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/billing"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'org_admin']} allowTrialExpired>
                <BillingSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/audit"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'org_admin']} allowTrialExpired>
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
