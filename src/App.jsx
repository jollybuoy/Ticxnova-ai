import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';

const Login = lazy(() => import('./pages/Login'));
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

function RouteLoader() {
  return (
    <div className="mesh-dashboard flex min-h-screen items-center justify-center">
      <div className="glass-card px-6 py-5 text-sm text-zinc-300">Loading Ticxnova-AI...</div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
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
