'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SearchBar({ placeholder = 'Search notes, PYQs, courses...' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(searchParams?.get('q') || '');
  }, [searchParams]);

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
      router.push(`/notes/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setIsOpen(false);
    if (suggestion.targetUrl) {
      router.push(suggestion.targetUrl);
    } else {
      router.push(`/notes/search?q=${encodeURIComponent(suggestion.text)}`);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
        <div style={{
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
        }}>
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
      </form>

      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-modal)',
          padding: '8px 0',
          zIndex: 1000,
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {suggestions.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handleSuggestionClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                gap: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--sub)' }}>
                {item.type === 'college' ? 'school' : item.type === 'subject' ? 'book' : 'description'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.text}
                </span>
                {item.subtext && (
                  <span style={{ fontSize: 11, color: 'var(--sub)' }}>
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
