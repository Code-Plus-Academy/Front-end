import React from 'react';

export default function ResourceLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 340, height: 16, marginBottom: 20, opacity: 0.3 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Main Side */}
        <div>
          {/* PDF Viewer Box */}
          <div className="skeleton" style={{ height: 648, borderRadius: 'var(--r-md)', marginBottom: 24, opacity: 0.3 }} />
          {/* Description Box */}
          <div className="skeleton" style={{ height: 120, borderRadius: 'var(--r-md)', opacity: 0.3 }} />
        </div>

        {/* Sidebar */}
        <div>
          {/* Action buttons */}
          <div className="skeleton" style={{ height: 44, borderRadius: 'var(--r-md)', marginBottom: 20, opacity: 0.3 }} />
          {/* Publisher Card */}
          <div className="skeleton" style={{ height: 130, borderRadius: 'var(--r-md)', marginBottom: 20, opacity: 0.3 }} />
          {/* Metadata Block */}
          <div className="skeleton" style={{ height: 210, borderRadius: 'var(--r-md)', marginBottom: 20, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
