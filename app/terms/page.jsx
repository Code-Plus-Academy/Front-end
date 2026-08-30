import React from 'react';
import { Terms } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Terms and Conditions | FocusGram',
  description: 'Read the terms and conditions for using FocusGram.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms and Conditions | FocusGram',
    description: 'Read the terms and conditions for using FocusGram.',
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
