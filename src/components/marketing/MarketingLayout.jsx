import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Cloud,
  Gauge,
  HardDrive,
  Layers,
  LineChart,
  LockKeyhole,
  MessageSquare,
  Network,
  Radio,
  Server,
  Shield,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

const particlePositions = [
  ['12%', '16%', 0],
  ['26%', '74%', 0.9],
  ['44%', '28%', 1.6],
  ['68%', '18%', 0.4],
  ['78%', '66%', 1.2],
  ['91%', '38%', 2.1],
];

const dashboardEvents = [
  ['AI routed P2 ticket', 'Outlook MFA loop', '12s ago', Ticket],
  ['Device alert linked', 'LAP-204 battery risk', '34s ago', HardDrive],
  ['SLA watch started', 'VIP request approaching target', '1m ago', Gauge],
];

const workflowSteps = [
  ['User reports issue', 'A support request starts from email, Teams, portal, or technician intake.', MessageSquare],
  ['AI analyzes context', 'Ticxnova evaluates symptoms, history, urgency, and suggested remediation.', BrainCircuit],
  ['Ticket is structured', 'The issue becomes an incident or service request with priority and context.', Ticket],
  ['Device is linked', 'Assets, warranty, health, and incident history are connected to the workflow.', HardDrive],
  ['Technician resolves', 'Teams work from a unified operational view with AI summaries and next steps.', Users],
  ['Analytics update', 'SLA, trends, AI impact, and executive reporting refresh in realtime.', BarChart3],
];

const socialMetrics = [
  ['AI events processed', '2.4M+'],
  ['SLA visibility', '98%'],
  ['Target uptime', '99.9%'],
  ['Faster triage', '42%'],
];

