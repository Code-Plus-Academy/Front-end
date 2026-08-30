// frontend/src/components/videos/RecommendedVideos.jsx
// Conditionally renders Vertical List for Long Videos and Horizontal Scroll Row for Shorts.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import VideoCard from './VideoCard';
import api from '../../api/axios';
import { getGraphQLRecommendedVideos, getGraphQLShorts } from '../../api/graphql';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:     isDark ? D.card       : L.surface,
    s2:     isDark ? '#141720'    : '#ECEEF2',
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    text:   base.txt,
    sub:    base.txt2,
    muted:  base.txt3,
    purple: base.accent,
  };
}

export default function RecommendedVideos({ currentVideoId, category, isMobile = false }) {
  const t = useT();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [recList, shortsResult] = await Promise.all([
          getGraphQLRecommendedVideos({ videoId: currentVideoId, category, limit: 12 }),
          getGraphQLShorts({ first: 8 }),
        ]);
        if (cancelled) return;
        setVideos(recList || []);
        setShorts(shortsResult.videos || []);
      } catch (err) {
        if (cancelled) return;
        console.warn('[RecommendedVideos GraphQL] Falling back to REST:', err?.message);
        const params = { limit: 12 };
        if (currentVideoId) params.videoId = currentVideoId;
        if (category)       params.category = category;

        Promise.allSettled([
          api.get('/videos/recommended', { params }),
          api.get('/videos/shorts', { params: { limit: 8 } }),
        ]).then(([recRes, shortsRes]) => {
          if (cancelled) return;
          if (recRes.status === 'fulfilled') {
            setVideos(recRes.value.data?.videos || []);
          }
          if (shortsRes.status === 'fulfilled') {
            setShorts(shortsRes.value.data?.videos || []);
          }
        }).finally(() => {
          if (!cancelled) setLoading(false);
        });
        return;
      }
      if (!cancelled) setLoading(false);
    };

    loadData();
    return () => { cancelled = true; };
  }, [currentVideoId, category]);

  const longVideos = videos.filter(v => (v.content_type !== 'short' && !v.is_short && v.type !== 'short' && v.id !== currentVideoId));
  const shortVideos = [
    ...videos.filter(v => (v.content_type === 'short' || v.is_short || v.type === 'short')),
    ...shorts
  ].filter((v, idx, arr) => arr.findIndex(x => x.id === v.id) === idx && v.id !== currentVideoId);

  if (!loading && !longVideos.length && !shortVideos.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ── 1. Shorts Section (Horizontal Scrolling Row: video.type === 'short') ── */}
      {(loading || shortVideos.length > 0) && (
        <div style={{
          background: isMobile ? 'transparent' : t.bg,
          border: isMobile ? 'none' : `1px solid ${t.border}`,
          borderRadius: 16,
          padding: isMobile ? '4px 0 0' : '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ color: '#EF4444', fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Clash Display',sans-serif", letterSpacing: '-0.01em' }}>
              Shorts
            </span>
          </div>

          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '1rem',
            paddingBottom: 10,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {loading && !shortVideos.length
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ flexShrink: 0, width: 160, height: 260, borderRadius: 12 }} />
                ))
              : shortVideos.map(v => (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/shorts/${v.id}`)}
                    style={{
                      flexShrink: 0,
                      width: 160,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {/* Vertical thumbnail container */}
                    <div style={{
                      position: 'relative',
                      width: 160,
                      height: 240,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#0a0a0a',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}>
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.85) 100%)',
                      }} />
                      {v.duration_formatted && (
                        <span style={{
                          position: 'absolute', bottom: 8, right: 8,
                          background: 'rgba(0,0,0,0.8)', color: '#fff',
                          fontSize: 10, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 4, fontFamily: "'JetBrains Mono',monospace",
                        }}>
                          {v.duration_formatted}
                        </span>
                      )}
                    </div>

                    {/* Title and views below thumbnail */}
                    <div style={{ padding: '0 2px' }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: t.text,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontFamily: "'Geist',sans-serif",
                        wordBreak: 'break-word',
                      }}>
                        {v.title}
                      </div>
                      <div style={{ fontSize: 11, color: t.muted, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                        {v.views_formatted || `${v.views || 0} views`}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ── 2. Long Videos Section (Vertical List: video.type === 'long') ── */}
      {(loading || longVideos.length > 0) && (
        <div style={{
          background: isMobile ? 'transparent' : t.bg,
          border: isMobile ? 'none' : `1px solid ${t.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? '8px 0 10px' : '14px 16px 10px',
            borderBottom: isMobile ? 'none' : `1px solid ${t.border}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: "'Clash Display',sans-serif", letterSpacing: '-0.01em' }}>
              Up Next
            </span>
          </div>

          {/* Vertical List: Each card is full-width with horizontal thumbnail on left, title/author on right */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: isMobile ? 0 : '8px 12px',
            width: '100%',
          }}>
            {loading && !longVideos.length
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ padding: '8px 0', display: 'flex', gap: 12, width: '100%' }}>
                    <div className="skeleton" style={{ width: 140, height: 80, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                      <div className="skeleton" style={{ height: 12, width: '90%' }} />
                      <div className="skeleton" style={{ height: 10, width: '60%' }} />
                      <div className="skeleton" style={{ height: 9,  width: '40%' }} />
                    </div>
                  </div>
                ))
              : longVideos.map(v => (
                  <VideoCard key={v.id} video={v} horizontal />
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
