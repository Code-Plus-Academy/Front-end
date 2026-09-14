'use client';
import { useEffect } from 'react';
import useAnalytics from './useAnalytics';
import { GA_EVENTS } from '../analytics/events';

/**
 * Tracks browser Core Web Vitals using PerformanceObserver API.
 */
export default function useWebVitals() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // 1. Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          trackEvent(GA_EVENTS.CORE_WEB_VITALS, {
            metric_name: 'LCP',
            metric_value: Math.round(lastEntry.startTime),
            metric_rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor',
            page_path: window.location.pathname,
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // 2. Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Report CLS on page unload or visibility hidden
      const reportCls = () => {
        if (clsValue > 0) {
          trackEvent(GA_EVENTS.CORE_WEB_VITALS, {
            metric_name: 'CLS',
            metric_value: Math.round(clsValue * 1000) / 1000,
            metric_rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor',
            page_path: window.location.pathname,
          });
        }
      };
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') reportCls();
      });

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch (e) {
      // Observer not supported or error
    }
  }, [trackEvent]);
}
