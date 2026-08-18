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
  FileCode, Database, Wind, Box, Atom, X
} from 'lucide-react';
import initialBuildersData from '../data/builders.json';
import api from '../api/axios';

const FALLBACK_BUILDERS = Array.isArray(initialBuildersData) ? initialBuildersData : [];

// Technology icons mapper helper
const renderTechIcon = (techName) => {
  const t = (techName || '').toLowerCase();
  if (t.includes('react')) return <Atom size={13} style={{ color: '#00dbe9' }} />;
  if (t.includes('node')) return <Cpu size={13} style={{ color: '#22c55e' }} />;
  if (t.includes('ts') || t.includes('typescript')) return <FileCode size={13} style={{ color: '#3b82f6' }} />;
  if (t.includes('mongo') || t.includes('postgres') || t.includes('sql') || t.includes('database')) return <Database size={13} style={{ color: '#10b981' }} />;
  if (t.includes('git')) return <Github size={13} style={{ color: '#f97316' }} />;
  if (t.includes('tailwind') || t.includes('css')) return <Wind size={13} style={{ color: '#38bdf8' }} />;
  if (t.includes('docker') || t.includes('container')) return <Box size={13} style={{ color: '#0284c7' }} />;
  if (t.includes('figma') || t.includes('ui') || t.includes('design')) return <Layers size={13} style={{ color: '#a855f7' }} />;
  if (t.includes('system') || t.includes('cloud') || t.includes('infra')) return <Cpu size={13} style={{ color: '#6366f1' }} />;
  return <Code2 size={13} style={{ color: '#6366f1' }} />;
};

