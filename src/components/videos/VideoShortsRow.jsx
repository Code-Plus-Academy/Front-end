// frontend/src/components/videos/VideoShortsRow.jsx
// Shorts → tap card → fullscreen vertical reel player (YT Shorts / Instagram style)
// Swipe up/down or arrow buttons to navigate between shorts.
// Long videos remain in the 16:9 grid below.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import api from '../../api/axios';
import { getGraphQLShorts, getGraphQLVideos } from '../../api/graphql';
import VideoCard from './VideoCard';

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

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
export function ShortCard({ v, i, onClick }) {
  const [hov, setHov] = useState(false);
  const color = catColor(v.category);
  return (
    <div
      className="short-card-item"
      onClick={() => onClick(v)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: v.thumbnail_url ? '#0a0a0a' : CARD_GRADS[i % CARD_GRADS.length],
        border: `1px solid ${hov ? color + '66' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${color}30` : '0 4px 16px rgba(0,0,0,0.35)',
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'all 0.22s ease',
      }}
    >
      {v.thumbnail_url && (
        <img src={v.thumbnail_url} alt={v.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
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
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.35, fontFamily: "'Clash Display',sans-serif", marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em' }}>
          {v.title}
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
        <span style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
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
export default function VideoShortsRow({ limit = 8, variant = 'all' }) {
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

    const promises = [];
    if (variant === 'all' || variant === 'short') {
      promises.push(
        getGraphQLShorts({ first: limit })
          .then(res => ({ type: 'short', data: res.videos || [] }))
          .catch(err => {
            console.warn('[VideoShortsRow GraphQL] Shorts falling back to REST:', err?.message);
            return api.get('/videos/shorts', { params: { limit, offset: 0 } })
              .then(res => ({ type: 'short', data: res.data.videos || [] }))
              .catch(() => { shortsErr = true; return { type: 'short', data: [] }; });
          })
      );
    }
    if (variant === 'all' || variant === 'long') {
      promises.push(
        getGraphQLVideos({ filter: { contentType: 'long' }, first: limit })
          .then(res => ({ type: 'long', data: res.videos || [] }))
          .catch(err => {
            console.warn('[VideoShortsRow GraphQL] Longs falling back to REST:', err?.message);
            return api.get('/videos', { params: { limit, offset: 0, content_type: 'long' } })
              .then(res => ({ type: 'long', data: res.data.videos || [] }))
              .catch(() => { longsErr = true; return { type: 'long', data: [] }; });
          })
      );
    }

    Promise.all(promises).then((results) => {
      if (!cancelled) {
        results.forEach(res => {
          if (res.type === 'short') setShorts(shuffleArray(res.data || []));
          if (res.type === 'long') setLongs(res.data || []);
        });
        // Only fall back to mock if BOTH calls errored (if all), or the specific one errored
        if (variant === 'all') setFetchError(shortsErr && longsErr);
        else if (variant === 'short') setFetchError(shortsErr);
        else if (variant === 'long') setFetchError(longsErr);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [limit, variant]);

  // Real data always wins — mock only shown on network error
  const finalShorts = fetchError ? MOCK_SHORTS : shorts;
  const finalLongs  = fetchError ? MOCK_LONGS  : longs;

  const handleShortClick = (v) => {
    if (!String(v.id).startsWith('m')) {
      const targetIndex = finalShorts.findIndex(item => String(item.id) === String(v.id));
      navigate(`/shorts/${v.id}`, {
        state: {
          shorts: finalShorts,
          startIndex: targetIndex >= 0 ? targetIndex : 0,
        }
      });
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <style>{`
        .shorts-row-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
        }
        .short-card-item {
          flex-shrink: 0;
          width: 210px;
          height: 373px;
          border-radius: 16px;
        }
        @media (max-width: 768px) {
          .shorts-row-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            overflow-x: hidden !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            gap: 12px !important;
          }
          .short-card-item {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 9/16;
            flex-shrink: 1;
          }
          .short-card-item:nth-child(n+5) {
            display: none !important;
          }
        }
      `}</style>

      {/* ── LONG VIDEOS: Traditional 16:9 grid ──────────────────────────── */}
      {(variant === 'all' || variant === 'long') && (loading || finalLongs.length > 0) && (
        <div style={{ marginBottom: variant === 'long' ? 0 : 24 }}>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
              {finalLongs.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </div>
      )}

      {/* ── SHORT VIDEOS: Horizontal scroll portrait cards ───────────────── */}
      {(variant === 'all' || variant === 'short') && (loading || finalShorts.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <SectionHeader emoji="⚡" label="Quick Bites" badge="SHORTS" onSeeAll={() => navigate('/shorts')} t={t} />
          <div
            ref={scrollRef}
            className="shorts-row-container"
            style={{
              paddingBottom: 4,
              marginLeft: variant === 'all' ? -18 : 0, marginRight: variant === 'all' ? -18 : 0,
              paddingLeft: variant === 'all' ? 18 : 0, paddingRight: variant === 'all' ? 18 : 0,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton short-card-item" />
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
