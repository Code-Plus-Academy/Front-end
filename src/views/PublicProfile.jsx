import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

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
  const TYPE_COLORS = { video: "#EC4899", course: "#F59E0B", article: "#0EA5E9", resource: "#10B981", post: "#7A00FF" };
  const TYPE_ICONS  = { video: "🎬", course: "🎓", article: "📝", resource: "📦", post: "◈", tutorial: "🎯", repository: "⬡" };
  const type = (post.type || "post").toLowerCase();
  return {
    id:           post.id,
    type,
    title:        post.title || post.description || "Untitled",
    thumbnail_url: post.thumbnail_url || null,
    gradient:     `linear-gradient(135deg, ${(TYPE_COLORS[type] || "#7A00FF")}22, ${cardColor(i + 1)}18)`,
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

const TABS = ["Home", "Projects", "Experience", "Education", "Certifications", "About", "Content"];

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

  const [activeTab, setActiveTab] = useState("Home");
  const { resolvedTheme, toggleTheme } = useTheme();
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});
  const isDark = resolvedTheme === 'dark';

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
        
        try {
          const postsRes = await api.get(`/users/${username}/posts`);
          if (isMounted) setPosts(postsRes.data.posts || []);
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

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" }}>Loading profile...</div>;
  }
  if (error || !user) {
    return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" }}>{error || "Profile not found"}</div>;
  }

  // Derive arrays
  const userEducation = (user.education || []).map(normalizeEdu);
  const userCerts     = (user.certifications || []).map(normalizeCert);
  const userSkills    = parseSkills(user.tech_interests);
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

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: isDark ? "rgba(11,15,20,0.88)" : "rgba(248,250,252,0.88)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52,
        animation: "fadeUp 0.3s ease both",
      }}>
        <button style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: C.purpleGlow, display: "flex", alignItems: "center", gap: 6,
          padding: "4px 8px", borderRadius: 8,
        }}>
          ← CPA
        </button>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: C.textMuted, letterSpacing: 3, textTransform: "uppercase",
        }}>
          DEV_PROFILE
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggleTheme} className="action-btn" style={{
            background: isDark ? "#1F2937" : "#E2E8F0",
            border: `1px solid ${C.border}`,
            padding: "6px 10px", fontSize: 14,
            borderRadius: 8,
          }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button className="action-btn" style={{
            background: "none", border: "none",
            color: C.textSec, fontSize: 18, padding: "4px 6px",
          }}>⋯</button>
        </div>
      </div>

      {/* ── HERO COVER ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: 220,
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #0D0020 0%, #080D1A 50%, #0B0F14 100%)"
          : "linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 50%, #F0F9FF 100%)",
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

        {/* System info */}
        <div style={{
          position: "absolute", top: 18, right: 20,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, lineHeight: 1.9, textAlign: "right",
        }}>
          {["SYS:ONLINE", "ENV:PROD_V2", "LAT:19.23°N"].map((l, i) => (
            <div key={i} style={{ color: isDark ? "rgba(196,181,253,0.5)" : "rgba(122,0,255,0.4)" }}>{l}</div>
          ))}
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        }} />
      </div>

      {/* ── PROFILE IDENTITY ───────────────────────────────────────────────── */}
      <div style={{
        padding: "0 24px",
        position: "relative",
        animation: "fadeUp 0.5s ease 0.1s both",
      }}>

        {/* Avatar row */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: -56,
          marginBottom: 20,
        }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 104, height: 104,
              borderRadius: 24,
              background: "linear-gradient(135deg, #7A00FF, #0EA5E9, #A855F7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, fontWeight: 900,
              border: `3.5px solid ${C.bg}`,
              animation: "pulseGlow 3.5s ease-in-out infinite",
              position: "relative",
              zIndex: 2,
              color: "#fff",
              letterSpacing: -2,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px" }} />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            {/* Verified badge */}
            <div style={{
              position: "absolute", bottom: -5, right: -5,
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg, #7A00FF, #A855F7)",
              border: `2.5px solid ${C.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, zIndex: 3,
              animation: "verifiedPulse 2.5s ease-in-out infinite",
            }}>✓</div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 4 }}>
            <button className="action-btn" style={{
              background: "linear-gradient(135deg, #7A00FF, #6D28D9)",
              color: "#fff",
              padding: "9px 20px",
              boxShadow: "0 6px 24px rgba(122,0,255,0.45)",
              fontSize: 13,
            }}>
              Edit Profile
            </button>
            <button className="action-btn" style={{
              background: isDark ? "#1F2937" : "#E2E8F0",
              color: C.textSec,
              border: `1px solid ${C.border}`,
              padding: "9px 14px",
              fontSize: 14,
            }}>
              ↗
            </button>
          </div>
        </div>

        {/* Name & Identity */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontSize: 26, fontWeight: 900,
              letterSpacing: -0.8,
              color: C.text,
              lineHeight: 1.1,
            }}>{user.name}</h1>
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              background: "linear-gradient(90deg, #7A00FF, #38BDF8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700, letterSpacing: 2,
            }}>VERIFIED</span>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, color: C.purpleGlow,
            marginBottom: 10,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>@{user.username}</span>
            <span style={{ color: C.textMuted }}>·</span>
            <span style={{
              background: "rgba(122,0,255,0.15)",
              border: "1px solid rgba(122,0,255,0.3)",
              padding: "1px 8px", borderRadius: 4,
              fontSize: 10, color: C.purpleGlow,
            }}>LVL_12</span>
          </div>

          <p style={{
            fontSize: 13.5, color: C.textSec,
            lineHeight: 1.75, maxWidth: 340,
            marginBottom: 14,
          }}>
            {user.bio || "No bio provided."}
          </p>

          {/* Role chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {(parseSkills(user.tech_interests).slice(0, 5)).map((skill, i) => (
  <span key={skill.name} style={{
    padding: "4px 12px", borderRadius: 8, fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
    background: i === 0 ? "rgba(122,0,255,0.18)" : isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
    border: `1px solid ${i === 0 ? "rgba(122,0,255,0.45)" : C.border}`,
    color: i === 0 ? C.purpleGlow : C.textSec,
    animation: `fadeUp 0.3s ease ${i * 50}ms both`,
  }}>{skill.name}</span>
))}
          </div>

          {/* Meta row */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 14,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: C.textMuted,
            marginBottom: 8,
          }}>
            {[
              { icon: "📍", text: user.location || "Planet Earth" },
              { icon: "📅", text: `Joined ${new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` },
              { icon: "🏢", text: user.account_type === 'professional' ? "Professional Account" : "Personal Account" },
            ].map((m, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span>{m.icon}</span> {m.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ROW ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10, padding: "16px 24px 0",
        animation: "fadeUp 0.5s ease 0.2s both",
      }}>
        {[
          { label: "Posts", value: posts.length || 0, icon: "◈", color: "#7A00FF" },
          { label: "Followers", value: user.followers_count || 0, icon: "◎", color: "#38BDF8" },
          { label: "Following", value: user.following_count || 0, icon: "⬡", color: "#A855F7" },
          { label: "Projects", value: userPosts.length, icon: "◆", color: "#10B981" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card" style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "14px 8px 12px",
            textAlign: "center",
            position: "relative", overflow: "hidden",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = stat.color + "88"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
              opacity: 0.6,
            }} />
            <div style={{
              fontSize: 18, fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace",
              color: stat.color,
              lineHeight: 1.1, marginBottom: 4,
            }}>
              <AnimatedNumber value={stat.value} />
            </div>
            <div style={{
              fontSize: 9, color: C.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.2, textTransform: "uppercase",
            }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 52, zIndex: 100,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: isDark ? "rgba(11,15,20,0.92)" : "rgba(248,250,252,0.92)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 12px",
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
        marginTop: 16,
      }}>
        <div style={{ display: "flex", position: "relative", width: "100%" }}>
          {TABS.map(tab => (
            <button
              key={tab}
              ref={el => tabRefs.current[tab] = el}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 13,
                padding: "14px 16px",
                whiteSpace: "nowrap",
                color: activeTab === tab ? C.purpleGlow : C.textSec,
                transition: "color 0.2s",
                borderBottom: "2px solid transparent",
                flexShrink: 0,
              }}
            >{tab}</button>
          ))}
          {/* Sliding underline */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: tabIndicator.left,
            width: tabIndicator.width,
            height: 2,
            background: `linear-gradient(90deg, ${C.purple}, #A855F7)`,
            borderRadius: 2,
            transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 0 8px rgba(122,0,255,0.6)",
          }} />
        </div>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────────── */}
      <div style={{
        padding: "24px",
        maxWidth: 600, margin: "0 auto",
      }} key={activeTab}>

        {/* ══ HOME ══ */}
        {activeTab === "Home" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>

            {/* Identity.md */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "22px 24px",
              marginBottom: 16,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, #7A00FF, #38BDF8, #10B981)",
              }} />
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: C.purple, letterSpacing: 2,
                marginBottom: 12,
              }}>// IDENTITY.md
              </div>
              
             <p style={{ fontSize: 14, lineHeight: 1.85, color: C.textSec }}>
  {user.bio || "No bio provided."}
