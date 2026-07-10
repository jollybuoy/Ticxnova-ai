import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  MessageSquare,
  Route,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react';

const aiCapabilities = [
  {
    title: 'Conversational intake',
    body: 'Users describe issues naturally. AI extracts symptoms, urgency, and affected systems.',
    icon: MessageSquare,
    metric: '< 8s triage',
  },
  {
    title: 'Auto-classification',
    body: 'Incident vs service request, category, department, and P1–P4 priority assigned automatically.',
    icon: BrainCircuit,
    metric: '94% confidence',
  },
  {
    title: 'Smart enrichment',
    body: 'Links directory users, devices, warranty data, and prior tickets before a technician opens the case.',
    icon: Layers,
    metric: '360° context',
  },
  {
    title: 'Resolution intelligence',
    body: 'AI suggests fixes, drafts summaries, and updates SLA dashboards in realtime.',
    icon: Zap,
    metric: 'Live SLA sync',
  },
];

const ticketQueue = [
  { id: 'INC-1042', title: 'Email MFA loop after password change', priority: 'P2', ai: 'Routing…', status: 'ai-active' },
  { id: 'SR-881', title: 'New laptop for finance analyst', priority: 'P3', ai: 'Classified', status: 'ready' },
  { id: 'INC-1039', title: 'VPN disconnects on macOS Sequoia', priority: 'P1', ai: 'Escalated', status: 'breach-risk' },
];

const chatScript = [
  { role: 'user', text: 'Email keeps prompting for password after MFA rollout.' },
  { role: 'ai', text: 'Analyzing identity sign-in logs, mailbox profile, and token health…' },
  { role: 'ai', text: 'Recommended: P2 Incident · Category: Email · Device LAP-204 linked.' },
];

