'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../src/components/layout/RouteWrappers';
import api from '../../src/api/axios';
import { Briefcase, MapPin, Clock, ArrowRight, Search, Sparkles } from 'lucide-react';

export default function CareerPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/career/positions');
      setPositions(res.data.positions || []);
    } catch (err) {
      console.error('Failed to load career positions:', err);
      // Fallback mock positions if backend API isn't live yet
      setPositions([
        {
          id: 'pos-1',
          title: 'Full-Stack Engineering Intern',
          department: 'Engineering',
          type: 'intern',
          status: 'OPEN',
          description: 'Join our core platform engineering team to build high-scale web features using Next.js, Node.js, PostgreSQL, and gRPC.',
          openings: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: 'pos-2',
          title: 'Frontend Developer (React / Next.js)',
          department: 'Engineering',
          type: 'full-time',
          status: 'OPEN',
          description: 'Build modern, dynamic, interactive user interfaces with rich animations, glassmorphism aesthetics, and high performance.',
          openings: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 'pos-3',
          title: 'DevOps & Cloud Infrastructure Lead',
          department: 'Infrastructure',
          type: 'contract',
          status: 'UPCOMING',
          description: 'Architect multi-cloud deployment pipelines, Docker environments, Kubernetes orchestration, and gRPC microservice topology.',
          openings: 1,
          created_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter((p) => {
    const matchesType = filterType === 'ALL' || p.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AppLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Header Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <Sparkles size={16} /> Careers at CPA &amp; Internship Hub
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Build the Future of Developer Learning
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted, #9ca3af)', maxWidth: '640px', margin: '0 auto' }}>
            Join our mission to empower developers worldwide. Explore open positions, apply in one click, and track your application status live.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
            padding: '16px 24px',
            borderRadius: '16px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
            />
            <input
              type="text"
              placeholder="Search positions by title or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 42px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                color: 'var(--text, #fff)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'intern', 'full-time', 'contract'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filterType === t ? '#6366f1' : 'var(--border-color, rgba(255, 255, 255, 0.1))',
                  background: filterType === t ? '#6366f1' : 'transparent',
                  color: filterType === t ? '#fff' : 'var(--text-muted, #9ca3af)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                }}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Positions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>Loading open positions...</div>
        ) : filteredPositions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Briefcase size={40} style={{ color: '#6b7280', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No positions found</h3>
            <p style={{ color: '#9ca3af' }}>Try adjusting your search criteria or check back later for new openings.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredPositions.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '24px',
                  flexWrap: 'wrap',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{p.title}</h3>
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                          p.type === 'intern'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : p.type === 'full-time'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: p.type === 'intern' ? '#10b981' : p.type === 'full-time' ? '#3b82f6' : '#f59e0b',
                      }}
                    >
                      {p.type}
                    </span>
                  </div>

                  <p
                    style={{
                      color: 'var(--text-muted, #9ca3af)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                    }}
                  >
                    {p.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '20px',
                      fontSize: '13px',
                      color: 'var(--text-muted, #9ca3af)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={14} /> {p.department}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Remote / On-site
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {p.openings} opening{p.openings > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <Link
                    href={`/career/${p.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      background: '#6366f1',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    Apply Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
