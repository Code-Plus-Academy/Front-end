'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api, { baseApiUrl } from '../../../../src/api/axios';
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, XCircle,
  AlertCircle, FileText, Sparkles
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
      <div className="status-container">
        {/* Back navigation */}
        <Link href="/career" className="back-link">
          <ArrowLeft size={16} /> Back to Careers
        </Link>

        {loading ? (
          <div className="loading-state">Loading application status...</div>
        ) : error || !application ? (
          <div className="error-state-card">
            <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h2>Application Not Found</h2>
            <p>{error || 'The requested application could not be loaded.'}</p>
            <Link href="/career" className="back-home-btn">
              Back to Careers
            </Link>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Main Area: Chat & Tasks */}
            <div className="main-col">
              {/* Application Header Card */}
              <div className="app-header-card">
                <div>
                  <h1 className="dash-title">Candidate Dashboard</h1>
                  <p className="app-id-text">
                    Application ID: <code>{applicationId}</code>
                  </p>
                </div>
                <div>{getStatusBadge(application?.status)}</div>
              </div>

              {/* Tasks Card (Visible if Intern / Approved) */}
              {tasks.length > 0 && (
                <div className="tasks-card">
                  <h3 className="section-title">Assigned Intern Tasks</h3>
                  <div className="tasks-list">
                    {tasks.map((task) => (
                      <div key={task.id} className="task-item">
                        <div>
                          <div className="task-title">{task.title}</div>
                          <div className="task-progress">Progress: {task.progress || 0}%</div>
                        </div>
                        <span className={`task-badge ${task.status === 'done' ? 'done' : 'pending'}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Chat Panel */}
              <div className="chat-card">
                {/* Chat Header */}
                <div className="chat-header">
                  <MessageSquare size={18} style={{ color: '#6366f1' }} />
                  <h3 className="chat-title">Direct Admin Messenger</h3>
                </div>

                {/* Messages Body */}
                <div className="messages-body">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      No messages yet. Send a message to contact the hiring team.
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isAdmin =
                        m.sender_role?.toUpperCase() === 'ADMIN' || m.senderRole?.toUpperCase() === 'ADMIN';
                      return (
                        <div key={m.id || idx} className={`message-bubble ${isAdmin ? 'admin-bubble' : 'candidate-bubble'}`}>
                          <div className="message-sender">{isAdmin ? 'Hiring Admin' : 'You'}</div>
                          <div>{m.body}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <input
                    type="text"
                    placeholder="Ask a question or reply to admin..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="chat-input"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} className="send-btn">
                    Send <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Details Card */}
            <div className="sidebar-col">
              <div className="details-card">
                <h3 className="section-title">Application Info</h3>

                <div className="detail-item">
                  <div className="detail-label">CANDIDATE NAME</div>
                  <div className="detail-val font-bold">{application?.candidate_name || 'Applicant'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">SUBMITTED ON</div>
                  <div className="detail-val">
                    {application?.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>

                {application?.resume_url && (
                  <div className="detail-item">
                    <div className="detail-label">RESUME LINK</div>
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
                  <div className="detail-item notes-divider">
                    <div className="detail-label">ADMIN NOTES</div>
                    <div className="notes-text">{application.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .status-container {
          max-width: 68rem;
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 22rem;
          gap: 1.5rem;
        }

        .main-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }

        .sidebar-col {
          min-width: 0;
        }

        .app-header-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: clamp(1.25rem, 3vw, 1.75rem);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .dash-title {
          font-size: clamp(1.25rem, 3vw, 1.6rem);
          font-weight: 800;
          margin: 0 0 0.35rem 0;
          color: var(--text, #ffffff);
        }

        .app-id-text {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted, #9ca3af);
        }

        .app-id-text code {
          color: #818cf8;
          font-weight: 600;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.875rem;
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
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: var(--text, #ffffff);
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-item {
          padding: 0.875rem 1.125rem;
          border-radius: 0.625rem;
          background: rgba(0, 0, 0, 0.25);
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

        .task-progress {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.125rem;
        }

        .task-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-weight: 600;
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
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          height: 30rem;
        }

        .chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .chat-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
        }

        .messages-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .empty-chat {
          margin: auto;
          text-align: center;
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .message-bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.45;
        }

        .admin-bubble {
          align-self: flex-start;
          border-radius: 1rem 1rem 1rem 0.25rem;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .candidate-bubble {
          align-self: flex-end;
          border-radius: 1rem 1rem 0.25rem 1rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
        }

        .message-sender {
          font-size: 0.6875rem;
          opacity: 0.75;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .chat-input-form {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 0.625rem;
        }

        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.3);
          color: #ffffff;
          font-size: 0.875rem;
          outline: none;
        }

        .chat-input:focus {
          border-color: #6366f1;
        }

        .send-btn {
          padding: 0.75rem 1.25rem;
          border-radius: 0.625rem;
          background: #6366f1;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: background 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          background: #4f46e5;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .details-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 0.6875rem;
          color: #9ca3af;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .detail-val {
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

        .notes-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1rem;
        }

        .notes-text {
          font-size: 0.8125rem;
          color: #d1d5db;
          line-height: 1.5;
          margin-top: 0.25rem;
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
          color: #ffffff;
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

        @media (max-width: 868px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppLayout>
  );
}
