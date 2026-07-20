import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import cpaIcon from '../../assets/cpa-icon.png';
import { getCurrentUser } from '../../utils/notesApi';
import UserNavDropdown from './UserNavDropdown';
import SearchBar from './SearchBar';

// Asset references in public folder or fallback styling
// Note: next/image is used per SEO/Performance guidelines
export default async function NotesNavbar() {
  const user = await getCurrentUser();

  return (
    <>
      <style>{`
        .glass-notes-nav {
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          zIndex: 110;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }
        .notes-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 20px;
          color: var(--text);
          letter-spacing: -0.02em;
        }
        .notes-logo-pill {
          background: var(--gradient-brand);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .notes-nav-links {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .notes-nav-link {
          color: var(--sub);
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .notes-nav-link:hover {
          color: var(--green);
        }
        @media(max-width: 768px) {
          .notes-hide-mobile { display: none !important; }
        }
      `}</style>

      <nav className="glass-notes-nav" style={{ zIndex: 110 }}>
        {/* Left Side: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/notes" className="notes-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={cpaIcon?.src || cpaIcon} alt="CPA Icon" style={{ height: 'clamp(44px, 10vw, 56px)', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <img src="/notes-arena-logo.png" alt="Notes Arena" style={{ height: 'clamp(32px, 8vw, 48px)', width: 'auto', objectFit: 'contain' }} className="cpa-brand-logo" />
          </Link>

          {/* Nav Navigation links */}
          <nav className="notes-nav-links notes-hide-mobile" style={{ marginLeft: 16 }}>
            <Link href="/feed" className="notes-nav-link">Community</Link>
            <Link href="/notes/colleges" className="notes-nav-link">Colleges & Universities</Link>
            <Link href="/notes/departments" className="notes-nav-link">Departments</Link>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
          <SearchBar />
        </div>

        {/* Right Side: Upload and Profile dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/notes/upload" className="notes-hide-mobile" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload</span>
              Upload Notes
            </button>
          </Link>

          <UserNavDropdown user={user} />
        </div>
      </nav>
    </>
  );
}