export function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <MarketingBackground />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#030712]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Ticxnova</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">AI IT Ops</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm transition-colors ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-zinc-300 hover:text-white sm:block">
              Login
            </Link>
            <Link
              to="/get-started"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-white/10 transition-transform hover:-translate-y-0.5 hover:shadow-cyan-300/20"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Start Free Trial</span>
              <ArrowRight className="relative transition-transform group-hover:translate-x-0.5" size={15} />
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 pt-20">{children}</main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Ticxnova. AI-powered Microsoft-centric IT operations.</p>
          <div className="flex gap-5">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/login" className="hover:text-white">Customer Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function MarketingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(135deg,#030712_0%,#08111f_45%,#050816_100%)]" />
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
      />
      <motion.div
        animate={{ x: [-30, 20, -30], y: [20, -10, 20] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
      />
      {particlePositions.map(([left, top, delay]) => (
        <motion.span
          key={`${left}-${top}`}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.75, 0.15], scale: [1, 1.5, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, delay, ease: 'easeInOut' }}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.9)]"
          style={{ left, top }}
        />
      ))}
      <motion.div
        animate={{ backgroundPosition: ['0px 0px', '64px 64px'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-cyan-400/5 to-transparent" />
    </div>
  );
}

export function MarketingSection({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`mx-auto max-w-7xl px-5 py-20 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-12 max-w-3xl text-center"
      >
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{eyebrow}</p>}
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
        {description && <p className="mt-5 text-base leading-8 text-zinc-400">{description}</p>}
      </motion.div>
      {children}
    </section>
  );
}

export function GlowCard({ icon: Icon, title, body, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, borderColor: 'rgba(34,211,238,0.4)' }}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-shadow hover:shadow-cyan-950/40 ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl transition-opacity group-hover:opacity-100" />
      {Icon && (
        <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-lg shadow-cyan-950/30">
          <Icon size={22} />
        </div>
      )}
      <h3 className="relative text-lg font-semibold text-white">{title}</h3>
      <p className="relative mt-3 text-sm leading-7 text-zinc-400">{body}</p>
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function PremiumCTA({ to, children, variant = 'primary', className = '' }) {
  const base = 'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5';
  const variants = {
    primary: 'bg-white text-zinc-950 shadow-xl shadow-white/10 hover:shadow-cyan-300/25',
    secondary: 'border border-white/10 bg-white/[0.04] text-white backdrop-blur-xl hover:border-cyan-300/40 hover:bg-white/[0.08]',
  };

  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
      <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function DashboardMockup({ dense = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="relative mx-auto mt-12 max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-3 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl sm:p-4"
    >
      <motion.div
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 3.5, repeat: Infinity }}
        className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-cyan-300/20 to-blue-500/20 blur-xl"
      />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050816] p-4 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.16),transparent_32%)]" />
        <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Live Command Center</p>
            <h3 className="mt-2 text-xl font-semibold">AI Operations Overview</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill icon={Radio} label="Realtime" />
            <StatusPill icon={Shield} label="SLA protected" />
          </div>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Open tickets', '42', Activity],
            ['AI resolved', '186', BrainCircuit],
            ['Assets tracked', '1,240', Server],
            ['SLA health', '98%', Gauge],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <Icon className="mb-3 text-cyan-300" size={18} />
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className={`relative mt-5 grid gap-4 ${dense ? 'lg:grid-cols-[1fr_0.9fr]' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Ticket trend and AI load</p>
              <p className="text-xs text-cyan-300">+28% automated</p>
            </div>
            <div className="flex h-44 items-end gap-3">
              {[40, 72, 56, 88, 64, 104, 92, 128, 112, 146].map((height, index) => (
                <motion.div
                  key={`${height}-${index}`}
                  initial={{ height: 10 }}
                  animate={{ height }}
                  transition={{ delay: index * 0.07, duration: 0.6 }}
                  className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-500 via-blue-400 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {dashboardEvents.map(([title, detail, time, Icon], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4"
              >
                <Icon className="mt-0.5 h-5 w-5 text-emerald-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-200">{title}</span>
                  <span className="block truncate text-xs text-zinc-500">{detail}</span>
                </span>
                <span className="text-[10px] text-zinc-600">{time}</span>
              </motion.div>
            ))}
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <Bell size={16} />
                AI recommendation
              </div>
              <p className="mt-2 text-xs leading-6 text-cyan-100/75">Prioritize Exchange incident cluster before SLA breach in 18 minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AiChatPreview() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute right-4 top-4 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl"
      />
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">Ticxnova AI Copilot</p>
            <p className="text-xs text-zinc-500">Processing incident context</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Online</span>
      </div>
      {[
        ['User', 'Outlook keeps asking for password after MFA.'],
        ['Ticxnova AI', 'Try token refresh, check Entra sign-in logs, then validate Outlook profile health.'],
        ['Ticxnova AI', 'Would you like me to create an incident with P2 priority and affected user context?'],
      ].map(([name, message], index) => (
        <motion.div
          key={message}
          initial={{ opacity: 0, x: index % 2 ? 20 : -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 }}
          className={`mb-3 rounded-2xl border border-white/10 p-4 ${index % 2 ? 'ml-10 bg-violet-500/10' : 'mr-10 bg-white/[0.04]'}`}
        >
          <p className="text-xs font-semibold text-cyan-300">{name}</p>
          <p className="mt-2 text-sm text-zinc-200">{message}</p>
        </motion.div>
      ))}
      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        {['Summarize', 'Create Ticket', 'Recommend Fix'].map((label) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center text-xs text-cyan-100">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TenantVisual() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {['Tenant A', 'Tenant B', 'Tenant C'].map((tenant, index) => (
        <GlowCard key={tenant} icon={LockKeyhole} title={tenant} body="Isolated tickets, devices, reports, users, and roles.">
          <div className="mt-5 space-y-2">
            {['tickets', 'devices', 'users'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
                tenant_id_{index + 1} · {item}
              </div>
            ))}
          </div>
        </GlowCard>
      ))}
    </div>
  );
}

export function MicrosoftStrip() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {['Microsoft Login', 'Entra ID', 'Outlook', 'Exchange', 'Teams', 'Graph API', 'Intune future'].map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] px-4 py-5 text-center text-sm text-zinc-300"
          >
            <Cloud className="mx-auto mb-3 text-cyan-300" size={19} />
            {item}
          </motion.div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
        {['Microsoft tenant', 'Ticxnova AI layer', 'IT operations workspace'].map((label, index) => (
          <div key={label} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-center text-sm text-cyan-100">
            {label}
            <p className="mt-2 text-xs text-cyan-100/60">{['Identity and collaboration', 'Graph-aware automation', 'Tickets, devices, reports'][index]}</p>
          </div>
        )).flatMap((item, index, array) => (index < array.length - 1 ? [item, <ArrowRight key={`arrow-${index}`} className="mx-auto hidden text-cyan-300 lg:block" />] : [item]))}
      </div>
    </div>
  );
}

export function WorkflowGraphic() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['Detect', Network, 'Signal from users, devices, and service queues.'],
        ['Diagnose', Bot, 'AI interprets symptoms and operational context.'],
        ['Resolve', Ticket, 'Tickets, actions, and summaries stay connected.'],
        ['Analyze', LineChart, 'Realtime metrics refresh executive visibility.'],
      ].map(([label, Icon, body], index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center"
        >
          <Icon className="mx-auto text-cyan-300" size={28} />
          <p className="mt-4 font-semibold">{label}</p>
          <p className="mt-2 text-xs leading-6 text-zinc-500">{body}</p>
        </motion.div>
      ))}
    </div>
  );
}

