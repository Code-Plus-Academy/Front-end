'use client';
import { Suspense } from 'react';
import { ProfessionalRoute } from '../../../components/shared/RouteGuards';
import AppLayout from '../../../components/shared/AppLayout';
import NewPost from '../../../pages-src/NewPost';
export default function Page() {
  return <Suspense fallback={null}><ProfessionalRoute><AppLayout><NewPost /></AppLayout></ProfessionalRoute></Suspense>;
}
