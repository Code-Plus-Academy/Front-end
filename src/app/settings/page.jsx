'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../components/shared/RouteGuards';
import AppLayout from '../../components/shared/AppLayout';
import Settings from '../../pages-src/Settings';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute></Suspense>;
}
