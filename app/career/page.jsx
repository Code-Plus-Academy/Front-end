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
  Building2, Zap, Rocket, ChevronRight
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
        setError('No active positions listed at this time.');
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

  return (
    <AppLayout>
      <div
        className="career-page-wrapper"
        style={{
          background: isDark ? '#090a0f' : '#f8fafc',
          color: t.txt,
        }}
      >
        {/* Ambient Glow Elements */}
        <div className="ambient-glow glow-1" style={{ opacity: isDark ? 0.35 : 0.15 }} />
        <div className="ambient-glow glow-2" style={{ opacity: isDark ? 0.3 : 0.1 }} />

        <div className="career-container">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="hero-section"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="pill-badge"
              style={{
                background: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                color: isDark ? '#a5b4fc' : '#4f46e5',
              }}
            >
              <Sparkles size={15} className="sparkle-icon" />
              <span>CAREERS &amp; INTERNSHIPS</span>
              <span className="dot-pulse" />
            </motion.div>

            <h1 className="hero-title" style={{ color: t.txt }}>
              Grow Your Skills. Shape the Future of <span className="title-gradient">Developer Intelligence</span>.
            </h1>

            <p className="hero-subtitle" style={{ color: t.txt2 }}>
              Join Code+ Academy — work on high-scale developer infrastructure, AI tools, and interactive learning platforms, with internship opportunities to grow and improve yourself along the way.
            </p>

            {/* Feature Highlights Grid */}
            <div className="features-strip">
              <div
                className="feature-item"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                  color: t.txt,
                }}
              >
                <Zap size={16} className="feat-icon" />
                <span>High-Impact Engineering</span>
              </div>
              <div
                className="feature-item"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                  color: t.txt,
                }}
              >
                <Rocket size={16} className="feat-icon" />
                <span>Fast-Track Internships</span>
              </div>
              <div
                className="feature-item"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                  color: t.txt,
                }}
              >
                <Building2 size={16} className="feat-icon" />
                <span>Remote / Hybrid</span>
              </div>
            </div>
          </motion.div>

          {/* Search & Filter Control Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="control-bar"
            style={{
              background: isDark ? 'rgba(18, 20, 29, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="search-box">
              <Search size={18} className="search-icon" style={{ color: t.txt3 }} />
              <input
                type="text"
                placeholder="Search roles, skills, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{
                  background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                  color: t.txt,
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="clear-search" style={{ color: t.txt3 }}>
                  ×
                </button>
              )}
            </div>

            <div
              className="filter-tabs"
              style={{
                background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#f1f5f9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
              }}
            >
              {['ALL', 'intern', 'full-time', 'contract'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`tab-btn ${filterType === tab ? 'tab-active' : ''}`}
                  style={{
                    color: filterType === tab ? '#ffffff' : t.txt2,
                  }}
                >
                  {tab === 'ALL' ? 'All Roles' : tab}
                  {filterType === tab && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="tab-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Job List */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="skeleton-grid"
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="skeleton-card"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                    }}
                  />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="empty-state"
                style={{
                  background: isDark ? 'rgba(18, 20, 29, 0.5)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                  color: t.txt2,
                }}
              >
                <AlertCircle size={44} className="empty-icon text-error" />
                <h3 style={{ color: t.txt }}>Positions Feed Unavailable</h3>
                <p>{error}</p>
                <button onClick={fetchPositions} className="retry-button">
                  Refresh Pipeline
                </button>
              </motion.div>
            ) : filteredPositions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="empty-state"
                style={{
                  background: isDark ? 'rgba(18, 20, 29, 0.5)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                  color: t.txt2,
                }}
              >
                <div
                  className="empty-badge"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
                    color: t.txt3,
                  }}
                >
                  <Briefcase size={36} />
                </div>
                <h3 style={{ color: t.txt }}>No Open Positions Listed</h3>
                <p>There are currently no active openings matching your search criteria. Check back soon for new listings!</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="positions-list"
              >
                {filteredPositions.map((pos) => (
                  <motion.div
                    key={pos.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.25 }}
                    className="position-card"
                    style={{
                      background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
                      boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div className="card-content">
                      <div className="card-header">
                        <h2 className="pos-title" style={{ color: t.txt }}>
                          {pos.title}
                        </h2>
                        <span className={`badge badge-${(pos.type || 'intern').toLowerCase()}`}>
                          {pos.type || 'intern'}
                        </span>
                      </div>

                      <p className="pos-description" style={{ color: t.txt2 }}>
                        {pos.description}
                      </p>

                      <div className="pos-tags" style={{ color: t.txt3 }}>
                        <span className="tag">
                          <Briefcase size={14} /> {pos.department || 'Engineering'}
                        </span>
                        <span className="tag">
                          <MapPin size={14} /> Remote / Hybrid
                        </span>
                        <span className="tag">
                          <Clock size={14} /> {pos.openings || 1} Opening{(pos.openings || 1) > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="card-action">
                      <Link href={`/career/${pos.id}`} className="apply-btn">
                        <span>Apply Position</span>
                        <ChevronRight size={16} className="btn-arrow" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .career-page-wrapper {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        .glow-1 {
          width: 500px;
          height: 500px;
          top: -100px;
          left: 10%;
          background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%);
        }

        .glow-2 {
          width: 450px;
          height: 450px;
          top: 300px;
          right: 5%;
          background: radial-gradient(circle, #8b5cf6 0%, rgba(139, 92, 246, 0) 70%);
        }

        .career-container {
          position: relative;
          z-index: 10;
          max-width: 72rem;
          margin: 0 auto;
          padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem);
        }

        .hero-section {
          text-align: center;
          margin-bottom: clamp(2.5rem, 6vw, 4rem);
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 1.1rem;
          border-radius: 9999px;
          border: 1px solid;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 1.25rem;
          backdrop-filter: blur(12px);
        }

        .sparkle-icon {
          color: #6366f1;
        }

        .dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }

        .title-gradient {
          background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          max-width: 46rem;
          margin: 0 auto 2rem auto;
          line-height: 1.6;
        }

        .features-strip {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.4rem 0.9rem;
          border-radius: 0.5rem;
          border: 1px solid;
        }

        .feat-icon {
          color: #6366f1;
        }

        .control-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 0.875rem 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid;
        }

        .search-box {
          position: relative;
          flex: 1 1 18rem;
          min-width: 0;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .search-input {
          width: 100%;
          padding: 0.7rem 2.2rem 0.7rem 2.8rem;
          border-radius: 0.75rem;
          border: 1px solid;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .clear-search {
          position: absolute;
          right: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .filter-tabs {
          display: flex;
          gap: 0.375rem;
          padding: 0.3rem;
          border-radius: 0.75rem;
          border: 1px solid;
          overflow-x: auto;
          max-width: 100%;
        }

        .tab-btn {
          position: relative;
          padding: 0.5rem 1.1rem;
          border-radius: 0.5rem;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          white-space: nowrap;
          text-transform: capitalize;
          transition: color 0.2s ease;
        }

        .tab-btn.tab-active {
          color: #ffffff !important;
        }

        .tab-indicator {
          position: absolute;
          inset: 0;
          border-radius: 0.5rem;
          background: #6366f1;
          z-index: -1;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .positions-list {
          display: grid;
          gap: 1.25rem;
        }

        .position-card {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: clamp(1.25rem, 3vw, 1.85rem);
          border-radius: 1.25rem;
          border: 1px solid;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.75rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card-content {
          flex: 1 1 20rem;
          min-width: 0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .pos-title {
          font-size: clamp(1.15rem, 2.5vw, 1.4rem);
          font-weight: 700;
          margin: 0;
        }

        .badge {
          padding: 0.2rem 0.7rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .badge-intern {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-full-time {
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .badge-contract {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .pos-description {
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pos-tags {
          display: flex;
          gap: 1.25rem;
          font-size: 0.8125rem;
          flex-wrap: wrap;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .card-action {
          flex-shrink: 0;
        }

        .apply-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.6rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
        }

        .apply-btn:hover {
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.55);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 1.5rem;
          backdrop-filter: blur(16px);
          border-radius: 1.25rem;
          border: 1px solid;
        }

        .empty-badge {
          display: inline-flex;
          padding: 1.25rem;
          border-radius: 50%;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          max-width: 28rem;
          margin: 0 auto;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .retry-button {
          margin-top: 1.25rem;
          padding: 0.6rem 1.4rem;
          border-radius: 0.6rem;
          background: #6366f1;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .skeleton-grid {
          display: grid;
          gap: 1.25rem;
        }

        .skeleton-card {
          height: 130px;
          border-radius: 1.25rem;
          border: 1px solid;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.2; }
        }

        @media (max-width: 640px) {
          .position-card {
            flex-direction: column;
            align-items: stretch;
          }

          .card-action,
          .apply-btn {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
