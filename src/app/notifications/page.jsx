'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../components/shared/RouteGuards';
import AppLayout from '../../components/shared/AppLayout';
import Notifications from '../../pages-src/Notifications';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><Notifications /></AppLayout></PrivateRoute></Suspense>;
}
