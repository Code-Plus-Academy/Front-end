'use client';

import React, { Suspense } from 'react';
import Landing from '../src/views/Landing';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  );
}
