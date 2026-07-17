import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Terminal, Copy, Check, ArrowUpRight, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ── Mock Technical Resources Data ─────────────────────────────────────────────
const MOCK_RESOURCES = [
  {
    id: 'n1',
    title: 'DATABASE MANAGEMENT SYSTEMS SEMESTER 4 PYQ 2025',
    category: 'DBMS',
    type: 'PDF',
    date: '2026-07-15',
    uploader: {
      name: 'Atharva Kapse',
      username: 'atharva',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=atharva'
    },
    upvotes: 84,
  },
  {
    id: 'n2',
    title: 'DATA STRUCTURES AND ALGORITHMS LECTURE NOTES (COMPLETE ARCHITECTURE)',
    category: 'COMPUTER SCIENCE',
    type: 'PDF',
    date: '2026-07-16',
    uploader: {
      name: 'Priya Sharma',
      username: 'priya',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=priya'
    },
    upvotes: 142,
  },
  {
    id: 'n3',
    title: 'ORGANIC CHEMISTRY II CHEAT SHEET (REACTIONS & MECHANISMS)',
    category: 'AI/ML',
    type: 'MD',
    date: '2026-07-12',
    uploader: {
      name: 'Rahul Verma',
      username: 'rahulv',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=rahulv'
    },
    upvotes: 51,
  },
  {
    id: 'n4',
    title: 'OPERATING SYSTEMS PREVIOUS YEAR PAPERS (SPPU COMP SEM 5)',
    category: 'COMPUTER SCIENCE',
    type: 'PDF',
    date: '2026-07-10',
    uploader: {
      name: 'Amit Patel',
      username: 'amitp',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=amitp'
    },
    upvotes: 19,
  },
  {
    id: 'n5',
    title: 'ADVANCED MACHINE LEARNING NEURAL NETWORKS DEEP DIVE GUIDE',
    category: 'AI/ML',
    type: 'CODE',
    date: '2026-07-14',
    uploader: {
      name: 'Dr. Sarah Connor',
      username: 'sarahc',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarahc'
    },
    upvotes: 95,
  },
  {
    id: 'n6',
    title: 'REACT 19 & NEXT.js 16 APP ROUTER PERFORMANCE RUNTIME CHEAT SHEET',
    category: 'WEB DEV',
    type: 'MD',
    date: '2026-07-17',
    uploader: {
      name: 'Devon Webb',
      username: 'devonw',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=devonw'
    },
    upvotes: 122,
  }
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  // Live Query Terminal Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopicFilter, setActiveTopicFilter] = useState('ALL');
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');
  const [activeSortFilter, setActiveSortFilter] = useState('date');

  // Interactive Showroom Sandbox States
  const [markdownInput, setMarkdownInput] = useState(
    `# DBMS Quick Guide\n- **ACID**: Atomicity, Consistency, Isolation, Durability\n- **Primary Key**: Unique identifier\n- **Foreign Key**: Refers to PK in another table`
  );
  const [bentoUpvotes, setBentoUpvotes] = useState(128);
  const [hasBentoUpvoted, setHasBentoUpvoted] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Technical Registry Navigation Hook
  const [gridTab, setGridTab] = useState('ALL');

  // Waitlist Registration Form Handler
  const handleWaitlist = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setJoined(true);
      toast.success("Welcome to the engine room! 🚀");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission timed out.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(`SELECT * FROM notes\nWHERE status = 'published'\nORDER BY upvotes DESC;`);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Client-Side Terminal Filter Pipeline
  const filteredResources = MOCK_RESOURCES.filter(r => {
    if (gridTab !== 'ALL' && r.category !== gridTab) return false;
    if (searchQuery) {
      const targetString = `${r.title} ${r.category} ${r.type} ${r.uploader.name}`.toLowerCase();
      if (!targetString.includes(searchQuery.toLowerCase())) return false;
    }
    if (activeTopicFilter !== 'ALL' && r.category !== activeTopicFilter) return false;
    if (activeTypeFilter !== 'ALL' && r.type !== activeTypeFilter) return false;
    return true;
  }).sort((a, b) => {
    if (activeSortFilter === 'upvotes') return b.upvotes - a.upvotes;
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <>
      <Helmet>
        <title>NotesArena — High-Performance Knowledge Vault</title>
        <meta name="description" content="Motorsport engineering aesthetic fused with data-dense technical features for developers." />
      </Helmet>

      <div className="min-h-screen bg-black text-[#bbbbbb] font-sans antialiased selection:bg-[#0D6EFD] selection:text-white">
        
        {/* NAVIGATION SYSTEM */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black border-b border-[#3c3c3c] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
              <span className="text-white font-black tracking-[2px] text-lg uppercase font-sans">NOTESARENA</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['ACADEMY', 'COURSES', 'COMMUNITY'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs font-bold tracking-[1.5px] uppercase text-[#bbbbbb] hover:text-[#0D6EFD] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <button
                onClick={() => navigate('/feed')}
                className="border border-[#3c3c3c] bg-transparent text-white hover:text-[#0D6EFD] hover:border-[#0D6EFD] font-bold text-xs uppercase px-6 py-2.5 tracking-[1.5px] rounded-none transition-all duration-200"
              >
                FEED →
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-bold tracking-[1.5px] uppercase text-[#bbbbbb] hover:text-white transition-colors"
                >
                  LOGIN
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white hover:bg-white/90 text-black font-bold text-xs uppercase px-6 py-2.5 tracking-[1.5px] rounded-none transition-all duration-200"
                >
                  ENTER ENGINE
                </button>
              </>
            )}
          </div>
        </nav>

        {/* 1. HERO BAND ("The Engine Room") */}
        <section className="relative pt-36 pb-24 px-6 bg-black border-b border-[#3c3c3c] flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(13,110,253,0.12),transparent_70%)]" />
          
          <div className="relative z-10 max-w-4xl w-full flex flex-col items-center">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-[0.95] mb-6">
              THE MOTORSPORT OF <br />
              <span className="bg-gradient-to-r from-[#0D6EFD] via-[#6e00ff] to-[#e22718] bg-clip-text text-transparent">
                DEVELOPER KNOWLEDGE
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#bbbbbb] font-light max-w-2xl mb-10 leading-relaxed tracking-wide">
              Accelerate your architectural lifecycle. Access raw data-dense study resources, high-velocity cheat sheets, and peer-verified code vaults on an uncompromised engineered dark canvas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center items-center">
              {!user ? (
                <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER DEVELOPER ACCESS EMAIL"
                    disabled={joined || submitting}
                    className="flex-1 bg-black border border-[#3c3c3c] text-white px-4 py-3.5 rounded-none font-mono text-xs focus:outline-none focus:border-[#0D6EFD] uppercase tracking-widest placeholder:text-[#4a5568]"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#0D6EFD] hover:bg-[#0D6EFD]/90 text-white font-bold text-xs uppercase px-8 py-3.5 tracking-[1.5px] rounded-none transition-all duration-200 shrink-0"
                  >
                    {joined ? 'SECURED' : 'GET ACCESS'}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => navigate('/feed')}
                  className="bg-[#0D6EFD] hover:bg-[#0D6EFD]/90 text-white font-bold text-xs uppercase px-8 py-3.5 tracking-[1.5px] rounded-none transition-all duration-200"
                >
                  GO TO STREAM
                </button>
              )}
            </div>

            {/* LIVE TERMINAL BAR WIDGET */}
            <div className="w-full max-w-2xl bg-black border border-[#3c3c3c] rounded-none overflow-hidden text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
              <div className="bg-[#1A181B] border-b border-[#3c3c3c] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e22718]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f4b400]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0fa336]" />
                </div>
                <div className="font-mono text-[9px] text-[#7e7e7e] tracking-[1.5px] uppercase">telemetry-query-core</div>
                <Terminal className="w-3.5 h-3.5 text-[#7e7e7e]" />
              </div>
              <div className="p-5 font-mono text-xs text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#0fa336]">$</span>
                  <span className="text-[#0D6EFD]">cpa search --live</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="filter resource records..."
                    className="bg-transparent border-none outline-none text-white flex-1 caret-[#0D6EFD] focus:ring-0 placeholder:text-[#3c3c3c]"
                  />
                </div>
                <div className="text-[#7e7e7e] text-[11px] mb-4 tracking-normal">
                  {`[system-state] query-filters: topic=${activeTopicFilter} | type=${activeTypeFilter} | sort=${activeSortFilter}`}
                </div>
                <div className="text-[#0D6EFD] text-[11px] mb-5 font-bold">
                  {`> runtime pipeline yielded ${filteredResources.length} structural records`}
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#3c3c3c]/40">
                  <button
                    onClick={() => setActiveTopicFilter(prev => prev === 'DBMS' ? 'ALL' : 'DBMS')}
                    className={`px-3 py-1 text-[9px] uppercase font-bold tracking-[1.5px] border transition-all duration-150 rounded-none ${
                      activeTopicFilter === 'DBMS'
                        ? 'bg-[#0d6efd]/10 border-[#0D6EFD] text-[#0D6EFD]'
                        : 'border-[#3c3c3c] text-[#bbbbbb] hover:border-[#7e7e7e]'
                    }`}
                  >
                    topic:DBMS
                  </button>
                  <button
                    onClick={() => setActiveTypeFilter(prev => prev === 'MD' ? 'ALL' : 'MD')}
                    className={`px-3 py-1 text-[9px] uppercase font-bold tracking-[1.5px] border transition-all duration-150 rounded-none ${
                      activeTypeFilter === 'MD'
                        ? 'bg-[#0d6efd]/10 border-[#0D6EFD] text-[#0D6EFD]'
                        : 'border-[#3c3c3c] text-[#bbbbbb] hover:border-[#7e7e7e]'
                    }`}
                  >
                    type:CheatSheet
                  </button>
                  <button
                    onClick={() => setActiveSortFilter(prev => prev === 'upvotes' ? 'date' : 'upvotes')}
                    className={`px-3 py-1 text-[9px] uppercase font-bold tracking-[1.5px] border transition-all duration-150 rounded-none ${
                      activeSortFilter === 'upvotes'
                        ? 'bg-[#0d6efd]/10 border-[#0D6EFD] text-[#0D6EFD]'
                        : 'border-[#3c3c3c] text-[#bbbbbb] hover:border-[#7e7e7e]'
                    }`}
                  >
                    sort:Upvotes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE FEATURE SHOWROOM (Bento Layout) */}
        <section className="py-24 px-6 bg-black border-b border-[#3c3c3c]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14">
              <span className="font-mono text-xs font-bold text-[#0D6EFD] tracking-[0.2em] uppercase">// METRICS & CAPABILITIES</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-1">THE INTERACTIVE SHOWROOM</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CARD 1: Runtime Parsing Engine Mock */}
              <div className="lg:col-span-2 bg-[#1A181B] border border-[#3c3c3c] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-[1.5px]">Instant Compiler Pipeline</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-none bg-[#0D6EFD]/20 text-[#0D6EFD] font-mono tracking-widest font-bold">LIVE_SANDBOX</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-5 max-w-xl">
                    Verify runtime markdown structure instantly. Modify documentation strings on the input terminal to check the layout normalization output loop.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[#7e7e7e] uppercase mb-1.5">// Markdown Input</span>
                      <textarea
                        value={markdownInput}
                        onChange={(e) => setMarkdownInput(e.target.value)}
                        className="bg-black border border-[#3c3c3c] p-3 text-xs font-mono text-white h-32 resize-none focus:outline-none focus:border-[#0D6EFD] rounded-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[#7e7e7e] uppercase mb-1.5">// Normalized UI View</span>
                      <div className="bg-black border border-[#3c3c3c] p-3 text-xs h-32 overflow-y-auto text-white rounded-none markdown-preview prose prose-invert max-w-none">
                        <ReactMarkdown>{markdownInput}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Peer Verification Widget */}
              <div className="bg-[#1A181B] border border-[#3c3c3c] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-[1.5px]">Peer Verification</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-none bg-[#e22718]/20 text-[#e22718] font-mono tracking-widest font-bold">TELEMETRY</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-5">
                    Democratic credibility enforcement architecture. Interact with the telemetry button to commit an evaluation validation step.
                  </p>
                  <div className="bg-black border border-[#3c3c3c] p-4 flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Compiler Design Lab Manual (Unit 1-4)</h4>
                      <span className="text-[9px] font-mono text-[#7e7e7e]">SPPU ARCHITECTURE CLASS</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#3c3c3c]/30">
                      <div className={`text-[9px] font-bold px-2 py-1 flex items-center gap-1.5 tracking-wider transition-all duration-200 ${
                        hasBentoUpvoted 
                          ? 'bg-[#0D6EFD] text-white' 
                          : 'bg-[#272528] text-[#7e7e7e]'
                      }`}>
                        <Check className="w-3 h-3" />
                        <span>VERIFIED RECORD</span>
                      </div>
                      <button
                        onClick={() => {
                          setBentoUpvotes(prev => hasBentoUpvoted ? prev - 1 : prev + 1);
                          setHasBentoUpvoted(!hasBentoUpvoted);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-widest transition-all duration-200 rounded-none uppercase ${
                          hasBentoUpvoted
                            ? 'bg-white text-black border border-white'
                            : 'border border-[#3c3c3c] text-white hover:border-[#0D6EFD]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{bentoUpvotes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Snippet Vault Terminal */}
              <div className="lg:col-span-3 bg-[#1A181B] border border-[#3c3c3c] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-[1.5px]">Snippet Repository Vault</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-none bg-purple-500/20 text-purple-400 font-mono tracking-widest font-bold">UTILITY_BLOCK</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-4">
                    Extract indexable SQL templates and routing boilerplate parameters straight into local active compiler buffers.
                  </p>
                  <div className="relative bg-black border border-[#3c3c3c] p-4 text-xs font-mono text-white rounded-none">
                    <button
                      onClick={handleCopySnippet}
                      className="absolute top-3 right-3 bg-[#1A181B] border border-[#3c3c3c] hover:border-[#0D6EFD] p-1.5 px-3 flex items-center gap-1.5 transition-all duration-150 text-[10px] rounded-none font-bold uppercase tracking-widest text-white"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#0fa336]" />
                          <span className="text-[#0fa336]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY BUFFER</span>
                        </>
                      )}
                    </button>
                    <pre className="text-left overflow-x-auto text-[#bbbbbb] pt-2">
{`SELECT * FROM academic_records
WHERE deployment_status = 'published'
AND verification_rank > 50
ORDER BY telemetry_upvotes DESC;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TECHNICAL RESOURCE REGISTRY (Analytics Vidhya Structure) */}
        <section className="py-24 px-6 bg-black" id="courses">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#3c3c3c] pb-4 mb-12">
              <div>
                <span className="font-mono text-xs font-bold text-[#0D6EFD] tracking-[0.2em] uppercase">// INDEXED DATA REGISTRY</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-1 mb-4 lg:mb-0">RESOURCE COMPILER GRID</h2>
              </div>
              
              {/* Categories Pills Filters */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {['ALL', 'COMPUTER SCIENCE', 'DBMS', 'AI/ML', 'WEB DEV'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGridTab(tab)}
                    className={`pb-2 text-xs font-bold tracking-[1.5px] uppercase transition-all duration-150 rounded-none border-b-2 ${
                      gridTab === tab
                        ? 'border-[#0D6EFD] text-white'
                        : 'border-transparent text-[#7e7e7e] hover:text-[#bbbbbb]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Density Card Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-[#1A181B] border border-[#3c3c3c] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#0D6EFD] hover:shadow-[0_0_20px_rgba(13,110,253,0.15)] rounded-none group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 bg-black text-white border border-[#3c3c3c] rounded-none tracking-widest">
                        {res.type}
                      </span>
                      <span className="text-[10px] font-mono text-[#7e7e7e]">
                        {res.date}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 line-clamp-2 min-h-[40px] leading-snug group-hover:text-white transition-colors">
                      {res.title}
                    </h3>
                  </div>

                  {/* Telemetry Footer Metadata */}
                  <div className="pt-4 border-t border-[#3c3c3c]/40 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={res.uploader.avatarUrl}
                          alt={res.uploader.name}
                          className="w-5 h-5 rounded-full bg-black border border-[#3c3c3c]"
                        />
                        <span className="text-[10px] font-mono text-[#bbbbbb]">
                          @{res.uploader.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#bbbbbb]">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#0D6EFD]" />
                        <span>{res.upvotes} UPVOTES</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/resources/${res.id}`)}
                      className="w-full border border-[#3c3c3c] group-hover:border-[#0D6EFD] bg-transparent text-white group-hover:text-[#0D6EFD] text-[10px] font-bold uppercase py-2.5 tracking-[1.5px] rounded-none transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <span>VIEW RESOURCE RECORD</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredResources.length === 0 && (
                <div className="col-span-full py-20 text-center text-[#7e7e7e] font-mono text-xs tracking-wider border border-dashed border-[#3c3c3c]">
                  &gt; execution returned 0 active data entities matching query criteria.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. SYSTEM TELEMETRY STRIPE BANNER (BMW M Design Divider) */}
        <section className="bg-black">
          {/* Confident Machined Tricolor Stripe */}
          <div className="h-1 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] w-full" />
          
          <div className="max-w-6xl mx-auto py-20 px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center lg:text-left">
              <div>
                <div className="font-mono text-4xl font-black text-white tracking-tight">10,000+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">NOTES SHREDDED</div>
              </div>
              <div>
                <div className="font-mono text-4xl font-black text-white tracking-tight">500+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">CONTRIBUTING CODERS</div>
              </div>
              <div>
                <div className="font-mono text-4xl font-black text-white tracking-tight">45+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">INDEXED COLLEGES</div>
              </div>
              <div>
                <div className="font-mono text-4xl font-black text-white tracking-tight">2.5M+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">QUERIES COMPILED</div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#3c3c3c] bg-black py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-4 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
                <span className="text-white font-black tracking-[1.5px] text-sm uppercase">NOTESARENA</span>
              </div>
              <p className="font-mono text-[9px] text-[#7e7e7e] mt-2 tracking-wider">
                © {new Date().getFullYear()} CODE PLUS ACADEMY. PLATFORM CONFIGURED FOR OPERATIONAL HIGH PERFORMANCE.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {['Privacy', 'Terms', 'Support', 'FAQ'].map((link) => (
                <Link
                  key={link}
                  to={`/${link.toLowerCase()}`}
                  className="font-mono text-[10px] font-bold tracking-[0.15em] uppercase text-[#7e7e7e] hover:text-[#0D6EFD] transition-colors"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
