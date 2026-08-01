'use client';

import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ImmersiveChromeProvider } from '../src/context/ImmersiveChromeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { GlobalErrorBoundary } from '../src/components/providers/GlobalErrorBoundary';

export default function Providers({ children }) {
  return (
    <GlobalErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <NotificationProvider>
            <ImmersiveChromeProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </ImmersiveChromeProvider>
          </NotificationProvider>
        </AuthProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
}
