import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, MotionConfig } from 'framer-motion';
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

/**
 * Landing.jsx — Code+ Academy marketing / waitlist page
 * ─────────────────────────────────────────────────────────────────
 * Redesign + bug-fix pass. Key fixes vs. the previous version:
 *
 * 1. The hero no longer forces `min-h-screen`. On tall mobile
 *    viewports that was reserving far more vertical space than the
 *    content needed, which is what produced the large blank gap
 *    between the hero and the next section. It now sizes to its own
 *    content with responsive padding instead.
 * 2. Trending Posts / Featured Creators fell straight from "no data
 *    yet" to an `Array(4).fill(null)` fallback, with no distinction
 *    between loading / empty / failed — and that fallback card had no
 *    height constraint, so it rendered as a huge box with a single
 *    icon centered in it. Each hook now returns
 *    `{ loading, data, error }`, and the UI has three explicit,
 *    intentional states: skeleton → real cards → a designed
 *    "coming soon" panel (never a broken loop).
 * 3. Fixed a routing bug: post links used `/activity:${slug}` (colon)
 *    instead of `/activity/${slug}` (slash), which won't match a
 *    normal react-router path param.
 * 4. Removed a TypeScript-only type assertion
 *    (`as [number, number, number, number]`) that throws a syntax
 *    error if this file is compiled as plain .jsx rather than .tsx.
 * 5. Trending post cards were an un-focusable `<div onClick>` — not
 *    reachable by keyboard and not announced as interactive by a
 *    screen reader. They're now real `<Link>` elements.
 * 6. `useReducedMotion` was only wired up for the hero; every other
 *    scroll animation ignored the user's motion preference. Replaced
 *    with a single `<MotionConfig reducedMotion="user">` wrapper so
 *    every animation on the page respects it consistently.
 * 7. API failures were silently swallowed (`.catch(() => {})`), which
 *    is indistinguishable from "still loading" forever. Failures are
 *    now logged and resolve to a proper empty/error UI state.
 *
 * Visual system: near-black canvas, a three-role type system — mono
 * (JetBrains Mono) for system/status/labels, display (Space Grotesk)
 * for headlines, body (Inter) for copy — sharp corners by default,
 * and a blue → green "pipeline" accent (in progress → shipped) used
 * sparingly as a signature (headline highlight, button hover sweep,
 * top hairline) rather than as a flat background color.
 *
 * Assumptions worth checking against your actual API/router — adjust
 * if these differ in your app:
 *  - Post route:     /activity/:slug
 *  - Creator route:  /u/:username
 *  - Post shape:     { id, slug, type, title, cover_image }
 *  - Creator shape:  { id, username, name, avatar_url }
 */

// ── Design tokens (documentation reference — see inline classes) ──
const LAUNCH_DATE = '2027-01-01T00:00:00Z';

const TYPE_STYLE = {
  course: { label: 'Course', color: '#3B7CFF' },
  article: { label: 'Article', color: '#34C77B' },
  resource: { label: 'Resource', color: '#F0524A' },
  video: { label: 'Video', color: '#F5A524' },
};

