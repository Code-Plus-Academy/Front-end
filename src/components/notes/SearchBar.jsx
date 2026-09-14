'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import useAnalytics from '../../hooks/useAnalytics';

export default function SearchBar({
  placeholder = 'Search notes, PYQs, courses, colleges...',
  variant = 'default',
  className = '',
}) {
  const router = useRouter();
  const { trackNotesEvent, GA_EVENTS } = useAnalytics();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qVal = new URLSearchParams(window.location.search).get('q') || '';
      setQuery(qVal);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Expecting list of { id, text, type, targetUrl }
          setSuggestions(data.slice(0, 6) || []);
        }
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      trackNotesEvent(GA_EVENTS.NOTES_SEARCH, {
        extra: { search_term: query.trim() }
      });
      router.push(`/notes/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setIsOpen(false);
    trackNotesEvent(GA_EVENTS.NOTES_AUTOSUGGEST_CLICK, {
      extra: {
        suggestion_text: suggestion.text,
        suggestion_type: suggestion.type,
      }
    });
    if (suggestion.targetUrl) {
      router.push(suggestion.targetUrl);
    } else {
      router.push(`/notes/search?q=${encodeURIComponent(suggestion.text)}`);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isHero ? 'max-w-xl' : 'max-w-[440px]'} ${className}`}
    >
      <form onSubmit={handleSubmit} className="w-full">
        {isHero ? (
          <div className="relative flex items-center w-full h-14 sm:h-15 rounded-full border border-slate-200 dark:border-slate-700/90 bg-white/90 dark:bg-[#151928]/95 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all pl-4 sm:pl-5 pr-2 gap-2">
            <span className="material-symbols-rounded text-slate-400 dark:text-slate-500 text-[20px] sm:text-[22px] shrink-0">
              search
            </span>

            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-medium py-2"
            />

            {loading && (
              <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0 mr-1" />
            )}

            <button
              type="submit"
              aria-label="Submit search"
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-rounded text-[20px]">search</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              borderRadius: 40,
              border: '1px solid var(--border-bright)',
              background: 'var(--s2)',
              overflow: 'hidden',
              height: 38,
              transition: 'all 0.2s ease',
              paddingLeft: 14,
            }}
          >
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: 14,
                padding: 0,
              }}
            />
            {loading && (
              <Loader2 size={16} className="spin" style={{ color: 'var(--sub)', marginRight: 10 }} />
            )}
            <button
              type="submit"
              style={{
                width: 48,
                height: '100%',
                border: 'none',
                background: 'var(--s3)',
                borderLeft: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>search</span>
            </button>
          </div>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute left-0 right-0 z-50 overflow-y-auto max-h-80 p-2 shadow-2xl backdrop-blur-md transition-all ${
            isHero
              ? 'top-[calc(100%+10px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#161a2b]/95'
              : 'top-[calc(100%+8px)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          {suggestions.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handleSuggestionClick(item)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="material-symbols-rounded text-slate-400 dark:text-slate-500 text-[18px]">
                {item.type === 'college' ? 'school' : item.type === 'subject' ? 'book' : 'description'}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold truncate text-slate-900 dark:text-white">
                  {item.text}
                </span>
                {item.subtext && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.subtext}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
