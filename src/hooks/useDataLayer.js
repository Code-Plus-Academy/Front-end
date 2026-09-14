'use client';
import { useCallback } from 'react';
import { sanitizePayload } from '../analytics/sanitize';

/**
 * Enterprise hook to safely push formatted, sanitized events into the GA4/GTM dataLayer.
 */
export default function useDataLayer() {
  const trackEvent = useCallback((eventName, parameters = {}) => {
    if (typeof window === 'undefined' || !eventName) return;
    try {
      window.dataLayer = window.dataLayer || [];
      const cleanParams = sanitizePayload(parameters);
      window.dataLayer.push({
        event: eventName,
        ...cleanParams,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Graceful degradation: never crash UI on analytics error
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics Error]', error);
      }
    }
  }, []);

  const setUserId = useCallback((userId, properties = {}) => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      window.dataLayer = window.dataLayer || [];
      const cleanProps = sanitizePayload(properties);
      window.dataLayer.push({
        event: 'set_user_properties',
        user_id: String(userId),
        ...cleanProps,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics User Error]', error);
      }
    }
  }, []);

  return { trackEvent, setUserId };
}
