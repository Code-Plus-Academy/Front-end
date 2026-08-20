'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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

      {dropOpen && (
        <div role="menu" style={{
          position: 'absolute', 
          top: '100%', 
          right: 0, 
          marginTop: 12,
          background: 'var(--surface)', 
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--r-xl)', 
          padding: '16px', 
          minWidth: 320,
          boxShadow: 'var(--shadow-modal)', 
          animation: 'fadeIn 0.15s ease',
          zIndex: 200,
          fontFamily: "'Geist', sans-serif",
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center'
        }}>
          {/* Email Info */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 32 }} />
            <div style={{ fontSize: 13, color: 'var(--sub)', flex: 1, textAlign: 'center', fontWeight: 500 }}>
              {user.email || `@${user.username}`}
            </div>
            <button onClick={() => setDropOpen(false)} style={{
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 32, 
              height: 32, 
              borderRadius: '50%',
              color: 'var(--text)', 
              transition: 'background 0.2s'
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* User Info */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.name || user.username}
              style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--green)', boxShadow: '0 0 16px rgba(0, 180, 216, 0.2)' }}
            />
          </div>

          <div style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
            Hi, {user.name || user.username}!
          </div>

          {/* Manage profile pill */}
          <Link href={`/u/${user.username}`} onClick={() => setDropOpen(false)} style={{ textDecoration: 'none', marginBottom: 16, width: '100%' }}>
            <button style={{
              width: '100%',
              background: 'var(--green)',
              borderRadius: 'var(--r-full)',
              padding: '8px 24px',
              color: '#000',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              border: 'none'
            }}>
              View Profile
            </button>
          </Link>

          {/* Inner List Container */}
          <div style={{
            width: '100%',
            background: 'var(--s2)',
            borderRadius: 'var(--r-lg)',
            padding: '8px 0',
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid var(--border)'
          }}>
            {[
              { to: '/creator/dashboard', icon: 'dashboard', label: 'Creator Dashboard' },
              { to: '/saved', icon: 'bookmark', label: 'Saved Resources' },
              { to: '/settings', icon: 'settings', label: 'Settings' },
            ].map(({ to, icon, label }) => (
              <Link key={to} href={to} onClick={() => setDropOpen(false)} style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                padding: '10px 20px',
                color: 'var(--text)', 
                fontSize: 14, 
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--sub)' }}>{icon}</span>
                <span style={{ fontWeight: 500 }}>{label}</span>
              </Link>
            ))}
            
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            
            <button onClick={handleLogout} style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 16, 
              width: '100%',
              padding: '10px 20px',
              color: 'var(--text)', 
              fontSize: 14, 
              background: 'none', 
              border: 'none',
              cursor: 'pointer', 
              transition: 'background 0.15s',
              fontWeight: 500, 
              textAlign: 'left',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--sub)' }}>logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
