import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const getSocialLinks = (user, C) => {
  if (!user) return [];
  const formatUrl = (platform, val) => {
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    const clean = val.replace(/^@/, '');
    if (platform === 'website') return `https://${val}`;
    if (platform === 'github') return `https://github.com/${clean}`;
    if (platform === 'linkedin') return `https://linkedin.com/in/${clean}`;
    if (platform === 'twitter') return `https://twitter.com/${clean}`;
    if (platform === 'instagram') return `https://instagram.com/${clean}`;
    if (platform === 'youtube') return val.startsWith('@') ? `https://youtube.com/${val}` : `https://youtube.com/c/${clean}`;
    return val;
  };

  const getLabel = (platform, val) => {
    if (!val) return '';
    const clean = val.replace(/^https?:\/\/(www\.)?/, '');
    if (platform === 'website') return clean;
    if (platform === 'github') return `github.com/${val.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/^@/, '')}`;
    if (platform === 'linkedin') return `linkedin.com/in/${val.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/^@/, '')}`;
    if (platform === 'twitter') return `twitter.com/${val.replace(/^https?:\/\/(www\.)?twitter\.com\//, '').replace(/^@/, '')}`;
    if (platform === 'instagram') return `instagram.com/${val.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '')}`;
    if (platform === 'youtube') return `youtube.com/${val.replace(/^https?:\/\/(www\.)?youtube\.com\/(c\/)?/, '')}`;
    return clean;
  };

  return [
    user.website_url && { icon: "🌐", label: getLabel('website', user.website_url), color: C.blue, url: formatUrl('website', user.website_url) },
    user.github_username && { icon: "🐙", label: getLabel('github', user.github_username), color: C.textSec, url: formatUrl('github', user.github_username) },
    user.social_links?.linkedin && { icon: "💼", label: getLabel('linkedin', user.social_links.linkedin), color: C.blue, url: formatUrl('linkedin', user.social_links.linkedin) },
    user.social_links?.twitter && { icon: "🐦", label: getLabel('twitter', user.social_links.twitter), color: C.blue, url: formatUrl('twitter', user.social_links.twitter) },
    user.social_links?.youtube && { icon: "📺", label: getLabel('youtube', user.social_links.youtube), color: C.orange, url: formatUrl('youtube', user.social_links.youtube) },
    user.social_links?.instagram && { icon: "📸", label: getLabel('instagram', user.social_links.instagram), color: C.orange, url: formatUrl('instagram', user.social_links.instagram) },
  ].filter(Boolean);
};

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const step = Math.max(1, end / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display >= 1000 ? (display / 1000).toFixed(1) + "k" : display}</span>;
}

function SkillPill({ skill, delay, isDark }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 24,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        background: hovered ? "rgba(122,0,255,0.22)" : "rgba(122,0,255,0.08)",
        border: `1px solid ${hovered ? "rgba(122,0,255,0.7)" : "rgba(122,0,255,0.25)"}`,
        color: hovered ? "#fff" : "#C4B5FD",
        margin: "4px",
        cursor: "default",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 16px rgba(122,0,255,0.3)" : "none",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {skill.name}
    </span>
  );
}

