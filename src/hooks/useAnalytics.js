'use client';
import useDataLayer from './useDataLayer';

/**
 * Legacy proxy wrapper. 
 * Automatically routes all old trackEvent calls into the new GA4/GTM Data Layer format.
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...params,
      timestamp: new Date().toISOString()
    });
  }
}

export default function useAnalytics() {
  // We no longer trigger page_views here, as AnalyticsProvider handles it via Next.js navigation.
  const { trackEvent } = useDataLayer();
  return { trackEvent };
}
