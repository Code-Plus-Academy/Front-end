import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  FileText,
  Code2,
  BookOpen,
  Terminal,
  Users,
} from 'lucide-react';

// ── Theme tokens (Locked to Sleek Dark for Premium BMW M Style) ────────────────
const t = {
  bg:           '#000000',
  bgAlt:        '#0d0d0d',
  bgDeep:       '#000000',
  surface:      '#111111',
  card:         '#1A181B',
  cardAlt:      '#0d0d0d',
  text:         '#ffffff',
  sub:          '#bbbbbb',
  dim:          '#7e7e7e',
  border:       '#3c3c3c',
  borderAccent: '#0D6EFD',
  navBg:        'rgba(0,0,0,0.85)',
  inputBg:      '#0d0d0d',
  codeBg:       '#050505',
  teal:         '#0D6EFD',
  purple:       '#9333EA',
  purpleDim:    'rgba(147,51,234,0.15)',
  tealDim:      'rgba(13,110,253,0.12)',
  glowTeal:     'rgba(13,110,253,0.08)',
  glowPurple:   'rgba(147,51,234,0.06)',
};

// ── Countdown ─────────────────────────────────────────────────────────────────
function CountdownTimer({ launchDate }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(launchDate).getTime() - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  const pad = n => String(n).padStart(2, '0');

  return (
    <div className="flex gap-3 justify-center flex-nowrap">
      {[['D', time.d], ['H', time.h], ['M', time.m], ['S', time.s]].map(([label, val]) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="relative overflow-hidden rounded-none border border-[#3c3c3c] bg-[#0d0d0d] px-4 py-2.5 min-w-[70px]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 to-purple-950/20" />
            <span className="relative z-10 block text-center font-mono text-[24px] sm:text-[32px] font-black text-white">
              {pad(val)}
            </span>
          </div>
          <span className="block font-mono text-[9px] font-bold tracking-widest text-[#7e7e7e] uppercase">
            {label}
          </span>
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
      setStats({
        posts: d.posts_count ? `${(d.posts_count / 1000).toFixed(1)}K+` : '—',
        users: d.users_count ? `${(d.users_count / 1000).toFixed(1)}K+` : '—',
        creators: d.creators_count || '—'
      });
    }).catch(() => {});
  }, []);
  return stats;
}

// Custom hook to import relative cpa-logo image inside react-router bundle:
function getCpaLogoUrl() {
  // In dynamic environments, static paths like /cpa-logo-dark.png exist in public directory
  return '/cpa-logo-dark.png';
}

function useTrendingPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get('/posts', { params: { limit: 4, sort: 'trending' } }).then(r => {
      setPosts(r.data.posts || []);
    }).catch(() => {});
  }, []);
  return posts;
}

function useFeaturedCreators() {
  const [creators, setCreators] = useState([]);
  useEffect(() => {
    api.get('/users/search', { params: { limit: 5 } }).then(r => {
      setCreators(r.data.users || []);
    }).catch(() => {});
  }, []);
  return creators;
}

