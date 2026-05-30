'use client';

import { Suspense } from 'react';
import useAnalytics from '../../hooks/useAnalytics';

function AnalyticsInner() {
  useAnalytics();
  return null;
}

// Wrapped in Suspense because useSearchParams() requires it in Next.js
export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
