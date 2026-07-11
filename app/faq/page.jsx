import React from 'react';
import { FAQ } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to frequently asked questions about Code Plus Academy.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ | Code Plus Academy',
    description: 'Find answers to frequently asked questions about Code Plus Academy.',
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
