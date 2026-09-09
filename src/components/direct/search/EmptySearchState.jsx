import React from 'react';
import { UserX, Search } from 'lucide-react';

export default function EmptySearchState({ query = '', isDark = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 20px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Icon Capsule with Glow */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #EDE9FE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8B5CF6',
          marginBottom: '16px',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
        }}
      >
        <Search size={28} strokeWidth={2} />
      </div>

      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '17px',
          fontWeight: 800,
          color: isDark ? '#F8FAFC' : '#0F172A',
          fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
          letterSpacing: '-0.3px',
        }}
      >
        No people found
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: isDark ? '#94A3B8' : '#64748B',
          maxWidth: '280px',
          lineHeight: 1.4,
          fontFamily: "'Inter', 'Geist', sans-serif",
        }}
      >
        {query ? (
          <>No users matching "<span style={{ color: '#8B5CF6', fontWeight: 600 }}>{query}</span>". Try searching by name, username or profession.</>
        ) : (
          'Try searching by name, username or profession.'
        )}
      </p>
    </div>
  );
}
