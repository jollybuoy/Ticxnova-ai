import { Suspense } from 'react';
import { PageSkeleton } from '../components/ui/skeletons/PageSkeleton';

export function createPageElement(LazyComponent, variant = 'default') {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <LazyComponent />
    </Suspense>
  );
}
