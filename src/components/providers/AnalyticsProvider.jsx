'use client';
import { useEffect, Suspense, useCallback } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { sanitizeUrl } from '../../analytics/sanitize';
import TelemetryBridge from './TelemetryBridge';
import { useAuth } from '../../context/AuthContext';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBEPXNWNR0';

// ── CONTENT GROUP BREAKPOINTS ─────────────────────────────────────────────────
// Maps route prefixes → GA4 content_group values for structured reporting.
const CONTENT_GROUP_RULES = [
  // ── Notes Arena ──
  { prefix: '/notes/university/',       group: 'Notes / University Profile',  section: 'Notes Arena' },
  { prefix: '/notes/colleges/',         group: 'Notes / College Profile',     section: 'Notes Arena' },
  { prefix: '/notes/resource/',         group: 'Notes / Resource Detail',     section: 'Notes Arena' },
  { prefix: '/notes/subject/',          group: 'Notes / Subject',            section: 'Notes Arena' },
  { prefix: '/notes/type/',             group: 'Notes / Resource Type',      section: 'Notes Arena' },
  { prefix: '/notes/pyq/',              group: 'Notes / PYQ Browse',         section: 'Notes Arena' },
  { prefix: '/notes/search',            group: 'Notes / Search',             section: 'Notes Arena' },
  { prefix: '/notes/upload',            group: 'Notes / Upload',             section: 'Notes Arena' },
  { prefix: '/notes/departments',       group: 'Notes / Departments',        section: 'Notes Arena' },
  { prefix: '/notes',                   group: 'Notes / Home',               section: 'Notes Arena' },

  // ── User Profiles ──
  { prefix: '/u/',                      group: 'User Profile',               section: 'Profiles' },
  { prefix: '/profile',                 group: 'My Profile',                 section: 'Profiles' },

  // ── Creator & Studio ──
  { prefix: '/creator/',                group: 'Creator Dashboard',          section: 'Creator Studio' },
  { prefix: '/studio',                  group: 'Studio',                     section: 'Creator Studio' },

  // ── Content ──
  { prefix: '/feed',                    group: 'Feed',                       section: 'Social' },
  { prefix: '/explore',                 group: 'Explore',                    section: 'Discovery' },
  { prefix: '/articles/',               group: 'Article Detail',             section: 'Articles' },
  { prefix: '/articles',                group: 'Articles Home',              section: 'Articles' },
  { prefix: '/shorts/',                 group: 'Short Detail',               section: 'Shorts' },
  { prefix: '/shorts',                  group: 'Shorts Feed',               section: 'Shorts' },
  { prefix: '/posts/',                  group: 'Post Detail',               section: 'Social' },

  // ── Communication & Direct ──
  { prefix: '/direct/',                 group: 'Direct Message Chat',        section: 'Direct Messaging' },
  { prefix: '/direct',                  group: 'Direct Messages',            section: 'Direct Messaging' },

  // ── Attendance ──
  { prefix: '/attendance',              group: 'Attendance Dashboard',       section: 'Academic Portal' },
  { prefix: '/attendace',               group: 'Attendance Dashboard',       section: 'Academic Portal' },
  { prefix: '/notes/attendance',        group: 'Notes Attendance',           section: 'Academic Portal' },

  // ── Platform ──
  { prefix: '/admin/',                  group: 'Admin Dashboard',            section: 'Admin' },
  { prefix: '/settings',               group: 'Settings',                   section: 'Platform' },
  { prefix: '/notifications',          group: 'Notifications',              section: 'Platform' },
  { prefix: '/search',                 group: 'Global Search',              section: 'Platform' },
  { prefix: '/bookmarks',              group: 'Bookmarks',                  section: 'Platform' },

  // ── Auth ──
  { prefix: '/login',                  group: 'Login',                      section: 'Auth' },
  { prefix: '/signup',                 group: 'Signup',                     section: 'Auth' },
  { prefix: '/forgot-password',        group: 'Forgot Password',           section: 'Auth' },

  // ── Legal / Static ──
  { prefix: '/terms',                  group: 'Terms of Service',           section: 'Legal' },
  { prefix: '/privacy',                group: 'Privacy Policy',             section: 'Legal' },
  { prefix: '/about',                  group: 'About',                      section: 'Static' },
  { prefix: '/contact',                group: 'Contact',                    section: 'Static' },
];

