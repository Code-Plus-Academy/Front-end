'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api, { baseApiUrl } from '../../../../src/api/axios';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useAuth } from '../../../../src/context/AuthContext';
import { DARK, LIGHT } from '../../../../src/styles/tokens';
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, XCircle,
  AlertCircle, FileText, LogIn, Lock, ChevronDown, ChevronUp,
  Briefcase, MapPin, DollarSign, Users, Award, Sparkles, Building2
} from 'lucide-react';

export default function ApplicationStatusPage() {
  const { applicationId } = useParams();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const { user, loading: authLoading } = useAuth();

  const [application, setApplication] = useState(null);
  const [position, setPosition] = useState(null);
  const [showPosDetails, setShowPosDetails] = useState(false);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (applicationId && user) {
      fetchApplicationDetails();
      fetchMessageHistory();
      fetchTasks();
      const cleanupStream = setupSSEStream();
      return () => {
        if (cleanupStream) cleanupStream();
      };
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [applicationId, user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/career/applications/${applicationId}`);
      const appObj = res.data?.application || res.data;
      setApplication(appObj);

      const posId = appObj?.position_id || appObj?.positionId;
      if (posId) {
        try {
          const posRes = await api.get(`/career/positions/${posId}`);
          setPosition(posRes.data?.position || posRes.data);
        } catch (pErr) {
          console.warn('Failed fetching position details:', pErr);
        }
      } else if (appObj?.position) {
        setPosition(appObj.position);
      }
    } catch (err) {
      console.error('Failed to fetch application:', err);
      setError('Application not found or session expired.');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      const res = await api.get(`/career/applications/${applicationId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/career/applications/${applicationId}/tasks`);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const setupSSEStream = () => {
    try {
      const streamUrl = `${baseApiUrl}/career/applications/${applicationId}/messages/stream`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const incomingMsg = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        } catch (e) {
          console.error('Error parsing SSE payload:', e);
        }
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error('Failed to connect to message stream:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    try {
      setSending(true);
      const payload = {
        body: draft.trim(),
        senderId: 'candidate-id',
      };
      const res = await api.post(`/career/applications/${applicationId}/messages`, payload);
      setMessages((prev) => [...prev, res.data]);
      setDraft('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    let s = 'APPLIED';
    if (typeof status === 'number') {
      const enumMap = {
        0: 'APPLIED',
        1: 'APPLIED',
        2: 'IN_REVIEW',
        3: 'INTERVIEW',
        4: 'APPROVED',
        5: 'REJECTED',
      };
      s = enumMap[status] || 'APPLIED';
    } else if (status) {
      s = String(status).toUpperCase();
    }

    switch (s) {
      case 'APPROVED':
      case '4':
        return (
          <span className="status-badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row', whiteSpace: 'nowrap', gap: 6 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> <span>Approved</span>
          </span>
        );
      case 'REJECTED':
      case '5':
        return (
          <span className="status-badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row', whiteSpace: 'nowrap', gap: 6 }}>
            <XCircle size={16} style={{ flexShrink: 0 }} /> <span>Rejected</span>
          </span>
        );
      case 'INTERVIEW':
      case '3':
        return (
          <span className="status-badge badge-interview" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row', whiteSpace: 'nowrap', gap: 6 }}>
            <MessageSquare size={16} style={{ flexShrink: 0 }} /> <span>Interview Scheduled</span>
          </span>
        );
      case 'IN_REVIEW':
      case '2':
        return (
          <span className="status-badge badge-review" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row', whiteSpace: 'nowrap', gap: 6 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>In Review</span>
          </span>
        );
      default:
        return (
          <span className="status-badge badge-applied" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row', whiteSpace: 'nowrap', gap: 6 }}>
            <Clock size={16} style={{ flexShrink: 0 }} /> <span>Applied</span>
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div
        className="status-page-wrapper"
        style={{
          background: isDark ? '#090a0f' : '#f8fafc',
          color: t.txt,
        }}
      >
        <div className="ambient-glow glow-1" style={{ opacity: isDark ? 0.3 : 0.12 }} />

        <div className="status-container">
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
              <span>Back to Careers</span>
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
              Loading candidate dashboard...
            </div>
          ) : !user ? (
            <div
              className="error-card"
              style={{
                background: isDark ? 'rgba(18, 20, 29, 0.5)' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', color: '#6366f1', marginBottom: 16 }}>
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px 0', color: t.txt }}>
                Candidate Authentication Required
              </h2>
              <p style={{ fontSize: 14, color: t.txt2, maxWidth: 460, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                Please log in to your Code Plus Academy account to view your application status, tracking updates, and recruiter messages.
              </p>
              <Link
                href={`/login?redirectTo=/career/applications/${applicationId}`}
                className="primary-btn"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <LogIn size={16} /> Log In to Access Dashboard
              </Link>
            </div>
          ) : error || !application ? (
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
              <h2 style={{ color: t.txt }}>Application Unavailable</h2>
              <p>{error || 'The requested application status could not be retrieved.'}</p>
              <Link href="/career" className="primary-btn">
                Return to Career Hub
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dashboard-grid"
            >
              {/* Main Column */}
              <div className="main-column">
                {/* Header Banner */}
                <div
                  className="dash-header-card"
                  style={{
                    background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  }}
                >
                  <div>
                    <h1 className="dash-title" style={{ color: t.txt }}>
                      Candidate Dashboard
                    </h1>
                    <p className="app-id-tag" style={{ color: t.txt3 }}>
                      Application ID: <code>{applicationId}</code>
                    </p>
                  </div>
                  <div>{getStatusBadge(application?.status)}</div>
                </div>

                {/* Assigned Tasks */}
                {tasks.length > 0 && (
                  <div
                    className="tasks-card"
                    style={{
                      background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    }}
                  >
                    <h3 className="card-heading" style={{ color: t.txt }}>
                      Assigned Intern Tasks
                    </h3>
                    <div className="tasks-list">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="task-row"
                          style={{
                            background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#f8fafc',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                          }}
                        >
                          <div>
                            <div className="task-title" style={{ color: t.txt }}>
                              {task.title}
                            </div>
                            <div className="task-prog" style={{ color: t.txt3 }}>
                              Progress: {task.progress || 0}%
                            </div>
                          </div>
                          <span className={`task-badge ${task.status === 'done' ? 'done' : 'pending'}`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Messenger */}
                <div
                  className="chat-card"
                  style={{
                    background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  }}
                >
                  <div
                    className="chat-header"
                    style={{
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    }}
                  >
                    <MessageSquare size={18} style={{ color: '#6366f1' }} />
                    <h3 className="chat-heading" style={{ color: t.txt }}>
                      Direct Admin Messenger
                    </h3>
                    <span className="live-indicator">
                      <span className="live-dot" /> Live gRPC Stream
                    </span>
                  </div>

                  <div className="messages-area">
                    {messages.length === 0 ? (
                      <div className="empty-chat-state" style={{ color: t.txt3 }}>
                        No messages exchanged yet. Send a message to contact the hiring team.
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const sRole = m.sender_role || m.senderRole || m.role;
                        const isAdmin = typeof sRole === 'string' ? sRole.toUpperCase() === 'ADMIN' : false;
                        return (
                          <motion.div
                            key={m.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message-bubble ${isAdmin ? 'admin-bubble' : 'candidate-bubble'}`}
                            style={{
                              alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                              width: 'fit-content',
                              maxWidth: '78%',
                              background: isAdmin
                                ? isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : '#f1f5f9'
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: isAdmin ? t.txt : '#ffffff',
                              border: isAdmin
                                ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
                                : 'none',
                            }}
                          >
                            <div className="sender-tag" style={{ opacity: isAdmin ? 0.7 : 0.85 }}>
                              {isAdmin ? 'Hiring Admin' : 'You'}
                            </div>
                            <div className="msg-body">{m.body}</div>
                            {m.created_at && (
                              <div className="msg-time" style={{ opacity: isAdmin ? 0.5 : 0.75 }}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="chat-form"
                    style={{
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Type a message or reply to the team..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="chat-input"
                      style={{
                        background: isDark ? 'rgba(10, 11, 16, 0.6)' : '#ffffff',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                        color: t.txt,
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="send-button"
                    >
                      Send <Send size={16} />
                    </motion.button>
                  </form>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Application Metadata */}
                <div
                  className="details-card"
                  style={{
                    background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  }}
                >
                  <h3 className="card-heading" style={{ color: t.txt }}>
                    Application Metadata
                  </h3>

                  <div className="meta-block">
                    <span className="meta-label" style={{ color: t.txt3 }}>
                      APPLICANT NAME
                    </span>
                    <span className="meta-val font-bold" style={{ color: t.txt }}>
                      {application?.candidate_name || 'Applicant'}
                    </span>
                  </div>

                  <div className="meta-block">
                    <span className="meta-label" style={{ color: t.txt3 }}>
                      SUBMISSION DATE
                    </span>
                    <span className="meta-val" style={{ color: t.txt2 }}>
                      {application?.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>

                  {application?.resume_url && (
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>
                        DOCUMENT ATTACHMENT
                      </span>
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resume-link"
                      >
                        <FileText size={16} /> View Submitted Resume
                      </a>
                    </div>
                  )}

                  {application?.notes && (
                    <div className="meta-block notes-block" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0' }}>
                      <span className="meta-label" style={{ color: t.txt3 }}>
                        ADMIN REVIEW NOTES
                      </span>
                      <p className="notes-content" style={{ color: t.txt2 }}>
                        {application.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Position Information Card */}
                <div
                  className="details-card pos-info-card"
                  style={{
                    background: isDark ? 'rgba(18, 20, 29, 0.6)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                  }}
                >
                  <h3 className="card-heading" style={{ color: t.txt, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={18} style={{ color: '#6366f1' }} /> Position Information
                  </h3>

                  <div className="meta-block" style={{ marginTop: 12 }}>
                    <span className="meta-label" style={{ color: t.txt3 }}>TITLE</span>
                    <span className="meta-val font-bold" style={{ color: t.txt }}>
                      {position?.title || application?.position_title || 'Flutter Developer Intern (Unpaid)'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>DEPARTMENT</span>
                      <span className="meta-val" style={{ color: t.txt2 }}>{position?.department || 'Engineering'}</span>
                    </div>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>EMPLOYMENT TYPE</span>
                      <span className="meta-val" style={{ color: t.txt2 }}>{position?.type || 'Internship (Intern)'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>LOCATION</span>
                      <span className="meta-val" style={{ color: t.txt2 }}>{position?.location || 'Remote'}</span>
                    </div>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>STIPEND / SALARY</span>
                      <span className="meta-val" style={{ color: t.txt2 }}>{position?.stipend || position?.salary || 'Unpaid'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>OPENINGS</span>
                      <span className="meta-val" style={{ color: t.txt2 }}>{position?.openings || '1'}</span>
                    </div>
                    <div className="meta-block">
                      <span className="meta-label" style={{ color: t.txt3 }}>STATUS</span>
                      <span className="meta-val" style={{ color: '#10b981', fontWeight: 600 }}>
                        {position?.status || 'Open (Actively Hiring)'}
                      </span>
                    </div>
                  </div>

                  {/* Show More / Show Less Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setShowPosDetails(!showPosDetails)}
                    className="pos-dropdown-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isDark ? 'rgba(99, 102, 241, 0.12)' : '#f0f4ff',
                      border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.25)' : '#c7d2fe'}`,
                      color: '#6366f1',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      marginTop: 14,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{showPosDetails ? 'Hide Full Specs' : 'Show Role Specs & Requirements'}</span>
                    {showPosDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Collapsible Dropdown Breakdown */}
                  {showPosDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        paddingTop: 14,
                        marginTop: 10,
                        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          About the Role
                        </h4>
                        <p style={{ fontSize: 13, color: t.txt2, lineHeight: 1.6, margin: 0 }}>
                          {position?.description || 'We are looking for a passionate and driven Flutter Developer Intern to join our team at Code Plus Academy. This role is designed for students, self-taught developers, or recent graduates who want hands-on experience building cross-platform applications.'}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Key Responsibilities
                        </h4>
                        <ul style={{ fontSize: 13, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
                          {position?.responsibilities ? (
                            Array.isArray(position.responsibilities) ? (
                              position.responsibilities.map((r, i) => <li key={i}>{r}</li>)
                            ) : (
                              <li>{position.responsibilities}</li>
                            )
                          ) : (
                            <>
                              <li><strong>App Development:</strong> Assist in designing, building, and deploying cross-platform applications using Flutter and Dart.</li>
                              <li><strong>UI/UX Implementation:</strong> Translate design mockups into responsive, high-performance user interfaces.</li>
                              <li><strong>Feature Integration:</strong> Work on integrating third-party APIs and managing application state.</li>
                              <li><strong>Code Maintenance:</strong> Write clean code and participate in debugging to ensure optimal app performance.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Requirements & Qualifications
                        </h4>
                        <ul style={{ fontSize: 13, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
                          {position?.requirements ? (
                            Array.isArray(position.requirements) ? (
                              position.requirements.map((req, i) => <li key={i}>{req}</li>)
                            ) : (
                              <li>{position.requirements}</li>
                            )
                          ) : (
                            <>
                              <li>Foundational understanding of Flutter framework and Dart language.</li>
                              <li>Familiarity with state management (Provider, Riverpod, BLoC).</li>
                              <li>Basic knowledge of Git/GitHub for version control.</li>
                              <li>Strong builder-oriented mindset with preference for learning by doing.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px 0', color: t.txt, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          What You Will Gain
                        </h4>
                        <ul style={{ fontSize: 13, color: t.txt2, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
                          {position?.perks ? (
                            Array.isArray(position.perks) ? (
                              position.perks.map((p, i) => <li key={i}>{p}</li>)
                            ) : (
                              <li>{position.perks}</li>
                            )
                          ) : (
                            <>
                              <li>Direct mentorship and architecture code reviews.</li>
                              <li>Hands-on work on live production learning tools and platforms.</li>
                              <li>Remote flexible schedule accommodating university exams.</li>
                              <li>Certificate of completion and detailed letter of recommendation.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        .status-page-wrapper {
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

        .status-container {
          position: relative;
          z-index: 10;
          max-width: 68rem;
          margin: 0 auto;
          padding-top: 1.25rem;
          padding-bottom: clamp(2rem, 5vw, 4rem);
          padding-left: clamp(1rem, 4vw, 2rem);
          padding-right: clamp(1rem, 4vw, 2rem);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #6366f1 !important;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 22rem;
          gap: 1.75rem;
          margin-top: 0.25rem;
        }

        .main-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }

        .sidebar-column {
          min-width: 0;
        }

        .dash-header-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.25rem, 3vw, 1.75rem);
          border-radius: 1.25rem;
          border: 1px solid;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dash-title {
          font-size: clamp(1.3rem, 3vw, 1.6rem);
          font-weight: 800;
          margin: 0 0 0.35rem 0;
        }

        .app-id-tag {
          margin: 0;
          font-size: 0.875rem;
        }

        .app-id-tag code {
          color: #6366f1;
          font-weight: 600;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.8125rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge-approved {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-rejected {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-interview {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .badge-review {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-applied {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .tasks-card {
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid;
        }

        .card-heading {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-row {
          padding: 0.875rem 1.125rem;
          border-radius: 0.75rem;
          border: 1px solid;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-title {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .task-prog {
          font-size: 0.75rem;
          margin-top: 0.125rem;
        }

        .task-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .task-badge.done {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .task-badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .chat-card {
          backdrop-filter: blur(20px);
          border-radius: 1.25rem;
          border: 1px solid;
          display: flex;
          flex-direction: column;
          height: clamp(26rem, 55vh, 34rem);
        }

        .chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid;
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .chat-heading {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          flex: 1;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.875rem;
        }

        .empty-chat-state {
          margin: auto;
          text-align: center;
          font-size: 0.875rem;
        }

        .message-bubble {
          width: fit-content !important;
          max-width: 78% !important;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.45;
          word-break: break-word;
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }

        .admin-bubble {
          align-self: flex-start !important;
          border-radius: 1.125rem 1.125rem 1.125rem 0.25rem;
        }

        .candidate-bubble {
          align-self: flex-end !important;
          border-radius: 1.125rem 1.125rem 0.25rem 1.125rem;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }

        .sender-tag {
          font-size: 0.7rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .msg-body {
          font-size: 0.875rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .msg-time {
          font-size: 0.65rem;
          margin-top: 0.25rem;
          text-align: right;
        }

        .chat-form {
          padding: 0.875rem 1rem;
          border-top: 1px solid;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          box-sizing: border-box;
        }

        .chat-input {
          flex: 1;
          min-width: 0;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid;
          font-size: 0.875rem;
          outline: none;
          box-sizing: border-box;
        }

        .chat-input:focus {
          border-color: #6366f1;
        }

        .send-button {
          flex-shrink: 0;
          white-space: nowrap;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          background: #6366f1;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .details-card {
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .meta-block {
          display: flex;
          flex-direction: column;
        }

        .meta-label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .meta-val {
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .font-bold {
          font-weight: 700;
        }

        .resume-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .resume-link:hover {
          text-decoration: underline;
        }

        .notes-block {
          border-top: 1px solid;
          padding-top: 1rem;
        }

        .notes-content {
          font-size: 0.8125rem;
          line-height: 1.5;
          margin-top: 0.25rem;
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

        @media (max-width: 868px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppLayout>
  );
}
