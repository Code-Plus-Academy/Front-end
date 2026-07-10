'use client';

import React from 'react';
import SearchPage from '../../../src/views/SearchPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <SearchPage />
    </AppLayout>
  );
}
