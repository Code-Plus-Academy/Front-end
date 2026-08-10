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
  AlertCircle, Sparkles, ShieldCheck, LogIn, UserPlus
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
            <Link href="/career" className="back-link" style={{ color: t.txt2 }}>
              <ArrowLeft size={16} /> Back to Open Roles
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
                  <span className="type-badge">{position.type || 'intern'}</span>
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
                </div>

                <h1 className="pos-title" style={{ color: t.txt }}>
                  {position.title}
                </h1>

                <div className="meta-row" style={{ color: t.txt2 }}>
                  <span className="meta-tag">
                    <Briefcase size={16} /> {position.department || 'Engineering'}
                  </span>
                  <span className="meta-tag">
                    <MapPin size={16} /> Remote / Hybrid
                  </span>
                </div>

                <p className="pos-desc" style={{ color: t.txt2 }}>
                  {position.description}
                </p>
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
                <div className="form-header">
                  <h2 className="form-title" style={{ color: t.txt }}>
                    Application Details
                  </h2>
                  <span className="security-tag" style={{ color: t.txt3 }}>
                    <ShieldCheck size={15} /> Encrypted Submission
                  </span>
                </div>

                {existingApp ? (
                  <div
                    style={{
                      background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                      border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0'}`,
                      borderRadius: 12,
                      padding: 24,
                      textAlign: 'center',
                      marginBottom: 20,
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
                ) : !user ? (
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
                ) : null}

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
          padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.75rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #6366f1 !important;
        }

        .content-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .summary-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 4vw, 2.25rem);
          border-radius: 1.25rem;
          border: 1px solid;
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
