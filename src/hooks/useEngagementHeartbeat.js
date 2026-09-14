'use client';
import { useEffect, useRef } from 'react';
import useAnalytics from './useAnalytics';
import { GA_EVENTS } from '../analytics/events';

/**
 * Minute-to-minute active engagement heartbeat hook.
 * Only tracks active study/reading engagement (pauses when idle > 60s or tab backgrounded).
 */
export default function useEngagementHeartbeat() {
  const { trackEvent } = useAnalytics();
  const activeSeconds = useRef(0);
  const isVisible = useRef(true);
  const lastActivityTimestamp = useRef(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onActivity = () => {
      lastActivityTimestamp.current = Date.now();
    };

    const onVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Heartbeat ticker every 60 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const isIdle = now - lastActivityTimestamp.current > 60000;

      if (isVisible.current && !isIdle) {
        activeSeconds.current += 60;
        trackEvent(GA_EVENTS.ENGAGEMENT_HEARTBEAT, {
          active_seconds: activeSeconds.current,
          engagement_time_msec: 60000,
          tab_visible: true,
          page_path: window.location.pathname,
        });
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [trackEvent]);
}