function StatusPill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
      <Icon size={13} />
      {label}
    </div>
  );
}

export function StoryWorkflow() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflowSteps.map(([title, body, Icon], index) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.07 }}
          className="relative rounded-3xl border border-white/10 bg-white/[0.045] p-6"
        >
          <span className="absolute right-5 top-5 text-4xl font-semibold text-white/[0.04]">{index + 1}</span>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Icon size={22} />
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">{body}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function AiIdentityPanel() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-full border border-white/10 bg-white/[0.035]">
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            animate={{ rotate: ring % 2 ? -360 : 360 }}
            transition={{ duration: 18 + ring * 8, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full border border-cyan-300/20"
            style={{ inset: `${ring * 13 + 8}%` }}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-500 to-cyan-400 shadow-2xl shadow-cyan-500/25"
        >
          <BrainCircuit size={46} />
        </motion.div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['Predictive SLA risk', 'Flags breaches before they happen.', Gauge],
          ['Smart ticket summaries', 'Condenses history into technician-ready briefs.', Sparkles],
          ['Recommendation panels', 'Suggests next best actions for repeat issues.', BrainCircuit],
          ['Operational intelligence', 'Connects devices, users, tickets, and trends.', Layers],
        ].map(([title, body, Icon]) => (
          <GlowCard key={title} icon={Icon} title={title} body={body} />
        ))}
      </div>
    </div>
  );
}

export function SocialProofSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {socialMetrics.map(([label, value], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-center"
          >
            <p className="text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm text-zinc-500">{label}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {['Northstar MSP Group', 'Azure-first IT Team', 'Enterprise Service Desk'].map((name) => (
          <GlowCard key={name} title={name} body="Ticxnova gives our operations team a serious AI-first command layer for service delivery, device visibility, and executive reporting." />
        ))}
      </div>
    </div>
  );
}

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 text-center">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 p-10 shadow-2xl shadow-violet-950/30">
        <motion.div
          animate={{ x: ['-20%', '120%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-200 to-transparent"
        />
        <h2 className="relative text-4xl font-semibold tracking-tight md:text-6xl">Transform IT Operations With AI</h2>
        <p className="relative mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
          Launch a premium Microsoft-centric IT operations workspace for tickets, devices, analytics, automation, and AI-assisted service delivery.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <PremiumCTA to="/get-started">Start Free Trial</PremiumCTA>
          <PremiumCTA to="/contact" variant="secondary">Book Demo</PremiumCTA>
        </div>
      </div>
    </section>
  );
}
