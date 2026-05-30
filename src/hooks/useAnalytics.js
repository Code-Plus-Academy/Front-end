'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'undefined') return;
  window.gtag('event', eventName, params);
}

export default function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag === 'undefined') return;
    window.gtag('event', 'page_view', {
      page_path:     pathname,
      page_search:   searchParams?.toString() ? '?' + searchParams.toString() : '',
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return { trackEvent };
}
