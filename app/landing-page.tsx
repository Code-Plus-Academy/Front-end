'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/api/axios';
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
 * app/landing-page.tsx — Code+ Academy homepage
 * ─────────────────────────────────────────────────────────────────
 * Replaces the previous version of this file. `app/page.jsx` already
 * imports `LandingPage` from here by default export — nothing else
 * needs to change for this to go live.
 *
 * This is a re-skin of a separate redesign pass onto your *actual*
 * design system, confirmed from this repo rather than guessed:
 *  - Brand colors from src/styles/tokens.css: teal #00B4D8 + purple
 *    #9333EA (`--gradient-brand` is used directly for the signature
 *    accent, instead of an invented palette).
 *  - Fonts already loaded globally in app/layout.jsx: Clash Display
 *    (display), Geist (body), JetBrains Mono (system/labels). Both
 *    are applied here by relying on the cascade — index.css already
 *    sets `h1/h2/h3 { font-family: var(--font-display) }` and
 *    `body { font-family: var(--font-body) }` — so headings and
 *    paragraphs need no font class at all; only mono-voiced elements
 *    (labels, buttons, the terminal) set
 *    `font-[family-name:var(--font-mono)]` explicitly.
 *  - Rounded corners throughout (rounded-md/xl/2xl/full), matching
 *    how the rest of the app actually looks — not the sharp-cornered
 *    version from earlier drafts.
 *  - next/image for the logo, matching the Brand pattern already
 *    used elsewhere in app/.
 *  - Import paths fixed to `../src/context/AuthContext` and
 *    `../src/api/axios` (relative from app/, confirmed against your
 *    uploaded repo — no `@/` alias is configured in this project).
 *  - No `metadata` export here on purpose: app/layout.jsx already
 *    sets a strong default title/description/OG/Twitter/canonical
 *    for `/`, so this page inherits it rather than duplicating it.
 *
 * Bug fixes carried over from the redesign pass:
 * 1. Hero doesn't force `min-h-screen` — it sizes to its own content,
 *    which is what was producing a large blank gap on tall phones.
 * 2. Trending Posts / Featured Creators each report
 *    `{ loading, data, error }` explicitly and render one of three
 *    intentional states — skeleton → real cards → a designed
 *    "coming soon" panel — instead of a null-filled fallback with no
 *    height constraint (previously: a giant box with a lone icon).
 * 3. Post links use `/activity/${slug}` (slash) instead of a stray
 *    colon, so they actually match a route.
 * 4. Post/creator cards are real `<Link>` elements — keyboard- and
 *    screen-reader-accessible, not a `<div onClick>`.
 * 5. `<MotionConfig reducedMotion="user">` wraps the whole page, so
 *    every animation — not just the hero — respects the visitor's
 *    reduced-motion preference.
 * 6. API failures are logged and resolve to a real empty/error state
 *    instead of an infinite, silent "loading."
 *
 * Assumptions worth a quick check against your backend:
 *  - Post route:     /activity/:slug
 *  - Creator route:  /u/:username
 *  - Post shape:     { id, slug, type, title, cover_image }
 *  - Creator shape:  { id, username, name, avatar_url }
 */

const LAUNCH_DATE = '2027-01-01T00:00:00Z';

const TYPE_STYLE = {
  course: { label: 'Course', color: '#00B4D8' },
  article: { label: 'Article', color: '#FB923C' },
  resource: { label: 'Resource', color: '#ff4466' },
  video: { label: 'Video', color: '#ffd700' },
};

