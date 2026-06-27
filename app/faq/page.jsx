'use client';

import React from 'react';
import { FAQ } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <FAQ />
    </AppLayout>
  );
}
