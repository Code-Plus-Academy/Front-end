'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/api/axios';
import toast from 'react-hot-toast';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
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
  GitBranch,
  Zap,
  Menu,
  X,
  FolderDown,
  LayoutDashboard,
  Play,
  Download,
  Bookmark,
  Video,
} from 'lucide-react';

/**
 * app/landing-page.tsx — Code+ Academy homepage
 * Design system: BMW M × Analytics Vidhya fusion
 *
 * BMW M rules applied:
 *  – Pure black canvas (#000000), never light-mode
 *  – UPPERCASE display headers, weight 700
 *  – Flat rectangular elements: border-radius 0 on all buttons, cards, inputs
 *  – 1px structural hairline borders (#3c3c3c)
 *  – M tricolor stripe (4px: #0066b1 → #1c69d4 → #e22718) as brand divider only
 *  – No drop shadows; depth via tonal surface lifts
 *  – Letter-spacing 1.5px on all UPPERCASE labels ("machined" feel)
 *
 * Analytics Vidhya rules applied:
 *  – Immersive hero-led, spacious layout with 96px section rhythm
 *  – Confident blue (#1469F0) for interactive cues and accents
 *  – Dark surface hierarchy: #000 → #0d0d0d → #1a1a1a → #262626
 *  – White text on dark surfaces for maximum legibility
 *  – Content-first: feature cards, stats band, creator grid, CTA band
 *  – Minimal elevation — no gradients, no glassmorphism
 */

// ─── Design tokens ────────────────────────────────────────────────
const T = {
  canvas:    '#000000',
  soft:      '#0d0d0d',
  card:      '#1a1a1a',
  elevated:  '#262626',
  hairline:  '#3c3c3c',
  ink:       '#ffffff',
  body:      '#bbbbbb',
  muted:     '#7e7e7e',
  blue:      '#1469F0',
  mBlue1:    '#0066b1',
  mBlue2:    '#1c69d4',
  mRed:      '#e22718',
};

const LAUNCH_DATE = '2027-01-01T00:00:00Z';

const MONO = "font-[family-name:var(--font-mono)]";

// ─── Motion presets ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Type style map for post cards ───────────────────────────────
const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  course:   { label: 'Course',   color: T.blue    },
  article:  { label: 'Article',  color: '#34C77B' },
  resource: { label: 'Resource', color: '#e22718' },
  video:    { label: 'Video',    color: '#f5a524' },
};

// ─── Features bento ──────────────────────────────────────────────
const FEATURES = [
  {
    key: 'community',
    title: 'Community',
    label: '/ Network',
    color: '#9B59F5',
    desc: 'Connect with elite engineers worldwide — shared challenges, real breakthroughs, zero-noise networking.',
    Icon: Users,
  },
  {
    key: 'courses',
    title: 'Courses',
    label: '/ Learn',
    color: T.blue,
    desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.',
    Icon: BookOpen,
  },
  {
    key: 'articles',
    title: 'Articles',
    label: '/ Read',
    color: '#34C77B',
    desc: "Engineering writing that doesn't skim the surface — real code, real scale, real trade-offs.",
    Icon: FileText,
  },
  {
    key: 'resources',
    title: 'Resources',
    label: '/ Build',
    color: '#e22718',
    desc: 'Curated templates, boilerplates, and tools built by engineers who ship daily.',
    Icon: Code2,
  },
];

// ─── M-Stripe divider ─────────────────────────────────────────────
function MStripe() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 4,
        background: `linear-gradient(to right, ${T.mBlue1} 33.3%, ${T.mBlue2} 33.3% 66.6%, ${T.mRed} 66.6%)`,
      }}
    />
  );
}

