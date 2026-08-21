'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { baseApiUrl } from '../../api/axios';

export default function LoginPromptModal({
  isOpen,
  onClose,
  actionType = 'download',
  onLoginSuccess
}) {
  const { user, login, refreshUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({ email: '', password: '' });
    }
  }, [isOpen]);

  // If user becomes authenticated while modal is open, auto-close and resume action
  useEffect(() => {
    if (isOpen && user) {
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [user, isOpen, onClose, onLoginSuccess]);

  if (!isOpen) return null;

  const handleGoogle = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('cpa_post_login_redirect', currentPath);
      sessionStorage.setItem('cpa_pending_action', actionType);
      window.location.href = `${baseApiUrl}/auth/google?origin=${encodeURIComponent(window.location.origin)}`;
    }
  };

  const handleGithub = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('cpa_post_login_redirect', currentPath);
      sessionStorage.setItem('cpa_pending_action', actionType);
      window.location.href = `${baseApiUrl}/auth/github?origin=${encodeURIComponent(window.location.origin)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      if (login) {
        login(res.data);
      }
      await refreshUser();
      // Auth state update in context triggers useEffect above -> onClose() -> onLoginSuccess()
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
    <Modal open={isOpen} onClose={onClose} width={520}>
      <style>{`
        .modal-auth-panel {
          background: #0a0a0a;
          border: 1px solid rgba(110,0,255,0.25);
          border-top: 3px solid #6e00ff;
          box-shadow: 0 0 60px rgba(110,0,255,0.08), 0 20px 40px rgba(0,0,0,0.6);
          border-radius: 12px;
          overflow: hidden;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #e8edf2;
        }
        .modal-auth-titlebar {
          background: #111111;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .modal-auth-dots { display: flex; gap: 6px; align-items: center; }
        .modal-auth-dot { width: 10px; height: 10px; border-radius: 50%; }
        .modal-auth-dot-red { background: #ff5f57; }
        .modal-auth-dot-yellow { background: #febc2e; }
        .modal-auth-dot-green { background: #28c840; }
        .modal-auth-titlebar-name {
          font-size: 10px;
          color: #a1a1aa;
          letter-spacing: 0.08em;
        }
        .modal-auth-titlebar-pid {
          font-size: 9px;
          color: #71717a;
        }

        .modal-auth-body { padding: 24px 22px 20px; }
        .modal-auth-class-header { margin-bottom: 20px; }
        .modal-auth-class-header h1 {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .modal-kw-class { color: #d0bcff; }
        .modal-kw-name { color: #ffffff; }
        .modal-kw-brace { color: #9ca3af; }
        .modal-auth-desc { font-size: 12px; color: #a1a1aa; margin: 0; }

        .modal-auth-form { display: flex; flex-direction: column; gap: 16px; }
        .modal-auth-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-auth-label {
          font-size: 10px;
          font-weight: 700;
          color: #c084fc;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .modal-auth-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-auth-input-wrap {
          display: flex;
          align-items: center;
          background: #111111;
          border: none;
          border-bottom: 2px solid #374151;
          padding: 9px 12px;
          transition: border-color 0.2s;
          gap: 10px;
        }
        .modal-auth-input-wrap:focus-within { border-bottom-color: #6e00ff; }
        .modal-auth-prompt {
          color: #6e00ff;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          user-select: none;
        }
        .modal-auth-input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #e8edf2 !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          line-height: 1.4;
        }
        .modal-auth-input::placeholder { color: #71717a !important; }

        .modal-auth-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px 18px;
          background: #6e00ff;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 0 24px rgba(110,0,255,0.30);
          margin-top: 4px;
        }
        .modal-auth-btn-primary:hover {
          background: #7c10ff;
          box-shadow: 0 0 36px rgba(110,0,255,0.45);
        }
        .modal-auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .modal-auth-social { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
        .modal-auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #71717a;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 2px 0;
        }
        .modal-auth-divider::before,
        .modal-auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1f2937;
        }
        .modal-auth-btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: #111111;
          color: #a1a1aa;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid #1f2937;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .modal-auth-btn-social:hover {
          background: #18181b;
          border-color: #6e00ff;
          color: #ffffff;
        }

        .modal-auth-error {
          background: rgba(220,38,38,0.10);
          border-left: 3px solid #ef4444;
          color: #fca5a5;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border-radius: 0 4px 4px 0;
        }
        .modal-auth-footer-text {
          text-align: center;
          font-size: 11px;
          color: #71717a;
          margin-top: 14px;
        }
        .modal-auth-footer-text a {
          color: #a78bfa;
          text-decoration: none;
        }
        .modal-auth-footer-text a:hover { color: #c4b5fd; }
        .modal-auth-bypass {
          font-size: 10px;
          color: #71717a;
          text-decoration: none;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .modal-auth-bypass:hover { color: #a78bfa; }

        .modal-auth-syslog {
          background: #0d0d0d;
          border: 1px solid #1f2937;
          border-radius: 6px;
          padding: 10px 12px;
          margin-top: 16px;
        }
        .modal-auth-syslog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .modal-auth-syslog-title {
          font-size: 9px;
          color: #71717a;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .modal-syslog-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #16a34a;
          animation: blink 1.2s step-end infinite;
        }
        .modal-auth-syslog-version { font-size: 9px; color: #4b5563; }
        .modal-auth-log-line { display: flex; gap: 10px; font-size: 10px; line-height: 1.7; }
        .modal-log-time { color: #6e00ff; }
        .modal-log-text { color: #e8edf2; }
        .modal-log-dim { color: #71717a; }
        .modal-auth-close { color: #a1a1aa; font-size: 1.1rem; font-weight: 700; margin-top: 12px; }

        @keyframes blink { 50% { opacity: 0; } }
        .modal-cursor::after {
          content: '_';
          animation: blink 1s step-end infinite;
          color: #a855f7;
        }
      `}</style>

      <div className="modal-auth-panel">
        {/* Title Bar */}
        <div className="modal-auth-titlebar">
          <div className="modal-auth-dots">
            <div className="modal-auth-dot modal-auth-dot-red" />
            <div className="modal-auth-dot modal-auth-dot-yellow" />
            <div className="modal-auth-dot modal-auth-dot-green" />
            <span className="modal-auth-titlebar-name" style={{ marginLeft: 10 }}>
              PROTOCOL: IDENTITY_HANDSHAKE.EXE
            </span>
          </div>
          <span className="modal-auth-titlebar-pid">PID: 1024.SYS</span>
        </div>

        {/* Body */}
        <div className="modal-auth-body">
          <div className="modal-auth-class-header">
            <h1>
              <span className="modal-kw-class">class </span>
              <span className="modal-kw-name">Session </span>
              <span className="modal-kw-brace">{'{'}</span>
            </h1>
            <p className="modal-auth-desc">// Initialize secure session. Enter credentials or mount OAuth payload.</p>
          </div>

          <form className="modal-auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="modal-auth-field">
              <label className="modal-auth-label">Declaration_Email</label>
              <div className="modal-auth-input-wrap">
                <span className="modal-auth-prompt">&gt;</span>
                <input
                  required
                  type="email"
                  className="modal-auth-input"
                  placeholder="developer@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div className="modal-auth-field">
              <div className="modal-auth-label-row">
                <label className="modal-auth-label">Secure_Key</label>
                <a href="/forgot-password" className="modal-auth-bypass">[bypass]</a>
              </div>
              <div className="modal-auth-input-wrap">
                <span className="modal-auth-prompt">&gt;</span>
                <input
                  required
                  type="password"
                  className="modal-auth-input"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="modal-auth-error">{error}</div>
            )}

            {/* Handshake Submit Button */}
            <button type="submit" disabled={loading} className="modal-auth-btn-primary">
              <Terminal size={16} />
              {loading ? 'AUTHENTICATING...' : 'EXECUTE_HANDSHAKE'}
            </button>

            {/* Social OAuth */}
            <div className="modal-auth-social">
              <div className="modal-auth-divider">or mount via</div>
              <button type="button" onClick={handleGoogle} disabled={loading} className="modal-auth-btn-social">
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                MOUNT_VIA_GOOGLE
              </button>
              <button type="button" onClick={handleGithub} disabled={loading} className="modal-auth-btn-social">
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                MOUNT_VIA_GITHUB
              </button>
            </div>

            <p className="modal-auth-footer-text">
              No node cluster?{' '}
              <a href={`/register?next=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : ''}`}>[INIT_REGISTRATION]</a>
            </p>
          </form>

          {/* System Log */}
          <div style={{ marginTop: 20 }}>
            <div className="modal-auth-syslog">
              <div className="modal-auth-syslog-header">
                <span className="modal-auth-syslog-title">
                  <span className="modal-syslog-dot" />
                  System Log
                </span>
                <span className="modal-auth-syslog-version">v2.4.0-stable</span>
              </div>
              <div>
                <div className="modal-auth-log-line">
                  <span className="modal-log-time">[12:00:01]</span>
                  <span className="modal-log-text">WAITING_FOR_CREDENTIALS</span>
                </div>
                <div className="modal-auth-log-line">
                  <span className="modal-log-time">[12:00:03]</span>
                  <span className="modal-log-dim">Ready to establish secure handshake...</span>
                </div>
                <div className="modal-auth-log-line">
                  <span className="modal-log-time">[12:00:05]</span>
                  <span className="modal-log-text modal-cursor">AWAITING_INPUT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-auth-close">{'}'}</div>
        </div>
      </div>
    </Modal>
  );
}
