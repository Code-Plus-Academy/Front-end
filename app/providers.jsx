'use client';

import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ImmersiveChromeProvider } from '../src/context/ImmersiveChromeContext';

export default function Providers({ children }) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ImmersiveChromeProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ImmersiveChromeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
