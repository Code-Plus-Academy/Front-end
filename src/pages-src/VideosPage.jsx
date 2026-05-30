'use client';
// frontend/src/pages/videos/VideosPage.jsx
// Browse all videos — filterable grid with category chips and search.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '../components/seo/HelmetShim';
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
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
}

const CATEGORIES = ['All', 'AI & ML', 'Web Dev', 'Blockchain', 'Cybersecurity', 'System Design', 'GATE CS', 'AI Agents', 'Flutter'];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'];
const DIFF_COLORS = { beginner: '#22C55E', intermediate: '#F59E0B', advanced: '#EF4444' };

export default function VideosPage() {
  const t = useT();
  const isMobile = useIsMobile();

  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDiff]   = useState('All');
  const offsetRef = useRef(0);
  const debouncedSearch = useDebounce(search);

  const LIMIT = 12;

  const fetchVideos = useCallback(async (reset = false) => {
    if (reset) { offsetRef.current = 0; setHasMore(true); }
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: offsetRef.current };
      if (category !== 'All')    params.category   = category;
      if (difficulty !== 'All')  params.difficulty  = difficulty;
      if (debouncedSearch)       params.search      = debouncedSearch;

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

          {/* ── Video Grid ──────────────────────────────────────────────── */}
          <div style={{ padding: isMobile ? '0 16px' : '0' }}>
            {!loading && videos.length === 0 ? (
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
                {videos.map(v => <VideoCard key={v.id} video={v} />)}
                {loading && Array.from({ length: 6 }).map((_, i) => (
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
