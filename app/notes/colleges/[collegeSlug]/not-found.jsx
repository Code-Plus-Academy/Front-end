import React from 'react';
import Link from 'next/link';

export default function CollegeNotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: 24 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--sub)', marginBottom: 16 }}>
        library_books
      </span>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
        No Resources Found
      </h2>
      <p style={{ color: 'var(--sub)', maxWidth: 480, marginBottom: 24 }}>
        No study materials or subjects have been indexed for this selection yet. Be the first to contribute notes or request college syllabus integration!
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/notes/upload" className="btn-primary" style={{ padding: '10px 24px' }}>
          Upload Notes
        </Link>
        <Link href="/notes/colleges" className="btn-secondary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
          Explore Colleges
        </Link>
      </div>
    </div>
  );
}
