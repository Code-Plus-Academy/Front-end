'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Sparkles, Loader2, Sticker as StickerIcon } from 'lucide-react';
import { fetchStickerPacks, getRecentStickers, saveRecentSticker } from '../../../utils/s3MediaClient';
import { preloadStickers } from '../../../utils/stickerPreloader';

export default function StickerPickerTab({
  onSelectSticker,
  isDark = true,
  themeAccent = '#6e00ff',
}) {
  const [packs, setPacks] = useState([]);
  const [activePackId, setActivePackId] = useState('dev_life');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentStickers, setRecentStickers] = useState([]);

  useEffect(() => {
    setRecentStickers(getRecentStickers());

    fetchStickerPacks()
      .then((data) => {
        setPacks(data || []);
        if (data?.[0]?.id) {
          setActivePackId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Preload visible stickers when active pack changes
  useEffect(() => {
    if (!packs.length) return;
    const activePack = packs.find((p) => p.id === activePackId);
    if (activePack?.stickers) {
      preloadStickers(activePack.stickers);
    }
  }, [activePackId, packs]);

  const handleStickerClick = (sticker, packId = activePackId) => {
    const payload = {
      content_type: 'sticker',
      pack_id: packId || 'custom',
      sticker_id: sticker.id || `custom_${Date.now()}`,
      url: sticker.url || sticker.file,
      alt: sticker.name || sticker.alt || 'Sticker',
      width: sticker.width || 256,
      height: sticker.height || 256,
    };

    saveRecentSticker(payload);
    setRecentStickers(getRecentStickers());
    if (onSelectSticker) {
      onSelectSticker(payload);
    }
  };

  // Filter stickers by search query across all packs
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches = [];

    packs.forEach((pack) => {
      (pack.stickers || []).forEach((st) => {
        const nameMatch = st.name?.toLowerCase().includes(q);
        const tagMatch = st.tags?.some((t) => t.toLowerCase().includes(q));
        if (nameMatch || tagMatch) {
          matches.push({ ...st, pack_id: pack.id });
        }
      });
    });

    return matches;
  }, [searchQuery, packs]);

  const activePack = packs.find((p) => p.id === activePackId) || packs[0];

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ── 1. Top Pack Selector Carousel ───────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 border-b overflow-x-auto edm-scroll flex-shrink-0"
        style={{
          backgroundColor: isDark ? 'rgba(21, 28, 36, 0.85)' : '#f8fafc',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Recent / Gboard Tab Icon */}
        {recentStickers.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActivePackId('recent');
              setSearchQuery('');
            }}
            className="flex items-center justify-center p-2 rounded-xl transition-all flex-shrink-0 cursor-pointer"
            style={{
              backgroundColor: activePackId === 'recent' && !searchQuery ? `${themeAccent}25` : 'transparent',
              color: activePackId === 'recent' && !searchQuery ? themeAccent : (isDark ? '#94a3b8' : '#64748b'),
              border: activePackId === 'recent' && !searchQuery ? `1px solid ${themeAccent}50` : '1px solid transparent',
            }}
            title="Recent & Gboard Stickers"
          >
            <Clock size={18} />
          </button>
        )}

        {/* Packs from S3 / Manifest */}
        {packs.map((pack) => {
          const isActive = activePackId === pack.id && !searchQuery;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => {
                setActivePackId(pack.id);
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: isActive ? `${themeAccent}25` : 'transparent',
                color: isActive ? themeAccent : (isDark ? '#cbd5e1' : '#475569'),
                border: isActive ? `1px solid ${themeAccent}50` : '1px solid transparent',
              }}
            >
              {pack.icon ? (
                <img src={pack.icon} alt="" className="w-4 h-4 object-contain rounded-md" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{pack.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. Capsule Search Bar ────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
            border: `1px solid ${searchQuery ? themeAccent : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0')}`,
            boxShadow: searchQuery ? `0 0 10px ${themeAccent}33` : 'none',
          }}
        >
          <Search size={14} style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stickers (git, coffee, exam)..."
            className="w-full bg-transparent border-none outline-none text-xs leading-none"
            style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Sticker Grid Body ─────────────────────────────────────────── */}
      <div className="edm-scroll flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-xs opacity-60">
            <Loader2 size={18} className="animate-spin" style={{ color: themeAccent }} />
            <span>Loading sticker packs...</span>
          </div>
        ) : searchResults !== null ? (
          /* Search Results */
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Search Results ({searchResults.length})
            </h5>
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs gap-1.5">
                <StickerIcon size={24} className="opacity-40" />
                <span>No stickers match "{searchQuery}"</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                {searchResults.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStickerClick(st, st.pack_id)}
                    className="p-2 rounded-2xl flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer"
                    style={{ background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}
                    title={st.name}
                  >
                    <img src={st.url || st.file} alt={st.name} className="w-16 h-16 object-contain" loading="lazy" />
                    <span className="text-[10px] mt-1 truncate max-w-full font-medium" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      {st.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activePackId === 'recent' ? (
          /* Recent & Gboard Custom Stickers */
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Recent & Gboard Stickers
            </h5>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {recentStickers.map((st, i) => (
                <button
                  key={st.url || i}
                  type="button"
                  onClick={() => handleStickerClick(st, st.pack_id)}
                  className="p-2 rounded-2xl flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer"
                  style={{ background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}
                  title={st.alt || st.name}
                >
                  <img src={st.url} alt={st.alt} className="w-16 h-16 object-contain" loading="eager" />
                  <span className="text-[10px] mt-1 truncate max-w-full font-medium" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {st.alt || st.name || 'Sticker'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : activePack?.stickers ? (
          /* Active Pack Grid */
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[11.5px] font-bold" style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                {activePack.name}
              </h5>
              <span className="text-[10px] font-mono opacity-60">
                {activePack.stickers.length} stickers
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {activePack.stickers.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStickerClick(st, activePack.id)}
                  className="p-2 rounded-2xl flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer"
                  style={{ background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}
                  title={st.name}
                >
                  <img src={st.url || st.file} alt={st.name} className="w-16 h-16 object-contain" loading="eager" />
                  <span className="text-[10px] mt-1 truncate max-w-full font-medium" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {st.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
