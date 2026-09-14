import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Terminal, CheckCircle, AlertCircle, Shield, ShieldCheck } from 'lucide-react';
import AuthTerminalLayout from '../../components/layout/AuthTerminalLayout';
import VantaNetBackground from '../../components/layout/VantaNetBackground';
import api from '../../api/axios';
import TwoFactorModal from '../../components/auth/TwoFactorModal';
import { getMFAFactors } from '../../lib/mfa';

function PasswordRule({ met, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: met ? '#16a34a' : '#4b5563' }}>
      <span style={{ fontSize: 13 }}>{met ? '✓' : '○'}</span>
      {label}
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [has2Fa, setHas2Fa] = useState(false);
  const [is2FaVerified, setIs2FaVerified] = useState(false);
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const rules = [
    { met: formData.password.length >= 8, label: 'Min 8 characters' },
    { met: /[A-Z]/.test(formData.password), label: 'Contains uppercase' },
    { met: /[0-9]/.test(formData.password), label: 'Contains number' },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0, label: 'Passwords match' },
  ];
  const allRulesMet = rules.every(r => r.met);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    // Check if recovery account has TFA enabled
    api.get(`/auth/verify-reset-token?token=${token}`)
      .then(res => {
        if (res.data?.mfa_enabled) {
          setHas2Fa(true);
          setUserEmail(res.data.email || '');
          setShow2FaModal(true);
        } else {
          setIs2FaVerified(true);
        }
      })
      .catch(() => {
        // Fallback: allow standard entry or handle invalid token
        setIs2FaVerified(true);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesMet) return;
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, newPassword: formData.password });
      setStatus('success');
    } catch (err) {
      setStatus(err.response?.data?.error === 'TOKEN_INVALID_OR_EXPIRED' ? 'expired' : 'error');
    }
  };

  if (status === 'success') {
    return (
      <AuthTerminalLayout title="Password Updated" processName="PASSWD_UPDATE.EXE" pid="4096.SYS"
        background={<VantaNetBackground color="#6e00ff" />}
        classNameName="Success" description="System key updated successfully." onSubmit={(e) => e.preventDefault()} logs={[]}>
        <div style={{ background: '#0d1a0d', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(34,197,94,0.15)' }}>
            <CheckCircle size={28} color="#22c55e" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Password Updated</h2>
          <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, marginBottom: 24 }}>Your system key has been successfully updated.</p>
          <Link to="/login" className="auth-btn-primary" style={{ display: 'inline-flex', maxWidth: 240, textDecoration: 'none' }}>
            <Terminal size={16} /> RETURN_TO_LOGIN
          </Link>
        </div>
      </AuthTerminalLayout>
    );
  }

  if (status === 'expired' || status === 'invalid') {
    return (
      <AuthTerminalLayout title="Link Expired" processName="TOKEN_VALIDATE.EXE" pid="4096.SYS"
        background={<VantaNetBackground color="#6e00ff" />}
        classNameName="TokenError" description="This recovery link is invalid or has expired." onSubmit={(e) => e.preventDefault()} logs={[]}>
        <div style={{ background: '#1a0d0d', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Link Expired</h2>
          <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, marginBottom: 24 }}>This recovery link is no longer valid. Please request a new one.</p>
          <Link to="/forgot-password" className="auth-btn-primary" style={{ display: 'inline-flex', maxWidth: 240, textDecoration: 'none' }}>
            REQUEST_NEW_LINK
          </Link>
        </div>
      </AuthTerminalLayout>
    );
  }

  return (
    <>
      <TwoFactorModal
        isOpen={show2FaModal}
        onClose={() => setShow2FaModal(false)}
        onSuccess={() => {
          setIs2FaVerified(true);
          setShow2FaModal(false);
        }}
        userEmail={userEmail}
        mode="verify"
        title="Two-Factor Recovery Check"
        description="This account is protected by 2FA. Please verify with your 6-digit authenticator code or backup code to reset your password."
      />
      <AuthTerminalLayout
        title="Reset Password"
        processName="PASSWD_RESET.EXE"
        pid="4096.SYS"
        classNameName="PasswordReset"
        background={<VantaNetBackground color="#6e00ff" />}
        description="Set a new system key. Must satisfy all security constraints."
        onSubmit={handleSubmit}
        logs={[
          { time: '16:45:02', text: 'TOKEN_VERIFIED — scope:password_reset' },
          { time: '16:45:04', text: has2Fa && !is2FaVerified ? 'AWAITING_2FA_VERIFICATION' : 'AWAITING_NEW_KEY', isCursor: true },
        ]}
      >
        {has2Fa && !is2FaVerified ? (
          <div style={{ background: '#111827', border: '1px solid rgba(59, 124, 255, 0.3)', borderRadius: 8, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(59, 124, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Shield size={24} color="#3B7CFF" />
            </div>
            <h3 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Two-Factor Authentication Required</h3>
            <p style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
              Your account has 2FA enabled. Enter your Authenticator app code or backup code to unlock password reset.
            </p>
            <button
              type="button"
              onClick={() => setShow2FaModal(true)}
              className="auth-btn-primary"
              style={{ display: 'inline-flex', maxWidth: 220, cursor: 'pointer' }}
            >
              Verify 2FA Identity
            </button>
          </div>
        ) : (
          <>
            {/* New Password */}
            <div className="auth-field">
              <label className="auth-label">Set_System_Pass</label>
              <div className="auth-input-wrap">
                <span className="auth-prompt">&gt;</span>
                <input
                  type="password"
                  required
                  className="auth-input"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••••••"
                  disabled={!token || status === 'loading'}
                />
              </div>
            </div>

      {/* Confirm Password */}
      <div className="auth-field">
        <label className="auth-label">Verify_System_Pass</label>
        <div className="auth-input-wrap">
          <span className="auth-prompt">&gt;</span>
          <input
            type="password"
            required
            className="auth-input"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="••••••••••••"
            disabled={!token || status === 'loading'}
          />
        </div>
      </div>

      {/* Constraints */}
      {formData.password.length > 0 && (
        <div style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 6, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 9, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>System Constraints</div>
          {rules.map((r, i) => <PasswordRule key={i} met={r.met} label={r.label} />)}
        </div>
      )}

      {status === 'error' && <div className="auth-error">An error occurred. Try requesting a new reset link.</div>}

      {/* Submit */}
      <button type="submit" disabled={!allRulesMet || !token || status === 'loading'} className="auth-btn-primary">
        <Terminal size={16} />
        {status === 'loading' ? 'UPDATING...' : 'COMMIT_NEW_KEY'}
      </button>

            <p className="auth-footer-text">
              <Link to="/login">← RETURN_TO_LOGIN</Link>
            </p>
          </>
        )}
      </AuthTerminalLayout>
    </>
  );
}
