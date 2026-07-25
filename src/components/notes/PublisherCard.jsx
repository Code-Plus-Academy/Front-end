import React from 'react';
import Link from 'next/link';

export default function PublisherCard({ uploader }) {
  const isDeleted = uploader?.username === 'deleted_user' || uploader?.name === 'Deleted Contributor';
  const displayName = isDeleted ? 'CPA Contributor' : (uploader?.name || uploader?.username || 'CPA Admin');
  const avatarUrl = isDeleted 
    ? 'https://api.dicebear.com/7.x/bottts/svg?seed=cpa_contributor' 
    : (uploader?.avatar_url || 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1779995620/cpa/avatars/hyonbsm8ojekkds5fk9l.png');
  const username = isDeleted ? null : (uploader?.username || 'cpaadmin');
  const isVerified = uploader?.verified || uploader?.role === 'admin' || username === 'cpaadmin';

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
              {isVerified ? (
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

        {username && (
          <Link href={`/u/${username}`} className="btn-secondary" style={{ width: '100%', fontSize: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person</span>
            <span>View Creator Profile</span>
          </Link>
        )}
      </div>
    </>
  );
}
