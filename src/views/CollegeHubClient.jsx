'use client';

import React, { useState } from 'react';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';

export default function CollegeHubClient({ institution }) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimantRole, setClaimantRole] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [proofDocument, setProofDocument] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimedStatus, setClaimedStatus] = useState(institution?.claim_status || 'unclaimed');
  const [claimedDetails, setClaimedDetails] = useState(institution?.claimed_by || null);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/institutions/${institution?.id || 'inst-1'}/claim`, {
        claimant_role: claimantRole,
        official_email: officialEmail,
        proof_documents: proofDocument ? [proofDocument] : [],
      });
      setClaimedStatus('pending');
      setShowClaimModal(false);
      alert('Institution claim submitted successfully. Compliance team will review your credentials within 48 hours.');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit institution claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 24, backgroundColor: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
      {/* Header & Verification Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} color="#6366f1" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
              {institution?.name || 'Code Plus Academy Partner Institute'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--sub)' }}>
              {institution?.location || 'New Delhi, India'} · Official College Hub
            </p>
          </div>
        </div>

        {/* Claim Status Badge / Claim Button */}
        {claimedStatus === 'approved' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
            <CheckCircle2 size={18} />
            <span>Claimed by {claimedDetails?.name || 'Official Admin'}, {claimedDetails?.role || 'Dean'}</span>
          </div>
        ) : claimedStatus === 'pending' ? (
          <div style={{ padding: '8px 14px', borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
            Claim Under Review
          </div>
        ) : (
          <button
            onClick={() => setShowClaimModal(true)}
            style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={16} /> Claim This Page
          </button>
        )}
      </div>

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: 12, border: '1px solid #334155', maxWidth: 480, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Claim Institution Profile</h2>
              <button onClick={() => setShowClaimModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Your Official Designation / Role</label>
                <input
                  type="text"
                  value={claimantRole}
                  onChange={(e) => setClaimantRole(e.target.value)}
                  placeholder="e.g. Dean of Academic Affairs / Registrar"
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Official Institutional Email (.ac.in / .edu)</label>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="you@institution.ac.in"
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Proof Document URL / ID Card Scan</label>
                <input
                  type="url"
                  value={proofDocument}
                  onChange={(e) => setProofDocument(e.target.value)}
                  placeholder="https://drive.google.com/link-to-official-authorization"
                  style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ padding: 11, borderRadius: 8, backgroundColor: '#6366f1', color: '#fff', fontWeight: 600, border: 'none', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1, marginTop: 8 }}
              >
                {submitting ? 'Submitting Verification...' : 'Submit Profile Claim'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
