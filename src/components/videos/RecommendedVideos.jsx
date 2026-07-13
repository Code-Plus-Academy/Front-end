// frontend/src/components/videos/RecommendedVideos.jsx
// Desktop: sticky sidebar list. Mobile: horizontal scroll row.

import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import VideoCard from './VideoCard';
import api from '../../api/axios';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:     isDark ? D.card       : L.surface,
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    text:   base.txt,
    sub:    base.txt2,
    muted:  base.txt3,
    purple: base.accent,
  };
}

export default function RecommendedVideos({ currentVideoId, category, isMobile = false }) {
  const t = useT();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = { limit: isMobile ? 6 : 10 };
    if (currentVideoId) params.videoId = currentVideoId;
    if (category)       params.category = category;

    api.get('/videos/recommended', { params })
      .then(r => { if (!cancelled) setVideos(r.data.videos || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [currentVideoId, category, isMobile]);

  if (!loading && !videos.length) return null;

  // ── Mobile: horizontal scroll ────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12, fontFamily: "'Clash Display',sans-serif", letterSpacing: '-0.01em' }}>
          Up Next
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ flexShrink: 0, width: 240, height: 180, borderRadius: 12 }} />
              ))
            : videos.map(v => (
                <div key={v.id} style={{ flexShrink: 0, width: 240 }}>
                  <VideoCard video={v} />
                </div>
              ))
          }
        </div>
      </div>
    );
  }

  // ── Desktop: vertical sidebar list ──────────────────────────────────────
  return (
    <div style={{
      position: 'sticky', top: 80,
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Clash Display',sans-serif", letterSpacing: '-0.01em' }}>
          Up Next
        </span>
      </div>

      {/* List */}
      <div style={{ padding: '8px 0', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: '8px 10px', display: 'flex', gap: 10 }}>
                <div className="skeleton" style={{ width: 130, height: 76, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                  <div className="skeleton" style={{ height: 12, width: '90%' }} />
                  <div className="skeleton" style={{ height: 10, width: '60%' }} />
                  <div className="skeleton" style={{ height: 9,  width: '40%' }} />
                </div>
              </div>
            ))
          : videos.map(v => <VideoCard key={v.id} video={v} horizontal />)
        }
      </div>

      {/* Load more stub */}
      {!loading && videos.length >= 8 && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: '10px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: t.purple, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
            // LOAD_MORE →
          </span>
        </div>
      )}
    </div>
  );
}