// ── Content Card — renders differently per type ────────────────────────────
function ContentCard({ post, isDark, C, onClick, grid = false }) {
  const [hovered, setHovered] = useState(false);
  const type = post.type || "post";
  const isVideo = type === "video";
  const isShort = type === "short";
  const isArticle = type === "article" || type === "tutorial";

  // Short: tall 9:16 card
  if (isShort) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 14, overflow: "hidden",
          border: `1px solid ${hovered ? C.purple + "66" : C.border}`,
          position: "relative", aspectRatio: "9/16",
          background: post.gradient || (isDark ? "#111827" : "#F1F5F9"),
          backgroundImage: post.thumbnail_url ? `url(${post.thumbnail_url})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
          cursor: "pointer",
          transform: hovered ? "translateY(-4px)" : "none",
          boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.2)" : "none",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          width: grid ? "100%" : "180px",
          flexShrink: grid ? undefined : 0,
        }}
      >
        {/* Type badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          padding: "4px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, color: "#fff",
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          📱 SHORT
        </div>
        {/* Bottom info */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          padding: "32px 12px 12px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 6 }}>
            {post.title.length > 40 ? post.title.slice(0, 40) + "…" : post.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>👏 {post.clap_count || 0}</span>
            <span>👁 {post.view_count || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Video: wide 16:9 card
  if (isVideo) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 14, overflow: "hidden",
          border: `1px solid ${hovered ? C.purple + "66" : C.border}`,
          background: C.surface,
          cursor: "pointer",
          transform: hovered ? "translateY(-4px)" : "none",
          boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.15)" : "none",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          width: grid ? "100%" : "280px",
          flexShrink: grid ? undefined : 0,
        }}
      >
        {/* Thumbnail */}
        <div style={{
          aspectRatio: "16/9", position: "relative",
          background: post.gradient || (isDark ? "#111827" : "#F1F5F9"),
          backgroundImage: post.thumbnail_url ? `url(${post.thumbnail_url})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
          {/* Play icon */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#fff",
              opacity: hovered ? 1 : 0.8,
              transition: "opacity 0.2s",
            }}>▶</div>
          </div>
          {/* Duration badge */}
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,0.75)", padding: "2px 8px", borderRadius: 4,
            fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: "'JetBrains Mono', monospace",
          }}>VIDEO</div>
        </div>
        {/* Info */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4, marginBottom: 6 }}>
            {post.title.length > 60 ? post.title.slice(0, 60) + "…" : post.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
            <span>👏 {post.clap_count || 0}</span>
            <span>👁 {post.view_count || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Article: horizontal card with premium glassmorphism styling
  if (isArticle) {
    const readTime = Math.max(2, Math.ceil(post.title.split(' ').length / 3)) + " min read";
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 16, overflow: "hidden",
          border: `1px solid ${hovered ? "rgba(122, 0, 255, 0.45)" : isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
          background: isDark 
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)" 
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex", cursor: "pointer",
          transform: hovered ? "translateY(-4px)" : "none",
          boxShadow: hovered 
            ? "0 12px 30px rgba(122, 0, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)" 
            : "0 4px 20px rgba(0, 0, 0, 0.02)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: grid ? "100%" : "360px",
          flexShrink: grid ? undefined : 0,
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 130, position: "relative", flexShrink: 0,
          background: post.thumbnail_url ? `url(${post.thumbnail_url})` : (post.gradient || (isDark ? "#111827" : "#F1F5F9")),
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!post.thumbnail_url && (
            <span style={{ fontSize: 32, opacity: 0.2 }}>{post.icon || "📄"}</span>
          )}
          {/* Read time overlay */}
          <div style={{
            position: "absolute", bottom: 8, left: 8,
            background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)",
            padding: "3px 8px", borderRadius: 12,
            fontSize: 9, color: "#fff", fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {readTime}
          </div>
        </div>
        {/* Content Details */}
        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              color: C.purpleGlow, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.5, marginBottom: 6,
              display: "flex", alignItems: "center", gap: 4
            }}>
              <span>📝</span> {type === "tutorial" ? "TUTORIAL" : "ARTICLE"}
            </div>
            <div style={{ 
              fontSize: 13.5, fontWeight: 800, color: C.text, 
              lineHeight: 1.4, marginBottom: 8,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {post.title}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: C.textSec, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)", padding: "3px 8px", borderRadius: 12 }}>
              👏 {post.clap_count || 0}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              👁 {post.view_count || 0} views
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default post: square card
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14, overflow: "hidden",
        border: `1px solid ${hovered ? C.purple + "66" : C.border}`,
        position: "relative", aspectRatio: "1",
        background: post.thumbnail_url ? `url(${post.thumbnail_url})` : (post.gradient || (isDark ? "#111827" : "#F1F5F9")),
        backgroundSize: "cover", backgroundPosition: "center",
        cursor: "pointer",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.15)" : "none",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: grid ? "100%" : "220px",
        flexShrink: grid ? undefined : 0,
      }}
    >
      {!post.thumbnail_url && (
        <span style={{ fontSize: 40, opacity: 0.15 }}>{post.icon || "📝"}</span>
      )}
      <div style={{
        position: "absolute", top: 10, left: 10,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        padding: "4px 10px", borderRadius: 20,
        fontSize: 10, fontWeight: 700, color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        ◈ POST
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        padding: "32px 12px 12px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 6 }}>
          {post.title.length > 40 ? post.title.slice(0, 40) + "…" : post.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
          <span>👏 {post.clap_count || 0}</span>
          <span>👁 {post.view_count || 0}</span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function handlePostClick(navigate, p) {
  if (p.type === 'video') navigate(`/videos/${p.id || p.slug}`);
  else if (p.type === 'short') navigate(`/shorts/${p.id || p.slug}`);
  else if (p.type === 'article' || p.type === 'tutorial') navigate(`/articles/${p.slug}`);
  else navigate(`/posts/${p.slug}`);
}

function SectionHeading({ label, C }) {
  return (
    <div style={{
      fontSize: 14, fontWeight: 800, color: C.text,
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 14,
    }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: C.purple }} />
      {label}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function DesktopProfile({
  user,
  posts,
  userEducation,
  userCerts,
  userSkills,
  userPosts,
  userActivity,
  resolvedTheme,
  isDark,
  C,
  activeTab,
  setActiveTab,
  contentFilter,
  setContentFilter,
  isFollowing,
  onFollowToggle,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [followLoading, setFollowLoading] = useState(false);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});
  const TABS = ["Home", "Projects", "Education", "Certifications", "About", "Content"];

  const isOwnProfile = currentUser && currentUser.username && user.username
    && currentUser.username.toLowerCase() === user.username.toLowerCase();

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  // Categorize posts
  const videoPosts = userPosts.filter(p => p.type === "video");
  const shortPosts = userPosts.filter(p => p.type === "short");
  const articlePosts = userPosts.filter(p => p.type === "article" || p.type === "tutorial");
  const otherPosts = userPosts.filter(p => !["video", "short", "article", "tutorial"].includes(p.type));
  const recentPostsList = [...articlePosts, ...otherPosts];

  const filteredContent = userPosts.filter(p =>
    contentFilter === "All" ||
    (contentFilter === "Videos" && p.type === "video") ||
    (contentFilter === "Shorts" && p.type === "short") ||
    (contentFilter === "Articles" && (p.type === "article" || p.type === "tutorial"))
  );

  return (
    <div style={{
      maxWidth: "100%",
      width: "100%",
      margin: "0 auto",
      boxSizing: "border-box",
      position: "relative",
      padding: "0 8px",
    }}>
      <style>{`
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 20px;
          align-items: start;
        }
        .profile-sidebar {
          position: sticky;
          top: 72px;
        }
        /* Wide desktop: full sidebar */
        @media (min-width: 1200px) {
          .profile-layout-grid {
            grid-template-columns: 280px 1fr;
            gap: 24px;
          }
        }
        /* Small desktop: compact sidebar */
        @media (min-width: 900px) and (max-width: 1099px) {
          .profile-layout-grid {
            grid-template-columns: 240px 1fr;
            gap: 16px;
          }
        }
        .cert-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .cert-card:hover { transform: translateY(-4px); }
        .project-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .project-card:hover { transform: translateY(-5px); box-shadow: 0 24px 64px rgba(0,0,0,0.4); }
        .action-btn {
          border: none; cursor: pointer;
          font-family: 'Manrope', sans-serif;
          font-weight: 700; font-size: 13px;
          border-radius: 10px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn:active { transform: scale(0.96); }
      `}</style>

      <div className="profile-layout-grid">
        {/* LEFT COLUMN: Sidebar (Identity, Skills, Connect) */}
        <div className="profile-sidebar">
          {/* Identity Info Card */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "24px 20px",
            position: "relative",
          }}>
            {/* Avatar Row */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-80px", marginBottom: "20px" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 104, height: 104,
                  borderRadius: 24,
                  background: "linear-gradient(135deg, #7A00FF, #0EA5E9, #A855F7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 900,
                  border: `4px solid ${C.bg}`,
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", /* subtle lift */
                }}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px" }} loading="lazy" decoding="async" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 26, height: 26, borderRadius: 8,
                  background: "linear-gradient(135deg, #7A00FF, #A855F7)",
                  border: `2px solid ${C.bg}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff",
                }}>✓</div>
              </div>

              {/* Edit Profile — only for own profile */}
              {isOwnProfile && (
                <button
                  className="action-btn"
                  onClick={() => navigate("/settings")}
                  style={{
                    background: "linear-gradient(135deg, #7A00FF, #6D28D9)",
                    color: "#fff",
                    padding: "8px 16px",
                    fontSize: 12,
                  }}
                >Edit Profile</button>
              )}

              {/* Follow + Message — only for other users' profiles */}
              {!isOwnProfile && currentUser && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="action-btn"
                    disabled={followLoading}
                    onClick={async () => {
                      setFollowLoading(true);
                      try { await onFollowToggle?.(); } finally { setFollowLoading(false); }
                    }}
                    style={{
                      background: isFollowing
                        ? isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'
                        : 'linear-gradient(135deg, #7A00FF, #6D28D9)',
                      color: isFollowing
                        ? isDark ? '#D1D5DB' : '#475569'
                        : '#fff',
                      padding: '8px 20px',
                      fontSize: 12,
                      border: isFollowing ? `1px solid ${C.border}` : 'none',
                      opacity: followLoading ? 0.6 : 1,
                    }}
                  >
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => navigate(`/network?dm=${user.username}`)}
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      color: isDark ? '#D1D5DB' : '#475569',
                      padding: '8px 16px',
                      fontSize: 12,
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* Name, Username & Bio — improved readability */}
            <div>
              <h1 style={{
                fontSize: 24, fontWeight: 900, letterSpacing: -0.5,
                color: C.text, margin: "0 0 4px 0",
                fontFamily: "'Manrope', sans-serif",
              }}>{user.name}</h1>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: C.purpleGlow, marginBottom: 10, fontWeight: 600,
              }}>
                @{user.username}
              </div>
              <p style={{
                fontSize: 14, color: C.textSec, lineHeight: 1.7,
                margin: "0 0 16px 0", fontWeight: 500,
              }}>
                {user.bio || "#Coder"}
              </p>
            </div>

            {/* Metadata (Location, Date, Type) — better readability */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              fontSize: 13, fontFamily: "'Manrope', sans-serif",
              color: isDark ? "#D1D5DB" : "#475569",
              fontWeight: 500,
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>📍</span> {user.location || "Planet Earth"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>📅</span> Joined {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>🏢</span> {user.account_type === 'professional' ? "Professional Account" : "Personal Account"}
              </span>
            </div>
          </div>

          {/* Skills Sidebar Block */}
          <div style={{ marginTop: 12 }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "14px 16px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: C.purple, letterSpacing: 2, marginBottom: 10,
              }}>
                // SKILLS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", margin: "-4px" }}>
                {userSkills.length > 0 ? userSkills.map((s, i) => <SkillPill key={s.name + i} skill={s} delay={i * 35} isDark={isDark} />) : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textMuted }}>No skills listed yet.</span>}
              </div>
            </div>
          </div>

          {/* Connect Sidebar Block */}
          <div style={{ marginTop: 12 }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "14px 16px",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: C.purple, letterSpacing: 2, marginBottom: 10,
              }}>
                // CONNECT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {getSocialLinks(user, C).map((link, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px",
                    background: C.surface2,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                    onClick={() => window.open(link.url, '_blank')}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <span style={{ fontSize: 14 }}>{link.icon}</span>
                    <span style={{
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      color: link.color, flex: 1,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>{link.label}</span>
                    <span style={{ color: C.textMuted, fontSize: 12 }}>↗</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats, Tabs, and Tab Contents */}
        <div style={{ marginTop: 24, minWidth: 0 }}>
          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "0 0 12px 0" }}>
            {[
              { label: "Posts", value: posts.length || 0, icon: "◈", color: "#7A00FF" },
              { label: "Followers", value: user.followers_count || 0, icon: "◎", color: "#38BDF8", path: `/u/${user.username}/followers` },
              { label: "Following", value: user.following_count || 0, icon: "⬡", color: "#A855F7", path: `/u/${user.username}/following` },
            ].map((stat) => (
              <div
                key={stat.label}
                onClick={() => stat.path && navigate(stat.path)}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 8px 12px",
                  textAlign: "center",
                  position: "relative", overflow: "hidden",
                  cursor: stat.path ? "pointer" : "default",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => {
                  if (stat.path) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = stat.color + "55";
                  }
                }}
                onMouseLeave={e => {
                  if (stat.path) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = C.border;
                  }
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`, opacity: 0.6 }} />
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: stat.color, lineHeight: 1.1, marginBottom: 4 }}>
                  <AnimatedNumber value={stat.value} />
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2, textTransform: "uppercase" }}>
                  {stat.label}
                </div>
              </div>
            ))}

          </div>

          {/* Sticky Tab Bar */}
          <div style={{
            position: "sticky", top: 64, zIndex: 100,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            background: isDark ? "rgba(11,15,20,0.92)" : "rgba(248,250,252,0.92)",
            borderBottom: `1px solid ${C.border}`,
            padding: "0 8px",
            display: "flex",
          }}>
            <div style={{ display: "flex", position: "relative", width: "100%" }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  ref={el => tabRefs.current[tab] = el}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "'Manrope', sans-serif", fontWeight: activeTab === tab ? 700 : 500,
                    fontSize: 13, padding: "14px 14px", whiteSpace: "nowrap",
                    color: activeTab === tab ? C.purpleGlow : C.textSec,
                    transition: "color 0.2s",
                  }}
                >{tab}</button>
              ))}
              <div style={{
                position: "absolute", bottom: 0, left: tabIndicator.left, width: tabIndicator.width, height: 2,
                background: `linear-gradient(90deg, ${C.purple}, #A855F7)`, borderRadius: 2,
                transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 0 8px rgba(122,0,255,0.6)",
              }} />
            </div>
          </div>

          {/* Tab Contents */}
          <div style={{ padding: "16px 0" }} key={activeTab}>

            {/* ══ HOME — LinkedIn-style: Recent Posts, Shorts, Education, Certs ══ */}
            {activeTab === "Home" && (
              <div style={{ animation: "fadeUp 0.35s ease both", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Recent Posts (only regular posts and articles) */}
                {recentPostsList.length > 0 && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <SectionHeading label="Recent Posts & Articles" C={C} />
                      <button
                        onClick={() => navigate(`/articel/by?user=${user.username}`)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.purpleGlow, fontWeight: 600 }}
                      >
                        View all ↗
                      </button>
                    </div>
                    {/* Horizontal scrolling row for Articles and Posts */}
                    <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                      {recentPostsList.slice(0, 6).map((post, i) => (
                        <ContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos & Shorts (Merged Section) */}
                {(videoPosts.length > 0 || shortPosts.length > 0) && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <SectionHeading label="Videos & Shorts" C={C} />
                      <button
                        onClick={() => navigate(`/video/by?user=${user.username}`)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.purpleGlow, fontWeight: 600 }}
                      >
                        View all ↗
                      </button>
                    </div>

                    {/* Long Videos Grid - desktop shows up to 4 */}
                    {videoPosts.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                        {videoPosts.slice(0, 4).map((post, i) => (
                          <ContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                        ))}
                      </div>
                    )}

                    {/* Shorts Carousel - up to 10 items */}
                    {shortPosts.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SHORTS</div>
                        <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                          {shortPosts.slice(0, 24).map((post, i) => (
                            <div key={post.id || i} style={{ flex: "0 0 130px" }}>
                              <ContentCard post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Education — inline like LinkedIn */}
                {userEducation.length > 0 && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                    <SectionHeading label="Education" C={C} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {userEducation.map((edu, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "12px 0",
                          borderBottom: i < userEducation.length - 1 ? `1px solid ${C.border}` : "none",
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: (edu.color || C.blue) + "15",
                            border: `1px solid ${edu.color || C.blue}33`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, flexShrink: 0,
                          }}>
                            {edu.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{edu.degree}</div>
                            <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{edu.school}</div>
                            {edu.period && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{edu.period}</div>}
                          </div>
                          <div style={{
                            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                            color: edu.status === "Pursuing" ? C.green : C.textMuted,
                            fontWeight: 600, padding: "4px 10px",
                            background: edu.status === "Pursuing" ? (C.green + "15") : "transparent",
                            borderRadius: 20,
                          }}>
                            {edu.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications — inline like LinkedIn */}
                {userCerts.length > 0 && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                    <SectionHeading label="Certifications" C={C} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {userCerts.map((cert, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "12px 0",
                          borderBottom: i < userCerts.length - 1 ? `1px solid ${C.border}` : "none",
                          cursor: cert.url ? "pointer" : "default",
                        }}
                          onClick={() => cert.url && window.open(cert.url, '_blank')}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: (cert.color || C.purple) + "15",
                            border: `1px solid ${cert.color || C.purple}33`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, flexShrink: 0,
                          }}>
                            {cert.badge || "📜"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{cert.title}</div>
                            <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>{cert.issuer}</div>
                            {cert.date && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{cert.date}</div>}
                          </div>
                          {cert.url && <span style={{ color: C.textMuted, fontSize: 14 }}>↗</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PROJECTS ══ */}
            {activeTab === "Projects" && (
              <div style={{ animation: "fadeUp 0.35s ease both" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {userPosts.map((p, i) => (
                    <div key={p.id || i} className="project-card" onClick={() => handlePostClick(navigate, p)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${p.color}, ${p.color}44)` }} />
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color + "1A", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: p.color }}>
                            {p.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{p.title}</div>
                            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: p.color, fontWeight: 600, marginTop: 2 }}>
                              ● {(p.type || "post").toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ EDUCATION ══ */}
            {activeTab === "Education" && (
              <div style={{ animation: "fadeUp 0.35s ease both" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {userEducation.map((edu, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${edu.color}, ${edu.color}44)` }} />
                      <div style={{ padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: (edu.color || C.blue) + "18", border: `1px solid ${edu.color || C.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                            {edu.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{edu.degree}</div>
                            <div style={{ fontSize: 13, color: edu.color || C.blue, marginTop: 4, fontWeight: 600 }}>{edu.school}</div>
                            {edu.period && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{edu.period}</div>}
                            {edu.specialization && <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{edu.specialization}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ CERTIFICATIONS ══ */}
            {activeTab === "Certifications" && (
              <div style={{ animation: "fadeUp 0.35s ease both" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {userCerts.map((cert, i) => (
                    <div key={i} className="cert-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "stretch" }}>
                        <div style={{ width: 60, background: (cert.color || C.purple) + "18", borderRight: `1px solid ${cert.color || C.purple}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "14px 0" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: (cert.color || C.purple) + "22", border: `2px solid ${cert.color || C.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                            {cert.badge || "📄"}
                          </div>
                        </div>
                        <div style={{ flex: 1, padding: "14px 16px" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>{cert.title}</div>
                          <div style={{ fontSize: 12, color: cert.color || C.purple, fontWeight: 600 }}>{cert.issuer}</div>
                          {cert.date && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{cert.date}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ABOUT ══ */}
            {activeTab === "About" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.35s ease both" }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                  <SectionHeading label="Bio" C={C} />
                  <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.8, margin: 0 }}>{user.bio || "No bio provided."}</p>
                </div>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                  <SectionHeading label="Connect" C={C} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
                    {getSocialLinks(user, C).map((link, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        background: C.surface2,
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                        onClick={() => window.open(link.url, '_blank')}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                      >
                        <span style={{ fontSize: 16 }}>{link.icon}</span>
                        <span style={{
                          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                          color: link.color, flex: 1,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>{link.label}</span>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>↗</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ CONTENT — Type-specific card layouts ══ */}
            {activeTab === "Content" && (
              <div style={{ animation: "fadeUp 0.35s ease both" }}>
                {/* Filter bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  {["All", "Videos", "Shorts", "Articles"].map(f => (
                    <button
                      key={f}
                      onClick={() => setContentFilter(f)}
                      style={{
                        background: contentFilter === f ? C.purple : "transparent",
                        border: `1px solid ${contentFilter === f ? C.purple : C.border}`,
                        color: contentFilter === f ? "#fff" : C.textSec,
                        padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      {f}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.purple, letterSpacing: 1 }}>
                    {filteredContent.length} ITEMS
                  </div>
                </div>
                {/* Articles — horizontal scrolling cards with View All */}
                {(contentFilter === "All" || contentFilter === "Articles") && articlePosts.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>ARTICLES</div>
                      <button
                        onClick={() => {
                          setContentFilter("Articles");
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.purpleGlow, fontWeight: 600 }}
                      >
                        View all ↗
                      </button>
                    </div>
                    <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                      {articlePosts.map((post, i) => (
                        <ContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos & Shorts (Merged Section) with View All */}
                {(contentFilter === "All" || contentFilter === "Videos" || contentFilter === "Shorts") && (videoPosts.length > 0 || shortPosts.length > 0) && (
                  <div style={{ marginBottom: 24, padding: "18px 20px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>VIDEOS & SHORTS</div>
                      <button
                        onClick={() => {
                          setContentFilter("Videos");
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.purpleGlow, fontWeight: 600 }}
                      >
                        View all ↗
                      </button>
                    </div>

                    {/* Long Videos Grid - shows up to 36 items inside Content tab */}
                    {(contentFilter === "All" || contentFilter === "Videos") && videoPosts.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
                        {videoPosts.slice(0, 36).map((post, i) => (
                          <ContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                        ))}
                      </div>
                    )}

                    {/* Shorts Row - horizontal scroll up to 40 items */}
                    {(contentFilter === "All" || contentFilter === "Shorts") && shortPosts.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SHORTS</div>
                        <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                          {shortPosts.slice(0, 40).map((post, i) => (
                            <div key={post.id || i} style={{ flex: "0 0 130px" }}>
                              <ContentCard post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Other posts — square grid */}
                {(contentFilter === "All") && otherPosts.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>POSTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      {otherPosts.map((post, i) => (
                        <ContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
