'use client';

import React from 'react';
import { Terms } from '../../src/views/Static';
import { AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <Terms />
    </AppLayout>
  );
}
