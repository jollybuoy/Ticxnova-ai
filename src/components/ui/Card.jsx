import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`rounded-xl border border-white/10 bg-surface-card/80 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, action, className = '' }) {
  return (
    <motion.div
      className={`flex items-center justify-between border-b border-white/5 px-5 py-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {action}
    </motion.div>
  );
}

export function CardBody({ children, className = '' }) {
  return <motion.div className={`p-5 ${className}`}>{children}</motion.div>;
}
