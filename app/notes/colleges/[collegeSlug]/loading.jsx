import React from 'react';

export default function CollegeProfileLoading() {
  return (
    <div>
      {/* College Hero Loading */}
      <div className="skeleton" style={{ height: 160, borderRadius: 'var(--r-lg)', marginBottom: 32, opacity: 0.3 }} />

      {/* Stats Loading */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 68, borderRadius: 'var(--r-md)', opacity: 0.3 }} />
        ))}
      </div>

      {/* Courses list Loading */}
      <div>
        <div className="skeleton" style={{ width: 180, height: 24, marginBottom: 16, opacity: 0.3 }} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 74, borderRadius: 'var(--r-md)', marginBottom: 12, opacity: 0.3 }} />
        ))}
      </div>
    </div>
  );
}
