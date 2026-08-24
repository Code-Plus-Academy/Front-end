'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AttendanceDashboard from '../../src/components/attendance/AttendanceDashboard';
import { AppLayout } from '../../src/components/layout/RouteWrappers';
import { Helmet } from 'react-helmet-async';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams ? searchParams.get('tab') || 'attendance' : 'attendance';
  return <AttendanceDashboard initialTab={initialTab} />;
}

export default function AttendaceTypoPage() {
  return (
    <AppLayout>
      <Helmet>
        <title>Institutional Attendance & Trackers — Notes Arena</title>
      </Helmet>
      <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading Attendance Portal...</div>}>
        <AttendanceContent />
      </Suspense>
    </AppLayout>
  );
}
