'use client';
import { Suspense } from 'react';
import { PublicOnlyRoute } from '../../components/shared/RouteGuards';
import Login from '../../pages-src/auth/Login';
export default function Page() {
  return <Suspense fallback={null}><PublicOnlyRoute><Login /></PublicOnlyRoute></Suspense>;
}
