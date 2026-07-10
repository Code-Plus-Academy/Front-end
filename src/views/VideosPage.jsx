// frontend/src/pages/videos/VideosPage.jsx
// Browse all videos — filterable grid with category chips and search.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../styles/tokens';
import api from '../api/axios';
import VideoCard from '../components/videos/VideoCard';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:     isDark ? '#080a0e'    : '#F4F5F7',
    surface: isDark ? D.card     : L.surface,
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    text:   base.txt,
    sub:    base.txt2,
    muted:  base.txt3,
    purple: base.accent,
    purpleDim: isDark ? 'rgba(138,43,255,0.18)' : 'rgba(110,0,255,0.10)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#F0F1F4',
  };
}

function useDebounce(v, d = 350) {
  const [val, setVal] = useState(v);
  useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const readMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
    setM(readMobile());
    const h = () => setM(readMobile());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

const CARD_GRADS = [
  'linear-gradient(145deg,#1a0060,#0a0030)',
  'linear-gradient(145deg,#002a38,#001520)',
  'linear-gradient(145deg,#2a0018,#180008)',
  'linear-gradient(145deg,#0a1a4a,#1a0a4a)',
  'linear-gradient(145deg,#1a1060,#0a0830)',
  'linear-gradient(145deg,#3a0018,#180008)',
];
const CAT_COLORS = {
  'AI & ML': '#8A2BFF', 'Web Dev': '#0891B2', 'Blockchain': '#F59E0B',
  'Cybersecurity': '#EF4444', 'System Design': '#10B981', 'GATE CS': '#3B82F6',
  'AI Agents': '#7C3AED', 'Flutter': '#06B6D4',
};
function catColor(cat) { return CAT_COLORS[cat] || '#8A2BFF'; }

/* Portrait card matching VideoShortsRow's ShortCard design */
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
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.5),0 0 20px ${color}30` : '0 4px 16px rgba(0,0,0,0.35)',
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
      {/* Hover play ring */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity 0.18s', pointerEvents: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${color}70` }}>
          <span style={{ color: '#fff', fontSize: 13, marginLeft: 3 }}>▶</span>
        </div>
      </div>
      <div style={{ position: 'relative', background: `${color}40`, border: `1px solid ${color}60`, borderRadius: 7, padding: '4px 9px', alignSelf: 'flex-start', backdropFilter: 'blur(6px)' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>{v.category || 'SHORT'}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, fontFamily: "'Syne',sans-serif", marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.015em' }}>
          {v.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{v.views_formatted || ''}</span>
          {v.duration_formatted && (
            <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>{v.duration_formatted}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES  = ['All', 'AI & ML', 'Web Dev', 'Blockchain', 'Cybersecurity', 'System Design', 'GATE CS', 'AI Agents', 'Flutter'];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];
const DIFF_COLORS  = { beginner: '#22C55E', intermediate: '#F59E0B', advanced: '#EF4444' };

export default function VideosPage() {
  const t = useT();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDiff]   = useState('All');
  const offsetRef = useRef(0);
  const debouncedSearch = useDebounce(search);

  const navigate = useNavigate();

  // Split using content_type — no client-side is_short check needed
  // enrichVideo on the backend always populates content_type correctly
  const shorts = videos.filter(v => v.content_type === 'short');
  const longs  = videos.filter(v => v.content_type !== 'short');

  const LIMIT = 12;

  const fetchVideos = useCallback(async (reset = false) => {
    if (reset) { offsetRef.current = 0; setHasMore(true); }
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: offsetRef.current };
      if (category !== 'All')    params.category   = category;
      if (difficulty !== 'All')  params.difficulty  = difficulty;
      if (debouncedSearch)       params.search      = debouncedSearch;
      // No content_type filter here — we want both shorts & longs in one page fetch
      // and split client-side so both sections update together with the same filters

      const r = await api.get('/videos', { params });
      const incoming = r.data.videos || [];

      if (reset) {
        setVideos(incoming);
      } else {
        setVideos(prev => [...prev, ...incoming]);
      }

      offsetRef.current += incoming.length;
      setHasMore(incoming.length === LIMIT);
    } catch {}
    setLoading(false);
  }, [category, difficulty, debouncedSearch]);

  // Reset + refetch when filters change
  useEffect(() => { fetchVideos(true); }, [category, difficulty, debouncedSearch]);

  const loadMore = () => { if (!loading && hasMore) fetchVideos(false); };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#0B0F14' }} />;
  }

  return (
    <>
      <Helmet><title>Videos — CPA</title></Helmet>

      <div style={{ background: t.bg, minHeight: '100vh', paddingBottom: isMobile ? 80 : 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 0' : '0' }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ padding: isMobile ? '20px 16px 0' : '0 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 30, color: t.text, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
                  🎬 Video Library
                </h1>
                <p style={{ color: t.muted, fontSize: 13, margin: 0, fontFamily: "'Outfit',sans-serif" }}>
                  Developer-focused tutorials, deep dives &amp; creator content
                </p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search videos, topics, creators…"
                style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '11px 14px 11px 36px', fontSize: 14, color: t.text, outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = t.purple}
                onBlur={e => e.target.style.borderColor = t.border}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.muted, fontSize: 16, lineHeight: 1 }}>✕</button>
              )}
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 12 }}>
              {CATEGORIES.map(c => {
                const active = category === c;
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 99,
                      border: `1px solid ${active ? t.purple : t.border}`,
                      background: active ? t.purpleDim : 'transparent',
                      color: active ? t.purple : t.sub,
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                      transition: 'all 0.15s',
                    }}>
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Difficulty chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {DIFFICULTIES.map(d => {
                const active = difficulty === d;
                const color  = DIFF_COLORS[d] || t.purple;
                return (
                  <button key={d} onClick={() => setDiff(d)}
                    style={{
                      padding: '4px 12px', borderRadius: 99,
                      border: `1px solid ${active ? color : t.border}`,
                      background: active ? `${color}18` : 'transparent',
                      color: active ? color : t.muted,
                      fontSize: 11, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                      textTransform: 'uppercase', letterSpacing: '0.03em',
                      transition: 'all 0.15s',
                    }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Shorts Row ──────────────────────────────────────────────── */}
          {(shorts.length > 0 || (loading && videos.length === 0)) && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: isMobile ? '0 16px' : '0' }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>⚡ Shorts</span>
                <div style={{ background: `${t.purple}18`, border: `1px solid ${t.purple}28`, borderRadius: 5, padding: '1px 7px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: t.purple, fontWeight: 600, letterSpacing: '0.06em' }}>QUICK</span>
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
                marginLeft: isMobile ? -16 : 0, marginRight: isMobile ? -16 : 0,
                paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0,
                scrollbarWidth: 'none',
              }}>
                {loading && shorts.length === 0
                  ? [...Array(4)].map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 136, height: 220, borderRadius: 13, background: t.border }} />
                  ))
                  : shorts.map((v, i) => (
                    <ShortCard key={v.id} v={v} i={i} onClick={() => navigate(`/shorts?id=${v.id}`)} />
                  ))
                }
              </div>
            </div>
          )}

          {/* ── Long Videos Grid ─────────────────────────────────────────── */}
          <div style={{ padding: isMobile ? '0 16px' : '0' }}>
            {longs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>🎬 Videos</span>
                <div style={{ background: `${t.purple}18`, border: `1px solid ${t.purple}28`, borderRadius: 5, padding: '1px 7px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: t.purple, fontWeight: 600, letterSpacing: '0.06em' }}>LONG-FORM</span>
                </div>
              </div>
            )}
            {!loading && longs.length === 0 && shorts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: t.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>No videos found. Try different filters.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))',
                gap: 16,
              }}>
                {longs.map(v => <VideoCard key={v.id} video={v} />)}
                {loading && [...Array(6)].map((_, i) => (
                  <div key={i} style={{ borderRadius: 14, overflow: 'hidden' }}>
                    <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%' }} />
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 14, width: '80%' }} />
                      <div className="skeleton" style={{ height: 12, width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && hasMore && videos.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button onClick={loadMore}
                  style={{ background: t.purpleDim, border: `1px solid ${t.purple}44`, borderRadius: 99, padding: '11px 32px', color: t.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Load More Videos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && <MobileBottomNav />}
    </>
  );
}

