'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Smile,
  Leaf,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Hash,
  Search,
  X,
} from 'lucide-react';
import { ALL_EMOJI_CATEGORIES } from '../WhatsAppEmojiPicker';

const CATEGORY_ICONS = {
  people: Smile,
  nature: Leaf,
  food: Coffee,
  activity: Trophy,
  travel: Car,
  objects: Lightbulb,
  symbols: Hash,
};

export default function EmojiPickerTab({
  onSelectEmoji,
  isDark = true,
  themeAccent = '#2563eb',
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

  const isProgrammaticScroll = useRef(false);
  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  const handleEmojiClick = (emojiChar) => {
    if (onSelectEmoji) onSelectEmoji(emojiChar);
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

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* ── 1. Top Category Bar with Indicator ────────────────────────────── */}
      <div
        className="flex items-center justify-between px-2 pt-2 pb-1 border-b flex-shrink-0"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        }}
      >
        {ALL_EMOJI_CATEGORIES.map((cat) => {
          const IconComp = CATEGORY_ICONS[cat.id] || Smile;
          const isActive = activeCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollToCategory(cat.id)}
              className="relative p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center flex-1 cursor-pointer"
              style={{
                backgroundColor: isActive
                  ? isDark
                    ? 'rgba(37, 99, 235, 0.15)'
                    : 'rgba(37, 99, 235, 0.1)'
                  : 'transparent',
                color: isActive ? themeAccent : isDark ? '#94a3b8' : '#64748b',
              }}
              title={cat.name}
            >
              <IconComp size={18} />
              {isActive && (
                <div
                  className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] rounded-full"
                  style={{
                    backgroundColor: themeAccent,
                    boxShadow: `0 0 8px ${themeAccent}aa`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 2. Rounded Modern Search Bar ──────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#f1f5f9',
            border: `1px solid ${
              searchQuery
                ? themeAccent
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)'
            }`,
            boxShadow: searchQuery ? `0 0 12px ${themeAccent}33` : 'none',
          }}
        >
          <Search
            size={15}
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            className="flex-shrink-0"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm leading-none"
            style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Scrollable Emoji Grid ──────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="edm-scroll flex-1 overflow-y-auto px-3 py-1 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2">
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
                <h5
                  className="text-xs font-semibold sticky top-0 py-1 z-10"
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  {category.name}
                </h5>
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                  {category.emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleEmojiClick(emoji.char)}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl text-3xl sm:text-[32px] hover:scale-125 hover:bg-slate-500/10 active:scale-90 transition-transform select-none cursor-pointer"
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
    </div>
  );
}
