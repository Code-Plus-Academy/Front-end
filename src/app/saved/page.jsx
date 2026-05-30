'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../components/shared/RouteGuards';
import AppLayout from '../../components/shared/AppLayout';
import { Saved } from '../../pages-src/Social';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><Saved /></AppLayout></PrivateRoute></Suspense>;
}
