'use client';
import { useEffect, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBEPXNWNR0';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track SPA route changes
  useEffect(() => {
    if (pathname && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_path: pathname,
        page_search: searchParams?.toString() || '',
      });
    }
  }, [pathname, searchParams]);

  return null;
}

import { useAuth } from '../../context/AuthContext';

export default function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Check minor status
  let isMinor = false;
  if (user && user.date_of_birth) {
    const ageDifMs = Date.now() - new Date(user.date_of_birth).getTime();
    const ageDate = new Date(ageDifMs);
    isMinor = Math.abs(ageDate.getUTCFullYear() - 1970) < 18;
  }

  // Initialize dataLayer safely
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    
    // Check saved preferences
    let saved = null;
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem('cpa_cookie_consent_v2');
      if (savedStr) {
        try { saved = JSON.parse(savedStr); } catch (e) {}
      }
    }

    const isAdGranted = (saved?.advertising && !isMinor) ? 'granted' : 'denied';
    const isAnalyticsGranted = (saved?.analytics && !isMinor) ? 'granted' : 'denied';
    const isFunctionalGranted = saved?.functional ? 'granted' : 'denied';

    // Default Consent Mode V2
    gtag('consent', 'default', {
      ad_storage: isAdGranted,
      analytics_storage: isAnalyticsGranted,
      ad_user_data: isAdGranted,
      ad_personalization: isAdGranted,
      personalization_storage: isFunctionalGranted,
      wait_for_update: 500,
    });
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: pathname,
      send_page_view: false // We handle page_views manually on route changes
    });
  }, [isMinor]);

  return (
    <>
      <Script 
        strategy="afterInteractive" 
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  );
}
