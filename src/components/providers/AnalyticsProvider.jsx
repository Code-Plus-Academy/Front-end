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

export default function AnalyticsProvider({ children }) {
  const pathname = usePathname();

  // Initialize dataLayer safely
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    
    // Default Consent Mode V2
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: pathname,
      send_page_view: false // We handle page_views manually on route changes
    });
  }, []);

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
