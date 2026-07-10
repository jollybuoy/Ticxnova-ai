import { memo } from 'react';

function PageTransitionComponent({ children }) {
  return <div className="page-transition-root">{children}</div>;
}

export const PageTransition = memo(PageTransitionComponent);
