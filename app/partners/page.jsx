import React from 'react';
import { Partners } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Partners Program | Code Plus Academy',
  description: 'Partnering with tech leaders, cloud providers, and top universities.',
  alternates: {
    canonical: '/partners',
  },
  openGraph: {
    title: 'Partners Program | Code Plus Academy',
    description: 'Partnering with tech leaders, cloud providers, and top universities.',
    url: '/partners',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Partners />
    </AppLayout>
  );
}
