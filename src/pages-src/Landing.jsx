'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Helmet } from '../components/seo/HelmetShim';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── System theme hook ─────────────────────────────────────────────────────────
function useSystemDark() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

// ── Theme tokens ──────────────────────────────────────────────────────────────
function getTokens(isDark) {
  return isDark ? {
    bg:           '#020408',
    bgAlt:        '#060b12',
    bgDeep:       '#000000',
    surface:      '#0b1018',
    card:         '#0e1520',
    cardAlt:      '#080e18',
    text:         '#e8edf2',
    sub:          '#8899aa',
    dim:          '#4a5568',
    border:       'rgba(255,255,255,0.07)',
    borderBright: 'rgba(255,255,255,0.13)',
    borderAccent: 'rgba(0,180,216,0.25)',
    navBg:        'rgba(2,4,8,0.82)',
    inputBg:      '#080e18',
    codeBg:       '#020408',
    teal:         '#00B4D8',
    purple:       '#9333EA',
    purpleDim:    'rgba(147,51,234,0.15)',
    tealDim:      'rgba(0,180,216,0.12)',
    gridColor:    '#00B4D8',
    gridOpacity:  0.07,
    diagOpacity:  0.08,
    hexOpacity:   0.13,
    glowTeal:     'rgba(0,180,216,0.09)',
    glowPurple:   'rgba(147,51,234,0.08)',
    scanColor:    'rgba(0,180,216,0.35)',
    termDim:      '#4a5568',
    cardShadow:   'none',
    sectionSeparator: 'rgba(255,255,255,0.04)',
  } : {
    bg:           '#eef2f7',
    bgAlt:        '#e4eaf3',
    bgDeep:       '#d8e2ef',
    surface:      '#ffffff',
    card:         '#f8fafc',
    cardAlt:      '#f0f5fb',
    text:         '#0d1117',
    sub:          '#3d4f63',
    dim:          '#7a8fa6',
    border:       '#d0daea',
    borderBright: '#b8c8d8',
    borderAccent: 'rgba(0,149,179,0.3)',
    navBg:        'rgba(238,242,247,0.88)',
    inputBg:      '#ffffff',
    codeBg:       '#e4eaf3',
    teal:         '#0095b3',
    purple:       '#6e00ff',
    purpleDim:    'rgba(110,0,255,0.08)',
    tealDim:      'rgba(0,149,179,0.09)',
    gridColor:    '#0095b3',
    gridOpacity:  0.09,
    diagOpacity:  0.07,
    hexOpacity:   0.10,
    glowTeal:     'rgba(0,149,179,0.07)',
    glowPurple:   'rgba(110,0,255,0.06)',
    scanColor:    'rgba(0,149,179,0.3)',
    termDim:      '#7a8fa6',
    cardShadow:   '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
    sectionSeparator: '#d0daea',
  };
}

// ── CPA Logo ──────────────────────────────────────────────────────────────────
function CPALogo({ size = 56, t }) {
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cpa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="50%" stopColor="#4ea8de" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="200" r="90" fill="none" stroke="url(#cpa-grad)" strokeWidth="20" strokeDasharray="420 200" strokeLinecap="round" />
      <circle cx="250" cy="200" r="55" fill="none" stroke="url(#cpa-grad)" strokeWidth="15" strokeDasharray="260 160" strokeLinecap="round" />
      <g stroke="url(#cpa-grad)" strokeLinecap="round" strokeWidth="8">
        <line x1="320" y1="140" x2="400" y2="140" /><line x1="340" y1="160" x2="420" y2="160" />
        <line x1="330" y1="180" x2="410" y2="180" /><line x1="350" y1="200" x2="430" y2="200" />
        <line x1="360" y1="220" x2="420" y2="220" />
      </g>
      <text fill={t.text} fontFamily="Syne, sans-serif" fontSize="48" fontWeight="700" x="140" y="350">CODE</text>
      <text fill="#00B4D8" fontFamily="Syne, sans-serif" fontSize="48" fontWeight="700" x="280" y="350">PLUS</text>
      <text fill={t.sub} fontFamily="JetBrains Mono, monospace" fontSize="22" letterSpacing="6" x="168" y="400">ACADEMY</text>
    </svg>
  );
}

