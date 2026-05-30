import ClientProviders from './client-providers';
import '../styles/tokens.css';
import '../styles/responsive.css';
import '../styles/globals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Code Plus Academy — Where Developers Ship, Share & Grow',
  description: 'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
  openGraph: {
    type: 'website',
    title: 'Code Plus Academy — Where Developers Ship, Share & Grow',
    description: 'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Plus Academy — Where Developers Ship, Share & Grow',
    description: 'Code Plus Academy (CPA) is the central platform for developers to discover, share, and download coding resources, courses, tutorials, and documentation.',
    images: ['/og-image.jpg'],
  },
  other: {
    'google-adsense-account': 'ca-pub-7869829460353350',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FBEPXNWNR0" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FBEPXNWNR0');` }} />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7869829460353350" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('cpa_theme');var sys=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';var t=s==='light'?'light':s==='dark'?'dark':sys;if(t==='light')document.body.classList.add('light-mode');}catch(e){}})();` }} />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
