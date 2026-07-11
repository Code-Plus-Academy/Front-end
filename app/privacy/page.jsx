import React from 'react';
import { Privacy } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Read the privacy policy for Code Plus Academy.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Code Plus Academy',
    description: 'Read the privacy policy for Code Plus Academy.',
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
