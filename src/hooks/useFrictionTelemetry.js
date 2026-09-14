'use client';
import { useEffect, useRef } from 'react';
import useAnalytics from './useAnalytics';
import { GA_EVENTS } from '../analytics/events';

/**
 * Monitors user frustration signals:
 * 1. Rage clicks: >= 3 rapid clicks within 600ms on the same element / target region
 * 2. Unhandled errors: client-side JavaScript execution exceptions
 */
export default function useFrictionTelemetry() {
  const { trackEvent } = useAnalytics();
  const clickHistory = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect rage clicks
    const handleClick = (event) => {
      const now = Date.now();
      const target = event.target;
      const targetTag = target ? target.tagName.toLowerCase() : 'unknown';
      const targetId = target?.id || '';
      const targetClass = target?.className ? String(target.className).slice(0, 50) : '';

      clickHistory.current.push({ time: now, target });

      // Keep only clicks within last 600ms
      clickHistory.current = clickHistory.current.filter((c) => now - c.time <= 600);

      if (clickHistory.current.length >= 3) {
        // Check if all clicks in window are on the same element
        const sameTarget = clickHistory.current.every((c) => c.target === target);
        if (sameTarget) {
          trackEvent(GA_EVENTS.RAGE_CLICK, {
            element_tag: targetTag,
            element_id: targetId,
            element_class: targetClass,
            click_count: clickHistory.current.length,
            page_path: window.location.pathname,
          });
          // Reset after logging to prevent spamming
          clickHistory.current = [];
        }
      }
    };

    // Global Error Catcher for client-side exceptions
    const handleError = (event) => {
      const errorMsg = event.message || event.error?.message || 'Unknown Error';
      const filename = event.filename ? event.filename.split('/').pop() : 'inline';
      const lineno = event.lineno || 0;

      trackEvent(GA_EVENTS.CLIENT_ERROR, {
        error_message: String(errorMsg).slice(0, 100),
        error_file: filename,
        line_number: lineno,
        page_path: window.location.pathname,
      });
    };

    window.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('error', handleError);
    };
  }, [trackEvent]);
}
