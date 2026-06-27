'use client';

import React from 'react';
import Explore from '../../src/views/Explore';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <Explore />
    </AppLayout>
  );
}
