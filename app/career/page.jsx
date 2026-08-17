'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../../src/components/layout/RouteWrappers';
import api from '../../src/api/axios';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { DARK, LIGHT } from '../../src/styles/tokens';
import {
  Briefcase, MapPin, Clock, Search, Sparkles, AlertCircle,
  Building2, Zap, Rocket, ArrowRight, Users, GraduationCap, LogIn, CheckCircle2,
  Bookmark, FileText, ExternalLink, MessageSquare, Award, CheckCircle, XCircle, Filter,
  Code2, Compass, Layers, Check
} from 'lucide-react';

export default function CareerPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('POSITIONS'); // 'POSITIONS' | 'MY_APPLICATIONS' | 'SAVED'
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Candidate Dashboard State
  const [myApplications, setMyApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
  const [savedPositionIds, setSavedPositionIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('cpa_saved_positions') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyApplications();
    }
  }, [user]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/career/positions');
      setPositions(res.data?.positions || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setPositions([]);
      } else {
        console.warn('Backend positions endpoint error:', err.message);
        setError('Unable to load positions right now. Please try again.');
        setPositions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    try {
      setAppsLoading(true);
      const res = await api.get('/career/my-applications', {
        params: { candidate_id: user.id, email: user.email }
      });
      setMyApplications(res.data?.applications || []);
    } catch (err) {
      console.warn('Failed fetching candidate applications:', err.message);
    } finally {
      setAppsLoading(false);
    }
  };

  const toggleSavePosition = (posId, e) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (savedPositionIds.includes(posId)) {
      updated = savedPositionIds.filter(id => id !== posId);
    } else {
      updated = [...savedPositionIds, posId];
    }
    setSavedPositionIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cpa_saved_positions', JSON.stringify(updated));
    }
  };

  // Map integer status values (from gRPC proto enum) to string equivalents
  const STATUS_INT_MAP = { 0: 'draft', 1: 'draft', 2: 'upcoming', 3: 'open', 4: 'closed' };

  const normalizeStr = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return STATUS_INT_MAP[val] || String(val);
    if (typeof val === 'object') return val.name || val.value || val.label || val.status || fallback;
    return String(val);
  };

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'open' | 'upcoming' | 'closed'

  const filteredPositions = positions.filter((p) => {
    const pStatus = normalizeStr(p.status, 'open').toLowerCase().trim();
    if (pStatus === 'draft') return false; // Hide draft positions from candidates

    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'open' ? pStatus === 'open' :
      statusFilter === 'upcoming' ? pStatus === 'upcoming' :
      statusFilter === 'closed' ? ['closed', 'archived'].includes(pStatus) : true;

    const pType = (p.type || '').toUpperCase();
    const matchesType =
      filterType === 'ALL' ? true :
      filterType === 'INTERN' ? pType.includes('INTERN') :
      filterType === 'FULLTIME' ? pType.includes('FULL') || pType.includes('CORE') :
      filterType === 'CONTRACT' ? pType.includes('CONTRACT') || pType.includes('PART') : true;

    const pTitle = p.title || '';
    const pDept = p.department || '';
    const pDesc = p.description || '';
    const matchesSearch =
      !searchQuery.trim() ||
      pTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pDept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const savedPositions = positions.filter(p => savedPositionIds.includes(p.id));

  const filteredMyApplications = myApplications.filter(app => {
    if (appStatusFilter === 'ALL') return true;
    if (appStatusFilter === 'OFFER') return app.status === 'approved' || app.offer_status === 'sent';
    if (appStatusFilter === 'CERTIFICATE') return (app.documents || []).some(d => d.document_type === 'certificate');
    if (appStatusFilter === 'ACTIVE') return ['applied', 'screening', 'interview'].includes(app.status);
    if (appStatusFilter === 'REJECTED') return app.status === 'rejected';
    return true;
  });

  const getStatusBadge = (app) => {
    const docs = app.documents || [];
    const hasCert = docs.some(d => d.document_type === 'certificate');
    const hasOffer = app.status === 'approved' || app.offer_status === 'sent' || docs.some(d => d.document_type === 'offer_letter');

    if (hasCert) {
      return { label: 'Certificate Issued', bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.3)', icon: Award };
    }
    if (hasOffer) {
      return { label: 'Offer Letter Sent', bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)', icon: CheckCircle };
    }
    if (app.status === 'rejected') {
      return { label: 'Not Selected', bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', icon: XCircle };
    }
    if (app.status === 'interview') {
      return { label: 'Interview Scheduled', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', icon: Clock };
    }
    return { label: 'Under Review', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)', icon: Clock };
  };

  const badgeStyle = (type) => {
    const v = (type || '').toLowerCase();
    if (v === 'intern') return { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' };
    if (v === 'full-time') return { background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' };
    if (v === 'contract') return { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' };
    return { background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' };
  };

  const typeIcon = (type) => {
    const v = (type || '').toLowerCase();
    if (v === 'intern') return <GraduationCap size={12} />;
    if (v === 'full-time') return <Briefcase size={12} />;
    return <Users size={12} />;
  };

  const extractSkills = (pos) => {
    if (Array.isArray(pos.skills) && pos.skills.length > 0) return pos.skills.slice(0, 4);
    if (typeof pos.skills === 'string' && pos.skills.trim()) {
      return pos.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
    }
    const title = (pos.title || '').toLowerCase();
    if (title.includes('frontend') || title.includes('react')) return ['React', 'Next.js', 'TypeScript', 'CSS'];
    if (title.includes('backend') || title.includes('node')) return ['Node.js', 'PostgreSQL', 'REST APIs', 'System Design'];
    if (title.includes('design') || title.includes('ui')) return ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'];
    if (title.includes('ai') || title.includes('ml')) return ['Python', 'LLMs', 'PyTorch', 'Vector DBs'];
    if (title.includes('intern')) return ['Problem Solving', 'Engineering', 'Fast Learner'];
    return [(pos.department || 'Engineering'), (pos.type || 'Full-time')];
  };

  // Theme-derived colors
  const bg = isDark ? '#0a0b10' : '#f7f8fc';
  const surface = isDark ? 'rgba(17,19,28,0.85)' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const txt = t.txt;
  const txt2 = t.txt2;
  const txt3 = t.txt3 || (isDark ? '#6b7280' : '#94a3b8');
  const accent = '#6366f1';
  const accentSoft = isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)';
  const cardHoverShadow = isDark ? '0 16px 36px rgba(0,0,0,0.45)' : '0 16px 36px rgba(99,102,241,0.14)';

  // 3:4 Position Card Component
  const renderPositionCard = (pos) => {
    const bs = badgeStyle(pos.type);
    const isSaved = savedPositionIds.includes(pos.id);
    const hasApplied = myApplications.some(a => a.position_id === pos.id);
    const skills = extractSkills(pos);
    const st = normalizeStr(pos.status, 'open').toLowerCase().trim();
    const isUpcoming = st === 'upcoming';
    const isClosed = st === 'closed' || st === 'archived';

    return (
      <motion.div
        key={pos.id}
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.28 }}
        className="cp-card-hover cp-pos-34-card"
        style={{
          borderRadius: 20,
          background: surface,
          border: `1px solid ${borderC}`,
          transition: 'transform 0.22s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 22px',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Top Header & Tags */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, marginBottom: 14
          }}>
            {/* Department Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.04em', color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px',
              borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <Briefcase size={12} />
              <span>{pos.department || 'Engineering'}</span>
            </span>

            {/* Save / Bookmark Button */}
            <button
              onClick={(e) => toggleSavePosition(pos.id, e)}
              title={isSaved ? "Remove Bookmark" : "Save Role"}
              style={{
                background: isSaved ? 'rgba(99,102,241,0.18)' : 'transparent',
                border: `1px solid ${isSaved ? accent : borderC}`,
                color: isSaved ? accent : txt3,
                padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Bookmark size={16} fill={isSaved ? accent : 'none'} />
            </button>
          </div>

          {/* Position Title */}
          <h2 style={{
            fontSize: 19, fontWeight: 800, margin: '0 0 10px',
            color: txt, lineHeight: 1.3, letterSpacing: '-0.015em'
          }}>
            {pos.title}
          </h2>

          {/* Type & Status Chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 9999, fontSize: 11,
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
              ...bs
            }}>
              {typeIcon(pos.type)}
              <span>{pos.type || 'Intern'}</span>
            </span>

            {isUpcoming ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 9999, fontSize: 11,
                fontWeight: 700, background: 'rgba(192,132,252,0.15)',
                color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)'
              }}>
                🔮 Opening Soon
              </span>
            ) : isClosed ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 9999, fontSize: 11,
                fontWeight: 700, background: 'rgba(239,68,68,0.15)',
                color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'
              }}>
                🔒 Closed
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 9999, fontSize: 11,
                fontWeight: 700, background: 'rgba(16,185,129,0.12)',
                color: '#10b981', border: '1px solid rgba(16,185,129,0.3)'
              }}>
                ✨ Active Hiring
              </span>
            )}
          </div>

          {/* Location & Metadata */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 12.5, color: txt2, marginBottom: 12
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} style={{ color: txt3 }} />
              <span>{pos.location || 'Remote'}</span>
            </span>
            {pos.experience_level && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} style={{ color: txt3 }} />
                <span>{pos.experience_level}</span>
              </span>
            )}
          </div>

          {/* Clamped Description */}
          <p style={{
            fontSize: 13, lineHeight: 1.55, color: txt3, margin: '0 0 16px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {pos.description}
          </p>

          {/* Tech Stack / Skill Tags */}
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px',
                    borderRadius: 6, background: isDark ? '#070a0e' : '#f1f5f9',
                    border: `1px solid ${borderC}`, color: txt2
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Bottom CTA & Applied Indicator */}
        <div style={{ borderTop: `1px solid ${borderC}`, paddingTop: 14, marginTop: 10 }}>
          {hasApplied && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11.5, fontWeight: 700, color: '#10b981', marginBottom: 10
            }}>
              <CheckCircle size={14} />
              <span>You have applied for this role</span>
            </div>
          )}

          <Link
            href={`/career/${pos.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', boxSizing: 'border-box',
              padding: '11px 16px', borderRadius: 12,
              background: isUpcoming
                ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
                : isClosed
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
              boxShadow: !isUpcoming && !isClosed ? '0 4px 14px rgba(99,102,241,0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>
              {hasApplied ? 'View Application' : isUpcoming ? 'Notify When Open' : isClosed ? 'Role Closed' : 'Apply for Position'}
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout noPadding showFooter>
      <div style={{ width: '100%', minHeight: '100vh', background: bg, color: txt, overflowX: 'hidden' }}>

        {/* ─── HERO ─── */}
        <section style={{
          position: 'relative', padding: '68px 24px 44px', textAlign: 'center', overflow: 'hidden'
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', width: 600, height: 600, top: -200, left: '50%',
            transform: 'translateX(-50%)', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px',
                borderRadius: 9999, background: accentSoft, border: `1px solid ${accent}`,
                color: accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', marginBottom: 20
              }}>
                <Sparkles size={14} />
                <span>We're Hiring</span>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                  display: 'inline-block', animation: 'cpBlink 1.8s infinite'
                }} />
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              style={{
                fontSize: 'clamp(1.8rem, 4.5vw, 2.9rem)', fontWeight: 800,
                lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 14px', color: txt
              }}
            >
              Build the Future of<br />
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #6366f1 45%, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Developer Education</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              style={{
                fontSize: 'clamp(0.9rem, 1.6vw, 1.05rem)', lineHeight: 1.65, color: txt2,
                margin: '0 auto 24px', maxWidth: 540
              }}
            >
              Join Code+ Academy's engineering and product team. Ship interactive developer infrastructure,
              modern student tools, or kickstart your career with a fast-track internship.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {[
                { icon: Zap, label: 'High-Impact Work' },
                { icon: Rocket, label: 'Fast-Track Internships' },
                { icon: Building2, label: 'Remote-First' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 8, background: surface, border: `1px solid ${borderC}`,
                  fontSize: 13, fontWeight: 600, color: txt2
                }}>
                  <Icon size={15} style={{ color: accent, flexShrink: 0 }} />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── DESKTOP/TABLET TOP TAB NAVIGATION ─── */}
        <section style={{ padding: '0 20px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div
              className="hidden md:flex"
              style={{
                gap: 8, padding: 6, borderRadius: 14,
                background: surface, border: `1px solid ${borderC}`,
                justifyContent: 'center', flexWrap: 'wrap'
              }}
            >
              <button
                onClick={() => setActiveTab('POSITIONS')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: activeTab === 'POSITIONS' ? accent : 'transparent',
                  color: activeTab === 'POSITIONS' ? '#ffffff' : txt2,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Briefcase size={16} />
                <span>Open Positions ({positions.filter(p => normalizeStr(p.status).toLowerCase() !== 'draft').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('MY_APPLICATIONS')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: activeTab === 'MY_APPLICATIONS' ? accent : 'transparent',
                  color: activeTab === 'MY_APPLICATIONS' ? '#ffffff' : txt2,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={16} />
                <span>My Applications</span>
                {myApplications.length > 0 && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                    background: activeTab === 'MY_APPLICATIONS' ? 'rgba(255,255,255,0.25)' : accentSoft,
                    color: activeTab === 'MY_APPLICATIONS' ? '#fff' : accent
                  }}>
                    {myApplications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('SAVED')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: activeTab === 'SAVED' ? accent : 'transparent',
                  color: activeTab === 'SAVED' ? '#ffffff' : txt2,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Bookmark size={16} />
                <span>Saved Roles</span>
                {savedPositionIds.length > 0 && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                    background: activeTab === 'SAVED' ? 'rgba(255,255,255,0.25)' : accentSoft,
                    color: activeTab === 'SAVED' ? '#fff' : accent
                  }}>
                    {savedPositionIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ─── TAB CONTENT (3:4 GRID) ─── */}
        <section style={{ padding: '0 20px 100px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>

            {/* TAB 1: OPEN POSITIONS */}
            {activeTab === 'POSITIONS' && (
              <>
                {/* Search & Status Filters Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.28 }}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap',
                    marginBottom: 28, padding: '16px 20px', borderRadius: 16,
                    background: surface, border: `1px solid ${borderC}`
                  }}
                >
                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { id: 'ALL', label: `All Roles (${positions.filter(p => normalizeStr(p.status).toLowerCase() !== 'draft').length})` },
                      { id: 'open', label: `✨ Hiring (${positions.filter(p => normalizeStr(p.status, 'open').toLowerCase() === 'open').length})` },
                      { id: 'upcoming', label: `🔮 Upcoming (${positions.filter(p => normalizeStr(p.status).toLowerCase() === 'upcoming').length})` },
                      { id: 'closed', label: `🔒 Closed (${positions.filter(p => ['closed', 'archived'].includes(normalizeStr(p.status).toLowerCase())).length})` },
                    ].map((st) => {
                      const active = statusFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => setStatusFilter(st.id)}
                          style={{
                            padding: '7px 16px', borderRadius: 9999, fontSize: 12.5, fontWeight: 700,
                            border: `1px solid ${active ? accent : borderC}`,
                            background: active ? accentSoft : 'transparent',
                            color: active ? accent : txt2,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div style={{ position: 'relative', minWidth: 260, flex: '1 1 240px', maxWidth: 360 }}>
                    <Search size={15} style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: txt3, pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      placeholder="Search by role, tech, or dept…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '9px 34px 9px 34px',
                        borderRadius: 10, border: `1px solid ${borderC}`, background: isDark ? '#070a0e' : '#fff',
                        color: txt, fontSize: 13, outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = accent;
                        e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = borderC;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', fontSize: 16, color: txt3, cursor: 'pointer', lineHeight: 1
                        }}
                      >×</button>
                    )}
                  </div>
                </motion.div>

                {/* Cards Container */}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="cp-pos-34-grid"
                    >
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="cp-pos-34-card" style={{
                          borderRadius: 20, background: surface, border: `1px solid ${borderC}`,
                          padding: 24, minHeight: 400, animation: 'cpShimmer 1.8s infinite'
                        }}>
                          <div style={{ height: 20, width: '40%', background: accentSoft, borderRadius: 6, marginBottom: 16 }} />
                          <div style={{ height: 26, width: '80%', background: accentSoft, borderRadius: 8, marginBottom: 14 }} />
                          <div style={{ height: 16, width: '60%', background: accentSoft, borderRadius: 6, marginBottom: 20 }} />
                          <div style={{ height: 60, width: '100%', background: accentSoft, borderRadius: 8, marginBottom: 20 }} />
                          <div style={{ height: 38, width: '100%', background: accentSoft, borderRadius: 10, marginTop: 'auto' }} />
                        </div>
                      ))}
                    </motion.div>
                  ) : error ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{
                        textAlign: 'center', padding: '60px 24px', borderRadius: 20,
                        background: surface, border: `1px solid ${borderC}`
                      }}
                    >
                      <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: txt }}>Something went wrong</h3>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: txt2, maxWidth: 380, margin: '0 auto' }}>{error}</p>
                      <button onClick={fetchPositions} style={{
                        marginTop: 16, padding: '8px 20px', borderRadius: 8, background: accent,
                        color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer'
                      }}>Try Again</button>
                    </motion.div>
                  ) : filteredPositions.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{
                        textAlign: 'center', padding: '64px 24px', borderRadius: 20,
                        background: surface, border: `1px solid ${borderC}`
                      }}
                    >
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 64, height: 64, borderRadius: '50%', background: accentSoft,
                        color: accent, marginBottom: 16
                      }}>
                        <Briefcase size={32} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: txt }}>No open positions found</h3>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: txt2, maxWidth: 400, margin: '0 auto' }}>
                        No roles match the selected filter right now. Check back soon or browse all openings.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                      className="cp-pos-34-grid"
                    >
                      {filteredPositions.map((pos) => renderPositionCard(pos))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* TAB 2: MY APPLICATIONS */}
            {activeTab === 'MY_APPLICATIONS' && (
              <div>
                {!user ? (
                  <div style={{ textAlign: 'center', padding: '56px 24px', background: surface, borderRadius: 20, border: `1px solid ${borderC}` }}>
                    <LogIn size={40} style={{ color: accent, marginBottom: 14 }} />
                    <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 8px' }}>Sign In Required</h3>
                    <p style={{ color: txt2, fontSize: 14, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
                      Sign in to your Code Plus Academy account to view your application progress, recruiter tasks, offer letters, and certificates.
                    </p>
                    <Link href="/login?redirectTo=/career" style={{ padding: '10px 24px', borderRadius: 10, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      Log In Now
                    </Link>
                  </div>
                ) : appsLoading ? (
                  <div style={{ textAlign: 'center', padding: '56px 24px', color: txt2 }}>Loading your candidate applications...</div>
                ) : (
                  <div>
                    {/* Status Filters */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                      {[
                        { id: 'ALL', label: 'All Applications' },
                        { id: 'ACTIVE', label: 'In Progress' },
                        { id: 'OFFER', label: 'Offer Issued 🟢' },
                        { id: 'CERTIFICATE', label: 'Certificates 🎓' },
                        { id: 'REJECTED', label: 'Not Selected 🔴' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setAppStatusFilter(f.id)}
                          style={{
                            padding: '7px 16px', borderRadius: 8, border: `1px solid ${appStatusFilter === f.id ? accent : borderC}`,
                            background: appStatusFilter === f.id ? accentSoft : surface,
                            color: appStatusFilter === f.id ? accent : txt2,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {filteredMyApplications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '56px 24px', background: surface, borderRadius: 20, border: `1px solid ${borderC}` }}>
                        <FileText size={38} style={{ color: txt3, marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No applications under this status</h3>
                        <p style={{ color: txt2, fontSize: 14, maxWidth: 420, margin: '0 auto 18px' }}>
                          You haven't submitted any candidate applications matching this filter.
                        </p>
                        <button onClick={() => setActiveTab('POSITIONS')} style={{ padding: '9px 20px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          Explore Open Roles
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredMyApplications.map(app => {
                          const badge = getStatusBadge(app);
                          const IconComp = badge.icon;
                          const docs = app.documents || [];
                          const offerDoc = docs.find(d => d.document_type === 'offer_letter' || d.document_type === 'offer') || (app.pdf_url ? { pdf_url: app.pdf_url } : null);
                          const certDoc = docs.find(d => d.document_type === 'certificate');

                          return (
                            <div key={app.id} style={{ padding: 24, borderRadius: 18, background: surface, border: `1px solid ${borderC}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                                <div>
                                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: txt }}>
                                    {app.position_title || 'Position Application'}
                                  </h3>
                                  <span style={{ fontSize: 13, color: txt2 }}>
                                    {app.position_department} • Applied on {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                                  </span>
                                </div>

                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                                  background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                                }}>
                                  <IconComp size={14} />
                                  <span>{badge.label}</span>
                                </span>
                              </div>

                              {/* Document Action Buttons */}
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${borderC}` }}>
                                {offerDoc && (offerDoc.pdf_url || app.pdf_url) && (
                                  <a
                                    href={offerDoc.pdf_url || app.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      padding: '8px 16px', borderRadius: 8, background: 'rgba(16,185,129,0.12)',
                                      color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                                      textDecoration: 'none', fontSize: 13, fontWeight: 700
                                    }}
                                  >
                                    <FileText size={15} />
                                    <span>Download Offer Letter PDF</span>
                                    <ExternalLink size={13} />
                                  </a>
                                )}

                                {certDoc && certDoc.pdf_url && (
                                  <a
                                    href={certDoc.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      padding: '8px 16px', borderRadius: 8, background: 'rgba(168,85,247,0.12)',
                                      color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)',
                                      textDecoration: 'none', fontSize: 13, fontWeight: 700
                                    }}
                                  >
                                    <Award size={15} />
                                    <span>Download Certificate PDF</span>
                                    <ExternalLink size={13} />
                                  </a>
                                )}

                                <Link
                                  href={`/career/applications/${app.id}`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 8, background: accentSoft,
                                    color: accent, border: `1px solid ${accent}`,
                                    textDecoration: 'none', fontSize: 13, fontWeight: 700
                                  }}
                                >
                                  <MessageSquare size={15} />
                                  <span>Recruiter Chat & Tasks</span>
                                  <ArrowRight size={14} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED ROLES (3:4 GRID) */}
            {activeTab === 'SAVED' && (
              <div>
                {savedPositions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '56px 24px', background: surface, borderRadius: 20, border: `1px solid ${borderC}` }}>
                    <Bookmark size={38} style={{ color: txt3, marginBottom: 12 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No saved roles</h3>
                    <p style={{ color: txt2, fontSize: 14, maxWidth: 420, margin: '0 auto 18px' }}>
                      Click the bookmark icon on any position card to save it to your bookmarks.
                    </p>
                    <button onClick={() => setActiveTab('POSITIONS')} style={{ padding: '9px 20px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      Explore Roles
                    </button>
                  </div>
                ) : (
                  <div className="cp-pos-34-grid">
                    {savedPositions.map(pos => renderPositionCard(pos))}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* ─── MOBILE FLOATING GLASS DOCK ─── */}
        <div
          className="flex md:hidden"
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 99,
            borderRadius: 30,
            background: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            padding: '6px 8px',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <button
            onClick={() => setActiveTab('POSITIONS')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 0',
              borderRadius: 20,
              border: 'none',
              background: activeTab === 'POSITIONS' ? accentSoft : 'transparent',
              color: activeTab === 'POSITIONS' ? accent : txt3,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 48,
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={18} />
            <span>Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('MY_APPLICATIONS')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 0',
              borderRadius: 20,
              border: 'none',
              background: activeTab === 'MY_APPLICATIONS' ? accentSoft : 'transparent',
              color: activeTab === 'MY_APPLICATIONS' ? accent : txt3,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 48,
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <FileText size={18} />
            <span>Applications</span>
            {myApplications.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: '25%',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: accent,
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {myApplications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SAVED')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 0',
              borderRadius: 20,
              border: 'none',
              background: activeTab === 'SAVED' ? accentSoft : 'transparent',
              color: activeTab === 'SAVED' ? accent : txt3,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 48,
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <Bookmark size={18} />
            <span>Saved</span>
            {savedPositionIds.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: '25%',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {savedPositionIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cpBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes cpShimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.18; }
        }

        /* 3:4 Aspect Ratio Position Cards Grid */
        .cp-pos-34-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          align-items: stretch;
        }

        .cp-pos-34-card {
          min-height: 440px;
          aspect-ratio: 3 / 4;
        }

        .cp-card-hover:hover {
          transform: translateY(-4px) !important;
          box-shadow: ${cardHoverShadow} !important;
          border-color: rgba(99, 102, 241, 0.35) !important;
        }

        @media (max-width: 768px) {
          .cp-pos-34-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .cp-pos-34-card {
            min-height: auto;
            aspect-ratio: auto;
            padding: 20px 18px;
          }
        }
      `}</style>
    </AppLayout>
  );
}
