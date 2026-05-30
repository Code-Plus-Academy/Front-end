'use client';

import Navbar from '../layout/Navbar';
import SidebarRail from '../layout/SidebarRail';

/**
 * AppLayout — wraps authenticated / semi-public pages.
 * Mirrors the AppLayout in the original App.jsx.
 */
export default function AppLayout({ children, hideNav = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {!hideNav && <Navbar />}
      {!hideNav && <SidebarRail />}
      <main
        style={{
          flex: 1,
          marginLeft: hideNav ? 0 : 240,
          marginTop: hideNav ? 0 : 64,
          padding: '16px 32px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
      <style>{`
        @media(max-width: 768px) {
          main { margin-left: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
