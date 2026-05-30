'use client';
import Link from 'next/link';
import { useState } from 'react';
import Avatar from '../ui/Avatar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function DeveloperCard({ dev }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(dev.is_following || false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e) => {
    e.preventDefault();
    if (!user || loading) return;
    const was = following;
    setFollowing(!was);
    setLoading(true);
    try {
      if (was) await api.delete(`/users/${dev.username}/follow`);
      else await api.post(`/users/${dev.username}/follow`);
    } catch {
      setFollowing(was);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/u/${dev.username}?ref=explore`}>
      <div className="card" style={{ padding: 16, transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar src={dev.avatar_url} name={dev.username} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{dev.name}</span>
              {dev.account_type !== 'personal' && (
                <span style={{ fontSize: 9, background: 'var(--green-dim)', color: 'var(--green)', padding: '1px 5px', borderRadius: 'var(--r-full)', fontFamily: 'var(--font-mono)' }}>PRO</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>@{dev.username}</div>
            {dev.bio && <p style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dev.bio}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}>
              <span><strong style={{ color: 'var(--text)' }}>{dev.followers_count || 0}</strong> followers</span>
              <span><strong style={{ color: 'var(--text)' }}>{dev.post_count || 0}</strong> posts</span>
            </div>
          </div>
        </div>
        {user && user.username !== dev.username && (
          <button onClick={handleFollow} style={{
            width: '100%', marginTop: 12,
            padding: '7px',
            borderRadius: 'var(--r-md)',
            border: `1px solid ${following ? 'var(--border)' : 'var(--green)'}`,
            background: following ? 'transparent' : 'var(--green-dim)',
            color: following ? 'var(--sub)' : 'var(--green)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </Link>
  );
}
