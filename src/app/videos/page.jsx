'use client';
import { Suspense } from 'react';
import { PrivateRoute } from '../../components/shared/RouteGuards';
import AppLayout from '../../components/shared/AppLayout';
import VideosPage from '../../pages-src/VideosPage';
export default function Page() {
  return <Suspense fallback={null}><PrivateRoute><AppLayout><VideosPage /></AppLayout></PrivateRoute></Suspense>;
}
