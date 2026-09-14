'use client';

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SaveToContainerProvider } from './context/SaveToContainerContext';

function ThemeAwareApp() {
  const { user } = useAuth();

  return (
    <ThemeProvider user={user}>
      <SaveToContainerProvider>
        <App />
      </SaveToContainerProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--s2)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.88rem',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-md)',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--s2)' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--s2)' } },
        }}
      />
    </ThemeProvider>
  );
}

export default function ClientOnlyApp() {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <ThemeAwareApp />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
}