// ── Geometric Background ───────────────────────────────────────────────────────
function GeometricBg({ t }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {/* Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: t.gridOpacity }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lp-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke={t.gridColor} strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lp-grid)" />
      </svg>
      {/* Diagonal strokes */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: t.diagOpacity }} xmlns="http://www.w3.org/2000/svg">
        <line x1="-5%" y1="35%" x2="55%" y2="-5%" stroke={t.purple} strokeWidth="1"/>
        <line x1="45%" y1="105%" x2="105%" y2="45%" stroke={t.teal} strokeWidth="1"/>
        <line x1="72%" y1="-5%" x2="105%" y2="28%" stroke={t.purple} strokeWidth="0.8"/>
        <line x1="-5%" y1="65%" x2="30%" y2="105%" stroke={t.teal} strokeWidth="0.8"/>
      </svg>
      {/* Corner triangle TR */}
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 380, height: 380, opacity: t.hexOpacity * 0.6 }} viewBox="0 0 380 380">
        <defs><linearGradient id="tri-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#9333EA"/></linearGradient></defs>
        <polygon points="380,0 380,380 0,0" fill="url(#tri-g)" />
      </svg>
      {/* Corner triangle BL */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: 280, height: 280, opacity: t.hexOpacity * 0.5 }} viewBox="0 0 280 280">
        <polygon points="0,280 280,280 0,0" fill={t.purple} />
      </svg>
      {/* Hexagons */}
      {[
        { x: '12%', y: '18%', size: 72 },
        { x: '78%', y: '55%', size: 110 },
        { x: '58%', y: '12%', size: 54 },
        { x: '3%',  y: '68%', size: 90 },
        { x: '88%', y: '20%', size: 60 },
      ].map((h, i) => (
        <svg key={i} style={{ position: 'absolute', left: h.x, top: h.y, opacity: t.hexOpacity }} width={h.size} height={h.size} viewBox="0 0 100 100">
          <polygon points="50,2 93,26 93,74 50,98 7,74 7,26" fill="none" stroke={i % 2 === 0 ? t.teal : t.purple} strokeWidth="2"/>
        </svg>
      ))}
      {/* Radial glows */}
      <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: `radial-gradient(ellipse, ${t.glowTeal} 0%, transparent 70%)`, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '0%', right: '-8%', width: 500, height: 500, background: `radial-gradient(ellipse, ${t.glowPurple} 0%, transparent 70%)`, borderRadius: '50%' }} />
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function CountdownTimer({ launchDate, t }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(launchDate) - Date.now());
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDate]);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'nowrap' }}>
      {[['D', time.d], ['H', time.h], ['M', time.m], ['S', time.s]].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            background: t.cardAlt, border: `1px solid ${t.borderAccent}`,
            borderRadius: 10, padding: '10px 12px', minWidth: 60,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${t.glowTeal}, ${t.glowPurple})` }} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(20px, 5vw, 38px)',
              fontWeight: 700, color: t.teal,
              display: 'block', textAlign: 'center', position: 'relative', zIndex: 1,
            }}>{pad(val)}</span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.22em', color: t.dim, textTransform: 'uppercase', display: 'block' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Data hooks ────────────────────────────────────────────────────────────────
function useStats() {
  const [stats, setStats] = useState({ posts: '—', users: '—', creators: '—' });
  useEffect(() => {
    api.get('/stats/public').then(r => {
      const d = r.data;
      setStats({ posts: d.posts_count ? `${(d.posts_count/1000).toFixed(1)}K+` : '—', users: d.users_count ? `${(d.users_count/1000).toFixed(1)}K+` : '—', creators: d.creators_count || '—' });
    }).catch(() => {});
  }, []);
  return stats;
}
function useTrendingPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get('/posts', { params: { limit: 4, sort: 'trending' } }).then(r => setPosts(r.data.posts || [])).catch(() => {}); }, []);
  return posts;
}
function useFeaturedCreators() {
  const [creators, setCreators] = useState([]);
  useEffect(() => { api.get('/users/search', { params: { limit: 5 } }).then(r => setCreators(r.data.users || [])).catch(() => {}); }, []);
  return creators;
}

const TYPE_COLORS = { course: '#4ea8de', resource: '#a78bfa', article: '#34d399', video: '#fb923c' };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const isDark = useSystemDark();
  const t = getTokens(isDark);
  const stats = useStats();
  const trendingPosts = useTrendingPosts();
  const creators = useFeaturedCreators();
  const LAUNCH_DATE = '2027-01-01T00:00:00Z';

  const handleWaitlist = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setJoined(true);
      toast.success("You're on the list! 🚀");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally { setSubmitting(false); }
  };

  const gradientText = {
    background: `linear-gradient(135deg, ${t.teal}, ${t.purple})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };
  const ctaBtn = {
    background: `linear-gradient(135deg, ${t.teal}, ${t.purple})`,
    color: '#fff', border: 'none', borderRadius: 10,
    fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer',
  };

  return (
    <>
      <Helmet>
        <title>Code+ Academy — Elite Developer Platform</title>
        <meta name="description" content="The unified home for elite developers." />
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes scanLine { 0% { top:-4px; } 100% { top:102%; } }
          @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
          .lp-cta { transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s; }
          .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,180,216,0.32); }
          .lp-card { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s; }
          .lp-card:hover { transform: translateY(-4px); }
          .lp-nav-link { transition: color 0.18s; }
          @media(min-width:769px){ .lp-nav-links { display:flex !important; } }
          @media(max-width:768px){ .lp-github-grid { grid-template-columns:1fr !important; } }
        `}</style>
      </Helmet>

      <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'Outfit, sans-serif', overflowX: 'hidden', transition: 'background 0.35s, color 0.35s' }}>

        {/* NAV */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: t.navBg, backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${t.sectionSeparator}`,
          padding: '0 20px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <CPALogo size={36} t={t} />
          <div className="lp-nav-links" style={{ display: 'none', gap: 32, alignItems: 'center' }}>
            {['Academy', 'Courses', 'Community'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="lp-nav-link"
                style={{ color: t.sub, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em' }}
                onMouseEnter={e => e.currentTarget.style.color = t.teal}
                onMouseLeave={e => e.currentTarget.style.color = t.sub}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {user ? (
              <button onClick={() => router.push('/feed')} className="lp-cta" style={{ ...ctaBtn, padding: '8px 18px', fontSize: 13 }}>Feed →</button>
            ) : (
              <>
                <Link href="/login">
                  <button style={{ background: 'none', border: `1px solid ${t.borderBright}`, color: t.sub, borderRadius: 8, padding: '8px 16px', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.teal; e.currentTarget.style.color = t.teal; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderBright; e.currentTarget.style.color = t.sub; }}
                  >Login</button>
                </Link>
                <button onClick={() => router.push('/register')} className="lp-cta" style={{ ...ctaBtn, padding: '8px 16px', fontSize: 13 }}>Join</button>
              </>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '110px 20px 80px', overflow: 'hidden', background: t.bg }}>
          <GeometricBg t={t} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 820, width: '100%', animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards' }}>

            {/* Status chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: t.tealDim, border: `1px solid ${t.borderAccent}`, borderRadius: 999, padding: '6px 16px', marginBottom: 40 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.teal, boxShadow: `0 0 8px ${t.teal}`, animation: 'blink 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.16em', color: t.teal, textTransform: 'uppercase' }}>System Status: Booting 2026......</span>
            </div>

            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, filter: `drop-shadow(0 0 40px rgba(0,180,216,0.22))` }}>
              <CPALogo size={220} t={t} />
            </div>

            <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: t.sub, maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.78 }}>
              The unified home for the <strong style={{ color: t.text }}>elite developer</strong>. Bridge the gap between human communication and technical precision.
            </p>

            <div style={{ marginBottom: 44 }}>
              <CountdownTimer launchDate={LAUNCH_DATE} t={t} />
            </div>

            {!user && (
              <form onSubmit={handleWaitlist} style={{ maxWidth: 460, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', gap: 8, padding: '5px 5px 5px 16px', borderRadius: 12, background: t.inputBg, border: `1px solid ${t.borderAccent}`, boxShadow: `0 0 24px ${t.glowTeal}` }}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your developer email" disabled={joined || submitting}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: t.text }} />
                  {joined
                    ? <span style={{ color: '#22c55e', fontFamily: 'Syne, sans-serif', fontWeight: 700, padding: '9px 14px', fontSize: 13 }}>✓ You're in!</span>
                    : <button type="submit" disabled={submitting} className="lp-cta" style={{ ...ctaBtn, padding: '9px 20px', fontSize: 13, borderRadius: 8 }}>{submitting ? '...' : 'Get Access'}</button>
                  }
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em', color: t.dim, marginTop: 10, textTransform: 'uppercase' }}>Limited nodes remaining — Alpha Phase 01</p>
              </form>
            )}
            {user && (
              <button onClick={() => router.push('/feed')} className="lp-cta" style={{ ...ctaBtn, padding: '15px 40px', fontSize: 15, borderRadius: 12 }}>Go to Feed →</button>
            )}
          </div>

          {/* Scroll hint */}
          <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.35, animation: 'fadeIn 2.5s 1s both' }}>
            <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, transparent, ${t.teal})` }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.22em', color: t.teal, textTransform: 'uppercase' }}>Scroll</span>
          </div>
        </section>

        {/* FEATURES */}
        <section id="academy" style={{ background: t.bgAlt, padding: '90px 20px', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${t.sectionSeparator}` }}>
          {/* diagonal hatch pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.025 : 0.035, backgroundImage: `repeating-linear-gradient(45deg, ${t.teal} 0, ${t.teal} 1px, transparent 0, transparent 50%)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.teal, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 24, height: 1, background: t.teal }} />Platform
              </p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(26px,4vw,44px)', color: t.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Built for How You<br />
                <span style={gradientText}>Actually Work</span>
              </h2>
            </div>

            {/* 4 cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 18, marginBottom: 18 }}>
              {[
                { icon: '👥', title: 'Community', color: t.purple, desc: 'Connect with elite engineers worldwide. Shared challenges, collective breakthroughs, zero-noise networking.' },
                { icon: '🎓', title: 'Courses',   color: t.teal,   desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.' },
                { icon: '📝', title: 'Articles',  color: '#22c55e', desc: "Engineering blogs that don't skim the surface. Real code, real scale, real solutions." },
                { icon: '📦', title: 'Resources', color: '#fb923c', desc: 'Download curated templates, boilerplates, and tools built by engineers who ship daily.' },
              ].map(feat => (
                <div key={feat.title} className="lp-card" style={{ background: t.surface, borderRadius: 18, padding: 28, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${feat.color}, transparent)`, borderRadius: '18px 18px 0 0' }} />
                  <div style={{ width: 46, height: 46, background: `${feat.color}22`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 22, border: `1px solid ${feat.color}33` }}>{feat.icon}</div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 10 }}>{feat.title}</h3>
                  <p style={{ color: t.sub, lineHeight: 1.7, fontSize: 13 }}>{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* GitHub Sync */}
            <div className="lp-github-grid" style={{ background: t.surface, borderRadius: 18, padding: '36px 40px', border: `1px solid ${t.border}`, boxShadow: t.cardShadow, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.teal}, ${t.purple})` }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <span style={{ fontSize: 28 }}>⌨️</span>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 900, color: t.text, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>GitHub Sync</h3>
                </div>
                <p style={{ color: t.sub, lineHeight: 1.8, fontSize: 14, maxWidth: 360 }}>Automate your learning path. Sync your repositories and let Code Plus Academy suggest modules based on your actual tech stack.</p>
              </div>
              <div style={{ background: t.codeBg, borderRadius: 12, padding: '20px 22px', border: `1px solid ${t.borderAccent}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.scanColor}, transparent)`, animation: 'scanLine 3s linear infinite', zIndex: 1 }} />
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {['#ef444455', '#eab30855', '#22c55e55'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <p style={{ color: t.teal, marginBottom: 4 }}>$ git checkout academy-main</p>
                <p style={{ color: t.termDim, marginBottom: 4 }}>Switched to 'academy-main'</p>
                <p style={{ color: t.text, marginBottom: 4 }}>$ academy sync --user=dev</p>
                <p style={{ color: t.termDim, marginBottom: 4 }}>Fetching metadata...</p>
                <p style={{ color: t.purple }}>✓ Rust Patterns: Advanced</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRENDING POSTS */}
        <section style={{ padding: '90px 20px', background: t.bg, position: 'relative', overflow: 'hidden', borderTop: `1px solid ${t.sectionSeparator}` }}>
          <GeometricBg t={t} />
          <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.teal, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-block', width: 24, height: 1, background: t.teal }} />Live Feed
                </p>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(22px,3vw,38px)', color: t.text, letterSpacing: '-0.03em' }}>Trending on CPA</h2>
              </div>
              <button onClick={() => router.push(user ? '/feed' : '/register')} style={{ background: 'none', border: `1px solid ${t.borderAccent}`, color: t.teal, borderRadius: 8, padding: '9px 18px', fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.tealDim}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >View All →</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 18 }}>
              {(trendingPosts.length > 0 ? trendingPosts : Array(4).fill(null)).map((post, i) => (
                <div key={post?.id || i} className="lp-card" onClick={() => post && router.push(`/activity:${post.slug || post.id}`)} style={{ background: t.surface, borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`, cursor: post ? 'pointer' : 'default', boxShadow: t.cardShadow }}>
                  {post?.thumbnail_url
                    ? <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', aspectRatio: '16/9', background: isDark ? `linear-gradient(135deg,${t.card},${t.cardAlt})` : `linear-gradient(135deg,${t.bgAlt},${t.bgDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 28 }}>{!post ? '⌛' : '📄'}</span>
                      </div>
                  }
                  <div style={{ padding: 18 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: TYPE_COLORS[post?.type] || t.sub, background: `${TYPE_COLORS[post?.type] || t.teal}18`, borderRadius: 4, padding: '3px 7px', display: 'inline-block', marginBottom: 10 }}>{post?.type || '—'}</span>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: t.text, lineHeight: 1.45, marginBottom: 12 }}>
                      {post?.title || <span style={{ background: t.cardAlt, borderRadius: 4, display: 'block', width: '80%', height: 13 }} />}
                    </h3>
                    {post && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <img src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`} alt="" style={{ width: 20, height: 20, borderRadius: '50%', background: t.cardAlt }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim }}>@{post.creator_username}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim }}>{post.clap_count || 0} 👏</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED CREATORS */}
        <section id="community" style={{ padding: '90px 20px', background: t.bgAlt, position: 'relative', overflow: 'hidden', borderTop: `1px solid ${t.sectionSeparator}` }}>
          <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.025 : 0.035, backgroundImage: `repeating-linear-gradient(135deg, ${t.purple} 0, ${t.purple} 1px, transparent 0, transparent 50%)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.teal, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>// People</p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(22px,3vw,38px)', color: t.text, letterSpacing: '-0.03em' }}>Featured Creators</h2>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
              {(creators.length > 0 ? creators : Array(5).fill(null)).map((c, i) => (
                <div key={c?.username || i} className="lp-card" onClick={() => c && router.push(`/u/${c.username}`)} style={{ minWidth: 185, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: '26px 18px', textAlign: 'center', flexShrink: 0, cursor: c ? 'pointer' : 'default', boxShadow: t.cardShadow, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.teal}, ${t.purple})` }} />
                  <img src={c?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c?.username || i}`} alt={c?.name || ''} style={{ width: 58, height: 58, borderRadius: '50%', margin: '0 auto 12px', display: 'block', border: `2px solid ${t.borderAccent}` }} />
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 3 }}>{c?.name || '—'}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim, marginBottom: 16 }}>@{c?.username || '...'}</div>
                  {c && (
                    <button onClick={e => { e.stopPropagation(); router.push(`/u/${c.username}`); }} style={{ width: '100%', background: t.tealDim, border: `1px solid ${t.borderAccent}`, color: t.teal, borderRadius: 7, padding: '7px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.teal; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = t.tealDim; e.currentTarget.style.color = t.teal; }}
                    >View Profile</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{ padding: '72px 20px', background: t.bg, borderTop: `1px solid ${t.sectionSeparator}`, position: 'relative', overflow: 'hidden' }}>
          <GeometricBg t={t} />
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '44px 88px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {[{ label: 'Developers', value: stats.users }, { label: 'Resources', value: stats.posts }, { label: 'Creators', value: stats.creators }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 'clamp(34px,5vw,52px)', ...gradientText, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim, textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 8 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: '110px 20px', position: 'relative', overflow: 'hidden', textAlign: 'center', background: t.bgDeep, borderTop: `1px solid ${t.sectionSeparator}` }}>
          <GeometricBg t={t} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 350, background: `radial-gradient(ellipse, ${t.glowTeal} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 660, margin: '0 auto' }}>
            {/* decorative divider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 44 }}>
              <div style={{ height: 1, width: 64, background: `linear-gradient(to right, transparent, ${t.teal})` }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.teal, boxShadow: `0 0 12px ${t.teal}` }} />
              <div style={{ height: 1, width: 64, background: `linear-gradient(to left, transparent, ${t.teal})` }} />
            </div>

            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 'clamp(30px,5vw,58px)', color: t.text, marginBottom: 20, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1.05 }}>
              Don't Get Left<br />in the <span style={gradientText}>Legacy.</span>
            </h2>
            <p style={{ color: t.sub, fontSize: 16, marginBottom: 48, lineHeight: 1.75 }}>The next generation of software engineering starts here. Join the private alpha waitlist today.</p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push(user ? '/feed' : '/register')} className="lp-cta" style={{ ...ctaBtn, padding: '16px 40px', fontSize: 15, borderRadius: 12 }}>
                {user ? 'Go to Feed →' : 'Secure Your Access'}
              </button>
              <Link href="/faq">
                <button style={{ background: 'none', border: `1px solid ${t.borderBright}`, color: t.sub, borderRadius: 12, padding: '16px 40px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.teal; e.currentTarget.style.color = t.teal; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderBright; e.currentTarget.style.color = t.sub; }}
                >Documentation</button>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: t.bgAlt, borderTop: `1px solid ${t.sectionSeparator}`, padding: '44px 28px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div>
              <CPALogo size={34} t={t} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim, marginTop: 10, letterSpacing: '0.1em' }}>© 2025 Code Plus Academy. Engineered for the next generation.</p>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }, { label: 'Support', to: '/support' }, { label: 'FAQ', to: '/faq' }].map(({ label, to }) => (
                <Link key={label} to={to} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: t.dim, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = t.teal}
                  onMouseLeave={e => e.currentTarget.style.color = t.dim}
                >{label}</Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
