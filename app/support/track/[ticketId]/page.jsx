'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';
import api from '../../../../src/api/axios';
import { Clock, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function TrackPage() {
  const params = useParams();
  const ticketId = params?.ticketId;
  const [ticket, setTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicketDetails();
    }
  }, [ticketId]);

  const loadTicketDetails = async () => {
    try {
      const res = await api.get(`/support/cases/${ticketId}`);
      setTicket(res.data.ticket);
      setActions(res.data.actions || []);
      setAppeals(res.data.appeals || []);
    } catch (err) {
      setError('This report is not available or does not belong to your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason) return;
    setSubmittingAppeal(true);
    try {
      await api.post(`/support/cases/${ticketId}/appeal`, { reason: appealReason });
      setAppealSubmitted(true);
      loadTicketDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit appeal.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20, textAlign: 'center', color: '#94a3b8' }}>
          Loading ticket status...
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: 30, background: '#1e293b', borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <AlertCircle size={40} color="#f87171" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 8 }}>Report Not Available</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{error}</p>
        </div>
      </AppLayout>
    );
  }

  const steps = ['open', 'acknowledged', 'under_review', 'action_taken', 'closed'];
  const currentStepIndex = steps.indexOf(ticket.status) !== -1 ? steps.indexOf(ticket.status) : 2;

  return (
    <AppLayout>
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: 20 }}>
        {/* Header */}
        <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #334155', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>Ticket ID: {ticket.id}</span>
            <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#334155', color: '#34d399', textTransform: 'uppercase' }}>
              {ticket.status}
            </span>
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{ticket.category}</h1>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
        </div>

        {/* Stepper */}
        <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #334155', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Status Timeline</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {steps.map((step, idx) => (
              <div key={step} style={{ textAlign: 'center', flex: 1, zIndex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: idx <= currentStepIndex ? '#6366f1' : '#334155',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 700
                }}>
                  {idx <= currentStepIndex ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '0.75rem', color: idx <= currentStepIndex ? '#f8fafc' : '#64748b', textTransform: 'capitalize' }}>
                  {step.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Case Actions Feed */}
        <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #334155', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Official Action History</h3>
          {actions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Your report has been received and queued for review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {actions.map(act => (
                <div key={act.id} style={{ padding: 12, backgroundColor: '#0f172a', borderRadius: 8, borderLeft: '3px solid #6366f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                    <strong style={{ color: '#38bdf8' }}>{act.action_type?.toUpperCase()}</strong>
                    <span>{new Date(act.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{act.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appeal Form */}
        {(ticket.status === 'action_taken' || ticket.status === 'dismissed') && (
          <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>File an Appeal</h3>
            {appeals.length > 0 || appealSubmitted ? (
              <p style={{ fontSize: '0.85rem', color: '#34d399' }}>✓ Appeal filed and currently under senior review.</p>
            ) : (
              <form onSubmit={handleAppealSubmit}>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why this decision should be reviewed..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: 12, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', marginBottom: 12, fontSize: '0.9rem' }}
                />
                <button type="submit" disabled={submittingAppeal} style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  {submittingAppeal ? 'Submitting Appeal...' : 'Submit Appeal'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
