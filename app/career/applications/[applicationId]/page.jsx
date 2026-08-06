'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api, { baseApiUrl } from '../../../../src/api/axios';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, XCircle, AlertCircle, FileText } from 'lucide-react';

export default function ApplicationStatusPage() {
  const { applicationId } = useParams();

  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
      fetchMessageHistory();
      fetchTasks();
      setupSSEStream();
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
      const res = await api.get(`/career/applications/${applicationId}`);
      setApplication(res.data);
    } catch (err) {
      console.error('Failed to fetch application:', err);
      // Fallback mock details
      setApplication({
        id: applicationId,
        candidate_name: 'Candidate',
        status: 'APPLIED',
        applied_at: new Date().toISOString(),
        resume_url: 'https://example.com/resume.pdf',
        notes: 'Application received and undergoing initial review.',
      });
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
            <CheckCircle2 size={16} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
            <XCircle size={16} /> Rejected
          </span>
        );
      case 'INTERVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700, fontSize: '13px' }}>
            <MessageSquare size={16} /> Interview Scheduled
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700, fontSize: '13px' }}>
            <AlertCircle size={16} /> In Review
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: 700, fontSize: '13px' }}>
            <Clock size={16} /> Applied
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Back navigation */}
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
          <ArrowLeft size={16} /> Back to Careers
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>Loading application status...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Main Area: Chat & Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Application Header Card */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0' }}>Candidate Dashboard</h1>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted, #9ca3af)' }}>
                    Application ID: <code style={{ color: '#6366f1' }}>{applicationId}</code>
                  </p>
                </div>
                <div>{getStatusBadge(application?.status)}</div>
              </div>

              {/* Tasks Card (Visible if Intern / Approved) */}
              {tasks.length > 0 && (
                <div
                  style={{
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Assigned Intern Tasks</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{task.title}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                            Progress: {task.progress || 0}%
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: task.status === 'done' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: task.status === 'done' ? '#10b981' : '#f59e0b',
                            fontWeight: 600,
                          }}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Chat Panel */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '500px',
                }}
              >
                {/* Chat Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <MessageSquare size={18} style={{ color: '#6366f1' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Direct Admin Messenger</h3>
                </div>

                {/* Messages Body */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      No messages yet. Send a message to contact the hiring admin team.
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isAdmin = m.sender_role?.toUpperCase() === 'ADMIN' || m.senderRole?.toUpperCase() === 'ADMIN';
                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                            maxWidth: '75%',
                            padding: '12px 16px',
                            borderRadius: isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                            background: isAdmin ? 'rgba(255, 255, 255, 0.08)' : '#6366f1',
                            color: '#fff',
                            fontSize: '14px',
                            lineHeight: '1.4',
                          }}
                        >
                          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px', fontWeight: 600 }}>
                            {isAdmin ? 'Hiring Admin' : 'You'}
                          </div>
                          <div>{m.body}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '16px',
                    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ask a question or reply to admin..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                      background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                      color: 'var(--text, #fff)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !draft.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Send <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Details Card */}
            <div>
              <div
                style={{
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Application Details</h3>

                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>CANDIDATE NAME</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                    {application?.candidate_name || 'Candidate'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>SUBMITTED ON</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {application?.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>

                {application?.resume_url && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>RESUME</div>
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#6366f1',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <FileText size={16} /> View Submitted Resume
                    </a>
                  </div>
                )}

                {application?.notes && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>ADMIN NOTES</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #d1d5db)', lineHeight: '1.5' }}>
                      {application.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
