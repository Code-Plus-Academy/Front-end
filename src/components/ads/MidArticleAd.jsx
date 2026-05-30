'use client';
import AdUnit from './AdUnit';

/**
 * MidArticleAd — responsive leaderboard ad inserted between article blocks
 *
 * Desktop: 728×90 leaderboard
 * Mobile (<768px): 320×50 mobile banner
 * Margins: 32px top + bottom
 * Visual separator: 1px border using var(--border)
 */
export default function MidArticleAd() {
  return (
    <div style={{
      marginTop:    32,
      marginBottom: 32,
      borderTop:    '1px solid var(--border, rgba(255,255,255,0.06))',
      borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
      padding:      '16px 0',
    }}>
      {/* Desktop: leaderboard */}
      <div className="mid-ad-desktop">
        <AdUnit
          slot="3456789012"
          format="horizontal"
          style={{ width: 728, height: 90, margin: '0 auto' }}
        />
      </div>

      {/* Mobile: mobile banner */}
      <div className="mid-ad-mobile">
        <AdUnit
          slot="4567890123"
          format="horizontal"
          style={{ width: 320, height: 100 }}
        />
      </div>

      <style>{`
        .mid-ad-desktop { display: block; }
        .mid-ad-mobile  { display: none;  }
        @media (max-width: 767px) {
          .mid-ad-desktop { display: none  !important; }
          .mid-ad-mobile  { display: block !important; }
        }
      `}</style>
    </div>
  );
}
