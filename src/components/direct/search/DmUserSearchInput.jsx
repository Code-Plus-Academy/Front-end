import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function DmUserSearchInput({
  value,
  onChange,
  onClear,
  isLoading = false,
  isDark = false,
  placeholder = 'Search people, username or profession...',
  autoFocus = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* Left Search Icon */}
      <div
        style={{
          position: 'absolute',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          color: isFocused ? '#8B5CF6' : (isDark ? '#94A3B8' : '#64748B'),
          transition: 'color 0.2s ease',
          zIndex: 2,
        }}
      >
        <Search size={18} strokeWidth={2.2} />
      </div>

      {/* Primary Rounded Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        aria-label="Search people, username or profession"
        style={{
          width: '100%',
          height: '48px',
          background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
          border: isFocused
            ? '1.5px solid #8B5CF6'
            : (isDark ? '1.5px solid rgba(139, 92, 246, 0.28)' : '1.5px solid rgba(168, 85, 247, 0.35)'),
          borderRadius: '9999px',
          padding: '12px 42px 12px 46px',
          fontSize: '14px',
          fontFamily: "'Inter', 'Geist', sans-serif",
          color: isDark ? '#F8FAFC' : '#0F172A',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(139, 92, 246, 0.2), 0 4px 16px rgba(124, 58, 237, 0.15)'
            : (isDark ? 'none' : '0 2px 10px rgba(139, 92, 246, 0.08)'),
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Right Controls: Spinner / Clear (X) */}
      <div
        style={{
          position: 'absolute',
          right: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 2,
        }}
      >
        {isLoading && (
          <Loader2
            size={16}
            color="#8B5CF6"
            className="animate-spin"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        )}

        {value && !isLoading && (
          <button
            type="button"
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
              border: 'none',
              color: isDark ? '#E2E8F0' : '#475569',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';
            }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
