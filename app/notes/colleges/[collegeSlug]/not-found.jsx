import React from 'react';
import Link from 'next/link';

export default function CollegeNotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: 24 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--sub)', marginBottom: 16 }}>
        school
      </span>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
        College Not Found
      </h2>
      <p style={{ color: 'var(--sub)', maxWidth: 480, marginBottom: 24 }}>
        The college or university you are looking for has not been indexed yet, or the slug is incorrect.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/notes/colleges/add" className="btn-primary" style={{ padding: '10px 24px' }}>
          Request Addition
        </Link>
        <Link href="/notes/colleges" className="btn-secondary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
          Back to Colleges
        </Link>
      </div>
    </div>
  );
}
