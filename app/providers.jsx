'use client';

import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';

export default function Providers({ children }) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
