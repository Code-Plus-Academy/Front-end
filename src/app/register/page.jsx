'use client';
import { Suspense } from 'react';
import { PublicOnlyRoute } from '../../components/shared/RouteGuards';
import Register from '../../pages-src/auth/Register';
export default function Page() {
  return <Suspense fallback={null}><PublicOnlyRoute><Register /></PublicOnlyRoute></Suspense>;
}
