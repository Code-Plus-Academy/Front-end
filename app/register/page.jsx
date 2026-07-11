import React from 'react';
import Register from '../../src/views/auth/Register';
import { RegisterRoute } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Register',
  description: 'Create an account on Code Plus Academy to share knowledge, access courses, and build your developer profile.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Register | Code Plus Academy',
    description: 'Create an account on Code Plus Academy to share knowledge, access courses, and build your developer profile.',
    url: '/register',
  }
};

export default function Page() {
  return (
    <RegisterRoute>
      <Register />
    </RegisterRoute>
  );
}
