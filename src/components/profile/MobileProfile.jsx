import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileSnippets from "./ProfileSnippets";

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
    user.website_url && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ), 
      label: getLabel('website', user.website_url), 
      color: C.blue, 
      url: formatUrl('website', user.website_url) 
    },
    user.github_username && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      ), 
      label: getLabel('github', user.github_username), 
      color: C.textSec, 
      url: formatUrl('github', user.github_username) 
    },
    user.social_links?.linkedin && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      ), 
      label: getLabel('linkedin', user.social_links.linkedin), 
      color: C.blue, 
      url: formatUrl('linkedin', user.social_links.linkedin) 
    },
    user.social_links?.twitter && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
        </svg>
      ), 
      label: getLabel('twitter', user.social_links.twitter), 
      color: C.blue, 
      url: formatUrl('twitter', user.social_links.twitter) 
    },
    user.social_links?.youtube && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
        </svg>
      ), 
      label: getLabel('youtube', user.social_links.youtube), 
      color: C.orange, 
      url: formatUrl('youtube', user.social_links.youtube) 
    },
    user.social_links?.instagram && { 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      ), 
      label: getLabel('instagram', user.social_links.instagram), 
      color: C.orange, 
      url: formatUrl('instagram', user.social_links.instagram) 
    },
  ].filter(Boolean);
};

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
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

function SkillPill({ skill, isDark }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        background: "rgba(122,0,255,0.08)",
        border: "1px solid rgba(122,0,255,0.2)",
        color: "#C4B5FD",
        margin: "3px",
      }}
    >
      {skill.name}
    </span>
  );
}

