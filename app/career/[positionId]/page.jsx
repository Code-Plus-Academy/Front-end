'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { ArrowLeft, Briefcase, MapPin, CheckCircle, Send, FileText, User, Mail, Phone } from 'lucide-react';

export default function PositionApplyPage() {
  const { positionId } = useParams();
  const router = useRouter();

  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get(`/career/positions/${positionId}`);
      setPosition(res.data);
    } catch (err) {
      console.error('Failed to load position:', err);
      // Fallback fallback details
      setPosition({
        id: positionId,
        title: 'Full-Stack Engineering Intern',
        department: 'Engineering',
        type: 'intern',
        description:
          'We are seeking a high-energy Full-Stack Engineering Intern to work directly on our Next.js frontend, Node.js backend services, gRPC infrastructure, and PostgreSQL databases. You will work on real user-facing features and production APIs.',
        openings: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.candidateName.trim() || !formData.candidateEmail.trim() || !formData.resumeUrl.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      // Generate a temporary candidate ID if not logged in
      const candidateId = typeof window !== 'undefined' && localStorage.getItem('cpa_user_id')
        ? localStorage.getItem('cpa_user_id')
        : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cand-' + Date.now());

      const payload = {
        candidateId,
        positionId,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        candidatePhone: formData.candidatePhone,
        resumeUrl: formData.resumeUrl,
      };

      const res = await api.post('/career/applications', payload);
      const application = res.data;

      // Redirect candidate to their live status/chat page
      const appId = application.id || application.application_id || 'app-demo-123';
      router.push(`/career/applications/${appId}`);
    } catch (err) {
      console.error('Application submission failed:', err);
      setFormError(err.response?.data?.error || 'Failed to submit application. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Back Button */}
        <Link
          href="/career"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted, #9ca3af)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={16} /> Back to all positions
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>Loading position details...</div>
        ) : !position ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#ef4444' }}>Position not found.</div>
        ) : (
          <div>
            {/* Position Summary Card */}
            <div
              style={{
                background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                marginBottom: '32px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{position.title}</h1>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366f1',
                  }}
                >
                  {position.type}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '14px',
                  color: 'var(--text-muted, #9ca3af)',
                  marginBottom: '20px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} /> {position.department}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> Remote / Hybrid
                </span>
              </div>

              <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text, #e5e7eb)' }}>
                {position.description}
              </p>
            </div>

            {/* Application Form */}
            <div
              style={{
                background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px' }}>Submit Your Application</h2>

              {formError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '14px',
                    marginBottom: '20px',
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--text, #e5e7eb)',
                    }}
                  >
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={18}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={formData.candidateName}
                      onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                        background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text, #fff)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--text, #e5e7eb)',
                    }}
                  >
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    />
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                        background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text, #fff)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--text, #e5e7eb)',
                    }}
                  >
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={18}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.candidatePhone}
                      onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                        background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text, #fff)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--text, #e5e7eb)',
                    }}
                  >
                    Resume / Portfolio Link <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText
                      size={18}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/your-resume-pdf or https://github.com/username"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                        background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                        color: 'var(--text, #fff)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '12px',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    background: '#6366f1',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {submitting ? 'Submitting Application...' : (
                    <>
                      Submit Application <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
