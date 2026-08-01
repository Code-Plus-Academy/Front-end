'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { FilePlus, XCircle, RotateCcw, Clock, AlertCircle } from 'lucide-react';

export default function ManageTicketsPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      const res = await api.get('/support/my-reports');
      setCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (ticketId) => {
    if (!confirm('Are you sure you want to withdraw this report?')) return;
    try {
      await api.post(`/support/cases/${ticketId}/withdraw`);
      loadMyReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw report.');
    }
  };

  const handleReopen = async (ticketId) => {
    const reason = prompt('Please provide a reason for reopening this report:');
    if (!reason) return;
    try {
      await api.post(`/support/cases/${ticketId}/reopen`, { reason });
      loadMyReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen report.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 840, margin: '2rem auto', padding: 20, textAlign: 'center', color: '#94a3b8' }}>
          Loading eligible tickets...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Manage Open Reports</h1>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: 20 }}>Add additional evidence, withdraw active reports, or request ticket reopening.</p>

        {cases.length === 0 ? (
          <div style={{ background: '#1e293b', padding: 32, borderRadius: 12, border: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>
            <Clock size={40} style={{ marginBottom: 12, color: '#64748b' }} />
            <p style={{ fontWeight: 600, color: '#fff' }}>No active reports eligible for management</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cases.map(t => (
              <div key={t.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700 }}>ID: {t.id}</span>
                  <h3 style={{ fontSize: '1rem', color: '#fff', margin: '4px 0' }}>{t.category || t.type}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status: {t.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.status === 'open' && (
                    <button onClick={() => handleWithdraw(t.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <XCircle size={14} /> Withdraw
                    </button>
                  )}
                  {t.status === 'closed' && (
                    <button onClick={() => handleReopen(t.id)} style={{ padding: '6px 12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RotateCcw size={14} /> Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
