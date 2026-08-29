'use client';
import { useEffect, useRef } from 'react';
import useAnalytics from './useAnalytics';
import { GA_EVENTS, BREAKPOINTS } from '../analytics/events';

function getBreakpoint(width) {
  if (width < 640) return BREAKPOINTS.MOBILE;
  if (width < 1024) return BREAKPOINTS.TABLET;
  if (width < 1440) return BREAKPOINTS.DESKTOP;
  return BREAKPOINTS.ULTRAWIDE;
}

/**
 * Tracks dynamic viewport breakpoint changes and orientation shifts.
 */
export default function useResponsiveBreakpoints() {
  const { trackEvent } = useAnalytics();
  const currentBreakpoint = useRef(null);
  const currentOrientation = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    currentBreakpoint.current = getBreakpoint(window.innerWidth);
    currentOrientation.current = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    let timeoutId = null;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newBreakpoint = getBreakpoint(window.innerWidth);
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

        if (newBreakpoint !== currentBreakpoint.current || newOrientation !== currentOrientation.current) {
          trackEvent(GA_EVENTS.BREAKPOINT_TRANSITION, {
            previous_breakpoint: currentBreakpoint.current,
            new_breakpoint: newBreakpoint,
            previous_orientation: currentOrientation.current,
            new_orientation: newOrientation,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            device_pixel_ratio: window.devicePixelRatio || 1,
            page_path: window.location.pathname,
          });

          currentBreakpoint.current = newBreakpoint;
          currentOrientation.current = newOrientation;
        }
      }, 300); // 300ms debounce
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [trackEvent]);
}
