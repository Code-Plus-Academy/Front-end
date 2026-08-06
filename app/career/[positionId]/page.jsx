'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import {
  ArrowLeft, Briefcase, MapPin, Send, FileText, User, Mail, Phone,
  AlertCircle, Sparkles, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function PositionApplyPage() {
  const { positionId } = useParams();
  const router = useRouter();

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

  useEffect(() => {
    if (positionId) {
      fetchPositionDetails();
    }
  }, [positionId]);

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

    if (!formData.candidateName.trim() || !formData.candidateEmail.trim() || !formData.resumeUrl.trim()) {
      setFormError('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const candidateId =
        typeof window !== 'undefined' && localStorage.getItem('cpa_user_id')
          ? localStorage.getItem('cpa_user_id')
          : typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'cand-' + Date.now();

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
      <div className="apply-page-wrapper">
        <div className="ambient-glow glow-1" />

        <div className="apply-container">
          {/* Back Navigation */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/career" className="back-link">
              <ArrowLeft size={16} /> Back to Open Roles
            </Link>
          </motion.div>

          {loading ? (
            <div className="loading-card">
              <div className="loading-spinner" />
              <span>Loading position specifications...</span>
            </div>
          ) : error || !position ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="error-card">
              <AlertCircle size={44} className="text-error" />
              <h2>Position Unavailable</h2>
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
              <div className="summary-card">
                <div className="badge-row">
                  <span className="type-badge">{position.type || 'intern'}</span>
                  <span className="status-badge">
                    <Sparkles size={13} /> Actively Hiring
                  </span>
                </div>

                <h1 className="pos-title">{position.title}</h1>

                <div className="meta-row">
                  <span className="meta-tag">
                    <Briefcase size={16} /> {position.department || 'Engineering'}
                  </span>
                  <span className="meta-tag">
                    <MapPin size={16} /> Remote / Hybrid
                  </span>
                </div>

                <p className="pos-desc">{position.description}</p>
              </div>

              {/* Application Form */}
              <div className="form-card">
                <div className="form-header">
                  <h2 className="form-title">Application Details</h2>
                  <span className="security-tag">
                    <ShieldCheck size={15} /> Encrypted Submission
                  </span>
                </div>

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

                <form onSubmit={handleSubmit} className="apply-form">
                  <div className="field-group">
                    <label className="field-label">
                      Full Name <span className="req">*</span>
                    </label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={formData.candidateName}
                        onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                        required
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      Email Address <span className="req">*</span>
                    </label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={formData.candidateEmail}
                        onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                        required
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Phone Number (Optional)</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.candidatePhone}
                        onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      Resume / Portfolio Link <span className="req">*</span>
                    </label>
                    <div className="input-wrapper">
                      <FileText size={18} className="input-icon" />
                      <input
                        type="url"
                        placeholder="https://drive.google.com/resume.pdf or GitHub profile"
                        value={formData.resumeUrl}
                        onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                        required
                        className="text-input"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitting}
                    className="submit-btn"
                  >
                    {submitting ? (
                      'Submitting Application...'
                    ) : (
                      <>
                        Submit Application <Send size={17} />
                      </>
                    )}
                  </motion.button>
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
          background: #090a0f;
          color: #f3f4f6;
          overflow: hidden;
        }

        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0.3;
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
          color: #9ca3af;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.75rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #818cf8;
        }

        .content-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .summary-card {
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 4vw, 2.25rem);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
          color: #818cf8;
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
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .pos-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 0.875rem;
        }

        .meta-row {
          display: flex;
          gap: 1.25rem;
          font-size: 0.875rem;
          color: #9ca3af;
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
          color: #d1d5db;
          margin: 0;
        }

        .form-card {
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 4vw, 2.25rem);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
          color: #ffffff;
          margin: 0;
        }

        .security-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .error-banner {
          padding: 0.75rem 1rem;
          border-radius: 0.625rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
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
          color: #e5e7eb;
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
          color: #6b7280;
        }

        .text-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.8rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(10, 11, 16, 0.6);
          color: #ffffff;
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
          background: rgba(18, 20, 29, 0.5);
          backdrop-filter: blur(16px);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
        }

        .error-card h2 {
          color: #ffffff;
          margin-bottom: 0.5rem;
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
