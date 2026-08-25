'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Loader2, Sparkles } from 'lucide-react';
import { fetchCuratedGifs, searchTenorGifs, getRecentGifs, saveRecentGif } from '../../../utils/s3MediaClient';

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
  themeAccent = '#6e00ff',
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

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ── 1. Capsule Search Bar ────────────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
            border: `1px solid ${query ? themeAccent : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0')}`,
            boxShadow: query ? `0 0 10px ${themeAccent}33` : 'none',
          }}
        >
          <Search size={14} style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs via Tenor & S3..."
            className="w-full bg-transparent border-none outline-none text-xs leading-none"
            style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Category Chips ────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto edm-scroll flex-shrink-0"
        style={{
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
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
              className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: isActive ? themeAccent : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── 3. GIF Masonry Grid ──────────────────────────────────────────── */}
      <div className="edm-scroll flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-xs opacity-60">
            <Loader2 size={18} className="animate-spin" style={{ color: themeAccent }} />
            <span>Loading animated GIFs...</span>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs gap-1.5">
            <Film size={24} className="opacity-40" />
            <span>No GIFs found for "{query || activeCategory}"</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif, idx) => (
              <button
                key={gif.id || idx}
                type="button"
                onClick={() => handleGifClick(gif)}
                className="group relative rounded-xl overflow-hidden cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-95"
                style={{
                  aspectRatio: `${gif.aspect_ratio || 1.33}`,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
                }}
                title={gif.title}
              >
                <img
                  src={gif.preview_url || gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"
                >
                  <span className="text-[10px] text-white font-medium truncate drop-shadow-md">
                    {gif.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
