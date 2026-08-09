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
  Building2, Zap, Rocket, ArrowRight, Users, GraduationCap, LogIn, CheckCircle2
} from 'lucide-react';

export default function CareerPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const { user } = useAuth();

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchPositions(); }, []);

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

  const filteredPositions = positions.filter((p) => {
    const matchesType = filterType === 'ALL' || (p.type && p.type.toLowerCase() === filterType.toLowerCase());
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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

        {/* ─── POSITIONS ─── */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 12, flexWrap: 'wrap' }}
            >
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
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
                    width: '100%', boxSizing: 'border-box', padding: '10px 36px 10px 40px',
                    borderRadius: 10, border: `1px solid ${borderC}`, background: surface,
                    color: txt, fontSize: 14, outline: 'none',
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

              {/* Filters */}
              <div style={{
                display: 'flex', gap: 4, padding: 4, borderRadius: 10,
                background: surface, border: `1px solid ${borderC}`
              }}>
                {['ALL', 'intern', 'full-time', 'contract'].map((f) => {
                  const active = filterType === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      style={{
                        padding: '8px 16px', borderRadius: 7, border: 'none',
                        background: active ? accent : 'transparent',
                        color: active ? '#ffffff' : txt3,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        textTransform: 'capitalize', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.35)' : 'none'
                      }}
                    >
                      {f === 'ALL' ? 'All Roles' : f.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Results count */}
            {!loading && !error && (
              <div style={{ padding: '4px 0 14px', fontSize: 13, fontWeight: 600, color: txt3 }}>
                {filteredPositions.length} open position{filteredPositions.length !== 1 ? 's' : ''}
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
                    return (
                      <motion.div
                        key={pos.id}
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.28 }}
                        className="cp-card-hover"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 20,
                          padding: '22px 24px', borderRadius: 14,
                          background: surface, border: `1px solid ${borderC}`,
                          transition: 'transform 0.2s, box-shadow 0.25s, border-color 0.25s'
                        }}
                      >
                        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                          {/* Title + badge */}
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
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: 14, lineHeight: 1.55, color: txt2, margin: '0 0 10px' }}>
                            {pos.description || 'An exciting opportunity to work with the Code+ Academy engineering team.'}
                          </p>

                          {/* Meta */}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {[
                              { icon: Briefcase, label: pos.department || 'Engineering' },
                              { icon: MapPin, label: pos.location || 'Remote' },
                              { icon: Clock, label: `${pos.openings || 1} opening${(pos.openings || 1) > 1 ? 's' : ''}` },
                            ].map(({ icon: Icon, label }) => (
                              <span key={label} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                fontSize: 12.5, fontWeight: 500, color: txt3
                              }}>
                                <Icon size={13} style={{ flexShrink: 0 }} />
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* CTA */}
                        <Link href={`/career/${pos.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '10px 22px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#ffffff', fontSize: 14, fontWeight: 600,
                          textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                          boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                          transition: 'box-shadow 0.25s, transform 0.2s'
                        }}>
                          <span>View & Apply</span>
                          <ArrowRight size={16} />
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
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
