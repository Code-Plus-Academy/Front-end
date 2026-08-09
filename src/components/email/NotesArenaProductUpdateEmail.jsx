import React from 'react';

/**
 * NotesArenaProductUpdateEmail - Production-Ready React Email Component
 * Designed for Code Plus Academy Product Update Broadcasts.
 */
export default function NotesArenaProductUpdateEmail({
  name = 'Builder',
  recipientName,
  notesUrl = 'https://codeplusacademy.in/notes',
  unsubscribeUrl = 'https://codeplusacademy.in/unsubscribe',
  preferencesUrl = 'https://codeplusacademy.in/preferences',
  supportEmail = 'namaste@codeplusacademy.in',
}) {
  const displayName = recipientName || name;
  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding: '40px 10px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Top Glow Accent Bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' }} />

        {/* Brand Header */}
        <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="https://codeplusacademy.in" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <img 
              src="https://codeplusacademy.in/cpa-logo-dark.png" 
              alt="CODE PLUS ACADEMY" 
              style={{ width: '160px', height: 'auto', display: 'block' }} 
            />
          </a>
          <span style={{ 
            fontFamily: "'Courier New', Courier, monospace", 
            fontSize: '11px', 
            fontWeight: 700, 
            color: '#8b5cf6', 
            backgroundColor: 'rgba(139, 92, 246, 0.12)', 
            border: '1px solid rgba(139, 92, 246, 0.3)', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            letterSpacing: '0.5px', 
            textTransform: 'uppercase' 
          }}>
            PRODUCT UPDATE
          </span>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '36px 32px 28px 32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#f59e0b', 
              backgroundColor: 'rgba(245, 158, 11, 0.12)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px', 
              display: 'inline-block' 
            }}>
              ⚡ WHAT’S NEW THIS MONTH
            </span>
          </div>

          <h1 style={{ margin: '0 0 14px 0', fontSize: '32px', lineHeight: '40px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Meet <span style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1, #3b82f6)', WebkitBackgroundClip: 'text', color: '#a855f7' }}>Notes Arena</span>
          </h1>

          <p style={{ margin: 0, fontSize: '16px', lineHeight: '26px', color: '#9ca3af', fontWeight: 400 }}>
            Hey <strong style={{ color: '#ffffff' }}>{displayName}</strong>, we just dropped a major upgrade to your learning experience. Your new centralized hub for high-yield study materials, practical guides, and production-ready dev roadmaps.
          </p>
        </div>

        {/* Feature Spotlight Label */}
        <div style={{ padding: '0 32px 16px 32px', fontSize: '12px', fontWeight: 800, color: '#6b7280', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          🔥 Feature Spotlight
        </div>

        {/* Spotlight Cards */}
        <div style={{ padding: '0 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card 1 */}
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                NEW FEATURE
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              📚 Academic Notes
            </div>
            <div style={{ fontSize: '14px', lineHeight: '22px', color: '#9ca3af' }}>
              Precision study guides strictly aligned with university syllabi (including NEP patterns). Cut the clutter and focus only on what gets tested.
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                FEATURED
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              🧪 Practical &amp; Lab Guides
            </div>
            <div style={{ fontSize: '14px', lineHeight: '22px', color: '#9ca3af' }}>
              Step-by-step breakdowns designed to help you execute lab assignments and ace practical evaluations with zero friction.
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ROADMAPS
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              🗺️ Production-Ready Dev Paths
            </div>
            <div style={{ fontSize: '14px', lineHeight: '22px', color: '#9ca3af' }}>
              Clear, actionable developer roadmaps—from mastering full-stack web layouts to cross-platform app engineering with Flutter.
            </div>
          </div>

        </div>

        {/* CTA Button */}
        <div style={{ padding: '0 32px 36px 32px', textAlign: 'center' }}>
          <a 
            href={notesUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              backgroundColor: '#6366f1', 
              fontSize: '15px', 
              fontWeight: 700, 
              color: '#ffffff', 
              textDecoration: 'none', 
              padding: '16px 32px', 
              borderRadius: '10px', 
              display: 'inline-block', 
              border: '1px solid #818cf8', 
              letterSpacing: '0.3px',
              boxShadow: '0 4px 14px rgba(99, 102, 246, 0.35)'
            }}
          >
            EXPLORE NOTES ARENA NOW &rarr;
          </a>
        </div>

        {/* Also In This Update */}
        <div style={{ padding: '32px', backgroundColor: '#0f172a', borderTop: '1px solid #1f2937' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            ✨ ALSO IN THIS UPDATE
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#d1d5db', fontSize: '14px', lineHeight: '24px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#ffffff' }}>Faster Navigation:</strong> Access notes directly from your dashboard in two clicks.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#ffffff' }}>Cleaner UI:</strong> Built for distraction-free reading on both mobile and desktop.
            </li>
            <li>
              <strong style={{ color: '#ffffff' }}>Fresh Content Drops:</strong> New modules added weekly across major computer science tracks.
            </li>
          </ul>
        </div>

        {/* Feedback Section */}
        <div style={{ padding: '28px 32px', borderTop: '1px solid #1f2937' }}>
          <p style={{ fontSize: '14px', lineHeight: '22px', color: '#9ca3af', margin: '0 0 16px 0' }}>
            Have feedback or want us to drop notes for a specific subject? Hit reply or reach out at{' '}
            <a href={`mailto:${supportEmail}`} style={{ color: '#818cf8', textDecoration: 'underline' }}>
              {supportEmail}
            </a>{' '}
            — we read every email.
          </p>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb' }}>
            Keep building,<br />
            <span style={{ color: '#ffffff', fontBold: 700 }}>The Code Plus Academy Team</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 32px', backgroundColor: '#090d16', borderTop: '1px solid #1f2937', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '20px' }}>
            <a href="https://codeplusacademy.in" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', textDecoration: 'none', fontWeight: 600 }}>
              codeplusacademy.in
            </a>
            <span style={{ margin: '0 8px', color: '#374151' }}>|</span>
            <a href={unsubscribeUrl} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>
              Unsubscribe
            </a>
            <span style={{ margin: '0 8px', color: '#374151' }}>|</span>
            <a href={preferencesUrl} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>
              Manage Preferences
            </a>
          </div>
          <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '12px' }}>
            &copy; 2026 Code Plus Academy. All rights reserved.
          </div>
        </div>

      </div>
    </div>
  );
}
