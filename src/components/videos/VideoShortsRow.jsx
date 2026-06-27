// frontend/src/components/videos/VideoShortsRow.jsx
// Shorts → tap card → fullscreen vertical reel player (YT Shorts / Instagram style)
// Swipe up/down or arrow buttons to navigate between shorts.
// Long videos remain in the 16:9 grid below.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import api from '../../api/axios';
import VideoCard from './VideoCard';
import { getEmbedUrl, isDirectVideo } from '../../utils/videoEmbed';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return { isDark, text: base.txt, sub: base.txt2, muted: base.txt3, purple: base.accent, border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)' };
}

const CARD_GRADS = [
  'linear-gradient(145deg,#1a0060,#0a0030)',
  'linear-gradient(145deg,#002a38,#001520)',
  'linear-gradient(145deg,#2a0018,#180008)',
  'linear-gradient(145deg,#0a1a4a,#1a0a4a)',
  'linear-gradient(145deg,#1a1060,#0a0830)',
  'linear-gradient(145deg,#3a0018,#180008)',
];

const CATEGORY_COLORS = {
  'AI & ML': '#8A2BFF', 'Web Dev': '#0891B2', 'Blockchain': '#F59E0B',
  'Cybersecurity': '#EF4444', 'System Design': '#10B981', 'GATE CS': '#3B82F6',
};
function catColor(cat) { return CATEGORY_COLORS[cat] || '#8A2BFF'; }

// Mock data — shown only on complete network failure
const MOCK_SHORTS = [
  { id: 'm1', title: 'RAG in 60s', category: 'AI & ML', duration_formatted: '1:02', views_formatted: '48.2K', thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80' },
  { id: 'm2', title: 'ZK Proofs Quick', category: 'Blockchain', duration_formatted: '2:31', views_formatted: '21.7K', thumbnail_url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80' },
  { id: 'm3', title: 'Redis in 3 Min', category: 'System Design', duration_formatted: '2:48', views_formatted: '33.9K', thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80' },
];

const MOCK_LONGS = [
  { id: 'ml1', title: 'LangChain Full Quickstart Guide', category: 'AI & ML', duration_formatted: '11:22', views_formatted: '62.1K', likes_formatted: '4.2K', difficulty: 'beginner', creator_name: 'The Solo Entrepreneur', thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80' },
  { id: 'ml2', title: 'Prompt Injection & Security 101', category: 'Cybersecurity', duration_formatted: '18:55', views_formatted: '18.4K', likes_formatted: '1.1K', difficulty: 'intermediate', creator_name: 'SecDev Labs', thumbnail_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=640&q=80' },
  { id: 'ml3', title: 'System Design: Build a URL Shortener', category: 'System Design', duration_formatted: '24:10', views_formatted: '91.3K', likes_formatted: '7.8K', difficulty: 'intermediate', creator_name: 'Arpit Bhayani', thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=80' },
];

// ── Short portrait card ────────────────────────────────────────────────────────
function ShortCard({ v, i, onClick }) {
  const [hov, setHov] = useState(false);
  const color = catColor(v.category);
  return (
    <div
      onClick={() => onClick(v)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 136, height: 220, borderRadius: 13,
        background: v.thumbnail_url ? '#0a0a0a' : CARD_GRADS[i % CARD_GRADS.length],
        border: `1px solid ${hov ? color + '66' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${color}30` : '0 4px 16px rgba(0,0,0,0.35)',
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'all 0.22s ease',
      }}
    >
      {v.thumbnail_url && (
        <img src={v.thumbnail_url} alt={v.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 50% 18%, ${color}50 0%, transparent 68%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent, rgba(0,0,0,0.82))' }} />
      {/* Play icon on hover */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hov ? 1 : 0, transition: 'opacity 0.18s', pointerEvents: 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${color}70`,
        }}>
          <span style={{ color: '#fff', fontSize: 13, marginLeft: 3 }}>▶</span>
        </div>
      </div>
      <div style={{ position: 'relative', background: `${color}40`, border: `1px solid ${color}60`, borderRadius: 7, padding: '4px 9px', alignSelf: 'flex-start', backdropFilter: 'blur(6px)' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>{v.category || 'video'}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, fontFamily: "'Syne',sans-serif", marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.015em' }}>
          {v.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{v.views_formatted} views</span>
          {v.duration_formatted && (
            <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>{v.duration_formatted}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ emoji, label, badge, onSeeAll, t }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
          {emoji} {label}
        </span>
        <div style={{ background: '#8A2BFF18', border: '1px solid #8A2BFF28', borderRadius: 5, padding: '1px 7px' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#8A2BFF', fontWeight: 600, letterSpacing: '0.06em' }}>{badge}</span>
        </div>
      </div>
      <span onClick={onSeeAll} style={{ fontSize: 11, color: t.purple, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
        See all →
      </span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function VideoShortsRow({ limit = 8 }) {
  const t = useT();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [shorts, setShorts]           = useState([]);
  const [longs, setLongs]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    let shortsErr = false;
    let longsErr  = false;

    Promise.all([
      // Use dedicated /videos/shorts endpoint — hits content_type index directly
      api.get('/videos/shorts', { params: { limit, offset: 0 } })
        .then(res => res.data.videos || [])
        .catch(() => { shortsErr = true; return []; }),
      // Long-form videos — explicit content_type=long filter
      api.get('/videos', { params: { limit, offset: 0, content_type: 'long' } })
        .then(res => res.data.videos || [])
        .catch(() => { longsErr = true; return []; }),
    ]).then(([shortsData, longsData]) => {
      if (!cancelled) {
        setShorts(shortsData);
        setLongs(longsData);
        // Only fall back to mock if BOTH calls errored
        setFetchError(shortsErr && longsErr);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [limit]);

  // Real data always wins — mock only shown on network error
  const finalShorts = fetchError ? MOCK_SHORTS : shorts;
  const finalLongs  = fetchError ? MOCK_LONGS  : longs;

  const handleShortClick = (v) => {
    if (!String(v.id).startsWith('m')) {
      navigate(`/shorts/${v.id}`);
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>

      {/* ── LONG VIDEOS: Traditional 16:9 grid ──────────────────────────── */}
      {(loading || finalLongs.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader emoji="🎬" label="Videos" badge="LONG-FORM" onSeeAll={() => navigate('/videos')} t={t} />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
              {finalLongs.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </div>
      )}

      {/* ── SHORT VIDEOS: Horizontal scroll portrait cards ───────────────── */}
      {(loading || finalShorts.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <SectionHeader emoji="⚡" label="Quick Bites" badge="SHORTS" onSeeAll={() => navigate('/shorts')} t={t} />
          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
              marginLeft: -18, marginRight: -18, paddingLeft: 18, paddingRight: 18,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ flexShrink: 0, width: 136, height: 220, borderRadius: 13 }} />
                ))
              : finalShorts.map((v, i) => (
                  <ShortCard key={v.id} v={v} i={i} onClick={handleShortClick} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
