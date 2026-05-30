'use client';
import { useEffect, useRef } from 'react';

/**
 * AdUnit — base Google AdSense unit
 *
 * Props:
 *   slot      (string)  — AdSense ad slot ID
 *   format    (string)  — 'auto' | 'rectangle' | 'horizontal' | 'vertical'
 *   style     (object)  — extra inline style for the <ins> element
 *   className (string)  — optional wrapper class
 */
export default function AdUnit({ slot, format = 'auto', style = {}, className = '' }) {
  const insRef = useRef(null);
  const isDev  = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) return; // No real ads in dev
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense not loaded yet — ignore
    }
  }, []);

  const labelStyle = {
    display:       'block',
    fontSize:      9,
    color:         'var(--dim, #6b7280)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily:    'var(--font-mono, monospace)',
    marginBottom:  4,
    textAlign:     'center',
  };

  if (isDev) {
    // Development placeholder — grey box with label
    return (
      <div className={className} style={{ textAlign: 'center' }}>
        <span style={labelStyle}>Advertisement</span>
        <div style={{
          background:    'var(--s2, #1a1a1a)',
          border:        '1px dashed var(--border, rgba(255,255,255,0.08))',
          borderRadius:  4,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          color:         'var(--dim, #6b7280)',
          fontSize:      10,
          fontFamily:    'var(--font-mono, monospace)',
          ...style,
          minHeight:     style.minHeight || 90,
        }}>
          [Ad Placeholder — {format}]
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ textAlign: 'center' }}>
      <span style={labelStyle}>Advertisement</span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-7869829460353350"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
