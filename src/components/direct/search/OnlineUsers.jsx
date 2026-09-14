import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OnlineUsers({
  users = [],
  onSelectUser,
  onSeeAll,
  isDark = false,
}) {
  const navigate = useNavigate();

  // Filter only users with real active status (or if all have unknown presence, skip)
  const activeUsers = users.filter(u => Boolean(u.is_active || u.other_is_active));

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="online-users-heading"
      style={{
        width: '100%',
        background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
        borderRadius: '20px',
        padding: '16px 16px 14px',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.25)'
          : '0 4px 20px rgba(0, 0, 0, 0.03)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
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
              background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
          </div>
          <div>
            <h2
              id="online-users-heading"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.2px',
                fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
              }}
            >
              Online now
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: '12px',
                color: isDark ? '#94A3B8' : '#64748B',
                fontFamily: "'Inter', 'Geist', sans-serif",
              }}
            >
              People who are online and available to chat
            </p>
          </div>
        </div>

        {onSeeAll && activeUsers.length > 5 && (
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

      {/* Horizontally Scrollable Avatars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 2px 6px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {activeUsers.map((u) => {
          const username = u.username || u.other_username || '';
          const name = u.name || u.displayName || u.other_name || username;
          const firstName = name.split(' ')[0] || username;
          const avatar = u.avatar_url || u.avatarUrl || u.other_avatar || null;

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
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                width: '64px',
                textAlign: 'center',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Avatar + Green Indicator */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      background: isDark ? '#1E293B' : '#F1F5F9',
                      border: '2px solid transparent',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span
                  title="Online now"
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: `2.5px solid ${isDark ? '#0F172A' : '#FFFFFF'}`,
                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                  }}
                />
              </div>

              {/* First Name */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
                }}
              >
                {firstName}
              </span>

              {/* Username */}
              <span
                style={{
                  fontSize: '10.5px',
                  color: isDark ? '#94A3B8' : '#64748B',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  fontFamily: "'Inter', 'Geist', sans-serif",
                  marginTop: '1px',
                }}
              >
                @{username}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
