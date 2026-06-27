'use client';

import React from 'react';
import NewPost from '../../../src/views/NewPost';
import { ProfessionalRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <ProfessionalRoute>
      <AppLayout>
        <NewPost />
      </AppLayout>
    </ProfessionalRoute>
  );
}
