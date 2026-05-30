'use client';

import { useState, useEffect } from 'react';
import Providers from './providers';

export default function ClientProviders({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render nothing on server / before hydration
    // This prevents any context hook from firing without a provider
    return (
      <div style={{ minHeight: '100vh', background: '#050507' }} />
    );
  }

  return <Providers>{children}</Providers>;
}
