'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import DesktopProfile from '../components/profile/DesktopProfile';
import MobileProfile from '../components/profile/MobileProfile';

// ── HELPERS — map real DB rows to the shape the UI expects ────────────────────

// Palette used to auto-color cards when no color is stored on the row
const CARD_COLORS = ["#7A00FF", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
const cardColor = (i) => CARD_COLORS[i % CARD_COLORS.length];

// user_education row → UI shape
function normalizeEdu(edu, i) {
  const startYear  = edu.start_year  || "";
  const endYear    = edu.end_year    || "";
  const pursuing   = edu.currently_attending;
  const period     = startYear
    ? pursuing
      ? `${startYear} – Present`
      : endYear ? `${startYear} – ${endYear}` : startYear
    : pursuing ? "Present" : "";
  return {
    degree:         edu.degree || "Degree",
    school:         edu.school || edu.institution || "",
    period,
    status:         pursuing ? "Pursuing" : "Completed",
    specialization: edu.field_of_study || edu.description || "",
    grade:          edu.grade || null,
    color:          cardColor(i),
    icon:           pursuing ? "🎓" : "📘",
  };
}

// user_certifications row → UI shape
function normalizeCert(cert, i) {
  const month = cert.issue_month ? cert.issue_month.slice(0, 3) + " " : "";
  const date  = cert.issue_year  ? `${month}${cert.issue_year}` : "";
  return {
    title:  cert.name   || "Certificate",
    issuer: cert.issuer || "",
    date,
    id:     cert.credential_id  || null,
    url:    cert.credential_url || null,
    color:  cardColor(i),
    badge:  "📜",
  };
}

// posts row → UI shape (used in Posts grid and Content list)
function normalizePost(post, i) {
  const TYPE_COLORS = { video: "#EC4899", short: "#EC4899", course: "#F59E0B", article: "#0EA5E9", resource: "#10B981", post: "#7A00FF", project: "#10B981" };
  const TYPE_ICONS  = { video: "🎬", short: "📱", course: "🎓", article: "📝", resource: "📦", post: "◈", tutorial: "🎯", repository: "⬡", project: "◆" };
  const type = (post.type || "post").toLowerCase();
  return {
    id:           post.id,
    type,
    title:        post.title || post.description || "Untitled",
    thumbnail_url: post.thumbnail_url || null,
    gradient:     `linear-gradient(135deg, ${(TYPE_COLORS[type] || "#7A00FF")}99, ${cardColor(i + 1)}80)`,
    clap_count:   post.clap_count  || 0,
    view_count:   post.view_count  || 0,
    slug:         post.slug        || post.id,
    source_link:  post.source_link || null,
    color:        TYPE_COLORS[type] || cardColor(i),
    icon:         TYPE_ICONS[type]  || "📝",
  };
}

// tech_interests from DB is stored as a JSON array or comma string; parse either
function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => ({ name: String(s) }));
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((s) => ({ name: typeof s === "string" ? s : s.name || String(s) }));
  } catch {}
  // Fallback: comma-separated string
  return String(raw).split(",").map((s) => ({ name: s.trim() })).filter((s) => s.name);
}

// Format timeAgo for activity feed
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const TABS = ["Home", "Projects", "Education", "Certifications", "About", "Content"];