const TYPE_COLORS = {
  course: 'text-[#0D6EFD] border-[#0D6EFD]/30',
  resource: 'text-[#e22718] border-[#e22718]/30',
  article: 'text-[#0fa336] border-[#0fa336]/30',
  video: 'text-[#fb923c] border-[#fb923c]/30'
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const reduce = useReducedMotion();

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
    } finally {
      setSubmitting(false);
    }
  };

  const logoUrl = getCpaLogoUrl();

  return (
    <>
      <Helmet>
        <title>Code+ Academy — Elite Developer Platform</title>
        <meta name="description" content="The unified home for elite developers." />
      </Helmet>

      <div className="min-h-screen w-full bg-black text-white selection:bg-[#0D6EFD] selection:text-black overflow-x-hidden font-sans">
        
        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between border-b border-[#3c3c3c] bg-black/90 backdrop-blur-md">
          <Link to="/" className="flex items-center">
            <img
              src={logoUrl}
              alt="Code Plus Academy"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {['Academy', 'Courses', 'Community'].map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#7e7e7e] transition-colors hover:text-white"
              >
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/feed')}
                className="rounded-none px-5 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white"
                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ffffff' }}
              >
                Feed →
              </button>
            ) : (
              <>
                <Link to="/login" className="rounded-none border border-[#3c3c3c] bg-transparent px-5 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-[#bbbbbb] transition-colors hover:border-white hover:text-white">
                  Login
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="rounded-none px-5 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white"
                  style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ffffff' }}
                >
                  Join
                </button>
              </>
            )}
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
          {/* Subtle grid pattern overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(13,110,253,.06),transparent_60%)]" />

          <div className="relative z-10 max-w-4xl w-full text-center">
            {/* Status chip */}
            <motion.div
              initial={reduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-none border border-[#3c3c3c] bg-[#111] px-4 py-2 mb-8"
            >
              <span className="size-2 rounded-full bg-[#0D6EFD] animate-ping" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#bbbbbb] uppercase">
                SYSTEM STATUS: ACTIVE Waitlist Phase 01
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={reduce ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[0.92] tracking-tight uppercase"
            >
              THE UNIFIED HOME
              <br />
              FOR{' '}
              <span className="bg-gradient-to-r from-[#0D6EFD] via-[#6366f1] to-[#e22718] bg-clip-text text-transparent">
                ELITE DEVELOPERS
              </span>
            </motion.h1>

            <motion.p
              initial={reduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mx-auto mt-6 max-w-2xl text-[16px] font-light leading-7 text-[#bbbbbb]"
            >
              Bridge the gap between human communication and technical precision. Ship, share, and scale alongside the top creators.
            </motion.p>

            {/* Countdown */}
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-10"
            >
              <CountdownTimer launchDate={LAUNCH_DATE} />
            </motion.div>

            {/* Action waitlist */}
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mx-auto mt-12 max-w-lg flex flex-col items-center"
            >
              {!user ? (
                <form onSubmit={handleWaitlist} className="w-full rounded-none border border-[#3c3c3c] bg-[#0d0d0d] p-1.5 flex flex-col sm:flex-row gap-2 mb-3">
                  <div className="flex-1 flex items-center gap-3 px-3 py-2">
                    <Terminal className="size-4 text-[#0D6EFD] shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="developer@cpa.academy"
                      disabled={joined || submitting}
                      className="flex-1 bg-transparent font-mono text-[13px] text-white placeholder:text-[#7e7e7e] outline-none"
                    />
                  </div>
                  {joined ? (
                    <span className="rounded-none border border-[#0fa336] bg-[#0fa336]/10 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] text-[#0fa336] flex items-center justify-center gap-1.5">
                      <Check className="size-3.5" /> JOINED Waitlist
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-none px-6 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white"
                      style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ffffff' }}
                    >
                      {submitting ? 'Connecting...' : 'Secure Access'}
                    </button>
                  )}
                </form>
              ) : (
                <button
                  onClick={() => navigate('/feed')}
                  className="rounded-none px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white mb-3"
                  style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ffffff' }}
                >
                  Enter Feed →
                </button>
              )}
              <p className="font-mono text-[9px] font-bold tracking-widest text-[#7e7e7e] uppercase">
                Limited Nodes Remaining — Active Waitlist Phase 01
              </p>
            </motion.div>
          </div>
        </section>

        {/* FEATURES SECTION (Bento Style) */}
        <section id="academy" className="relative w-full bg-[#0d0d0d] border-t border-[#3c3c3c] py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-6">
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="mb-14"
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-3">
                / ACADEMY CORE
              </p>
              <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
                BUILT FOR HOW YOU ACTUALLY WORK
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
            >
              {[
                { icon: <Users className="size-6 text-[#9333EA]" />, title: 'Community', desc: 'Connect with elite engineers worldwide. Shared challenges, collective breakthroughs, zero-noise networking.' },
                { icon: <BookOpen className="size-6 text-[#0D6EFD]" />, title: 'Courses', desc: 'Deep-dive architecture modules and high-velocity coding sessions from industry practitioners.' },
                { icon: <FileText className="size-6 text-[#0fa336]" />, title: 'Articles', desc: "Engineering blogs that don't skim the surface. Real code, real scale, real solutions." },
                { icon: <Code2 className="size-6 text-[#fb923c]" />, title: 'Resources', desc: 'Download curated templates, boilerplates, and tools built by engineers who ship daily.' },
              ].map((feat, idx) => (
                <motion.div
                  key={feat.title}
                  variants={fadeUp}
                  custom={idx}
                  className="rounded-none border border-[#3c3c3c] bg-[#1A181B] p-6 hover:border-[#0D6EFD] transition-colors group"
                >
                  <div className="mb-6 flex items-center justify-between">
                    {feat.icon}
                    <span className="font-mono text-[10px] text-[#7e7e7e]">0{idx + 1}</span>
                  </div>
                  <h3 className="font-sans text-[18px] font-bold text-white uppercase tracking-tight mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-[13px] font-light leading-6 text-[#bbbbbb]">
                    {feat.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Github sync simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 border border-[#3c3c3c] bg-[#1A181B] p-6 sm:p-10">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[11px] font-bold text-[#0fa336] border border-[#0fa336]/30 px-2 py-0.5">
                    AUTO SYNC
                  </span>
                  <h3 className="font-sans text-[20px] sm:text-[24px] font-black text-white uppercase tracking-tight">
                    GITHUB REPOSITORY SYNC
                  </h3>
                </div>
                <p className="text-[14px] font-light leading-7 text-[#bbbbbb] max-w-md mb-6">
                  Automate your learning path. Sync your repositories and let Code Plus Academy suggest modules based on your actual tech stack.
                </p>
              </div>

              {/* Terminal box */}
              <div className="rounded-none border border-[#3c3c3c] bg-[#0d0d0d] p-5 font-mono text-[12px] leading-6 overflow-x-auto relative">
                <div className="flex items-center gap-1.5 mb-4 border-b border-[#3c3c3c] pb-3">
                  <span className="size-2 rounded-full bg-[#e22718]" />
                  <span className="size-2 rounded-full bg-[#f4b400]" />
                  <span className="size-2 rounded-full bg-[#0fa336]" />
                  <span className="ml-2 text-[10px] text-[#7e7e7e]">academy-sync.sh</span>
                </div>
                <p className="text-[#0D6EFD]">$ git checkout academy-main</p>
                <p className="text-[#7e7e7e]">Switched to branch 'academy-main'</p>
                <p className="text-white">$ academy sync --user=dev</p>
                <p className="text-[#7e7e7e]">Analyzing codebase dependencies...</p>
                <p className="text-[#9333EA]">✓ Rust Core Patterns: Loaded (Advanced)</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRENDING POSTS */}
        <section className="relative w-full bg-black py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-3">
                  / LIVE FEED
                </p>
                <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
                  TRENDING ON CPA
                </h2>
              </div>
              <button
                onClick={() => navigate(user ? '/feed' : '/register')}
                className="rounded-none bg-transparent px-5 py-2.5 text-[11px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white hover:text-[#0D6EFD]"
                style={{ border: '1px solid #3c3c3c' }}
              >
                VIEW FEED <ArrowUpRight className="size-4 inline ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(trendingPosts.length > 0 ? trendingPosts : Array(4).fill(null)).map((post, i) => (
                <div
                  key={post?.id || i}
                  onClick={() => post && navigate(`/activity:${post.slug || post.id}`)}
                  className="group relative rounded-none border border-[#3c3c3c] bg-[#1A181B] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#0D6EFD] hover:shadow-[0_0_24px_rgba(13,110,253,0.08)] cursor-pointer"
                >
                  <div className="w-full aspect-video bg-[#0d0d0d] mb-4 flex items-center justify-center border border-[#3c3c3c] relative overflow-hidden">
                    {post?.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[24px] text-[#7e7e7e]">{!post ? '⌛' : '📄'}</span>
                    )}
                  </div>
                  
                  <span className={`rounded-none border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider inline-block mb-3 ${
                    TYPE_COLORS[post?.type] || 'text-white border-[#3c3c3c]'
                  }`}>
                    {post?.type || '—'}
                  </span>

                  <h3 className="font-sans text-[14px] font-bold text-white leading-snug line-clamp-2 mb-4 h-10">
                    {post?.title || <span className="block bg-[#3c3c3c] w-3/4 h-3 animate-pulse" />}
                  </h3>

                  {post && (
                    <div className="flex items-center gap-2 border-t border-[#3c3c3c] pt-3 mt-auto">
                      <img
                        src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
                        alt=""
                        className="size-5 rounded-full bg-[#0d0d0d]"
                      />
                      <span className="font-mono text-[10px] text-[#7e7e7e]">@{post.creator_username}</span>
                      <span className="ml-auto font-mono text-[10px] text-[#7e7e7e]">{post.clap_count || 0} 👏</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED CREATORS */}
        <section id="community" className="relative w-full bg-[#0d0d0d] border-t border-[#3c3c3c] py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-6">
            <div className="text-center mb-14">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#0D6EFD] mb-3">
                / COMMUNITY LEADERS
              </p>
              <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold text-white uppercase tracking-tight leading-[1.05]">
                FEATURED CREATORS
              </h2>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-[#3c3c3c] scrollbar-track-[#0d0d0d]">
              {(creators.length > 0 ? creators : Array(5).fill(null)).map((c, i) => (
                <div
                  key={c?.username || i}
                  onClick={() => c && navigate(`/u/${c.username}`)}
                  className="min-w-[200px] flex-1 rounded-none border border-[#3c3c3c] bg-[#1A181B] p-6 text-center hover:border-[#0D6EFD] transition-colors cursor-pointer"
                >
                  <img
                    src={c?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c?.username || i}`}
                    alt={c?.name || ''}
                    className="size-16 rounded-full border border-[#3c3c3c] mx-auto mb-4 bg-black"
                  />
                  <h4 className="font-sans text-[14px] font-bold text-white uppercase tracking-tight truncate mb-1">
                    {c?.name || '—'}
                  </h4>
                  <p className="font-mono text-[10px] text-[#7e7e7e] mb-4">
                    @{c?.username || '...'}
                  </p>
                  {c && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/u/${c.username}`);
                      }}
                      className="w-full rounded-none py-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#bbbbbb] transition-colors hover:border-[#0D6EFD] hover:text-[#0D6EFD]"
                      style={{ backgroundColor: 'transparent', border: '1px solid #3c3c3c' }}
                    >
                      View Profile
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TELEMETRY STATS BANNER */}
        <section className="w-full bg-black">
          {/* M Tricolor Stripe */}
          <div className="h-1 w-full flex">
            <div className="flex-1 bg-[#0066b1]" />
            <div className="flex-1 bg-[#1c69d4]" />
            <div className="flex-1 bg-[#e22718]" />
          </div>

          <div className="mx-auto max-w-[1440px] px-6 py-16">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { label: 'Developers', value: stats.users },
                { label: 'Resources', value: stats.posts },
                { label: 'Creators', value: stats.creators }
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-mono text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[1.5px] text-[#7e7e7e]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative w-full bg-[#0d0d0d] border-t border-[#3c3c3c] py-24 sm:py-32 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#0D6EFD]" />
              <span className="size-1.5 rounded-full bg-[#0D6EFD]" />
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#0D6EFD]" />
            </div>

            <h2 className="text-[clamp(2rem,6vw,4rem)] font-black text-white uppercase tracking-tight leading-[0.95] mb-6">
              DON'T GET LEFT
              <br />
              IN THE{' '}
              <span className="bg-gradient-to-r from-[#0D6EFD] via-[#6366f1] to-[#e22718] bg-clip-text text-transparent">
                LEGACY.
              </span>
            </h2>

            <p className="text-[15px] font-light leading-7 text-[#bbbbbb] max-w-md mx-auto mb-10">
              The next generation of software engineering starts here. Join the private waitlist today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(user ? '/feed' : '/register')}
                className="rounded-none px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-black transition-colors hover:bg-transparent hover:text-white w-full sm:w-auto"
                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ffffff' }}
              >
                {user ? 'Go to Feed' : 'Secure Waitlist'}
              </button>
              <Link
                to="/faq"
                className="rounded-none border border-[#3c3c3c] bg-transparent px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:border-white w-full sm:w-auto"
              >
                DOCUMENTATION
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full bg-black border-t border-[#3c3c3c]">
          <div className="h-1 w-full flex">
            <div className="flex-1 bg-[#0066b1]" />
            <div className="flex-1 bg-[#1c69d4]" />
            <div className="flex-1 bg-[#e22718]" />
          </div>

          <div className="mx-auto max-w-[1440px] px-6 py-12 sm:py-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <Link to="/">
                  <img
                    src={logoUrl}
                    alt="Code Plus Academy"
                    style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                  />
                </Link>
                <p className="mt-3 text-[11px] font-mono text-[#7e7e7e]">
                  © 2026 Code Plus Academy. Engineered for the next generation.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 md:gap-10">
                {['Privacy', 'Terms', 'Support', 'FAQ'].map(item => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7e7e7e] transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}