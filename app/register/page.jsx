import React from 'react';
import Register from '../../src/views/auth/Register';
import { RegisterRoute } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Register | FocusGram',
  description: 'Create an account on FocusGram to share knowledge, access courses, and build your developer profile.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Register | FocusGram',
    description: 'Create an account on FocusGram to share knowledge, access courses, and build your developer profile.',
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
