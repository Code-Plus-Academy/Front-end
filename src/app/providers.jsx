'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Analytics from '../components/shared/Analytics';

function ThemeAwareApp({ children }) {
  const { user } = useAuth();
  return (
    <ThemeProvider user={user}>
      {children}
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

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeAwareApp>
        <Analytics />
        {children}
      </ThemeAwareApp>
    </AuthProvider>
  );
}