// ── HELPERS ───────────────────────────────────────────────────────────────────

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
        animation: `fadeUp 0.4s ease ${delay}ms both`,
      }}
    >
      {skill.name}
    </span>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const [activeTab, setActiveTab] = useState("Home");
  const [contentFilter, setContentFilter] = useState("All");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const filterParam = params.get('filter');
    if (tabParam) setActiveTab(tabParam);
    if (filterParam) setContentFilter(filterParam);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    if (tab !== 'Content') {
      params.delete('filter');
    }
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  const handleFilterChange = (filter) => {
    setContentFilter(filter);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'Content');
    params.set('filter', filter);
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  const { resolvedTheme } = useTheme();
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});
  const isDark = resolvedTheme === 'dark';
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktop(window.innerWidth >= 900);
    const handleResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const C = {
    bg: isDark ? "#0B0F14" : "#F8FAFC",
    surface: isDark ? "#111827" : "#FFFFFF",
    surface2: isDark ? "#0D1520" : "#F1F5F9",
    border: isDark ? "#1F2937" : "#E2E8F0",
    border2: isDark ? "#374151" : "#CBD5E1",
    text: isDark ? "#F1F5F9" : "#0F172A",
    textSec: isDark ? "#94A3B8" : "#64748B",
    textMuted: isDark ? "#4B5563" : "#94A3B8",
    purple: "#7A00FF",
    purpleGlow: "#A855F7",
    purpleSoft: "#C4B5FD",
    green: "#22C55E",
    blue: "#38BDF8",
    orange: "#FB923C",
  };

  useEffect(() => {
    if (!username) return;
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/users/${username}`);
        if (!isMounted) return;
        setUser(data.user);
        setIsFollowing(!!data.is_following);
        
        try {
          const postsRes = await api.get(`/users/${username}/posts`);
          let allPosts = postsRes.data.posts || [];
          
          // Fetch articles separately as fallback
          try {
            const articlesRes = await api.get(`/articles/by/${username}`);
            const articles = articlesRes.data.articles || [];
            const mappedArticles = articles.map(a => ({
              ...a,
              type: a.page_type || 'article',
              thumbnail_url: a.og_image_url,
              created_at: a.published_at || a.created_at,
            }));
            allPosts = [...allPosts, ...mappedArticles];
          } catch(err) {
            console.error("Failed to fetch articles on frontend:", err);
          }

          // Fetch videos separately as fallback (in case backend didn't include them)
          const hasVideos = allPosts.some(p => p.type === 'video' || p.type === 'short');
          if (!hasVideos) {
            try {
              const [videosRes, shortsRes] = await Promise.allSettled([
                api.get('/videos', { params: { limit: 50 } }),
                api.get('/videos/shorts', { params: { limit: 50 } }),
              ]);
              const allVideos = [
                ...(videosRes.status === 'fulfilled' ? (videosRes.value.data.videos || []) : []),
                ...(shortsRes.status === 'fulfilled' ? (shortsRes.value.data.videos || []) : []),
              ];
              const userVideos = allVideos.filter(v =>
                v.creator_username && v.creator_username.toLowerCase() === username.toLowerCase()
              );
              const mappedVideos = userVideos.map(v => ({
                ...v,
                type: v.content_type === 'short' ? 'short' : 'video',
                thumbnail_url: v.thumbnail_url,
                view_count: v.views || v.view_count || 0,
                clap_count: v.likes_count || v.clap_count || 0,
                slug: v.id,
                created_at: v.created_at,
              }));
              allPosts = [...allPosts, ...mappedVideos];
            } catch(err) {
              console.error("Failed to fetch videos on frontend:", err);
            }
          }

          // Deduplicate by id
          const seen = new Set();
          allPosts = allPosts.filter(p => {
            const key = p.id || p.slug;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          if (isMounted) setPosts(allPosts);
        } catch(e) {
          console.error("Failed to fetch posts:", e);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (isMounted) setError(err.response?.data?.error || "User not found");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [username]);

  const handleFollowToggle = useCallback(async () => {
    if (!username) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/${username}/follow`);
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) } : prev);
      } else {
        await api.post(`/users/${username}/follow`);
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    }
  }, [username, isFollowing]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Manrope', sans-serif",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" }}>
          Loading profile...
        </div>
        <MobileBottomNav />
      </div>
    );
  }
  if (error || !user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Manrope', sans-serif",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" }}>
          {error || "Profile not found"}
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  // Derive arrays
  const userEducation = (user.education || []).map(normalizeEdu);
  const userCerts     = (user.certifications || []).map(normalizeCert);
  const userSkills    = parseSkills((user.skills && user.skills.length) ? user.skills : user.tech_interests);
  const userPosts     = posts.map(normalizePost);
  const userActivity  = userPosts.slice(0, 5).map((p, i) => ({
    icon:   p.icon,
    action: "Published",
    target: p.title,
    sub:    (p.type || "post").charAt(0).toUpperCase() + (p.type || "post").slice(1),
    time:   posts[i] ? timeAgo(posts[i].created_at) : "",
    color:  p.color,
  }));

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'Manrope', sans-serif",
      transition: "background 0.35s, color 0.35s",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(122,0,255,0.35); border-radius: 2px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 10px rgba(122,0,255,0.4); }
          50% { box-shadow: 0 0 28px rgba(122,0,255,0.8), 0 0 60px rgba(122,0,255,0.2); }
        }
        @keyframes orb {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-25px) scale(1.12); }
          66% { transform: translate(-25px,20px) scale(0.94); }
        }
        @keyframes verifiedPulse {
          0%,100% { box-shadow: 0 0 6px rgba(122,0,255,0.5); }
          50% { box-shadow: 0 0 18px rgba(122,0,255,1), 0 0 36px rgba(122,0,255,0.4); }
        }
        @keyframes shimmerMove {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes indicatorSlide {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes livePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .action-btn {
          border: none; cursor: pointer;
          font-family: 'Manrope', sans-serif;
          font-weight: 700; font-size: 13px;
          border-radius: 10px;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn:active { transform: scale(0.96); }

        .stat-card {
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .stat-card:hover { transform: translateY(-4px); }

        .project-card {
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .project-card:hover { transform: translateY(-5px); box-shadow: 0 24px 64px rgba(0,0,0,0.4); }

        .nav-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px; cursor: pointer;
          transition: all 0.2s;
        }
        .nav-item:hover { transform: translateY(-3px); }

        .cert-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .cert-card:hover { transform: translateY(-4px); }

        .post-thumb { transition: transform 0.3s ease; cursor: pointer; }
        .post-thumb:hover { transform: scale(1.03); }

        .content-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .content-card:hover { transform: translateX(4px); }

        .profile-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .responsive-identity {
          padding: 0 16px;
        }

        /* Mobile: < 768px */
        @media (max-width: 767px) {
          .desktop-only {
            display: none !important;
          }
        }

        /* Tablet: 768px - 899px */
        @media (min-width: 768px) and (max-width: 899px) {
          .desktop-only {
            display: none !important;
          }
          .responsive-identity {
            padding: 0 20px;
          }
          .profile-layout-grid {
            gap: 20px;
          }
        }

        /* Desktop: 900px+ */
        @media (min-width: 900px) {
          .profile-layout-grid {
            grid-template-columns: 260px 1fr;
            gap: 20px;
            padding: 0 12px;
          }
          .profile-sidebar {
            position: sticky;
            top: 72px;
          }
          .responsive-identity {
            padding: 0;
          }
          .mobile-only {
            display: none !important;
          }
        }

        /* Wide Desktop: 1200px+ */
        @media (min-width: 1200px) {
          .profile-layout-grid {
            grid-template-columns: 280px 1fr;
            gap: 24px;
            padding: 0 16px;
          }
        }
      `}</style>

      {/* ── BG ORBS ────────────────────────────────────────────────────────── */}
      {isDark && <>
        <div style={{
          position: "fixed", top: "8%", left: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(122,0,255,0.07) 0%, transparent 70%)",
          animation: "orb 14s ease-in-out infinite",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: "12%", right: "3%",
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          animation: "orb 18s ease-in-out infinite reverse",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", top: "50%", right: "20%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
          animation: "orb 22s ease-in-out infinite 2s",
          pointerEvents: "none", zIndex: 0,
        }} />
      </>}


      {/* ── HERO COVER ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: (user.cover_banner_url || user.banner_url) ? "clamp(160px, 25vw, 320px)" : "120px",
        width: "100%",
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #0D0020 0%, #080D1A 50%, #0B0F14 100%)"
          : "linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 50%, #F0F9FF 100%)",
        backgroundImage: (user.cover_banner_url || user.banner_url) ? `url(${user.cover_banner_url || user.banner_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, /* G4: Clear boundary */
      }}>
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: isDark
            ? `linear-gradient(rgba(122,0,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(122,0,255,0.09) 1px, transparent 1px)`
            : `linear-gradient(rgba(122,0,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(122,0,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />

        {/* Glow bars */}
        {isDark && <>
          <div style={{
            position: "absolute", top: "35%", left: "50%",
            transform: "translateX(-50%)",
            width: "70%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(122,0,255,0.6), rgba(168,85,247,0.3), transparent)",
          }} />
          <div style={{
            position: "absolute", top: "65%", left: "20%",
            width: "50%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)",
          }} />
          {/* Center radial */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 300, height: 120,
            background: "radial-gradient(ellipse, rgba(122,0,255,0.18) 0%, transparent 70%)",
          }} />
        </>}

        {/* Light mode gradient overlay */}
        {!isDark && (
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 30% 50%, rgba(122,0,255,0.08) 0%, transparent 60%)",
          }} />
        )}

        {/* Scan line */}
        {isDark && <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(122,0,255,0.4), transparent)",
          animation: "scanLine 5s linear infinite",
          pointerEvents: "none",
        }} />}

        {/* Bottom fade & Inner Shadow Boundary (G4) Removed as per request */}
      </div>

      {isDesktop ? (
        <DesktopProfile
          user={user}
          posts={posts}
          userEducation={userEducation}
          userCerts={userCerts}
          userSkills={userSkills}
          userPosts={userPosts}
          userActivity={userActivity}
          resolvedTheme={resolvedTheme}
          isDark={isDark}
          C={C}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          contentFilter={contentFilter}
          setContentFilter={handleFilterChange}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
        />
      ) : (
        <MobileProfile
          user={user}
          posts={posts}
          userEducation={userEducation}
          userCerts={userCerts}
          userSkills={userSkills}
          userPosts={userPosts}
          userActivity={userActivity}
          resolvedTheme={resolvedTheme}
          isDark={isDark}
          C={C}
          parseSkills={parseSkills}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          contentFilter={contentFilter}
          setContentFilter={handleFilterChange}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
        />
      )}

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────────── */}
    {/* use shared nav */}
      <MobileBottomNav />

    </div>  
  );
}
    