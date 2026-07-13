import Script from 'next/script';
import '../src/index.css';
import Providers from './providers';
import RouterBridge from '../src/components/layout/RouterBridge';
import { Suspense } from 'react';
import AnalyticsProvider from '../src/components/providers/AnalyticsProvider';
import ConsentBanner from '../src/components/layout/ConsentBanner';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

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
      </head>
      <body suppressHydrationWarning>
        <Script id="cpa-theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var stored = localStorage.getItem('cpa_theme');
                var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                var theme = stored === 'light' ? 'light' : stored === 'dark' ? 'dark' : system;
                if (theme === 'light') document.body.classList.add('light-mode');
              } catch (error) {}
            })();
          `}
        </Script>
        <AnalyticsProvider>
          <ConsentBanner />
          <RouterBridge>
            <Providers>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </Providers>
          </RouterBridge>
        </AnalyticsProvider>
      </body>
    </html>
  );
}

