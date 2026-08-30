import React, { Suspense } from 'react';
import Explore from '../../src/views/Explore';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Explore | FocusGram',
  description: 'Discover the latest coding tutorials, projects, and resources shared by developers in the FocusGram community.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title: 'Explore | FocusGram',
    description: 'Discover the latest coding tutorials, projects, and resources shared by developers in the FocusGram community.',
    url: '/explore',
  }
};

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <Explore />
      </Suspense>
    </AppLayout>
  );
}
