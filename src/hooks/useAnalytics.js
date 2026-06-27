import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useAnalytics — Google Analytics 4 + React Router integration
 *
 * Usage:
 *   1. Drop `useAnalytics()` anywhere inside <BrowserRouter> (e.g. AppRoutes)
 *      → fires automatic page_view on every route change
 *
 *   2. Import trackEvent anywhere for custom events:
 *      import { trackEvent } from '../hooks/useAnalytics';
 *      trackEvent('article_view', { article_slug: slug, page_type: 'course' })
 *
 * Requires: window.gtag already loaded by index.html <script> tag.
 */

// Standalone helper — import this anywhere without needing the hook
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'undefined') return;
  window.gtag('event', eventName, params);
}

export default function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Fire page_view on every SPA route change
    if (typeof window.gtag === 'undefined') return;

    window.gtag('event', 'page_view', {
      page_path:     location.pathname,
      page_search:   location.search,
      page_location: window.location.href,
    });
  }, [location.pathname]);

  return { trackEvent };
}