function AdvancedTicketingVisual() {
  const [chatIndex, setChatIndex] = useState(0);
  const [ticketProgress, setTicketProgress] = useState(0);

  useEffect(() => {
    const chatTimer = setInterval(() => {
      setChatIndex((current) => (current + 1) % (chatScript.length + 1));
    }, 2800);
    const progressTimer = setInterval(() => {
      setTicketProgress((current) => (current >= 100 ? 0 : current + 12));
    }, 900);
    return () => {
      clearInterval(chatTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, delay: 0.15 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-[#040711] p-4 shadow-2xl shadow-cyan-950/50 sm:p-5"
    >
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,0.28),transparent_35%),radial-gradient(circle_at_85%_100%,rgba(6,182,212,0.2),transparent_40%)]"
      />

      <motion.div
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30">
            <Bot size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200">AI Ticketing Engine</p>
            <p className="text-sm font-semibold text-white">Autonomous service desk intelligence</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-medium text-emerald-200">
            Live classification
          </span>
          <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[10px] font-medium text-violet-100">
            SLA-aware
          </span>
        </div>
      </motion.div>

      <div className="relative grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Incoming signals</p>
          <AnimatePresence mode="popLayout">
            {chatIndex > 0 &&
              chatScript.slice(0, chatIndex).map((line, index) => (
                <motion.div
                  key={`${line.text}-${index}`}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border p-3 text-sm leading-6 ${
                    line.role === 'user'
                      ? 'border-white/10 bg-white/[0.04] text-zinc-200'
                      : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50'
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {line.role === 'user' ? 'End user' : 'Ticxnova AI'}
                  </p>
                  {line.text}
                </motion.div>
              ))}
          </AnimatePresence>

          <motion.div
            animate={{ opacity: chatIndex < chatScript.length ? [0.4, 1, 0.4] : 0 }}
            className="flex items-center gap-2 text-xs text-cyan-300"
          >
            <BrainCircuit size={14} />
            Neural triage in progress…
          </motion.div>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-white">AI-generated ticket draft</p>
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
            >
              Ready to submit
            </motion.span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3"
          >
            <div className="flex flex-wrap gap-2">
              {['Incident', 'Email / Identity', 'P2 · High', 'User linked'].map((tag) => (
                <span key={tag} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-zinc-200">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-white">Email MFA authentication loop</p>
            <p className="text-xs leading-5 text-zinc-400">
              AI summary: Token refresh failure after MFA policy update. Recommend profile repair and sign-in log review.
            </p>
            <motion.div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${ticketProgress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300"
              />
            </motion.div>
            <p className="text-[10px] text-cyan-300">Auto-filling ticket fields · {ticketProgress}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 grid grid-cols-2 gap-2"
          >
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center">
              <Route size={16} className="mx-auto text-cyan-300" />
              <p className="mt-1 text-[10px] text-zinc-400">Routed to</p>
              <p className="text-xs font-semibold text-white">L2 Identity</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center">
              <Gauge size={16} className="mx-auto text-emerald-300" />
              <p className="mt-1 text-[10px] text-zinc-400">SLA target</p>
              <p className="text-xs font-semibold text-emerald-300">4h response</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Live ticket queue</p>
        {ticketQueue.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.08 }}
            whileHover={{ x: 4, borderColor: 'rgba(34,211,238,0.35)' }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
          >
            <Ticket size={15} className="shrink-0 text-violet-300" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-cyan-200">{ticket.id}</span>
                <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-100">{ticket.priority}</span>
                {ticket.status === 'breach-risk' && (
                  <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-200">SLA risk</span>
                )}
              </div>
              <p className="truncate text-xs text-zinc-400">{ticket.title}</p>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-cyan-300">{ticket.ai}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -right-1 top-1/3 hidden rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] text-cyan-100 lg:block"
      >
        <Cpu size={12} className="mb-1 inline" /> 2.4M AI events / mo
      </motion.div>
    </motion.div>
  );
}

function ShowcaseCTA({ to, children, variant = 'primary' }) {
  const styles =
    variant === 'primary'
      ? 'bg-white text-zinc-950 shadow-xl shadow-white/10 hover:shadow-cyan-300/25'
      : 'border border-white/10 bg-white/[0.04] text-white backdrop-blur-xl hover:border-cyan-300/40';

  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${styles}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
      <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function AiWorkflowShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-24 lg:pb-16 lg:pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
      >
        {['AI-native', 'Auto-priority', 'SLA engine', 'Integration-ready'].map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-300"
          >
            {badge}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="order-2 text-left lg:order-1"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-100">
            <Sparkles size={14} className="text-cyan-300" />
            Advanced AI Ticketing
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.08]">
            The AI ticketing system that thinks like your best engineer
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-zinc-400 sm:mt-5">
            Ticxnova is not a traditional helpdesk with a chatbot bolted on. It is an intelligent ticketing platform that
            classifies, enriches, routes, and resolves IT issues using realtime AI — built for MSPs and modern IT operations teams.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:mt-8">
            {aiCapabilities.map(({ title, body, icon: Icon, metric }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.06 }}
                whileHover={{ y: -4, borderColor: 'rgba(34,211,238,0.35)' }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <motion.div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <Icon size={17} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{metric}</span>
                </motion.div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1.5 text-xs leading-6 text-zinc-500">{body}</p>
              </motion.div>
            ))}
          </div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 space-y-2 text-sm text-zinc-400"
          >
            {[
              'Conversational ticket creation with human confirmation',
              'P1–P4 priority and incident type assigned by AI',
              'Device, identity, and history context attached automatically',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row"
          >
            <ShowcaseCTA to="/get-started">Start Free Trial</ShowcaseCTA>
            <ShowcaseCTA to="/contact" variant="secondary">Book Demo</ShowcaseCTA>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="relative order-1 lg:order-2 lg:pl-2"
        >
          <motion.div
            animate={{ opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/30 via-cyan-400/20 to-transparent blur-2xl"
          />
          <AdvancedTicketingVisual />
        </motion.div>
      </motion.div>
    </section>
  );
}
