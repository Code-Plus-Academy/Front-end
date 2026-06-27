'use client';

import React from 'react';
import { CourseUserDetail } from '../../../../../src/views/StubPages';
import { AppLayout } from '../../../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout noPadding>
      <CourseUserDetail />
    </AppLayout>
  );
}
