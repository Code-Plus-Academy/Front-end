import React from 'react';
import { FAQ } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Frequently Asked Questions | FocusGram',
  description: 'Find answers to frequently asked questions about FocusGram.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ | FocusGram',
    description: 'Find answers to frequently asked questions about FocusGram.',
    url: '/faq',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <FAQ />
    </AppLayout>
  );
}
