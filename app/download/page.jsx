import FocusGramDownloadPage from '@/src/components/focusgram_download_page';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';
const canonicalUrl = new URL('/download', baseUrl).toString();

const pageTitle = 'FocusGram Android App | Developer Community & Notes';
const pageDescription =
  'Download FocusGram for Android: join developer conversations, explore academic notes and technical articles, and publish what you learn. Get it on PhonePe Appstore.';

export const metadata = {
  title: {
    absolute: pageTitle,
  },
  description: pageDescription,
  applicationName: 'FocusGram',
  authors: [{ name: 'Code Plus Academy', url: 'https://www.codeplusacademy.in' }],
  creator: 'Code Plus Academy',
  publisher: 'Code Plus Academy',
  category: 'Technology',
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'FocusGram',
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    images: [
      {
        url: '/focusgram-logo-with-name.webp',
        alt: 'FocusGram by Code Plus Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: ['/focusgram-logo-with-name.webp'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description: pageDescription,
      inLanguage: 'en-IN',
      isPartOf: {
        '@id': `${baseUrl}/#website`,
      },
      about: {
        '@type': 'Thing',
        name: 'FocusGram Android app',
        description:
          'A developer community and learning platform for sharing technical content, discovering resources and publishing work.',
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: new URL('/focusgram-logo-with-name.webp', baseUrl).toString(),
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'FocusGram for Android',
          item: canonicalUrl,
        },
      ],
    },
  ],
};

export default function DownloadPage() {
  const safeStructuredData = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStructuredData }}
      />
      <FocusGramDownloadPage />
    </>
  );
}
