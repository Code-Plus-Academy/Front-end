'use client';

import React from 'react';
import CreatorDashboard from '../../../src/views/CreatorDashboard';
import { ProfessionalRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <ProfessionalRoute>
      <AppLayout>
        <CreatorDashboard />
      </AppLayout>
    </ProfessionalRoute>
  );
}
