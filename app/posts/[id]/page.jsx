'use client';

import React from 'react';
import PostDetail from '../../../src/views/PostDetail';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <PostDetail />
    </AppLayout>
  );
}
