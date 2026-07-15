import React from 'react';

export default function CourseLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: '50%', height: 28, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 32, opacity: 0.3 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--r-md)', opacity: 0.3 }} />
        ))}
      </div>
    </div>
  );
}
