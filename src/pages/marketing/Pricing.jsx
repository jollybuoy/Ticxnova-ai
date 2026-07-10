import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  FinalCTA,
  GlowCard,
  MarketingLayout,
  MarketingSection,
  PremiumCTA,
} from '../../components/marketing/MarketingLayout';
import { pricingPlans } from '../../components/marketing/marketingData';

const comparisonRows = [
  ['AI Assistant', true, true, true],
  ['AI Summaries', false, true, true],
  ['Devices', true, true, true],
  ['Reports', true, true, true],
  ['SMTP', false, true, true],
  ['Microsoft Login', false, true, true],
  ['Graph Sync', false, false, true],
  ['Multi-domain', false, false, true],
  ['Automation', false, false, true],
  ['SLA Engine', false, true, true],
  ['Audit Logs', false, false, true],
  ['Advanced RBAC', false, false, true],
  ['Backups', false, true, true],
  ['Custom Branding', false, false, true],
];

export default function Pricing() {
  return (
    <MarketingLayout>
      <MarketingSection
        eyebrow="Pricing"
        title="Plans for SMBs, MSPs, and enterprise IT teams"
        description="Start with AI ticketing and grow into Microsoft integrations, automation, multi-domain operations, and enterprise governance."
        className="pt-28"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <GlowCard
              key={plan.name}
              title={plan.name}
              body={plan.description}
              className={`min-h-full ${plan.featured ? 'border-cyan-300/50 bg-gradient-to-br from-cyan-300/[0.12] to-violet-500/[0.08] shadow-cyan-950/50' : ''}`}
            >
              {plan.featured && (
                <motion.div
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                  className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                >
                  Enterprise-grade
                </motion.div>
              )}
              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-semibold">{plan.price}</span>
                {plan.priceNote && <span className="mb-1 text-sm text-zinc-500">{plan.priceNote}</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <PremiumCTA
                to={plan.name === 'Enterprise' ? '/contact' : '/get-started'}
                className="mt-8 w-full"
                variant={index === 0 ? 'secondary' : 'primary'}
              >
                {plan.name === 'Enterprise' ? 'Book Demo' : 'Start Free Trial'}
              </PremiumCTA>
            </GlowCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Comparison"
        title="Enterprise comparison at a glance"
        description="A premium plan matrix for buyers comparing AI, Microsoft, automation, governance, reporting, and enterprise controls."
      >
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-left text-zinc-400">
                <th className="px-5 py-4">Capability</th>
                <th className="px-5 py-4">Starter</th>
                <th className="px-5 py-4">Professional</th>
                <th className="px-5 py-4 text-cyan-200">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {comparisonRows.map(([feature, starter, professional, enterprise]) => (
                <motion.tr
                  key={feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="transition-colors hover:bg-cyan-300/[0.04]"
                >
                  <td className="px-5 py-4 text-white">{feature}</td>
                  {[starter, professional, enterprise].map((enabled, index) => (
                    <td key={`${feature}-${index}`} className="px-5 py-4">
                      {enabled ? <CheckCircle2 size={17} className="text-emerald-300" /> : <span className="text-zinc-700">—</span>}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>
      <FinalCTA />
    </MarketingLayout>
  );
}
