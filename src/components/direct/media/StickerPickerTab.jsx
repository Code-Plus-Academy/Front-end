'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Clock, Sparkles, Plus, Image as ImageIcon, Sticker as StickerIcon } from 'lucide-react';
import { fetchStickerPacks, getRecentStickers, saveRecentSticker, removeRecentSticker } from '../../../utils/s3MediaClient';
import { preloadStickers } from '../../../utils/stickerPreloader';

/**
 * Format collection name by stripping leading emojis for card display
 */
function formatCollectionName(name) {
  if (!name) return 'Collection';
  const clean = name.replace(/^[\p{Extended_Pictographic}\p{Emoji}\s]+/u, '').trim();
  return clean || name;
}

/**
 * Controlled Sticker Image with fallback placeholder
 */
function StickerImage({ src, alt, className, loading = 'lazy' }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 opacity-40">
        <StickerIcon size={24} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Sticker'}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  );
}

export default function StickerPickerTab({
  onSelectSticker,
  isDark = true,
  themeAccent = '#2563eb',
}) {
  const [packs, setPacks] = useState([]);
  const [activePackId, setActivePackId] = useState('exam_mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentStickers, setRecentStickers] = useState([]);
  const packScrollRef = useRef(null);

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

  const handleRemoveRecentSticker = (e, st) => {
    e.stopPropagation();
    const updated = removeRecentSticker(st.sticker_id || st.id || st.url);
    setRecentStickers(updated);
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
      {/* ── Single unified vertical scroll container for search + sticky chips + stickers ── */}
      <div className="edm-scroll flex-1 overflow-y-auto">
        {/* ── 1. Capsule Search Bar (border-radius: 40px, larger height, scrolls away) ── */}
        <div className="px-3 pt-3 pb-1.5 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-[40px] transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#f1f5f9',
              border: `1px solid ${
                searchQuery
                  ? themeAccent || '#6366f1'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)'
              }`,
              boxShadow: searchQuery
                ? `0 0 14px ${themeAccent || '#6366f1'}33`
                : 'none',
            }}
          >
            <Search
              size={16}
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              className="flex-shrink-0"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers (cid, pradyuman, daya, git)..."
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm leading-none"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors p-0.5"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Sticky Collection Classification Cards ── */}
        <div
          className="sticky top-0 z-20 px-3 py-2 border-b backdrop-blur-md transition-shadow"
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            ref={packScrollRef}
            className="flex items-stretch gap-2 overflow-x-auto edm-scroll py-0.5 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Recent & Gboard Tab Card */}
            {recentStickers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActivePackId('recent');
                  setSearchQuery('');
                }}
                className="flex flex-col items-center justify-between p-2 rounded-xl transition-all flex-shrink-0 cursor-pointer text-center group"
                style={{
                  width: '96px',
                  minWidth: '96px',
                  height: '76px',
                  backgroundColor:
                    activePackId === 'recent' && !searchQuery
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.14)'
                        : 'rgba(99, 102, 241, 0.04)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.02)'
                      : '#ffffff',
                  border:
                    activePackId === 'recent' && !searchQuery
                      ? `1.5px solid ${themeAccent || '#6366f1'}`
                      : isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow:
                    activePackId === 'recent' && !searchQuery
                      ? `0 2px 8px ${themeAccent || '#6366f1'}22`
                      : '0 1px 2px rgba(0,0,0,0.02)',
                }}
                title="Recent & Gboard Stickers"
              >
                <div className="flex-1 flex items-center justify-center">
                  <Clock
                    size={20}
                    style={{
                      color:
                        activePackId === 'recent' && !searchQuery
                          ? themeAccent || '#6366f1'
                          : isDark
                          ? '#94a3b8'
                          : '#64748b',
                    }}
                  />
                </div>
                <span
                  className="text-[10.5px] font-semibold leading-tight line-clamp-2"
                  style={{
                    color:
                      activePackId === 'recent' && !searchQuery
                        ? isDark
                          ? '#f8fafc'
                          : '#0f172a'
                        : isDark
                        ? '#cbd5e1'
                        : '#475569',
                  }}
                >
                  Recent
                </span>
                {activePackId === 'recent' && !searchQuery && (
                  <span
                    className="w-6 h-[2px] rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: themeAccent || '#6366f1' }}
                  />
                )}
              </button>
            )}

            {/* S3 / Manifest Collection Cards */}
            {packs.map((pack) => {
              const isActive = activePackId === pack.id && !searchQuery;
              const cleanName = formatCollectionName(pack.name);
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => {
                    setActivePackId(pack.id);
                    setSearchQuery('');
                  }}
                  className="flex flex-col items-center justify-between p-2 rounded-xl transition-all flex-shrink-0 cursor-pointer text-center group"
                  style={{
                    width: '96px',
                    minWidth: '96px',
                    height: '76px',
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.14)'
                        : 'rgba(99, 102, 241, 0.04)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.02)'
                      : '#ffffff',
                    border: isActive
                      ? `1.5px solid ${themeAccent || '#6366f1'}`
                      : isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: isActive
                      ? `0 2px 8px ${themeAccent || '#6366f1'}22`
                      : '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                  title={pack.name}
                >
                  <div className="flex-1 flex items-center justify-center">
                    {pack.icon ? (
                      <img
                        src={pack.icon}
                        alt=""
                        className="w-7 h-7 object-contain rounded-md filter drop-shadow-sm transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <Sparkles
                        size={18}
                        style={{ color: isActive ? themeAccent || '#6366f1' : '#94a3b8' }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[10px] sm:text-[10.5px] font-semibold leading-tight line-clamp-2 max-w-full px-0.5"
                    style={{
                      color: isActive
                        ? isDark
                          ? '#f8fafc'
                          : '#0f172a'
                        : isDark
                        ? '#cbd5e1'
                        : '#475569',
                    }}
                  >
                    {cleanName}
                  </span>
                  {isActive && (
                    <span
                      className="w-6 h-[2px] rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: themeAccent || '#6366f1' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Sticker Grid Body ── */}
        <div className="px-3 py-2.5 space-y-3">
          {loading ? (
            /* Lightweight CSS Skeleton Grid matching card dimensions */
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skel-${i}`}
                  className="p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse flex items-center justify-center">
                    <ImageIcon size={22} className="text-slate-300 dark:text-slate-700 opacity-60" />
                  </div>
                  <div className="w-full pt-2 mt-1 space-y-1.5">
                    <div className="h-2.5 w-4/5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
                    <div className="h-2 w-1/2 rounded-full bg-slate-200/40 dark:bg-slate-800/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults !== null ? (
            /* Search Results */
            <div>
              <h5
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Search Results ({searchResults.length})
              </h5>
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs gap-2">
                  <StickerIcon size={26} className="opacity-40" />
                  <span>No stickers match "{searchQuery}"</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {searchResults.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStickerClick(st, st.pack_id)}
                      className="p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 cursor-pointer group text-left"
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : '#ffffff',
                        border: isDark
                          ? '1px solid rgba(255, 255, 255, 0.07)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                      }}
                      title={st.name}
                    >
                      <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1 overflow-hidden">
                        <StickerImage
                          src={st.url || st.file}
                          alt={st.name}
                          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full pt-1.5 mt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span
                          className="text-[10px] sm:text-[11px] font-medium truncate flex-1"
                          style={{ color: isDark ? '#cbd5e1' : '#334155' }}
                        >
                          {st.name}
                        </span>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            color: isDark ? '#94a3b8' : '#64748b',
                          }}
                        >
                          <Plus size={11} strokeWidth={2.5} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : activePackId === 'recent' ? (
            /* Recent & Gboard Custom Stickers */
            <div>
              <h5
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Recent & Gboard Stickers
              </h5>
              {recentStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs gap-2">
                  <Clock size={26} className="opacity-40" />
                  <span>No recent stickers yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {recentStickers.map((st, i) => (
                    <button
                      key={st.sticker_id || st.id || st.url || i}
                      type="button"
                      onClick={() => handleStickerClick(st, st.pack_id)}
                      className="group relative p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 cursor-pointer text-left"
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : '#ffffff',
                        border: isDark
                          ? '1px solid rgba(255, 255, 255, 0.07)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                      }}
                      title={st.alt || st.name}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecentSticker(e, st)}
                        title="Remove from recent"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-500 text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <X size={11} />
                      </button>
                      <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1 overflow-hidden">
                        <StickerImage
                          src={st.url}
                          alt={st.alt}
                          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                          loading="eager"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full pt-1.5 mt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span
                          className="text-[10px] sm:text-[11px] font-medium truncate flex-1"
                          style={{ color: isDark ? '#cbd5e1' : '#334155' }}
                        >
                          {st.alt || st.name || 'Sticker'}
                        </span>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            color: isDark ? '#94a3b8' : '#64748b',
                          }}
                        >
                          <Plus size={11} strokeWidth={2.5} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : activePack?.stickers ? (
            /* Active Pack Grid */
            <div>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h5
                  className="text-xs font-bold flex items-center gap-1.5"
                  style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                >
                  <span>{activePack.name}</span>
                </h5>
                <span
                  className="text-[11px] font-medium opacity-75"
                  style={{ color: themeAccent || '#6366f1' }}
                >
                  {activePack.stickers.length} stickers &gt;
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {activePack.stickers.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStickerClick(st, activePack.id)}
                    className="p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 cursor-pointer group text-left"
                    style={{
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : '#ffffff',
                      border: isDark
                        ? '1px solid rgba(255, 255, 255, 0.07)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                    }}
                    title={st.name}
                  >
                    <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1 overflow-hidden">
                      <StickerImage
                        src={st.url || st.file}
                        alt={st.name}
                        className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                        loading="eager"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full pt-1.5 mt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                      <span
                        className="text-[10px] sm:text-[11px] font-medium truncate flex-1"
                        style={{ color: isDark ? '#cbd5e1' : '#334155' }}
                      >
                        {st.name}
                      </span>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          color: isDark ? '#94a3b8' : '#64748b',
                        }}
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

