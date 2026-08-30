import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, MotionConfig } from 'framer-motion';
import FocusGramBrand from '../components/brand/FocusGramBrand';
import {
  ArrowUpRight,
  Check,
  FileText,
  Code2,
  BookOpen,
  Terminal,
  Users,
  Inbox,
  Sparkles,
} from 'lucide-react';

const LAUNCH_DATE = '2027-01-01T00:00:00Z';

const TYPE_STYLE = {
  course: { label: 'Course', color: '#2563EB' },
  article: { label: 'Article', color: '#059669' },
  resource: { label: 'Resource', color: '#DC2626' },
  video: { label: 'Video', color: '#D97706' },
};

const FEATURES = [
  {
    key: 'community',
    title: 'Community',
    color: '#7C3AED',
    desc: 'Connect with elite engineers worldwide — shared challenges, real breakthroughs, zero-noise networking.',
    Icon: Users,
  },
  {
    key: 'courses',
    title: 'Courses',
    color: '#2563EB',
    desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.',
    Icon: BookOpen,
  },
  {
    key: 'articles',
    title: 'Articles',
    color: '#059669',
    desc: "Engineering writing that doesn't skim the surface — real code, real scale, real trade-offs.",
    Icon: FileText,
  },
  {
    key: 'resources',
    title: 'Resources',
    color: '#DC2626',
    desc: 'Curated templates, boilerplates, and tools built by engineers who ship daily.',
    Icon: Code2,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Countdown ───────────────────────────────────────────────────
function CountdownTimer({ launchDate, t, isDark }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = new Date(launchDate).getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex justify-center items-center gap-3">
      {[
        ['Days', time.d],
        ['Hrs', time.h],
        ['Min', time.m],
        ['Sec', time.s],
      ].map(([label, val]) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div
            className="min-w-[56px] px-3 py-2.5 text-center transition-colors rounded-md"
            style={{
              border: `1px solid ${t.border}`,
              background: t.surf,
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <span
              className="font-['JetBrains_Mono'] text-[20px] sm:text-[26px] font-bold"
              style={{ color: t.txt }}
            >
              {pad(val)}
            </span>
          </div>
          <span
            className="font-['JetBrains_Mono'] text-[9px] font-bold tracking-[0.16em] uppercase"
            style={{ color: t.txt2 }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Reusable terminal window ──────────────────────────────────────
function TerminalWindow({ tab, lines, trigger = 'inView', t, isDark }) {
  const motionProps =
    trigger === 'mount'
      ? { initial: 'hidden', animate: 'visible' }
      : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.4 } };

  return (
    <motion.div
      {...motionProps}
      variants={stagger}
      className="text-left transition-colors rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${t.border}`,
        background: isDark ? '#111827' : '#F8FAFC',
        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3.5 py-2.5"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <span className="size-2.5 rounded-full bg-[#EF4444]" />
        <span className="size-2.5 rounded-full bg-[#F59E0B]" />
        <span className="size-2.5 rounded-full bg-[#10B981]" />
        <span
          className="ml-auto font-['JetBrains_Mono'] text-[10px] font-medium"
          style={{ color: t.txt2 }}
        >
          {tab}
        </span>
      </div>
      <div className="font-['JetBrains_Mono'] text-[12.5px] leading-[1.85] px-4 py-4">
        {lines.map((l, idx) => (
          <motion.p
            key={idx}
            variants={fadeUp}
            custom={idx}
            className={l.cls === 'cmd' ? (isDark ? 'text-[#3B7CFF]' : 'text-[#2563EB]') : l.cls === 'ok' ? (isDark ? 'text-[#34C77B]' : 'text-[#059669]') : ''}
            style={l.cls !== 'cmd' && l.cls !== 'ok' ? { color: t.txt2 } : {}}
          >
            {l.text}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

// ── Background texture ─────────────────────────────────────────
function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '260px 260px',
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

function SectionPattern({ variant = 'grid', className = '', fade = false, isDark = false }) {
  const fadeStyle = fade
    ? { maskImage: 'linear-gradient(to bottom, black, transparent 88%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 88%)' }
    : {};
  const strokeColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)';
  if (variant === 'dots') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 ${className}`}
        style={{
          backgroundImage: `radial-gradient(${strokeColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
          opacity: 0.8,
          ...fadeStyle,
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{
        backgroundImage:
          `linear-gradient(${strokeColor} 1px,transparent 1px),linear-gradient(90deg,${strokeColor} 1px,transparent 1px)`,
        backgroundSize: '46px 46px',
        opacity: 0.8,
        ...fadeStyle,
      }}
    />
  );
}

const GLOW_COLORS = {
  blue: 'rgba(37,99,235,.12)',
  green: 'rgba(5,150,105,.10)',
  purple: 'rgba(124,58,237,.10)',
};

function Glow({ color = 'blue', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, ${GLOW_COLORS[color]}, transparent 72%)`, filter: 'blur(12px)' }}
    />
  );
}

function GitGraphMotif({ className = '', isDark = false }) {
  const lineStroke = isDark ? '#FFFFFF' : '#0F172A';
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 ${className}`}
      viewBox="0 0 220 260"
      width="220"
      height="260"
    >
      <path d="M36 10 V250" stroke={lineStroke} strokeWidth="1.5" opacity=".1" fill="none" />
      <path d="M36 70 C36 100 110 90 110 130 S184 160 184 190" stroke="#059669" strokeWidth="1.5" opacity=".3" fill="none" />
      <path d="M110 130 V210" stroke={lineStroke} strokeWidth="1.5" opacity=".1" fill="none" />
      <circle cx="36" cy="30" r="4.5" fill="#2563EB" opacity=".55" />
      <circle cx="36" cy="130" r="4.5" fill={lineStroke} opacity=".3" />
      <circle cx="36" cy="230" r="4.5" fill="#2563EB" opacity=".4" />
      <circle cx="110" cy="130" r="4.5" fill="#059669" opacity=".55" />
      <circle cx="110" cy="210" r="4.5" fill={lineStroke} opacity=".3" />
      <circle cx="184" cy="190" r="4.5" fill="#059669" opacity=".45" />
    </svg>
  );
}

// ── Data hooks ──────────────────────────────────────────────────
function useStats() {
  const [state, setState] = useState({ data: null, loading: true });
  useEffect(() => {
    let live = true;
    api
      .get('/stats/public')
      .then((r) => { if (live) setState({ data: r.data, loading: false }); })
      .catch((err) => {
        console.error('Failed to load public stats', err);
        if (live) setState({ data: null, loading: false });
      });
    return () => { live = false; };
  }, []);
  const d = state.data || {};
  return {
    loading: state.loading,
    posts: d.posts_count ? `${(d.posts_count / 1000).toFixed(1)}K+` : null,
    users: d.users_count ?? null,
    creators: d.creators_count ?? null,
  };
}

function useTrendingPosts() {
  const [state, setState] = useState({ posts: [], loading: true, error: false });
  useEffect(() => {
    let live = true;
    api
      .get('/posts', { params: { limit: 4, sort: 'trending' } })
      .then((r) => { if (live) setState({ posts: r.data.posts || [], loading: false, error: false }); })
      .catch((err) => {
        console.error('Failed to load trending posts', err);
        if (live) setState({ posts: [], loading: false, error: true });
      });
    return () => { live = false; };
  }, []);
  return state;
}

function useFeaturedCreators() {
  const [state, setState] = useState({ creators: [], loading: true, error: false });
  useEffect(() => {
    let live = true;
    api
      .get('/users/search', { params: { limit: 5 } })
      .then((r) => { if (live) setState({ creators: r.data.users || [], loading: false, error: false }); })
      .catch((err) => {
        console.error('Failed to load featured creators', err);
        if (live) setState({ creators: [], loading: false, error: true });
      });
    return () => { live = false; };
  }, []);
  return state;
}

// ── Skeletons ───────────────────────────────────────────────────
function PostCardSkeleton({ t }) {
  return (
    <div
      className="p-4 h-[230px] flex flex-col gap-3 animate-pulse rounded-lg"
      style={{ border: `1px solid ${t.border}`, background: t.surf }}
    >
      <div className="h-24 rounded" style={{ background: t.bg2 }} />
      <div className="h-2.5 rounded w-4/5" style={{ background: t.bg2 }} />
      <div className="h-2.5 rounded w-2/5" style={{ background: t.bg2 }} />
    </div>
  );
}

function CreatorRowSkeleton({ t }) {
  return (
    <div
      className="flex items-center gap-3.5 p-4 animate-pulse rounded-lg"
      style={{ border: `1px solid ${t.border}`, background: t.surf }}
    >
      <div className="size-11 rounded-full shrink-0" style={{ background: t.bg2 }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2.5 rounded w-2/5" style={{ background: t.bg2 }} />
        <div className="h-2.5 rounded w-1/4" style={{ background: t.bg2 }} />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyPanel({ icon: Icon, title, copy, ctaLabel, onCta, t }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeUp}
      className="flex flex-col items-center text-center gap-3.5 border border-dashed px-6 py-12 rounded-lg"
      style={{ borderColor: t.border, background: t.bg2 }}
    >
      <div
        className="size-11 border flex items-center justify-center mb-1 rounded-md"
        style={{ borderColor: t.border, color: t.accent, background: t.surf }}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-['Space_Grotesk'] text-[17px] font-bold uppercase tracking-tight" style={{ color: t.txt }}>
        {title}
      </h3>
      <p className="text-[13.5px] max-w-[38ch]" style={{ color: t.txt2 }}>{copy}</p>
      <button
        onClick={onCta}
        className="mt-1 border px-5 py-2.5 font-['JetBrains_Mono'] text-[10.5px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md"
        style={{ borderColor: t.border, color: t.txt2, background: t.surf }}
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

// ── Loaded-state cards ──────────────────────────────────────────
function PostCard({ post, t }) {
  const meta = TYPE_STYLE[post.type] || TYPE_STYLE.article;
  return (
    <Link
      to={`/activity/${post.slug || post.id}`}
      className="group text-left p-4 flex flex-col gap-3 transition-colors rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: `1px solid ${t.border}`,
        background: t.surf,
        boxShadow: t.shadowSm,
      }}
    >
      <div className="h-24 overflow-hidden flex items-center justify-center rounded" style={{ backgroundColor: `${meta.color}14` }}>
        {post.cover_image ? (
          <img src={post.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileText className="size-6" style={{ color: meta.color }} />
        )}
      </div>
      <span
        className="self-start font-['JetBrains_Mono'] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-1 border rounded"
        style={{ color: meta.color, borderColor: `${meta.color}4D` }}
      >
        {meta.label}
      </span>
      <h3
        className="font-['Space_Grotesk'] text-[14px] font-bold leading-snug line-clamp-2 transition-colors group-hover:text-[#2563EB]"
        style={{ color: t.txt }}
      >
        {post.title}
      </h3>
    </Link>
  );
}

function CreatorRow({ creator, t }) {
  const initial = (creator.name || creator.username || '?').charAt(0).toUpperCase();
  return (
    <Link
      to={`/u/${creator.username}`}
      className="flex items-center gap-3.5 p-4 transition-colors rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: `1px solid ${t.border}`,
        background: t.surf,
        boxShadow: t.shadowSm,
      }}
    >
      {creator.avatar_url ? (
        <img src={creator.avatar_url} alt="" className="size-11 rounded-full object-cover shrink-0" />
      ) : (
        <div
          className="size-11 rounded-full shrink-0 border flex items-center justify-center font-['Space_Grotesk'] font-bold"
          style={{ background: t.bg2, borderColor: t.border, color: t.txt2 }}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-['Space_Grotesk'] text-[14px] font-bold truncate" style={{ color: t.txt }}>
          {creator.name || creator.username}
        </p>
        <p className="font-['JetBrains_Mono'] text-[11px]" style={{ color: t.txt2 }}>@{creator.username}</p>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const stats = useStats();
  const { posts: trendingPosts, loading: postsLoading } = useTrendingPosts();
  const { creators, loading: creatorsLoading } = useFeaturedCreators();

  /* ── Vanta Globe Background ── */
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadScript = (src, globalName) =>
      new Promise((resolve, reject) => {
        // If the global already exists, no need to load
        if (window[globalName]) { resolve(); return; }

        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          // Script tag exists but global not ready yet — wait for it
          const check = setInterval(() => {
            if (window[globalName]) { clearInterval(check); resolve(); }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error(`${globalName} timed out`)); }, 10000);
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          // Wait a tick for the global to register
          const check = setInterval(() => {
            if (window[globalName]) { clearInterval(check); resolve(); }
          }, 50);
          setTimeout(() => { clearInterval(check); reject(new Error(`${globalName} timed out`)); }, 5000);
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });

    const init = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js', 'THREE');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js', 'VANTA');
        if (cancelled || !vantaRef.current || !window.VANTA) return;
        if (vantaEffect.current) vantaEffect.current.destroy();
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          size: 1.5,
          color: isDark ? 0x3B7CFF : 0x2563EB,
          color2: isDark ? 0x34C77B : 0x059669,
          backgroundColor: isDark ? 0x0F172A : 0xFFFFFF,
        });
        // Ensure the Vanta canvas sits behind content but above patterns
        const canvas = vantaRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.style.zIndex = '1';
        }
      } catch (err) {
        console.warn('Vanta Globe failed to load:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [isDark]);

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
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToEmail = () => {
    const el = document.getElementById('hero-email');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  return (
    <>
      <Helmet>
        <title>FocusGram — Elite Developer Platform</title>
        <meta name="description" content="The unified platform for developers to ship, share, and connect." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <MotionConfig reducedMotion="user">
        <div
          className="relative min-h-screen w-full selection:bg-[#2563EB] selection:text-white overflow-x-hidden font-['Inter'] transition-colors duration-200"
          style={{
            background: t.bg,
            color: t.txt,
          }}
        >
          <GrainOverlay />
          {/* Signature pipeline stripe */}
          <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-[#2563EB] to-[#059669]" />

          {/* NAV */}
          <nav
            className="fixed top-[2px] left-0 right-0 z-50 h-16 px-5 sm:px-8 flex items-center justify-between backdrop-blur-md transition-colors"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <Link to="/" className="flex items-center" style={{ textDecoration: 'none' }}>
              <FocusGramBrand size={30} showSubtitle={true} />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[
                ['Academy', '#academy'],
                ['Courses', '#academy'],
                ['Community', '#community'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="font-['JetBrains_Mono'] text-[12px] font-medium uppercase tracking-wider transition-colors hover:text-[#2563EB]"
                  style={{ color: t.txt2 }}
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {user ? (
                <button
                  onClick={() => navigate('/feed')}
                  className="px-5 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md"
                  style={{
                    background: t.txt,
                    color: t.bg,
                    border: `1px solid ${t.txt}`,
                  }}
                >
                  Feed →
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex px-4 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] border transition-colors rounded-md"
                    style={{
                      borderColor: t.border,
                      color: t.txt2,
                    }}
                  >
                    Log in
                  </Link>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-5 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md"
                    style={{
                      background: t.txt,
                      color: t.bg,
                      border: `1px solid ${t.txt}`,
                    }}
                  >
                    Request access
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* HERO */}
          <section ref={vantaRef} className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-6 overflow-hidden" style={{ background: 'transparent' }}>
            <SectionPattern variant="grid" fade isDark={isDark} className="!z-[2]" />
            <Glow color="blue" className="-top-32 left-1/2 -translate-x-1/2 w-[800px] h-[480px] !z-[2]" />
            <Glow color="green" className="-bottom-40 -right-28 w-[500px] h-[380px] !z-[2]" />

            <div className="relative z-10 max-w-[760px] mx-auto text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 border px-3.5 py-2 mb-7 rounded-full"
                style={{ borderColor: t.border, background: t.surf }}
              >
                <span className="relative flex size-[7px]">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full size-[7px] bg-[#059669]" />
                </span>
                <span className="font-['JetBrains_Mono'] text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: t.txt2 }}>
                  Cohort 01 · Applications open
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk'] font-bold text-[clamp(2.15rem,8.6vw,4.6rem)] leading-[0.98] tracking-tight uppercase"
                style={{ color: t.txt }}
              >
                THE UNIFIED HOME
                <br />
                FOR{' '}
                <span className="bg-gradient-to-r from-[#2563EB] to-[#059669] bg-clip-text text-transparent">
                  ELITE DEVELOPERS
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mx-auto mt-5 max-w-[46ch] text-[15.5px] leading-7"
                style={{ color: t.txt2 }}
              >
                Bridge the gap between human communication and technical precision. Ship, share, and scale
                alongside developers already building what's next.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-9 max-w-[520px] mx-auto"
              >
                <TerminalWindow
                  tab="~/cpa-onboarding"
                  trigger="mount"
                  t={t}
                  isDark={isDark}
                  lines={[
                    { text: '$ npx cpa init --track=fullstack', cls: 'cmd' },
                    { text: '> scanning 1,204 member repositories…', cls: 'out' },
                    { text: '> matched: 3 senior mentors · 12 study pods', cls: 'out' },
                    { text: '✓ cohort seat reserved', cls: 'ok' },
                  ]}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-9"
              >
                <CountdownTimer launchDate={LAUNCH_DATE} t={t} isDark={isDark} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mx-auto mt-9 max-w-[440px]"
              >
                {!user ? (
                  <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2">
                    <label htmlFor="hero-email" className="sr-only">
                      Email address
                    </label>
                    <div
                      className="flex-1 flex items-center gap-2.5 border px-4 h-[50px] rounded-md transition-colors"
                      style={{ borderColor: t.border, background: t.surf }}
                    >
                      <Terminal className="size-4 text-[#2563EB] shrink-0" />
                      <input
                        id="hero-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.dev"
                        disabled={joined || submitting}
                        required
                        className="flex-1 min-w-0 bg-transparent font-['JetBrains_Mono'] text-[13px] outline-none"
                        style={{ color: t.txt }}
                      />
                    </div>
                    {joined ? (
                      <span className="flex items-center justify-center gap-2 h-[50px] px-6 border border-[#059669] bg-[#059669]/10 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] text-[#059669] rounded-md">
                        <Check className="size-3.5" /> You're on the list
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="relative h-[50px] px-7 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md disabled:opacity-60"
                        style={{
                          background: t.txt,
                          color: t.bg,
                          border: `1px solid ${t.txt}`,
                        }}
                      >
                        {submitting ? 'Connecting…' : 'Request access'}
                      </button>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={() => navigate('/feed')}
                    className="px-8 py-3.5 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md"
                    style={{
                      background: t.txt,
                      color: t.bg,
                      border: `1px solid ${t.txt}`,
                    }}
                  >
                    Enter feed →
                  </button>
                )}
                <p className="mt-4 font-['JetBrains_Mono'] text-[11px]" style={{ color: t.txt2 }} aria-live="polite">
                  {!stats.loading && stats.users ? (
                    <>
                      <span className="font-semibold" style={{ color: t.txt }}>{stats.users.toLocaleString()}</span>{' '}
                      developers already on the list ·{' '}
                    </>
                  ) : null}
                  Cohort 01 opens Jan 2027
                </p>
              </motion.div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="academy" className="relative overflow-hidden border-t py-16 md:py-24" style={{ borderColor: t.border }}>
            <SectionPattern variant="dots" fade isDark={isDark} />
            <Glow color="purple" className="-right-40 -top-40 h-[420px] w-[520px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="mb-11"
              >
                <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB] mb-3">
                  / Academy core
                </p>
                <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold uppercase tracking-tight leading-[1.05]" style={{ color: t.txt }}>
                  Built for how you actually work
                </h2>
              </motion.div>

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
              >
                {FEATURES.map((feat, idx) => (
                  <motion.div
                    key={feat.key}
                    variants={fadeUp}
                    custom={idx}
                    className="p-6 transition-colors rounded-lg"
                    style={{
                      border: `1px solid ${t.border}`,
                      background: t.surf,
                      boxShadow: t.shadowSm,
                    }}
                  >
                    <div
                      className="mb-6 flex size-[38px] items-center justify-center rounded-md"
                      style={{ backgroundColor: `${feat.color}1F`, color: feat.color }}
                    >
                      <feat.Icon className="size-[22px]" />
                    </div>
                    <h3 className="font-['Space_Grotesk'] text-[15.5px] font-bold uppercase tracking-tight mb-2.5" style={{ color: t.txt }}>
                      {feat.title}
                    </h3>
                    <p className="text-[13px] leading-6" style={{ color: t.txt2 }}>{feat.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* GITHUB SYNC */}
          <section className="relative overflow-hidden border-t py-16 md:py-24" style={{ borderColor: t.border, background: t.bg2 }}>
            <SectionPattern variant="grid" isDark={isDark} />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden p-7 sm:p-11 rounded-lg"
                style={{
                  border: `1px solid ${t.border}`,
                  background: t.surf,
                  boxShadow: t.shadowSm,
                }}
              >
                <GitGraphMotif className="right-[-30px] top-1/2 hidden -translate-y-1/2 opacity-40 lg:block" isDark={isDark} />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="inline-flex items-center gap-1.5 border border-[#059669] text-[#059669] font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 mb-4 rounded">
                      Auto sync
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[clamp(1.2rem,3.4vw,1.65rem)] font-bold uppercase tracking-tight mb-3.5" style={{ color: t.txt }}>
                      Github repository sync
                    </h3>
                    <p className="text-[14px] leading-7 max-w-[42ch]" style={{ color: t.txt2 }}>
                      Connect your repositories and Code+ Academy suggests modules based on the stack you
                      actually use — no generic curriculum.
                    </p>
                  </div>
                  <TerminalWindow
                    tab="academy-sync.sh"
                    trigger="inView"
                    t={t}
                    isDark={isDark}
                    lines={[
                      { text: '$ git checkout academy-main', cls: 'cmd' },
                      { text: "Switched to branch 'academy-main'", cls: 'out' },
                      { text: '$ cpa sync --user=you', cls: 'cmd' },
                      { text: 'Analyzing dependency graph…', cls: 'out' },
                      { text: '✓ Rust core patterns matched (Advanced)', cls: 'ok' },
                      { text: '✓ 4 modules queued for your track', cls: 'ok' },
                    ]}
                  />
                </div>
              </motion.div>
            </div>
          </section>

          {/* TRENDING */}
          <section id="feed" className="relative overflow-hidden border-t py-16 md:py-24" style={{ borderColor: t.border }}>
            <Glow color="blue" className="-left-36 -top-36 h-[380px] w-[480px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-11">
                <div>
                  <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB] mb-3">
                    / Live feed
                  </p>
                  <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold uppercase tracking-tight leading-[1.05]" style={{ color: t.txt }}>
                    Trending on CPA
                  </h2>
                </div>
                <button
                  onClick={() => navigate(user ? '/feed' : '/register')}
                  className="inline-flex items-center gap-1.5 border px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors rounded-md shrink-0"
                  style={{ borderColor: t.border, color: t.txt2, background: t.surf }}
                >
                  View feed <ArrowUpRight className="size-3.5" />
                </button>
              </div>

              {postsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PostCardSkeleton key={i} t={t} />
                  ))}
                </div>
              ) : trendingPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {trendingPosts.map((post) => (
                    <PostCard key={post.id} post={post} t={t} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Inbox}
                  title="The feed unlocks at launch"
                  copy="Founding members get first-post priority when Cohort 01 goes live."
                  ctaLabel="Join the waitlist"
                  onCta={scrollToEmail}
                  t={t}
                />
              )}
            </div>
          </section>

          {/* CREATORS */}
          <section id="community" className="relative overflow-hidden border-t py-16 md:py-24" style={{ borderColor: t.border, background: t.bg2 }}>
            <SectionPattern variant="dots" fade isDark={isDark} />
            <Glow color="purple" className="-bottom-40 -right-24 h-[380px] w-[460px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <div className="mb-11">
                <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB] mb-3">
                  / Community leaders
                </p>
                <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold uppercase tracking-tight leading-[1.05]" style={{ color: t.txt }}>
                  Featured creators
                </h2>
              </div>

              {creatorsLoading ? (
                <div className="max-w-[560px] flex flex-col gap-2.5">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <CreatorRowSkeleton key={i} t={t} />
                  ))}
                </div>
              ) : creators.length > 0 ? (
                <div className="max-w-[560px] flex flex-col gap-2.5">
                  {creators.map((c) => (
                    <CreatorRow key={c.id} creator={c} t={t} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Sparkles}
                  title="Founding creator badges are still open"
                  copy="Be one of the first 25 creators recognized when the platform launches."
                  ctaLabel="Apply as a creator"
                  onCta={scrollToEmail}
                  t={t}
                />
              )}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="relative overflow-hidden border-t py-20 md:py-28 text-center px-6" style={{ borderColor: t.border }}>
            <SectionPattern variant="grid" className="opacity-60" isDark={isDark} />
            <Glow color="blue" className="-top-44 left-[12%] h-[420px] w-[520px]" />
            <Glow color="green" className="-top-44 right-[12%] h-[420px] w-[520px]" />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <h2 className="font-['Space_Grotesk'] text-[clamp(1.7rem,6vw,3rem)] font-bold uppercase tracking-tight leading-[1.05] max-w-[15ch] mx-auto" style={{ color: t.txt }}>
                Don't maintain legacy.
                <br />
                Build what's next.
              </h2>
              <p className="mt-4 text-[14.5px] max-w-[44ch] mx-auto" style={{ color: t.txt2 }}>
                Join the private waitlist and get first access to Cohort 01.
              </p>
              <button
                onClick={scrollToEmail}
                className="relative mt-7 inline-flex px-8 py-3.5 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-[0.12em] transition-colors rounded-md"
                style={{
                  background: t.txt,
                  color: t.bg,
                  border: `1px solid ${t.txt}`,
                }}
              >
                Join the waitlist
              </button>
            </motion.div>
          </section>

          {/* FOOTER */}
          <footer className="border-t py-11 px-6" style={{ borderColor: t.border, background: t.bg2 }}>
            <div className="mx-auto max-w-[1180px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b" style={{ borderColor: t.border }}>
                <Link to="/" className="flex items-center" style={{ textDecoration: 'none' }}>
                  <FocusGramBrand size={26} showSubtitle={true} />
                </Link>
                <div className="flex flex-wrap gap-5">
                  {['Documentation', 'Privacy', 'Terms', 'Support', 'FAQ'].map((l) => (
                    <a
                      key={l}
                      href="#top"
                      className="font-['JetBrains_Mono'] text-[11px] transition-colors hover:text-[#2563EB]"
                      style={{ color: t.txt2 }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-5">
                <p className="font-['JetBrains_Mono'] text-[10.5px]" style={{ color: t.txt3 }}>
                  © {new Date().getFullYear()} FocusGram (powered by Code Plus Academy). Engineered for the next generation.
                </p>
                <p className="font-['JetBrains_Mono'] text-[10.5px]" style={{ color: t.txt3 }}>Beta · beta.focusgram.in</p>
              </div>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </>
  );
}
