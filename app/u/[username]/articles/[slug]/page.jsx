'use client';

import React from 'react';
import { ArticleUserDetail } from '../../../../../src/views/StubPages';
import { AppLayout } from '../../../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout noPadding>
      <ArticleUserDetail />
    </AppLayout>
  );
}
