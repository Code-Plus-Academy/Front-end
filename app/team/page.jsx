import React from 'react';
import { Builders } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Meet the Team — FocusGram',
  description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale FocusGram.',
  alternates: {
    canonical: '/team',
  },
  openGraph: {
    title: 'Meet the Team — FocusGram',
    description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale FocusGram.',
    url: '/team',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Builders />
    </AppLayout>
  );
}
