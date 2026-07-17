import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Terminal, Copy, Check, ArrowUpRight, Search, FileText, Vote, Sparkles, BookOpen, Layers, Users, Star, ThumbsUp, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Mock resources representing study notes
const MOCK_RESOURCES = [
  {
    id: 'n1',
    title: 'Database Management Systems Semester 4 PYQ 2025',
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
    title: 'Data Structures and Algorithms Lecture Notes (Complete Guide)',
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
    title: 'Organic Chemistry II Cheat Sheet (Reactions & Mechanisms)',
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
    title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
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
    title: 'Advanced Machine Learning Neural Networks Guide',
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
    title: 'React 19 & Next.js 16 App Router Performance Cheatsheet',
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

  // Live Query Terminal States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopicFilter, setActiveTopicFilter] = useState('ALL');
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');
  const [activeSortFilter, setActiveSortFilter] = useState('date');

  // Bento Card States
  const [markdownInput, setMarkdownInput] = useState(
    `# DBMS Quick Guide\n- **ACID**: Atomicity, Consistency, Isolation, Durability\n- **Primary Key**: Unique identifier\n- **Foreign Key**: Refers to PK in another table`
  );
  const [bentoUpvotes, setBentoUpvotes] = useState(128);
  const [hasBentoUpvoted, setHasBentoUpvoted] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Technical Resource Grid States
  const [gridTab, setGridTab] = useState('ALL');

  // Waitlist Subscribe Handler
  const handleWaitlist = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setJoined(true);
      toast.success("Welcome aboard! 🚀");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Waitlist submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Snippet Handler
  const handleCopySnippet = () => {
    navigator.clipboard.writeText(`SELECT * FROM notes\nWHERE status = 'published'\nORDER BY upvotes DESC;`);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Filtering Resources logic
  const filteredResources = MOCK_RESOURCES.filter(r => {
    // Grid category tab filter
    if (gridTab !== 'ALL' && r.category !== gridTab) return false;
    
    // Live query search query
    if (searchQuery) {
      const matchText = `${r.title} ${r.category} ${r.type} ${r.uploader.name}`.toLowerCase();
      if (!matchText.includes(searchQuery.toLowerCase())) return false;
    }

    // Live query topic pill filter
    if (activeTopicFilter !== 'ALL' && r.category !== activeTopicFilter) return false;

    // Live query type pill filter
    if (activeTypeFilter !== 'ALL' && r.type !== activeTypeFilter) return false;

    return true;
  }).sort((a, b) => {
    if (activeSortFilter === 'upvotes') {
      return b.upvotes - a.upvotes;
    }
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <>
      <Helmet>
        <title>NotesArena — Developer Notes & Resource Exchange</title>
        <meta name="description" content="Machined high-contrast learning and community exchange platform for developers." />
      </Helmet>

      {/* Main Container */}
      <div className="min-h-screen bg-black text-[#bbbbbb] font-sans antialiased">
        
        {/* NAV BAR */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black border-b border-[#3c3c3c] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
              <span className="text-white font-black tracking-widest text-lg uppercase">NOTESARENA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Academy', 'Courses', 'Community'].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="text-sm font-bold tracking-[1.5px] uppercase text-[#bbbbbb] hover:text-[#0D6EFD] transition-colors"
              >
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/feed')}
                className="border border-[#3c3c3c] hover:border-[#0D6EFD] text-white hover:text-[#0D6EFD] font-bold text-xs uppercase px-5 py-2.5 tracking-widest rounded-none transition-colors"
              >
                FEED →
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-bold tracking-widest uppercase text-[#bbbbbb] hover:text-white transition-colors"
                >
                  LOGIN
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-[#0D6EFD] hover:bg-[#0D6EFD]/90 text-white font-bold text-xs uppercase px-5 py-2.5 tracking-widest rounded-none transition-all"
                >
                  ENTER ACADEMY
                </button>
              </>
            )}
          </div>
        </nav>

        {/* 1. HERO SECTION ("Engine Room") */}
        <section className="relative pt-32 pb-24 px-6 bg-black border-b border-[#3c3c3c] flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(13,110,253,0.15),transparent_70%)]" />
          
          <div className="relative z-10 max-w-4xl w-100 flex flex-col items-center">
            {/* Heavy UPPERCASE Display Header */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[1.05] mb-6">
              THE MOTORSPORT OF <br />
              <span className="bg-gradient-to-r from-[#0D6EFD] to-[#9333EA] bg-clip-text text-transparent">
                DEVELOPER KNOWLEDGE
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#bbbbbb] font-light max-w-2xl mb-8 leading-relaxed">
              Accelerate your engineering lifecycle. Access data-dense study resources, cheat sheets, and verified code implementations on a high-octane dark platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full justify-center">
              {!user ? (
                <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER DEVELOPER EMAIL"
                    disabled={joined || submitting}
                    className="flex-1 bg-black border border-[#3c3c3c] text-white px-4 py-3 rounded-none font-mono text-xs focus:outline-none focus:border-[#0D6EFD] uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#0D6EFD] hover:bg-[#0D6EFD]/90 text-white font-bold text-xs uppercase px-6 py-3 tracking-widest rounded-none transition-all shrink-0"
                  >
                    {joined ? 'WAITLISTED' : 'GET ACCESS'}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => navigate('/feed')}
                  className="bg-[#0D6EFD] hover:bg-[#0D6EFD]/90 text-white font-bold text-xs uppercase px-8 py-3.5 tracking-widest rounded-none transition-all"
                >
                  GO TO FEED
                </button>
              )}
            </div>

            {/* LIVE QUERY TERMINAL */}
            <div className="w-full max-w-2xl bg-black border border-[#3c3c3c] rounded-none overflow-hidden text-left shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-[#1A181B] border-b border-[#3c3c3c] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#e22718]" />
                  <span className="w-3 h-3 rounded-full bg-[#f4b400]" />
                  <span className="w-3 h-3 rounded-full bg-[#0fa336]" />
                </div>
                <div className="font-mono text-[10px] text-[#7e7e7e] tracking-wider uppercase">notes-arena-terminal</div>
                <Terminal className="w-4 h-4 text-[#7e7e7e]" />
              </div>

              {/* Terminal Console */}
              <div className="p-5 font-mono text-xs text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#0fa336]">$</span>
                  <span className="text-[#0D6EFD]">cpa search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="query notes..."
                    className="bg-transparent border-none outline-none text-white flex-1 caret-[#0D6EFD]"
                  />
                </div>
                
                {/* Active Filter Log */}
                <div className="text-[#7e7e7e] mb-4">
                  {`[query] active filters: topic=${activeTopicFilter} | type=${activeTypeFilter} | sort=${activeSortFilter}`}
                </div>

                {/* Simulated Results Count */}
                <div className="text-[#0D6EFD] mb-4">
                  {`> query returned ${filteredResources.length} matches`}
                </div>

                {/* Mini Tag Pills */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3c3c3c]/50">
                  {/* Topic Pill */}
                  <button
                    onClick={() => setActiveTopicFilter(prev => prev === 'DBMS' ? 'ALL' : 'DBMS')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                      activeTopicFilter === 'DBMS'
                        ? 'bg-[#0d6efd]/10 border-[#0D6EFD] text-[#0D6EFD]'
                        : 'border-[#3c3c3c] text-[#bbbbbb] hover:border-[#7e7e7e]'
                    }`}
                  >
                    topic:DBMS
                  </button>

                  {/* Type Pill */}
                  <button
                    onClick={() => setActiveTypeFilter(prev => prev === 'MD' ? 'ALL' : 'MD')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                      activeTypeFilter === 'MD'
                        ? 'bg-[#0d6efd]/10 border-[#0D6EFD] text-[#0D6EFD]'
                        : 'border-[#3c3c3c] text-[#bbbbbb] hover:border-[#7e7e7e]'
                    }`}
                  >
                    type:CheatSheet
                  </button>

                  {/* Sort Pill */}
                  <button
                    onClick={() => setActiveSortFilter(prev => prev === 'upvotes' ? 'date' : 'upvotes')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest border transition-all ${
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

        {/* 2. INTERACTIVE FEATURE SHOWROOM (Bento Grid) */}
        <section className="py-24 px-6 bg-black border-b border-[#3c3c3c]">
          <div className="max-w-6xl mx-auto">
            {/* Subsection header */}
            <div className="mb-12">
              <span className="font-mono text-xs font-bold text-[#0D6EFD] tracking-[0.2em] uppercase">// SYSTEM CAPABILITIES</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-2">TECHNICAL SHOWROOM</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CARD 1: Instant Parsing Demo */}
              <div className="md:col-span-2 bg-[#1A181B] border border-[#3c3c3c] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Instant Parsing Engine</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#0D6EFD] font-bold">REALTIME</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-4">
                    Verify notes structure in real-time. Type standard markdown on the left to see the instant live rendered output on the right.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Raw Markdown Editor */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[#7e7e7e] uppercase mb-1">Raw Input</span>
                      <textarea
                        value={markdownInput}
                        onChange={(e) => setMarkdownInput(e.target.value)}
                        className="bg-black border border-[#3c3c3c] p-3 text-xs font-mono text-white h-32 resize-none focus:outline-none focus:border-[#0D6EFD] rounded-none"
                      />
                    </div>
                    {/* Rendered Preview */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[#7e7e7e] uppercase mb-1">Parsed Output</span>
                      <div className="bg-black border border-[#3c3c3c] p-3 text-xs h-32 overflow-y-auto text-white rounded-none markdown-preview">
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
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Peer Verification</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#0D6EFD] font-bold">WIDGET</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-4">
                    Democratic credibility validation. Click upvote to simulate incrementing resource upvote telemetry.
                  </p>

                  <div className="bg-black border border-[#3c3c3c] p-4 flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Compiler Design Lab Manual</h4>
                      <span className="text-[10px] font-mono text-[#7e7e7e]">SPPU COMP SEM-5</span>
                    </div>

                    {/* Conditional Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`text-[10px] font-bold px-2 py-1 flex items-center gap-1.5 transition-all ${
                        hasBentoUpvoted 
                          ? 'bg-[#0D6EFD] text-white' 
                          : 'bg-[#272528] text-[#7e7e7e]'
                      }`}>
                        <Check className="w-3 h-3" />
                        <span>VERIFIED PEER STUDY</span>
                      </div>

                      {/* Interactive Button */}
                      <button
                        onClick={() => {
                          setBentoUpvotes(prev => hasBentoUpvoted ? prev - 1 : prev + 1);
                          setHasBentoUpvoted(!hasBentoUpvoted);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-widest transition-all rounded-none uppercase ${
                          hasBentoUpvoted
                            ? 'bg-white text-black'
                            : 'border border-[#3c3c3c] text-white hover:border-[#0D6EFD]'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{bentoUpvotes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Snippet Vault */}
              <div className="md:col-span-3 bg-[#1A181B] border border-[#3c3c3c] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Snippet Vault</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#0D6EFD] font-bold">UTILITY</span>
                  </div>
                  <p className="text-xs text-[#bbbbbb] font-light mb-4">
                    Copy syntax-highlighted code templates directly into your workspace.
                  </p>

                  <div className="relative bg-black border border-[#3c3c3c] p-4 text-xs font-mono text-white rounded-none">
                    <button
                      onClick={handleCopySnippet}
                      className="absolute top-3 right-3 bg-[#1A181B] border border-[#3c3c3c] hover:border-[#0D6EFD] p-1.5 flex items-center gap-1.5 transition-all text-xs rounded-none font-bold uppercase tracking-wider text-white"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#0fa336]" />
                          <span className="text-[#0fa336]">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY CODE</span>
                        </>
                      )}
                    </button>
                    <pre className="text-left overflow-x-auto text-[#bbbbbb]">
{`SELECT * FROM notes
WHERE status = 'published'
ORDER BY upvotes DESC;`}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. TECHNICAL RESOURCE GRID */}
        <section className="py-24 px-6 bg-black" id="courses">
          <div className="max-w-6xl mx-auto">
            {/* Header with Navigation Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#3c3c3c] pb-4 mb-12">
              <div>
                <span className="font-mono text-xs font-bold text-[#0D6EFD] tracking-[0.2em] uppercase">// INDEXED DATA</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-2 mb-4 md:mb-0">RESOURCE REGISTRY</h2>
              </div>
              
              {/* Horizontal Tabs */}
              <div className="flex flex-wrap gap-4 md:gap-8">
                {['ALL', 'COMPUTER SCIENCE', 'DBMS', 'AI/ML', 'WEB DEV'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGridTab(tab)}
                    className={`pb-2 text-xs font-bold tracking-[1.5px] uppercase transition-all rounded-none border-b-2 ${
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

            {/* Grid Layout of 6 Note Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-[#1A181B] border border-[#3c3c3c] p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-[#0D6EFD] hover:shadow-[0_0_15px_rgba(13,110,253,0.25)] rounded-none"
                >
                  <div>
                    {/* Header line with file type badge and date */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#272528] text-white border border-[#3c3c3c] rounded-none">
                        {res.type}
                      </span>
                      <span className="text-[10px] font-mono text-[#7e7e7e]">
                        {res.date}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 line-clamp-2 min-h-[40px]">
                      {res.title}
                    </h3>
                  </div>

                  {/* Footer telemetry */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#3c3c3c]/50">
                    <div className="flex items-center gap-2">
                      <img
                        src={res.uploader.avatarUrl}
                        alt={res.uploader.name}
                        className="w-6 h-6 rounded-full bg-black border border-[#3c3c3c]"
                      />
                      <span className="text-[10px] font-mono text-[#bbbbbb]">
                        @{res.uploader.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#bbbbbb]">
                      <ThumbsUp className="w-3 h-3 text-[#0D6EFD]" />
                      <span>{res.upvotes} UPVOTES</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/resources/${res.id}`)}
                    className="w-full mt-6 border border-[#3c3c3c] hover:border-[#0D6EFD] text-white hover:text-[#0D6EFD] text-[10px] font-black uppercase py-2.5 tracking-widest rounded-none transition-colors flex items-center justify-center gap-1"
                  >
                    <span>VIEW RESOURCE</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#7e7e7e] font-mono text-xs">
                  &gt; no resources matching query parameters.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. SYSTEM TELEMETRY STATS BANNER */}
        <section className="bg-black">
          {/* Accent Tricolor Divider Stripe (Light Blue -> Dark Blue -> Red/Magenta) */}
          <div className="h-1 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] w-full" />

          {/* Telemetry Stats Banner */}
          <div className="max-w-6xl mx-auto py-16 px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
              <div>
                <div className="font-mono text-3xl md:text-4xl font-black text-white tracking-tight">10,000+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">NOTES SHREDDED</div>
              </div>
              <div>
                <div className="font-mono text-3xl md:text-4xl font-black text-white tracking-tight">500+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">CONTRIBUTING CODERS</div>
              </div>
              <div>
                <div className="font-mono text-3xl md:text-4xl font-black text-white tracking-tight">45+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">INDEXED COLLEGES</div>
              </div>
              <div>
                <div className="font-mono text-3xl md:text-4xl font-black text-white tracking-tight">2.5M+</div>
                <div className="font-mono text-[9px] font-bold text-[#7e7e7e] tracking-[0.2em] uppercase mt-2">QUERIES COMPILED</div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#3c3c3c] bg-black py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
                <span className="text-white font-black tracking-widest text-sm uppercase">NOTESARENA</span>
              </div>
              <p className="font-mono text-[9px] text-[#7e7e7e] mt-2 tracking-wider">
                © {new Date().getFullYear()} CODE PLUS ACADEMY. ENGINEERED FOR HIGH-PERFORMANCE WORK.
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
