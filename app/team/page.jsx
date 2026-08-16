import React from 'react';
import { Builders } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Meet the Team — Code Plus Academy',
  description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale Code Plus Academy.',
  alternates: {
    canonical: '/team',
  },
  openGraph: {
    title: 'Meet the Team — Code Plus Academy',
    description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale Code Plus Academy.',
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
