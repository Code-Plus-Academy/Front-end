'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import AboutAccount from '../../../../src/views/AboutAccount';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import LottieProfileLoader from '../../../../src/components/ui/LottieProfileLoader';

function AboutAccountByParam() {
  const params = useParams();
  const username = params?.username;
  return <AboutAccount username={username} />;
}

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LottieProfileLoader />
        </div>
      }>
        <AboutAccountByParam />
      </Suspense>
    </AppLayout>
  );
}
