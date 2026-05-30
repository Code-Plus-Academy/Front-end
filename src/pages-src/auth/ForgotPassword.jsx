'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Terminal, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthTerminalLayout from '../../components/layout/AuthTerminalLayout';
import api from '../../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <AuthTerminalLayout
        title="Check Email"
        processName="RECOVERY_DISPATCH.EXE"
        pid="3072.SYS"
        classNameName="RecoveryLink"
        description="Signal dispatched. Check your inbox to proceed."
        onSubmit={(e) => e.preventDefault()}
        logs={[]}
      >
        <div style={{
          background: '#0d0d1a',
          border: '1px solid rgba(110,0,255,0.25)',
          borderRadius: 6,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(110,0,255,0.15)',
            border: '1px solid rgba(110,0,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(110,0,255,0.2)',
          }}>
            <CheckCircle size={28} color="#a855f7" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Recovery Signal Sent
          </h2>
          <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
            If <span style={{ color: '#c084fc', fontWeight: 700 }}>{email}</span> is registered, you will receive password reset instructions.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#6b7280', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
          }}>
            <ArrowLeft size={14} /> RETURN_TO_LOGIN
          </Link>
        </div>
      </AuthTerminalLayout>
    );
  }

  return (
    <AuthTerminalLayout
      title="Forgot Password"
      processName="ACCOUNT_RECOVERY.EXE"
      pid="3072.SYS"
      classNameName="AccountRecovery"
      description="Enter your registered email to dispatch a recovery signal."
      onSubmit={handleSubmit}
      logs={[
        { time: '14:23:06', text: 'RECOVERY_PROTOCOL_INITIALIZED' },
        { time: '14:23:08', text: 'AWAITING_USER_ACTION', isCursor: true },
      ]}
    >
      {/* Email */}
      <div className="auth-field">
        <label className="auth-label">Registered_Email</label>
        <div className="auth-input-wrap">
          <span className="auth-prompt">&gt;</span>
          <input
            type="email"
            required
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter registration email..."
            style={{ fontSize: 15 }}
          />
        </div>
        {status === 'error' && (
          <p style={{ color: '#fca5a5', fontSize: 11, fontWeight: 600, marginTop: 6 }}>
            Error dispatching recovery signal. Try again.
          </p>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={status === 'loading'} className="auth-btn-primary">
        <Terminal size={16} />
        {status === 'loading' ? 'EXECUTING...' : 'EXECUTE_RECOVERY_PROTOCOL'}
      </button>

      {/* Back link */}
      <p className="auth-footer-text">
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={13} /> RETURN_TO_LOGIN
        </Link>
      </p>
    </AuthTerminalLayout>
  );
}
