import React, { Suspense } from 'react';
import Navbar from '../../src/components/layout/Navbar';
import SidebarRail from '../../src/components/layout/SidebarRail';

export const metadata = {
  title: 'Notes Arena — Free Study Material, PYQs & Notes | Code Plus Academy',
  description: 'Download college question papers, notes, study material, books, lab manuals, and guides from Notes Arena by Code Plus Academy.',
  openGraph: {
    title: 'Notes Arena — Free Study Material, PYQs & Notes | Code Plus Academy',
    description: 'Download college question papers, notes, study material, books, lab manuals, and guides from Notes Arena by Code Plus Academy.',
    url: 'https://www.codeplusacademy.in/notes',
    siteName: 'Notes Arena by CPA',
    images: [
      {
        url: 'https://www.codeplusacademy.in/notes-arena-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Notes Arena by Code Plus Academy — All Notes in One Place',
      },
    ],
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notes Arena — Free Study Material, PYQs & Notes | Code Plus Academy',
    description: 'Download college question papers, notes, study material, books, lab manuals, and guides from Notes Arena by Code Plus Academy.',
    images: ['https://www.codeplusacademy.in/notes-arena-og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function NotesArenaLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Common main app Navbar */}
      <Suspense fallback={<div style={{ height: 64, background: 'var(--surface)' }} />}>
        <Navbar />
      </Suspense>

      <div style={{ display: 'flex', flex: 1, marginTop: 64 }}>
        {/* Main app SidebarRail */}
        <SidebarRail />

        {/* Main Content Area */}
        <main className="notes-main">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="notes-mobile-nav notes-show-mobile-flex">
        <a href="/notes" className="mobile-link">
          <span className="material-symbols-rounded">home</span>
          <span>Home</span>
        </a>
        <a href="/notes/colleges" className="mobile-link">
          <span className="material-symbols-rounded">school</span>
          <span>Colleges</span>
        </a>
        <a href="/notes/departments" className="mobile-link">
          <span className="material-symbols-rounded">domain</span>
          <span>Depts</span>
        </a>
        <a href="/notes/upload" className="mobile-link">
          <span className="material-symbols-rounded">upload</span>
          <span>Upload</span>
        </a>
      </nav>

      <style>{`
        .notes-sidebar {
          width: 220px;
          position: fixed;
          left: 20px;
          top: 84px;
          bottom: 20px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px 12px;
          z-index: 100;
        }
        .notes-sidebar-inner {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--sub);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          color: var(--green);
          background: var(--green-dim);
        }
        .sidebar-link.active {
          color: var(--green);
          background: var(--green-dim);
        }
        .notes-main {
          flex: 1;
          margin-left: 260px;
          padding: 24px 32px 64px;
          min-width: 0;
        }
        .notes-mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          z-index: 105;
          align-items: center;
          justify-content: space-around;
          padding: 0 10px;
        }
        .mobile-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: var(--sub);
          font-size: 10px;
          font-weight: 500;
        }
        .mobile-link:hover {
          color: var(--green);
        }
        .notes-hide-mobile {
          display: block;
        }
        .notes-show-mobile-flex {
          display: none;
        }

        @media (max-width: 768px) {
          .notes-sidebar {
            display: none !important;
          }
          .notes-main {
            margin-left: 0 !important;
            padding: 16px 16px 80px !important;
          }
          .notes-show-mobile-flex {
            display: flex !important;
          }
          .notes-hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
