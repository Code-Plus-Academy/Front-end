'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useAnalytics from './useAnalytics';
import { GA_EVENTS } from '../analytics/events';

const MILESTONES = [25, 50, 75, 90, 100];

/**
 * Tracks scroll depth milestones (25%, 50%, 75%, 90%, 100%) firing exactly once per page navigation.
 */
export default function useScrollDepth() {
  const { trackEvent } = useAnalytics();
  const pathname = usePathname();
  const firedMilestones = useRef(new Set());
  const pageStartTime = useRef(Date.now());

  useEffect(() => {
    // Reset milestones on route change
    firedMilestones.current.clear();
    pageStartTime.current = Date.now();

    if (typeof window === 'undefined') return;

    let ticking = false;

    const checkScroll = () => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      const winHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (docHeight <= winHeight) return; // Not scrollable

      const scrollPercent = Math.round(((scrollTop + winHeight) / docHeight) * 100);

      MILESTONES.forEach((milestone) => {
        if (scrollPercent >= milestone && !firedMilestones.current.has(milestone)) {
          firedMilestones.current.add(milestone);
          const timeToScrollSec = Math.round((Date.now() - pageStartTime.current) / 1000);

          trackEvent(GA_EVENTS.SCROLL_MILESTONE, {
            percent_scrolled: milestone,
            time_to_scroll_sec: timeToScrollSec,
            page_path: pathname,
          });
        }
      });
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, trackEvent]);
}
