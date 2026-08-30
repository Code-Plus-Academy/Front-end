import React from 'react';
import { Contributors } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Contributors | FocusGram',
  description: 'Recognizing the students and campus leads across the community.',
  alternates: {
    canonical: '/contributors',
  },
  openGraph: {
    title: 'Contributors | FocusGram',
    description: 'Recognizing the students and campus leads across the community.',
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
