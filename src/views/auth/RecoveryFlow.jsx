import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Terminal, ArrowLeft, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import AuthTerminalLayout from '../../components/layout/AuthTerminalLayout';
import VantaNetBackground from '../../components/layout/VantaNetBackground';
import OtpInput from '../../components/auth/OtpInput';
import api from '../../api/axios';

function PasswordRule({ met, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: met ? '#16a34a' : '#4b5563' }}>
      <span style={{ fontSize: 13 }}>{met ? '✓' : '○'}</span>
      {label}
    </div>
  );
}

export default function RecoveryFlow() {
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get('token');
  
  // Steps: 'select_method' | 'otp_verify' | 'create_password' | 'success' | 'invalid_token'
  const [step, setStep] = useState(tokenUrl ? 'create_password' : 'select_method');
  
  // State
  const [email, setEmail] = useState('');
  const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'code'
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(tokenUrl || null); // Holds JWT or hex string
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setResetToken(token);
        setStep('create_password');
      }
    }
  }, []);
  
  // Status hooks for loading/errors per step
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Password rules
  const rules = [
    { met: formData.password.length >= 8, label: 'Min 8 characters' },
    { met: /[A-Z]/.test(formData.password), label: 'Contains uppercase' },
    { met: /[0-9]/.test(formData.password), label: 'Contains number' },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0, label: 'Passwords match' },
  ];
  const allRulesMet = rules.every(r => r.met);

  const handleMethodSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.post('/auth/forgot-password', { email, mode: resetMethod === 'email' ? 'link' : 'otp' });
      setStatus('idle');
      if (resetMethod === 'code') {
        setStep('otp_verify');
      } else {
        // If email link method, just show a signal dispatched success message 
        // (we hijack the success step for this context temporarily or just show custom alert)
        setStep('success_dispatched');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Error dispatching recovery signal.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(res.data.reset_token);
      setStatus('idle');
      setStep('create_password');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error === 'TOKEN_INVALID_OR_EXPIRED' ? 'Invalid or expired OTP.' : 'Network failure.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesMet) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: formData.password });
      setStatus('idle');
      setStep('success_updated');
    } catch (err) {
      if (err.response?.data?.error === 'TOKEN_INVALID_OR_EXPIRED') {
        setStep('invalid_token');
      } else {
        setStatus('error');
        setErrorMsg('Error committing new key. Constraints violated.');
      }
    }
  };

  // ─── Renders ───────────────────────────────────────────────────────────────

  if (step === 'success_dispatched') {
    return (
      <AuthTerminalLayout title="Check Inbox" processName="RECOVERY_DISPATCH.EXE" pid="3072.SYS" classNameName="RecoveryLink"
        background={<VantaNetBackground color="#6e00ff" />}
        description="Signal dispatched. Check your inbox to proceed." onSubmit={(e) => e.preventDefault()} logs={[]}>
        <div style={{ background: '#0d0d1a', border: '1px solid rgba(110,0,255,0.25)', borderRadius: 6, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(110,0,255,0.15)', border: '1px solid rgba(110,0,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(110,0,255,0.2)' }}>
            <CheckCircle size={28} color="#a855f7" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recovery Signal Sent</h2>
          <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
            If <span style={{ color: '#c084fc', fontWeight: 700 }}>{email}</span> is registered, you will receive password reset instructions.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> RETURN_TO_LOGIN
          </Link>
        </div>
      </AuthTerminalLayout>
    );
  }

  if (step === 'success_updated') {
    return (
      <AuthTerminalLayout title="Password Updated" processName="PASSWD_UPDATE.EXE" pid="4096.SYS" classNameName="Success"
        background={<VantaNetBackground color="#6e00ff" />}
        description="System key updated successfully." onSubmit={(e) => e.preventDefault()} logs={[]}>
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

  if (step === 'invalid_token') {
    return (
      <AuthTerminalLayout title="Link Expired" processName="TOKEN_VALIDATE.EXE" pid="4096.SYS" classNameName="TokenError"
        background={<VantaNetBackground color="#6e00ff" />}
        description="This recovery link is invalid or has expired." onSubmit={(e) => e.preventDefault()} logs={[]}>
        <div style={{ background: '#1a0d0d', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Link Expired</h2>
          <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, marginBottom: 24 }}>This recovery token is no longer valid. Please request a new one.</p>
          <button onClick={() => setStep('select_method')} className="auth-btn-primary" style={{ display: 'inline-flex', maxWidth: 240, margin: '0 auto' }}>
            REQUEST_NEW_LINK
          </button>
        </div>
      </AuthTerminalLayout>
    );
  }

  // 1: SELECT METHOD
  if (step === 'select_method') {
    return (
      <AuthTerminalLayout title="CHOOSE_METHOD" processName="RECOVERY_PROTOCOL_v2" pid="8592" description="Identify your secondary authentication channel to initiate the secure credential synchronization process."
        background={<VantaNetBackground color="#6e00ff" />}
        onSubmit={handleMethodSubmit} logs={[{ time: '14:02:16', text: 'RECOVERY_MODULE_START' }, { time: '14:02:18', text: 'WAITING_FOR_USER_METHOD...' }]}>
        
        <div className="auth-field" style={{ marginBottom: 24 }}>
          <label className="auth-label">Registered_Email</label>
          <div className="auth-input-wrap">
            <span className="auth-prompt">&gt;</span>
            <input type="email" required className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {/* Method 01 */}
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <input type="radio" value="email" checked={resetMethod === 'email'} onChange={(e) => setResetMethod(e.target.value)} style={{ opacity: 0, position: 'absolute' }} />
            <div style={{ padding: '16px', background: resetMethod === 'email' ? 'rgba(110,0,255,0.1)' : 'var(--surface-container-low, #131b2e)', border: `1px solid ${resetMethod === 'email' ? 'var(--primary-container, #6e00ff)' : 'transparent'}`, borderRadius: 4, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ color: resetMethod === 'email' ? 'var(--primary-container, #6e00ff)' : 'var(--outline, #958da3)', fontWeight: 900, fontSize: 12 }}>01</div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>METHOD_01: EMAIL_LINK</h3>
                  <p style={{ color: 'var(--outline, #958da3)', fontSize: 11, margin: 0 }}>Transmission of a secure one-time cryptographic link to your email.</p>
                </div>
              </div>
            </div>
          </label>

          {/* Method 02 */}
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <input type="radio" value="code" checked={resetMethod === 'code'} onChange={(e) => setResetMethod(e.target.value)} style={{ opacity: 0, position: 'absolute' }} />
            <div style={{ padding: '16px', background: resetMethod === 'code' ? 'rgba(110,0,255,0.1)' : 'var(--surface-container-low, #131b2e)', border: `1px solid ${resetMethod === 'code' ? 'var(--primary-container, #6e00ff)' : 'transparent'}`, borderRadius: 4, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ color: resetMethod === 'code' ? 'var(--primary-container, #6e00ff)' : 'var(--outline, #958da3)', fontWeight: 900, fontSize: 12 }}>02</div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>METHOD_02: VERIFICATION_CODE</h3>
                  <p style={{ color: 'var(--outline, #958da3)', fontSize: 11, margin: 0 }}>6-digit alphanumeric token delivered directly to your email.</p>
                </div>
              </div>
            </div>
          </label>
        </div>

        {status === 'error' && <p style={{ color: '#fca5a5', fontSize: 11, marginBottom: 12 }}>{errorMsg}</p>}

        <button type="submit" disabled={status === 'loading'} className="auth-btn-primary">
          {status === 'loading' ? 'EXECUTING...' : 'EXECUTE_SELECTION'}
        </button>
        <p className="auth-footer-text"><Link to="/login">← ABORT_SESSION</Link></p>
      </AuthTerminalLayout>
    );
  }

  // 2: VERIFY OTP
  if (step === 'otp_verify') {
    return (
      <AuthTerminalLayout title="IDENTITY_VERIFY" processName="MFA_CHALLENGE" pid="983" description="Input the 6-digit sequence sent to your linked address."
        background={<VantaNetBackground color="#6e00ff" />}
        onSubmit={handleOtpSubmit} logs={[{ time: '09:42:01', text: 'GATEWAY: Message dispatched' }, { time: '09:42:05', text: 'LISTENING_FOR_SEQUENCE_INPUT', isCursor: true }]}>
        
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', color: 'var(--primary, #d0bcff)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Input security sequence
          </label>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <OtpInput length={6} onComplete={(val) => setOtp(val)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 10, color: 'var(--outline, #958da3)' }}>AWAITING_INPUT...</span>
            <button type="button" onClick={() => setStep('select_method')} style={{ fontSize: 10, color: 'var(--secondary, #d0bcff)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              ABORT_CHALLENGE
            </button>
          </div>
        </div>

        {status === 'error' && <p style={{ color: '#fca5a5', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>{errorMsg}</p>}

        <button type="submit" disabled={status === 'loading' || otp.length < 6} className="auth-btn-primary">
          <Terminal size={14} style={{ marginRight: 8, display: 'inline' }} />
          {status === 'loading' ? 'VERIFYING...' : 'EXECUTE_VERIFICATION'}
        </button>
      </AuthTerminalLayout>
    );
  }

  // 3: NEW PASSWORD
  if (step === 'create_password') {
    return (
      <AuthTerminalLayout title="SET_SYSTEM_KEY" processName="PASSWD_RESET.EXE" pid="4096.SYS" description="Set a new system key. Must satisfy all security constraints."
        background={<VantaNetBackground color="#6e00ff" />}
        onSubmit={handlePasswordSubmit} logs={[{ time: '16:45:02', text: 'TOKEN_VERIFIED' }, { time: '16:45:04', text: 'AWAITING_NEW_KEY', isCursor: true }]}>
        
        <div className="auth-field">
          <label className="auth-label">New_System_Pass</label>
          <div className="auth-input-wrap">
            <span className="auth-prompt">&gt;</span>
            <input type="password" required className="auth-input" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••••••" disabled={status === 'loading'} />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Verify_System_Pass</label>
          <div className="auth-input-wrap">
            <span className="auth-prompt">&gt;</span>
            <input type="password" required className="auth-input" value={formData.confirmPassword} onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••••••" disabled={status === 'loading'} />
          </div>
        </div>

        {formData.password.length > 0 && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 6, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>System Constraints</div>
            {rules.map((r, i) => <PasswordRule key={i} met={r.met} label={r.label} />)}
          </div>
        )}

        {status === 'error' && <p className="auth-error">{errorMsg}</p>}

        <button type="submit" disabled={!allRulesMet || status === 'loading'} className="auth-btn-primary">
          <Shield size={16} style={{ marginRight: 8, display: 'inline' }} />
          {status === 'loading' ? 'UPDATING...' : 'COMMIT_NEW_KEY'}
        </button>

        <p className="auth-footer-text"><Link to="/login">← CANCEL</Link></p>
      </AuthTerminalLayout>
    );
  }

  return null;
}
