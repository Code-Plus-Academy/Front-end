import FocusGramDownloadPage from '@/src/components/focusgram_download_page';

export const metadata = {
  title: 'Download FocusGram for Android',
  description:
    'Install FocusGram on Android through the current PhonePe Appstore listing. Explore installation guidance and distribution updates.',
  alternates: {
    canonical: '/download',
  },
  openGraph: {
    title: 'Download FocusGram for Android',
    description:
      'Get FocusGram on Android through the current PhonePe Appstore listing.',
    url: '/download',
  },
};

export default function DownloadPage() {
  return <FocusGramDownloadPage />;
}
