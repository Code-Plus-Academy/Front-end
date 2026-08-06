'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { ArrowLeft, Briefcase, MapPin, Send, FileText, User, Mail, Phone, AlertCircle } from 'lucide-react';

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
        setFormError('Application submitted but no ID returned. Please refresh dashboard.');
      }
    } catch (err) {
      console.error('Application submission failed:', err);
      setFormError(err.response?.data?.error || 'Failed to submit application. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="apply-container">
        {/* Back Link */}
        <Link href="/career" className="back-link">
          <ArrowLeft size={16} /> Back to all positions
        </Link>

        {loading ? (
          <div className="loading-state">Loading position details...</div>
        ) : error || !position ? (
          <div className="error-state-card">
            <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h2>Position Unavailable</h2>
            <p>{error || 'The requested job position could not be found.'}</p>
            <Link href="/career" className="back-home-btn">
              Explore Available Roles
            </Link>
          </div>
        ) : (
          <div>
            {/* Position Summary Banner */}
            <div className="position-summary-card">
              <div className="summary-header-row">
                <h1 className="summary-title">{position.title}</h1>
                <span className="summary-badge">{position.type || 'intern'}</span>
              </div>

              <div className="summary-meta-row">
                <span className="meta-item">
                  <Briefcase size={16} /> {position.department || 'Engineering'}
                </span>
                <span className="meta-item">
                  <MapPin size={16} /> Remote / Hybrid
                </span>
              </div>

              <p className="summary-desc">{position.description}</p>
            </div>

            {/* Application Form */}
            <div className="form-card">
              <h2 className="form-heading">Submit Your Application</h2>

              {formError && <div className="form-error-banner">{formError}</div>}

              <form onSubmit={handleSubmit} className="apply-form">
                <div className="input-group">
                  <label className="input-label">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <div className="input-field-wrapper">
                    <User size={18} className="field-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={formData.candidateName}
                      onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Email Address <span className="req-star">*</span>
                  </label>
                  <div className="input-field-wrapper">
                    <Mail size={18} className="field-icon" />
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number (Optional)</label>
                  <div className="input-field-wrapper">
                    <Phone size={18} className="field-icon" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.candidatePhone}
                      onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Resume / Portfolio Link <span className="req-star">*</span>
                  </label>
                  <div className="input-field-wrapper">
                    <FileText size={18} className="field-icon" />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/your-resume.pdf or GitHub URL"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? 'Submitting...' : 'Submit Application'} <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .apply-container {
          max-width: 52rem;
          margin: 0 auto;
          padding: clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 3vw, 1.5rem);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted, #9ca3af);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #818cf8;
        }

        .position-summary-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: clamp(1.25rem, 3vw, 2rem);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 2rem;
        }

        .summary-header-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .summary-title {
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 800;
          margin: 0;
          color: var(--text, #ffffff);
          line-height: 1.25;
        }

        .summary-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .summary-meta-row {
          display: flex;
          gap: 1.25rem;
          font-size: 0.875rem;
          color: var(--text-muted, #9ca3af);
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .summary-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text, #e5e7eb);
          margin: 0;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: clamp(1.25rem, 3vw, 2rem);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-heading {
          font-size: clamp(1.125rem, 3vw, 1.4rem);
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--text, #ffffff);
        }

        .form-error-banner {
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

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text, #e5e7eb);
        }

        .req-star {
          color: #ef4444;
        }

        .input-field-wrapper {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.6rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.3);
          color: var(--text, #ffffff);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .submit-btn {
          margin-top: 0.5rem;
          padding: 0.875rem 1.5rem;
          border-radius: 0.625rem;
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
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state,
        .error-state-card {
          text-align: center;
          padding: 4rem 1.5rem;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .error-state-card h2 {
          color: var(--text, #ffffff);
          margin-bottom: 0.5rem;
        }

        .back-home-btn {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          background: #6366f1;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
        }
      `}</style>
    </AppLayout>
  );
}
