import React from 'react';
import { Contributors } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Contributors | Code Plus Academy',
  description: 'Recognizing the students and campus leads behind Notes Arena.',
  alternates: {
    canonical: '/contributors',
  },
  openGraph: {
    title: 'Contributors | Code Plus Academy',
    description: 'Recognizing the students and campus leads behind Notes Arena.',
    url: '/contributors',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Contributors />
    </AppLayout>
  );
}
