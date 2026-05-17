import { motion } from 'framer-motion';
import { Bot, Shield, Zap, BarChart3 } from 'lucide-react';
import { Icon } from '../ui/IconMap';

const features = [
  { icon: Bot, label: 'AI-powered ticket resolution' },
  { icon: Shield, label: 'Enterprise-grade security' },
  { icon: Zap, label: 'Automated IT workflows' },
  { icon: BarChart3, label: 'Real-time analytics' },
];

export function LoginHero() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-10 lg:p-14">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-violet-600/20" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-[100px]" />
      <motion.div className="absolute -right-10 bottom-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-600/30">
            <Icon name="Hexagon" size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Ticxnova-AI</h1>
            <p className="text-xs text-zinc-400">IT Management Platform</p>
          </div>
        </div>

        <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white lg:text-4xl">
          Intelligent IT operations for modern MSPs
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          Unify tickets, devices, and automation in one AI-native command center built for
          enterprise service teams.
        </p>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative mt-12 hidden space-y-4 lg:block"
      >
        {features.map((item, i) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-3 text-sm text-zinc-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
              <item.icon size={18} className="text-violet-400" />
            </span>
            {item.label}
          </motion.li>
        ))}
      </motion.ul>

      <p className="relative mt-8 hidden text-xs text-zinc-600 lg:block">
        Trusted by IT teams managing 10,000+ endpoints
      </p>
    </div>
  );
}
