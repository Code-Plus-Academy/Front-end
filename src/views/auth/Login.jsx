'use client';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import AuthTerminalLayout from '../../components/layout/AuthTerminalLayout';
import { useAuth } from '../../context/AuthContext';
import api, { baseApiUrl } from '../../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const oauthError = urlParams.get('error') === 'oauth' && 'OAuth initialization failed. Try again.';

  const handleGoogle = () => {
    window.location.href = `${baseApiUrl}/auth/google`;
  };
  const handleGithub = () => {
    window.location.href = `${baseApiUrl}/auth/github`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', formData);
      await refreshUser(); // Make sure Context is updated immediately

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const TRUSTED = [
        window.location.origin,
        'https://studio.cpa.academic.in',
        'https://studio.codeplusacademy.in',
        'http://localhost:5174',
      ];
      
      if (next && TRUSTED.some(origin => decodeURIComponent(next).startsWith(origin))) {
        window.location.href = decodeURIComponent(next);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('AUTHENTICATION_FAILED: Invalid credentials.');
      } else {
        setError(err.response?.data?.message || 'Connection to auth cluster refused.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTerminalLayout
      title="Login"
      processName="IDENTITY_HANDSHAKE.EXE"
      pid="1024.SYS"
      classNameName="Session"
      description="Initialize secure session. Enter credentials or mount OAuth payload."
      logs={[
        { time: '12:00:01', text: 'WAITING_FOR_CREDENTIALS' },
        { time: '12:00:03', text: 'Ready to establish secure handshake...', dim: true },
        { time: '12:00:05', text: 'AWAITING_INPUT', isCursor: true },
      ]}
      onSubmit={handleSubmit}
    >
      {/* Email */}
      <div className="auth-field">
        <label className="auth-label">Declaration_Email</label>
        <div className="auth-input-wrap">
          <span className="auth-prompt">&gt;</span>
          <input
            type="email"
            required
            className="auth-input"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="developer@domain.com"
          />
        </div>
      </div>

      {/* Password */}
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label">Secure_Key</label>
          <Link to="/forgot-password" className="auth-bypass">[bypass]</Link>
        </div>
        <div className="auth-input-wrap">
          <span className="auth-prompt">&gt;</span>
          <input
            type="password"
            required
            className="auth-input"
            value={formData.password}
            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
            placeholder="••••••••••••"
          />
        </div>
      </div>

      {/* Error */}
      {(error || oauthError) && (
        <div className="auth-error">{error || oauthError}</div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading} className="auth-btn-primary">
        <Terminal size={16} />
        {loading ? 'AUTHENTICATING...' : 'EXECUTE_HANDSHAKE'}
      </button>

      {/* Social */}
      <div className="auth-social">
        <div className="auth-divider">or mount via</div>
        <button type="button" onClick={handleGoogle} disabled={loading} className="auth-btn-social">
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          MOUNT_VIA_GOOGLE
        </button>
        <button type="button" onClick={handleGithub} disabled={loading} className="auth-btn-social">
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          MOUNT_VIA_GITHUB
        </button>
      </div>

      {/* Register link */}
      <p className="auth-footer-text">
        No node cluster?{' '}
        <Link to="/register">[INIT_REGISTRATION]</Link>
      </p>
    </AuthTerminalLayout>
  );
}
