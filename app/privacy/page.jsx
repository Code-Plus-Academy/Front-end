import React from 'react';
import { Privacy } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Privacy Policy | FocusGram',
  description: 'Read the privacy policy for FocusGram.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | FocusGram',
    description: 'Read the privacy policy for FocusGram.',
    url: '/privacy',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Privacy />
    </AppLayout>
  );
}
