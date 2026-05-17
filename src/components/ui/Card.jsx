import { motion } from 'framer-motion';

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

export function Card({ children, className = '', hover = true, delay = 0, ...props }) {
  return (
    <motion.div
      {...cardMotion}
      transition={{ ...cardMotion.transition, delay }}
      whileHover={
        hover
          ? {
              y: -3,
              boxShadow: '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
              transition: { duration: 0.25, ease: 'easeOut' },
            }
          : undefined
      }
      className={`glass-card overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <motion.div
      className={`flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5 ${className}`}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
