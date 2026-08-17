'use client';

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, ShieldCheck, Terminal, Code2, Globe, Cpu,
  ExternalLink, Github, Linkedin, Twitter, Instagram,
  Mail, Award, Sparkles, Layers, CheckCircle2, User,
  ArrowRight, Share2, Copy, Check, Briefcase, GitCommit,
  GitPullRequest, AlertCircle, Laptop, FolderGit2, Trophy,
  Users, CheckCircle, ChevronRight, Hash, Flame, HeartHandshake,
  FileCode, Database, Wind, Box, Atom
} from 'lucide-react';
import initialBuildersData from '../data/builders.json';
import api from '../api/axios';

const FALLBACK_BUILDERS = Array.isArray(initialBuildersData) ? initialBuildersData : [];

// Technology icons mapper helper
const renderTechIcon = (techName) => {
  const t = (techName || '').toLowerCase();
  if (t.includes('react')) return <Atom size={13} style={{ color: '#00dbe9' }} />;
  if (t.includes('node')) return <ServerIcon size={13} style={{ color: '#22c55e' }} />;
  if (t.includes('ts') || t.includes('typescript')) return <FileCode size={13} style={{ color: '#3b82f6' }} />;
  if (t.includes('mongo') || t.includes('postgres') || t.includes('sql') || t.includes('database')) return <Database size={13} style={{ color: '#10b981' }} />;
  if (t.includes('git')) return <Github size={13} style={{ color: '#f97316' }} />;
  if (t.includes('tailwind') || t.includes('css')) return <Wind size={13} style={{ color: '#38bdf8' }} />;
  if (t.includes('docker') || t.includes('container')) return <Box size={13} style={{ color: '#0284c7' }} />;
  if (t.includes('figma') || t.includes('ui') || t.includes('design')) return <Layers size={13} style={{ color: '#a855f7' }} />;
  if (t.includes('system') || t.includes('cloud') || t.includes('infra')) return <Cpu size={13} style={{ color: '#6366f1' }} />;
  return <Code2 size={13} style={{ color: '#6366f1' }} />;
};

function ServerIcon({ size = 13, style = {} }) {
  return <Cpu size={size} style={style} />;
}

