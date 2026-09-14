'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import UserMenuDropdown from '../layout/UserMenuDropdown';

export default function UserNavDropdown({ user }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/login" style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--sub)',
          padding: '8px 16px',
        }} className="btn-ghost">
          Sign In
        </Link>
        <Link href="/register" className="signup-btn" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 18px',
          borderRadius: '9999px',
          background: 'var(--gradient-brand)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
        }}>
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setDropOpen(v => !v)} 
        aria-expanded={dropOpen} 
        aria-haspopup="true" 
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          background: 'transparent',
          border: '1px solid ' + (dropOpen ? 'rgba(0, 180, 216, 0.4)' : 'transparent'),
          borderRadius: 'var(--r-md)',
          padding: '4px',
          cursor: 'pointer', 
          transition: 'all 0.2s',
        }}
      >
        <img
          src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
          alt={user.name || user.username}
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0, 180, 216, 0.2)' }}
        />
      </button>

      <UserMenuDropdown isOpen={dropOpen} onClose={() => setDropOpen(false)} />
    </div>
  );
}
