import Script from 'next/script';
import '../src/index.css';
import Providers from './providers';
import RouterBridge from '../src/components/layout/RouterBridge';
import { Suspense } from 'react';
import AnalyticsProvider from '../src/components/providers/AnalyticsProvider';
import ConsentBanner from '../src/components/layout/ConsentBanner';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

// Without this, mobile browsers/WebViews default to a ~980px desktop-style
// layout viewport instead of the real device width — this is what was
// causing content to render narrower than the screen with blank space
// bleeding off the right edge on phones.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // also fixes safe-area-inset-* used by MobileBottomNav
};

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Code Plus Academy - Where Developers Ship, Share & Grow',
    template: '%s | Code Plus Academy',
  },
  description:
    'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Code Plus Academy - Where Developers Ship, Share & Grow',
    description:
      'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
    images: ['/og-image.jpg'],
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Plus Academy - Where Developers Ship, Share & Grow',
    description:
      'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
    images: ['/og-image.jpg'],
  },
};

// ---------------------------------------------------------------------------
// Site-level Organization JSON-LD
// ---------------------------------------------------------------------------
// Placed once in the root layout so it appears in every page's raw HTML.
// This tells Google the domain's brand name, logo, and social links —
// which is what powers the platform icon + name shown next to the domain
// in Google search results (similar to how YouTube / Instagram appear).
// Update the sameAs URLs if CPA's official social handles change.
// ---------------------------------------------------------------------------
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Code Plus Academy',
  alternateName: 'CPA',
  url: baseUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${baseUrl}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://www.youtube.com/@codeplusacademy',
    'https://www.instagram.com/codeplusacademy',
    'https://twitter.com/codeplusacademy',
    'https://www.linkedin.com/company/codeplusacademy',
  ],
};

// XSS-safe serialiser — prevents script-injection via < in any org field.
const orgJsonLdString = JSON.stringify(orgJsonLd).replace(/</g, '\\u003c');

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon-light.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" href="/favicon-dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="preconnect" href="https://api.codeplusacademy.in" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <meta name="google-adsense-account" content="ca-pub-7869829460353350" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7869829460353350"
          crossOrigin="anonymous"
        />
        {/* Site-level Organization structured data — in every page's <head> */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: orgJsonLdString }}
        />
      </head>
      <body suppressHydrationWarning>
        <Script id="cpa-theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var stored = localStorage.getItem('cpa_theme');
                var userToken = localStorage.getItem('cpa_token') || localStorage.getItem('cpa_user') || (document.cookie.indexOf('cpa_session') !== -1);
                var theme = 'light';
                if (userToken && stored) {
                  if (stored === 'dark') {
                    theme = 'dark';
                  } else if (stored === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } else {
                    theme = 'light';
                  }
                } else {
                  theme = 'light';
                }
                if (theme === 'light') {
                  document.body.classList.add('light-mode');
                  document.body.classList.remove('dark-mode');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.body.classList.remove('light-mode');
                  document.body.classList.add('dark-mode');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (error) {}
            })();
          `}
        </Script>
        <RouterBridge>
          <Providers>
            <AnalyticsProvider>
              <ConsentBanner />
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </AnalyticsProvider>
          </Providers>
        </RouterBridge>
      </body>
    </html>
  );
}