/**
 * Resolves the GA4 content_group, content_group2 (section), and a readable
 * page_type from the current pathname.
 */
export function resolveContentGroup(pathname) {
  if (!pathname) return { content_group: 'Other', content_group2: 'Unknown', page_type: 'other' };

  for (const rule of CONTENT_GROUP_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix)) {
      return {
        content_group:  rule.group,
        content_group2: rule.section,
        page_type:      rule.group.toLowerCase().replace(/[\s\/]+/g, '_'),
      };
    }
  }

  // Homepage
  if (pathname === '/' || pathname === '') {
    return { content_group: 'Homepage', content_group2: 'Platform', page_type: 'homepage' };
  }

  return { content_group: 'Other', content_group2: 'Unknown', page_type: 'other' };
}

// ── ANALYTICS TRACKER ─────────────────────────────────────────────────────────
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track SPA route changes and page-level engagement duration
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;

    let isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    let totalEngagedMs = 0;
    let lastVisibleTime = isVisible ? Date.now() : 0;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isVisible = true;
        lastVisibleTime = Date.now();
      } else {
        if (isVisible && lastVisibleTime > 0) {
          totalEngagedMs += Date.now() - lastVisibleTime;
        }
        isVisible = false;
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    // Delay slightly so Next.js finishes updating document.title for the new route
    const timer = setTimeout(() => {
      const { content_group, content_group2, page_type } = resolveContentGroup(pathname);
      const pageTitle = typeof document !== 'undefined' ? document.title : '';
      const cleanUrl = sanitizeUrl(window.location.href);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }

      // 1. Direct GTM dataLayer push (for GTM Custom Event / Trigger detection)
      window.dataLayer.push({
        event: 'page_view',
        page_path: pathname,
        page_title: pageTitle,
        page_location: cleanUrl,
        content_group,
        content_group2,
        page_type,
      });

      // 2. Direct GA4 gtag event
      gtag('event', 'page_view', {
        page_path: pathname,
        page_title: pageTitle,
        page_location: cleanUrl,
        content_group,
        content_group2,
        page_type,
        send_to: GA_MEASUREMENT_ID,
      });
    }, 120);

    // When navigating away from this route, send the exact time spent on this page
    return () => {
      clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }

      let engagedDuration = totalEngagedMs;
      if (isVisible && lastVisibleTime > 0) {
        engagedDuration += Date.now() - lastVisibleTime;
      }

      // Record engagement time if user spent at least 1 second on the page
      if (engagedDuration >= 1000) {
        const { content_group, content_group2, page_type } = resolveContentGroup(pathname);
        const pageTitle = typeof document !== 'undefined' ? document.title : '';
        const cleanUrl = typeof window !== 'undefined' ? sanitizeUrl(window.location.href) : '';

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }

        const cappedDuration = Math.min(engagedDuration, 1800000); // 30 min cap

        gtag('event', 'user_engagement', {
          engagement_time_msec: cappedDuration,
          page_path: pathname,
          page_title: pageTitle,
          page_location: cleanUrl,
          content_group,
          content_group2,
          page_type,
          send_to: GA_MEASUREMENT_ID,
        });

        window.dataLayer.push({
          event: 'user_engagement',
          engagement_time_msec: cappedDuration,
          page_path: pathname,
          page_title: pageTitle,
          page_location: cleanUrl,
        });
      }
    };
  }, [pathname, searchParams]);

  return null;
}

// ── PROVIDER ──────────────────────────────────────────────────────────────────
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

  // Set user properties if authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    if (user?.id) {
      gtag('config', GA_MEASUREMENT_ID, {
        user_id: String(user.id),
      });
      gtag('set', 'user_properties', {
        is_creator: Boolean(user.is_creator || user.role === 'creator'),
        theme_preference: localStorage.getItem('cpa_theme') || 'light',
      });
    }
  }, [user]);

  return (
    <>
      <Script 
        strategy="afterInteractive" 
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Suspense fallback={null}>
        <AnalyticsTracker />
        <TelemetryBridge />
      </Suspense>
      {children}
    </>
  );
}
