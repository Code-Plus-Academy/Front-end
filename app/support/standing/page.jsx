'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function StandingPage() {
  const [standing, setStanding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStanding();
  }, []);

  const loadStanding = async () => {
    try {
      const res = await api.get('/support/standing');
      setStanding(res.data);
    } catch (err) {
      console.error('Failed to load account standing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20, textAlign: 'center', color: '#94a3b8' }}>
          Loading account standing...
        </div>
      </AppLayout>
    );
  }

  const strikes = standing?.active_strikes || 0;
  const isSuspended = standing?.suspension_status === 'suspended' || standing?.suspension_status === 'banned';

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20 }}>
        {/* Banner */}
        <div style={{
          padding: 24,
          borderRadius: 12,
          border: `1px solid ${isSuspended ? '#ef4444' : strikes > 0 ? '#f59e0b' : '#10b981'}`,
          backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.1)' : strikes > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          {isSuspended ? <ShieldAlert size={36} color="#ef4444" /> : strikes > 0 ? <AlertTriangle size={36} color="#f59e0b" /> : <ShieldCheck size={36} color="#10b981" />}
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {isSuspended ? 'Account Action Active' : strikes > 0 ? `${strikes} Active Strike(s)` : 'Account in Good Standing'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              {isSuspended ? `Suspension Status: ${standing.suspension_status.toUpperCase()}` : strikes > 0 ? 'Receiving 3 strikes will trigger an automatic account suspension review.' : 'You have 0 active copyright or community guideline strikes on your account.'}
            </p>
          </div>
        </div>

        {/* Strikes List */}
        <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Copyright & Conduct Strike History</h2>
          {strikes === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, color: '#fff' }}>No strikes recorded</p>
              <span style={{ fontSize: '0.85rem' }}>Your account adheres fully to Code Plus Academy content guidelines.</span>
            </div>
          ) : (
            <div style={{ padding: 16, backgroundColor: '#0f172a', borderRadius: 8, borderLeft: '4px solid #f59e0b' }}>
              <strong style={{ color: '#f59e0b' }}>Active Strike Count: {strikes} / 3</strong>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 4 }}>Strikes expire automatically 90 days after issuance provided no further violations occur.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
