'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api, { baseApiUrl } from '../../../../src/api/axios';
import { useTheme } from '../../../../src/context/ThemeContext';
import { DARK, LIGHT } from '../../../../src/styles/tokens';
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, XCircle,
  AlertCircle, FileText
} from 'lucide-react';

export default function ApplicationStatusPage() {
  const { applicationId } = useParams();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = isDark ? DARK : LIGHT;

  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
      fetchMessageHistory();
      fetchTasks();
      const cleanupStream = setupSSEStream();
      return () => {
        if (cleanupStream) cleanupStream();
      };
    }
  }, [applicationId]);

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
      setApplication(res.data);
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
    const s = (status || 'APPLIED').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <span className="status-badge badge-approved">
            <CheckCircle2 size={16} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-badge badge-rejected">
            <XCircle size={16} /> Rejected
          </span>
        );
      case 'INTERVIEW':
        return (
          <span className="status-badge badge-interview">
            <MessageSquare size={16} /> Interview Scheduled
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="status-badge badge-review">
            <AlertCircle size={16} /> In Review
          </span>
        );
      default:
        return (
          <span className="status-badge badge-applied">
            <Clock size={16} /> Applied
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
            <Link href="/career" className="back-link" style={{ color: t.txt2 }}>
              <ArrowLeft size={16} /> Back to Careers
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
                        const isAdmin =
                          m.sender_role?.toUpperCase() === 'ADMIN' || m.senderRole?.toUpperCase() === 'ADMIN';
                        return (
                          <motion.div
                            key={m.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message-bubble ${isAdmin ? 'admin-bubble' : 'candidate-bubble'}`}
                            style={{
                              background: isAdmin
                                ? isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : '#f1f5f9'
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: isAdmin ? t.txt : '#ffffff',
                            }}
                          >
                            <div className="sender-tag">{isAdmin ? 'Hiring Admin' : 'You'}</div>
                            <div>{m.body}</div>
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
              <div className="sidebar-column">
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 22rem;
          gap: 1.5rem;
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
          height: 32rem;
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
          gap: 0.875rem;
        }

        .empty-chat-state {
          margin: auto;
          text-align: center;
          font-size: 0.875rem;
        }

        .message-bubble {
          max-width: 80%;
          padding: 0.8rem 1.1rem;
          font-size: 0.875rem;
          line-height: 1.45;
        }

        .admin-bubble {
          align-self: flex-start;
          border-radius: 1.125rem 1.125rem 1.125rem 0.25rem;
        }

        .candidate-bubble {
          align-self: flex-end;
          border-radius: 1.125rem 1.125rem 0.25rem 1.125rem;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .sender-tag {
          font-size: 0.6875rem;
          opacity: 0.75;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .chat-form {
          padding: 1rem;
          border-top: 1px solid;
          display: flex;
          gap: 0.625rem;
        }

        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid;
          font-size: 0.875rem;
          outline: none;
        }

        .chat-input:focus {
          border-color: #6366f1;
        }

        .send-button {
          padding: 0.75rem 1.35rem;
          border-radius: 0.75rem;
          background: #6366f1;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
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
