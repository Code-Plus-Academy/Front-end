'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import UploadForm from './UploadForm';

export default function UploadAuthGuard({ action }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/notes/upload');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--sub)' }}>
        <div 
          style={{ 
            height: 36, 
            width: '60%', 
            maxWidth: 320, 
            margin: '0 auto 20px', 
            borderRadius: 8, 
            background: 'var(--s2, rgba(255, 255, 255, 0.05))',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} 
        />
        <div 
          style={{ 
            height: 280, 
            width: '100%', 
            borderRadius: 12, 
            background: 'var(--s2, rgba(255, 255, 255, 0.05))',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} 
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--sub)' }}>
        <p style={{ fontSize: 14 }}>Redirecting to login...</p>
      </div>
    );
  }

  return <UploadForm action={action} />;
}
