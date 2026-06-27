'use client';

import React from 'react';
import PublicProfile from '../../../src/views/PublicProfile';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <PublicProfile />
    </AppLayout>
  );
}
