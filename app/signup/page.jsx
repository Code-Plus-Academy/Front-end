'use client';

import React from 'react';
import Register from '../../src/views/auth/Register';
import { RegisterRoute } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <RegisterRoute>
      <Register />
    </RegisterRoute>
  );
}