export default function BuilderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [builders, setBuilders] = useState(FALLBACK_BUILDERS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/stats/builders')
      .then((res) => {
        if (isMounted && Array.isArray(res.data?.builders) && res.data.builders.length > 0) {
          // Merge API builder data with local structured defaults if fields are missing
          const merged = res.data.builders.map((b) => {
            const fallback = FALLBACK_BUILDERS.find(fb => fb.id === b.id);
            return {
              ...fallback,
              ...b,
              metrics: b.metrics || fallback?.metrics,
              contributionStats: b.contributionStats || fallback?.contributionStats,
              keyContributions: b.keyContributions || fallback?.keyContributions,
              currentlyWorkingOn: b.currentlyWorkingOn || fallback?.currentlyWorkingOn,
              statusBadges: b.statusBadges || fallback?.statusBadges,
            };
          });
          setBuilders(merged);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const builder = builders.find(
    (b) => String(b.id).toLowerCase() === String(id).toLowerCase()
  );

  const currentIndex = builders.findIndex(
    (b) => String(b.id).toLowerCase() === String(id).toLowerCase()
  );

  const prevBuilder = currentIndex > 0 ? builders[currentIndex - 1] : (builders.length > 1 ? builders[builders.length - 1] : null);
  const nextBuilder = currentIndex < builders.length - 1 ? builders[currentIndex + 1] : (builders.length > 1 ? builders[0] : null);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (!builder) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Helmet><title>Builder Not Found | Code Plus Academy</title></Helmet>
        <div style={{
          background: 'var(--surface, #ffffff)', border: '1px solid var(--border, rgba(0,0,0,0.08))',
          borderRadius: 24, padding: '48px 32px', textAlign: 'center', maxWidth: 480, width: '100%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <User size={30} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #0f172a)', margin: '0 0 8px' }}>
            Builder Profile Not Found
          </h2>
          <p style={{ fontSize: 14, color: 'var(--sub, #64748b)', margin: '0 0 24px', lineHeight: 1.6 }}>
            We couldn't find a team member matching identifier <code>{id}</code>.
          </p>
          <Link
            to="/builders"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#ffffff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Builders</span>
          </Link>
        </div>
      </div>
    );
  }

  // Safe dynamic fallback metrics
  const metrics = builder.metrics || {
    projectsLed: 12,
    contributions: 286,
    communityImpact: '1.2K+',
    hackathons: 18,
    repositories: 9
  };

  const contributionStats = builder.contributionStats || {
    total: 286,
    growth: '↑ 28% this month',
    commits: 186,
    pullRequests: 58,
    issuesResolved: 42
  };

  // Structured key contributions
  const rawContributions = builder.keyContributions || (
    Array.isArray(builder.contributions) && builder.contributions.length > 0
      ? builder.contributions.map((c, i) => ({
          title: typeof c === 'string' ? c.split('&')[0].trim() : `Platform Module #${i + 1}`,
          role: i === 0 ? 'Maintainer' : 'Contributor',
          description: typeof c === 'string' ? c : 'Architected core subsystem modules.',
          technologies: builder.skills ? builder.skills.slice(0, 3) : ['React', 'Node.js']
        }))
      : [
          {
            title: 'CodePlus Platform Core',
            role: 'Maintainer',
            description: 'Architected and maintained core modules for user collaboration and builder profiles.',
            technologies: ['TypeScript', 'React', 'Node.js']
          },
          {
            title: 'Community Onboarding Flow',
            role: 'Contributor',
            description: 'Built onboarding system for new builders and streamlined profile verification flow.',
            technologies: ['React', 'Tailwind CSS']
          },
          {
            title: 'Hackathon Manager',
            role: 'Contributor',
            description: 'Developed hackathon registration and team management system.',
            technologies: ['React', 'Firebase']
          }
        ]
  );

  // Structured currently working on
  const rawWorkingOn = builder.currentlyWorkingOn || [
    {
      title: 'CodePlus Studio',
      status: 'In Progress',
      color: '#6366f1',
      description: 'Building a collaborative IDE for campus builders.'
    },
    {
      title: 'Builder Analytics Dashboard',
      status: 'In Progress',
      color: '#10b981',
      description: 'Real-time insights and impact tracking for builders.'
    },
    {
      title: 'Open Source Docs Hub',
      status: 'In Progress',
      color: '#f59e0b',
      description: 'Centralized documentation for all CodePlus open source projects.'
    }
  ];

  const statusBadges = builder.statusBadges || [
    `📍 ${builder.teamCategory === 'founders' ? 'Campus Builder' : 'Core Engineer'}`,
    'Open to Collaborate'
  ];

  return (
    <>
      <Helmet>
        <title>{builder.name} — {builder.role} | Code Plus Academy Builders</title>
        <meta name="description" content={builder.bio} />
      </Helmet>

      <div style={{
        width: '100%', minHeight: '100vh',
        background: 'var(--bg, #f8fafc)',
        color: 'var(--text, #0f172a)',
        padding: '24px 20px 80px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>

          {/* ── Top Floating Minimal Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 14, marginBottom: 24, padding: '10px 16px',
            borderRadius: 16, background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, rgba(0,0,0,0.06))',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <Link
              to="/builders"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 13.5, fontWeight: 700, color: '#2563eb',
                textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                background: 'rgba(37, 99, 235, 0.08)', transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to All Builders & Team</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11.5, fontWeight: 700, color: '#10b981',
                padding: '4px 10px', borderRadius: 9999, background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle2 size={13} />
                <span>CodePlus Verified Builder Profile</span>
              </div>

              <button
                onClick={handleShare}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, background: 'transparent',
                  border: '1px solid var(--border, rgba(0,0,0,0.1))',
                  color: 'var(--text, #0f172a)', fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* ── 1. Profile Hero Section ── */}
          <div
            className="builder-hero-card"
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, rgba(0,0,0,0.06))',
              borderRadius: 28,
              padding: '32px 36px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
              marginBottom: 24
            }}
          >
            {/* Decorative Architectural Vector Background */}
            <div
              className="builder-hero-decor"
              style={{
                position: 'absolute', right: -20, bottom: -20, width: 440, height: 280,
                opacity: 0.12, pointerEvents: 'none', zIndex: 0
              }}
            >
              <svg viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <path d="M50 200 L180 80 L320 160 L380 90" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" />
                <path d="M120 220 L220 120 L300 180" stroke="#6366f1" strokeWidth="2" />
                <rect x="220" y="40" width="40" height="40" rx="8" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <rect x="290" y="90" width="30" height="30" rx="6" stroke="#6366f1" strokeWidth="1.5" fill="none" />
                <rect x="160" y="130" width="50" height="50" rx="10" stroke="#0ea5e9" strokeWidth="2" fill="none" />
                <circle cx="340" cy="50" r="16" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <path d="M0 240 L400 240" stroke="#94a3b8" strokeWidth="1.5" />
              </svg>
            </div>

            <div style={{
              display: 'flex', gap: 36, alignItems: 'center',
              position: 'relative', zIndex: 1, flexWrap: 'wrap'
            }}>
              {/* Large Profile Image */}
              <div style={{ flexShrink: 0 }}>
                {builder.avatar ? (
                  <img
                    src={builder.avatar}
                    alt={builder.name}
                    className="builder-avatar-img"
                    style={{
                      width: 290, height: 280, borderRadius: 24,
                      objectFit: 'cover', display: 'block',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  />
                ) : (
                  <div
                    className="builder-avatar-img"
                    style={{
                      width: 290, height: 280, borderRadius: 24,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1e1b4b 100%)',
                      color: '#ffffff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 64, fontWeight: 900,
                      boxShadow: '0 12px 28px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {getInitials(builder.name)}
                  </div>
                )}
              </div>

              {/* Hero Information */}
              <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                {/* Name + Verified Badge + Socials Header */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 14, marginBottom: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <h1 style={{
                      fontSize: 'clamp(28px, 3.8vw, 44px)', fontWeight: 800,
                      margin: 0, color: 'var(--text, #0f172a)', letterSpacing: '-0.02em',
                      lineHeight: 1.15
                    }}>
                      {builder.name}
                    </h1>

                    {/* Verified Builder Pill */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 9999,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)',
                      fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      <CheckCircle2 size={13} />
                      <span>Verified Builder</span>
                    </span>
                  </div>

                  {/* Verified Socials (Top Right) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, color: 'var(--sub, #94a3b8)',
                      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
                    }}>
                      Verified Socials
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {builder.socials?.github && (
                        <a
                          href={builder.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="GitHub Profile"
                          className="builder-social-btn"
                        >
                          <Github size={16} />
                        </a>
                      )}
                      {builder.socials?.linkedin && (
                        <a
                          href={builder.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="LinkedIn Profile"
                          className="builder-social-btn"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                      {builder.socials?.twitter && (
                        <a
                          href={builder.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Twitter / X Profile"
                          className="builder-social-btn"
                        >
                          <Twitter size={16} />
                        </a>
                      )}
                      {builder.socials?.instagram && (
                        <a
                          href={builder.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram Profile"
                          className="builder-social-btn"
                        >
                          <Instagram size={16} />
                        </a>
                      )}
                      {builder.socials?.email && (
                        <a
                          href={`mailto:${builder.socials.email}`}
                          title="Email"
                          className="builder-social-btn"
                        >
                          <Mail size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Title in Vibrant Blue */}
                <div style={{
                  fontSize: 'clamp(17px, 2.2vw, 21px)', fontWeight: 700,
                  color: '#2563eb', marginBottom: 14
                }}>
                  {builder.role}
                </div>

                {/* Status Badges Row */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                  {statusBadges.map((badgeText, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 14px', borderRadius: 9999,
                        background: 'var(--bg, #f1f5f9)', border: '1px solid var(--border, rgba(0,0,0,0.08))',
                        fontSize: 12.5, fontWeight: 600, color: 'var(--text, #1e293b)'
                      }}
                    >
                      {badgeText}
                    </span>
                  ))}
                </div>

                {/* Narrative Bio */}
                <p style={{
                  fontSize: 14.5, lineHeight: 1.65, color: 'var(--sub, #475569)',
                  margin: '0 0 20px', maxWidth: 720
                }}>
                  {builder.bio}
                </p>

                {/* Categories & Classifications */}
                <div style={{
                  display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                  borderTop: '1px solid var(--border, rgba(0,0,0,0.06))', paddingTop: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--sub, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <User size={14} color="#6366f1" />
                    <span>{builder.status || 'Past Builder'}</span>
                  </div>

                  <span style={{ color: 'var(--border, #cbd5e1)' }}>•</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--sub, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Users size={14} color="#3b82f6" />
                    <span>{builder.teamCategory === 'founders' ? 'Founders & Core' : builder.teamCategory === 'design' ? 'Design & Product' : 'Engineering Subsystem'}</span>
                  </div>

                  {builder.socials?.cpaUsername && (
                    <>
                      <span style={{ color: 'var(--border, #cbd5e1)' }}>•</span>
                      <Link
                        to={`/u/${builder.socials.cpaUsername}`}
                        style={{
                          fontSize: 12, fontWeight: 700, color: '#2563eb',
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <span>@{builder.socials.cpaUsername}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Impact / Contribution Metrics Section ── */}
          <div
            className="builder-metrics-card"
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, rgba(0,0,0,0.06))',
              borderRadius: 22,
              padding: '20px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              marginBottom: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16
            }}
          >
            {/* Metric 1: Projects Led */}
            <div className="metric-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sub, #64748b)' }}>Projects Led</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #0f172a)', lineHeight: 1.15 }}>{metrics.projectsLed}</div>
                <div style={{ fontSize: 11, color: 'var(--sub, #94a3b8)' }}>Across Domains</div>
              </div>
            </div>

            {/* Metric 2: Contributions */}
            <div className="metric-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <GitCommit size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sub, #64748b)' }}>Contributions</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #0f172a)', lineHeight: 1.15 }}>{metrics.contributions}</div>
                <div style={{ fontSize: 11, color: 'var(--sub, #94a3b8)' }}>Commits & PRs</div>
              </div>
            </div>

            {/* Metric 3: Community Impact */}
            <div className="metric-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <HeartHandshake size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sub, #64748b)' }}>Community Impact</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #0f172a)', lineHeight: 1.15 }}>{metrics.communityImpact}</div>
                <div style={{ fontSize: 11, color: 'var(--sub, #94a3b8)' }}>Students Reached</div>
              </div>
            </div>

            {/* Metric 4: Hackathons */}
            <div className="metric-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trophy size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sub, #64748b)' }}>Hackathons</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #0f172a)', lineHeight: 1.15 }}>{metrics.hackathons}</div>
                <div style={{ fontSize: 11, color: 'var(--sub, #94a3b8)' }}>Organized/Participated</div>
              </div>
            </div>

            {/* Metric 5: Repositories */}
            <div className="metric-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 10px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(14, 165, 233, 0.1)',
                color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <FolderGit2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sub, #64748b)' }}>Repositories</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #0f172a)', lineHeight: 1.15 }}>{metrics.repositories}</div>
                <div style={{ fontSize: 11, color: 'var(--sub, #94a3b8)' }}>Active Repos</div>
              </div>
            </div>
          </div>

          {/* ── 3. Main 4-Column Information Grid ── */}
          <div
            className="builder-grid-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              alignItems: 'stretch',
              marginBottom: 24
            }}
          >
            {/* Card 1: About & Engineering Focus */}
            <div
              className="builder-sub-card"
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, rgba(0,0,0,0.06))',
                borderRadius: 22, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <User size={17} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
                    About & Engineering Focus
                  </h3>
                </div>

                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--sub, #475569)', margin: '0 0 20px' }}>
                  {builder.bio}
                </p>

                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                  Core Technologies & Tools
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(builder.skills || ['React', 'Node.js', 'TypeScript', 'Tailwind CSS']).map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 11px', borderRadius: 8,
                        background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, rgba(0,0,0,0.08))',
                        fontSize: 12, fontWeight: 600, color: 'var(--text, #1e293b)'
                      }}
                    >
                      {renderTechIcon(skill)}
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Code & Contribution */}
            <div
              className="builder-sub-card"
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, rgba(0,0,0,0.06))',
                borderRadius: 22, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Code2 size={17} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
                    Code & Contribution
                  </h3>
                </div>

                {/* Total Contributions Summary Box */}
                <div style={{
                  padding: '16px 18px', borderRadius: 14, background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, rgba(0,0,0,0.06))', marginBottom: 18
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
                    Total Contributions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text, #0f172a)' }}>
                      {contributionStats.total}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      {contributionStats.growth}
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, background: 'var(--bg, #f8fafc)', fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Commits</span>
                    <span style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>{contributionStats.commits} &gt;</span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, background: 'var(--bg, #f8fafc)', fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Pull Requests</span>
                    <span style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>{contributionStats.pullRequests} &gt;</span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, background: 'var(--bg, #f8fafc)', fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Issues Resolved</span>
                    <span style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>{contributionStats.issuesResolved} &gt;</span>
                  </div>
                </div>
              </div>

              {builder.socials?.github && (
                <a
                  href={builder.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 700, color: '#2563eb',
                    textDecoration: 'none', marginTop: 8
                  }}
                >
                  <span>View GitHub Profile</span>
                  <ArrowRight size={14} />
                </a>
              )}
            </div>

            {/* Card 3: Key Contributions */}
            <div
              className="builder-sub-card"
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, rgba(0,0,0,0.06))',
                borderRadius: 22, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Award size={17} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
                    Key Contributions
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {rawContributions.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 2
                      }}>
                        <Code2 size={15} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: item.role === 'Maintainer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                            color: item.role === 'Maintainer' ? '#10b981' : '#2563eb'
                          }}>
                            {item.role || 'Contributor'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--sub, #64748b)', margin: '0 0 6px', lineHeight: 1.45 }}>
                          {item.description}
                        </p>
                        {Array.isArray(item.technologies) && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {item.technologies.map((t, ti) => (
                              <span key={ti} style={{ fontSize: 10, fontWeight: 600, color: 'var(--sub, #94a3b8)' }}>
                                {t}{ti < item.technologies.length - 1 ? ' •' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#contributions"
                onClick={(e) => { e.preventDefault(); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: '#2563eb',
                  textDecoration: 'none', marginTop: 8
                }}
              >
                <span>View All Contributions</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Card 4: Currently Working On */}
            <div
              className="builder-sub-card"
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, rgba(0,0,0,0.06))',
                borderRadius: 22, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Laptop size={17} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
                    Currently Working On
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {rawWorkingOn.map((proj, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: idx === 0 ? 'rgba(99, 102, 241, 0.12)' : idx === 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: idx === 0 ? '#6366f1' : idx === 1 ? '#10b981' : '#f59e0b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 2
                      }}>
                        {idx === 0 ? <Code2 size={15} /> : idx === 1 ? <Flame size={15} /> : <Layers size={15} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                            {proj.title}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1'
                          }}>
                            {proj.status || 'In Progress'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--sub, #64748b)', margin: 0, lineHeight: 1.45 }}>
                          {proj.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#projects"
                onClick={(e) => { e.preventDefault(); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: '#2563eb',
                  textDecoration: 'none', marginTop: 8
                }}
              >
                <span>View All Projects</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* ── 4. Previous / Next Builder Navigation ── */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, rgba(0,0,0,0.06))',
              borderRadius: 22,
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}
          >
            {/* Prev Builder */}
            {prevBuilder ? (
              <Link
                to={`/builders/${prevBuilder.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  textDecoration: 'none', color: 'inherit'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, flexShrink: 0
                }}>
                  {getInitials(prevBuilder.name)}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ← Previous Builder
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    {prevBuilder.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub, #64748b)' }}>
                    {prevBuilder.role}
                  </div>
                </div>
              </Link>
            ) : <div />}

            {/* Center Motto */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4
              }}>
                <Users size={18} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                Building the Future Together
              </div>
              <div style={{ fontSize: 12, color: 'var(--sub, #64748b)' }}>
                Every builder. Every idea. Every impact.
              </div>
            </div>

            {/* Next Builder */}
            {nextBuilder ? (
              <Link
                to={`/builders/${nextBuilder.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  textDecoration: 'none', color: 'inherit', textAlign: 'right'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Next Builder →
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    {nextBuilder.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub, #64748b)' }}>
                    {nextBuilder.role}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, flexShrink: 0
                }}>
                  {getInitials(nextBuilder.name)}
                </div>
              </Link>
            ) : <div />}
          </div>

        </div>
      </div>

      <style>{`
        .builder-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg, #f1f5f9);
          border: 1px solid var(--border, rgba(0,0,0,0.08));
          color: var(--text, #1e293b);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .builder-social-btn:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .builder-sub-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .builder-sub-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.05) !important;
          border-color: rgba(37, 99, 235, 0.25) !important;
        }
        @media (max-width: 1180px) {
          .builder-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .builder-metrics-card {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .builder-hero-card {
            padding: 24px 20px !important;
          }
          .builder-hero-decor {
            display: none !important;
          }
          .builder-avatar-img {
            width: 180px !important;
            height: 180px !important;
            margin: 0 auto !important;
          }
          .builder-metrics-card {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            padding: 16px !important;
          }
          .builder-grid-4 {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
