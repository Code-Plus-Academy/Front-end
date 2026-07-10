import { MapPin, Shield, Sparkles } from 'lucide-react';

const initials = (value) => String(value || 'CPA').trim().slice(0, 2).toUpperCase();

export default function ProfilePreviewCard({ user }) {
  const name = user?.name || 'Your name';
  const username = user?.username ? `@${user.username}` : '@username';
  const bio = user?.bio?.trim() || 'Tell people what you are building.';
  const avatar = user?.avatar_url || null;
  const banner = user?.banner_url || null;
  const accountType = user?.account_type || 'personal';
  const subtype = user?.professional_subtype || null;
  const interestsCount = user?.interests?.length || 0;

  return (
    <aside className="preview-card">
      <div className="preview-banner" style={banner ? { backgroundImage: `url(${banner})` } : undefined}>
        {!banner && <div className="preview-banner-fallback" />}
      </div>
      <div className="preview-body">
        <div className="preview-avatar-row">
          <div className="preview-avatar" aria-hidden="true">
            {avatar ? <img src={avatar} alt="" /> : <span>{initials(name)}</span>}
          </div>
          <div className="preview-meta">
            <div className="preview-name-row">
              <strong>{name}</strong>
              <span className={`preview-badge ${accountType}`}>{accountType}</span>
            </div>
            <div className="preview-subtitle">{username}</div>
            {accountType === 'professional' && subtype && <div className="preview-subtitle">{subtype}</div>}
          </div>
        </div>

        <p className="preview-bio">{bio}</p>

        <div className="preview-stats">
          <span><Sparkles size={12} /> {interestsCount} interests</span>
          <span><Shield size={12} /> onboarding</span>
          <span><MapPin size={12} /> codeplusacademy.in</span>
        </div>
      </div>
    </aside>
  );
}

