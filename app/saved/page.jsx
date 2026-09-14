'use client';

import React from 'react';
import SavedHub from '../../src/components/saved/SavedHub';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';
import { Helmet } from 'react-helmet-async';
import NoIndex from '../../src/components/seo/NoIndex';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Helmet><title>Saved Bookmarks & Vault — FocusGram</title></Helmet>
        <NoIndex />
        <SavedHub />
      </AppLayout>
    </PrivateRoute>
  );
}
