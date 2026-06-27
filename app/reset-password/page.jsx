'use client';

import React from 'react';
import RecoveryFlow from '../../src/views/auth/RecoveryFlow';
import { PublicOnlyRoute } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PublicOnlyRoute>
      <RecoveryFlow />
    </PublicOnlyRoute>
  );
}
