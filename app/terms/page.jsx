import React from 'react';
import { Terms } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using Code Plus Academy.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms and Conditions | Code Plus Academy',
    description: 'Read the terms and conditions for using Code Plus Academy.',
    url: '/terms',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Terms />
    </AppLayout>
  );
}
