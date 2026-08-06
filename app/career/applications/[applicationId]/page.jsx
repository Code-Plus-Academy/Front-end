'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api, { baseApiUrl } from '../../../../src/api/axios';
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, XCircle,
  AlertCircle, FileText, Sparkles, User, Calendar
} from 'lucide-react';

export default function ApplicationStatusPage() {
  const { applicationId } = useParams();

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
      <div className="status-page-wrapper">
        <div className="ambient-glow glow-1" />

        <div className="status-container">
          {/* Back Navigation */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/career" className="back-link">
              <ArrowLeft size={16} /> Back to Careers
            </Link>
          </motion.div>

          {loading ? (
            <div className="loading-card">Loading candidate dashboard...</div>
          ) : error || !application ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="error-card">
              <AlertCircle size={44} className="text-error" />
              <h2>Application Unavailable</h2>
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
              {/* Main Area */}
              <div className="main-column">
                {/* Application Header Banner */}
                <div className="dash-header-card">
                  <div>
                    <h1 className="dash-title">Candidate Dashboard</h1>
                    <p className="app-id-tag">
                      Application ID: <code>{applicationId}</code>
                    </p>
                  </div>
                  <div>{getStatusBadge(application?.status)}</div>
                </div>

                {/* Assigned Tasks */}
                {tasks.length > 0 && (
                  <div className="tasks-card">
                    <h3 className="card-heading">Assigned Intern Tasks</h3>
                    <div className="tasks-list">
                      {tasks.map((task) => (
                        <div key={task.id} className="task-row">
                          <div>
                            <div className="task-title">{task.title}</div>
                            <div className="task-prog">Progress: {task.progress || 0}%</div>
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
                <div className="chat-card">
                  <div className="chat-header">
                    <MessageSquare size={18} style={{ color: '#818cf8' }} />
                    <h3 className="chat-heading">Direct Admin Messenger</h3>
                    <span className="live-indicator">
                      <span className="live-dot" /> Live gRPC Stream
                    </span>
                  </div>

                  <div className="messages-area">
                    {messages.length === 0 ? (
                      <div className="empty-chat-state">
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
                          >
                            <div className="sender-tag">{isAdmin ? 'Hiring Admin' : 'You'}</div>
                            <div>{m.body}</div>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="chat-form">
                    <input
                      type="text"
                      placeholder="Type a message or reply to the team..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="chat-input"
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

              {/* Sidebar */}
              <div className="sidebar-column">
                <div className="details-card">
                  <h3 className="card-heading">Application Metadata</h3>

                  <div className="meta-block">
                    <span className="meta-label">APPLICANT NAME</span>
                    <span className="meta-val font-bold">{application?.candidate_name || 'Applicant'}</span>
                  </div>

                  <div className="meta-block">
                    <span className="meta-label">SUBMISSION DATE</span>
                    <span className="meta-val">
                      {application?.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>

                  {application?.resume_url && (
                    <div className="meta-block">
                      <span className="meta-label">DOCUMENT ATTACHMENT</span>
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
                    <div className="meta-block notes-block">
                      <span className="meta-label">ADMIN REVIEW NOTES</span>
                      <p className="notes-content">{application.notes}</p>
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
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: clamp(1.25rem, 3vw, 1.75rem);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          color: #ffffff;
        }

        .app-id-tag {
          margin: 0;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .app-id-tag code {
          color: #818cf8;
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
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-rejected {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-interview {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .badge-review {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-applied {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .tasks-card {
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .card-heading {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: #ffffff;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-row {
          padding: 0.875rem 1.125rem;
          border-radius: 0.75rem;
          background: rgba(10, 11, 16, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: #ffffff;
        }

        .task-prog {
          font-size: 0.75rem;
          color: #9ca3af;
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
          color: #34d399;
        }

        .task-badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .chat-card {
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          height: 32rem;
        }

        .chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .chat-heading {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
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
          color: #9ca3af;
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
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .candidate-bubble {
          align-self: flex-end;
          border-radius: 1.125rem 1.125rem 0.25rem 1.125rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
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
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 0.625rem;
        }

        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(10, 11, 16, 0.6);
          color: #ffffff;
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
          background: rgba(18, 20, 29, 0.6);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          color: #9ca3af;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .meta-val {
          font-size: 0.875rem;
          margin-top: 0.25rem;
          color: #e5e7eb;
        }

        .font-bold {
          font-weight: 700;
        }

        .resume-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #818cf8;
          text-decoration: none;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .resume-link:hover {
          text-decoration: underline;
        }

        .notes-block {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1rem;
        }

        .notes-content {
          font-size: 0.8125rem;
          color: #d1d5db;
          line-height: 1.5;
          margin-top: 0.25rem;
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

        @media (max-width: 868px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppLayout>
  );
}
