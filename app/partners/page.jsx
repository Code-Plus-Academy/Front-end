import React from 'react';
import { Partners } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Partners Program | FocusGram',
  description: 'Partnering with tech leaders, cloud providers, and top universities across the FocusGram ecosystem.',
  alternates: {
    canonical: '/partners',
  },
  openGraph: {
    title: 'Partners Program | FocusGram',
    description: 'Partnering with tech leaders, cloud providers, and top universities across the FocusGram ecosystem.',
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