</p>
<div style={{ display: "flex", gap: 10, marginTop: 18 }}>
  {[
    { label: "Posts",     val: posts.length,              color: "#7A00FF" },
    { label: "Followers", val: user.followers_count || 0, color: "#38BDF8" },
    { label: "Following", val: user.following_count || 0, color: "#10B981" },
  ].map(m => (
    <div key={m.label} style={{
      flex: 1, padding: "12px 10px",
      background: C.surface2, borderRadius: 12,
      border: `1px solid ${m.color}30`, textAlign: "center",
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.val}</div>
      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, letterSpacing: 1 }}>{m.label.toUpperCase()}</div>
    </div>
  ))}
</div>
            </div>

            {/* Skills */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "22px 24px",
              marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: C.purple, letterSpacing: 2,
                marginBottom: 16,
              }}>// SKILLS.stack</div>
              <div style={{ display: "flex", flexWrap: "wrap", margin: "-4px" }}>
                {userSkills.length > 0 ? userSkills.map((s, i) => <SkillPill key={s.name + i} skill={s} delay={i * 35} isDark={isDark} />) : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--dim, #4B5563)" }}>No skills listed yet.</span>}
              </div>
            </div>

            {/* Recent Posts */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "22px 24px",
              marginBottom: 16,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: C.purple, letterSpacing: 2,
                }}>// RECENT_POSTS</div>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: C.purpleGlow,
                }}>View all ↗</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {userPosts.slice(0, 6).map((post, i) => (
                  <div key={i} className="post-thumb" style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                    position: "relative",
                    aspectRatio: "1",
                    background: post.gradient || (isDark ? "#111827" : "#F1F5F9"),
                    backgroundImage: post.thumbnail_url ? `url(${post.thumbnail_url})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    animation: `fadeUp 0.35s ease ${i * 60}ms both`,
                  }}>
                    {/* Content placeholder */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      padding: 12,
                    }}>
                      <div style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                        textAlign: "center", lineHeight: 1.6,
                        textTransform: "uppercase", letterSpacing: 1,
                        background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4,
                      }}>
                        {post.type === "video" ? "▶ VIDEO" : post.type === "meme" ? "😭 MEME" : post.type === "ui" ? "◈ UI" : post.type === "project" ? "◆ PROJ" : "IMG"}
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700,
                        color: "#fff",
                        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                        textAlign: "center", marginTop: 6, lineHeight: 1.4,
                      }}>
                        {post.title.length > 28 ? post.title.slice(0, 28) + "…" : post.title}
                      </div>
                    </div>
                    {/* Overlay */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                      padding: "8px 10px 8px",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 10, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
                        👏 {post.claps || post.clap_count || 0}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
                        💬 {post.comments || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Stream */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: "22px 24px",
              marginBottom: 16,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 18,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: C.purple, letterSpacing: 2,
                }}>// ACTIVITY_STREAM</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, color: C.green,
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: C.green,
                    animation: "livePulse 1.8s ease-in-out infinite",
                  }} />
                  LIVE
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {userActivity.length > 0 ? userActivity.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "13px 0",
                    borderBottom: i < userActivity.length - 1 ? `1px solid ${C.border}` : "none",
                    animation: `fadeUp 0.3s ease ${i * 70}ms both`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: a.color + "1A",
                      border: `1px solid ${a.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, color: a.color, flexShrink: 0,
                    }}>{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
                        {a.action}{" "}
                        <span style={{ color: a.color }}>{a.target}</span>
                      </div>
                      <div style={{
                        fontSize: 11, color: C.textMuted, marginTop: 3,
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {a.sub}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 9, color: C.textMuted,
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: "nowrap", flexShrink: 0, paddingTop: 2,
                    }}>{a.time}</div>
                  </div>
                )) : <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4B5563" }}>No recent activity.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROJECTS ══ */}
        {activeTab === "Projects" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: C.purple, letterSpacing: 2,
              marginBottom: 20,
            }}>// CONTENT.portfolio · {userPosts.length} posts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {userPosts.length === 0 ? (
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4B5563" }}>No posts published yet.</p>
              ) : userPosts.map((p, i) => (
                <div key={p.id || i} className="project-card" style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                  animation: `fadeUp 0.4s ease ${i * 80}ms both`,
                }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${p.color}, ${p.color}44)` }} />
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: p.color + "1A",
                          border: `1px solid ${p.color}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, color: p.color,
                        }}>{p.icon}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{p.title}</div>
                          <div style={{
                            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                            color: p.color, fontWeight: 600, marginTop: 2,
                          }}>● {(p.type || "post").toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="action-btn" style={{
                          background: p.color + "1A",
                          border: `1px solid ${p.color}44`,
                          color: p.color, padding: "6px 12px", fontSize: 11,
                        }} onClick={() => navigate(`/posts/${p.slug}`)}>↗ View</button>
                        <button className="action-btn" style={{
                          background: isDark ? "#1F2937" : "#F1F5F9",
                          border: `1px solid ${C.border}`,
                          color: C.textSec, padding: "6px 10px", fontSize: 13,
                        }}>⌥</button>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(posts[i]?.tags || []).map(s => (
                          <span key={s} style={{
                            padding: "3px 10px", borderRadius: 6,
                            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                            background: C.surface2,
                            border: `1px solid ${C.border}`,
                            color: C.textMuted,
                          }}>{s}</span>
                        ))}
                      </div>
                      <div style={{
                        display: "flex", gap: 12, flexShrink: 0, paddingLeft: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10, color: C.textMuted,
                      }}>
                        <span>👏 {p.clap_count}</span>
                        <span>👁 {p.view_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ EXPERIENCE ══ */}
       {activeTab === "Experience" && (
  <div style={{ animation: "fadeUp 0.35s ease both" }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, color: C.purple, letterSpacing: 2, marginBottom: 24,
    }}>// EXPERIENCE.timeline</div>
    {userEducation.length === 0 ? (
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4B5563" }}>
        No experience listed yet.
      </p>
    ) : (
      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{
          position: "absolute", left: 8, top: 0, bottom: 0, width: 1,
          background: `linear-gradient(to bottom, ${C.purple}, ${C.purple}22)`,
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {userEducation.map((edu, i) => (
            <div key={i} style={{ position: "relative", animation: `fadeUp 0.4s ease ${i * 100}ms both` }}>
              <div style={{
                position: "absolute", left: -24, top: 16,
                width: 11, height: 11, borderRadius: "50%",
                background: C.blue, border: `2px solid ${C.bg}`,
                boxShadow: `0 0 10px ${C.blue}88`,
              }} />
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{edu.degree}</div>
                    <div style={{ fontSize: 12, color: C.purpleGlow, marginTop: 2, fontWeight: 600 }}>{edu.school}</div>
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted, whiteSpace: "nowrap", paddingTop: 2 }}>
                    {edu.period}
                  </div>
                </div>
                {edu.specialization && <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.65 }}>{edu.specialization}</p>}
                <span style={{
                  display: "inline-block", marginTop: 12,
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  padding: "3px 10px", borderRadius: 5,
                  background: C.blue + "18", color: C.blue,
                  border: `1px solid ${C.blue}44`, letterSpacing: 1,
                }}>EDUCATION</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

        {/* ══ EDUCATION ══ */}
        {activeTab === "Education" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: C.purple, letterSpacing: 2,
              marginBottom: 24,
            }}>// EDUCATION.history</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {userEducation.map((edu, i) => (
                <div key={i} style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                  animation: `fadeUp 0.4s ease ${i * 100}ms both`,
                }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${edu.color}, ${edu.color}44)` }} />
                  <div style={{ padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 13,
                          background: (edu.color || C.blue) + "18",
                          border: `1px solid ${edu.color || C.blue}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, flexShrink: 0,
                        }}>
                          {edu.icon || "🎓"}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                            {edu.degree}
                          </div>
                          <div style={{
                            fontSize: 12, color: edu.color || C.blue, marginTop: 4,
                            fontWeight: 600,
                          }}>{edu.school || edu.institution}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        padding: "4px 10px", borderRadius: 6,
                        background: edu.status === "Pursuing"
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(148,163,184,0.12)",
                        color: edu.status === "Pursuing" ? C.green : C.textMuted,
                        border: `1px solid ${edu.status === "Pursuing" ? "rgba(34,197,94,0.3)" : C.border}`,
                        flexShrink: 0, marginLeft: 8,
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        {edu.status === "Pursuing" && (
                          <span style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: C.green,
                            display: "inline-block",
                            animation: "livePulse 1.8s ease-in-out infinite",
                          }} />
                        )}
                        {edu.status}
                      </span>
                    </div>

                    <div style={{
                      display: "flex", gap: 12, flexWrap: "wrap",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: C.textMuted,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        📅 {edu.period}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        🔬 {edu.specialization}
                      </span>
                      {edu.grade && (
                        <span style={{
                          color: C.green,
                          background: "rgba(34,197,94,0.1)",
                          padding: "2px 8px", borderRadius: 5,
                          border: "1px solid rgba(34,197,94,0.25)",
                        }}>
                          GPA {edu.grade}
                        </span>
                      )}
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
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: C.purple, letterSpacing: 2,
              marginBottom: 24,
            }}>// CERTIFICATIONS.verified · {userCerts.length} earned</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {userCerts.map((cert, i) => (
                <div key={i} className="cert-card" style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  animation: `fadeUp 0.35s ease ${i * 70}ms both`,
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = (cert.color || C.purple) + "66"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    {/* Badge side */}
                    <div style={{
                      width: 64,
                      background: (cert.color || C.purple) + "18",
                      borderRight: `1px solid ${cert.color || C.purple}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      flexDirection: "column", gap: 6,
                      padding: "18px 0",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: (cert.color || C.purple) + "22",
                        border: `2px solid ${cert.color || C.purple}55`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>{cert.badge || "📄"}</div>
                      <div style={{
                        fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                        color: cert.color || C.purple, letterSpacing: 0.5, fontWeight: 700,
                      }}>CERT</div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: "16px 18px" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4, lineHeight: 1.2 }}>
                        {cert.title}
                      </div>
                      <div style={{ fontSize: 12, color: cert.color || C.purple, fontWeight: 600, marginBottom: 8 }}>
                        {cert.issuer}
                      </div>
                      <div style={{
                        display: "flex", gap: 10, alignItems: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, color: C.textMuted,
                      }}>
                        <span>📅 {cert.date}</span>
                        {cert.id && <span style={{ color: C.textMuted }}>ID: {cert.id}</span>}
                      </div>
                    </div>

                    {/* Verify btn */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      paddingRight: 16,
                    }}>
                      <button className="action-btn" style={{
                        background: (cert.color || C.purple) + "18",
                        border: `1px solid ${cert.color || C.purple}44`,
                        color: cert.color || C.purple, padding: "6px 12px",
                        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      }} onClick={() => cert.url && window.open(cert.url, '_blank')}>✓ Verify</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {activeTab === "About" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.35s ease both" }}>
            {[
              { label: "// BIO", content: user.bio || "No bio provided." },
            ].map((section, i) => (
              <div key={i} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "20px 22px",
                animation: `fadeUp 0.4s ease ${i * 80}ms both`,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: C.purple, letterSpacing: 2, marginBottom: 12,
                }}>{section.label}</div>
                <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.8 }}>{section.content}</p>
              </div>
            ))}

            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "20px 22px",
              animation: "fadeUp 0.4s ease 0.24s both",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: C.purple, letterSpacing: 2, marginBottom: 16,
              }}>// CONNECT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  user.website_url && { icon: "🌐", label: user.website_url.replace(/^https?:\/\//, ''), color: C.blue, url: user.website_url },
                  user.github_username && { icon: "⬡", label: `github.com/${user.github_username}`, color: C.textSec, url: `https://github.com/${user.github_username}` },
                ].filter(Boolean).map((link, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    background: C.surface2,
                    borderRadius: 12,
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
                    }}>{link.label}</span>
                    <span style={{ color: C.textMuted, fontSize: 14 }}>↗</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CONTENT ══ */}
        {activeTab === "Content" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: C.purple, letterSpacing: 2,
              marginBottom: 20,
            }}>// CONTENT.library · {userPosts.length} published</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {userPosts.map((item, i) => (
                <div key={i} className="content-card" style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                  animation: `fadeUp 0.35s ease ${i * 60}ms both`,
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = item.color + "66"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: (item.color || C.purple) + "18",
                    border: `1px solid ${item.color || C.purple}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>{item.icon || "📝"}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                      color: item.color || C.purple, letterSpacing: 1.5,
                      marginBottom: 5, textTransform: "uppercase",
                    }}>{item.type}</div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: C.text,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{item.title}</div>
                  </div>

                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-end",
                    gap: 4, flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, color: C.textMuted,
                  }}>
                    <span>{item.views || item.view_count || 0} views</span>
                    <span>{item.reads || item.clap_count || 0} claps</span>
                    <span style={{ color: item.color || C.purple, fontSize: 14 }}>↗</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────────── */}
    {/* use shared nav */}
      <MobileBottomNav />

    </div>  
  );
}
    