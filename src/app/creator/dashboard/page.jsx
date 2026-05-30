'use client';
import { Suspense } from 'react';
import { ProfessionalRoute } from '../../../components/shared/RouteGuards';
import AppLayout from '../../../components/shared/AppLayout';
import CreatorDashboard from '../../../pages-src/CreatorDashboard';
export default function Page() {
  return <Suspense fallback={null}><ProfessionalRoute><AppLayout><CreatorDashboard /></AppLayout></ProfessionalRoute></Suspense>;
}
