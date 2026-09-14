import React from 'react';
import { AboutUs } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'About Us | FocusGram',
  description: 'Empowering 100K+ developers with code, community, and content.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us | FocusGram',
    description: 'Empowering 100K+ developers with code, community, and content.',
    url: '/about',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <AboutUs />
    </AppLayout>
  );
}
