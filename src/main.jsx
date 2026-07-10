

import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ImmersiveChromeProvider } from './context/ImmersiveChromeContext';
import './styles/tokens.css';
import './styles/responsive.css';
import './index.css';

const rootElement = document.getElementById('root');

/**
 * ThemeAwareApp — bridges AuthContext → ThemeProvider.
 * Reads the logged-in user so ThemeProvider can initialise from user.settings.theme.
 * Placed inside AuthProvider, outside BrowserRouter so ThemeProvider wraps everything.
 */
function ThemeAwareApp() {
  const { user } = useAuth();
  return (
    <ThemeProvider user={user}>
      <App />
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
          error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--s2)' } },
        }}
      />
    </ThemeProvider>
  );
}

const tree = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ImmersiveChromeProvider>
            <ThemeAwareApp />
          </ImmersiveChromeProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// Use hydrateRoot for react-snap prerendered pages, createRoot for SPA
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