const FEATURES = [
  {
    key: 'community',
    title: 'Community',
    color: '#9333EA',
    desc: 'Connect with elite engineers worldwide — shared challenges, real breakthroughs, zero-noise networking.',
    Icon: Users,
  },
  {
    key: 'courses',
    title: 'Courses',
    color: '#00B4D8',
    desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.',
    Icon: BookOpen,
  },
  {
    key: 'articles',
    title: 'Articles',
    color: '#FB923C',
    desc: "Engineering writing that doesn't skim the surface — real code, real scale, real trade-offs.",
    Icon: FileText,
  },
  {
    key: 'resources',
    title: 'Resources',
    color: '#ff4466',
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

const MONO = "font-[family-name:var(--font-mono)]";

// ── Brand lockup — matches the Image pattern already used in app/ ─
function Brand({ compact = false }) {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Code Plus Academy home">
      <Image
        src="/cpa-logo-dark.png"
        alt="Code Plus Academy"
        width={compact ? 128 : 152}
        height={compact ? 36 : 42}
        className={compact ? 'h-8 w-auto object-contain' : 'h-9 w-auto object-contain'}
        priority
      />
    </Link>
  );
}

// ── Countdown ───────────────────────────────────────────────────
function useCountdown(target) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

function CountdownTimer({ launchDate }) {
  const time = useCountdown(launchDate);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex gap-2.5 justify-center flex-nowrap" aria-label="Countdown to Cohort 01 launch">
      {[
        ['Days', time.d],
        ['Hrs', time.h],
        ['Min', time.m],
        ['Sec', time.s],
      ].map(([label, val]) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="min-w-[56px] rounded-xl border border-white/[0.1] bg-[#141414] px-3 py-2.5 text-center">
            <span className={`${MONO} text-[20px] sm:text-[26px] font-bold text-[#e8edf2]`}>{pad(val)}</span>
          </div>
          <span className={`${MONO} text-[9px] font-bold tracking-[0.16em] text-[#4a5568] uppercase`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Reusable terminal window (the page's signature visual) ────────
function TerminalWindow({ tab, lines, trigger = 'inView' }) {
  const motionProps =
    trigger === 'mount'
      ? { initial: 'hidden', animate: 'visible' }
      : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.4 } };

  return (
    <motion.div {...motionProps} variants={stagger} className="rounded-2xl border border-white/[0.1] bg-[#0e0e0e] text-left overflow-hidden">
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.08]">
        <span className="size-2 rounded-full bg-[#ff4466]" />
        <span className="size-2 rounded-full bg-[#ffd700]" />
        <span className="size-2 rounded-full bg-[#00B4D8]" />
        <span className={`${MONO} ml-auto text-[10px] text-[#4a5568]`}>{tab}</span>
      </div>
      <div className={`${MONO} text-[12.5px] leading-[1.85] px-4 py-4`}>
        {lines.map((l, idx) => (
          <motion.p
            key={idx}
            variants={fadeUp}
            custom={idx}
            className={l.cls === 'cmd' ? 'text-[#00B4D8]' : l.cls === 'ok' ? 'text-[#9333EA]' : 'text-[#8899aa]'}
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
        style={{ backgroundImage: 'radial-gradient(rgba(0,180,216,.5) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px', opacity: 0.15, ...fadeStyle }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,180,216,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,216,.5) 1px,transparent 1px)',
        backgroundSize: '46px 46px',
        opacity: 0.06,
        ...fadeStyle,
      }}
    />
  );
}

const GLOW_COLORS = { teal: 'rgba(0,180,216,.18)', purple: 'rgba(147,51,234,.16)' };

function Glow({ color = 'teal', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, ${GLOW_COLORS[color]}, transparent 72%)`, filter: 'blur(8px)' }}
    />
  );
}

// Signature watermark reserved for the GitHub Sync section.
function GitGraphMotif({ className = '' }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute z-0 ${className}`} viewBox="0 0 220 260" width="220" height="260">
      <path d="M36 10 V250" stroke="#ffffff" strokeWidth="1.5" opacity=".14" fill="none" />
      <path d="M36 70 C36 100 110 90 110 130 S184 160 184 190" stroke="#9333EA" strokeWidth="1.5" opacity=".35" fill="none" />
      <path d="M110 130 V210" stroke="#ffffff" strokeWidth="1.5" opacity=".12" fill="none" />
      <circle cx="36" cy="30" r="4.5" fill="#00B4D8" opacity=".6" />
      <circle cx="36" cy="130" r="4.5" fill="#ffffff" opacity=".3" />
      <circle cx="36" cy="230" r="4.5" fill="#00B4D8" opacity=".4" />
      <circle cx="110" cy="130" r="4.5" fill="#9333EA" opacity=".6" />
      <circle cx="110" cy="210" r="4.5" fill="#ffffff" opacity=".3" />
      <circle cx="184" cy="190" r="4.5" fill="#9333EA" opacity=".5" />
    </svg>
  );
}

// ── Data hooks — each reports loading / error explicitly ──────────
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
function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-4 h-[230px] flex flex-col gap-3 animate-pulse">
      <div className="h-24 rounded-xl bg-[#141414]" />
      <div className="h-2.5 rounded bg-[#141414] w-4/5" />
      <div className="h-2.5 rounded bg-[#141414] w-2/5" />
    </div>
  );
}

function CreatorRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-4 animate-pulse">
      <div className="size-11 rounded-full bg-[#141414] shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2.5 rounded bg-[#141414] w-2/5" />
        <div className="h-2.5 rounded bg-[#141414] w-1/4" />
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
      className="flex flex-col items-center text-center gap-3.5 rounded-2xl border border-dashed border-white/[0.14] bg-[#0e0e0e] px-6 py-12"
    >
      <div className="size-11 rounded-xl border border-white/[0.12] flex items-center justify-center text-[#00B4D8] mb-1">
        <Icon className="size-5" />
      </div>
      <h3 className="text-[17px] font-semibold text-[#e8edf2]">{title}</h3>
      <p className="text-[13.5px] text-[#8899aa] max-w-[38ch]">{copy}</p>
      <button
        onClick={onCta}
        className={`${MONO} mt-1 rounded-md border border-white/[0.12] px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#8899aa] transition-colors hover:text-white hover:border-white/[0.3]`}
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
    <Link
      href={`/activity/${post.slug || post.id}`}
      className="group text-left rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-4 flex flex-col gap-3 transition-colors hover:border-[#00B4D8]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B4D8] focus-visible:outline-offset-2"
    >
      <div className="h-24 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${meta.color}14` }}>
        {post.cover_image ? (
          <img src={post.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileText className="size-6" style={{ color: meta.color }} />
        )}
      </div>
      <span
        className={`${MONO} self-start text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md border`}
        style={{ color: meta.color, borderColor: `${meta.color}4D` }}
      >
        {meta.label}
      </span>
      <h3 className="text-[14px] font-semibold text-[#e8edf2] leading-snug line-clamp-2 group-hover:text-[#00B4D8] transition-colors">
        {post.title}
      </h3>
    </Link>
  );
}

