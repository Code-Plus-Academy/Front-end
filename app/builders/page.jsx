import React from 'react';
import { Builders } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Meet the Builders & Team — FocusGram',
  description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale FocusGram.',
  alternates: {
    canonical: '/builders',
  },
  openGraph: {
    title: 'Meet the Builders & Team — FocusGram',
    description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale FocusGram.',
    url: '/builders',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Builders />
    </AppLayout>
  );
}
