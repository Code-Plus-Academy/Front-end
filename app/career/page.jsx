'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../../src/components/layout/RouteWrappers';
import api from '../../src/api/axios';
import { useTheme } from '../../src/context/ThemeContext';
import { DARK, LIGHT } from '../../src/styles/tokens';
import {
  Briefcase, MapPin, Clock, Search, Sparkles, AlertCircle,
  Building2, Zap, Rocket, ChevronRight, ArrowRight, Users, GraduationCap
} from 'lucide-react';

export default function CareerPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPositions();
  }, []);

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

  const badgeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'intern') return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' };
    if (t === 'full-time') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
    if (t === 'contract') return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
    return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.25)' };
  };

  const typeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'intern') return <GraduationCap size={13} />;
    if (t === 'full-time') return <Briefcase size={13} />;
    return <Users size={13} />;
  };

  const filters = ['ALL', 'intern', 'full-time', 'contract'];

  return (
    <AppLayout noPadding showFooter>
      <div className="cp-root" style={{ '--cp-bg': isDark ? '#0a0b10' : '#f7f8fc', '--cp-surface': isDark ? 'rgba(17,19,28,0.75)' : 'rgba(255,255,255,0.85)', '--cp-border': isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', '--cp-txt': t.txt, '--cp-txt2': t.txt2, '--cp-txt3': t.txt3, '--cp-accent': '#6366f1', '--cp-accent-soft': isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)' }}>

        {/* ─── HERO SECTION ─── */}
        <section className="cp-hero">
          <div className="cp-hero-glow" />
          <div className="cp-hero-inner">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="cp-hero-badge">
                <Sparkles size={14} />
                <span>We're Hiring</span>
                <span className="cp-pulse" />
              </span>
            </motion.div>

            <motion.h1
              className="cp-hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
            >
              Build the Future of
              <br />
              <span className="cp-gradient-text">Developer Education</span>
            </motion.h1>

            <motion.p
              className="cp-hero-desc"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
            >
              Join Code+ Academy's engineering team. Ship AI tools, interactive learning platforms,
              and developer infrastructure used by thousands — or kickstart your career with a
              fast-track internship.
            </motion.p>

            <motion.div
              className="cp-hero-perks"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
            >
              {[
                { icon: Zap, label: 'High-Impact Work' },
                { icon: Rocket, label: 'Fast-Track Internships' },
                { icon: Building2, label: 'Remote-First' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="cp-perk">
                  <Icon size={15} />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── POSITIONS SECTION ─── */}
        <section className="cp-positions-section">
          <div className="cp-positions-inner">

            {/* Toolbar */}
            <motion.div
              className="cp-toolbar"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="cp-search-wrap">
                <Search size={17} className="cp-search-icon" />
                <input
                  type="text"
                  className="cp-search-input"
                  placeholder="Search by role, skill, or department…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="cp-search-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>

              <div className="cp-filter-group">
                {filters.map((f) => {
                  const active = filterType === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      className={`cp-filter-btn ${active ? 'active' : ''}`}
                    >
                      {f === 'ALL' ? 'All Roles' : f.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Results header */}
            {!loading && !error && (
              <div className="cp-results-bar">
                <span>{filteredPositions.length} open position{filteredPositions.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cp-card-list">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="cp-skeleton" />
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="cp-empty">
                  <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
                  <h3>Something went wrong</h3>
                  <p>{error}</p>
                  <button className="cp-retry-btn" onClick={fetchPositions}>Try Again</button>
                </motion.div>
              ) : filteredPositions.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="cp-empty">
                  <div className="cp-empty-icon-wrap">
                    <Briefcase size={32} />
                  </div>
                  <h3>No open positions found</h3>
                  <p>We don't have any matching roles at the moment. Check back soon — we're always growing.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                  className="cp-card-list"
                >
                  {filteredPositions.map((pos) => {
                    const bc = badgeColor(pos.type);
                    return (
                      <motion.article
                        key={pos.id}
                        variants={{
                          hidden: { opacity: 0, y: 18 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.3 }}
                        className="cp-card"
                      >
                        <div className="cp-card-body">
                          {/* Row 1: title + badge */}
                          <div className="cp-card-row1">
                            <h2 className="cp-card-title">{pos.title}</h2>
                            <span className="cp-badge" style={{ background: bc.bg, color: bc.color, borderColor: bc.border }}>
                              {typeIcon(pos.type)}
                              <span>{pos.type || 'Intern'}</span>
                            </span>
                          </div>

                          {/* Row 2: description */}
                          <p className="cp-card-desc">{pos.description || 'An exciting opportunity to work with the Code+ Academy engineering team.'}</p>

                          {/* Row 3: meta tags */}
                          <div className="cp-card-meta">
                            <span className="cp-meta-tag">
                              <Briefcase size={13} />
                              {pos.department || 'Engineering'}
                            </span>
                            <span className="cp-meta-tag">
                              <MapPin size={13} />
                              {pos.location || 'Remote'}
                            </span>
                            <span className="cp-meta-tag">
                              <Clock size={13} />
                              {pos.openings || 1} opening{(pos.openings || 1) > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <Link href={`/career/${pos.id}`} className="cp-apply-btn">
                          <span>View & Apply</span>
                          <ArrowRight size={16} />
                        </Link>
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ─── ROOT ─── */
        .cp-root {
          width: 100%;
          min-height: 100vh;
          background: var(--cp-bg);
          color: var(--cp-txt);
          overflow-x: hidden;
        }

        /* ─── HERO ─── */
        .cp-hero {
          position: relative;
          padding: 72px 24px 56px;
          text-align: center;
          overflow: hidden;
        }
        .cp-hero-glow {
          position: absolute;
          width: 640px;
          height: 640px;
          top: -220px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%);
          pointer-events: none;
          filter: blur(80px);
        }
        .cp-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 680px;
          margin: 0 auto;
        }

        .cp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: var(--cp-accent-soft);
          border: 1px solid var(--cp-accent);
          color: var(--cp-accent);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .cp-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: cp-blink 2s ease-in-out infinite;
        }
        @keyframes cp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .cp-hero-title {
          font-size: clamp(1.75rem, 5vw, 2.8rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.025em;
          margin: 0 0 16px;
          color: var(--cp-txt);
        }
        .cp-gradient-text {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 40%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cp-hero-desc {
          font-size: clamp(0.9rem, 1.8vw, 1.05rem);
          line-height: 1.65;
          color: var(--cp-txt2);
          margin: 0 0 28px;
          max-width: 540px;
          margin-left: auto;
          margin-right: auto;
        }

        .cp-hero-perks {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cp-perk {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          font-size: 13px;
          font-weight: 600;
          color: var(--cp-txt2);
        }
        .cp-perk svg {
          color: var(--cp-accent);
          flex-shrink: 0;
        }

        /* ─── POSITIONS SECTION ─── */
        .cp-positions-section {
          padding: 0 24px 80px;
        }
        .cp-positions-inner {
          max-width: 820px;
          margin: 0 auto;
        }

        /* ─── TOOLBAR ─── */
        .cp-toolbar {
          display: flex;
          gap: 12px;
          align-items: stretch;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .cp-search-wrap {
          position: relative;
          flex: 1 1 260px;
          min-width: 0;
        }
        .cp-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--cp-txt3);
          pointer-events: none;
        }
        .cp-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 36px 10px 40px;
          border-radius: 10px;
          border: 1px solid var(--cp-border);
          background: var(--cp-surface);
          backdrop-filter: blur(12px);
          color: var(--cp-txt);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cp-search-input::placeholder {
          color: var(--cp-txt3);
        }
        .cp-search-input:focus {
          border-color: var(--cp-accent);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .cp-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          color: var(--cp-txt3);
          cursor: pointer;
          line-height: 1;
        }

        .cp-filter-group {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 10px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          backdrop-filter: blur(12px);
        }
        .cp-filter-btn {
          padding: 8px 16px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--cp-txt3);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-transform: capitalize;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .cp-filter-btn:hover {
          color: var(--cp-txt2);
        }
        .cp-filter-btn.active {
          background: var(--cp-accent);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
        }

        /* ─── RESULTS BAR ─── */
        .cp-results-bar {
          padding: 6px 0 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--cp-txt3);
        }

        /* ─── CARD LIST ─── */
        .cp-card-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ─── POSITION CARD ─── */
        .cp-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 22px 24px;
          border-radius: 14px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: transform 0.2s, box-shadow 0.25s, border-color 0.25s;
        }
        .cp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.2);
        }

        .cp-card-body {
          flex: 1 1 auto;
          min-width: 0;
        }

        .cp-card-row1 {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .cp-card-title {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
          color: var(--cp-txt);
          line-height: 1.3;
        }
        .cp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border: 1px solid;
          flex-shrink: 0;
        }

        .cp-card-desc {
          font-size: 14px;
          line-height: 1.55;
          color: var(--cp-txt2);
          margin: 0 0 10px;
        }

        .cp-card-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cp-meta-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--cp-txt3);
        }
        .cp-meta-tag svg {
          flex-shrink: 0;
        }

        .cp-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: box-shadow 0.25s, transform 0.2s;
          box-shadow: 0 3px 12px rgba(99,102,241,0.3);
        }
        .cp-apply-btn:hover {
          box-shadow: 0 5px 20px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }
        .cp-apply-btn svg {
          transition: transform 0.2s;
        }
        .cp-apply-btn:hover svg {
          transform: translateX(3px);
        }

        /* ─── EMPTY STATE ─── */
        .cp-empty {
          text-align: center;
          padding: 56px 24px;
          border-radius: 14px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
        }
        .cp-empty-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--cp-accent-soft);
          color: var(--cp-accent);
          margin-bottom: 16px;
        }
        .cp-empty h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--cp-txt);
        }
        .cp-empty p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--cp-txt2);
          max-width: 380px;
          margin: 0 auto;
        }
        .cp-retry-btn {
          margin-top: 16px;
          padding: 8px 20px;
          border-radius: 8px;
          background: var(--cp-accent);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
        }

        /* ─── SKELETON ─── */
        .cp-skeleton {
          height: 120px;
          border-radius: 14px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          animation: cp-shimmer 1.6s infinite ease-in-out;
        }
        @keyframes cp-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.2; }
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 640px) {
          .cp-hero {
            padding: 48px 20px 40px;
          }
          .cp-positions-section {
            padding: 0 16px 60px;
          }
          .cp-card {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            padding: 18px;
          }
          .cp-apply-btn {
            width: 100%;
            justify-content: center;
          }
          .cp-toolbar {
            flex-direction: column;
          }
          .cp-filter-group {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </AppLayout>
  );
}
