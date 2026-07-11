'use client';
import { useCallback } from 'react';

/**
 * Enterprise hook to safely push formatted events into the GA4/GTM dataLayer.
 */
export default function useDataLayer() {
  const trackEvent = useCallback((eventName, parameters = {}) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...parameters,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const setUserId = useCallback((userId, properties = {}) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      // Set user properties safely
      window.dataLayer.push({
        event: 'set_user_properties',
        user_id: userId,
        ...properties
      });
    }
  }, []);

  return { trackEvent, setUserId };
}
