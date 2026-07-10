import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LazyImage from '../common/LazyImage';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    text: base.txt,
    sub: base.txt2,
    muted: base.txt3,
    purple: base.accent,
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    bg: isDark ? D.card : L.surface,
    bgHov: isDark ? D.cardHover : '#F5F5FA',
    shadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)',
  };
}

export function TopProfileCard({ profile, onAuthRequired }) {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false); // Can check initial status if available
  const [followers, setFollowers] = useState(profile.followers_count || 0);

  if (!profile) return null;

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (onAuthRequired) onAuthRequired('like');
      else navigate('/login');
      return;
    }
    // Optimistic toggle
    const prevState = isFollowing;
    setIsFollowing(!prevState);
    setFollowers(f => f + (prevState ? -1 : 1));

    try {
      await api.post(`/users/${profile.id}/follow`);
    } catch (err) {
      // Revert on fail
      setIsFollowing(prevState);
      setFollowers(profile.followers_count || 0);
    }
  };

  return (
    <div
      onClick={() => navigate(`/u/${profile.username}`)}
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: t.shadow,
        marginBottom: 24,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = t.purple + '44'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
    >
      {/* Banner Area */}
      <div style={{
        height: 90,
        background: `linear-gradient(135deg, ${t.purple}44 0%, rgba(0,209,255,0.2) 100%)`,
        position: 'relative'
      }}>
        <span style={{
          position: 'absolute', right: 16, top: 12,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 8, padding: '3px 9px',
          fontSize: 9, fontWeight: 800,
          color: t.purple, letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono',monospace",
          border: `1px solid ${t.purple}44`
        }}>TOP MATCH</span>
      </div>

      {/* Profile Body */}
      <div style={{ padding: '0 24px 24px', marginTop: -40, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: 12, flexShrink: 0 }}>
          <LazyImage
            src={profile.avatar_url}
            alt={profile.name}
            responsive={true}
            sizes="80px"
            fallbackIcon={(profile.name || profile.username || 'U')[0].toUpperCase()}
            fallbackBackground={t.purple}
            skeletonColor={t.purple + '20'}
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              border: `4px solid ${t.bg}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              objectFit: 'cover',
              background: t.bg
            }}
          />
        </div>

        {/* Info */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text, fontFamily: "'Syne',sans-serif", margin: 0 }}>{profile.name}</h2>
              {profile.is_verified && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" fill={t.purple} />
                  <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ fontSize: 13, color: t.purple, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>@{profile.username}</div>
            
            {profile.bio && (
              <p style={{ fontSize: 14, color: t.sub, fontFamily: "'Inter',sans-serif", lineHeight: 1.5, margin: '0 0 16px 0', maxWidth: 680 }}>
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: t.muted }}>
              <span><strong>{followers}</strong> followers</span>
              <span>•</span>
              <span><strong>{profile.post_count || 0}</strong> resources</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, alignSelf: 'center' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => navigate(`/u/${profile.username}`)}
              style={{
                background: t.purple,
                color: '#fff',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Outfit',sans-serif",
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                boxShadow: `0 4px 14px ${t.purple}44`
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 0.9; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 1; }}
            >
              View Profile
            </button>
            <button
              onClick={handleFollow}
              style={{
                background: 'transparent',
                color: isFollowing ? t.text : t.purple,
                border: `1.5px solid ${isFollowing ? t.border : t.purple}88`,
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Outfit',sans-serif",
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${t.purple}11`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PeopleCard({ person, onAuthRequired, style = {} }) {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(person.followers_count || 0);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (onAuthRequired) onAuthRequired('like');
      else navigate('/login');
      return;
    }
    const prevState = isFollowing;
    setIsFollowing(!prevState);
    setFollowers(f => f + (prevState ? -1 : 1));

    try {
      await api.post(`/users/${person.id}/follow`);
    } catch (err) {
      setIsFollowing(prevState);
      setFollowers(person.followers_count || 0);
    }
  };

  // Heuristic for role
  let roleTitle = 'Student';
  const bioLower = (person.bio || '').toLowerCase();
  if (bioLower.includes('instructor') || bioLower.includes('educator') || bioLower.includes('teacher') || bioLower.includes('faculty') || person.username === 'cpaadmin') {
    roleTitle = 'Instructor';
  } else if (bioLower.includes('mentor') || bioLower.includes('coach') || bioLower.includes('expert')) {
    roleTitle = 'Mentor';
  } else if (bioLower.includes('student') || bioLower.includes('learner') || bioLower.includes('studying')) {
    roleTitle = 'Student';
  } else if (person.account_type === 'professional') {
    roleTitle = 'Instructor';
  }

  // Icon for role
  let roleIcon = 'menu_book'; // Student
  if (roleTitle === 'Instructor') roleIcon = 'workspace_premium';
  else if (roleTitle === 'Mentor') roleIcon = 'explore';

  // Tech interests / skills tag
  let skillsText = 'Software Eng';
  if (Array.isArray(person.tech_interests) && person.tech_interests.length > 0) {
    skillsText = person.tech_interests.slice(0, 3).join(' • ');
  } else if (typeof person.tech_interests === 'string' && person.tech_interests.trim().length > 0) {
    skillsText = person.tech_interests;
  }

  // Dynamic border gradient based on name/username
  const getBorderGrad = (username = '') => {
    const grads = [
      'linear-gradient(135deg, #7c3aed, #ec4899)', // Purple-Pink
      'linear-gradient(135deg, #94a3b8, #cbd5e1)', // Silver/Slate
      'linear-gradient(135deg, #64748b, #94a3b8)', // Slate/Silver
      'linear-gradient(135deg, #06b6d4, #ec4899)', // Teal-Pink
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return grads[Math.abs(hash) % grads.length];
  };

  const borderGrad = getBorderGrad(person.username || person.name);
  const isVerified = person.account_type === 'professional' || person.is_verified || person.username === 'cpaadmin';

  return (
    <div
      onClick={() => navigate(`/u/${person.username}`)}
      className="people-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 20px',
        borderRadius: 24,
        cursor: 'pointer',
        background: `linear-gradient(${t.bg}, ${t.bg}) padding-box, ${borderGrad} border-box`,
        border: '1.5px solid transparent',
        boxShadow: t.isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(124,58,237,0.06)',
        transition: 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s ease',
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        if (!t.isDark) e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = t.isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(124,58,237,0.06)';
      }}
    >
      <style>{`
        .people-card {
          width: 210px;
          height: 380px;
          flex-shrink: 0;
        }
        .people-card-bio {
          font-size: 12px;
          color: var(--txt2);
          text-align: center;
          margin-top: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        @media (max-width: 768px) {
          .people-card {
            width: 155px;
            height: 290px;
            padding: 16px 10px 14px !important;
          }
          .people-card-bio {
            display: none !important;
          }
          .people-card-avatar {
            width: 68px !important;
            height: 68px !important;
          }
          .people-card-name {
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* Role Icon (Top Right) */}
      <span
        className="material-symbols-rounded"
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          fontSize: 18,
          color: t.muted,
          opacity: 0.8
        }}
      >
        {roleIcon}
      </span>

      {/* Circular Avatar */}
      <div className="people-card-avatar" style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <LazyImage
          src={person.avatar_url}
          alt={person.name}
          responsive={true}
          sizes="88px"
          fallbackIcon={(person.name || person.username || 'U')[0].toUpperCase()}
          fallbackBackground={t.purple}
          skeletonColor={t.purple + '15'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Name and Verification Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 16, maxWidth: '100%' }}>
        <span
          className="people-card-name"
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: t.text,
            fontFamily: "'Outfit', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {person.name}
        </span>
        {isVerified && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="#3B82F6" />
            <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Role Pill */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 600,
          color: t.sub,
          background: t.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
          border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
          padding: '3px 10px',
          borderRadius: 8,
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {roleTitle}
      </div>

      {/* Skills / Interests Pill */}
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          fontWeight: 500,
          color: t.muted,
          background: t.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
          border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
          padding: '3px 8px',
          borderRadius: 6,
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {skillsText}
      </div>

      {/* Biography Description (desktop only) */}
      <p className="people-card-bio">
        {person.bio}
      </p>

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        style={{
          marginTop: 'auto',
          width: '100%',
          padding: '10px 16px',
          background: isFollowing ? 'transparent' : t.purple,
          color: isFollowing ? t.text : '#fff',
          border: isFollowing ? `1.5px solid ${t.border}` : 'none',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isFollowing ? 'none' : `0 4px 14px ${t.purple}30`
        }}
        onMouseEnter={e => {
          if (!isFollowing) {
            e.currentTarget.style.opacity = 0.9;
            e.currentTarget.style.transform = 'scale(1.02)';
          } else {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }
        }}
        onMouseLeave={e => {
          if (!isFollowing) {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.transform = 'none';
          } else {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
