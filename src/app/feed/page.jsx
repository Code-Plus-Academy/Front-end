'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../components/shared/RouteGuards';
import AppLayout from '../../components/shared/AppLayout';
import Feed from '../../pages-src/Feed';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><Feed /></AppLayout></PrivateRoute></Suspense>;
}
