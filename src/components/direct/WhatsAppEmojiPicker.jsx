'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Clock,
  Smile,
  Leaf,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Hash,
  Flag,
  Search,
  X,
  Sticker,
  Sparkles,
  Film,
} from 'lucide-react';
import { ALL_EMOJI_CATEGORIES } from './WhatsAppEmojiPicker';

export { ALL_EMOJI_CATEGORIES };

export default function WhatsAppEmojiPicker({
  onSelectEmoji,
  isDark = true,
  themeAccent = '#6e00ff',
}) {
  const [activeCategory, setActiveCategory] = useState('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cpa_recent_emojis');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ['😄', '🔥', '👍', '❤️', '🚀', '✨', '💻', '🎉'];
  });
  const [activeBottomTab, setActiveBottomTab] = useState('emoji');
  const isProgrammaticScroll = useRef(false);

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  // Sync recent emojis
  const handleEmojiClick = (emojiChar) => {
    onSelectEmoji(emojiChar);
    setRecentEmojis((prev) => {
      const updated = [emojiChar, ...prev.filter((e) => e !== emojiChar)].slice(0, 18);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cpa_recent_emojis', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Scroll to category on top icon click
  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    isProgrammaticScroll.current = true;
    const target = categoryRefs.current[categoryId];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  };

  // Dynamic Scroll-Spy: detect which category is in view
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current || searchQuery.trim() || !scrollContainerRef.current) return;

    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
    let closestCategory = null;
    let smallestDistance = Infinity;

    ALL_EMOJI_CATEGORIES.forEach((cat) => {
      const el = categoryRefs.current[cat.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);
        if (rect.top - containerTop <= 60 && distance < smallestDistance) {
          smallestDistance = distance;
          closestCategory = cat.id;
        }
      }
    });

    if (closestCategory && closestCategory !== activeCategory) {
      setActiveCategory(closestCategory);
    }
  }, [activeCategory, searchQuery]);

  // Filter emojis by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_EMOJI_CATEGORIES.map((cat) => {
        if (cat.id === 'recent') {
          return {
            ...cat,
            emojis: recentEmojis.map((e) => ({ char: e, name: 'recent' })),
          };
        }
        return cat;
      });
    }

    const q = searchQuery.toLowerCase().trim();
    return ALL_EMOJI_CATEGORIES.map((cat) => {
      const sourceEmojis = cat.id === 'recent'
        ? recentEmojis.map((e) => ({ char: e, name: 'recent' }))
        : cat.emojis;
      const matched = sourceEmojis.filter((e) => e.name.toLowerCase().includes(q) || e.char === q);
      return { ...cat, emojis: matched };
    }).filter((cat) => cat.emojis.length > 0);
  }, [searchQuery, recentEmojis]);

  const brandAccent = themeAccent || '#6e00ff';

  return (
    <div
      className="whatsapp-emoji-modal flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        width: 'min(440px, 94vw)',
        height: '420px',
        backgroundColor: isDark ? 'rgba(15, 20, 25, 0.98)' : '#ffffff',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 20px 50px rgba(0, 0, 0, 0.18)',
        fontFamily: 'inherit',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {activeBottomTab === 'emoji' ? (
        <>
          {/* ── 1. Top Category Navigation Bar with Scroll-Spy & Brand Accent ───── */}
          <div
            className="flex items-center justify-between px-2 pt-2 pb-1 border-b"
            style={{
              backgroundColor: isDark ? 'rgba(21, 28, 36, 0.8)' : '#f8fafc',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {ALL_EMOJI_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className="relative p-2 rounded-lg transition-all flex items-center justify-center flex-1 cursor-pointer"
                  style={{
                    color: isActive ? brandAccent : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                  title={cat.name}
                >
                  <IconComp size={18} />
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{
                        backgroundColor: brandAccent,
                        boxShadow: `0 0 8px ${brandAccent}aa`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 2. WhatsApp Capsule Search Bar (Brand Colors) ─────────────────── */}
          <div className="px-3 pt-2.5 pb-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                border: `1px solid ${searchQuery ? brandAccent : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0')}`,
                boxShadow: searchQuery ? `0 0 10px ${brandAccent}33` : 'none',
              }}
            >
              <Search size={15} style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emoji..."
                className="w-full bg-transparent border-none outline-none text-xs leading-none"
                style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── 3. Scrollable Emoji Grid with Scroll-Spy ───────────────────────── */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="edm-scroll flex-1 overflow-y-auto px-3 py-1 space-y-4"
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs gap-2">
                <span>No emojis found for "{searchQuery}"</span>
              </div>
            ) : (
              filteredCategories.map((category) => {
                if (category.emojis.length === 0) return null;
                return (
                  <div
                    key={category.id}
                    ref={(el) => {
                      categoryRefs.current[category.id] = el;
                    }}
                    className="space-y-1.5"
                  >
                    {/* Category Header */}
                    <h5
                      className="text-[11.5px] font-semibold sticky top-0 py-1 z-10"
                      style={{
                        backgroundColor: isDark ? 'rgba(15, 20, 25, 0.98)' : '#ffffff',
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      {category.name}
                    </h5>

                    {/* Emoji Grid (8 columns) */}
                    <div className="grid grid-cols-8 gap-1">
                      {category.emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleEmojiClick(emoji.char)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-2xl hover:scale-125 hover:bg-white/10 active:scale-95 transition-transform select-none cursor-pointer"
                          title={emoji.name}
                        >
                          {emoji.char}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : activeBottomTab === 'gif' ? (
        /* ── GIF Coming Soon View ────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${brandAccent}20`,
              color: brandAccent,
              border: `1px solid ${brandAccent}40`,
              boxShadow: `0 8px 24px ${brandAccent}22`,
            }}
          >
            <Film size={32} />
          </div>
          <div className="space-y-1">
            <h4
              className="text-base font-bold tracking-tight"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            >
              GIFs Coming Soon
            </h4>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Share high-energy animated GIF reactions and memes directly in your Code Plus Academy conversations.
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-wider uppercase mt-1"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              color: brandAccent,
              border: `1px solid ${brandAccent}33`,
            }}
          >
            In Active Development
          </div>
        </div>
      ) : (
        /* ── Sticker Coming Soon View ────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${brandAccent}20`,
              color: brandAccent,
              border: `1px solid ${brandAccent}40`,
              boxShadow: `0 8px 24px ${brandAccent}22`,
            }}
          >
            <Sticker size={32} />
          </div>
          <div className="space-y-1">
            <h4
              className="text-base font-bold tracking-tight"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            >
              Stickers Coming Soon
            </h4>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Custom Code+ developer sticker packs, tech badges, and college study reaction sets.
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-wider uppercase mt-1"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              color: brandAccent,
              border: `1px solid ${brandAccent}33`,
            }}
          >
            In Active Development
          </div>
        </div>
      )}

      {/* ── 4. Bottom Segmented Footer (Emoji / GIF / Sticker) with Brand Glow ─ */}
      <div
        className="flex items-center justify-center py-2 px-3 border-t"
        style={{
          backgroundColor: isDark ? 'rgba(21, 28, 36, 0.8)' : '#f8fafc',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          className="flex items-center rounded-full p-0.5"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveBottomTab('emoji')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'emoji'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'emoji' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'emoji' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <Smile size={14} />
            <span>Emoji</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('gif')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'gif'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'gif' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'gif' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <span className="font-bold text-[10px]">GIF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('sticker')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'sticker'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'sticker' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'sticker' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <Sticker size={14} />
            <span>Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
}
