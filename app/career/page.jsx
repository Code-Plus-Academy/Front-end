'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../src/components/layout/RouteWrappers';
import api from '../../src/api/axios';
import { Briefcase, MapPin, Clock, ArrowRight, Search, Sparkles, AlertCircle } from 'lucide-react';

export default function CareerPage() {
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
      setPositions(res.data.positions || []);
    } catch (err) {
      console.error('Failed to load career positions:', err);
      setError('Unable to load open positions. Please check back shortly.');
      setPositions([]);
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
      <div className="career-container">
        {/* Header Hero Section */}
        <div className="career-hero">
          <div className="career-hero-badge">
            <Sparkles size={16} /> Careers at CPA &amp; Internship Hub
          </div>
          <h1 className="career-hero-title">
            Build the Future of Developer Learning
          </h1>
          <p className="career-hero-subtitle">
            Join our mission to empower developers worldwide. Explore open positions, apply seamlessly, and track your application live.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="career-filter-bar">
          {/* Search Input */}
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, department, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            {['ALL', 'intern', 'full-time', 'contract'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`filter-btn ${filterType === t ? 'active' : ''}`}
              >
                {t === 'ALL' ? 'All Roles' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Positions List */}
        {loading ? (
          <div className="positions-skeleton-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="position-skeleton-card">
                <div className="sk-title" />
                <div className="sk-desc" />
                <div className="sk-tags" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state-card">
            <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h3>Unable to fetch positions</h3>
            <p>{error}</p>
            <button onClick={fetchPositions} className="retry-btn">
              Retry Connection
            </button>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="empty-state-card">
            <Briefcase size={40} style={{ color: '#6b7280', marginBottom: '1rem' }} />
            <h3>No open positions match your search</h3>
            <p>Try resetting filters or searching for different keywords.</p>
          </div>
        ) : (
          <div className="positions-grid">
            {filteredPositions.map((p) => (
              <div key={p.id} className="position-card">
                <div className="position-info">
                  <div className="position-header-row">
                    <h3 className="position-title">{p.title}</h3>
                    <span className={`type-badge badge-${(p.type || 'intern').toLowerCase()}`}>
                      {p.type || 'intern'}
                    </span>
                  </div>

                  <p className="position-desc">{p.description}</p>

                  <div className="position-meta-row">
                    <span className="meta-tag">
                      <Briefcase size={14} /> {p.department || 'Engineering'}
                    </span>
                    <span className="meta-tag">
                      <MapPin size={14} /> Remote / Hybrid
                    </span>
                    <span className="meta-tag">
                      <Clock size={14} /> {p.openings || 1} opening{(p.openings || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="position-action">
                  <Link href={`/career/${p.id}`} className="apply-now-btn">
                    Apply Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .career-container {
          max-width: 72rem;
          margin: 0 auto;
          padding: clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 3vw, 1.5rem);
        }

        .career-hero {
          text-align: center;
          margin-bottom: clamp(2rem, 5vw, 3.5rem);
        }

        .career-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          background: rgba(99, 102, 241, 0.12);
          color: #818cf8;
          font-size: clamp(0.75rem, 2vw, 0.875rem);
          font-weight: 600;
          margin-bottom: 1rem;
          border: 1px solid rgba(99, 102, 241, 0.25);
          backdrop-filter: blur(8px);
        }

        .career-hero-title {
          font-size: clamp(1.75rem, 5vw, 2.75rem);
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.2;
        }

        .career-hero-subtitle {
          font-size: clamp(0.95rem, 2.5vw, 1.125rem);
          color: var(--text-muted, #9ca3af);
          max-width: 40rem;
          margin: 0 auto;
          line-height: 1.6;
        }

        .career-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: clamp(0.875rem, 2vw, 1.25rem);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .search-wrapper {
          position: relative;
          flex: 1 1 16rem;
          min-width: 0;
        }

        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.6rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.3);
          color: var(--text, #ffffff);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .filter-pills {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 2px;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          white-space: nowrap;
          text-transform: capitalize;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .filter-btn.active {
          background: #6366f1;
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .positions-grid {
          display: grid;
          gap: 1.25rem;
        }

        .position-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: clamp(1.25rem, 3vw, 1.75rem);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .position-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .position-info {
          flex: 1 1 20rem;
          min-width: 0;
        }

        .position-header-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .position-title {
          font-size: clamp(1.1rem, 2.5vw, 1.35rem);
          font-weight: 700;
          color: var(--text, #ffffff);
          margin: 0;
        }

        .type-badge {
          padding: 0.2rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .badge-intern {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-full-time {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .badge-contract {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .position-desc {
          color: var(--text-muted, #9ca3af);
          font-size: 0.875rem;
          line-height: 1.55;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .position-meta-row {
          display: flex;
          gap: 1.25rem;
          font-size: 0.8125rem;
          color: var(--text-muted, #9ca3af);
          flex-wrap: wrap;
        }

        .meta-tag {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .position-action {
          flex-shrink: 0;
        }

        .apply-now-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .apply-now-btn:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .empty-state-card {
          text-align: center;
          padding: 4rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
        }

        .empty-state-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text, #ffffff);
          margin-bottom: 0.5rem;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          background: #6366f1;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .positions-skeleton-grid {
          display: grid;
          gap: 1.25rem;
        }

        .position-skeleton-card {
          height: 120px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
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

          .position-action {
            width: 100%;
          }

          .apply-now-btn {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
