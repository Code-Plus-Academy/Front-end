'use client';
/**
 * ThreeColumnLayout — Filters + Content + Right Panel (Pattern B)
 * Used by: toolkit, resource-article
 *
 * ≥1280: Three columns  220px | 1fr | 300px
 * ≥1024: Two columns    1fr | 300px  (filters hidden)
 * <1024: Single column  (right panel below, filters hidden)
 */
import { useState } from 'react';
import useWindowWidth from '../../../hooks/useWindowWidth';

const BP_WIDE = 1280;
const BP_DESKTOP = 1024;

export default function ThreeColumnLayout({ children, rightPanel, filterPanel }) {
  const width = useWindowWidth();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Mobile: single column
  if (width < BP_DESKTOP) {
    return (
      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 40px) clamp(12px, 4vw, 24px)',
      }}>
        {/* Filter toggle button for mobile */}
        {filterPanel && (
          <>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-label="Toggle Filters"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                color: 'var(--text)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                width: '100%', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 16 }}>⚡</span>
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            {filtersOpen && (
              <div style={{ marginBottom: 20 }}>{filterPanel}</div>
            )}
          </>
        )}
        {children}
        {rightPanel && (
          <div style={{ marginTop: 24 }}>{rightPanel}</div>
        )}
      </div>
    );
  }

  // Desktop (1024–1279): two columns, no filter sidebar
  if (width < BP_WIDE) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 28,
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px',
        alignItems: 'start',
      }}>
        <div>{children}</div>
        {rightPanel && (
          <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
            {rightPanel}
          </aside>
        )}
      </div>
    );
  }

  // Wide desktop (≥1280): three columns
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr 300px',
      gap: 24,
      maxWidth: 1400,
      margin: '0 auto',
      padding: '40px 24px',
      alignItems: 'start',
    }}>
      {/* Filter sidebar */}
      <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
        {filterPanel}
      </aside>

      {/* Main content */}
      <div>{children}</div>

      {/* Right panel */}
      {rightPanel && (
        <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
