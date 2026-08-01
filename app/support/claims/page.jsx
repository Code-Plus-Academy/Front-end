'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import api from '../../../src/api/axios';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentReports();
  }, []);

  const loadContentReports = async () => {
    try {
      const res = await api.get('/support/content-reports');
      setClaims(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load content claims:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 840, margin: '2rem auto', padding: 20, textAlign: 'center', color: '#94a3b8' }}>
          Loading content claims...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 840, margin: '2rem auto', padding: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Claims Against My Content</h1>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: 20 }}>View copyright, harassment, or ownership complaints filed against content you uploaded.</p>

        {claims.length === 0 ? (
          <div style={{ background: '#1e293b', padding: 32, borderRadius: 12, border: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>
            <Scale size={40} style={{ marginBottom: 12, color: '#10b981' }} />
            <p style={{ fontWeight: 600, color: '#fff' }}>No active claims against your content</p>
            <span style={{ fontSize: '0.85rem' }}>Your published notes, articles, and videos are clear of policy complaints.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {claims.map(c => (
              <div key={c.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700 }}>Claim #{c.id}</span>
                  <h3 style={{ fontSize: '1rem', color: '#fff', margin: '4px 0' }}>{c.category}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status: {c.status}</span>
                </div>
                <Link href={`/support/track/${c.id}`} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  Track Case
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