// ─── Countdown ────────────────────────────────────────────────────
function useCountdown(target: string) {
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

function CountdownTimer({ launchDate }: { launchDate: string }) {
  const time = useCountdown(launchDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex gap-3 justify-center flex-nowrap" aria-label="Countdown to Cohort 01">
      {(['Days', 'Hrs', 'Min', 'Sec'] as const).map((label, i) => {
        const val = [time.d, time.h, time.m, time.s][i];
        return (
          <div key={label} className="flex flex-col items-center gap-2">
            <div
              style={{
                minWidth: 64,
                border: `1px solid ${T.hairline}`,
                background: T.card,
                textAlign: 'center',
                padding: '10px 12px',
              }}
            >
              <span className={`${MONO} text-[22px] sm:text-[28px] font-bold`}
                style={{ color: T.ink }}>
                {pad(val)}
              </span>
            </div>
            <span
              className={`${MONO} text-[9px] font-bold uppercase`}
              style={{ letterSpacing: '1.5px', color: T.muted }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Terminal window ──────────────────────────────────────────────
type TerminalLine = { text: string; cls: 'cmd' | 'ok' | 'out' };

function TerminalWindow({ tab, lines, trigger = 'inView' }: {
  tab: string;
  lines: TerminalLine[];
  trigger?: 'mount' | 'inView';
}) {
  const motionProps =
    trigger === 'mount'
      ? { initial: 'hidden' as const, animate: 'visible' as const }
      : { initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.4 } };

  return (
    <motion.div
      {...motionProps}
      variants={stagger}
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.soft,
        textAlign: 'left',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderBottom: `1px solid ${T.hairline}`,
          background: T.card,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e22718', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5a524', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C77B', display: 'inline-block' }} />
        <span className={`${MONO} ml-auto text-[10px]`} style={{ color: T.muted }}>{tab}</span>
      </div>
      {/* Content */}
      <div className={`${MONO} text-[12.5px] leading-[1.85] px-4 py-4`}>
        {lines.map((l, idx) => (
          <motion.p
            key={idx}
            variants={fadeUp}
            custom={idx}
            style={{
              color:
                l.cls === 'cmd' ? T.blue
                : l.cls === 'ok'  ? '#34C77B'
                : T.body,
            }}
          >
            {l.text}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Data hooks ───────────────────────────────────────────────────
function useStats() {
  const [state, setState] = useState<{ data: any; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    let live = true;
    api.get('/stats/public')
      .then((r) => { if (live) setState({ data: r.data, loading: false }); })
      .catch(() => { if (live) setState({ data: null, loading: false }); });
    return () => { live = false; };
  }, []);
  const d = state.data || {};
  const rawUsers = d.users_count ?? 0;
  const displayUsers = rawUsers > 10 ? `${rawUsers.toLocaleString()}+` : '10+';
  return {
    loading: state.loading,
    posts:    d.posts_count    ? `${d.posts_count}+` : '10+',
    users:    displayUsers,
    creators: d.creators_count ? `${d.creators_count}+` : '5+',
  };
}

function useTrendingPosts() {
  const [state, setState] = useState<{ posts: any[]; loading: boolean; error: boolean }>({ posts: [], loading: true, error: false });
  useEffect(() => {
    let live = true;
    api.get('/posts', { params: { limit: 4, sort: 'trending' } })
      .then((r) => { if (live) setState({ posts: r.data.posts || [], loading: false, error: false }); })
      .catch(() => { if (live) setState({ posts: [], loading: false, error: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

function useFeaturedCreators() {
  const [state, setState] = useState<{ creators: any[]; loading: boolean; error: boolean }>({ creators: [], loading: true, error: false });
  useEffect(() => {
    let live = true;
    api.get('/users/search', { params: { limit: 6 } })
      .then((r) => { if (live) setState({ creators: r.data.users || [], loading: false, error: false }); })
      .catch(() => { if (live) setState({ creators: [], loading: false, error: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

// ─── Skeletons ────────────────────────────────────────────────────
function PostCardSkeleton() {
  return (
    <div
      className="animate-pulse flex flex-col gap-3"
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.card,
        padding: 16,
        height: 220,
        borderRadius: 10,
        margin: 10,
      }}
    >
      <div style={{ height: 96, background: T.elevated, borderRadius: 6 }} />
      <div style={{ height: 10, background: T.elevated, width: '70%' }} />
      <div style={{ height: 10, background: T.elevated, width: '40%' }} />
    </div>
  );
}

function CreatorCardSkeleton() {
  return (
    <div
      className="animate-pulse flex items-center gap-4"
      style={{ border: `1px solid ${T.hairline}`, background: T.card, padding: 16, borderRadius: 10 }}
    >
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.elevated, flexShrink: 0 }} />
      <div className="flex flex-col gap-2 flex-1">
        <div style={{ height: 10, background: T.elevated, width: '40%' }} />
        <div style={{ height: 10, background: T.elevated, width: '25%' }} />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyPanel({ icon: Icon, title, copy, ctaLabel, onCta }: {
  icon: React.ElementType;
  title: string;
  copy: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
      className="flex flex-col items-center text-center gap-4"
      style={{
        border: `1px dashed ${T.hairline}`,
        background: T.card,
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: 44, height: 44,
          border: `1px solid ${T.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.blue,
        }}
      >
        <Icon size={20} />
      </div>
      <h3
        className={`${MONO} text-[16px] font-bold uppercase`}
        style={{ letterSpacing: '1.5px', color: T.ink }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, color: T.body, maxWidth: '38ch', lineHeight: 1.7 }}>{copy}</p>
      <button
        onClick={onCta}
        className="transition-colors hover:text-white hover:border-white"
        style={{
          marginTop: 4,
          border: `1px solid ${T.hairline}`,
          padding: '10px 24px',
          background: 'transparent',
          color: T.body,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderRadius: 0,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}

// ─── Post card ────────────────────────────────────────────────────
function PostCard({ post }: { post: any }) {
  const meta = TYPE_STYLE[post.type] || TYPE_STYLE.article;
  return (
    <Link
      href={`/activity/${post.slug || post.id}`}
      className="group flex flex-col gap-3 transition-colors"
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.card,
        padding: 16,
        textDecoration: 'none',
        borderRadius: 10,
        margin: 10,
      }}
    >
      <div
        style={{
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${meta.color}18`,
          overflow: 'hidden',
        }}
      >
        {post.cover_image ? (
          <img src={post.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileText size={24} style={{ color: meta.color }} />
        )}
      </div>
      <span
        className={`${MONO} self-start text-[9px] font-bold uppercase`}
        style={{
          letterSpacing: '1.5px',
          color: meta.color,
          border: `1px solid ${meta.color}50`,
          padding: '3px 8px',
        }}
      >
        {meta.label}
      </span>
      <h3
        className="group-hover:text-white transition-colors line-clamp-2"
        style={{ fontSize: 14, fontWeight: 700, color: T.body, lineHeight: 1.45 }}
      >
        {post.title}
      </h3>
    </Link>
  );
}

// ─── Creator card ─────────────────────────────────────────────────
function CreatorCard({ creator }: { creator: any }) {
  const initial = (creator.name || creator.username || '?').charAt(0).toUpperCase();
  return (
    <Link
      href={`/u/${creator.username}`}
      className="flex items-center gap-4 transition-colors group"
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.card,
        padding: 16,
        textDecoration: 'none',
        borderRadius: 10,
      }}
    >
      {creator.avatar_url ? (
        <img
          src={creator.avatar_url}
          alt=""
          style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: T.elevated,
            border: `1px solid ${T.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: T.body,
          }}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p
          className="group-hover:text-white transition-colors truncate"
          style={{ fontSize: 14, fontWeight: 700, color: T.ink }}
        >
          {creator.name || creator.username}
        </p>
        <p className={`${MONO} truncate`} style={{ fontSize: 11, color: T.muted }}>
          @{creator.username}
        </p>
      </div>
      <ArrowUpRight size={14} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.blue }} />
    </Link>
  );
}

// ─── Audience Feature Showcase (Notes, Studio, Articles, Videos) ───────
function AudienceShowcase() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'studio' | 'articles' | 'videos'>('notes');

  const tabs = [
    { id: 'notes', label: 'Notes Arena', icon: FolderDown, eyebrow: '/ Academic & Exam Vault', route: '/notes' },
    { id: 'studio', label: 'Creator Studio', icon: LayoutDashboard, eyebrow: '/ Author & Monetization Console', route: '/register' },
    { id: 'articles', label: 'Engineering Articles', icon: FileText, eyebrow: '/ System Design & In-Depth Writing', route: '/explore' },
    { id: 'videos', label: 'Videos & Shorts', icon: Video, eyebrow: '/ Micro-Tutorials & Masterclasses', route: '/videos' },
  ] as const;

  return (
    <section
      id="showcase"
      style={{
        borderBottom: `1px solid ${T.hairline}`,
        padding: 'clamp(64px, 8vw, 96px) 24px',
        background: T.soft,
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <SectionHeader eyebrow="/ Content Engine" title="Experience CPA From Every Angle" />

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: `1px solid ${T.hairline}`,
            marginBottom: 36,
            paddingBottom: 2,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${T.ink}` : '2px solid transparent',
                  padding: '12px 18px',
                  color: isActive ? T.ink : T.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                  transition: 'color 0.18s, border-color 0.18s',
                  borderRadius: 0,
                }}
              >
                <Icon size={14} style={{ color: isActive ? T.blue : T.muted }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
              }}
            >
              {/* Left description */}
              <div>
                <span className={`${MONO} text-[10px] font-bold uppercase mb-3 block`} style={{ letterSpacing: '1.5px', color: T.blue }}>
                  / Academic & Exam Vault
                </span>
                <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: T.ink, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 16 }}>
                  Notes Arena — Verified Study Modules & Blueprints
                </h3>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.75, marginBottom: 24 }}>
                  Access student-verified PDF notes, university department roadmaps, and previous exam questions. Streamline revision with structured, high-yield engineering documentation.
                </p>
                <button
                  onClick={() => router.push('/notes')}
                  style={{
                    background: T.ink, color: T.canvas, border: `1px solid ${T.ink}`,
                    padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0, fontFamily: 'var(--font-mono)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none'
                  }}
                  className="hover:bg-transparent hover:text-white"
                >
                  Explore Notes Arena <ArrowUpRight size={13} />
                </button>
              </div>

              {/* Right interactive card mockup */}
              <div style={{ border: `1px solid ${T.hairline}`, background: T.card, padding: 24, borderRadius: 10 }}>
                <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: `1px solid ${T.hairline}` }}>
                  <span className={`${MONO} text-[11px] font-bold uppercase`} style={{ color: T.ink }}>
                    Computer Science & Engineering
                  </span>
                  <span className={`${MONO} text-[10px] font-bold`} style={{ color: '#34C77B', border: `1px solid #34C77B40`, padding: '2px 8px' }}>
                    Semester 5
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { title: 'Distributed Systems & Paxos Consensus.pdf', tag: 'Core Theory', size: '4.2 MB', stars: '4.9 ★', downloads: '3.8k' },
                    { title: 'DBMS Indexing & B-Trees Exam Blueprint.pdf', tag: 'PYQ Blueprint', size: '2.8 MB', stars: '4.8 ★', downloads: '5.1k' },
                    { title: 'Compiler Lexical Analysis & Parsing Notes.pdf', tag: 'Lecture Notes', size: '3.5 MB', stars: '4.7 ★', downloads: '2.4k' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: `1px solid ${T.hairline}`,
                        background: T.soft,
                        padding: 16,
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 160,
                      }}
                      className="hover:border-cyan-500/50 transition-all hover:-translate-y-0.5 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span className={`${MONO} text-[9px] font-bold px-2 py-0.5 rounded uppercase`} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            {doc.tag}
                          </span>
                          <span className={`${MONO} text-[9.5px] font-bold`} style={{ color: '#34C77B' }}>
                            {doc.stars}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 mb-2">
                          <FileText size={15} style={{ color: T.blue, flexShrink: 0, marginTop: 2 }} />
                          <p className="line-clamp-2 text-[13px] font-bold leading-snug" style={{ color: T.ink }}>
                            {doc.title}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: `${T.hairline}` }}>
                        <p className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                          {doc.size} · {doc.downloads} dl
                        </p>
                        <button
                          onClick={() => router.push('/notes')}
                          style={{
                            background: 'rgba(0, 219, 233, 0.1)',
                            border: `1px solid rgba(0, 219, 233, 0.4)`,
                            color: '#00dbe9',
                            padding: '4px 10px',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            borderRadius: 6,
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                          }}
                          className="hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                        >
                          PDF <Download size={10} className="inline ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
              }}
            >
              {/* Left description */}
              <div>
                <span className={`${MONO} text-[10px] font-bold uppercase mb-3 block`} style={{ letterSpacing: '1.5px', color: T.blue }}>
                  / Author & Monetization Console
                </span>
                <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: T.ink, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 16 }}>
                  Creator Studio — Publish, Track & Reach Thousands
                </h3>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.75, marginBottom: 24 }}>
                  Built for technical authors and mentors. Draft rich posts, distribute starter templates, monitor real-time audience analytics, and grow your personal engineering brand.
                </p>
                <button
                  onClick={() => router.push(user ? '/creator/dashboard' : '/register')}
                  style={{
                    background: T.ink, color: T.canvas, border: `1px solid ${T.ink}`,
                    padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0, fontFamily: 'var(--font-mono)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none'
                  }}
                  className="hover:bg-transparent hover:text-white"
                >
                  Open Creator Console <ArrowUpRight size={13} />
                </button>
              </div>

              {/* Right Studio Dashboard Mockup */}
              <div style={{ border: `1px solid ${T.hairline}`, background: T.card, padding: 24, borderRadius: 10 }}>
                {/* Metric tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Audience', val: '24.8K', change: '+18%' },
                    { label: 'Reads', val: '142.6K', change: '+32%' },
                    { label: 'Downloads', val: '8.4K', change: '+24%' },
                  ].map((m, i) => (
                    <div key={i} style={{ border: `1px solid ${T.hairline}`, background: T.soft, padding: 12, borderRadius: 6, textAlign: 'center' }}>
                      <p className={`${MONO} text-[10px] uppercase`} style={{ color: T.muted }}>{m.label}</p>
                      <p className="text-[18px] font-bold" style={{ color: T.ink }}>{m.val}</p>
                      <span className={`${MONO} text-[9px] font-semibold`} style={{ color: '#34C77B' }}>{m.change}</span>
                    </div>
                  ))}
                </div>

                {/* Editor preview box */}
                <div style={{ border: `1px solid ${T.hairline}`, background: T.soft, padding: 16, borderRadius: 8 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${MONO} text-[10px] font-bold uppercase`} style={{ color: T.blue }}>
                      Live Post Editor
                    </span>
                    <span className={`${MONO} text-[9px] font-bold uppercase`} style={{ color: '#34C77B', border: `1px solid #34C77B40`, padding: '2px 6px' }}>
                      Published
                    </span>
                  </div>
                  <p className="text-[14px] font-bold mb-1" style={{ color: T.ink }}>
                    Building High-Throughput Microservices in Go & gRPC
                  </p>
                  <p className={`${MONO} text-[11px]`} style={{ color: T.muted }}>
                    12,480 views · 482 upvotes · 64 comments
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'articles' && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
              }}
            >
              {/* Left description */}
              <div>
                <span className={`${MONO} text-[10px] font-bold uppercase mb-3 block`} style={{ letterSpacing: '1.5px', color: T.blue }}>
                  / Technical Writing & Architecture
                </span>
                <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: T.ink, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 16 }}>
                  Engineering Articles — In-Depth Systems & Case Studies
                </h3>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.75, marginBottom: 24 }}>
                  Read zero-fluff longform engineering articles written by staff developers. Features code blocks, performance benchmarks, and real-world system trade-offs.
                </p>
                <button
                  onClick={() => router.push('/explore')}
                  style={{
                    background: T.ink, color: T.canvas, border: `1px solid ${T.ink}`,
                    padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0, fontFamily: 'var(--font-mono)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none'
                  }}
                  className="hover:bg-transparent hover:text-white"
                >
                  Browse Engineering Articles <ArrowUpRight size={13} />
                </button>
              </div>

              {/* Right Article Card Mockup */}
              <div style={{ border: `1px solid ${T.hairline}`, background: T.card, padding: 24, borderRadius: 10 }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${MONO} text-[9px] font-bold uppercase`} style={{ color: T.blue, border: `1px solid ${T.blue}40`, padding: '2px 8px' }}>
                    System Architecture
                  </span>
                  <span className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                    8 min read
                  </span>
                </div>
                <h4 className="text-[17px] font-bold mb-3" style={{ color: T.ink, lineHeight: 1.3 }}>
                  Optimizing Next.js SSR & Hydration Latency at 100K RPM
                </h4>

                {/* Code snippet inside mockup */}
                <div className={`${MONO} text-[11px] leading-relaxed p-3 mb-3`} style={{ background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 6, color: T.body }}>
                  <p className="text-[#34C77B]">// Revalidation cache strategy</p>
                  <p><span style={{ color: T.blue }}>export async function</span> <span style={{ color: T.ink }}>revalidateData</span>() &#123;</p>
                  <p style={{ paddingLeft: 16 }}>return await fetch(url, &#123; next: &#123; revalidate: 60 &#125; &#125;);</p>
                  <p>&#125;</p>
                </div>

                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${T.hairline}` }}>
                  <span className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                    By Alex Vance · Principal Architect
                  </span>
                  <Bookmark size={14} style={{ color: T.blue, cursor: 'pointer' }} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
              }}
            >
              {/* Left description */}
              <div>
                <span className={`${MONO} text-[10px] font-bold uppercase mb-3 block`} style={{ letterSpacing: '1.5px', color: T.blue }}>
                  / Micro-Tutorials & Masterclasses
                </span>
                <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: T.ink, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 16 }}>
                  Videos & Shorts — High-Velocity Code Walkthroughs
                </h3>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.75, marginBottom: 24 }}>
                  Learn fast with 60-second bite-sized code shorts or full-length video masterclasses. Every video comes paired with an accessible GitHub code repository.
                </p>
                <button
                  onClick={() => router.push('/videos')}
                  style={{
                    background: T.ink, color: T.canvas, border: `1px solid ${T.ink}`,
                    padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0, fontFamily: 'var(--font-mono)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none'
                  }}
                  className="hover:bg-transparent hover:text-white"
                >
                  Watch Videos & Shorts <ArrowUpRight size={13} />
                </button>
              </div>

              {/* Right Video Player Mockup */}
              <div style={{ border: `1px solid ${T.hairline}`, background: T.card, padding: 20, borderRadius: 10 }}>
                {/* Fake video screen */}
                <div
                  style={{
                    height: 160,
                    background: `linear-gradient(135deg, ${T.soft} 0%, #151d28 100%)`,
                    border: `1px solid ${T.hairline}`,
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `${T.blue}ee`, color: T.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(20, 105, 240, 0.4)',
                    }}
                  >
                    <Play size={20} className="ml-1" />
                  </div>
                  <span className={`${MONO} absolute bottom-2 right-2 text-[9px] bg-black/80 text-white px-2 py-0.5 rounded`}>
                    14:20
                  </span>
                </div>
                <h4 className="text-[14px] font-bold mb-2" style={{ color: T.ink }}>
                  Mastering Distributed Locks with Redis & Redlock Algorithm
                </h4>
                <div className="flex items-center justify-between">
                  <span className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                    18.4K views · 4.9 ★ Rating
                  </span>
                  <span className={`${MONO} text-[9px] font-bold uppercase`} style={{ color: T.blue }}>
                    Includes Repo
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Feature card ─────────────────────────────────────────────────
function FeatureCard({ feat, idx }: { feat: typeof FEATURES[0]; idx: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={idx}
      className="flex flex-col gap-5 transition-colors"
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.card,
        padding: 28,
        borderRadius: 10,
        margin: 10,
      }}
    >
      {/* Label + icon row */}
      <div className="flex items-center justify-between">
        <span
          className={`${MONO} text-[10px] font-bold uppercase`}
          style={{ letterSpacing: '1.5px', color: T.muted }}
        >
          {feat.label}
        </span>
        <div
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${feat.color}18`,
            color: feat.color,
          }}
        >
          <feat.Icon size={18} />
        </div>
      </div>
      {/* Title */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: T.ink,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          lineHeight: 1.2,
        }}
      >
        {feat.title}
      </h3>
      {/* Accent line */}
      <div style={{ width: 32, height: 2, background: feat.color }} />
      {/* Description */}
      <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.7 }}>{feat.desc}</p>
    </motion.div>
  );
}

// ─── Spec stat cell ───────────────────────────────────────────────
function StatCell({ value, label, loading }: { value: string | null; label: string; loading: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{
        border: `1px solid ${T.hairline}`,
        background: T.soft,
        padding: '32px 24px',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      {loading ? (
        <div className="animate-pulse" style={{ width: 80, height: 36, background: T.card }} />
      ) : (
        <span style={{ fontSize: 40, fontWeight: 700, color: T.ink, lineHeight: 1 }}>
          {value ?? '—'}
        </span>
      )}
      <span
        className={`${MONO} text-[10px] font-bold uppercase`}
        style={{ letterSpacing: '1.5px', color: T.muted }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className="mb-12"
    >
      <p
        className={`${MONO} text-[10px] font-bold uppercase mb-3`}
        style={{ letterSpacing: '2px', color: T.blue }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontSize: 'clamp(1.65rem, 5.5vw, 2.75rem)',
          fontWeight: 700,
          color: T.ink,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const stats = useStats();
  const { posts: trendingPosts, loading: postsLoading } = useTrendingPosts();
  const { creators, loading: creatorsLoading } = useFeaturedCreators();

  /* ── Vanta Globe Background ── */
  const vantaRef = useRef<HTMLElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const loadScript = (src: string, globalName: string) =>
      new Promise<void>((resolve, reject) => {
        if ((window as any)[globalName]) { resolve(); return; }

        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          const check = setInterval(() => {
            if ((window as any)[globalName]) { clearInterval(check); resolve(); }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error(`${globalName} timed out`)); }, 10000);
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          const check = setInterval(() => {
            if ((window as any)[globalName]) { clearInterval(check); resolve(); }
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
        if (cancelled || !vantaRef.current || !(window as any).VANTA) return;
        if (vantaEffect.current) vantaEffect.current.destroy();
        vantaEffect.current = (window as any).VANTA.GLOBE({
          el: vantaRef.current,
          THREE: (window as any).THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          size: 1.5,
          color: 0x3B7CFF,
          color2: 0x34C77B,
          backgroundColor: 0x000000,
        });
        const canvas = vantaRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.style.position = 'fixed';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100vw';
          canvas.style.height = '100vh';
          canvas.style.zIndex = '0';
          canvas.style.pointerEvents = 'none';
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
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setJoined(true);
      toast.success("You're on the list! 🚀");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToEmail = () => {
    emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    emailRef.current?.focus({ preventScroll: true });
  };

  const NAV_LINKS = [
    ['Academy', '#academy'],
    ['Features', '#features'],
    ['Community', '#community'],
  ] as const;

  // ── Shared button styles ──────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    background: T.ink,
    color: T.canvas,
    border: `1px solid ${T.ink}`,
    padding: '12px 28px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderRadius: 0,
    fontFamily: 'var(--font-mono)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
    transition: 'background 0.18s, color 0.18s',
    whiteSpace: 'nowrap',
  };

  const btnGhost: React.CSSProperties = {
    background: 'transparent',
    color: T.body,
    border: `1px solid ${T.hairline}`,
    padding: '12px 28px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderRadius: 0,
    fontFamily: 'var(--font-mono)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
    transition: 'border-color 0.18s, color 0.18s',
    whiteSpace: 'nowrap',
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Root canvas ── */}
      <div
        style={{
          background: T.canvas,
          color: T.ink,
          minHeight: '100vh',
          overflowX: 'hidden',
          fontFamily: 'Geist, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* ── Fixed 3D Vanta Globe Background (steady viewport background) ── */}
        <div
          ref={vantaRef as any}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* ── M-Stripe top accent (fixed) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: 4,
            zIndex: 80,
            background: `linear-gradient(to right, ${T.mBlue1} 33.3%, ${T.mBlue2} 33.3% 66.6%, ${T.mRed} 66.6%)`,
          }}
        />

        {/* ════════════════════════════════════════════════════════
            NAV
        ════════════════════════════════════════════════════════ */}
        <nav
          style={{
            position: 'fixed',
            top: 4, left: 0, right: 0,
            zIndex: 70,
            height: 60,
            background: `${T.canvas}ee`,
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${T.hairline}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          {/* Logo */}
          <Link href="/" aria-label="Code Plus Academy" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image
              src="/cpa-icon-dark.png"
              alt="CPA Icon"
              width={28}
              height={28}
              className="h-7 w-7 object-contain landing-logo-dark"
              priority
            />
            <Image
              src="/cpa-icon-light.png"
              alt="CPA Icon"
              width={28}
              height={28}
              className="h-7 w-7 object-contain landing-logo-light"
              priority
            />
            <Image
              src="/cpa-logo-name-dark.png"
              alt="Code Plus Academy"
              width={130}
              height={36}
              className="h-7 w-auto object-contain landing-logo-dark"
              priority
            />
            <Image
              src="/cpa-logo-name-light.png"
              alt="Code Plus Academy"
              width={130}
              height={36}
              className="h-7 w-auto object-contain landing-logo-light"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className={`${MONO} text-[11px] font-bold uppercase transition-colors hover:text-white`}
                style={{ letterSpacing: '1.5px', color: T.muted, textDecoration: 'none' }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA cluster */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <button
                onClick={() => router.push('/feed')}
                style={btnPrimary}
                className="hover:bg-transparent hover:text-white"
              >
                Open Feed <ArrowUpRight size={13} />
              </button>
            ) : (
              <>
                <Link href="/login" style={btnGhost} className="hover:text-white hover:border-white">
                  Log in
                </Link>
                <button
                  onClick={() => router.push('/register')}
                  style={btnPrimary}
                  className="hover:bg-transparent hover:text-white"
                >
                  Request Access
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ink, padding: 4 }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile menu sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 64, left: 0, right: 0,
                zIndex: 65,
                background: T.canvas,
                borderBottom: `1px solid ${T.hairline}`,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* M-stripe inside mobile menu */}
              <MStripe />
              {NAV_LINKS.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${MONO} text-[13px] font-bold uppercase`}
                  style={{ letterSpacing: '1.5px', color: T.body, textDecoration: 'none' }}
                >
                  {label}
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                {user ? (
                  <button onClick={() => router.push('/feed')} style={{ ...btnPrimary, justifyContent: 'center' }}>
                    Open Feed
                  </button>
                ) : (
                  <>
                    <Link href="/login" style={{ ...btnGhost, justifyContent: 'center' }}>Log in</Link>
                    <button
                      onClick={() => router.push('/register')}
                      style={{ ...btnPrimary, justifyContent: 'center' }}
                    >
                      Request Access
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════════
            HERO — ENGINE ROOM
        ════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          style={{
            paddingTop: 'clamp(96px, 12vw, 140px)',
            paddingBottom: 'clamp(72px, 8vw, 96px)',
            paddingLeft: 24,
            paddingRight: 24,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Faint hairline grid watermark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'linear-gradient(to bottom, black 0%, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 85%)',
            }}
          />
          {/* Radial glow behind hero */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
              width: 800, height: 500, borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${T.blue}18 0%, transparent 65%)`,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: 780, margin: '0 auto' }}>
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${T.hairline}`,
                background: T.card,
                padding: '8px 16px',
                marginBottom: 32,
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
                <span
                  className="animate-ping"
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: '#34C77B',
                    opacity: 0.7,
                  }}
                />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C77B', flexShrink: 0 }} />
              </span>
              <span
                className={`${MONO} text-[10px] font-bold uppercase`}
                style={{ letterSpacing: '1.5px', color: T.body }}
              >
                Cohort 01 · Applications Open
              </span>
            </motion.div>

            {/* Hero H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(2.4rem, 9vw, 5rem)',
                fontWeight: 700,
                lineHeight: 0.97,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                color: T.ink,
              }}
            >
              THE UNIFIED HOME
              <br />
              FOR{' '}
              <span style={{ color: T.blue }}>ELITE</span>
              <br />
              DEVELOPERS
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              style={{
                marginTop: 24,
                maxWidth: '48ch',
                marginLeft: 'auto',
                marginRight: 'auto',
                fontSize: 15.5,
                lineHeight: 1.75,
                color: T.body,
              }}
            >
              Bridge the gap between human communication and technical precision.
              Ship, share, and scale alongside developers already building what's next.
            </motion.p>

            {/* Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ marginTop: 40, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
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

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              style={{ marginTop: 36 }}
            >
              <CountdownTimer launchDate={LAUNCH_DATE} />
            </motion.div>

            {/* Waitlist form / logged-in CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.55 }}
              style={{ marginTop: 36, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}
            >
              {!user ? (
                <form
                  onSubmit={handleWaitlist}
                  style={{ display: 'flex', flexDirection: 'row', gap: 0 }}
                  className="flex flex-col sm:flex-row"
                >
                  <label htmlFor="hero-email" className="sr-only">Email address</label>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: `1px solid ${T.hairline}`,
                      borderRight: 'none',
                      background: T.card,
                      padding: '0 16px',
                      height: 50,
                    }}
                    className="border-r-0 sm:border-r-0"
                  >
                    <Terminal size={14} style={{ color: T.blue, flexShrink: 0 }} />
                    <input
                      id="hero-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.dev"
                      disabled={joined || submitting}
                      required
                      className={`${MONO} flex-1 min-w-0 bg-transparent text-[13px] text-white outline-none`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: T.ink,
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                  {joined ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        height: 50,
                        padding: '0 20px',
                        border: `1px solid #34C77B`,
                        background: '#34C77B15',
                        color: '#34C77B',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Check size={13} /> You're on the list
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        height: 50,
                        padding: '0 28px',
                        background: T.ink,
                        color: T.canvas,
                        border: `1px solid ${T.ink}`,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1,
                        borderRadius: 0,
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'background 0.18s, color 0.18s',
                      }}
                      className="hover:bg-transparent hover:text-white"
                    >
                      {submitting ? 'Connecting…' : 'Request Access'}
                    </button>
                  )}
                </form>
              ) : (
                <button
                  onClick={() => router.push('/feed')}
                  style={btnPrimary}
                  className="hover:bg-transparent hover:text-white w-full justify-center"
                >
                  Enter Feed <ArrowUpRight size={14} />
                </button>
              )}

              {/* Social proof */}
              <p
                className={`${MONO} mt-4 text-[11px]`}
                aria-live="polite"
                style={{ color: T.muted }}
              >
                <span style={{ color: T.body, fontWeight: 700 }}>{stats.users || '10+'}</span>{' '}
                Developers Joining Weekly · Cohort 01 opens Jan 2027
              </p>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            M-STRIPE
        ════════════════════════════════════════════════════════ */}
        <MStripe />

        {/* ════════════════════════════════════════════════════════
            STATS BAND — spec-cell style
        ════════════════════════════════════════════════════════ */}
        <section
          style={{
            position: 'relative',
            zIndex: 10,
            background: T.soft,
            borderBottom: `1px solid ${T.hairline}`,
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <StatCell
              loading={stats.loading}
              value={stats.users || '10+'}
              label="10+ Developers Joined"
            />
            <StatCell
              loading={stats.loading}
              value={stats.posts || '10+'}
              label="Resources Published"
            />
            <StatCell
              loading={stats.loading}
              value={stats.creators || '5+'}
              label="Active Creators"
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FEATURES — ACADEMY BENTO GRID
        ════════════════════════════════════════════════════════ */}
        <section
          id="features"
          style={{
            position: 'relative',
            zIndex: 10,
            borderBottom: `1px solid ${T.hairline}`,
            padding: 'clamp(64px, 8vw, 96px) 24px',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <SectionHeader eyebrow="/ Academy Core" title="Built for how you actually work" />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              }}
            >
              {FEATURES.map((feat, idx) => (
                <FeatureCard key={feat.key} feat={feat} idx={idx} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            GITHUB SYNC
        ════════════════════════════════════════════════════════ */}
        <section
          id="academy"
          style={{
            position: 'relative',
            zIndex: 10,
            background: T.soft,
            borderBottom: `1px solid ${T.hairline}`,
            padding: 'clamp(64px, 8vw, 96px) 24px',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
              style={{
                border: `1px solid ${T.hairline}`,
                background: T.card,
                padding: 'clamp(28px, 4vw, 48px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 40,
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background git graph motif */}
              <svg
                aria-hidden="true"
                viewBox="0 0 220 260"
                width={200}
                height={240}
                style={{
                  position: 'absolute',
                  right: -20, top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.1,
                  pointerEvents: 'none',
                  display: 'none',
                }}
                className="lg:block"
              >
                <path d="M36 10 V250" stroke="#fff" strokeWidth="1.5" fill="none" />
                <path d="M36 70 C36 100 110 90 110 130 S184 160 184 190" stroke={T.blue} strokeWidth="1.5" fill="none" />
                <path d="M110 130 V210" stroke="#fff" strokeWidth="1.5" fill="none" />
                <circle cx="36"  cy="30"  r="4.5" fill={T.blue} />
                <circle cx="36"  cy="130" r="4.5" fill="#fff" />
                <circle cx="110" cy="130" r="4.5" fill="#34C77B" />
                <circle cx="184" cy="190" r="4.5" fill="#34C77B" />
              </svg>

              {/* Left copy */}
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: `1px solid #34C77B`,
                    color: '#34C77B',
                    padding: '4px 12px',
                    marginBottom: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <GitBranch size={11} /> Auto Sync
                </span>
                <h3
                  style={{
                    fontSize: 'clamp(1.2rem, 3.4vw, 1.7rem)',
                    fontWeight: 700,
                    color: T.ink,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    marginBottom: 16,
                    lineHeight: 1.1,
                  }}
                >
                  GitHub Repository Sync
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: T.body, maxWidth: '42ch' }}>
                  Connect your repositories and Code+ Academy suggests modules based on the
                  stack you actually use — no generic curriculum.
                </p>
              </div>

              {/* Right terminal */}
              <TerminalWindow
                tab="academy-sync.sh"
                trigger="inView"
                lines={[
                  { text: '$ git checkout academy-main',            cls: 'cmd' },
                  { text: "Switched to branch 'academy-main'",      cls: 'out' },
                  { text: '$ cpa sync --user=you',                  cls: 'cmd' },
                  { text: 'Analyzing dependency graph…',            cls: 'out' },
                  { text: '✓ Rust core patterns matched (Advanced)', cls: 'ok'  },
                  { text: '✓ 4 modules queued for your track',       cls: 'ok'  },
                ]}
              />
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            M-STRIPE
        ════════════════════════════════════════════════════════ */}
        <MStripe />

        {/* ════════════════════════════════════════════════════════
            AUDIENCE CONTENT SHOWCASE (Notes, Studio, Articles, Videos)
        ════════════════════════════════════════════════════════ */}
        <AudienceShowcase />

        {/* ════════════════════════════════════════════════════════
            M-STRIPE
        ════════════════════════════════════════════════════════ */}
        <MStripe />

        {/* ════════════════════════════════════════════════════════
            TRENDING POSTS — magazine-grid
        ════════════════════════════════════════════════════════ */}
        <section
          id="feed"
          style={{
            position: 'relative',
            zIndex: 10,
            borderBottom: `1px solid ${T.hairline}`,
            padding: 'clamp(64px, 8vw, 96px) 24px',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 20,
                marginBottom: 48,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p
                  className={`${MONO} text-[10px] font-bold uppercase mb-3`}
                  style={{ letterSpacing: '2px', color: T.blue }}
                >
                  / Live Feed
                </p>
                <h2
                  style={{
                    fontSize: 'clamp(1.65rem, 5.5vw, 2.75rem)',
                    fontWeight: 700,
                    color: T.ink,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.05,
                  }}
                >
                  Trending on CPA
                </h2>
              </div>
              <button
                onClick={() => router.push(user ? '/feed' : '/register')}
                style={{ ...btnGhost, flexShrink: 0 }}
                className="hover:text-white hover:border-white"
              >
                View Feed <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Cards */}
            {postsLoading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : trendingPosts.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {trendingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={Inbox}
                title="The feed unlocks at launch"
                copy="Founding members get first-post priority when Cohort 01 goes live."
                ctaLabel="Join the Waitlist"
                onCta={scrollToEmail}
              />
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FEATURED CREATORS
        ════════════════════════════════════════════════════════ */}
        <section
          id="community"
          style={{
            position: 'relative',
            zIndex: 10,
            background: T.soft,
            borderBottom: `1px solid ${T.hairline}`,
            padding: 'clamp(64px, 8vw, 96px) 24px',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 64,
                alignItems: 'start',
              }}
            >
              {/* Left: copy */}
              <div>
                <SectionHeader eyebrow="/ Community Leaders" title="Featured Creators" />
                <p style={{ fontSize: 14, lineHeight: 1.8, color: T.body, maxWidth: '42ch' }}>
                  The engineers, instructors, and architects building the
                  Code+ Academy knowledge base. Follow their work, learn
                  from their experience, and connect directly.
                </p>
                <div style={{ marginTop: 28 }}>
                  <button
                    onClick={() => router.push(user ? '/network' : '/register')}
                    style={btnGhost}
                    className="hover:text-white hover:border-white"
                  >
                    View All Creators <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>

              {/* Right: creator list */}
              <div>
                {creatorsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <CreatorCardSkeleton key={i} />
                    ))}
                  </div>
                ) : creators.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {creators.map((c) => (
                      <CreatorCard key={c.id} creator={c} />
                    ))}
                  </div>
                ) : (
                  <EmptyPanel
                    icon={Sparkles}
                    title="Founding creator badges still open"
                    copy="Be one of the first 25 creators recognized when the platform launches."
                    ctaLabel="Apply as a Creator"
                    onCta={scrollToEmail}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            M-STRIPE
        ════════════════════════════════════════════════════════ */}
        <MStripe />

        {/* ════════════════════════════════════════════════════════
            FINAL CTA BAND
        ════════════════════════════════════════════════════════ */}
        <section
          style={{
            position: 'relative',
            zIndex: 10,
            padding: 'clamp(80px, 10vw, 120px) 24px',
            textAlign: 'center',
            borderBottom: `1px solid ${T.hairline}`,
            overflow: 'hidden',
          }}
        >
          {/* Faint grid */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
          {/* Glow */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-20%', left: '20%',
            width: 500, height: 400,
            background: `radial-gradient(ellipse at center, ${T.blue}14 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-20%', right: '20%',
            width: 500, height: 400,
            background: `radial-gradient(ellipse at center, ${T.mRed}10 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'relative' }}
          >
            <p
              className={`${MONO} text-[10px] font-bold uppercase mb-6`}
              style={{ letterSpacing: '2px', color: T.muted }}
            >
              <Zap size={10} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Cohort 01 · Jan 2027
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 6.5vw, 3.5rem)',
                fontWeight: 700,
                color: T.ink,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
                maxWidth: '14ch',
                margin: '0 auto 20px',
              }}
            >
              Don't maintain legacy.
              <br />
              Build what's next.
            </h2>
            <p style={{ fontSize: 15, color: T.body, maxWidth: '44ch', margin: '0 auto 36px', lineHeight: 1.7 }}>
              Join the private waitlist and get first access to Cohort 01.
              Limited seats. Real engineers. No fluff.
            </p>
            <button
              onClick={scrollToEmail}
              style={btnPrimary}
              className="hover:bg-transparent hover:text-white"
            >
              Join the Waitlist
            </button>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════ */}
        <footer style={{ position: 'relative', zIndex: 10, background: T.canvas, padding: 'clamp(40px, 6vw, 64px) 24px 32px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            {/* Top row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                paddingBottom: 28,
                borderBottom: `1px solid ${T.hairline}`,
                marginBottom: 24,
              }}
            >
              <Link href="/" aria-label="Code Plus Academy" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <Image
                  src="/cpa-icon-dark.png"
                  alt="CPA Icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain landing-logo-dark"
                />
                <Image
                  src="/cpa-icon-light.png"
                  alt="CPA Icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain landing-logo-light"
                />
                <Image
                  src="/cpa-logo-name-dark.png"
                  alt="Code Plus Academy"
                  width={120}
                  height={32}
                  className="h-7 w-auto object-contain landing-logo-dark"
                />
                <Image
                  src="/cpa-logo-name-light.png"
                  alt="Code Plus Academy"
                  width={120}
                  height={32}
                  className="h-7 w-auto object-contain landing-logo-light"
                />
              </Link>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {[
                  ['Documentation', '#'],
                  ['Privacy', '/privacy'],
                  ['Terms', '/terms'],
                  ['Support', '/support'],
                  ['FAQ', '/faq'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className={`${MONO} text-[11px] transition-colors hover:text-white`}
                    style={{ color: T.muted, textDecoration: 'none', letterSpacing: '0.5px' }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <p className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                © {new Date().getFullYear()} Code+ Academy. Engineered for the next generation.
              </p>
              <p className={`${MONO} text-[10px]`} style={{ color: T.muted }}>
                Beta · beta.codeplusacademy.in
              </p>
            </div>
          </div>
        </footer>

      </div>
    </MotionConfig>
  );
}
