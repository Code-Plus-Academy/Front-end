'use client';
import { Suspense } from 'react';
import { PublicOnlyRoute } from '../../components/shared/RouteGuards';
import RecoveryFlow from '../../pages-src/auth/RecoveryFlow';
export default function Page() {
  return <Suspense fallback={null}><PublicOnlyRoute><RecoveryFlow /></PublicOnlyRoute></Suspense>;
}