function CreatorRow({ creator }) {
  const initial = (creator.name || creator.username || '?').charAt(0).toUpperCase();
  return (
    <Link
      href={`/u/${creator.username}`}
      className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-4 transition-colors hover:border-[#00B4D8]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B4D8] focus-visible:outline-offset-2"
    >
      {creator.avatar_url ? (
        <img src={creator.avatar_url} alt="" className="size-11 rounded-full object-cover shrink-0" />
      ) : (
        <div className="size-11 rounded-full shrink-0 bg-gradient-to-br from-[#00B4D8] to-[#9333EA] flex items-center justify-center font-semibold text-black">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#e8edf2] truncate">{creator.name || creator.username}</p>
        <p className={`${MONO} text-[11px] text-[#4a5568]`}>@{creator.username}</p>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-black text-[#e8edf2] selection:bg-[#00B4D8] selection:text-black overflow-x-hidden">
        <GrainOverlay />
        {/* Signature pipeline stripe — your actual --gradient-brand token */}
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-[#00B4D8] to-[#9333EA]" />

        {/* NAV */}
        <nav className="fixed top-[2px] left-0 right-0 z-50 h-16 px-5 sm:px-8 flex items-center justify-between border-b border-white/[0.08] bg-black/90 backdrop-blur-md">
          <Brand />

          <div className="hidden md:flex items-center gap-8">
            {[
              ['Academy', '#academy'],
              ['Courses', '#academy'],
              ['Community', '#community'],
            ].map(([label, href]) => (
              <a key={label} href={href} className={`${MONO} text-[12px] font-medium uppercase tracking-wider text-[#8899aa] transition-colors hover:text-white`}>
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              <button
                onClick={() => router.push('/feed')}
                className="rounded-md bg-[#00B4D8] px-5 py-2 font-semibold text-black text-sm transition hover:bg-[#48d7f1]"
              >
                Feed →
              </button>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex text-sm text-[#8899aa] transition hover:text-white">
                  Log in
                </Link>
                <button
                  onClick={() => router.push('/register')}
                  className="rounded-md border border-[#00B4D8]/40 bg-[#00B4D8]/10 px-4 py-2 font-semibold text-sm text-[#00B4D8] transition hover:bg-[#00B4D8] hover:text-black"
                >
                  Request access
                </button>
              </>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-6 overflow-hidden">
          <SectionPattern variant="grid" fade className="opacity-80" />
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,.16),transparent_65%)]" />
          <div className="pointer-events-none absolute -bottom-40 -right-28 w-[560px] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,.14),transparent_70%)]" />

          <div className="relative z-10 max-w-[760px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#0e0e0e] px-3.5 py-2 mb-7"
            >
              <span className="relative flex size-[7px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00B4D8] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full size-[7px] bg-[#00B4D8]" />
              </span>
              <span className={`${MONO} text-[10.5px] font-bold tracking-[0.16em] text-[#8899aa] uppercase`}>
                Cohort 01 · Applications open
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2.25rem,7.4vw,4.25rem)] leading-[1.02] tracking-[-0.03em] font-semibold text-[#e8edf2]"
            >
              The unified home
              <br />
              for{' '}
              <span className="bg-gradient-to-r from-[#00B4D8] to-[#9333EA] bg-clip-text text-transparent">
                elite developers
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mx-auto mt-5 max-w-[46ch] text-[16px] leading-7 text-[#8899aa]"
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
              <CountdownTimer launchDate={LAUNCH_DATE} />
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
                  <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#141414] px-4 h-[50px]">
                    <Terminal className="size-4 text-[#00B4D8] shrink-0" />
                    <input
                      id="hero-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.dev"
                      disabled={joined || submitting}
                      required
                      className={`${MONO} flex-1 min-w-0 !bg-transparent !border-0 !p-0 !rounded-none text-[13px] text-white placeholder:text-[#4a5568] outline-none`}
                    />
                  </div>
                  {joined ? (
                    <span className="flex items-center justify-center gap-2 h-[50px] px-6 rounded-xl border border-[#9333EA]/40 bg-[#9333EA]/10 font-semibold text-[13px] text-[#c084fc]">
                      <Check className="size-3.5" /> You're on the list
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-[50px] px-7 rounded-xl bg-[#00B4D8] font-semibold text-black text-[14px] transition hover:bg-[#48d7f1] disabled:opacity-60"
                    >
                      {submitting ? 'Connecting…' : 'Request access'}
                    </button>
                  )}
                </form>
              ) : (
                <button
                  onClick={() => router.push('/feed')}
                  className="rounded-xl bg-[#00B4D8] px-8 py-3.5 font-semibold text-black text-[14px] transition hover:bg-[#48d7f1]"
                >
                  Enter feed →
                </button>
              )}
              {/* Reflects the real /stats/public count when available; never
                  invents a number if the request hasn't resolved. */}
              <p className={`${MONO} mt-4 text-[11px] text-[#4a5568]`} aria-live="polite">
                {!stats.loading && stats.users ? (
                  <>
                    <span className="text-[#8899aa] font-semibold">{stats.users.toLocaleString()}</span>{' '}
                    developers already on the list ·{' '}
                  </>
                ) : null}
                Cohort 01 opens Jan 2027
              </p>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="academy" className="relative overflow-hidden border-t border-white/[0.08] py-16 md:py-24">
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
              <p className={`${MONO} text-[11px] font-bold uppercase tracking-[0.18em] text-[#00B4D8] mb-3`}>
                / Academy core
              </p>
              <h2 className="text-[clamp(1.6rem,5vw,2.5rem)] font-semibold tracking-[-0.02em] text-[#e8edf2]">
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
                  className="rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-6 transition-colors hover:border-white/[0.18]"
                >
                  <div
                    className="mb-6 flex size-[38px] items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${feat.color}1F`, color: feat.color }}
                  >
                    <feat.Icon className="size-[22px]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#e8edf2] mb-2.5">{feat.title}</h3>
                  <p className="text-[13px] leading-6 text-[#8899aa]">{feat.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* GITHUB SYNC */}
        <section className="relative overflow-hidden border-t border-white/[0.08] bg-[#0e0e0e]/60 py-16 md:py-24">
          <SectionPattern variant="grid" />
          <div className="relative z-10 mx-auto max-w-[1180px] px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black p-7 sm:p-11"
            >
              <GitGraphMotif className="right-[-30px] top-1/2 hidden -translate-y-1/2 opacity-60 lg:block" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className={`${MONO} inline-flex items-center gap-1.5 rounded-full border border-[#9333EA]/40 text-[#c084fc] text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 mb-4`}>
                    Auto sync
                  </span>
                  <h3 className="text-[clamp(1.2rem,3.4vw,1.6rem)] font-semibold text-[#e8edf2] mb-3.5">
                    Github repository sync
                  </h3>
                  <p className="text-[14px] leading-7 text-[#8899aa] max-w-[42ch]">
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
        <section id="feed" className="relative overflow-hidden border-t border-white/[0.08] py-16 md:py-24">
          <Glow color="teal" className="-left-36 -top-36 h-[380px] w-[480px]" />
          <div className="relative z-10 mx-auto max-w-[1180px] px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 mb-11">
              <div>
                <p className={`${MONO} text-[11px] font-bold uppercase tracking-[0.18em] text-[#00B4D8] mb-3`}>
                  / Live feed
                </p>
                <h2 className="text-[clamp(1.6rem,5vw,2.5rem)] font-semibold tracking-[-0.02em] text-[#e8edf2]">
                  Trending on CPA
                </h2>
              </div>
              <button
                onClick={() => router.push(user ? '/feed' : '/register')}
                className={`${MONO} inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8899aa] transition-colors hover:text-[#00B4D8] hover:border-[#00B4D8]/40 shrink-0`}
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
        <section id="community" className="relative overflow-hidden border-t border-white/[0.08] bg-[#0e0e0e]/60 py-16 md:py-24">
          <SectionPattern variant="dots" fade />
          <Glow color="purple" className="-bottom-40 -right-24 h-[380px] w-[460px]" />
          <div className="relative z-10 mx-auto max-w-[1180px] px-6">
            <div className="mb-11">
              <p className={`${MONO} text-[11px] font-bold uppercase tracking-[0.18em] text-[#00B4D8] mb-3`}>
                / Community leaders
              </p>
              <h2 className="text-[clamp(1.6rem,5vw,2.5rem)] font-semibold tracking-[-0.02em] text-[#e8edf2]">
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
        <section className="relative overflow-hidden border-t border-white/[0.08] py-20 md:py-28 text-center px-6">
          <SectionPattern variant="grid" className="opacity-70" />
          <Glow color="teal" className="-top-44 left-[12%] h-[420px] w-[520px]" />
          <Glow color="purple" className="-top-44 right-[12%] h-[420px] w-[520px]" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <h2 className="text-[clamp(1.75rem,5.5vw,2.75rem)] font-semibold tracking-[-0.02em] leading-[1.1] max-w-[17ch] mx-auto text-[#e8edf2]">
              Don't maintain legacy. Build what's next.
            </h2>
            <p className="mt-4 text-[15px] text-[#8899aa] max-w-[44ch] mx-auto">
              Join the private waitlist and get first access to Cohort 01.
            </p>
            <button
              onClick={scrollToEmail}
              className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#9333EA] px-8 py-3.5 font-semibold text-black text-[14px] transition hover:opacity-90"
            >
              Join the waitlist
            </button>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.08] py-11 px-6">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
              <Brand compact />
              <div className="flex flex-wrap gap-5">
                {['Documentation', 'Privacy', 'Terms', 'Support', 'FAQ'].map((l) => (
                  <a key={l} href="#top" className={`${MONO} text-[11px] text-[#8899aa] transition-colors hover:text-white`}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-5">
              <p className={`${MONO} text-[10.5px] text-[#4a5568]`}>
                © {new Date().getFullYear()} Code Plus Academy. Engineered for the next generation.
              </p>
              <p className={`${MONO} text-[10.5px] text-[#4a5568]`}>Beta · beta.codeplusacademy.in</p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
