import React, { Suspense } from 'react';
import ShortsPage from '../../src/views/ShortsPage';

export const metadata = {
  title: 'Shorts',
  description: 'Watch short developer tutorials, tips, and insights on FocusGram.',
  alternates: {
    canonical: 'https://www.codeplusacademy.in/shorts',
  },
  openGraph: {
    title: 'Shorts | FocusGram',
    description: 'Watch short developer tutorials, tips, and insights on FocusGram.',
    url: 'https://www.codeplusacademy.in/shorts',
    type: 'website',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <ShortsPage />
    </Suspense>
  );
}