// ── Content Card — type-specific layouts for mobile ─────────────────────────
function MobileContentCard({ post, isDark, C, onClick, grid = false }) {
  const type = post.type || "post";
  const isVideo = type === "video";
  const isShort = type === "short";
  const isArticle = type === "article" || type === "tutorial";
  const isResource = type === "resource";

  // Resource: study material cards
  if (isResource) {
    return (
      <div onClick={onClick} style={{
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.surface, cursor: "pointer",
        width: grid ? "100%" : "160px",
        flexShrink: grid ? undefined : 0,
      }}>
        <div style={{
          aspectRatio: "1.5", position: "relative",
          background: post.gradient || (isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.04)"),
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 10, borderBottom: `1px solid ${C.border}`
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 28, color: "var(--green)" }}>picture_as_pdf</span>
          <div style={{
            fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
            color: "var(--green)", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1, marginTop: 4,
          }}>
            STUDY MATERIAL
          </div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ 
            fontSize: 12, fontWeight: 700, color: C.text, 
            lineHeight: 1.3, marginBottom: 4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", textOverflow: "ellipsis", height: 32
          }}>
            {post.title}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 9, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
            <span>📥 {post.view_count || 0} downloads</span>
          </div>
        </div>
      </div>
    );
  }

  // Short: tall 9:16
  if (isShort) {
    return (
      <div onClick={onClick} style={{
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${C.border}`,
        position: "relative", aspectRatio: "9/16",
        background: post.gradient || (isDark ? "#111827" : "#F1F5F9"),
        backgroundImage: post.thumbnail_url ? `url(${post.thumbnail_url})` : "none",
        backgroundSize: "cover", backgroundPosition: "center",
        cursor: "pointer",
        width: grid ? "100%" : "120px",
        flexShrink: grid ? undefined : 0,
      }}>
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          padding: "3px 8px", borderRadius: 16,
          fontSize: 9, fontWeight: 700, color: "#fff",
          fontFamily: "'JetBrains Mono', monospace",
        }}>📱 SHORT</div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          padding: "24px 10px 10px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>
            {post.title.length > 30 ? post.title.slice(0, 30) + "…" : post.title}
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 9, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>👏 {post.clap_count || 0}</span>
            <span>👁 {post.view_count || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Video: 16:9 with info below
  if (isVideo) {
    return (
      <div onClick={onClick} style={{
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.surface, cursor: "pointer",
        width: grid ? "100%" : "220px",
        flexShrink: grid ? undefined : 0,
      }}>
        <div style={{
          aspectRatio: "16/9", position: "relative",
          background: post.gradient || (isDark ? "#111827" : "#F1F5F9"),
          backgroundImage: post.thumbnail_url ? `url(${post.thumbnail_url})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
            }}>▶</div>
          </div>
          <div style={{
            position: "absolute", bottom: 6, right: 6,
            background: "rgba(0,0,0,0.75)", padding: "2px 6px", borderRadius: 3,
            fontSize: 8, fontWeight: 600, color: "#fff", fontFamily: "'JetBrains Mono', monospace",
          }}>VIDEO</div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4 }}>
            {post.title.length > 50 ? post.title.slice(0, 50) + "…" : post.title}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
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
        style={{
          borderRadius: 14, overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
          background: isDark 
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)" 
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex", cursor: "pointer",
          width: grid ? "100%" : "280px",
          flexShrink: grid ? undefined : 0,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 100, position: "relative", flexShrink: 0,
          background: post.thumbnail_url ? `url(${post.thumbnail_url})` : (post.gradient || (isDark ? "#111827" : "#F1F5F9")),
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!post.thumbnail_url && (
            <span style={{ fontSize: 24, opacity: 0.2 }}>{post.icon || "📄"}</span>
          )}
          {/* Read time overlay */}
          <div style={{
            position: "absolute", bottom: 6, left: 6,
            background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)",
            padding: "2px 6px", borderRadius: 10,
            fontSize: 8, color: "#fff", fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {readTime}
          </div>
        </div>
        {/* Content Details */}
        <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: 8.5, fontFamily: "'JetBrains Mono', monospace",
              color: C.purpleGlow, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 4,
              display: "flex", alignItems: "center", gap: 3
            }}>
              <span>📝</span> {type === "tutorial" ? "TUTORIAL" : "ARTICLE"}
              {(() => {
                const s = (post?.moderation_status || post?.status || '').toLowerCase();
                if (s === 'under_review') return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1px 4px', borderRadius: 3, fontSize: 8, fontWeight: 700, marginLeft: 4 }}>UNDER REVIEW</span>;
                if (s === 'removed') return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 4px', borderRadius: 3, fontSize: 8, fontWeight: 700, marginLeft: 4 }}>REMOVED</span>;
                return null;
              })()}
            </div>
            <div style={{ 
              fontSize: 12, fontWeight: 800, color: C.text, 
              lineHeight: 1.3, marginBottom: 4,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {post.title}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9.5, color: C.textSec, fontFamily: "'JetBrains Mono', monospace" }}>
            <span>👏 {post.clap_count || 0}</span>
            <span>👁 {post.view_count || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default post: square
  return (
    <div onClick={onClick} style={{
      borderRadius: 12, overflow: "hidden",
      border: `1px solid ${C.border}`,
      position: "relative", aspectRatio: "1",
      background: post.thumbnail_url ? `url(${post.thumbnail_url})` : (post.gradient || (isDark ? "#111827" : "#F1F5F9")),
      backgroundSize: "cover", backgroundPosition: "center",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: grid ? "100%" : "160px",
      flexShrink: grid ? undefined : 0,
    }}>
      {!post.thumbnail_url && (
        <span style={{ fontSize: 32, opacity: 0.15 }}>{post.icon || "📝"}</span>
      )}
      <div style={{
        position: "absolute", top: 8, left: 8,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        padding: "3px 8px", borderRadius: 16,
        fontSize: 9, fontWeight: 700, color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
      }}>◈ POST</div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        padding: "24px 10px 10px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>
          {post.title.length > 30 ? post.title.slice(0, 30) + "…" : post.title}
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 9, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
          <span>👏 {post.clap_count || 0}</span>
          <span>👁 {post.view_count || 0}</span>
        </div>
      </div>
    </div>
  );
}

