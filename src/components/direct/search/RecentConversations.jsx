import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatTimeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function RecentConversations({
  conversations = [],
  onSelectConv,
  onSeeAll,
  isDark = false,
}) {
  const navigate = useNavigate();

  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recent-conversations-heading"
      style={{
        width: '100%',
        background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
        borderRadius: '20px',
        padding: '16px 16px 8px',
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
          marginBottom: '12px',
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
            <Clock size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2
              id="recent-conversations-heading"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.2px',
                fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
              }}
            >
              Recent conversations
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: '12px',
                color: isDark ? '#94A3B8' : '#64748B',
                fontFamily: "'Inter', 'Geist', sans-serif",
              }}
            >
              Message people you've recently chatted with
            </p>
          </div>
        </div>

        {onSeeAll && conversations.length > 3 && (
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

      {/* Conversation Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {conversations.map((conv) => {
          const name = conv.other_name || conv.other_username || 'User';
          const username = conv.other_username || '';
          const avatar = conv.other_avatar || null;
          const isOnline = Boolean(conv.other_is_active);
          const time = formatTimeAgo(conv.last_message_at || conv.updated_at);
          const preview = conv.last_message || 'Start a conversation';

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id, username)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectConv(conv.id, username);
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
                position: 'relative',
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
              {/* Avatar with presence badge */}
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
                      background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
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

              {/* Text Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    lineHeight: 1.2,
                  }}
                >
                  <span
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
                    }}
                  >
                    {name}
                  </span>
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
                    fontSize: '12.5px',
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontFamily: "'Inter', 'Geist', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {preview}
                </div>
              </div>

              {/* Right: Time + Chevron */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                {time && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: isDark ? '#64748B' : '#94A3B8',
                      fontFamily: "'Inter', 'Geist', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {time}
                  </span>
                )}
                <ChevronRight
                  size={16}
                  color={isDark ? '#64748B' : '#94A3B8'}
                  strokeWidth={2}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