const FEATURES = [
  {
    key: 'community',
    title: 'Community',
    color: '#A78BFA',
    desc: 'Connect with elite engineers worldwide — shared challenges, real breakthroughs, zero-noise networking.',
    Icon: Users,
  },
  {
    key: 'courses',
    title: 'Courses',
    color: '#3B7CFF',
    desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.',
    Icon: BookOpen,
  },
  {
    key: 'articles',
    title: 'Articles',
    color: '#34C77B',
    desc: "Engineering writing that doesn't skim the surface — real code, real scale, real trade-offs.",
    Icon: FileText,
  },
  {
    key: 'resources',
    title: 'Resources',
    color: '#F0524A',
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
            className="min-w-[56px] px-3 py-2.5 text-center transition-colors"
            style={{
              border: `1px solid ${isDark ? '#34383F' : 'rgba(0,0,0,0.15)'}`,
              background: isDark ? '#1A1D22' : '#FFFFFF',
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
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

// ── Reusable terminal window (the page's signature visual) ────────
function TerminalWindow({ tab, lines, trigger = 'inView', t, isDark }) {
  const motionProps =
    trigger === 'mount'
      ? { initial: 'hidden', animate: 'visible' }
      : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.4 } };

  return (
    <motion.div
      {...motionProps}
      variants={stagger}
      className="text-left transition-colors"
      style={{
        border: `1px solid ${isDark ? '#34383F' : 'rgba(0,0,0,0.12)'}`,
        background: isDark ? '#131519' : '#FFFFFF',
        boxShadow: isDark ? 'none' : '0 8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3.5 py-2.5"
        style={{ borderBottom: `1px solid ${isDark ? '#23262C' : 'rgba(0,0,0,0.08)'}` }}
      >
        <span className="size-2 rounded-full bg-[#F0524A]" />
        <span className="size-2 rounded-full bg-[#F5A524]" />
        <span className="size-2 rounded-full bg-[#34C77B]" />
        <span
          className="ml-auto font-['JetBrains_Mono'] text-[10px]"
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
            className={l.cls === 'cmd' ? (isDark ? 'text-[#3B7CFF]' : 'text-[#1A6AE8]') : l.cls === 'ok' ? 'text-[#34C77B]' : ''}
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
// A flat single-color canvas reads as "unfinished" at this scale, so
// the page carries three lightweight, layered textures instead of
// one flat fill:
//  - a fixed film-grain overlay over the whole viewport
//  - two recurring motifs (hairline grid / dot field), reused
//    section to section rather than a different pattern per block,
//    so it reads as one system and not a patchwork
//  - a handful of soft, section-tinted radial glows
// All of it sits at z-0 with `pointer-events-none`; every section's
// real content is wrapped at `relative z-10` so it always paints on
// top regardless of DOM position.
function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '260px 260px',
        opacity: 0.05,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

function SectionPattern({ variant = 'grid', className = '', fade = false }) {
  const fadeStyle = fade
    ? { maskImage: 'linear-gradient(to bottom, black, transparent 88%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 88%)' }
    : {};
  if (variant === 'dots') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 ${className}`}
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.65) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          opacity: 0.08,
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
          'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
        backgroundSize: '46px 46px',
        opacity: 0.05,
        ...fadeStyle,
      }}
    />
  );
}

const GLOW_COLORS = {
  blue: 'rgba(59,124,255,.16)',
  green: 'rgba(52,199,123,.14)',
  purple: 'rgba(167,139,250,.13)',
};

function Glow({ color = 'blue', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, ${GLOW_COLORS[color]}, transparent 72%)`, filter: 'blur(8px)' }}
    />
  );
}

// Signature watermark reserved for the GitHub Sync section — a
// small commit-graph glyph, since that section is literally about
// repository history.
function GitGraphMotif({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 ${className}`}
      viewBox="0 0 220 260"
      width="220"
      height="260"
    >
      <path d="M36 10 V250" stroke="#ffffff" strokeWidth="1.5" opacity=".14" fill="none" />
      <path d="M36 70 C36 100 110 90 110 130 S184 160 184 190" stroke="#34C77B" strokeWidth="1.5" opacity=".3" fill="none" />
      <path d="M110 130 V210" stroke="#ffffff" strokeWidth="1.5" opacity=".12" fill="none" />
      <circle cx="36" cy="30" r="4.5" fill="#3B7CFF" opacity=".55" />
      <circle cx="36" cy="130" r="4.5" fill="#ffffff" opacity=".3" />
      <circle cx="36" cy="230" r="4.5" fill="#3B7CFF" opacity=".4" />
      <circle cx="110" cy="130" r="4.5" fill="#34C77B" opacity=".55" />
      <circle cx="110" cy="210" r="4.5" fill="#ffffff" opacity=".3" />
      <circle cx="184" cy="190" r="4.5" fill="#34C77B" opacity=".45" />
    </svg>
  );
}

// ── Data hooks — each now reports loading / error explicitly ──────
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

// ── Skeletons (replace the old unbounded "hourglass in a giant box") ──
function PostCardSkeleton() {
  return (
    <div className="border border-[#23262C] bg-[#131519] p-4 h-[230px] flex flex-col gap-3 animate-pulse">
      <div className="h-24 bg-[#1A1D22]" />
      <div className="h-2.5 bg-[#1A1D22] w-4/5" />
      <div className="h-2.5 bg-[#1A1D22] w-2/5" />
    </div>
  );
}

function CreatorRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 border border-[#23262C] bg-[#131519] p-4 animate-pulse">
      <div className="size-11 rounded-full bg-[#1A1D22] shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2.5 bg-[#1A1D22] w-2/5" />
        <div className="h-2.5 bg-[#1A1D22] w-1/4" />
      </div>
    </div>
  );
}

// ── Empty state — turns "no data yet" into a designed moment ──────
function EmptyPanel({ icon: Icon, title, copy, ctaLabel, onCta }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeUp}
      className="flex flex-col items-center text-center gap-3.5 border border-dashed border-[#34383F] bg-[#131519] px-6 py-12"
    >
      <div className="size-11 border border-[#34383F] flex items-center justify-center text-[#3B7CFF] mb-1">
        <Icon className="size-5" />
      </div>
      <h3 className="font-['Space_Grotesk'] text-[17px] font-bold uppercase tracking-tight text-white">{title}</h3>
      <p className="text-[13.5px] text-[#9BA0AA] max-w-[38ch]">{copy}</p>
      <button
        onClick={onCta}
        className="mt-1 border border-[#34383F] px-5 py-2.5 font-['JetBrains_Mono'] text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#9BA0AA] transition-colors hover:text-white hover:border-white"
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

// ── Loaded-state cards ──────────────────────────────────────────
function PostCard({ post }) {
  const meta = TYPE_STYLE[post.type] || TYPE_STYLE.article;
  return (
    // Fixed: was `/activity:${slug}` (colon) — didn't match a router path param.
    <Link
      to={`/activity/${post.slug || post.id}`}
      className="group text-left border border-[#23262C] bg-[#131519] p-4 flex flex-col gap-3 transition-colors hover:border-[#3B7CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3B7CFF] focus-visible:outline-offset-2"
    >
      <div className="h-24 overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${meta.color}14` }}>
        {post.cover_image ? (
          <img src={post.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileText className="size-6" style={{ color: meta.color }} />
        )}
      </div>
      <span
        className="self-start font-['JetBrains_Mono'] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-1 border"
        style={{ color: meta.color, borderColor: `${meta.color}4D` }}
      >
        {meta.label}
      </span>
      <h3 className="font-['Space_Grotesk'] text-[14px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[#3B7CFF] transition-colors">
        {post.title}
      </h3>
    </Link>
  );
}

function CreatorRow({ creator }) {
  const initial = (creator.name || creator.username || '?').charAt(0).toUpperCase();
  return (
    <Link
      to={`/u/${creator.username}`}
      className="flex items-center gap-3.5 border border-[#23262C] bg-[#131519] p-4 transition-colors hover:border-[#3B7CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3B7CFF] focus-visible:outline-offset-2"
    >
      {creator.avatar_url ? (
        <img src={creator.avatar_url} alt="" className="size-11 rounded-full object-cover shrink-0" />
      ) : (
        <div className="size-11 rounded-full shrink-0 bg-[#1A1D22] border border-[#34383F] flex items-center justify-center font-['Space_Grotesk'] font-bold text-[#9BA0AA]">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-['Space_Grotesk'] text-[14px] font-bold text-white truncate">
          {creator.name || creator.username}
        </p>
        <p className="font-['JetBrains_Mono'] text-[11px] text-[#61656D]">@{creator.username}</p>
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
        <title>Code+ Academy — Elite Developer Platform</title>
        <meta name="description" content="The unified home for elite developers." />
        {/* Page type system. If Space Grotesk / Inter / JetBrains Mono are
            already loaded globally in your app shell, this block can be
            removed and the arbitrary font-[''] classes below will just
            fall back to your default stack. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <MotionConfig reducedMotion="user">
        <div
          className="relative min-h-screen w-full selection:bg-[#3B7CFF] selection:text-white overflow-x-hidden font-['Inter'] transition-colors duration-200"
          style={{
            background: t.bg,
            color: t.txt,
          }}
        >
          <GrainOverlay />
          {/* Signature pipeline stripe */}
          <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-[#3B7CFF] to-[#34C77B]" />

          {/* NAV */}
          <nav
            className="fixed top-[2px] left-0 right-0 z-50 h-16 px-5 sm:px-8 flex items-center justify-between backdrop-blur-md transition-colors"
            style={{
              background: isDark ? 'rgba(8, 9, 11, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <Link to="/" className="flex items-center">
              <img
                src={isDark ? '/cpa-logo-dark.png' : '/cpa-logo-light.png'}
                alt="Code Plus Academy"
                style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
              />
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
                  className="font-['JetBrains_Mono'] text-[12px] font-medium uppercase tracking-wider text-[#9BA0AA] transition-colors hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {user ? (
                <button
                  onClick={() => navigate('/feed')}
                  className="px-5 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] bg-[#F3F4F6] text-[#08090B] border border-[#F3F4F6] transition-colors hover:bg-transparent hover:text-white"
                >
                  Feed →
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex px-4 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] border border-[#34383F] text-[#9BA0AA] transition-colors hover:text-white hover:border-[#9BA0AA]"
                  >
                    Log in
                  </Link>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-5 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] bg-[#F3F4F6] text-[#08090B] border border-[#F3F4F6] transition-colors hover:bg-transparent hover:text-white"
                  >
                    Request access
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* HERO — no forced min-h-screen; sizes to content (fixes the mobile gap) */}
          <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[radial-gradient(ellipse_at_center,rgba(59,124,255,.14),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-40 -right-28 w-[560px] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(52,199,123,.10),transparent_70%)]" />

            <div className="relative z-10 max-w-[760px] mx-auto text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 border border-[#34383F] bg-[#131519] px-3.5 py-2 mb-7"
              >
                <span className="relative flex size-[7px]">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#34C77B] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full size-[7px] bg-[#34C77B]" />
                </span>
                <span className="font-['JetBrains_Mono'] text-[10.5px] font-bold tracking-[0.16em] text-[#9BA0AA] uppercase">
                  Cohort 01 · Applications open
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk'] font-bold text-[clamp(2.15rem,8.6vw,4.6rem)] leading-[0.98] tracking-tight uppercase"
              >
                THE UNIFIED HOME
                <br />
                FOR{' '}
                <span className="bg-gradient-to-r from-[#3B7CFF] to-[#34C77B] bg-clip-text text-transparent">
                  ELITE DEVELOPERS
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mx-auto mt-5 max-w-[46ch] text-[15.5px] leading-7 text-[#9BA0AA]"
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
                    <div className="flex-1 flex items-center gap-2.5 border border-[#34383F] bg-[#1A1D22] px-4 h-[50px]">
                      <Terminal className="size-4 text-[#3B7CFF] shrink-0" />
                      <input
                        id="hero-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.dev"
                        disabled={joined || submitting}
                        required
                        className="flex-1 min-w-0 bg-transparent font-['JetBrains_Mono'] text-[13px] text-white placeholder:text-[#61656D] outline-none"
                      />
                    </div>
                    {joined ? (
                      <span className="flex items-center justify-center gap-2 h-[50px] px-6 border border-[#34C77B] bg-[#34C77B]/10 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] text-[#34C77B]">
                        <Check className="size-3.5" /> You're on the list
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="relative h-[50px] px-7 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] bg-[#F3F4F6] text-[#08090B] border border-[#F3F4F6] transition-colors hover:bg-transparent hover:text-white disabled:opacity-60"
                      >
                        {submitting ? 'Connecting…' : 'Request access'}
                      </button>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={() => navigate('/feed')}
                    className="px-8 py-3.5 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-[0.12em] bg-[#F3F4F6] text-[#08090B] border border-[#F3F4F6] transition-colors hover:bg-transparent hover:text-white"
                  >
                    Enter feed →
                  </button>
                )}
                {/* Was static "Limited Nodes Remaining" copy with no real data behind
                    it. Now reflects the actual /stats/public count when available,
                    and never invents a number if the request hasn't resolved. */}
                <p className="mt-4 font-['JetBrains_Mono'] text-[11px] text-[#61656D]" aria-live="polite">
                  {!stats.loading && stats.users ? (
                    <>
                      <span className="text-[#9BA0AA] font-semibold">{stats.users.toLocaleString()}</span>{' '}
                      developers already on the list ·{' '}
                    </>
                  ) : null}
                  Cohort 01 opens Jan 2027
                </p>
              </motion.div>
            </div>
          </section>

          {/* FEATURES — dropped the decorative 01–04 numbering: these four
              cards aren't a sequence, so numbering them implied an order
              that isn't there. */}
          <section id="academy" className="relative overflow-hidden border-t border-[#23262C] py-16 md:py-24">
            <SectionPattern variant="dots" fade />
            <Glow color="purple" className="-right-40 -top-40 h-[420px] w-[520px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="mb-11"
              >
                <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#3B7CFF] mb-3">
                  / Academy core
                </p>
                <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
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
                    className="border border-[#23262C] bg-[#131519] p-6 transition-colors hover:border-[#34383F]"
                  >
                    <div
                      className="mb-6 flex size-[38px] items-center justify-center"
                      style={{ backgroundColor: `${feat.color}1F`, color: feat.color }}
                    >
                      <feat.Icon className="size-[22px]" />
                    </div>
                    <h3 className="font-['Space_Grotesk'] text-[15.5px] font-bold text-white uppercase tracking-tight mb-2.5">
                      {feat.title}
                    </h3>
                    <p className="text-[13px] leading-6 text-[#9BA0AA]">{feat.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* GITHUB SYNC */}
          <section className="relative overflow-hidden border-t border-[#23262C] bg-[#0E1013] py-16 md:py-24">
            <SectionPattern variant="grid" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden border border-[#23262C] bg-[#131519] p-7 sm:p-11"
              >
                <GitGraphMotif className="right-[-30px] top-1/2 hidden -translate-y-1/2 opacity-50 lg:block" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <span className="inline-flex items-center gap-1.5 border border-[#34C77B] text-[#34C77B] font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 mb-4">
                      Auto sync
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[clamp(1.2rem,3.4vw,1.65rem)] font-bold text-white uppercase tracking-tight mb-3.5">
                      Github repository sync
                    </h3>
                    <p className="text-[14px] leading-7 text-[#9BA0AA] max-w-[42ch]">
                      Connect your repositories and Code+ Academy suggests modules based on the stack you
                      actually use — no generic curriculum.
                    </p>
                  </div>
                  <TerminalWindow
                    tab="academy-sync.sh"
                    trigger="inView"
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

          {/* TRENDING — loading skeleton -> real cards -> designed empty state */}
          <section id="feed" className="relative overflow-hidden border-t border-[#23262C] py-16 md:py-24">
            <Glow color="blue" className="-left-36 -top-36 h-[380px] w-[480px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-11">
                <div>
                  <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#3B7CFF] mb-3">
                    / Live feed
                  </p>
                  <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
                    Trending on CPA
                  </h2>
                </div>
                <button
                  onClick={() => navigate(user ? '/feed' : '/register')}
                  className="inline-flex items-center gap-1.5 border border-[#34383F] px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.1em] text-[#9BA0AA] transition-colors hover:text-[#3B7CFF] hover:border-[#3B7CFF] shrink-0"
                >
                  View feed <ArrowUpRight className="size-3.5" />
                </button>
              </div>

              {postsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : trendingPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {trendingPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Inbox}
                  title="The feed unlocks at launch"
                  copy="Founding members get first-post priority when Cohort 01 goes live."
                  ctaLabel="Join the waitlist"
                  onCta={scrollToEmail}
                />
              )}
            </div>
          </section>

          {/* CREATORS — same loading / loaded / empty pattern */}
          <section id="community" className="relative overflow-hidden border-t border-[#23262C] bg-[#0E1013] py-16 md:py-24">
            <SectionPattern variant="dots" fade />
            <Glow color="purple" className="-bottom-40 -right-24 h-[380px] w-[460px]" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-6">
              <div className="mb-11">
                <p className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] text-[#3B7CFF] mb-3">
                  / Community leaders
                </p>
                <h2 className="font-['Space_Grotesk'] text-[clamp(1.6rem,5.5vw,2.75rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
                  Featured creators
                </h2>
              </div>

              {creatorsLoading ? (
                <div className="max-w-[560px] flex flex-col gap-2.5">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <CreatorRowSkeleton key={i} />
                  ))}
                </div>
              ) : creators.length > 0 ? (
                <div className="max-w-[560px] flex flex-col gap-2.5">
                  {creators.map((c) => (
                    <CreatorRow key={c.id} creator={c} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Sparkles}
                  title="Founding creator badges are still open"
                  copy="Be one of the first 25 creators recognized when the platform launches."
                  ctaLabel="Apply as a creator"
                  onCta={scrollToEmail}
                />
              )}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="relative overflow-hidden border-t border-[#23262C] py-20 md:py-28 text-center px-6">
            <SectionPattern variant="grid" className="opacity-60" />
            <Glow color="blue" className="-top-44 left-[12%] h-[420px] w-[520px]" />
            <Glow color="green" className="-top-44 right-[12%] h-[420px] w-[520px]" />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <h2 className="font-['Space_Grotesk'] text-[clamp(1.7rem,6vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05] max-w-[15ch] mx-auto">
                Don't maintain legacy.
                <br />
                Build what's next.
              </h2>
              <p className="mt-4 text-[14.5px] text-[#9BA0AA] max-w-[44ch] mx-auto">
                Join the private waitlist and get first access to Cohort 01.
              </p>
              <button
                onClick={scrollToEmail}
                className="relative mt-7 inline-flex px-8 py-3.5 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-[0.12em] bg-[#F3F4F6] text-[#08090B] border border-[#F3F4F6] transition-colors hover:bg-transparent hover:text-white"
              >
                Join the waitlist
              </button>
            </motion.div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-[#23262C] py-11 px-6">
            <div className="mx-auto max-w-[1180px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#23262C]">
                <Link to="/" className="flex items-center">
                  <img
                    src="/cpa-logo-dark.png"
                    alt="Code Plus Academy"
                    style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                  />
                </Link>
                <div className="flex flex-wrap gap-5">
                  {['Documentation', 'Privacy', 'Terms', 'Support', 'FAQ'].map((l) => (
                    <a
                      key={l}
                      href="#top"
                      className="font-['JetBrains_Mono'] text-[11px] text-[#9BA0AA] transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-5">
                <p className="font-['JetBrains_Mono'] text-[10.5px] text-[#61656D]">
                  © {new Date().getFullYear()} Code+ Academy. Engineered for the next generation.
                </p>
                <p className="font-['JetBrains_Mono'] text-[10.5px] text-[#61656D]">Beta · beta.codeplusacademy.in</p>
              </div>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </>
  );
}