function handlePostClick(navigate, p) {
  if (p.type === 'video') navigate(`/videos/${p.id || p.slug}`);
  else if (p.type === 'short') navigate(`/shorts/${p.id || p.slug}`);
  else if (p.type === 'article' || p.type === 'tutorial') navigate(`/articles/${p.slug}`);
  else if (p.type === 'resource') window.location.href = `/notes/resource/${p.slug}`;
  else navigate(`/posts/${p.slug}`);
}

function SectionLabel({ label, C }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 800, color: C.text,
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 12,
    }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: C.purple }} />
      {label}
    </div>
  );
}

export default function MobileProfile({
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
  parseSkills,
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
  const TABS = ["Activity", "Content", "Projects", "Education", "Certifications", "About"];

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
  const notesPosts = userPosts.filter(p => p.type === "resource");
  const otherPosts = userPosts.filter(p => !["video", "short", "article", "tutorial", "resource"].includes(p.type));
  const recentPostsList = [...articlePosts, ...otherPosts, ...notesPosts];

  const filteredContent = userPosts.filter(p =>
    contentFilter === "All" ||
    (contentFilter === "Videos" && p.type === "video") ||
    (contentFilter === "Shorts" && p.type === "short") ||
    (contentFilter === "Articles" && (p.type === "article" || p.type === "tutorial")) ||
    (contentFilter === "Notes" && p.type === "resource")
  );

  return (
    <div style={{
      width: "100%",
      boxSizing: "border-box",
      position: "relative",
      paddingBottom: "120px", // clearance for floating bottom nav
    }}>
      <style>{`
        .cert-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .project-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .action-btn {
          border: none; cursor: pointer;
          font-family: 'Manrope', sans-serif;
          font-weight: 700; font-size: 12px;
          border-radius: 8px;
        }
        .mobile-shorts-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* PROFILE IDENTITY */}
      <div style={{
        padding: "0 16px",
        position: "relative",
        animation: "fadeUp 0.5s ease 0.1s both",
      }}>
        {/* Avatar Row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-48px", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 88, height: 88,
              borderRadius: 22,
              background: "linear-gradient(135deg, #7A00FF, #0EA5E9, #A855F7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 900,
              border: `3px solid ${C.bg}`,
              color: "#fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)", /* subtle lift */
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "19px" }} loading="lazy" decoding="async" />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div style={{
              position: "absolute", bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: 6,
              background: "linear-gradient(135deg, #7A00FF, #A855F7)",
              border: `1.5px solid ${C.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#fff",
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
                padding: "7px 14px",
                fontSize: 11,
              }}
            >Edit Profile</button>
          )}

          {/* Follow + Message — only for other users' profiles */}
          {!isOwnProfile && currentUser && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                  padding: '7px 16px',
                  fontSize: 11,
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
                  padding: '7px 14px',
                  fontSize: 11,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Message
              </button>
            </div>
          )}
        </div>

        {/* Name, Username & Bio — improved readability */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: C.text, margin: "0 0 3px 0" }}>{user.name}</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.purpleGlow, marginBottom: 8, fontWeight: 600 }}>
            @{user.username}
          </div>
          <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, margin: "0 0 12px 0", fontWeight: 500 }}>
            {user.bio || "#Coder"}
          </p>

          {/* Role chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(parseSkills(user.tech_interests).slice(0, 5)).map((skill, i) => (
              <span key={skill.name} style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                background: i === 0 ? "rgba(122,0,255,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
                border: `1px solid ${i === 0 ? "rgba(122,0,255,0.4)" : C.border}`,
                color: i === 0 ? C.purpleGlow : C.textSec,
              }}>{skill.name}</span>
            ))}
          </div>

          {/* Metadata — better readability */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "8px 14px",
            fontSize: 12, fontFamily: "'Manrope', sans-serif",
            color: isDark ? "#D1D5DB" : "#475569",
            fontWeight: 500, paddingBottom: 12,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: C.purple }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {user.location || "Planet Earth"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: C.purple }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: C.purple }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              {user.account_type === 'professional' ? "Professional" : "Personal"}
            </span>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div 
        className="profile-stats" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          width: "100%", 
          gap: "1rem", 
          padding: "0 16px",
          boxSizing: "border-box",
          animation: "fadeUp 0.5s ease 0.2s both" 
        }}
      >
        {[
          { label: "Posts", value: posts.length || 0, icon: "◈", color: "#7A00FF" },
          { label: "Followers", value: user.followers_count || 0, icon: "◎", color: "#38BDF8", path: `/u/${user.username}/followers` },
          { label: "Following", value: user.following_count || 0, icon: "⬡", color: "#A855F7", path: `/u/${user.username}/following` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            onClick={() => stat.path && navigate(stat.path)}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "12px 6px 10px",
              textAlign: "center",
              position: "relative", 
              overflow: "hidden",
              cursor: stat.path ? "pointer" : "default",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`, opacity: 0.6 }} />
            <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: stat.color, lineHeight: 1.1, marginBottom: 3 }}>
              <AnimatedNumber value={stat.value} />
            </div>
            <div style={{ fontSize: 8.5, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2, textTransform: "uppercase" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Snippets / Highlights */}
      <ProfileSnippets username={user.username} isOwnProfile={isOwnProfile} />

      {/* Sticky Tab Bar */}
      <div style={{
        position: "sticky", top: 4, zIndex: 100,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: isDark ? "rgba(11, 15, 20, 0.92)" : "rgba(248, 250, 252, 0.92)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.5)" : "0 8px 32px rgba(0, 0, 0, 0.05)",
        padding: "0 12px",
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
        marginTop: 12,
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", position: "relative" }}>
          {TABS.map(tab => (
            <button
              key={tab}
              ref={el => tabRefs.current[tab] = el}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Manrope', sans-serif", 
                fontWeight: activeTab === tab ? 800 : 500,
                fontSize: 12.5, padding: "12px 14px", whiteSpace: "nowrap",
                color: activeTab === tab ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#94a3b8" : "#64748b"),
                transition: "color 0.2s, font-weight 0.2s",
              }}
            >{tab}</button>
          ))}
          <div style={{
            position: "absolute", bottom: 0, left: tabIndicator.left, width: tabIndicator.width, height: 2,
            background: `linear-gradient(90deg, ${C.purple}, #A855F7)`, borderRadius: 2,
            transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 0 6px rgba(122,0,255,0.5)",
          }} />
        </div>
      </div>

      {/* Tab Contents */}
      <div style={{ padding: "14px 16px" }} key={activeTab}>

        {/* ══ ACTIVITY ══ */}
        {activeTab === "Activity" && (
          <div style={{ animation: "fadeUp 0.35s ease both", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Recent Posts & Articles (only regular posts and articles) */}
            {recentPostsList.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <SectionLabel label="Recent Posts & Articles" C={C} />
                  <button
                    onClick={() => setActiveTab("Content")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.purpleGlow, fontWeight: 600 }}
                  >
                    View all ↗
                  </button>
                </div>
                {/* Horizontal scrolling row for Articles and Posts */}
                <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                  {recentPostsList.slice(0, 4).map((post, i) => (
                    <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} />
                  ))}
                </div>
              </div>
            )}

            {/* Videos & Shorts (Merged Section) */}
            {(videoPosts.length > 0 || shortPosts.length > 0) && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <SectionLabel label="Videos & Shorts" C={C} />
                  <button
                    onClick={() => setActiveTab("Content")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.purpleGlow, fontWeight: 600 }}
                  >
                    View all ↗
                  </button>
                </div>

                {/* Long Videos Stack - mobile keeps just 1 video */}
                {videoPosts.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <MobileContentCard post={videoPosts[0]} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, videoPosts[0])} grid={true} />
                  </div>
                )}

                {/* Shorts Carousel - horizontal scroll */}
                {shortPosts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: C.textSec, fontWeight: 600, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SHORTS</div>
                    <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                      {shortPosts.slice(0, 16).map((post, i) => (
                        <div key={post.id || i} style={{ flex: "0 0 110px" }}>
                          <MobileContentCard post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Education */}
            {userEducation.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <SectionLabel label="Education" C={C} />
                {userEducation.map((edu, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, padding: "10px 0",
                    borderBottom: i < userEducation.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: (edu.color || C.blue) + "15",
                      border: `1px solid ${edu.color || C.blue}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>{edu.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{edu.degree}</div>
                      <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{edu.school}</div>
                      {edu.period && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{edu.period}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {userCerts.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <SectionLabel label="Certifications" C={C} />
                {userCerts.map((cert, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, padding: "10px 0",
                    borderBottom: i < userCerts.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: cert.url ? "pointer" : "default",
                  }} onClick={() => cert.url && window.open(cert.url, '_blank')}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: (cert.color || C.purple) + "15",
                      border: `1px solid ${cert.color || C.purple}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>{cert.badge || "📜"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cert.title}</div>
                      <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{cert.issuer}</div>
                      {cert.date && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{cert.date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <SectionLabel label="Skills" C={C} />
              <div style={{ display: "flex", flexWrap: "wrap", margin: "-3px" }}>
                {userSkills.length > 0 ? userSkills.map((s, i) => <SkillPill key={s.name + i} skill={s} isDark={isDark} />) : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textMuted }}>No skills listed yet.</span>}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROJECTS ══ */}
        {activeTab === "Projects" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            {userPosts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {userPosts.map((p, i) => (
                  <div key={i} className="project-card" onClick={() => handlePostClick(navigate, p)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + "1A", border: `1px solid ${p.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: p.color }}>
                        {p.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{p.title}</div>
                        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: p.color, marginTop: 2 }}>{p.type?.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 16px", textAlign: "center", color: C.textSec }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🚀</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No projects published yet</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Projects will appear here.</div>
              </div>
            )}
          </div>
        )}

        {/* ══ EDUCATION ══ */}
        {activeTab === "Education" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            {userEducation.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {userEducation.map((edu, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (edu.color || C.blue) + "15", border: `1px solid ${edu.color || C.blue}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                        {edu.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{edu.degree}</div>
                        <div style={{ fontSize: 12, color: edu.color || C.blue, marginTop: 2, fontWeight: 600 }}>{edu.school}</div>
                        {edu.period && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{edu.period}</div>}
                        {edu.specialization && <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{edu.specialization}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 16px", textAlign: "center", color: C.textSec }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🎓</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No education details added yet</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Academic history will appear here.</div>
              </div>
            )}
          </div>
        )}

        {/* ══ CERTIFICATIONS ══ */}
        {activeTab === "Certifications" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            {userCerts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {userCerts.map((cert, i) => (
                  <div key={i} className="cert-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: (cert.color || C.purple) + "18", border: `1.5px solid ${cert.color || C.purple}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {cert.badge || "📄"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{cert.title}</div>
                      <div style={{ fontSize: 11, color: cert.color || C.purple, marginTop: 2 }}>{cert.issuer}</div>
                      {cert.date && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{cert.date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 16px", textAlign: "center", color: C.textSec }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📜</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No certifications added yet</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Certifications will appear here.</div>
              </div>
            )}
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {activeTab === "About" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeUp 0.35s ease both" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <SectionLabel label="Bio" C={C} />
              <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, margin: 0 }}>{user.bio || "No bio provided."}</p>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <SectionLabel label="Details" C={C} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: C.textSec }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  📍 {user.location || "Planet Earth"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  📅 Joined {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  💼 {user.account_type === 'professional' ? "Professional Account" : "Personal Account"}
                </span>
              </div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <SectionLabel label="Skills" C={C} />
              <div style={{ display: "flex", flexWrap: "wrap", margin: "-3px" }}>
                {userSkills.length > 0 ? userSkills.map((s, i) => <SkillPill key={s.name + i} skill={s} isDark={isDark} />) : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textMuted }}>No skills listed yet.</span>}
              </div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <SectionLabel label="Connect" C={C} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {getSocialLinks(user, C).map((link, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.surface2, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => window.open(link.url, '_blank')}>
                    <span style={{ display: "flex", alignItems: "center", color: link.color }}>{link.icon}</span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: link.color, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.label}</span>
                    <span style={{ color: C.textMuted, fontSize: 10 }}>↗</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CONTENT — Type-specific cards ══ */}
        {activeTab === "Content" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {["All", "Videos", "Shorts", "Articles", "Notes"].map(f => (
                <button
                  key={f}
                  onClick={() => setContentFilter(f)}
                  style={{
                    background: contentFilter === f ? C.purple : "transparent",
                    border: `1px solid ${contentFilter === f ? C.purple : C.border}`,
                    color: contentFilter === f ? "#fff" : C.textSec,
                    padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >
                  {f}
                </button>
              ))}
              <div style={{ flex: 1, minWidth: 10 }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.purple, letterSpacing: 1, whiteSpace: "nowrap" }}>
                {filteredContent.length} ITEMS
              </div>
            </div>

            {/* Articles — horizontal scroll with View All */}
            {(contentFilter === "All" || contentFilter === "Articles") && articlePosts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>ARTICLES</div>
                  <button
                    onClick={() => {
                      setContentFilter("Articles");
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.purpleGlow, fontWeight: 600 }}
                  >
                    View all ↗
                  </button>
                </div>
                <div className="mobile-shorts-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                  {articlePosts.map((post, i) => (
                    <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} />
                  ))}
                </div>
              </div>
            )}

            {/* Videos & Shorts (Merged Section) with View All */}
            {(contentFilter === "All" || contentFilter === "Videos" || contentFilter === "Shorts") && (videoPosts.length > 0 || shortPosts.length > 0) && (
              <div style={{ marginBottom: 20, padding: "12px 14px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>VIDEOS & SHORTS</div>
                  <button
                    onClick={() => {
                      setContentFilter("Videos");
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.purpleGlow, fontWeight: 600 }}
                  >
                    View all ↗
                  </button>
                </div>

                {/* Long Videos Stack - shows up to 16 items */}
                {(contentFilter === "All" || contentFilter === "Videos") && videoPosts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {videoPosts.slice(0, 16).map((post, i) => (
                      <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                    ))}
                  </div>
                )}

                {/* Shorts Grid - 2-column, up to 24 items */}
                {(contentFilter === "All" || contentFilter === "Shorts") && shortPosts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: C.textSec, fontWeight: 600, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>SHORTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {shortPosts.slice(0, 24).map((post, i) => (
                        <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes & Study Material Grid */}
            {(contentFilter === "All" || contentFilter === "Notes") && notesPosts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>NOTES & STUDY MATERIAL</div>
                  {contentFilter === "All" && (
                    <button
                      onClick={() => setContentFilter("Notes")}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.purpleGlow, fontWeight: 600 }}
                    >
                      View all ↗
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {notesPosts.slice(0, contentFilter === "All" ? 6 : 100).map((post, i) => (
                    <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Other posts — 2-column grid */}
            {(contentFilter === "All") && otherPosts.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>POSTS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {otherPosts.map((post, i) => (
                    <MobileContentCard key={post.id || i} post={post} isDark={isDark} C={C} onClick={() => handlePostClick(navigate, post)} grid={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
