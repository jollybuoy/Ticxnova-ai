import { memo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
};

function PageTransitionComponent({ children }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      transition={pageTransition.transition}
      className="page-transition-root"
    >
      {children}
    </motion.div>
  );
}

export const PageTransition = memo(PageTransitionComponent);