export default function BuilderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [builders, setBuilders] = useState(FALLBACK_BUILDERS);
  const [copied, setCopied] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

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
      <div style={{ minHeight: '80vh', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

  const githubUrl = builder.socials?.github || 'https://github.com';

  return (
    <>
      <Helmet>
        <title>{builder.name} — {builder.role} | Code Plus Academy Builders</title>
        <meta name="description" content={builder.bio} />
      </Helmet>

      <div className="builder-detail-container">
        <div style={{ maxWidth: 1360, margin: '0 auto', width: '100%' }}>

          {/* ── Top Floating Minimal Header ── */}
          <div className="builder-top-bar">
            <Link
              to="/builders"
              className="builder-back-link"
            >
              <ArrowLeft size={16} />
              <span>Back to All Builders & Team</span>
            </Link>

            <div className="builder-top-actions">
              <div className="builder-verified-pill">
                <CheckCircle2 size={13} />
                <span>CodePlus Verified Builder Profile</span>
              </div>

              <button
                onClick={handleShare}
                className="builder-share-btn"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* ── 1. Profile Hero Section ── */}
          <div className="builder-hero-card">
            {/* Decorative Architectural Vector Background */}
            <div className="builder-hero-decor">
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

            <div className="builder-hero-flex">
              {/* Profile Image */}
              <div className="builder-avatar-wrapper">
                {builder.avatar ? (
                  <img
                    src={builder.avatar}
                    alt={builder.name}
                    className="builder-avatar-img"
                  />
                ) : (
                  <div className="builder-avatar-img builder-avatar-fallback">
                    {getInitials(builder.name)}
                  </div>
                )}
              </div>

              {/* Hero Information */}
              <div className="builder-hero-info">
                {/* Name + Verified Badge + Socials Header */}
                <div className="builder-hero-header-row">
                  <div className="builder-name-row">
                    <h1 className="builder-name-title">
                      {builder.name}
                    </h1>

                    <span className="builder-hero-verified-tag">
                      <CheckCircle2 size={13} />
                      <span>Verified Builder</span>
                    </span>
                  </div>

                  {/* Verified Socials */}
                  <div className="builder-socials-box">
                    <span className="builder-socials-label">
                      Verified Socials
                    </span>
                    <div className="builder-socials-list">
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
                <div className="builder-role-title">
                  {builder.role}
                </div>

                {/* Status Badges Row */}
                <div className="builder-badges-row">
                  {statusBadges.map((badgeText, idx) => (
                    <span
                      key={idx}
                      className="builder-badge-pill"
                    >
                      {badgeText}
                    </span>
                  ))}
                </div>

                {/* Narrative Bio */}
                <p className="builder-bio-paragraph">
                  {builder.bio}
                </p>

                {/* Categories & Classifications */}
                <div className="builder-meta-row">
                  <div className="builder-meta-item">
                    <User size={14} color="#6366f1" />
                    <span>{builder.status || 'Past Builder'}</span>
                  </div>

                  <span className="builder-meta-dot">•</span>

                  <div className="builder-meta-item">
                    <Users size={14} color="#3b82f6" />
                    <span>{builder.teamCategory === 'founders' ? 'Founders & Core' : builder.teamCategory === 'design' ? 'Design & Product' : 'Engineering Subsystem'}</span>
                  </div>

                  {builder.socials?.cpaUsername && (
                    <>
                      <span className="builder-meta-dot">•</span>
                      <Link
                        to={`/u/${builder.socials.cpaUsername}`}
                        className="builder-username-link"
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
          <div className="builder-metrics-card">
            {/* Metric 1: Projects Led */}
            <div className="metric-item">
              <div className="metric-icon-box metric-icon-blue">
                <Briefcase size={20} />
              </div>
              <div>
                <div className="metric-label">Projects Led</div>
                <div className="metric-value">{metrics.projectsLed}</div>
                <div className="metric-sub">Across Domains</div>
              </div>
            </div>

            {/* Metric 2: Contributions */}
            <div className="metric-item">
              <div className="metric-icon-box metric-icon-indigo">
                <GitCommit size={20} />
              </div>
              <div>
                <div className="metric-label">Contributions</div>
                <div className="metric-value">{metrics.contributions}</div>
                <div className="metric-sub">Commits & PRs</div>
              </div>
            </div>

            {/* Metric 3: Community Impact */}
            <div className="metric-item">
              <div className="metric-icon-box metric-icon-green">
                <HeartHandshake size={20} />
              </div>
              <div>
                <div className="metric-label">Community Impact</div>
                <div className="metric-value">{metrics.communityImpact}</div>
                <div className="metric-sub">Students Reached</div>
              </div>
            </div>

            {/* Metric 4: Hackathons */}
            <div className="metric-item">
              <div className="metric-icon-box metric-icon-amber">
                <Trophy size={20} />
              </div>
              <div>
                <div className="metric-label">Hackathons</div>
                <div className="metric-value">{metrics.hackathons}</div>
                <div className="metric-sub">Organized/Participated</div>
              </div>
            </div>

            {/* Metric 5: Repositories */}
            <div className="metric-item metric-item-5">
              <div className="metric-icon-box metric-icon-cyan">
                <FolderGit2 size={20} />
              </div>
              <div>
                <div className="metric-label">Repositories</div>
                <div className="metric-value">{metrics.repositories}</div>
                <div className="metric-sub">Active Repos</div>
              </div>
            </div>
          </div>

          {/* ── 3. Main 4-Column Information Grid ── */}
          <div className="builder-grid-4">
            {/* Card 1: About & Engineering Focus */}
            <div className="builder-sub-card">
              <div>
                <div className="sub-card-header">
                  <div className="sub-card-icon-box sub-card-icon-blue">
                    <User size={17} />
                  </div>
                  <h3 className="sub-card-title">
                    About & Engineering Focus
                  </h3>
                </div>

                <p className="sub-card-bio">
                  {builder.bio}
                </p>

                <div className="sub-card-section-label">
                  Core Technologies & Tools
                </div>

                <div className="tech-chips-grid">
                  {(builder.skills || ['React', 'Node.js', 'TypeScript', 'Tailwind CSS']).map((skill, i) => (
                    <span
                      key={i}
                      className="tech-chip"
                    >
                      {renderTechIcon(skill)}
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Code & Contribution */}
            <div className="builder-sub-card">
              <div>
                <div className="sub-card-header">
                  <div className="sub-card-icon-box sub-card-icon-indigo">
                    <Code2 size={17} />
                  </div>
                  <h3 className="sub-card-title">
                    Code & Contribution
                  </h3>
                </div>

                {/* Total Contributions Summary Box */}
                <div className="contrib-summary-box">
                  <div className="contrib-summary-label">
                    Total Contributions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="contrib-summary-val">
                      {contributionStats.total}
                    </div>
                    <span className="contrib-growth-pill">
                      {contributionStats.growth}
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <button
                    onClick={() => setShowContributionsModal(true)}
                    className="contrib-row-btn"
                  >
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Commits</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{contributionStats.commits} &gt;</span>
                  </button>

                  <button
                    onClick={() => setShowContributionsModal(true)}
                    className="contrib-row-btn"
                  >
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Pull Requests</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{contributionStats.pullRequests} &gt;</span>
                  </button>

                  <button
                    onClick={() => setShowContributionsModal(true)}
                    className="contrib-row-btn"
                  >
                    <span style={{ color: 'var(--text, #334155)', fontWeight: 600 }}>Issues Resolved</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{contributionStats.issuesResolved} &gt;</span>
                  </button>
                </div>
              </div>

              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-footer-action-link"
              >
                <span>View GitHub Profile</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Card 3: Key Contributions */}
            <div className="builder-sub-card">
              <div>
                <div className="sub-card-header">
                  <div className="sub-card-icon-box sub-card-icon-blue">
                    <Award size={17} />
                  </div>
                  <h3 className="sub-card-title">
                    Key Contributions
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {rawContributions.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setShowContributionsModal(true)}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}
                    >
                      <div className="contrib-item-icon">
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

              <button
                type="button"
                onClick={() => setShowContributionsModal(true)}
                className="card-footer-action-btn"
              >
                <span>View All Contributions</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Card 4: Currently Working On */}
            <div className="builder-sub-card">
              <div>
                <div className="sub-card-header">
                  <div className="sub-card-icon-box sub-card-icon-blue">
                    <Laptop size={17} />
                  </div>
                  <h3 className="sub-card-title">
                    Currently Working On
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {rawWorkingOn.slice(0, 3).map((proj, idx) => (
                    <div
                      key={idx}
                      onClick={() => setShowProjectsModal(true)}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}
                    >
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

              <button
                type="button"
                onClick={() => setShowProjectsModal(true)}
                className="card-footer-action-btn"
              >
                <span>View All Projects</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* ── 4. Previous / Next Builder Navigation ── */}
          <div className="builder-nav-card">
            {/* Prev Builder */}
            {prevBuilder ? (
              <Link
                to={`/builders/${prevBuilder.id}`}
                className="builder-nav-item builder-nav-prev"
              >
                <div className="builder-nav-avatar">
                  {getInitials(prevBuilder.name)}
                </div>
                <div>
                  <div className="builder-nav-direction">
                    ← Previous Builder
                  </div>
                  <div className="builder-nav-name">
                    {prevBuilder.name}
                  </div>
                  <div className="builder-nav-role">
                    {prevBuilder.role}
                  </div>
                </div>
              </Link>
            ) : <div className="builder-nav-empty" />}

            {/* Center Motto */}
            <div className="builder-nav-center">
              <div className="builder-nav-center-icon">
                <Users size={18} />
              </div>
              <div className="builder-nav-center-title">
                Building the Future Together
              </div>
              <div className="builder-nav-center-sub">
                Every builder. Every idea. Every impact.
              </div>
            </div>

            {/* Next Builder */}
            {nextBuilder ? (
              <Link
                to={`/builders/${nextBuilder.id}`}
                className="builder-nav-item builder-nav-next"
              >
                <div className="builder-nav-next-text">
                  <div className="builder-nav-direction">
                    Next Builder →
                  </div>
                  <div className="builder-nav-name">
                    {nextBuilder.name}
                  </div>
                  <div className="builder-nav-role">
                    {nextBuilder.role}
                  </div>
                </div>
                <div className="builder-nav-avatar builder-nav-avatar-indigo">
                  {getInitials(nextBuilder.name)}
                </div>
              </Link>
            ) : <div className="builder-nav-empty" />}
          </div>

        </div>
      </div>

      {/* ── All Key Contributions Modal ── */}
      {showContributionsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 9999, backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)', border: '1px solid var(--border, rgba(0,0,0,0.1))',
            borderRadius: 24, maxWidth: 680, width: '100%', maxHeight: '85vh',
            overflowY: 'auto', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            color: 'var(--text, #0f172a)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
                    {builder.name}'s Key Contributions
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--sub, #64748b)', margin: 0 }}>
                    Architectural modules, open-source repositories & engineering impact
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContributionsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--sub, #94a3b8)', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {rawContributions.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 18, borderRadius: 16, background: 'var(--bg, #f8fafc)',
                    border: '1px solid var(--border, rgba(0,0,0,0.06))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                      {item.title}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: item.role === 'Maintainer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                      color: item.role === 'Maintainer' ? '#10b981' : '#2563eb'
                    }}>
                      {item.role || 'Contributor'}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--sub, #475569)', lineHeight: 1.55, margin: '0 0 10px' }}>
                    {item.description}
                  </p>

                  {Array.isArray(item.technologies) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.technologies.map((tech, ti) => (
                        <span
                          key={ti}
                          style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: 'var(--surface, #ffffff)', border: '1px solid var(--border, rgba(0,0,0,0.08))',
                            color: 'var(--text, #1e293b)'
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 10, background: '#2563eb',
                  color: '#ffffff', fontSize: 13, fontWeight: 700, textDecoration: 'none'
                }}
              >
                <span>Open GitHub Repositories</span>
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => setShowContributionsModal(false)}
                style={{
                  padding: '9px 18px', borderRadius: 10, background: 'var(--bg, #f1f5f9)',
                  border: '1px solid var(--border, rgba(0,0,0,0.1))', color: 'var(--text, #0f172a)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── All Currently Working On Projects Modal ── */}
      {showProjectsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 9999, backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)', border: '1px solid var(--border, rgba(0,0,0,0.1))',
            borderRadius: 24, maxWidth: 680, width: '100%', maxHeight: '85vh',
            overflowY: 'auto', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            color: 'var(--text, #0f172a)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Laptop size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
                    Active Initiatives & Projects
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--sub, #64748b)', margin: 0 }}>
                    Systems currently in design, engineering and campus rollout
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProjectsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--sub, #94a3b8)', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {rawWorkingOn.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 18, borderRadius: 16, background: 'var(--bg, #f8fafc)',
                    border: '1px solid var(--border, rgba(0,0,0,0.06))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                      {proj.title}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1'
                    }}>
                      {proj.status || 'In Progress'}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--sub, #475569)', lineHeight: 1.55, margin: 0 }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowProjectsModal(false)}
                style={{
                  padding: '9px 22px', borderRadius: 10, background: '#2563eb',
                  color: '#ffffff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .builder-detail-container {
          width: 100%;
          color: var(--text, #0f172a);
          padding: 16px 20px 80px;
          box-sizing: border-box;
        }
        .builder-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
          padding: 10px 16px;
          border-radius: 16px;
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .builder-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(37, 99, 235, 0.08);
          transition: all 0.2s;
        }
        .builder-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .builder-verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #10b981;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .builder-share-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--border, rgba(0,0,0,0.1));
          color: var(--text, #0f172a);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .builder-hero-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          border-radius: 28px;
          padding: 32px 36px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
        }
        .builder-hero-decor {
          position: absolute;
          right: -20px;
          bottom: -20px;
          width: 440px;
          height: 280px;
          opacity: 0.12;
          pointer-events: none;
          z-index: 0;
        }
        .builder-hero-flex {
          display: flex;
          gap: 36px;
          align-items: center;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }
        .builder-avatar-img {
          width: 280px;
          height: 270px;
          border-radius: 24px;
          object-fit: cover;
          display: block;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .builder-avatar-fallback {
          background: linear-gradient(135deg, #3b82f6 0%, #1e1b4b 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.2);
        }
        .builder-hero-info {
          flex: 1 1 480px;
          min-width: 0;
        }
        .builder-hero-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 6px;
        }
        .builder-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .builder-name-title {
          font-size: clamp(28px, 3.8vw, 44px);
          font-weight: 800;
          margin: 0;
          color: var(--text, #0f172a);
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .builder-hero-verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .builder-socials-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .builder-socials-label {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--sub, #94a3b8);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-family: var(--font-mono);
        }
        .builder-socials-list {
          display: flex;
          gap: 8px;
        }
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
        .builder-role-title {
          font-size: clamp(17px, 2.2vw, 21px);
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 14px;
        }
        .builder-badges-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }
        .builder-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: var(--bg, #f1f5f9);
          border: 1px solid var(--border, rgba(0,0,0,0.08));
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text, #1e293b);
        }
        .builder-bio-paragraph {
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--sub, #475569);
          margin: 0 0 20px;
          max-width: 720px;
        }
        .builder-meta-row {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          border-top: 1px solid var(--border, rgba(0,0,0,0.06));
          padding-top: 16px;
        }
        .builder-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: var(--sub, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .builder-meta-dot {
          color: var(--border, #cbd5e1);
        }
        .builder-username-link {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .builder-metrics-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          border-radius: 22px;
          padding: 20px 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        .metric-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 6px 10px;
        }
        .metric-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-icon-blue { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .metric-icon-indigo { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .metric-icon-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .metric-icon-amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .metric-icon-cyan { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
        .metric-label { font-size: 11.5px; fontWeight: 700; color: var(--sub, #64748b); }
        .metric-value { font-size: 24px; font-weight: 800; color: var(--text, #0f172a); line-height: 1.15; }
        .metric-sub { font-size: 11px; color: var(--sub, #94a3b8); }
        
        .builder-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
          margin-bottom: 24px;
        }
        .builder-sub-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          border-radius: 22px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .builder-sub-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.05) !important;
          border-color: rgba(37, 99, 235, 0.25) !important;
        }
        .sub-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .sub-card-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sub-card-icon-blue { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .sub-card-icon-indigo { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .sub-card-title {
          font-size: 16px;
          font-weight: 800;
          margin: 0;
          color: var(--text, #0f172a);
        }
        .sub-card-bio {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--sub, #475569);
          margin: 0 0 20px;
        }
        .sub-card-section-label {
          font-size: 12px;
          font-weight: 800;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }
        .tech-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tech-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 8px;
          background: var(--bg, #f8fafc);
          border: 1px solid var(--border, rgba(0,0,0,0.08));
          font-size: 12px;
          font-weight: 600;
          color: var(--text, #1e293b);
        }
        .contrib-summary-box {
          padding: 16px 18px;
          border-radius: 14px;
          background: var(--bg, #f8fafc);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          margin-bottom: 18px;
        }
        .contrib-summary-label {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .contrib-summary-val {
          font-size: 32px;
          font-weight: 900;
          color: var(--text, #0f172a);
        }
        .contrib-growth-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .contrib-row-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--bg, #f8fafc);
          font-size: 13px;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.15s;
        }
        .contrib-row-btn:hover {
          background: rgba(37, 99, 235, 0.06);
        }
        .contrib-item-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .card-footer-action-link, .card-footer-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.15s ease;
        }
        .card-footer-action-link:hover, .card-footer-action-btn:hover {
          transform: translateX(3px);
        }
        .builder-nav-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, rgba(0,0,0,0.06));
          border-radius: 22px;
          padding: 20px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .builder-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
        }
        .builder-nav-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
        }
        .builder-nav-avatar-indigo {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }
        .builder-nav-direction {
          font-size: 11px;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .builder-nav-name {
          font-size: 15px;
          font-weight: 800;
          color: var(--text, #0f172a);
        }
        .builder-nav-role {
          font-size: 12px;
          color: var(--sub, #64748b);
        }
        .builder-nav-center {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .builder-nav-center-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .builder-nav-center-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text, #0f172a);
        }
        .builder-nav-center-sub {
          font-size: 12px;
          color: var(--sub, #64748b);
        }
        .builder-nav-empty {
          width: 44px;
        }

        /* ── Tablet Breakpoints (769px - 1180px) ── */
        @media (max-width: 1180px) {
          .builder-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .builder-metrics-card {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* ── Mobile Breakpoints (<= 768px) ── */
        @media (max-width: 768px) {
          .builder-detail-container {
            padding: 8px 12px 120px !important;
          }
          .builder-top-bar {
            flex-direction: column;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 12px !important;
          }
          .builder-top-actions {
            justify-content: space-between;
          }
          .builder-hero-card {
            padding: 24px 18px !important;
            border-radius: 22px !important;
          }
          .builder-hero-decor {
            display: none !important;
          }
          .builder-hero-flex {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 20px !important;
          }
          .builder-avatar-img {
            width: 150px !important;
            height: 150px !important;
            border-radius: 20px !important;
            margin: 0 auto !important;
          }
          .builder-hero-info {
            width: 100% !important;
          }
          .builder-hero-header-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .builder-name-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 8px !important;
            justify-content: center !important;
          }
          .builder-name-title {
            font-size: 26px !important;
            text-align: center !important;
          }
          .builder-socials-box {
            align-items: center !important;
            margin: 6px 0 !important;
          }
          .builder-socials-list {
            justify-content: center !important;
          }
          .builder-role-title {
            text-align: center !important;
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
          .builder-badges-row {
            justify-content: center !important;
            margin-bottom: 14px !important;
          }
          .builder-bio-paragraph {
            text-align: center !important;
            font-size: 13.5px !important;
            margin-bottom: 16px !important;
          }
          .builder-meta-row {
            justify-content: center !important;
            gap: 10px !important;
          }
          .builder-metrics-card {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            padding: 16px 12px !important;
          }
          .metric-item {
            gap: 10px !important;
            padding: 4px 6px !important;
          }
          .metric-icon-box {
            width: 38px !important;
            height: 38px !important;
          }
          .metric-value {
            font-size: 20px !important;
          }
          .metric-item-5 {
            grid-column: span 2 !important;
            justify-content: center !important;
          }
          .builder-grid-4 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .builder-sub-card {
            padding: 20px 18px !important;
            border-radius: 20px !important;
          }
          .builder-nav-card {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 20px 16px !important;
            gap: 16px !important;
          }
          .builder-nav-center {
            order: -1;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border, rgba(0,0,0,0.06));
          }
          .builder-nav-item {
            justify-content: flex-start !important;
            padding: 10px 12px;
            border-radius: 14px;
            background: var(--bg, #f8fafc);
          }
          .builder-nav-next {
            flex-direction: row-reverse !important;
            text-align: right !important;
          }
        }
      `}</style>
    </>
  );
}
