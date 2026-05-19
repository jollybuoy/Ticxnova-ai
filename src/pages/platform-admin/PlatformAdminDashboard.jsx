import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PlatformAdminStatCard } from '../../components/platform-admin/PlatformAdminStatCard';
import {
  fetchPlatformDashboard,
  formatPlatformError,
} from '../../lib/platform-admin/platformAdminService';

const PLAN_COLORS = ['#f59e0b', '#8b5cf6', '#22d3ee', '#f97316'];

export default function PlatformAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: dashboard, error: fetchError } = await fetchPlatformDashboard();
      if (!mounted) return;
      if (fetchError) {
        setError(formatPlatformError(fetchError));
        setData(null);
      } else {
        setData(dashboard);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Command center</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Platform intelligence</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Cross-tenant analytics for workspace growth, user lifecycle, and operational footprint across
          Ticxnova.
        </p>
      </header>

      {loading && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">Loading analytics...</div>}
      {error && <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      {summary && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PlatformAdminStatCard label="Workspaces" value={summary.total_workspaces} hint={`${summary.active_workspaces} active`} />
            <PlatformAdminStatCard label="Platform users" value={summary.total_users} hint={`${summary.signups_last_30_days} joined in 30d`} tone="success" />
            <PlatformAdminStatCard label="Disabled accounts" value={summary.disabled_users} hint={`${summary.disabled_workspaces} disabled workspaces`} tone="danger" />
            <PlatformAdminStatCard label="Tickets / devices" value={`${summary.total_tickets} / ${summary.total_devices}`} hint={`${summary.signups_last_7_days} signups in 7d`} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PlatformAdminStatCard
              label="Trials expiring"
              value={summary.trials_expiring_soon ?? 0}
              hint={`${summary.trials_expired ?? 0} expired`}
              tone="warning"
            />
            <PlatformAdminStatCard
              label="Pending verifications"
              value={summary.pending_verifications ?? 0}
              hint="Domains awaiting approval"
            />
            <PlatformAdminStatCard
              label="Active subscriptions"
              value={summary.active_subscriptions ?? 0}
              hint="Paid or active status"
              tone="success"
            />
            <PlatformAdminStatCard
              label="AI usage (est.)"
              value={summary.ai_usage_placeholder ?? 0}
              hint="Placeholder for future metering"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-8">
              <h3 className="text-lg font-semibold text-white">Growth timeline</h3>
              <p className="mt-1 text-sm text-zinc-500">New workspaces and auth users per day</p>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.growth_timeline ?? []}>
                    <defs>
                      <linearGradient id="tenantFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <Area type="monotone" dataKey="tenants" stroke="#f59e0b" fill="url(#tenantFill)" name="Workspaces" />
                    <Area type="monotone" dataKey="users" stroke="#22d3ee" fill="transparent" name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-4">
              <h3 className="text-lg font-semibold text-white">Plans</h3>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.plan_breakdown ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {(data.plan_breakdown ?? []).map((entry, index) => (
                        <Cell key={entry.name} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">Recent workspaces</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <tr>
                    <th className="px-3 py-3">Company</th>
                    <th className="px-3 py-3">Domain</th>
                    <th className="px-3 py-3">Plan</th>
                    <th className="px-3 py-3">Age</th>
                    <th className="px-3 py-3">Users</th>
                    <th className="px-3 py-3">Admins</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent_workspaces ?? []).map((workspace) => (
                    <tr key={workspace.id} className="border-t border-white/5 text-zinc-300">
                      <td className="px-3 py-3 font-medium text-white">{workspace.company_name}</td>
                      <td className="px-3 py-3">{workspace.domain}</td>
                      <td className="px-3 py-3 capitalize">{workspace.subscription_plan}</td>
                      <td className="px-3 py-3">{workspace.days_since_created}d</td>
                      <td className="px-3 py-3">{workspace.user_count}</td>
                      <td className="px-3 py-3">{workspace.admin_emails?.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
