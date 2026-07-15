import React from 'react';
import Link from 'next/link';

export default function PublisherCard({ uploader }) {
  const avatarUrl = uploader?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${uploader?.username || 'user'}`;
  const displayName = uploader?.name || uploader?.username || 'Contributor';

  return (
    <>
      <style>{`
        .pub-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          margin-bottom: 20px;
        }
        .pub-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .pub-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-bright);
        }
        .pub-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .pub-role {
          font-size: 11px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 1px;
        }
      `}</style>

      <div className="pub-card">
        <div className="pub-header">
          <img src={avatarUrl} alt={displayName} className="pub-avatar" />
          <div>
            <h4 className="pub-name">{displayName}</h4>
            <div className="pub-role">
              {uploader?.verified_contributor ? (
                <>
                  <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--green)' }}>verified</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>Verified Contributor</span>
                </>
              ) : (
                <span>CPA Contributor</span>
              )}
            </div>
          </div>
        </div>

        {uploader?.username && (
          <Link href={`/u/${uploader.username}`} className="btn-secondary" style={{ width: '100%', fontSize: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person</span>
            <span>View Creator Profile</span>
          </Link>
        )}
      </div>
    </>
  );
}
