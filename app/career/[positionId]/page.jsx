'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuth } from '../../../src/context/AuthContext';
import { DARK, LIGHT } from '../../../src/styles/tokens';
import {
  ArrowLeft, Briefcase, MapPin, Send, FileText, User, Mail, Phone,
  AlertCircle, Sparkles, ShieldCheck, LogIn, UserPlus, ChevronDown, ChevronUp,
  DollarSign, Users, Award, CheckCircle2, Clock
} from 'lucide-react';

// Map integer status values (from gRPC proto enum) to string equivalents
const STATUS_INT_MAP = { 0: 'draft', 1: 'draft', 2: 'upcoming', 3: 'open', 4: 'closed' };
function safeStatus(val, fallback = 'open') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return STATUS_INT_MAP[val] || fallback;
  if (typeof val === 'string') return val.toLowerCase().trim() || fallback;
  if (typeof val === 'object') return (val.name || val.value || val.label || fallback).toLowerCase().trim();
  return String(val).toLowerCase().trim() || fallback;
}

export default function PositionApplyPage() {
  const { positionId } = useParams();
  const router = useRouter();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const { user } = useAuth();

  const [position, setPosition] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    resumeUrl: '',
  });

  const [existingApp, setExistingApp] = useState(null);

  useEffect(() => {
    if (positionId) {
      fetchPositionDetails();
    }
  }, [positionId]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        candidateName: prev.candidateName || user.display_name || user.name || user.username || '',
        candidateEmail: user.email || prev.candidateEmail || '',
        candidatePhone: prev.candidatePhone || user.phone || '',
      }));

      if (positionId) {
        api.get(`/career/my-applications`, { params: { candidate_id: user.id, email: user.email } })
          .then(res => {
            const found = (res.data?.applications || []).find(a => a.position_id === positionId);
            if (found) setExistingApp(found);
          })
          .catch(() => {});
      }
    }
  }, [user, positionId]);

  const fetchPositionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/career/positions/${positionId}`);
      setPosition(res.data);
    } catch (err) {
      console.error('Failed to load position:', err);
      setError('Position not found or currently closed.');
      setPosition(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be logged in to Code Plus Academy to submit an application.');
      return;
    }

    if (!formData.candidateName.trim() || !formData.candidateEmail.trim() || !formData.resumeUrl.trim()) {
      setFormError('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const candidateId = user.id;

      const payload = {
        candidateId,
        positionId,
        candidateName: formData.candidateName.trim(),
        candidateEmail: formData.candidateEmail.trim(),
        candidatePhone: formData.candidatePhone.trim(),
        resumeUrl: formData.resumeUrl.trim(),
      };

      const res = await api.post('/career/applications', payload);
      const application = res.data;
      const appId = application.id || application.application_id;

      if (appId) {
        router.push(`/career/applications/${appId}`);
      } else {
        setFormError('Application submitted but no ID returned. Please check dashboard.');
      }
    } catch (err) {
      console.error('Application submission failed:', err);
      setFormError(err.response?.data?.error || 'Failed to submit application. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div
        className="apply-page-wrapper"
        style={{
          background: isDark ? '#090a0f' : '#f8fafc',
          color: t.txt,
        }}
      >
        <div className="ambient-glow glow-1" style={{ opacity: isDark ? 0.3 : 0.12 }} />

        <div className="apply-container">
          {/* Back Navigation */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              href="/career"
              className="back-link"
              style={{
                color: t.txt2,
                display: 'inline-flex',
                alignItems: 'center',
                flexDirection: 'row',
                whiteSpace: 'nowrap',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} style={{ flexShrink: 0 }} />
              <span>Back to Open Roles</span>
            </Link>
          </motion.div>

          {loading ? (
            <div
              className="loading-card"
              style={{
                background: isDark ? 'rgba(18, 20, 29, 0.5)' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                color: t.txt2,
              }}
            >
              Loading position specifications...
            </div>
          ) : error || !position ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="error-card"
              style={{
                background: isDark ? 'rgba(18, 20, 29, 0.5)' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                color: t.txt2,
              }}
            >
              <AlertCircle size={44} className="text-error" />
              <h2 style={{ color: t.txt }}>Position Unavailable</h2>
              <p>{error || 'The requested position could not be found.'}</p>
              <Link href="/career" className="primary-btn">
                Explore Available Roles
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="content-layout"
            >
              {/* Position Header Banner */}
              <div
                className="summary-card"
                style={{
                  background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="badge-row">
                  <span className="type-badge">{position.type || 'Internship'}</span>
                  {(() => {
                    const st = safeStatus(position.status);
                    if (st === 'open') {
                      return (
                        <span className="status-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <Sparkles size={13} /> Actively Hiring
                        </span>
                      );
                    }
                    if (st === 'upcoming') {
                      return (
                        <span className="status-badge" style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}>
                          <Sparkles size={13} /> Position Opening Soon
                        </span>
                      );
                    }
                    return (
                      <span className="status-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <AlertCircle size={13} /> Position Closed
                      </span>
                    );
                  })()}
                  <span className="status-badge" style={{ background: isDark ? 'rgba(99,102,241,0.12)' : '#e0e7ff', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <DollarSign size={13} /> {position.stipend || position.salary || 'Unpaid'}
                  </span>
                </div>

                <h1 className="pos-title" style={{ color: t.txt }}>
                  {position.title}
                </h1>

                <div className="meta-row" style={{ color: t.txt2, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <span className="meta-tag">
                    <Briefcase size={16} style={{ color: '#6366f1' }} /> {position.department || 'Engineering'}
                  </span>
                  <span className="meta-tag">
                    <MapPin size={16} style={{ color: '#6366f1' }} /> {position.location || 'Remote'}
                  </span>
                  <span className="meta-tag">
                    <Users size={16} style={{ color: '#6366f1' }} /> {position.openings || position.capacity || 5} Openings
                  </span>
                  <span className="meta-tag">
                    <DollarSign size={16} style={{ color: '#6366f1' }} /> {position.stipend || position.salary || 'Unpaid'}
                  </span>
                </div>

                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    About the Role
                  </h3>
                  <p className="pos-desc" style={{ color: t.txt2, lineHeight: 1.6, margin: 0 }}>
                    {position.description || 'We are looking for a passionate and driven Flutter Developer Intern to join our team at Code Plus Academy. This role is designed for students, self-taught developers, or recent graduates who want hands-on experience building cross-platform applications.'}
                  </p>
                </div>

                {/* Show More / Show Less Collapsible Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSpecs(!showSpecs)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: isDark ? 'rgba(99, 102, 241, 0.12)' : '#f0f4ff',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.25)' : '#c7d2fe'}`,
                    color: '#6366f1',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginTop: 20,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{showSpecs ? 'Hide Full Role Specifications' : 'Show Role Specs, Key Responsibilities & Requirements'}</span>
                  {showSpecs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Collapsible Role Breakdown */}
                {showSpecs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                      paddingTop: 20,
                      marginTop: 16,
                      borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Key Responsibilities
                      </h4>
                      <ul style={{ fontSize: 14, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                        {position?.responsibilities ? (
                          Array.isArray(position.responsibilities) ? (
                            position.responsibilities.map((r, i) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)
                          ) : (
                            <li style={{ marginBottom: 6 }}>{position.responsibilities}</li>
                          )
                        ) : (
                          <>
                            <li style={{ marginBottom: 6 }}><strong>App Development:</strong> Assist in designing, building, and deploying cross-platform mobile and web applications using Flutter and Dart.</li>
                            <li style={{ marginBottom: 6 }}><strong>UI/UX Implementation:</strong> Translate design mockups and wireframes into responsive, high-performance user interfaces.</li>
                            <li style={{ marginBottom: 6 }}><strong>Feature Integration:</strong> Work on integrating third-party APIs, backend services, and managing application state.</li>
                            <li style={{ marginBottom: 6 }}><strong>Code Maintenance:</strong> Write clean, maintainable code and participate in debugging and troubleshooting to ensure optimal app performance.</li>
                            <li style={{ marginBottom: 6 }}><strong>Collaboration:</strong> Participate in agile workflows, code reviews, and technical discussions to brainstorm new features for our learning platform.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Requirements & Qualifications
                      </h4>
                      <ul style={{ fontSize: 14, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                        {position?.requirements ? (
                          Array.isArray(position.requirements) ? (
                            position.requirements.map((req, i) => <li key={i} style={{ marginBottom: 6 }}>{req}</li>)
                          ) : (
                            <li style={{ marginBottom: 6 }}>{position.requirements}</li>
                          )
                        ) : (
                          <>
                            <li style={{ marginBottom: 6 }}><strong>Technical Knowledge:</strong> Foundational understanding of the Flutter framework and Dart programming language.</li>
                            <li style={{ marginBottom: 6 }}><strong>Concepts:</strong> Familiarity with state management (e.g., Provider, Riverpod, or BLoC) and the widget lifecycle.</li>
                            <li style={{ marginBottom: 6 }}><strong>Tools:</strong> Basic knowledge of Git/GitHub for version control.</li>
                            <li style={{ marginBottom: 6 }}><strong>Drive:</strong> A strong builder-oriented mindset with a preference for learning by doing and tackling technical logic over theoretical memorization.</li>
                            <li style={{ marginBottom: 6 }}><strong>Portfolio:</strong> Academic projects, personal apps, or GitHub repositories showcasing your Flutter skills are highly preferred.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        What You Will Gain
                      </h4>
                      <ul style={{ fontSize: 14, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                        {position?.perks ? (
                          Array.isArray(position.perks) ? (
                            position.perks.map((p, i) => <li key={i} style={{ marginBottom: 6 }}>{p}</li>)
                          ) : (
                            <li style={{ marginBottom: 6 }}>{position.perks}</li>
                          )
                        ) : (
                          <>
                            <li style={{ marginBottom: 6 }}><strong>Mentorship:</strong> Direct guidance, code reviews, and architecture discussions to deepen your technical expertise.</li>
                            <li style={{ marginBottom: 6 }}><strong>Real-World Impact:</strong> Work on live projects that directly impact users and contribute to comprehensive application roadmaps.</li>
                            <li style={{ marginBottom: 6 }}><strong>Flexibility:</strong> A remote, flexible schedule designed to accommodate academic commitments and university exams.</li>
                            <li style={{ marginBottom: 6 }}><strong>Certification:</strong> A certificate of completion and a detailed letter of recommendation upon successful conclusion of the internship.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Application Form */}
              <div
                className="form-card"
                style={{
                  background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
              >
                {existingApp ? (
                  <div
                    style={{
                      background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                      border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0'}`,
                      borderRadius: 12,
                      padding: 24,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: 12 }}>
                      <ShieldCheck size={24} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: t.txt }}>
                      Application Already Submitted
                    </h3>
                    <p style={{ fontSize: 14, color: t.txt2, maxWidth: 460, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                      You have already submitted an application for <strong>{position.title}</strong> on {new Date(existingApp.applied_at || existingApp.created_at).toLocaleDateString()}.
                    </p>
                    <Link
                      href={`/career/applications/${existingApp.id}`}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Briefcase size={16} /> Open Application Dashboard & Chat
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="form-header">
                      <h2 className="form-title" style={{ color: t.txt }}>
                        Application Details
                      </h2>
                      <span className="security-tag" style={{ color: t.txt3 }}>
                        <ShieldCheck size={15} /> Encrypted Submission
                      </span>
                    </div>

                    {!user && (
                      <div
                        style={{
                          background: isDark ? 'rgba(99, 102, 241, 0.08)' : '#f0f4ff',
                          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.25)' : '#c7d2fe'}`,
                          borderRadius: 12,
                          padding: 24,
                          textAlign: 'center',
                          marginBottom: 20,
                        }}
                      >
                        <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#6366f1', marginBottom: 12 }}>
                          <LogIn size={24} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: t.txt }}>
                          Sign In Required to Apply
                        </h3>
                        <p style={{ fontSize: 14, color: t.txt2, maxWidth: 460, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                          You must be signed in to your Code Plus Academy account to apply for positions, submit your resume, and track application status.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                          <Link
                            href={`/login?redirectTo=/career/${positionId}`}
                            style={{
                              background: '#6366f1',
                              color: '#ffffff',
                              padding: '10px 20px',
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 14,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <LogIn size={16} /> Log In
                          </Link>
                          <Link
                            href={`/register?redirectTo=/career/${positionId}`}
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                              color: t.txt,
                              padding: '10px 20px',
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 14,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <UserPlus size={16} /> Create Account
                          </Link>
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="error-banner"
                        >
                          {formError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="apply-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="field-label" style={{ color: t.txt, fontSize: 14, fontWeight: 600 }}>
                          Full Name <span className="req" style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                          <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none', color: t.txt3 }} />
                          <input
                            type="text"
                            placeholder="e.g. Alex Morgan"
                            value={formData.candidateName}
                            onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                            required
                            className="text-input"
                            style={{
                              width: '100%',
                              paddingLeft: 42,
                              paddingRight: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              borderRadius: 12,
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                              background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                              color: t.txt,
                              fontSize: 14,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="field-label" style={{ color: t.txt, fontSize: 14, fontWeight: 600 }}>
                          Email Address <span className="req" style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                          <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none', color: t.txt3 }} />
                          <input
                            type="email"
                            placeholder="alex@example.com"
                            value={formData.candidateEmail}
                            onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                            required
                            className="text-input"
                            style={{
                              width: '100%',
                              paddingLeft: 42,
                              paddingRight: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              borderRadius: 12,
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                              background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                              color: t.txt,
                              fontSize: 14,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="field-label" style={{ color: t.txt, fontSize: 14, fontWeight: 600 }}>
                          Phone Number (Optional)
                        </label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                          <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none', color: t.txt3 }} />
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={formData.candidatePhone}
                            onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                            className="text-input"
                            style={{
                              width: '100%',
                              paddingLeft: 42,
                              paddingRight: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              borderRadius: 12,
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                              background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                              color: t.txt,
                              fontSize: 14,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="field-label" style={{ color: t.txt, fontSize: 14, fontWeight: 600 }}>
                          Resume / Portfolio Link <span className="req" style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                          <FileText size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none', color: t.txt3 }} />
                          <input
                            type="url"
                            placeholder="https://drive.google.com/resume.pdf or GitHub profile"
                            value={formData.resumeUrl}
                            onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                            required
                            className="text-input"
                            style={{
                              width: '100%',
                              paddingLeft: 42,
                              paddingRight: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              borderRadius: 12,
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                              background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                              color: t.txt,
                              fontSize: 14,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {(() => {
                        const st = safeStatus(position.status);
                        const isNotOpen = st !== 'open';

                        return (
                          <motion.button
                            whileHover={!isNotOpen ? { scale: 1.01 } : {}}
                            whileTap={!isNotOpen ? { scale: 0.99 } : {}}
                            type="submit"
                            disabled={submitting || isNotOpen}
                            className="submit-btn"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              width: '100%',
                              minHeight: 48,
                              marginTop: 8,
                              padding: '12px 24px',
                              borderRadius: 12,
                              background: isNotOpen
                                ? (st === 'upcoming' ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : 'rgba(255,255,255,0.08)')
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: 15,
                              border: 'none',
                              cursor: submitting || isNotOpen ? 'not-allowed' : 'pointer',
                              boxShadow: !isNotOpen ? '0 4px 16px rgba(99, 102, 241, 0.35)' : 'none',
                              opacity: submitting || isNotOpen ? 0.75 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {submitting ? (
                              <span>Submitting Application...</span>
                            ) : st === 'upcoming' ? (
                              <span>Applications Opening Soon</span>
                            ) : st === 'closed' ? (
                              <span>Applications Closed</span>
                            ) : (
                              <>
                                <span>Submit Application</span>
                                <Send size={17} style={{ flexShrink: 0 }} />
                              </>
                            )}
                          </motion.button>
                        );
                      })()}
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        .apply-page-wrapper {
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
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%);
        }

        .apply-container {
          position: relative;
          z-index: 10;
          max-width: 54rem;
          margin: 0 auto;
          padding-top: 1.25rem;
          padding-bottom: clamp(2rem, 5vw, 4rem);
          padding-left: clamp(1rem, 4vw, 2rem);
          padding-right: clamp(1rem, 4vw, 2rem);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          flex-direction: row;
          white-space: nowrap;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #6366f1 !important;
        }

        .content-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-top: 0.5rem;
        }

        .summary-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 4vw, 2.25rem);
          border-radius: 1.25rem;
          border: 1px solid;
          margin-bottom: 0.5rem;
        }

        .badge-row {
          display: flex;
          gap: 0.625rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .type-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .pos-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 0.875rem;
        }

        .meta-row {
          display: flex;
          gap: 1.25rem;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .meta-tag {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .pos-desc {
          font-size: 0.95rem;
          line-height: 1.65;
          margin: 0;
        }

        .form-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 4vw, 2.25rem);
          border-radius: 1.25rem;
          border: 1px solid;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .form-title {
          font-size: clamp(1.2rem, 3vw, 1.4rem);
          font-weight: 700;
          margin: 0;
        }

        .security-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .error-banner {
          padding: 0.75rem 1rem;
          border-radius: 0.625rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .apply-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .req {
          color: #ef4444;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .text-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.8rem;
          border-radius: 0.75rem;
          border: 1px solid;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .text-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .submit-btn {
          margin-top: 0.5rem;
          padding: 0.9rem 1.6rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9375rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-card,
        .error-card {
          text-align: center;
          padding: 4rem 1.5rem;
          backdrop-filter: blur(16px);
          border-radius: 1.25rem;
          border: 1px solid;
        }

        .primary-btn {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.6rem;
          background: #6366f1;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </AppLayout>
  );
}
