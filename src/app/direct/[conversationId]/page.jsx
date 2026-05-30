'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../../components/shared/RouteGuards';
import AppLayout from '../../../components/shared/AppLayout';
import { DMThread } from '../../../pages-src/DM';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><DMThread /></AppLayout></PrivateRoute></Suspense>;
}
