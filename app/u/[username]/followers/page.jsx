'use client';

import React from 'react';
import { Followers } from '../../../../src/views/StubPages';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <Followers />
    </AppLayout>
  );
}
