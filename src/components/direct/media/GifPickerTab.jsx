'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Loader2, Sparkles } from 'lucide-react';
import { fetchCuratedGifs, searchTenorGifs, getRecentGifs, saveRecentGif, removeRecentGif } from '../../../utils/s3MediaClient';

const CATEGORIES = [
  { id: '', label: '🔥 Trending' },
  { id: 'gboard', label: '🌟 My Gboard' },
  { id: 'coding', label: '💻 Coding' },
  { id: 'reactions', label: '🤯 Reactions' },
  { id: 'memes', label: '🐸 Memes' },
  { id: 'celebration', label: '🎉 Win' },
  { id: 'hacker', label: '⚡ Hacker' },
];

export default function GifPickerTab({
  onSelectGif,
  isDark = true,
  themeAccent = '#2563eb',
}) {
  const [gifs, setGifs] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef(null);

  const loadGifs = (searchTerm) => {
    setLoading(true);
    if (activeCategory === 'gboard' && !searchTerm) {
      const recent = getRecentGifs();
      setGifs(recent);
      setLoading(false);
      return;
    }

    searchTenorGifs(searchTerm, 24)
      .then((results) => {
        setGifs(results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Initial load
  useEffect(() => {
    loadGifs(activeCategory === 'gboard' ? '' : activeCategory);
  }, [activeCategory]);

  // Debounced search watcher (250ms)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        loadGifs(query.trim());
      } else {
        loadGifs(activeCategory === 'gboard' ? '' : activeCategory);
      }
    }, 250);

    return () => clearTimeout(debounceTimerRef.current);
  }, [query]);

  const handleGifClick = (gif) => {
    const payload = {
      content_type: 'gif',
      gif_id: gif.id || gif.gif_id || `gif_${Date.now()}`,
      url: gif.url,
      preview_url: gif.preview_url || gif.url,
      title: gif.title || 'Animated GIF',
      width: gif.width || 480,
      height: gif.height || 270,
      aspect_ratio: gif.aspect_ratio || 1.77,
    };

    saveRecentGif(payload);

    if (onSelectGif) {
      onSelectGif(payload);
    }
  };

  const handleRemoveRecent = (e, gif) => {
    e.stopPropagation();
    const updated = removeRecentGif(gif.gif_id || gif.id);
    setGifs(updated);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ── 1. Capsule Search Bar ────────────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#f1f5f9',
            border: `1px solid ${
              query
                ? themeAccent
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)'
            }`,
            boxShadow: query ? `0 0 12px ${themeAccent}33` : 'none',
          }}
        >
          <Search
            size={15}
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            className="flex-shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs via Tenor & S3..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm leading-none"
            style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Category Filter Pills ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto edm-scroll flex-shrink-0"
        style={{
          borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.06)'
            : '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id && !query;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setQuery('');
              }}
              className="relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1"
              style={{
                backgroundColor: isActive
                  ? themeAccent
                  : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.05)',
                color: isActive ? '#ffffff' : isDark ? '#94a3b8' : '#64748b',
                boxShadow: isActive ? `0 2px 8px ${themeAccent}50` : 'none',
              }}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. GIF Masonry Grid ──────────────────────────────────────────── */}
      <div className="edm-scroll flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-xs opacity-70">
            <Loader2 size={20} className="animate-spin" style={{ color: themeAccent }} />
            <span>Loading animated GIFs...</span>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-slate-400 text-xs gap-2">
            <Film size={26} className="opacity-40" />
            <span>
              {activeCategory === 'gboard'
                ? 'No saved Gboard GIFs yet. Send one to see it here!'
                : `No GIFs found for "${query || activeCategory}"`}
            </span>
          </div>
        ) : (
          <>
            {/* Featured Trending Hero Banner (when on trending & no search query) */}
            {!query && activeCategory === '' && (
              <div
                className="flex items-center justify-between p-3 rounded-2xl mb-2"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(241, 245, 249, 0.9) 100%)',
                  border: isDark
                    ? '1px solid rgba(37, 99, 235, 0.3)'
                    : '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                    Trending GIFs
                  </span>
                  <span className="text-[11px] opacity-70" style={{ color: isDark ? '#cbd5e1' : '#64748b' }}>
                    Hot & popular right now
                  </span>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1"
                  style={{ backgroundColor: themeAccent }}
                >
                  <Sparkles size={12} />
                  <span>Explore</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif, idx) => (
                <button
                  key={gif.gif_id || gif.id || idx}
                  type="button"
                  onClick={() => handleGifClick(gif)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.02] active:scale-95 shadow-sm"
                  style={{
                    aspectRatio: `${gif.aspect_ratio || 1.33}`,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
                    border: isDark
                      ? '1px solid rgba(255, 255, 255, 0.06)'
                      : '1px solid rgba(0, 0, 0, 0.04)',
                  }}
                  title={gif.title}
                >
                  <img
                    src={gif.preview_url || gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {activeCategory === 'gboard' && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecent(e, gif)}
                      title="Remove from saved"
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-500/80 text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10.5px] text-white font-medium truncate drop-shadow-md">
                      {gif.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
