import React from 'react';
import { Builders } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Meet the Builders & Team — Code Plus Academy',
  description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale Code Plus Academy.',
  alternates: {
    canonical: '/builders',
  },
  openGraph: {
    title: 'Meet the Builders & Team — Code Plus Academy',
    description: 'Meet the software engineers, designers, founders, and core maintainers who built and scale Code Plus Academy.',
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
