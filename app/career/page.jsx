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
  Bookmark, FileText, ExternalLink, MessageSquare, Award, CheckCircle, XCircle, Filter
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

    const matchesStatus = statusFilter === 'ALL' || pStatus === statusFilter.toLowerCase();
    const pType = normalizeStr(p.type);
    const matchesType = filterType === 'ALL' || (pType && pType.toLowerCase() === filterType.toLowerCase());
    const pTitle = normalizeStr(p.title);
    const pDept = normalizeStr(p.department);
    const pDesc = normalizeStr(p.description);

    const matchesSearch =
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

  // Theme-derived colors
  const bg = isDark ? '#0a0b10' : '#f7f8fc';
  const surface = isDark ? 'rgba(17,19,28,0.8)' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const txt = t.txt;
  const txt2 = t.txt2;
  const txt3 = t.txt3 || (isDark ? '#6b7280' : '#94a3b8');
  const accent = '#6366f1';
  const accentSoft = isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)';
  const cardHoverShadow = isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(99,102,241,0.1)';

  return (
    <AppLayout noPadding showFooter>
      <div style={{ width: '100%', minHeight: '100vh', background: bg, color: txt, overflowX: 'hidden' }}>

        {/* ─── HERO ─── */}
        <section style={{
          position: 'relative', padding: '68px 24px 48px', textAlign: 'center', overflow: 'hidden'
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', width: 600, height: 600, top: -200, left: '50%',
            transform: 'translateX(-50%)', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px',
                borderRadius: 9999, background: accentSoft, border: `1px solid ${accent}`,
                color: accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', marginBottom: 24
              }}>
                <Sparkles size={14} />
                <span>We're Hiring</span>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                  boxShadow: '0 0 6px #10b981', animation: 'cpBlink 2s ease-in-out infinite'
                }} />
              </span>

              {user ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}>
                  <CheckCircle2 size={13} />
                  <span>Signed in as {user.display_name || user.name || user.email}</span>
                </span>
              ) : (
                <Link href="/login?redirectTo=/career" style={{ textDecoration: 'none' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}>
                    <LogIn size={13} />
                    <span>Sign in required to apply</span>
                  </span>
                </Link>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              style={{
                fontSize: 'clamp(1.7rem, 4.5vw, 2.75rem)', fontWeight: 800,
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
                fontSize: 'clamp(0.88rem, 1.6vw, 1.02rem)', lineHeight: 1.65, color: txt2,
                margin: '0 auto 24px', maxWidth: 520
              }}
            >
              Join Code+ Academy's engineering team. Ship AI tools, interactive learning platforms,
              and developer infrastructure — or kickstart your career with a fast-track internship.
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
        <section style={{ padding: '0 16px 20px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            {/* Desktop / Tablet Tab Switcher */}
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
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: activeTab === 'POSITIONS' ? accent : 'transparent',
                  color: activeTab === 'POSITIONS' ? '#ffffff' : txt2,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Briefcase size={16} />
                <span>Open Positions</span>
              </button>

              <button
                onClick={() => setActiveTab('MY_APPLICATIONS')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10, border: 'none',
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
                  padding: '10px 20px', borderRadius: 10, border: 'none',
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

        {/* ─── TAB CONTENT ─── */}
        <section style={{ padding: '0 16px 100px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* TAB 1: OPEN POSITIONS */}
            {activeTab === 'POSITIONS' && (
              <>
                {/* Toolbar */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.28 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 16, flexDirection: 'column' }}
                >
                  {/* Search */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: txt3, pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      placeholder="Search by role, skill, or department…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 36px 12px 40px',
                        borderRadius: 12, border: `1px solid ${borderC}`, background: surface,
                        color: txt, fontSize: 14, outline: 'none', minHeight: 44,
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
                          background: 'none', border: 'none', fontSize: 18, color: txt3, cursor: 'pointer', lineHeight: 1
                        }}
                      >×</button>
                    )}
                  </div>

                  {/* Horizontal Scrollable Status Filter Chips for Mobile/Tablet */}
                  <div
                    style={{
                      display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6,
                      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none'
                    }}
                  >
                    {[
                      { id: 'ALL', label: `All (${positions.filter(p => normalizeStr(p.status).toLowerCase() !== 'draft').length})` },
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
                            padding: '8px 16px', borderRadius: 20, border: `1px solid ${active ? accent : borderC}`,
                            background: active ? accent : surface,
                            color: active ? '#ffffff' : txt2,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            whiteSpace: 'nowrap', flexShrink: 0, minHeight: 36,
                            transition: 'all 0.2s',
                            boxShadow: active ? '0 2px 8px rgba(99,102,241,0.35)' : 'none'
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Horizontal Scrollable Role Type Filter Chips */}
                  <div
                    style={{
                      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
                      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none'
                    }}
                  >
                    {['ALL', 'intern', 'full-time', 'contract'].map((f) => {
                      const active = filterType === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFilterType(f)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? accent : borderC}`,
                            background: active ? accentSoft : 'transparent',
                            color: active ? accent : txt3,
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0,
                            transition: 'all 0.2s'
                          }}
                        >
                          {f === 'ALL' ? 'All Role Types' : f.replace('-', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Results count */}
                {!loading && !error && (
                  <div style={{ padding: '4px 0 14px', fontSize: 13, fontWeight: 600, color: txt3 }}>
                    {filteredPositions.length} position{filteredPositions.length !== 1 ? 's' : ''} found
                  </div>
                )}

                {/* Content */}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      {[1, 2, 3].map((n) => (
                        <div key={n} style={{
                          height: 120, borderRadius: 14, background: surface,
                          border: `1px solid ${borderC}`,
                          animation: 'cpShimmer 1.6s infinite ease-in-out'
                        }} />
                      ))}
                    </motion.div>
                  ) : error ? (
                    <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{
                        textAlign: 'center', padding: '56px 24px', borderRadius: 14,
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
                        textAlign: 'center', padding: '56px 24px', borderRadius: 14,
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
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: txt2, maxWidth: 380, margin: '0 auto' }}>
                        We don't have any matching roles at the moment. Check back soon — we're always growing.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      {filteredPositions.map((pos) => {
                        const bs = badgeStyle(pos.type);
                        const isSaved = savedPositionIds.includes(pos.id);
                        const hasApplied = myApplications.some(a => a.position_id === pos.id);

                        return (
                          <motion.div
                            key={pos.id}
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.28 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 20,
                              padding: '22px 24px', borderRadius: 14,
                              background: surface, border: `1px solid ${borderC}`,
                              transition: 'transform 0.2s, box-shadow 0.25s, border-color 0.25s',
                              position: 'relative'
                            }}
                          >
                            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: txt, lineHeight: 1.3 }}>
                                  {pos.title}
                                </h2>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '3px 10px', borderRadius: 9999, fontSize: 11,
                                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                                  ...bs
                                }}>
                                  {typeIcon(pos.type)}
                                  <span>{pos.type || 'Intern'}</span>
                                </span>

                                {(() => {
                                  const st = normalizeStr(pos.status).toLowerCase().trim();
                                  if (st === 'upcoming') {
                                    return (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}>
                                        🔮 Opening Soon
                                      </span>
                                    );
                                  }
                                  if (st === 'closed' || st === 'archived') {
                                    return (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                                        🔒 Closed
                                      </span>
                                    );
                                  }
                                  return (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                      ✨ Active Hiring
                                    </span>
                                  );
                                })()}

                                {hasApplied && (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px', borderRadius: 9999, fontSize: 11,
                                    fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981',
                                    border: '1px solid rgba(16,185,129,0.3)'
                                  }}>
                                    <CheckCircle size={12} /> Applied
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: txt2, flexWrap: 'wrap', marginBottom: 8 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Briefcase size={14} style={{ color: txt3 }} />
                                  {pos.department || 'Engineering'}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <MapPin size={14} style={{ color: txt3 }} />
                                  {pos.location || 'Remote'}
                                </span>
                              </div>

                              <p style={{
                                fontSize: 13.5, lineHeight: 1.5, color: txt3, margin: 0,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {pos.description}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              <button
                                onClick={(e) => toggleSavePosition(pos.id, e)}
                                title={isSaved ? "Remove Bookmark" : "Save Role"}
                                style={{
                                  background: isSaved ? 'rgba(99,102,241,0.15)' : 'transparent',
                                  border: `1px solid ${isSaved ? accent : borderC}`,
                                  color: isSaved ? accent : txt3,
                                  padding: 10, borderRadius: 10, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Bookmark size={18} fill={isSaved ? accent : 'none'} />
                              </button>

                              {(() => {
                                const st = normalizeStr(pos.status).toLowerCase().trim();
                                const isUpcoming = st === 'upcoming';
                                const isClosed = st === 'closed' || st === 'archived';

                                return (
                                  <Link
                                    href={`/career/${pos.id}`}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      padding: '10px 18px', borderRadius: 10,
                                      background: isUpcoming ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : isClosed ? 'rgba(255,255,255,0.08)' : accent,
                                      color: '#ffffff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                      whiteSpace: 'nowrap', transition: 'all 0.2s',
                                      boxShadow: !isUpcoming && !isClosed ? '0 4px 14px rgba(99,102,241,0.3)' : 'none'
                                    }}
                                  >
                                    <span>
                                      {hasApplied ? 'View Details' : isUpcoming ? 'Opening Soon' : isClosed ? 'Closed' : 'Apply Now'}
                                    </span>
                                    <ArrowRight size={15} />
                                  </Link>
                                );
                              })()}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* TAB 2: MY APPLICATIONS */}
            {activeTab === 'MY_APPLICATIONS' && (
              <div>
                {!user ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: surface, borderRadius: 14, border: `1px solid ${borderC}` }}>
                    <LogIn size={36} style={{ color: accent, marginBottom: 12 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Sign In Required</h3>
                    <p style={{ color: txt2, fontSize: 14, maxWidth: 420, margin: '0 auto 20px' }}>
                      Sign in to your Code Plus Academy account to view your application status, offer letters, and certificates.
                    </p>
                    <Link href="/login?redirectTo=/career" style={{ padding: '10px 22px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      Log In Now
                    </Link>
                  </div>
                ) : appsLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: txt2 }}>Loading your candidate dashboard...</div>
                ) : (
                  <div>
                    {/* Status Filters */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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
                            padding: '6px 14px', borderRadius: 8, border: `1px solid ${appStatusFilter === f.id ? accent : borderC}`,
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
                      <div style={{ textAlign: 'center', padding: '48px 24px', background: surface, borderRadius: 14, border: `1px solid ${borderC}` }}>
                        <FileText size={36} style={{ color: txt3, marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No applications found</h3>
                        <p style={{ color: txt2, fontSize: 14, maxWidth: 420, margin: '0 auto 16px' }}>
                          You haven't submitted any applications under this category yet.
                        </p>
                        <button onClick={() => setActiveTab('POSITIONS')} style={{ padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          Browse Open Roles
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {filteredMyApplications.map(app => {
                          const badge = getStatusBadge(app);
                          const IconComp = badge.icon;
                          const docs = app.documents || [];
                          const offerDoc = docs.find(d => d.document_type === 'offer_letter' || d.document_type === 'offer') || (app.pdf_url ? { pdf_url: app.pdf_url } : null);
                          const certDoc = docs.find(d => d.document_type === 'certificate');

                          return (
                            <div key={app.id} style={{ padding: 22, borderRadius: 14, background: surface, border: `1px solid ${borderC}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
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
                                  padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700,
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
                                      padding: '8px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.12)',
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
                                      padding: '8px 14px', borderRadius: 8, background: 'rgba(168,85,247,0.12)',
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
                                    padding: '8px 14px', borderRadius: 8, background: accentSoft,
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

            {/* TAB 3: SAVED ROLES */}
            {activeTab === 'SAVED' && (
              <div>
                {savedPositions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: surface, borderRadius: 14, border: `1px solid ${borderC}` }}>
                    <Bookmark size={36} style={{ color: txt3, marginBottom: 12 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No saved roles</h3>
                    <p style={{ color: txt2, fontSize: 14, maxWidth: 420, margin: '0 auto 16px' }}>
                      Click the bookmark icon on any position card to save it for later.
                    </p>
                    <button onClick={() => setActiveTab('POSITIONS')} style={{ padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      Explore Roles
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {savedPositions.map(pos => {
                      const bs = badgeStyle(pos.type);
                      return (
                        <div key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 14, background: surface, border: `1px solid ${borderC}` }}>
                          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: txt }}>{pos.title}</h3>
                              <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, ...bs }}>{pos.type}</span>
                            </div>
                            <span style={{ fontSize: 13, color: txt2 }}>{pos.department} • {pos.location || 'Remote'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={(e) => toggleSavePosition(pos.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
                            <Link href={`/career/${pos.id}`} style={{ padding: '8px 16px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Apply</Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* ─── MOBILE FLOATING GLASS DOCK (Mobile & Small Tablets) ─── */}
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
        .cp-card-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: ${cardHoverShadow} !important;
          border-color: rgba(99,102,241,0.22) !important;
        }
        .cp-card-hover:hover a {
          box-shadow: 0 5px 20px rgba(99,102,241,0.45) !important;
        }
        @media (max-width: 640px) {
          .cp-card-hover {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
            padding: 18px !important;
          }
          .cp-card-hover a {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
