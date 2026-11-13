import { MapPin, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

const initials = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'FG';
  const parts = text.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return text.slice(0, 2).toUpperCase();
};

export default function ProfilePreviewCard({ user }) {
  const name = user?.name?.trim() || 'Your Name';
  const rawUsername = (user?.username || '').trim().replace(/^@/, '');
  const username = rawUsername ? `@${rawUsername}` : '@username';
  const bio = user?.bio?.trim() || 'Tell developers what you are building, exploring, or learning...';
  const avatar = user?.avatar_url || null;
  const banner = user?.banner_url || null;
  const accountType = user?.account_type || 'personal';
  const subtype = user?.professional_subtype || null;
  const interests = Array.isArray(user?.interests) ? user.interests : [];
  const interestsCount = interests.length;

  return (
    <aside className="preview-card" aria-label="Live profile card preview">
      <div className="preview-card-header-bar">
        <span className="preview-card-dot preview-card-dot-red" />
        <span className="preview-card-dot preview-card-dot-yellow" />
        <span className="preview-card-dot preview-card-dot-green" />
        <span className="preview-card-title-text">Live Preview</span>
      </div>

      <div
        className="preview-banner"
        role="img"
        aria-label="Profile banner preview"
        style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!banner && <div className="preview-banner-fallback" aria-hidden="true" />}
      </div>

      <div className="preview-body">
        <div className="preview-avatar-row">
          <div className="preview-avatar" aria-hidden="true">
            {avatar ? (
              <img src={avatar} alt="" className="preview-avatar-img" />
            ) : (
              <span className="preview-avatar-initials">{initials(name)}</span>
            )}
          </div>

          <div className="preview-meta">
            <div className="preview-name-row">
              <strong className="preview-display-name">{name}</strong>
              <CheckCircle2 size={14} className="preview-verified-icon" aria-label="Verified creator" />
              <span className={`preview-badge ${accountType}`}>
                {accountType === 'professional' ? (subtype ? `Pro • ${subtype}` : 'Professional') : 'Personal'}
              </span>
            </div>
            <div className="preview-subtitle">{username}</div>
          </div>
        </div>

        <p className="preview-bio">{bio}</p>

        {/* Selected Interests Pill Previews */}
        {interests.length > 0 && (
          <div className="preview-interests-row" aria-label="Selected interests preview">
            {interests.slice(0, 5).map((item) => {
              const label = typeof item === 'string' ? item : (item.label || item.slug);
              return (
                <span key={typeof item === 'string' ? item : item.slug} className="preview-interest-tag">
                  #{label}
                </span>
              );
            })}
            {interests.length > 5 && (
              <span className="preview-interest-tag preview-interest-more">
                +{interests.length - 5} more
              </span>
            )}
          </div>
        )}

        <div className="preview-stats">
          <span><Sparkles size={12} /> {interestsCount} {interestsCount === 1 ? 'interest' : 'interests'}</span>
          <span><Shield size={12} /> {accountType}</span>
          <span><MapPin size={12} /> focusgram.io</span>
        </div>
      </div>
    </aside>
  );
}
