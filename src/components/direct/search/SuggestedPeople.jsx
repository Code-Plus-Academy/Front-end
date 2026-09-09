import React from 'react';
import { Users, Send, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getProfession(u) {
  if (u.headline) return u.headline;
  if (u.role && u.role !== 'user' && u.role !== 'learner') return u.role;
  if (u.account_type && u.account_type !== 'learner') {
    return u.account_type.charAt(0).toUpperCase() + u.account_type.slice(1);
  }
  if (u.tech_interests && u.tech_interests.length > 0) {
    return u.tech_interests.slice(0, 2).join(' • ');
  }
  if (u.bio) {
    const cleanBio = u.bio.replace(/\r?\n/g, ' ').trim();
    return cleanBio.length > 36 ? cleanBio.slice(0, 36) + '...' : cleanBio;
  }
  return 'FocusGram Member';
}

export default function SuggestedPeople({
  users = [],
  onSelectUser,
  onSeeAll,
  isDark = false,
}) {
  const navigate = useNavigate();

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="suggested-people-heading"
      style={{
        width: '100%',
        background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
        borderRadius: '20px',
        padding: '16px 16px 10px',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.25)'
          : '0 4px 20px rgba(0, 0, 0, 0.03)',
        boxSizing: 'border-box',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: isDark ? 'rgba(139, 92, 246, 0.18)' : '#F5F3FF',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #EDE9FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B5CF6',
              flexShrink: 0,
            }}
          >
            <Users size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2
              id="suggested-people-heading"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.2px',
                fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
              }}
            >
              Suggested people
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: '12px',
                color: isDark ? '#94A3B8' : '#64748B',
                fontFamily: "'Inter', 'Geist', sans-serif",
              }}
            >
              Connect with interesting people on FocusGram
            </p>
          </div>
        </div>

        {onSeeAll && users.length > 4 && (
          <button
            type="button"
            onClick={onSeeAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B5CF6',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 6px',
              borderRadius: '6px',
              fontFamily: "'Inter', 'Geist', sans-serif",
            }}
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Suggested People List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.map((u) => {
          const name = u.name || u.displayName || u.username;
          const username = u.username || '';
          const avatar = u.avatar_url || u.avatarUrl || null;
          const profession = getProfession(u);

          return (
            <div
              key={u.id || username}
              onClick={() => onSelectUser(u)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectUser(u);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 10px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div
                style={{ flexShrink: 0 }}
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
              </div>

              {/* User Details */}
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
                  {profession}
                </div>
              </div>

              {/* Message Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectUser(u);
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
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Inter', 'Geist', sans-serif",
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(139, 92, 246, 0.32)'
                    : '#EDE9FE';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(139, 92, 246, 0.18)'
                    : '#F5F3FF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Send size={12} strokeWidth={2.2} />
                <span>Message</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
