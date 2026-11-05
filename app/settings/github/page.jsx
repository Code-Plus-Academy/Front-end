'use client';

import React from 'react';
import SettingsGitHub from '../../../src/views/SettingsGitHub';
import ShowcaseManage from '../../../src/views/ShowcaseManage';
import { PrivateRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <SettingsGitHub />
        <ShowcaseManage />
      </AppLayout>
    </PrivateRoute>
  );
}
