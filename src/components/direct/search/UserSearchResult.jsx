import React from 'react';
import { Send, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatBioOrRole(u) {
  if (u.headline) return u.headline;
  if (u.role && u.role !== 'user' && u.role !== 'learner') return u.role;
  if (u.account_type && u.account_type !== 'learner') {
    return u.account_type.charAt(0).toUpperCase() + u.account_type.slice(1);
  }
  if (u.tech_interests && u.tech_interests.length > 0) {
    return u.tech_interests.slice(0, 3).join(' • ');
  }
  if (u.bio) {
    const cleanBio = u.bio.replace(/\r?\n/g, ' ').trim();
    return cleanBio.length > 40 ? cleanBio.slice(0, 40) + '...' : cleanBio;
  }
  return 'FocusGram Member';
}

export default function UserSearchResult({
  user,
  onSelectUser,
  isDark = false,
}) {
  const navigate = useNavigate();
  if (!user) return null;

  const name = user.name || user.displayName || user.username || 'User';
  const username = user.username || '';
  const avatar = user.avatar_url || user.avatarUrl || null;
  const isOnline = Boolean(user.is_active || user.other_is_active);
  const subtitle = formatBioOrRole(user);

  return (
    <div
      onClick={() => onSelectUser(user)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectUser(user);
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '16px',
        cursor: 'pointer',
        background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.02)',
        transition: 'all 0.15s ease',
        marginBottom: '6px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : '#F8FAFC';
        e.currentTarget.style.borderColor = isDark
          ? 'rgba(139, 92, 246, 0.35)'
          : '#E2E8F0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark
          ? 'rgba(15, 23, 42, 0.6)'
          : '#FFFFFF';
        e.currentTarget.style.borderColor = isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : '#F1F5F9';
      }}
    >
      {/* Avatar */}
      <div
        style={{ position: 'relative', flexShrink: 0 }}
        onClick={(e) => {
          if (username) {
            e.stopPropagation();
            navigate(`/u/${username}`);
          }
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
              background: isDark ? '#1E293B' : '#F1F5F9',
            }}
          />
        ) : (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        {isOnline && (
          <span
            title="Online"
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background: '#10B981',
              border: `2px solid ${isDark ? '#0F172A' : '#FFFFFF'}`,
            }}
          />
        )}
      </div>

      {/* User Information */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={(e) => {
            if (username) {
              e.stopPropagation();
              navigate(`/u/${username}`);
            }
          }}
          style={{
            fontWeight: 700,
            fontSize: '14px',
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          onClick={(e) => {
            if (username) {
              e.stopPropagation();
              navigate(`/u/${username}`);
            }
          }}
          style={{
            fontSize: '11.5px',
            color: '#8B5CF6',
            fontFamily: "'Inter', 'Geist', sans-serif",
            margin: '1px 0 2px',
          }}
        >
          @{username}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: isDark ? '#94A3B8' : '#64748B',
            fontFamily: "'Inter', 'Geist', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Message action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectUser(user);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          borderRadius: '9999px',
          border: isDark
            ? '1px solid rgba(139, 92, 246, 0.4)'
            : '1px solid #EDE9FE',
          background: isDark
            ? 'rgba(139, 92, 246, 0.18)'
            : '#F5F3FF',
          color: isDark ? '#C4B5FD' : '#7C3AED',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Inter', 'Geist', sans-serif",
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
      >
        <Send size={12} strokeWidth={2.2} />
        <span>Message</span>
      </button>
    </div>
  );
}
